/*global L*/
import dbHelper from './dbhelper';
let markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchNeighborhoods().then(neighborhoods => {
    fillNeighborhoodsHTML(neighborhoods);
  });
  fetchCuisines().then(cuisines =>{
    fillCuisinesHTML(cuisines);
  });
  updateRestaurants();
  initMap(); // added
});
const endpoint = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}';
const attribution = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

const  favoriteStar =`<svg width="25" height="23" aria-hidden="true" data-prefix="fas" data-icon="star" class="svg-inline--fa fa-star fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
<path fill="#de0000" d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path>
</svg>`;

const SolidStar =`<svg width="25" height="23" aria-hidden="true" data-prefix="far" data-icon="star" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
<path fill="currentColor" d="M528.1 171.5L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6zM388.6 312.3l23.7 138.4L288 385.4l-124.3 65.3 23.7-138.4-100.6-98 139-20.2 62.2-126 62.2 126 139 20.2-100.6 98z"></path>
</svg>`;
/**
* Initialize leaflet map, called from HTML.
*/
const initMap = () => {
  //if(L === undefined) return;
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  /*eslint no-undef: "error"*/
  L.tileLayer(endpoint, {mapboxToken:'pk.eyJ1IjoiYWJvZGEiLCJhIjoiY2prY3oxYnhoMzB2cDNrbWV0bmcydW5qdiJ9.LTC-ZvmDbMhyD5aEM9OO_Q',maxZoom: 18,attribution:attribution,id:'mapbox.streets'}).addTo(self.newMap);

};

document.getElementById('neighborhoods-select').addEventListener('change', event => {
  event.preventDefault();
  updateRestaurants();
});

document.getElementById('cuisines-select').addEventListener('change', event => {
  event.preventDefault();
  updateRestaurants();
});
/**
 * Fetch all neighborhoods.
 */
const fetchNeighborhoods = () => {
  return dbHelper.fetchNeighborhoods().then(neighborhoods => neighborhoods);
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach((neighborhood) => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines
 */
const fetchCuisines = () => {
  return dbHelper.fetchCuisines().then(cuisines => cuisines);
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach((cuisine) => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};


/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  return dbHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood).then(result=> {
    resetRestaurants();
    fillRestaurantsHTML(result);
    lazyLoadImages(); // Start the images lazy loader.

  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = () => {
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';
  // clear markers
  clearMarkers(self.newMap);
};
const clearMarkers = (map) => {
  if(!map) return;
  markers.forEach(marker => {
    map.removeLayer(marker);
  });
  markers = [];
};
/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach((restaurant) => {
    ul.innerHTML += createRestaurantHTML(restaurant);
  });
  addMarkersToMap(restaurants);
};
/**
 * lazy loading images.
 */
function lazyLoadImages() {

  const images = document.querySelectorAll('.restaurant-img');

  // If we don't have support for intersection observer, loads the images immediately
  if (!('IntersectionObserver' in window)) {
    images.forEach(image => image.replaceWith(createImageHTML(image)));
    return;
  }

  // Function that will when the images are intersecting.
  function onIntersection(entries) {
    entries.forEach(entry => {
      // If the image is not intersecting return.
      if(!entry.isIntersecting) return;

      // Stop observing this image.
      observer.unobserve(entry.target);

      // Replace the image with the new Picture element unless it has no photo.
      if(typeof entry.target.dataset.src === 'undefined') return;
      entry.target.replaceWith(createImageHTML(entry.target));
    });
  }

  const observer = new IntersectionObserver(onIntersection, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  images.forEach(image => {
    observer.observe(image);
  });
}

/*
 * Create responsive image HTML.
 */
function createImageHTML(image) {
  const sizes = '(max-width: 650px) calc(100vw - 70px), 230px';
  const picture = document.createElement('picture');
  picture.innerHTML = `<source srcset="${image.dataset.srcset.replace(/\.jpg /g, '.webp ')}" sizes="${sizes}" alt="${image.alt}">` +
    `<source srcset="${image.dataset.srcset}" sizes="${sizes}" alt="${image.alt}">` +
    `<img class="restaurant-img" src="${image.dataset.src}" alt="${image.alt}">`;

  // Parse it before returning since this is expected to be an Element.
  return picture;
}
/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  // Create responsive and accessible image element
  const image = createImagePlaceholderHTML(dbHelper.imageUrlForRestaurant(restaurant), restaurant.name);
  const favButton = createFavoriteButtonHTML(restaurant);
  return `<li class="restaurants-list-item">
  <article>
    ${image}
    <h2 class="restaurant-name">${restaurant.name}</h2>
    <div class="address-wrap">
      <p class ="restaurant-neighborhood">${restaurant.neighborhood}</p>
      <p class="restaurant-address">${restaurant.address}</p>
      ${favButton}
    </div>
    <a class='restaurant-details'
    role = "button" href="${dbHelper.urlForRestaurant(restaurant)}">View Details</a>
  </article>
</li>`;
};
/**
 * Create Favorite Button HTML.
 */
const createFavoriteButtonHTML = (restaurant) => {
  if (restaurant.is_favorite != null && typeof (restaurant.is_favorite) == 'string') {
    restaurant.is_favorite = JSON.parse(restaurant.is_favorite);
  }
  let starSvg  = favoriteStar,ariaLabel = 'button to unmark favorite',clsName = 'red-heart';
  if (!restaurant.is_favorite) {
    starSvg  = SolidStar;
    ariaLabel = 'button to mark favorite';
    clsName = '';
  }
  return `<button id="${restaurant.id}" aria-label="${ariaLabel} ${restaurant.name}" aria-labelledby ="${restaurant.id}" onclick="toggleFavorite('${restaurant.id}')" class="restaurant-favorite ${clsName}">${starSvg}</button>`;
};
const toggleFavorite  = (restaurantId) => {
  const restaurant = document.getElementById(restaurantId);
  const is_favorite = restaurant.classList.contains('red-heart');
  dbHelper.updateFavorite(restaurantId,!is_favorite);toggleBtnFavorite(restaurant,!is_favorite);
  return false;
};
function toggleBtnFavorite(el, isFav) {
  if (isFav) {
    el.classList.add('red-heart');
    el.innerHTML = favoriteStar;
    el.setAttribute('aria-label', 'unmark favorite');
  } else {
    el.innerHTML =SolidStar;
    el.classList.remove('red-heart');
    el.setAttribute('aria-label', 'mark as favorite');
  }
}
/*
 * Create placeholder for images, the images will be lazy loaded with the info in the placeholder data-attributes.
 */
const createImagePlaceholderHTML = (imgUrl, alt) => {
  // If imgUrl is undefided(restaurant has no image) return a "no-photo" placeholder.
  if(imgUrl === '/img/undefined.jpg') return `<img class="restaurant-img" src="img/image_not_available.png" alt="${alt}" aria-hidden="true">`;

  const largeImage = imgUrl.replace('.', '_large.');
  const mediumImage = imgUrl.replace('.', '_medium.');
  const srcset = `${imgUrl} 800w, ${largeImage} 650w, ${mediumImage} 360w`;

  return `<img class="restaurant-img" src="/img/loading_image.svg" alt="${alt}" data-src="${imgUrl}" data-srcset="${srcset}" aria-hidden="true">`;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants) => {
  restaurants.forEach((restaurant) => {
    // Add marker to the map
    const marker = dbHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    markers.push(marker);
  });
};
window.toggleFavorite = toggleFavorite;

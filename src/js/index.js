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
  clearMarkers();
};
const clearMarkers = () => {
  for (let marker of markers) {
    marker.setMap(null);
  }

  markers = [];
};
/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach((restaurant) => {
    ul.append(createRestaurantHTML(restaurant));
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
  const li = document.createElement('li');
  li.className = 'restaurants-list-item';

  let image = document.createElement('img');
  image.className = 'restaurant-img';
  image.setAttribute('data-src', dbHelper.imageUrlForRestaurant(restaurant, 'thumb'));
  image.setAttribute('src', dbHelper.imageUrlForRestaurant(restaurant));
  image.alt = `Restaurant ${restaurant.name}`;
  li.append(image);

  const name = document.createElement('h2');
  name.className = 'restaurant-name';
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.className = 'restaurant-neighborhood';
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.className = 'restaurant-address';
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.className = 'restaurant-details';
  more.innerHTML = 'View Details';
  more.href = dbHelper.urlForRestaurant(restaurant);
  more.setAttribute('role', 'button');
  more.setAttribute('aria-labelledby', 'restaurant_' + restaurant.id);
  li.append(more);
  // Create responsive and accessible image element
  image = createImagePlaceholderHTML(dbHelper.imageUrlForRestaurant(restaurant), restaurant.name);
  return `<li class="restaurants-list-item">
  <article>
    ${image}
    <h2 class="restaurant-name">${restaurant.name}</h2>
    <div class="address-wrap">
      <p class ="restaurant-neighborhood">${restaurant.neighborhood}</p>
      <p class="restaurant-address">${restaurant.address}</p>
    </div>
    <a class='restaurant-details'
    role = "button" href="${dbHelper.urlForRestaurant(restaurant)}">View Details</a>
  </article>
</li>`;
};
/*
 * Create placeholder for images, the images will be lazy loaded with the info in the placeholder data-attributes.
 */
const createImagePlaceholderHTML = (imgUrl, alt) => {
  // If imgUrl is undefided(restaurant has no image) return a "no-photo" placeholder.
  if(imgUrl === '/img/undefined.jpg') return `<img class="restaurant-img" src="/style/no_photo.svg" alt="${alt}" aria-hidden="true">`;

  const largeImage = imgUrl.replace('.', '_large.');
  const mediumImage = imgUrl.replace('.', '_medium.');
  const srcset = `${imgUrl} 800w, ${largeImage} 650w, ${mediumImage} 360w`;

  return `<img class="restaurant-img" src="/style/loading_image.svg" alt="${alt}" data-src="${imgUrl}" data-srcset="${srcset}" aria-hidden="true">`;
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

/*global L*/
import dbHelper from './dbhelper';
let markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  initMap(); // added
  fetchNeighborhoods().then(neighborhoods => {
    fillNeighborhoodsHTML(neighborhoods);
  });

  fetchCuisines().then(cuisines =>{
    fillCuisinesHTML(cuisines);
  });
});
const endpoint = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}';
const attribution = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
/**
* Initialize leaflet map, called from HTML.
*/
const initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  /*eslint no-undef: "error"*/
  L.tileLayer(endpoint, {mapboxToken:'pk.eyJ1IjoiYWJvZGEiLCJhIjoiY2prY3oxYnhoMzB2cDNrbWV0bmcydW5qdiJ9.LTC-ZvmDbMhyD5aEM9OO_Q',maxZoom: 18,attribution:attribution,id:'mapbox.streets'}).addTo(self.newMap);
  updateRestaurants();
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
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.setAttribute('data-src', dbHelper.imageUrlForRestaurant(restaurant, 'thumb'));
  image.setAttribute('src', dbHelper.imageUrlForRestaurant(restaurant));
  image.alt = `Restaurant ${restaurant.name}`;
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = dbHelper.urlForRestaurant(restaurant);
  more.setAttribute('role', 'button');
  more.setAttribute('aria-labelledby', 'restaurant_' + restaurant.id);
  li.append(more);

  return li;
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

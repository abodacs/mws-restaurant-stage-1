/*global L*/
import localForage from 'localforage';

localForage.config({
  name: 'mw-restaurants',
  version: 1
});

/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  constructor(port = 1337) {
    this.port = port;
  }
  dataBaseUrls() {
    return {
      list: `http://localhost:${this.port}/restaurants`,
      byId: (id) => `http://localhost:${this.port}/restaurants/${id}`
    };
  }
  request(url, method = 'GET', headers={},body=null){
    const options = {
      method
    };
    if (headers) options.headers = headers;
    if (body) options.body = JSON.stringify(body);
    const response = fetch(url, options);
    if (options && options.method) {
      return response.json();
    }
    return response;
  }
  /**
   * Fetch all restaurants.
   */
  fetchRestaurants() {
    let DBurl = this.dataBaseUrls().list;
    return localForage.getItem('restaurants').then(value =>{
      if(value != null){
        return value;
      }else{
        return fetch(DBurl).then(response => {
          return localForage.setItem('restaurants', response.json()).then(responseJSON => responseJSON);
        });
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById(id) {
    let DBurl = this.dataBaseUrls().byId(id);
    return localForage.getItem('restaurants').then(restaurants =>{
      if(restaurants == null){
        return fetch(DBurl).then(response => response.json());
      }
      const restaurant = restaurants.find(e => e.id === parseInt(id));
      if(restaurant){
        return restaurant;
      }else{
        return fetch(DBurl).then(response => response.json());
      }
    });
  }
  /**
  * Update the favorite restaurant.
  */
  updateFavorite(restaurantId, isFav) {
    let restaurant;
    let DBurl = this.dataBaseUrls().byId(restaurantId);
    try{
      restaurant = this.request(DBurl,'PUT');
      DBurl += '/?is_favorite=' + isFav;
      if (!restaurant) return; // CORS Prefetch OPTIONS skip
    } catch (error)
    {
      console.error(error);
    }
    //fetchRestaurantById(restaurantId)
  }
  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return this.fetchRestaurants().then(restaurants => restaurants.filter(restaurant => restaurant.cuisine_type === cuisine));
  }
  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  fetchRestaurantByNeighborhood(neighborhood) {

    // Fetch all restaurants
    return this.fetchRestaurants().then(restaurants => restaurants.filter(restaurant => restaurant.neighborhood === neighborhood));
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return this.fetchRestaurants().then(restaurants => {
      let results = restaurants;
      if (cuisine !== 'all') { // filter by cuisine
        results = results.filter(r => r.cuisine_type === cuisine);
      }

      if (neighborhood !== 'all') { // filter by neighborhood
        results = results.filter(r => r.neighborhood === neighborhood);
      }

      return results;
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  fetchNeighborhoods() {
    // Fetch all restaurants
    return this.fetchRestaurants().then(restaurants => {
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
      return neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  fetchCuisines() {
    // Fetch all restaurants
    return this.fetchRestaurants().then(restaurants => {
      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
      // Remove duplicates from cuisines
      return cuisines.filter((v, i) => cuisines.indexOf(v) === i);
    });
  }

  /**
   * Restaurant page URL.
   */
  urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  imageUrlForRestaurant(restaurant, type) {
    return (type) ? (`/img/thumbs/${restaurant.id}-248.jpg`) : (`/img/${restaurant.id}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  mapMarkerForRestaurant(restaurant, map) {
    let marker = L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
        bounceOnAdd: true,
        bounceOnAddOptions: {duration: 500, height: 100},
      }).addTo(map);
    marker.bindPopup(`<a href="${this.urlForRestaurant(restaurant)}">${restaurant.name}</a>`);
    return marker;
  }

}
window.addEventListener('online',(event)=>{
  event.preventDefault();
  displayToast(event.type);
});
window.addEventListener('offline',(event)=>{
  event.preventDefault();
  displayToast(event.type);
});
const  displayToast = (type) =>{
  var message ='<span>Unable to connect. Retrying…</span>',isVisible ='none';
  if(type==='online') {
    isVisible ='none';
  } else {
    isVisible ='block';
  }
  var toast = document.querySelector('#toast');
  toast.innerHTML = message;
  toast.style.display =isVisible;
};
export default new DBHelper();

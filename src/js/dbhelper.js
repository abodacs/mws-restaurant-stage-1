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
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return this.fetchRestaurants().then(restaurants => restaurants.filter(restaurant => restaurant.cuisine_type === cuisine));
  }
  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
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
    return (type) ? (`/img/thumbs/${restaurant.id}-248.jpg`) : (`/img/${restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  mapMarkerForRestaurant(restaurant, map) {
    const marker = L.marker([restaurant.latlng],
      {title: restaurant.name}).addTo(map);
    /*const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: this.urlForRestaurant(restaurant),
      map,
      animation: google.maps.Animation.DROP,
    });*/
    return marker;
  }
}
export default new DBHelper();

/*global L*/
import idb from 'idb';
const DATABASE = 'mwdb';
const RESTAURANTS_STORE = 'mw_restaurants';
const REVIEWS_STORE = 'mw_reviews';

const getStore = (storeName, mode) =>
  (dbService) =>
    dbService.then(function(db) {
      let tx = db.transaction(storeName, mode);
      let store = tx.objectStore(storeName);
      return store;
    });



const idbKeyval = {
  get(storeName,key) {
    return DBHelper.dbPromise().then(db => {
      return db.transaction(storeName)
        .objectStore(storeName).index('by-id').get(key);
    });
  },
  set(storeName,key,val) {
    return DBHelper.dbPromise().then(db => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(val);
      return tx.complete;
    });
  },
  delete(storeName,key) {
    return DBHelper.dbPromise().then(db => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      return tx.complete;
    });
  },
  clear(storeName) {
    return DBHelper.dbPromise().then(db => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      return tx.complete;
    });
  },
  keys(storeName) {
    return DBHelper.dbPromise().then(db => {
      const tx = db.transaction(storeName);
      const keys = [];
      const store = tx.objectStore(storeName);
      (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
        if (!cursor) return;
        keys.push(cursor.key);
        cursor.continue();
      });

      return tx.complete.then(() => keys);
    });
  },
  getAll(storeName) {
    return DBHelper.dbPromise().then(db => {
      const storeIndex = db.transaction(storeName).objectStore(storeName).index('by-id');
      return storeIndex.getAll();
    }).then((data) => data);
  }
};
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
  static dbPromise() {
    return idb.open(DATABASE, 1, function (upgradeDb) {
      if (!upgradeDb.objectStoreNames.contains(RESTAURANTS_STORE)) {
        var store = upgradeDb.createObjectStore(RESTAURANTS_STORE, {
          keyPath: 'id'
        });
        store.createIndex('by-id', 'id');
      }
      if (!upgradeDb.objectStoreNames.contains(REVIEWS_STORE)) {
        var reviews = upgradeDb.createObjectStore(REVIEWS_STORE, {
          keyPath: 'id'
        });
        reviews.createIndex('by-id', 'id');
      }
    });
  }
  /**
   * Create indexedDB and add the items from the server
   */
  static addIndexedDb(type, items) {
    DBHelper.dbPromise().then(function(db) {
      let tx = db.transaction(type, 'readwrite');
      let store = tx.objectStore(type);
      items.forEach((item) => store.put(item));
      return tx.complete.then(() => Promise.resolve(items));
    });

  }
  // Get stored object by Id.
  static getStoredObjectById(dbService, storename, id)  {
    const store = getStore(storename)(dbService);
    return store.get(id);
  }
  /**
   * Fetch all restaurants.
   */
  fetchRestaurants() {
    let DBurl = this.dataBaseUrls().list;
    return idbKeyval.getAll(RESTAURANTS_STORE).then(data => {
      if(data != null && data && data.length > 0){
        return data;
      }else{
        return fetch(DBurl).then(function(response) {
          return response.json();
        }).then(data => {
          /* eslint-disable no-console */
          console.log(data);
          /* eslint-enable no-console */
          const restaurants = data;
          DBHelper.addIndexedDb(RESTAURANTS_STORE, restaurants);
          return restaurants;
        });
      }
    }).then(responseJSON => responseJSON);
  }

  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById(id) {
    return idbKeyval.get(RESTAURANTS_STORE,Number(id)).then(restaurant => {
      if(restaurant){
        let DBurl = this.dataBaseUrls().byId(id);
        restaurant = fetch(DBurl).then(response => response.json());
      }
      return restaurant;

    });
  }
  /**
  * Update the favorite restaurant.
  */
  updateFavorite(restaurantId, isFav) {
    let DBurl = this.dataBaseUrls().byId(restaurantId);
    DBurl += '/?is_favorite=' + isFav;
    fetch(DBurl,{ method : 'PUT'}).then(() => {
      idbKeyval.get(RESTAURANTS_STORE,Number(restaurantId)).then(restaurant => {
        if(restaurant){
          restaurant.is_favorite = isFav;
          idbKeyval.set(RESTAURANTS_STORE,Number(restaurantId),restaurant);
        }
      });
    }).catch (() =>  {
      idbKeyval.get(RESTAURANTS_STORE,Number(restaurantId)).then(restaurant => {
        if(restaurant){
          restaurant.synced = 0;
          restaurant.is_favorite = isFav;
          idbKeyval.set(RESTAURANTS_STORE,Number(restaurantId),restaurant);
        }
      });
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

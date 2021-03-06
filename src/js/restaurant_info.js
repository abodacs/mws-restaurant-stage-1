
/*global L*/
import dbHelper from './dbhelper';

const endpoint = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}';
const attribution = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
document.addEventListener('DOMContentLoaded', () => {
  window.initMap(); // added
});
/**
 * Initialize map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL()
    .then(restaurant => {
      fillBreadcrumb(restaurant);
      //if(L === undefined) return;
      self.newMap = L.map('map', {
        center:  [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      /*eslint no-undef: "error"*/
      L.tileLayer(endpoint, {mapboxToken:'pk.eyJ1IjoiYWJvZGEiLCJhIjoiY2prY3oxYnhoMzB2cDNrbWV0bmcydW5qdiJ9.LTC-ZvmDbMhyD5aEM9OO_Q',maxZoom: 18,attribution:attribution,id:'mapbox.streets'}).addTo(self.newMap);

      dbHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    }).catch(err => console.error(err));
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (restaurant) => {
  if (restaurant) { // restaurant already fetched!
    return Promise.resolve(restaurant);
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL';
    return Promise.reject(error);
  } else {
    return dbHelper.fetchRestaurantById(id)
      .then(restaurant => {
        fillRestaurantHTML(restaurant);
        return restaurant;
      })
      .catch(err => console.error(err));
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = dbHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Restaurant ${restaurant.name}`;
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML(restaurant.operating_hours);
  }
  // Fill reviews.
  dbHelper.fetchReviewsByRestId(restaurant.id).then(reviews => {
    fillReviewsHTML(reviews);
  });
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours) => {
  const hours = document.getElementById('restaurant-hours');
  for (const key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h4');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  if (!Array.isArray(reviews)) {
    reviews = [reviews];
  }
  reviews.forEach((review) => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  if (!navigator.onLine) {
    const connection_status = document.createElement('p');
    connection_status.classList.add('offline_label');
    connection_status.innerHTML = 'Offline';
    li.classList.add('reviews_offline');
    li.appendChild(connection_status);
  }

  const name = document.createElement('p');
  name.className = 'reviewer';
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.className = 'review-date';
  date.innerHTML = `Date: ${new Date(review.createdAt).toLocaleString()}`;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review-rating';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'review-comment';
  li.appendChild(comments);

  return li;
};
  // Review form validation and submission.
const addReview = () => {
  event.preventDefault();
  // Get the review data from the form.
  let restaurantId = getParameterByName('id');
  let name = document.getElementById('review-author').value;
  let rating;
  let comments = document.getElementById('review-comments').value;
  rating = document.querySelector('#rating_select option:checked').value;
  const review = [name, rating, comments, restaurantId];

  if(checkEmptyFields(review)){
    // Add the review data to the DOM.
    const frontEndReview = {
      restaurant_id: parseInt(review[3]),
      rating: parseInt(review[1]),
      name: review[0],
      comments: review[2].substring(0, 300),
      createdAt: new Date(),
    };
    // Send the review to the backend.
    dbHelper.addReview(frontEndReview);
    addReviewHTML(frontEndReview);
    document.getElementById('review-form').reset();

  }
};
const checkEmptyFields=(formInputs)=>{
  let valid = true;
  const  message_container= document.querySelector('#form-error');
  message_container.innerHTML='';
  if(formInputs[0] ==='' || (formInputs[1] <1 || formInputs[1] >5 || formInputs[1] ==='') || formInputs[2] ==='')
  {

    valid = false;
    message_container.innerHTML='Please fill above empty field !';
    message_container.setAttribute('role','alert');
    message_container.setAttribute('aria-live','assertive');
  }
  message_container.classList.toggle('hidden' , valid );
  return valid;
};
// Add the review to the UI.
const addReviewHTML = (review) => {
  if (document.getElementById('no-review')) {
    document.getElementById('no-review').remove();
  }
  const container = document.getElementById('reviews-container');
  const ul = document.getElementById('reviews-list');
  // Insert the new review on the top.
  ul.insertBefore(createReviewHTML(review), ul.firstChild);
  container.appendChild(ul);
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
window.addReview = addReview;

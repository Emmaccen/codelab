// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

var rsvpListener = null;
var guestbookListener = null;

// Add Firebase project configuration object here
var firebaseConfig = {
  apiKey: "AIzaSyAQP-ZP3wEyMZrXB9uKediIaqV47_TKJCE",
    authDomain: "fir-web-codelab-ca4c7.firebaseapp.com",
    databaseURL: "https://fir-web-codelab-ca4c7.firebaseio.com",
    projectId: "fir-web-codelab-ca4c7",
    storageBucket: "fir-web-codelab-ca4c7.appspot.com",
    messagingSenderId: "273668772906",
    appId: "1:273668772906:web:25da0facdba702e97edf53"
};

firebase.initializeApp(firebaseConfig);

// FirebaseUI config
const uiConfig = {
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  signInOptions: [
    // Email / Password Provider.
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl){
      // Handle sign-in.
      // Return false to avoid redirect.
      return false;
    }
  }
};

const ui = new firebaseui.auth.AuthUI(firebase.auth());
// Listen to RSVP button clicks
startRsvpButton.addEventListener("click",
 () => {
      ui.start("#firebaseui-auth-container", uiConfig);
});

// Listen to the current Auth state
firebase.auth().onAuthStateChanged((user)=> {
  if (user) {
    startRsvpButton.textContent = "LOGOUT"
    // Show guestbook to logged-in users
   guestbookContainer.style.display = "block";
  }
  else {
    startRsvpButton.textContent = "RSVP"
    // Hide guestbook for non-logged-in users
   guestbookContainer.style.display = "none";
  }
});

// Called when the user clicks the RSVP button
startRsvpButton.addEventListener("click",
 () => {
    if (firebase.auth().currentUser) {
      // User is signed in; allows user to sign out
      firebase.auth().signOut();
    } else {
      // No user is signed in; allows user to sign in
      ui.start("#firebaseui-auth-container", uiConfig);
    }
});

// Listen to the form submission
form.addEventListener("submit", (e) => {
 // Prevent the default form redirect
 e.preventDefault();
 // Write a new message to the database collection "guestbook"
 if(input.value != ''){
   firebase.firestore().collection("guestbook").add({
   text: input.value,
   timestamp: Date.now(),
   name: firebase.auth().currentUser.displayName,
   userId: firebase.auth().currentUser.uid
 })
 }else {
  //do nothing... :)
 }

 // clear message input field
 input.value = ""; 
 // Return false to avoid redirect
 return false;
});

// Listen to guestbook updates
function subscribeGuestbook(){
   // Create query for messages
 guestbookListener = firebase.firestore().collection("guestbook")
 .orderBy("timestamp","desc")
 .onSnapshot((snaps) => {
   // Reset page
   guestbook.innerHTML = "";
   // Loop through documents in database
   snaps.forEach((doc) => {
     // Create an HTML entry for each document and add it to the chat
     const entry = document.createElement("p");
     entry.textContent = doc.data().name + ": " + doc.data().text;
     guestbook.appendChild(entry);
   });
 });
};

// Unsubscribe from guestbook updates
function unsubscribeGuestbook(){
 if (guestbookListener != null)
 {
   guestbookListener();
   guestbookListener = null;
 }
}


firebase.auth().onAuthStateChanged((user) => {
if (user){
  startRsvpButton.textContent = "LOGOUT";
  // Show guestbook to logged-in users
  guestbookContainer.style.display = "block";

  // Subscribe to the guestbook collection
  subscribeGuestbook();
   // Subscribe to the guestbook collection
  subscribeCurrentRSVP(user);
}
else{
  startRsvpButton.textContent = "RSVP";
  // Hide guestbook for non-logged-in users
  guestbookContainer.style.display = "none";

  // Unsubscribe from the guestbook collection
  unsubscribeGuestbook();
  // Unsubscribe from the guestbook collection
  unsubscribeCurrentRSVP();
}
});


// Listen to RSVP responses
rsvpYes.onclick = () => {
 // Get a reference to the user's document in the attendees collection
 const userDoc = firebase.firestore().collection('attendees').doc(firebase.auth().currentUser.uid);

 // If they RSVP'd yes, save a document with attending: true
 userDoc.set({
   attending: true
 }).catch(console.error)
}

rsvpNo.onclick = () => {
 // Get a reference to the user's document in the attendees collection
 const userDoc = firebase.firestore().collection('attendees').doc(firebase.auth().currentUser.uid);

 // If they RSVP'd no, save a document with attending: false
 userDoc.set({
   attending: false
 }).catch(console.error)
}

// Listen for attendee list
firebase.firestore()
.collection('attendees')
.where("attending", "==", true)
.onSnapshot(snap => {
 const newAttendeeCount = snap.docs.length;

 numberAttending.innerHTML = `We Have ${newAttendeeCount} Member(s)`; 
})

// Listen for attendee list
function subscribeCurrentRSVP(user){
 rsvpListener = firebase.firestore()
 .collection('attendees')
 .doc(user.uid)
 .onSnapshot((doc) => {
   if (doc && doc.data()){
     const attendingResponse = doc.data().attending;

     // Update css classes for buttons
     if (attendingResponse){
       rsvpYes.className="clicked";
       rsvpNo.className="";
     }
     else{
       rsvpYes.className="";
       rsvpNo.className="clicked";
     }
   }
 });
}

function unsubscribeCurrentRSVP(){
 if (rsvpListener != null)
 {
   rsvpListener();
   rsvpListener = null;
 }
 rsvpYes.className="";
 rsvpNo.className="";
}
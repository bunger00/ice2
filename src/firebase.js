import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Din Firebase-konfigurasjon
const firebaseConfig = {
  apiKey: "AIzaSyCro9RNjXYTPEp5iYecCuIeKk8VgAyyS8g",
  authDomain: "ice-meeting.firebaseapp.com",
  projectId: "ice-meeting",
  storageBucket: "ice-meeting.firebasestorage.app",
  messagingSenderId: "922747891625",
  appId: "1:922747891625:web:612588d32778c9ebd75eb8",
  measurementId: "G-V8LM51508T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('Persistence failed');
    } else if (err.code == 'unimplemented') {
      console.log('Persistence is not available');
    }
  });

// Test auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Bruker pålogget:', user.uid);
  } else {
    console.log('Ingen bruker er pålogget');
  }
});

console.log('Firebase initialized successfully');

export { auth, db };

// Fjern analytics midlertidig
// import { getAnalytics } from "firebase/analytics";
// export const analytics = getAnalytics(app); 
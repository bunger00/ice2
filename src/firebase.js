import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, collection, getDocs } from 'firebase/firestore';

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

// Test Firestore connection
async function testFirestore() {
  try {
    console.log('Testing Firestore tilkobling...');
    const testCollection = collection(db, 'moter');
    const snapshot = await getDocs(testCollection);
    console.log('Firestore tilkobling vellykket. Fant', snapshot.size, 'dokumenter');
    return true;
  } catch (error) {
    console.error('Firestore tilkoblingsfeil:', error);
    return false;
  }
}

// Test connection immediately
testFirestore().then(success => {
  if (success) {
    console.log('Firestore er klar til bruk');
  } else {
    console.log('Kunne ikke koble til Firestore');
  }
});

// Test auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Bruker pålogget:', user.uid);
    console.log('Bruker email:', user.email);
  } else {
    console.log('Ingen bruker er pålogget');
  }
});

console.log('Firebase initialized successfully');

export { auth, db };

// Fjern analytics midlertidig
// import { getAnalytics } from "firebase/analytics";
// export const analytics = getAnalytics(app); 
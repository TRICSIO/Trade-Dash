// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "trade-insights-eyfxd",
  "appId": "1:286989921531:web:73ff856047a4be515b545e",
  "storageBucket": "trade-insights-eyfxd.firebasestorage.app",
  "apiKey": "AIzaSyB_c1tZGOxAB7biUtPv4JApbS4ahhIhn3E",
  "authDomain": "trade-insights-eyfxd.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "286989921531"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

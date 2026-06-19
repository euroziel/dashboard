// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAtJqaOGJJkeflv5o6B9ps8brp9NAsf_Jg",
  authDomain: "euroziel-b17b4.firebaseapp.com",
  projectId: "euroziel-b17b4",
  storageBucket: "euroziel-b17b4.firebasestorage.app",
  messagingSenderId: "1018047278959",
  appId: "1:1018047278959:web:3a64760882fbae8553429a",
  measurementId: "G-PZ4R97246C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
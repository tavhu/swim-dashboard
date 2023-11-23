// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC03m7NVS1b6sn34c5F5towm5zkgriJ1uQ",
  authDomain: "swim-dab91.firebaseapp.com",
  projectId: "swim-dab91",
  storageBucket: "swim-dab91.appspot.com",
  messagingSenderId: "513988154037",
  appId: "1:513988154037:web:a5a73acbfb449cf555a4fc",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const firebaseDB = getFirestore(app);

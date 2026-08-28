import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCwxDn05-8Y8tg8ZHjf2fiAkojwlZfB7eY",
  authDomain: "viagem-d79da.firebaseapp.com",
  projectId: "viagem-d79da",
  storageBucket: "viagem-d79da.firebasestorage.app",
  messagingSenderId: "119484024135",
  appId: "1:119484024135:web:efc65d8d3c151b8945b862",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc 
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyD2RGw1ZG9A1j6etsZvFlni_XkEJ0iNkJY",
  authDomain: "flew-a31e0.firebaseapp.com",
  projectId: "flew-a31e0",
  storageBucket: "flew-a31e0.firebasestorage.app",
  messagingSenderId: "674513470504",
  appId: "1:674513470504:web:b93c944b4c8b0ec6a4211d",
  measurementId: "G-LB6S3TG9HY"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

export { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc 
};

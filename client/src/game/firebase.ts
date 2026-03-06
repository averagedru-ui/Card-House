import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC2rETJ_3zSiAi7if3Q7dATfqlXo_IMqj8",
  authDomain: "itsadeal-b2716.firebaseapp.com",
  projectId: "itsadeal-b2716",
  storageBucket: "itsadeal-b2716.firebasestorage.app",
  messagingSenderId: "728430696493",
  appId: "1:728430696493:web:3d28e1050b32a939dc00a4",
  databaseURL: "https://itsadeal-b2716-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyD_Vka9-HTRbGrdc_ucrCnWGNxN7n32SJ4",
  authDomain: "duitu-cf0e7.firebaseapp.com",
  projectId: "duitu-cf0e7",
  storageBucket: "duitu-cf0e7.firebasestorage.app",
  messagingSenderId: "157329778221",
  appId: "1:157329778221:web:93d135d196475b1845faa4",
  measurementId: "G-YG3YHL2SGJ"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

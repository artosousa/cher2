
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { toast } from 'sonner';

// Your web app's Firebase configuration with hardcoded values
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log for debugging - remove in production
console.log('Firebase Config (without sensitive info):', { 
  apiKeyProvided: !!firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Validate config before initializing
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase configuration error: Missing required configuration values.');
  throw new Error('Firebase configuration error: Check your Firebase configuration values.');
}

let app, db, auth, googleProvider;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  console.log('Firebase initialized successfully');
  
  // Enable offline persistence where possible
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firebase persistence failed to enable. Multiple tabs might be open.');
      } else if (err.code === 'unimplemented') {
        console.warn('Browser doesn\'t support IndexedDB persistence.');
      }
    });
  } catch (error) {
    console.warn('Error enabling Firebase offline persistence:', error);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  toast.error('Failed to connect to the database. Please try again later.');
  throw new Error('Failed to initialize Firebase. Please check your configuration.');
}

export { db, auth, googleProvider };

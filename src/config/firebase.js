// src/config/firebase.js
const admin = require('firebase-admin');

let firebaseApp = null;

function initializeFirebase() {
  try {
    // Cek apakah credentials sudah diisi
    if (!process.env.FCM_PROJECT_ID || 
        process.env.FCM_PROJECT_ID === 'planner-app-9db90' ||
        !process.env.FCM_PRIVATE_KEY ||
        !process.env.FCM_CLIENT_EMAIL) {
      console.warn('⚠️  Firebase credentials not configured.');
      console.warn('   Push notifications will be disabled.');
      console.warn('   1. Go to Firebase Console > Project Settings > Service Accounts');
      console.warn('   2. Generate new private key');
      console.warn('   3. Copy values to .env file');
      return null;
    }

    // Format private key dengan benar
    let privateKey = process.env.FCM_PRIVATE_KEY;
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Make sure private key has proper format
    if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    }

    const serviceAccount = {
      projectId: process.env.FCM_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FCM_CLIENT_EMAIL,
    };

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FCM_PROJECT_ID,
    }, 'pixel-task-quest'); // Named app biar bisa multiple instances

    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`   Project: ${process.env.FCM_PROJECT_ID}`);
    
    // Test connection
    admin.messaging().app;
    
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.error('   Check your FCM credentials in .env file');
    return null;
  }
}

// Initialize on import
const app = initializeFirebase();

module.exports = app ? admin : null;
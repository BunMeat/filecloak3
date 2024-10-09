require('dotenv').config();
const express = require('express');
const router = express.Router();
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');
const CryptoJS = require('crypto-js');

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASEKEY,
  authDomain: process.env.FIREBASEAUTHDOMAIN,
  projectId: process.env.PROJECTID,
  storageBucket: process.env.STORAGEBUCKET,
  messagingSenderId: process.env.MESSAGINGSENDERID,
  appId: process.env.APPID,
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Encrypt function
function encrypt(text, key) {
  const encryptKey = CryptoJS.enc.Utf8.parse(key);
  const encryptIV = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(text, encryptKey, { iv: encryptIV }).toString();
  return encrypted + ':' + encryptIV.toString(CryptoJS.enc.Base64);
}

// Route to handle text encryption
router.post('/', async (req, res) => {
  const { text, key } = req.body;

  if (!text || !key) {
    return res.status(400).json({ error: 'Text and key are required' });
  }

  try {
    const encryptedText = encrypt(text, key);
    res.status(200).json({ encryptedText });
  } catch (error) {
    console.error('Encryption failed', error);
    res.status(500).json({ error: 'Encryption failed' });
  }
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const JSZip = require('jszip');
const CryptoJS = require('crypto-js');

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Multer setup for handling file uploads
const upload = multer();

// Encrypt function
function encrypt(text, key) {
  const encryptKey = CryptoJS.enc.Utf8.parse(key);
  const encryptIV = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(text, encryptKey, { iv: encryptIV }).toString();
  return encrypted + ':' + encryptIV.toString(CryptoJS.enc.Base64);
}

// Convert to WIB timezone function
function convertToWIB(isoString) {
  const date = new Date(isoString);
  const WIB_OFFSET = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
  const wibDate = new Date(date.getTime() + WIB_OFFSET);
  return wibDate.toISOString().replace('Z', '+07:00');
}

// Store metadata in Firestore
async function storeMetadataInFirestore(userId, encryptedLink, encryptedNote) {
  try {
    const time = new Date().toISOString();
    const convertedTime = convertToWIB(time);
    const userCollection = collection(firestore, "users");
    const userRefDoc = doc(userCollection, userId);
    const filesSubCollection = collection(userRefDoc, "files");
    const filesSubRefDoc = doc(filesSubCollection, convertedTime);

    const encryptedFilesCollection = collection(firestore, "encryptedFiles");
    const encryptedFilesRefDoc = doc(encryptedFilesCollection, convertedTime);

    await setDoc(filesSubRefDoc, { encryptedLink });
    await setDoc(encryptedFilesRefDoc, { encryptedLink, encryptedNote });
  } catch (error) {
    throw new Error('Error storing metadata in Firestore: ' + error.message);
  }
}

// Handle file upload and encryption
router.post('/', upload.array('files'), async (req, res) => {
  try {
    console.log("1");
    const files = req.files;
    const { key, note, zipFiles } = req.body;
    const userId = req.headers['x-user-id'];
    const encryptedLinks = [];
    const zip = new JSZip();

    if (!files || !key) {
      console.log("2");
      return res.status(400).json({ message: 'No files or encryption key provided.' });
    }

    // Process file(s)
    if (zipFiles === 'true') {
      console.log("3");
      for (const file of files) {
        zip.file(file.originalname, file.buffer);
      }
      console.log("4");
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipName = 'encryptedFiles.zip';
      const storageRef = ref(storage, `files/${userId}/${zipName}`);
      await uploadBytes(storageRef, zipBlob);

      const downloadLink = await getDownloadURL(storageRef);
      const encryptedLink = encrypt(downloadLink, key);
      encryptedLinks.push(encryptedLink);
    } else {
      console.log("5");
      for (const file of files) {
        const storageRef = ref(storage, `files/${userId}/${file.originalname}`);
        await uploadBytes(storageRef, file.buffer);

        const downloadLink = await getDownloadURL(storageRef);
        const encryptedLink = encrypt(downloadLink, key);
        encryptedLinks.push(encryptedLink);
      }
      console.log("6");
    }

    console.log("7");

    // Encrypt the note
    const encryptedNote = encrypt(note, key);
    console.log("8");

    // Store metadata in Firestore
    await storeMetadataInFirestore(userId, encryptedLinks[0], encryptedNote);
    console.log("9");

    res.status(200).json({ message: 'Files encrypted successfully.', encryptedLinks });
  } catch (error) {
    console.log("10");
    console.error('Error during encryption process:', error);
    res.status(500).json({ message: 'An error occurred during the encryption process.' });
  }
});

module.exports = router;
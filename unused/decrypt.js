require('dotenv').config();
const express = require('express');
const router = express.Router();
const { initializeApp } = require('firebase/app');
const { getAuth, verifyIdToken } = require('firebase/auth');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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

// Initialize Firebase services
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

// Decrypt function
function decrypt(encryptedText, key) {
  const encryptKey = CryptoJS.enc.Utf8.parse(key);
  const ivString = encryptedText.slice(-24);  // Extract the IV from the encryptedText
  const encryptIV = CryptoJS.enc.Base64.parse(ivString);
  encryptedText = encryptedText.slice(0, -24); // Remove IV part from encryptedText

  const decrypted = CryptoJS.AES.decrypt(
    encryptedText,
    encryptKey,
    { iv: encryptIV }
  );

  const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
  return decryptedData;
}

// Route to handle decryption requests
router.post('/', async (req, res) => {
  const { encryptET, keyET } = req.body;

  if (!encryptET || !keyET) {
    return res.status(400).json({ message: 'Missing encryption token or key.' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized. No token provided.' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);
    const userId = decodedToken.uid; // Get user ID from the decoded token

    // Now you can proceed with your Firestore logic
    const encryptedFilesCollection = collection(firestore, "encryptedFiles");

    // Retrieve all documents in the "encryptedFiles" collection
    const querySnapshot = await getDocs(encryptedFilesCollection);
    let foundFile = null;

    querySnapshot.forEach((doc) => {
      // Find the document with an encryption token matching the input
      if (doc.data().encryptUrl === encryptET) {
        foundFile = doc.data();
      }
    });

    if (foundFile) {
      // Decrypt the note using the provided key
      const encryptedNote = foundFile.encryptNote;
      const decryptedNoteText = decrypt(encryptedNote, keyET);
      return res.status(200).json({
        decryptedNote: decryptedNoteText,
        decryptedURL: foundFile.decryptUrl || null,
      });
    } else {
      // If no file matches the token, try decrypting the input directly
      const decryptedNoteText = decrypt(encryptET, keyET);
      return res.status(200).json({
        decryptedNote: decryptedNoteText,
        decryptedURL: null,
      });
    }
  } catch (error) {
    console.error('Error retrieving note from Firestore:', error);
    return res.status(500).json({ message: 'Error retrieving note: ' + error.message });
  }
});
module.exports = router;

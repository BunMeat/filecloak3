import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth'; // Importing Firebase Auth for logout
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Import Firestore
import FileCloak from '../FileCloak.webp';
import './AdminPageDecrypt.css';

function AdminPageDecrypt() {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  // States to store the inputs and decrypted data
  const [keyInput, setKeyInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [decryptedURL, setDecryptedURL] = useState(''); // Store decrypted URL
  const [decryptedNote, setDecryptedNote] = useState(''); // Store decrypted Note
  const [loading, setLoading] = useState(false); // State to manage loading
  const [isAdmin, setIsAdmin] = useState(false); // State to check if the user is an admin

  // Check user role when the component mounts
  useEffect(() => {
    const checkUserRole = async () => {
      const user = auth.currentUser;

      if (user) {
        const userDocRef = doc(db, 'users', user.email); // Assuming user documents are named by email
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.role === 'admin'); // Set isAdmin based on role
        } else {
          alert('User document not found.');
          navigate('/login'); // Redirect to login if user document doesn't exist
        }
      } else {
        navigate('/login'); // Redirect to login if no user is signed in
      }
    };

    checkUserRole();
  }, [auth, db, navigate]);

  // Handle form submission to call the backend decrypt route
  const handleDecrypt = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state

    try {
      const response = await fetch('http://localhost:4000/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyInput: keyInput.trim(),
          tokenInput: tokenInput.trim(),
        }),
      });

      const data = await response.json();
      setLoading(false); // Reset loading state

      if (response.ok) {
        // Use state setters to update decryptedURL and decryptedNote
        setDecryptedURL(data.decryptedURL || '');
        setDecryptedNote(data.decryptedNote || '');

        if (data.decryptedURL && data.decryptedNote) {
          // Export both decrypted URL and note to a .txt file
          exportToTxt(data.decryptedURL, data.decryptedNote);
        } else if (data.decryptedNote) {
          // Only note present, export it as decrypted text
          exportToTxt2(data.decryptedNote);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error during decryption:', error);
      alert('Error during decryption.');
      setLoading(false); // Reset loading state
    }
  };

  // Logout function
  const logOut = async () => {
    try {
      await auth.signOut(); // Sign out from Firebase
      alert('Logged out successfully.');
      navigate('/login'); // Navigate to login page after logout
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out.');
    }
  };

  // Navigation functions
  const goToEncrypt = () => {
    navigate('/encrypt');
  };

  const toggleForms = () => {
    navigate('/list');
  };

  // Function to export decrypted URL and note to a .txt file
  const exportToTxt = (decryptedURL, decryptedNote) => {
    const text = `Decrypted URL: ${decryptedURL}\n\nDecrypted Note: ${decryptedNote}`;
    const blob = new Blob([text], { type: 'text/plain' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'decrypted_data.txt'; // Name of the .txt file
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to export decrypted text to a .txt file
  const exportToTxt2 = (decryptedText) => {
    const text = `Decrypted Text: ${decryptedText}`;
    const blob = new Blob([text], { type: 'text/plain' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'decrypted_text.txt'; // Name of the .txt file
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Redirect unauthorized users
  if (!isAdmin) {
    return <div>Loading...</div>; // Show loading while checking user role
  }

  return (
    <>
      <div className='decrypt-body'>
        <div className="decrypt-container" id="decryptForm">
          <div className="logoutButton">
            <button type="button" className="logout-btn" onClick={logOut}>Logout</button><br />
          </div>
          <header>
            <img src={FileCloak} className="decrypt-logo" alt="FileCloak" />
          </header>
          <form className="decrypt-form" onSubmit={handleDecrypt}>
            <div className="decrypt-panel">
              <div>
                <div>
                  <button type="button" className="encrypt-btn" onClick={goToEncrypt}>Encrypt</button><br />
                </div>
                <br />
                <div>
                  <button type="button" className="list-btn" onClick={toggleForms}>Move to List</button><br />
                </div>
              </div>
              <div className="file-decryption" id="fileDecryption">
                <h2>Input Key</h2>
                <div>
                  <input
                    className='admin-key-input'
                    type="text"
                    id="keyInput"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)} // Update keyInput state
                    required
                  />
                </div>
                <h2>Input Token</h2>
                <div>
                  <input
                    className='admin-token-input'
                    type="text"
                    id="tokenInput"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)} // Update tokenInput state
                    required
                  />
                </div>
                <button type="submit" className="decrypt-btn" value="Decrypt" id="decryptButton" disabled={loading}>
                  {loading ? 'Decrypting...' : 'Decrypt'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default AdminPageDecrypt;

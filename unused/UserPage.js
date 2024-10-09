import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import FileCloak from '../FileCloak.webp';
import './UserPage.css';

function UserPage() {
  const navigate = useNavigate();

  // States to store the inputs and decrypted data
  const [keyInput, setKeyInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [decryptedURL, setDecryptedURL] = useState('');
  const [decryptedNote, setDecryptedNote] = useState('');
  const [role, setRole] = useState(''); // State to store the user role

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    if (user) {
      const userDocRef = doc(db, 'users', user.email); // Assuming email is used as the document ID
      getDoc(userDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setRole(doc.data().role); // Set the role state
          } else {
            console.log('No such user document!');
          }
        })
        .catch((error) => {
          console.error('Error fetching user document:', error);
        });
    } else {
      navigate('/login'); // Redirect to login if no user is authenticated
    }
  }, [navigate]); // Include navigate in the dependency array

  // Handle form submission to call the backend decrypt route
  const handleDecrypt = async (e) => {
    e.preventDefault();
  
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (!user) {
      alert('No user is authenticated.');
      return;
    }
  
    // Get the Firebase ID token
    const token = await user.getIdToken();
  
    try {
      const response = await fetch('http://localhost:4000/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Add the token to the headers
        },
        body: JSON.stringify({
          encryptET: tokenInput.trim(),
          keyET: keyInput.trim(),
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Set decrypted data
        setDecryptedURL(data.decryptedURL || '');
        setDecryptedNote(data.decryptedNote || '');
  
        if (data.decryptedURL && data.decryptedNote) {
          exportToTxt(data.decryptedURL, data.decryptedNote);
        } else if (data.decryptedNote) {
          exportToTxt2(data.decryptedNote);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error during decryption:', error);
      alert('Error during decryption.');
    }
  };
  

  // Logout function using Firebase Auth
  const logOut = async () => {
    const auth = getAuth(); // Initialize Firebase Auth
    try {
      await signOut(auth); // Sign out the user
      alert('Logged out successfully.');
      navigate('/login'); // Navigate to the login page after logout
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error logging out. Please try again.');
    }
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

  return (
    <>
      <div className='userpage-body'>
        <div className="userContainer" id="decryptForm">
          <div className="logoutButton">
            <button type="button" className="logout-btn" onClick={logOut}>Logout</button><br />
          </div>
          <header>
            <img src={FileCloak} className="userpage-logo" alt="FileCloak" />
          </header>
          <form className="login-form" onSubmit={handleDecrypt}>
            <div className="panel">
              <div className="file-decryption">
                <h2 className='header2'>Input Key</h2>
                <div>
                  <input
                    type="text"
                    id="keyInput"
                    className="user-key-input"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)} // Update keyInput state
                    required
                  />
                </div>
                <h2 className='header2'>Input Token</h2>
                <div>
                  <input
                    type="text"
                    id="tokenInput"
                    className="user-token-input"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)} // Update tokenInput state
                    required
                  />
                </div>
                <button type="submit" className="decrypt-btn" value="Decrypt" id="decryptButton">Decrypt</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default UserPage;

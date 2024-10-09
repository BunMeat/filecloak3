import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileCloak from '../FileCloak.webp';
import './AdminPageEncryptText.css';

function AdminPageEncryptText() {
  const navigate = useNavigate();

  const [textToEncrypt, setTextToEncrypt] = useState('');
  const [key, setKey] = useState('');
  const [output, setOutput] = useState('');

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleEncryptText = async () => {
    if (!key) {
      alert('Please generate or provide an encryption key before proceeding.');
      return;
    }

    try {
      const response = await fetch('/encryptText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToEncrypt, key }),
      });

      if (!response.ok) {
        throw new Error('Encryption failed');
      }

      const data = await response.json();
      setOutput(data.encryptedText);
    } catch (error) {
      console.error('Encryption failed', error);
      alert('Encryption failed: ' + error.message);
    }
  };

  return (
    <>
      <div className='encrypt-text-body'>
        <div className="encrypt-text-container" id="encryptForm">
          <div className="logoutButton">
            <button type="button" className="logout-btn" id="logoutButton">Logout</button><br/>
          </div>
          <header>
            <img src={FileCloak} className="encrypt-text-logo" alt="FileCloak" />
          </header>
          <form className="encrypt-text-form" onSubmit={(e) => e.preventDefault()}>
            <div className="encrypt-text-panel">
              <div className="file-encryption">
                <h2>Input Text</h2>
                <div>
                  <button type="button" className="encrypt-file-btn" onClick={() => handleNavigation('/encrypt-file')}>Encrypt File</button><br/>
                </div>
                <div>
                  <textarea
                    id="textToEncrypt"
                    rows="3"
                    cols="50"
                    maxLength="500"
                    placeholder="Input your text"
                    value={textToEncrypt}
                    onChange={(e) => setTextToEncrypt(e.target.value)}
                  /><br/>
                </div>
                <div>
                  <textarea
                    id="keyGen"
                    rows="3"
                    cols="50"
                    maxLength="64"
                    placeholder="You can also input a 64 character long key"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                  /><br/>
                  <p className='counter-tracker'><span id="counter">{key.length}</span> / 64 characters</p>
                  <button id="keyGenButton" type="button" onClick={() => setKey(generateKey())}>Generate Key</button><br/>
                  <button id="copyButton" type="button" onClick={() => navigator.clipboard.writeText(key)}>Copy to Clipboard</button>
                </div>
                <div>
                  <textarea
                    id="output"
                    rows="9"
                    cols="50"
                    readOnly
                    value={output}
                  /><br/>
                  <button id="copyButton2" type="button" onClick={() => navigator.clipboard.writeText(output)}>Copy to Clipboard</button>
                </div>
                <button type="button" className="encrypt-btn" onClick={handleEncryptText}>Encrypt</button>
              </div>
              <div>
                <div>
                  <button type="button" className="decrypt-btn" onClick={() => handleNavigation('/decrypt')}>Decrypt</button><br/>
                </div>
                <br/>
                <div>
                  <button type="button" className="list-btn" onClick={() => handleNavigation('/list')}>Move to List</button><br/>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// Utility function to generate a random 64-character key
function generateKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default AdminPageEncryptText;

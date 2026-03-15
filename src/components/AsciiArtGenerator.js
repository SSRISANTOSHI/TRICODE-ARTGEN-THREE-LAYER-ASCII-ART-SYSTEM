import React, { useState } from 'react';
import { processImageFile, textToAscii, ASCII_CHAR_SETS } from '../utils/asciiGenerator';
import { encryptData, decryptData, generateKey } from '../utils/encryption';
import { embedDataInAscii, extractDataFromAscii, processThreeLayerSecurity, extractThreeLayerSecurity, calculateIntegrityScore, embedWatermark } from '../utils/steganography';

const AsciiArtGenerator = () => {
  const [asciiArt, setAsciiArt] = useState('');
  const [secretData, setSecretData] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [steganographicArt, setSteganographicArt] = useState('');
  const [extractedData, setExtractedData] = useState('');
  const [mode, setMode] = useState('encode');
  const [charSet, setCharSet] = useState('standard');
  const [workflow, setWorkflow] = useState('generate'); // 'generate' or 'existing'
  const [theme, setTheme] = useState('light');
  const [userKey, setUserKey] = useState('');
  const [integrityScore, setIntegrityScore] = useState(null);
  const [tamperStatus, setTamperStatus] = useState(null);
  const [useThreeLayer, setUseThreeLayer] = useState(true);
  const [currentLayer, setCurrentLayer] = useState(1);
  const [layerResults, setLayerResults] = useState({
    twoLayer: { layer1: '', layer2: '' },
    threeLayer: { layer1: '', layer2: '', layer3: '' }
  });

  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleConvertImage = async () => {
    if (selectedImage) {
      try {
        const ascii = await processImageFile(selectedImage, charSet);
        setAsciiArt(ascii);
      } catch (error) {
        alert('Error processing image: ' + error.message);
      }
    } else {
      alert('Please select an image first');
    }
  };



  const handleGenerateKey = () => {
    const key = generateKey();
    setEncryptionKey(key);
  };

  const getCurrentResults = () => useThreeLayer ? layerResults.threeLayer : layerResults.twoLayer;
  const setCurrentResults = (updates) => {
    const key = useThreeLayer ? 'threeLayer' : 'twoLayer';
    setLayerResults(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  };

  const handleLayer1 = () => {
    if (!asciiArt) {
      alert('Please generate ASCII art first');
      return;
    }
    setCurrentResults({ layer1: asciiArt });
    setCurrentLayer(1);
  };

  const handleLayer2 = () => {
    const current = getCurrentResults();
    if (!current.layer1 || !secretData || !encryptionKey) {
      alert('Please complete Layer 1 and provide secret data and encryption key');
      return;
    }

    try {
      const encrypted = encryptData(secretData, encryptionKey);
      const embedded = embedDataInAscii(current.layer1, encrypted);
      setCurrentResults({ layer2: embedded });
      setCurrentLayer(2);
      if (!useThreeLayer) {
        setSteganographicArt(embedded);
      }
    } catch (error) {
      alert('Error in Layer 2: ' + error.message);
    }
  };

  const handleLayer3 = () => {
    const current = getCurrentResults();
    if (!current.layer2 || !userKey) {
      alert('Please complete Layer 2 and provide user key');
      return;
    }

    try {
      const watermarkedArt = embedWatermark(current.layer2, userKey);
      setCurrentResults({ layer3: watermarkedArt });
      setSteganographicArt(watermarkedArt);
      setCurrentLayer(3);
      setIntegrityScore({ score: 100, status: 'INTACT', details: 'All three layers applied successfully' });
    } catch (error) {
      alert('Error in Layer 3: ' + error.message);
    }
  };

  const handleEmbed = () => {
    if (!asciiArt || !secretData || !encryptionKey) {
      alert('Please provide ASCII art, secret data, and encryption key');
      return;
    }

    if (useThreeLayer && !userKey) {
      alert('Please provide a user key for three-layer security');
      return;
    }

    try {
      if (useThreeLayer) {
        const result = processThreeLayerSecurity(asciiArt, secretData, encryptionKey, userKey);
        setSteganographicArt(result.finalArt);
        setIntegrityScore({ score: 100, status: 'INTACT', details: 'Watermark applied successfully' });
      } else {
        const encrypted = encryptData(secretData, encryptionKey);
        const embedded = embedDataInAscii(asciiArt, encrypted);
        setSteganographicArt(embedded);
      }
    } catch (error) {
      alert('Error embedding data: ' + error.message);
    }
  };

  const handleExtract = () => {
    // Clear previous results
    setExtractedData('');
    setIntegrityScore(null);
    setTamperStatus(null);
    
    const inputArt = document.getElementById('extractInput').value;
    const key = document.getElementById('extractKey').value;
    const extractUserKey = document.getElementById('extractUserKey')?.value;

    if (!inputArt || !key) {
      alert('Please provide steganographic ASCII art and decryption key');
      return;
    }

    if (useThreeLayer && !extractUserKey) {
      alert('Please provide user key for three-layer security verification');
      return;
    }

    try {
      if (useThreeLayer) {
        const result = extractThreeLayerSecurity(inputArt, key, extractUserKey);
        if (result.success) {
          setExtractedData(result.secretData);
          setIntegrityScore(result.integrityScore);
          setTamperStatus('INTACT');
        } else {
          alert(`Extraction failed: ${result.error}`);
          setIntegrityScore(result.integrityScore);
          setTamperStatus('TAMPERED');
        }
      } else {
        const extractedEncrypted = extractDataFromAscii(inputArt, null, false);
        const decrypted = decryptData(extractedEncrypted, key);
        setExtractedData(decrypted);
      }
    } catch (error) {
      console.error('Extraction error:', error);
      alert('Error extracting data: ' + error.message);
    }
  };

  const handleDownload = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      alert('Copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Copied to clipboard!');
    }
  };

  const handleExportOptions = (content, type) => {
    const options = {
      'txt': () => handleDownload(content, `${type}-ascii-art.txt`),
      'html': () => {
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>ASCII Art</title>
  <style>
    body { font-family: 'Courier New', monospace; background: #000; color: #0f0; padding: 20px; }
    pre { font-size: 8px; line-height: 1; }
  </style>
</head>
<body>
  <pre>${content}</pre>
</body>
</html>`;
        handleDownload(htmlContent, `${type}-ascii-art.html`);
      },
      'json': () => {
        const jsonContent = JSON.stringify({
          type: type,
          content: content,
          timestamp: new Date().toISOString()
        }, null, 2);
        handleDownload(jsonContent, `${type}-ascii-art.json`);
      }
    };
    return options;
  };

  return (
    <div className={`ascii-generator ${theme}`}>
      <div className="header">
        <h1>🔐 {useThreeLayer ? 'Three-Layer' : 'Two-Layer'} ASCII Art Security System</h1>
        <div className="header-controls">
          <button 
            className={`security-toggle ${useThreeLayer ? 'active' : ''}`}
            onClick={() => setUseThreeLayer(!useThreeLayer)}
          >
            {useThreeLayer ? '3-Layer 🛡️' : '2-Layer 🔒'}
          </button>
          <button 
            className="theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
      
      {useThreeLayer && (
        <div className="security-info">
          <div className="layer-controls">
            <button 
              className={`layer-btn ${currentLayer >= 1 ? 'completed' : ''} ${currentLayer === 1 ? 'active' : ''}`}
              onClick={handleLayer1}
            >
              Layer 1: ASCII Art {getCurrentResults().layer1 && '✓'}
            </button>
            <button 
              className={`layer-btn ${currentLayer >= 2 ? 'completed' : ''} ${currentLayer === 2 ? 'active' : ''}`}
              onClick={handleLayer2}
            >
              Layer 2: AES Encryption {getCurrentResults().layer2 && '✓'}
            </button>
            <button 
              className={`layer-btn ${currentLayer >= 3 ? 'completed' : ''} ${currentLayer === 3 ? 'active' : ''}`}
              onClick={handleLayer3}
            >
              Layer 3: Fragile Watermark {getCurrentResults().layer3 && '✓'}
            </button>
          </div>
          
          <div className="layer-display">
            {currentLayer === 1 && getCurrentResults().layer1 && (
              <div className="layer-result">
                <h4>🎨 Layer 1 Result: ASCII Art</h4>
                <pre className="layer-preview">{getCurrentResults().layer1}</pre>
              </div>
            )}
            
            {currentLayer === 2 && getCurrentResults().layer2 && (
              <div className="layer-result">
                <h4>🔐 Layer 2 Result: Encrypted + Embedded</h4>
                <p className="layer-info">Secret data encrypted with AES and embedded using invisible characters</p>
                <pre className="layer-preview">{getCurrentResults().layer2}</pre>
              </div>
            )}
            
            {useThreeLayer && currentLayer === 3 && getCurrentResults().layer3 && (
              <div className="layer-result">
                <h4>🛡️ Layer 3 Result: Watermarked</h4>
                <p className="layer-info">Fragile watermark applied - any tampering will be detected</p>
                <pre className="layer-preview">{getCurrentResults().layer3}</pre>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mode-selector">
        <button 
          className={mode === 'encode' ? 'active' : ''} 
          onClick={() => setMode('encode')}
        >
          Encode
        </button>
        <button 
          className={mode === 'decode' ? 'active' : ''} 
          onClick={() => setMode('decode')}
        >
          Decode
        </button>
      </div>

      {mode === 'encode' && (
        <div className="encode-section">
          <div className="workflow-selector">
            <h3>Choose Workflow:</h3>
            <div className="workflow-options">
              <button 
                className={workflow === 'generate' ? 'active' : ''} 
                onClick={() => setWorkflow('generate')}
              >
                Generate ASCII Art + Embed Data
              </button>
              <button 
                className={workflow === 'existing' ? 'active' : ''} 
                onClick={() => setWorkflow('existing')}
              >
                Use Existing ASCII Art + Embed Data
              </button>
            </div>
          </div>

          {workflow === 'generate' && (
            <div className="input-section">
              <h3>Layer 1: Generate ASCII Art</h3>
            <div className="input-group">
              <label>Character Set:</label>
              <select value={charSet} onChange={(e) => setCharSet(e.target.value)} className="char-set-selector">
                <option value="standard">Standard (@%#*+=-:. )</option>
                <option value="dense">Dense Blocks (█▉▊▋▌▍▎▏ )</option>
                <option value="simple">Simple (##++--.. )</option>
                <option value="dots">Dots (●◐◑◒◓◔◕○ )</option>
                <option value="blocks">Blocks (█▓▒░ )</option>
              </select>
            </div>
            <div className="input-group">
              <label>Upload Image:</label>
              <input type="file" accept="image/*" onChange={handleImageSelect} />
              <button onClick={handleConvertImage}>Convert to ASCII</button>
            </div>
          </div>
          )}

          {workflow === 'existing' && (
            <div className="input-section">
              <h3>Layer 1: Upload Existing ASCII Art</h3>
              <div className="input-group">
                <label>Upload ASCII Art File:</label>
                <input type="file" accept=".txt,.html,.json" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      let content = event.target.result;
                      if (file.name.endsWith('.json')) {
                        const parsed = JSON.parse(content);
                        content = parsed.content || content;
                      }
                      setAsciiArt(content);
                    };
                    reader.readAsText(file);
                  }
                }} />
              </div>
              <div className="input-group">
                <label>Or Paste ASCII Art:</label>
                <textarea 
                  value={asciiArt}
                  onChange={(e) => setAsciiArt(e.target.value)}
                  placeholder="Paste your existing ASCII art here"
                  rows="10"
                />
              </div>
            </div>
          )}

          {asciiArt && (
            <div className="ascii-preview">
              <h4>Generated ASCII Art:</h4>
              <div className="export-controls">
                <button onClick={() => handleCopy(asciiArt)} className="copy-btn">
                  📋 Copy
                </button>
                <button onClick={() => handleExportOptions(asciiArt, 'basic')['txt']()} className="export-option">
                  📄 Text
                </button>
                <button onClick={() => handleExportOptions(asciiArt, 'basic')['html']()} className="export-option">
                  🌐 HTML
                </button>
                <button onClick={() => handleExportOptions(asciiArt, 'basic')['json']()} className="export-option">
                  📊 JSON
                </button>
              </div>
              <pre>{asciiArt}</pre>
            </div>
          )}

          <div className="layer2-section">
            <h3>Layer 2: Embed Secret Data</h3>
            <div className="input-group">
              <label>Secret Data:</label>
              <textarea 
                value={secretData}
                onChange={(e) => setSecretData(e.target.value)}
                placeholder="Enter secret message to embed"
                rows="4"
              />
            </div>
            <div className="input-group">
              <label>Encryption Key:</label>
              <input 
                type="text" 
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                placeholder="Enter encryption key"
              />
              <button onClick={handleGenerateKey}>Generate Key</button>
            </div>
            {useThreeLayer && (
              <div className="layer3-section">
                <h4>Layer 3: Fragile Watermark</h4>
                <div className="input-group">
                  <label>User Key (for watermark):</label>
                  <input 
                    type="text" 
                    value={userKey}
                    onChange={(e) => setUserKey(e.target.value)}
                    placeholder="Enter user key for watermark generation"
                  />
                  <button onClick={() => setUserKey(generateKey())}>Generate User Key</button>
                </div>
                <div className="watermark-info">
                  <p>🛡️ Fragile watermark will detect any tampering with the ASCII art</p>
                </div>
              </div>
            )}
            <button onClick={handleEmbed} className="embed-btn">
              {useThreeLayer ? 'Apply 3-Layer Security' : 'Embed Data'}
            </button>
          </div>

          {steganographicArt && (
            <div className="result-section">
              <h4>{useThreeLayer ? '🔐 Three-Layer Secured ASCII Art:' : 'Steganographic ASCII Art:'}</h4>
              {integrityScore && (
                <div className={`integrity-status ${integrityScore.status.toLowerCase()}`}>
                  <span className="score">Integrity Score: {integrityScore.score}%</span>
                  <span className="status">{integrityScore.status.replace('_', ' ')}</span>
                  <span className="details">{integrityScore.details}</span>
                </div>
              )}
              <div className="export-controls">
                <button onClick={() => handleCopy(steganographicArt)} className="copy-btn">
                  📋 Copy
                </button>
                <button onClick={() => handleExportOptions(steganographicArt, useThreeLayer ? 'three-layer' : 'steganographic')['txt']()} className="export-option">
                  📄 Text
                </button>
                <button onClick={() => handleExportOptions(steganographicArt, useThreeLayer ? 'three-layer' : 'steganographic')['html']()} className="export-option">
                  🌐 HTML
                </button>
                <button onClick={() => handleExportOptions(steganographicArt, useThreeLayer ? 'three-layer' : 'steganographic')['json']()} className="export-option">
                  📊 JSON
                </button>
              </div>
              <pre>{steganographicArt}</pre>
            </div>
          )}
        </div>
      )}

      {mode === 'decode' && (
        <div className="decode-section">
          <h3>🔓 Extract Hidden Data</h3>
          <div className="input-group">
            <label>Upload ASCII Art File:</label>
            <input type="file" accept=".txt,.html,.json" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  let content = event.target.result;
                  if (file.name.endsWith('.json')) {
                    const parsed = JSON.parse(content);
                    content = parsed.content || content;
                  }
                  document.getElementById('extractInput').value = content;
                };
                reader.readAsText(file);
              }
            }} />
          </div>
          <div className="input-group">
            <label>Or Paste {useThreeLayer ? 'Three-Layer Secured' : 'Steganographic'} ASCII Art:</label>
            <textarea 
              id="extractInput"
              placeholder={`Paste ${useThreeLayer ? 'three-layer secured' : 'steganographic'} ASCII art here`}
              rows="10"
            />
          </div>
          <div className="input-group">
            <label>Decryption Key:</label>
            <input 
              type="text" 
              id="extractKey"
              placeholder="Enter decryption key"
            />
          </div>
          {useThreeLayer && (
            <div className="input-group">
              <label>User Key (for watermark verification):</label>
              <input 
                type="text" 
                id="extractUserKey"
                placeholder="Enter user key for watermark verification"
              />
            </div>
          )}
          <button onClick={handleExtract} className="extract-btn">
            {useThreeLayer ? 'Verify & Extract' : 'Extract Data'}
          </button>

          {integrityScore && (
            <div className={`integrity-verification ${integrityScore.status.toLowerCase()}`}>
              <h4>🛡️ Integrity Verification</h4>
              <div className="verification-details">
                <span className="score">Score: {integrityScore.score}%</span>
                <span className="status">{integrityScore.status.replace('_', ' ')}</span>
                <span className="details">{integrityScore.details}</span>
              </div>
            </div>
          )}

          {extractedData && (
            <div className="extracted-data">
              <h4>✅ Extracted Secret Data:</h4>
              <div className="export-controls">
                <button onClick={() => handleCopy(extractedData)} className="copy-btn">
                  📋 Copy
                </button>
                <button onClick={() => handleDownload(extractedData, 'extracted-data.txt')} className="download-btn">
                  📥 Download
                </button>
              </div>
              <p>{extractedData}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AsciiArtGenerator;
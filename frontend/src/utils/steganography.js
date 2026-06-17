import CryptoJS from 'crypto-js';

// Three-Layer ASCII Art Security System
// Layer 2: Data Embedding Module
export const embedDataInAscii = (asciiArt, encryptedData) => {
  const base64Data = btoa(encryptedData);
  const binaryData = base64Data.split('').map(char => 
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('');
  
  const lines = asciiArt.split('\n');
  let dataIndex = 0;
  const invisibleChars = ['\u200B', '\u200C']; // Zero-width space, Zero-width non-joiner
  
  const modifiedLines = lines.map(line => {
    if (dataIndex >= binaryData.length) return line;
    
    let result = '';
    for (let i = 0; i < line.length && dataIndex < binaryData.length; i++) {
      result += line[i];
      if (line[i] !== ' ' && line[i] !== '\n' && line[i] !== '\r') {
        // Add invisible character based on bit value
        result += invisibleChars[parseInt(binaryData[dataIndex])];
        dataIndex++;
      }
    }
    return result;
  });
  
  // Add end marker using invisible characters
  const endMarker = '\u200D'.repeat(5); // Zero-width joiner as end marker
  return modifiedLines.join('\n') + endMarker;
};

// Layer 3: Fragile Watermark Functions
export const generateWatermark = (content, userKey) => {
  const contentHash = CryptoJS.SHA256(content + userKey).toString();
  
  const watermarkMarkers = {
    start: '\u2060', // Word joiner
    end: '\u2061',   // Function application
    bit0: '\u2062',  // Invisible times
    bit1: '\u2063'   // Invisible separator
  };
  
  const binaryHash = contentHash.split('').map(char => 
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('').substring(0, 64);
  
  let watermark = watermarkMarkers.start;
  for (let bit of binaryHash) {
    watermark += bit === '0' ? watermarkMarkers.bit0 : watermarkMarkers.bit1;
  }
  watermark += watermarkMarkers.end;
  
  return { watermark, hash: contentHash, markers: watermarkMarkers };
};

export const embedWatermark = (steganographicAscii, userKey) => {
  const { watermark } = generateWatermark(steganographicAscii, userKey);
  const lines = steganographicAscii.split('\n');
  const watermarkedLines = [];
  
  const watermarkChunks = watermark.match(/.{1,4}/g) || [];
  let chunkIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (chunkIndex < watermarkChunks.length && line.length > 0) {
      if (i % 3 === 0) {
        line += watermarkChunks[chunkIndex];
        chunkIndex++;
      } else if (i % 5 === 0 && chunkIndex < watermarkChunks.length) {
        line = watermarkChunks[chunkIndex] + line;
        chunkIndex++;
      }
    }
    watermarkedLines.push(line);
  }
  
  return watermarkedLines.join('\n');
};

export const verifyWatermark = (watermarkedAscii, userKey) => {
  try {
    const markers = {
      start: '\u2060',
      end: '\u2061',
      bit0: '\u2062',
      bit1: '\u2063'
    };
    
    let cleanContent = watermarkedAscii;
    Object.values(markers).forEach(marker => {
      cleanContent = cleanContent.replace(new RegExp(marker, 'g'), '');
    });
    
    let extractedBits = '';
    for (let char of watermarkedAscii) {
      if (char === markers.bit0) extractedBits += '0';
      else if (char === markers.bit1) extractedBits += '1';
    }
    
    if (extractedBits.length < 64) {
      throw new Error('Watermark corrupted or missing');
    }
    
    const expectedHash = CryptoJS.SHA256(cleanContent + userKey).toString();
    const extractedHashBits = extractedBits.substring(0, 64);
    
    const extractedHash = extractedHashBits.match(/.{8}/g)
      .map(byte => String.fromCharCode(parseInt(byte, 2)))
      .join('');
    
    const isIntact = expectedHash.startsWith(extractedHash.substring(0, 8));
    
    return {
      isIntact,
      cleanContent,
      extractedHash: extractedHash.substring(0, 8),
      expectedHash: expectedHash.substring(0, 8),
      tamperDetected: !isIntact
    };
  } catch (error) {
    return {
      isIntact: false,
      cleanContent: watermarkedAscii,
      tamperDetected: true,
      error: error.message
    };
  }
};

export const calculateIntegrityScore = (watermarkedAscii, userKey) => {
  const verification = verifyWatermark(watermarkedAscii, userKey);
  
  if (verification.error) {
    return { score: 0, status: 'CORRUPTED', details: verification.error };
  }
  
  if (verification.isIntact) {
    return { score: 100, status: 'INTACT', details: 'Watermark verified successfully' };
  }
  
  const similarity = calculateHashSimilarity(verification.extractedHash, verification.expectedHash);
  
  if (similarity > 0.8) {
    return { score: 75, status: 'MINOR_TAMPERING', details: 'Minor modifications detected' };
  } else if (similarity > 0.5) {
    return { score: 50, status: 'MODERATE_TAMPERING', details: 'Moderate tampering detected' };
  } else {
    return { score: 25, status: 'MAJOR_TAMPERING', details: 'Significant tampering detected' };
  }
};

const calculateHashSimilarity = (hash1, hash2) => {
  if (hash1.length !== hash2.length) return 0;
  let matches = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] === hash2[i]) matches++;
  }
  return matches / hash1.length;
};

export const extractDataFromAscii = (steganographicAscii, userKey = null, verifyIntegrity = false) => {
  // Layer 3: Verify watermark if key provided
  if (verifyIntegrity && userKey) {
    const verification = verifyWatermark(steganographicAscii, userKey);
    if (verification.tamperDetected) {
      throw new Error(`Tamper detected: ${verification.error || 'Watermark verification failed'}`);
    }
    // Use clean content for extraction
    steganographicAscii = verification.cleanContent;
  }
  
  const invisibleChars = ['\u200B', '\u200C'];
  const endMarker = '\u200D';
  let binaryData = '';
  
  // Remove end marker
  const cleanText = steganographicAscii.replace(/\u200D+$/, '');
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (invisibleChars.includes(char)) {
      binaryData += invisibleChars.indexOf(char).toString();
    }
  }
  
  if (binaryData.length === 0) {
    throw new Error('No embedded data found');
  }
  
  // Convert binary to base64 string
  const paddedBinary = binaryData.padEnd(Math.ceil(binaryData.length / 8) * 8, '0');
  const bytes = paddedBinary.match(/.{8}/g) || [];
  let base64Data = bytes.map(byte => {
    const charCode = parseInt(byte, 2);
    return charCode > 0 ? String.fromCharCode(charCode) : '';
  }).join('');
  
  // Remove null characters and padding
  base64Data = base64Data.replace(/\0+$/, '');
  
  try {
    if (!base64Data || base64Data.length === 0) {
      throw new Error('No valid data found');
    }
    return atob(base64Data);
  } catch (error) {
    console.error('Base64 decode error:', error, 'Data:', base64Data);
    throw new Error('Corrupted embedded data or invalid format');
  }
};

// Three-Layer Processing Functions
export const processThreeLayerSecurity = (asciiArt, secretData, encryptionKey, userKey) => {
  // Layer 1: ASCII Art (already provided)
  
  // Layer 2: Encrypt and embed data
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(secretData), encryptionKey).toString();
  const steganographicArt = embedDataInAscii(asciiArt, encrypted);
  
  // Layer 3: Add fragile watermark
  const watermarkedArt = embedWatermark(steganographicArt, userKey);
  const { hash } = generateWatermark(steganographicArt, userKey);
  
  return {
    finalArt: watermarkedArt,
    watermarkHash: hash,
    layers: {
      layer1: 'ASCII Art Generated',
      layer2: 'Data Encrypted and Embedded',
      layer3: 'Fragile Watermark Applied'
    }
  };
};

export const extractThreeLayerSecurity = (watermarkedArt, encryptionKey, userKey) => {
  // Layer 3: Verify watermark first
  const verification = verifyWatermark(watermarkedArt, userKey);
  if (verification.tamperDetected) {
    return {
      success: false,
      error: 'Tamper detected - watermark verification failed',
      integrityScore: calculateIntegrityScore(watermarkedArt, userKey)
    };
  }
  
  try {
    // Layer 2: Extract and decrypt data
    const extractedEncrypted = extractDataFromAscii(verification.cleanContent, null, false);
    const bytes = CryptoJS.AES.decrypt(extractedEncrypted, encryptionKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted || decrypted.trim() === '') {
      throw new Error('Decryption produced empty result');
    }
    
    let secretData;
    try {
      secretData = JSON.parse(decrypted);
    } catch (jsonError) {
      // If JSON parsing fails, treat as plain text
      secretData = decrypted;
    }
    
    return {
      success: true,
      secretData,
      verification,
      integrityScore: calculateIntegrityScore(watermarkedArt, userKey)
    };
  } catch (error) {
    return {
      success: false,
      error: `Decryption failed: ${error.message}`,
      verification
    };
  }
};
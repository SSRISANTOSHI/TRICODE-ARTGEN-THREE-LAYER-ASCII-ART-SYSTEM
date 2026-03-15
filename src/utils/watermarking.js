import CryptoJS from 'crypto-js';

// Layer 3: Fragile Watermark + Tamper Detection
export const generateWatermark = (asciiContent, userKey) => {
  // Create a hash of the ASCII content combined with user key
  const contentHash = CryptoJS.SHA256(asciiContent + userKey).toString();
  
  // Generate fragile watermark markers
  const watermarkMarkers = {
    start: '\u2060', // Word joiner (invisible)
    end: '\u2061',   // Function application (invisible)
    bit0: '\u2062',  // Invisible times
    bit1: '\u2063'   // Invisible separator
  };
  
  // Convert hash to binary and create watermark pattern
  const binaryHash = contentHash.split('').map(char => 
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('').substring(0, 64); // Use first 64 bits
  
  let watermark = watermarkMarkers.start;
  for (let bit of binaryHash) {
    watermark += bit === '0' ? watermarkMarkers.bit0 : watermarkMarkers.bit1;
  }
  watermark += watermarkMarkers.end;
  
  return {
    watermark,
    hash: contentHash,
    markers: watermarkMarkers
  };
};

export const embedWatermark = (steganographicAscii, userKey) => {
  const { watermark } = generateWatermark(steganographicAscii, userKey);
  
  // Embed watermark at strategic positions
  const lines = steganographicAscii.split('\n');
  const watermarkedLines = [];
  
  // Distribute watermark across multiple lines for fragility
  const watermarkChunks = watermark.match(/.{1,4}/g) || [];
  let chunkIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Embed watermark chunks at line endings and beginnings
    if (chunkIndex < watermarkChunks.length && line.length > 0) {
      if (i % 3 === 0) { // Every 3rd line gets a chunk at the end
        line += watermarkChunks[chunkIndex];
        chunkIndex++;
      } else if (i % 5 === 0 && chunkIndex < watermarkChunks.length) { // Every 5th line gets a chunk at the beginning
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
    // Extract watermark markers
    const markers = {
      start: '\u2060',
      end: '\u2061',
      bit0: '\u2062',
      bit1: '\u2063'
    };
    
    // Remove watermark to get original content
    let cleanContent = watermarkedAscii;
    Object.values(markers).forEach(marker => {
      cleanContent = cleanContent.replace(new RegExp(marker, 'g'), '');
    });
    
    // Extract watermark bits
    let extractedBits = '';
    for (let char of watermarkedAscii) {
      if (char === markers.bit0) extractedBits += '0';
      else if (char === markers.bit1) extractedBits += '1';
    }
    
    if (extractedBits.length < 64) {
      throw new Error('Watermark corrupted or missing');
    }
    
    // Convert bits back to hash
    const extractedHash = extractedBits.substring(0, 64)
      .match(/.{8}/g)
      .map(byte => String.fromCharCode(parseInt(byte, 2)))
      .join('');
    
    // Generate expected hash from clean content
    const expectedHash = CryptoJS.SHA256(cleanContent + userKey).toString();
    
    // Compare hashes
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
  
  // Calculate partial integrity based on hash similarity
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
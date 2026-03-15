import CryptoJS from 'crypto-js';

export const encryptData = (data, key) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
    return encrypted;
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
};

export const decryptData = (encryptedData, key) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Decryption failed: Invalid key or corrupted data');
  }
};

export const generateKey = () => {
  return CryptoJS.lib.WordArray.random(256/8).toString();
};
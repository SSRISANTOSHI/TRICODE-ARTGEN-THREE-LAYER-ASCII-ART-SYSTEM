const ASCII_CHAR_SETS = {
  standard: '@%#*+=-:. ',
  dense: '█▉▊▋▌▍▎▏ ',
  simple: '##++--.. ',
  dots: '●◐◑◒◓◔◕○ ',
  blocks: '██▓▒░    ',
  custom: '@%#*+=-:. '
};

export const imageToAscii = (imageData, width, height, outputWidth = 80, charSet = 'standard') => {
  const ASCII_CHARS = ASCII_CHAR_SETS[charSet] || ASCII_CHAR_SETS.standard;
  const aspectRatio = height / width;
  const outputHeight = Math.floor(outputWidth * aspectRatio * 0.5);
  const stepX = width / outputWidth;
  const stepY = height / outputHeight;
  
  let ascii = '';
  
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const pixelX = Math.floor(x * stepX);
      const pixelY = Math.floor(y * stepY);
      const pixelIndex = (pixelY * width + pixelX) * 4;
      
      const r = imageData[pixelIndex];
      const g = imageData[pixelIndex + 1];
      const b = imageData[pixelIndex + 2];
      
      const brightness = (r + g + b) / 3;
      const charIndex = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));
      ascii += ASCII_CHARS[ASCII_CHARS.length - 1 - charIndex];
    }
    ascii += '\n';
  }
  
  return ascii;
};

export const textToAscii = (text, font = 'block') => {
  const lines = text.split('\n');
  let result = '';
  
  lines.forEach(line => {
    result += line.split('').map(char => {
      if (char === ' ') return '   ';
      return char.repeat(3);
    }).join('') + '\n';
    result += '\n';
  });
  
  return result;
};

export const processImageFile = (file, charSet = 'standard') => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const ascii = imageToAscii(imageData.data, img.width, img.height, 80, charSet);
      
      resolve(ascii);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export { ASCII_CHAR_SETS };
const fs = require('fs');
const path = require('path');
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist', 'smartshelfx', 'browser');
console.log('backend dir:', __dirname);
console.log('frontend dist path:', frontendDistPath);
console.log('exists:', fs.existsSync(frontendDistPath));

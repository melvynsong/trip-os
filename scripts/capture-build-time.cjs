const fs = require('fs');
const path = require('path');

const buildTime = new Date().toISOString();
const outPath = path.join(__dirname, '../public/build-timestamp.txt');

fs.writeFileSync(outPath, buildTime + '\n');
console.log('Build timestamp written:', buildTime);

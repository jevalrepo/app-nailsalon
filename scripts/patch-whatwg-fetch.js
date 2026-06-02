const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../node_modules/whatwg-fetch/dist/fetch.umd.js');
if (!fs.existsSync(file)) process.exit(0);

let content = fs.readFileSync(file, 'utf8');
const target = "exports.DOMException = g.DOMException;";
const patched = "exports.DOMException = (g && typeof g.DOMException !== 'undefined') ? g.DOMException : undefined;";

if (content.includes(target)) {
  fs.writeFileSync(file, content.replace(target, patched));
  console.log('✓ Patched whatwg-fetch DOMException for Hermes');
}

const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../messages');
const enPath = path.join(messagesDir, 'en.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const enKeys = Object.keys(enData).sort();

const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json') && f !== 'en.json');

let hasErrors = false;

for (const file of files) {
  const filePath = path.join(messagesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updated = false;

  // Add missing keys
  for (const key of enKeys) {
    if (!(key in data)) {
      data[key] = enData[key]; // fallback to english
      updated = true;
    }
  }

  // Remove extra keys
  for (const key of Object.keys(data)) {
    if (!enKeys.includes(key)) {
      delete data[key];
      updated = true;
    }
  }

  if (updated) {
    // Sort keys to match en.json
    const sortedData = {};
    for (const key of enKeys) {
      sortedData[key] = data[key];
    }
    fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2) + '\n');
    console.log(`Synced ${file}`);
  }
}

console.log("All locales synced with en.json keys.");

const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

const messagesDir = path.join(__dirname, '../messages');
const enPath = path.join(messagesDir, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const enKeys = Object.keys(enData);

const targetLangs = [
  { code: "as", name: "Assamese" },
  { code: "bn", name: "Bengali" },
  { code: "brx", name: "Bodo" },
  { code: "doi", name: "Dogri" },
  { code: "gu", name: "Gujarati" },
  { code: "hi", name: "Hindi" },
  { code: "kn", name: "Kannada" },
  { code: "ks", name: "Kashmiri" },
  { code: "kok", name: "Konkani" },
  { code: "mai", name: "Maithili" },
  { code: "ml", name: "Malayalam" },
  { code: "mni", name: "Manipuri" },
  { code: "mr", name: "Marathi" },
  { code: "ne", name: "Nepali" },
  { code: "or", name: "Odia" },
  { code: "pa", name: "Punjabi" },
  { code: "sa", name: "Sanskrit" },
  { code: "sat", name: "Santali" },
  { code: "sd", name: "Sindhi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ur", name: "Urdu" }
];

// Certain keys we don't want to translate (brand names, etc)
const skipKeys = ["app.title", "queue.status.waiting", "queue.status.called", "queue.status.consultation", "queue.status.completed"];

async function translateBatch(keysToTranslate, objToTranslate, targetLang) {
  try {
    const prompt = `You are a professional localization expert. Translate the following JSON object's values from English to ${targetLang}. Return ONLY the raw valid JSON object. Do not include markdown code blocks. Keep the exact same keys. \n\n${JSON.stringify(objToTranslate, null, 2)}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await res.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      console.log("No result text returned", data);
      return null;
    }
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(resultText);
  } catch (e) {
    console.error(`Error translating to ${targetLang}:`, e.message);
    return null;
  }
}

async function run() {
  for (const lang of targetLangs) {
    const filePath = path.join(messagesDir, `${lang.code}.json`);
    let langData = {};
    if (fs.existsSync(filePath)) {
      langData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    const objToTranslate = {};
    for (const key of enKeys) {
      if (!skipKeys.includes(key)) {
        if (langData[key] === enData[key] || !langData[key]) {
          objToTranslate[key] = enData[key];
        }
      } else {
        langData[key] = enData[key]; // Keep original for skip keys
      }
    }

    const keysToTranslate = Object.keys(objToTranslate);
    if (keysToTranslate.length > 0) {
      console.log(`Translating ${keysToTranslate.length} keys to ${lang.name}...`);
      const translatedObj = await translateBatch(keysToTranslate, objToTranslate, lang.name);
      
      if (translatedObj) {
        for (const key of keysToTranslate) {
           if (translatedObj[key]) langData[key] = translatedObj[key];
        }
        
        const sortedData = {};
        for (const k of enKeys) {
          sortedData[k] = langData[k] || enData[k];
        }
        
        fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2) + '\n');
        console.log(`Updated ${lang.code}.json`);
      }
    } else {
      console.log(`Skipping ${lang.name}, no new keys to translate.`);
    }
  }
}

run();

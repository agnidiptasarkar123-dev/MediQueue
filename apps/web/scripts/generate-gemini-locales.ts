import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY environment variable is required.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const messagesDir = path.join(process.cwd(), 'messages');
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

const skipKeys = [
  "app.title", "queue.status.waiting", "queue.status.called", 
  "queue.status.consultation", "queue.status.completed", "queue.status.skipped", "queue.status.no_show"
];

async function translateBatch(keysToTranslate: string[], objToTranslate: any, targetLang: string) {
  const schema = {
    type: Type.OBJECT,
    properties: {} as Record<string, any>,
    required: keysToTranslate
  };
  for (const key of keysToTranslate) {
    schema.properties[key] = { type: Type.STRING };
  }

  const prompt = `Translate the following JSON object's string values from English to ${targetLang}. 
Preserve meaning, UI brevity, and placeholders exactly (e.g. {name} must remain {name}).
Do not translate product names. Keep exactly the same keys.

English Data:
${JSON.stringify(objToTranslate, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      }
    });

    if (!response.text) return null;
    return JSON.parse(response.text);
  } catch (error) {
    console.error(`Error translating to ${targetLang}:`, error);
    return null;
  }
}

async function run() {
  for (const lang of targetLangs) {
    const filePath = path.join(messagesDir, `${lang.code}.json`);
    let langData: any = {};
    if (fs.existsSync(filePath)) {
      langData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    const objToTranslate: any = {};
    for (const key of enKeys) {
      if (!skipKeys.includes(key)) {
        if (langData[key] === enData[key] || !langData[key]) {
          objToTranslate[key] = enData[key];
        }
      } else {
        langData[key] = enData[key]; // Preserve untranslated
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
        
        const sortedData: any = {};
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

const fs = require('fs');
const path = require('path');

const messagesDir = '/Users/agnidiptasarkar/Desktop/MEDIQUEUE/apps/web/messages';

const baseKeys = {
  "app.title": "MediQueue",
  "app.tagline": "Smart OPD Queue & Appointment System",
  "auth.mobile.label": "Mobile Number",
  "auth.mobile.placeholder": "Enter 10-digit number",
  "auth.getOtp": "Get OTP",
  "auth.verifyOtp": "Verify OTP",
  "auth.resend": "Resend OTP",
  "auth.consent": "By continuing, you agree that MediQueue uses your mobile number to manage your hospital queue.",
  "dashboard.patient": "Patient Dashboard",
  "dashboard.joinQueue": "Join Live Queue",
  "dashboard.myAppointments": "My Appointments",
  "queue.status.waiting": "WAITING",
  "queue.status.called": "CALLED",
  "queue.status.consultation": "IN CONSULTATION",
  "queue.status.completed": "COMPLETED",
  "queue.patientsAhead": "Patients ahead",
  "queue.estimatedWait": "Estimated wait",
  "queue.yourToken": "Your Token",
  "queue.live": "LIVE",
  "queue.turn.title": "YOUR TURN!",
  "queue.turn.desc": "Please proceed to the consultation room.",
  "dept.select": "Select Department",
  "doc.select": "Select Doctor",
  "common.confirm": "Confirm",
  "common.back": "Back",
  "common.loading": "Loading...",
  "common.error": "An error occurred",
  "common.available": "Available",
  "common.busy": "Busy",
  "kiosk.welcome": "Walk-in Registration",
  "staff.dashboard": "Staff Dashboard",
  "staff.callNext": "Call Next Patient",
  "admin.dashboard": "Admin Analytics"
};

const languages = {
  "en": baseKeys,
  "hi": {
    ...baseKeys,
    "app.tagline": "स्मार्ट ओपीडी कतार और अपॉइंटमेंट सिस्टम",
    "auth.mobile.label": "मोबाइल नंबर",
    "auth.mobile.placeholder": "10 अंकों का नंबर दर्ज करें",
    "auth.getOtp": "ओटीपी प्राप्त करें",
    "auth.verifyOtp": "ओटीपी सत्यापित करें",
    "auth.resend": "ओटीपी पुनः भेजें",
    "dashboard.patient": "मरीज डैशबोर्ड",
    "dashboard.joinQueue": "कतार में शामिल हों",
    "queue.status.waiting": "प्रतीक्षारत",
    "queue.status.called": "बुलाया गया",
    "queue.patientsAhead": "आगे के मरीज",
    "queue.estimatedWait": "अनुमानित प्रतीक्षा",
    "queue.yourToken": "आपका टोकन",
    "queue.turn.title": "आपकी बारी!",
    "common.confirm": "पुष्टि करें",
    "common.back": "वापस",
    "staff.callNext": "अगले मरीज को बुलाएं"
  },
  "bn": {
    ...baseKeys,
    "app.tagline": "স্মার্ট ওপিডি কিউ এবং অ্যাপয়েন্টমেন্ট সিস্টেম",
    "auth.mobile.label": "মোবাইল নম্বর",
    "auth.getOtp": "ওটিপি পান",
    "auth.verifyOtp": "ওটিপি যাচাই করুন",
    "dashboard.patient": "রোগী ড্যাশবোর্ড",
    "dashboard.joinQueue": "লাইনে যোগ দিন",
    "queue.patientsAhead": "সামনে রোগী",
    "queue.estimatedWait": "আনুমানিক অপেক্ষা",
    "queue.yourToken": "আপনার টোকেন",
    "queue.turn.title": "আপনার পালা!",
    "common.confirm": "নিশ্চিত করুন",
    "common.back": "ফিরে যান"
  },
  "ta": {
    ...baseKeys,
    "app.tagline": "ஸ்மார்ட் OPD வரிசை மற்றும் நியமனம்",
    "auth.mobile.label": "கைபேசி எண்",
    "auth.getOtp": "OTP பெறுக",
    "auth.verifyOtp": "OTP சரிபார்க்கவும்",
    "dashboard.patient": "நோயாளி டேஷ்போர்டு",
    "dashboard.joinQueue": "வரிசையில் சேரவும்",
    "queue.patientsAhead": "முன்னால் உள்ள நோயாளிகள்",
    "queue.estimatedWait": "மதிப்பிடப்பட்ட காத்திருப்பு",
    "queue.yourToken": "உங்கள் டோக்கன்",
    "queue.turn.title": "உங்கள் முறை!",
    "common.confirm": "உறுதிப்படுத்து"
  },
  "te": { ...baseKeys, "app.tagline": "స్మార్ట్ OPD క్యూ" },
  "mr": { ...baseKeys, "app.tagline": "स्मार्ट ओपीडी रांग" },
  "gu": { ...baseKeys, "app.tagline": "સ્માર્ટ ઓપીડી કતાર" },
  "kn": { ...baseKeys, "app.tagline": "ಸ್ಮಾರ್ಟ್ OPD ಕ್ಯೂ" },
  "ml": { ...baseKeys, "app.tagline": "സ്മാർട്ട് OPD ക്യൂ" },
  "pa": { ...baseKeys, "app.tagline": "ਸਮਾਰਟ OPD ਕਤਾਰ" },
  "ur": { ...baseKeys, "app.tagline": "سمارٹ او پی ڈی قطار" },
  "as": { ...baseKeys },
  "brx": { ...baseKeys },
  "doi": { ...baseKeys },
  "ks": { ...baseKeys },
  "kok": { ...baseKeys },
  "mai": { ...baseKeys },
  "mni": { ...baseKeys },
  "ne": { ...baseKeys },
  "or": { ...baseKeys },
  "sa": { ...baseKeys },
  "sat": { ...baseKeys },
  "sd": { ...baseKeys }
};

// Generate JSON files
Object.entries(languages).forEach(([lang, dict]) => {
  fs.writeFileSync(path.join(messagesDir, `${lang}.json`), JSON.stringify(dict, null, 2));
});
console.log('Generated 22 locale JSON files.');

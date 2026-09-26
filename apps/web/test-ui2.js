const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.toString()}`));
  page.on('response', response => {
    if (response.url().includes('/api/auth/')) {
      logs.push(`[API RESPONSE] ${response.url()} - Status: ${response.status()}`);
    }
  });

  try {
    console.log("Evaluating fetch in browser context...");
    const result = await page.evaluate(async () => {
      try {
        const sendRes = await fetch('http://localhost:5001/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'phone', phone: '9988776654' }) // use different phone to avoid rate limit!
        }).then(r => r.json());
        
        if (!sendRes.success) return 'Send OTP failed: ' + JSON.stringify(sendRes);
        
        const otp = sendRes.data.demoOtp || '123456';
        
        const verifyRes = await fetch('http://localhost:5001/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'phone', phone: '9988776654', otp })
        }).then(r => r.json());
        
        if (!verifyRes.success) return 'Verify OTP failed: ' + JSON.stringify(verifyRes);
        
        const token = verifyRes.data.token;
        
        const profileRes = await fetch('http://localhost:5001/api/auth/setup-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ fullName: 'Browser Test Patient', consentGiven: true })
        });
        
        const profileData = await profileRes.json();
        
        return {
          profileStatus: profileRes.status,
          profileData: profileData
        };
      } catch (err) {
        return err.toString();
      }
    });
    
    console.log("Browser evaluate result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Test script failed:", err);
  } finally {
    console.log("Browser logs:", logs.join('\n'));
    await browser.close();
  }
})();

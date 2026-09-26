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
    console.log("Navigating to auth page...");
    await page.goto('http://localhost:3000/auth');
    
    console.log("Waiting for phone input...");
    await page.waitForSelector('#phone-input');
    await page.type('#phone-input', '9988776655');
    
    console.log("Clicking Get OTP...");
    await page.click('#send-otp-btn');
    
    console.log("Waiting for OTP input...");
    await page.waitForSelector('input[type="text"][maxLength="1"]');
    
    // Type a dummy OTP (it doesn't matter if we need a real one, we can fetch demoOtp from console if needed, but demo mode is on)
    // Actually, demoOtp might be automatically typed or shown in modal
    // Let's type '397302' or something. But since demo mode is on, a modal shows up.
    
    // Instead of doing the full UI flow which might be complex with the demo modal, 
    // let's just evaluate a fetch call in the page context to see if it works with CORS and everything.
    console.log("Evaluating fetch in browser context...");
    const result = await page.evaluate(async () => {
      try {
        const sendRes = await fetch('http://localhost:5001/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'phone', phone: '9988776655' })
        }).then(r => r.json());
        
        if (!sendRes.success) return 'Send OTP failed: ' + JSON.stringify(sendRes);
        
        const otp = sendRes.data.demoOtp || '123456';
        
        const verifyRes = await fetch('http://localhost:5001/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'phone', phone: '9988776655', otp })
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

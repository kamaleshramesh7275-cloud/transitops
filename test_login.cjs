const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
  );

  console.log('Navigating to http://localhost:5173/');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  
  console.log('Current URL:', page.url());
  
  console.log('Clicking Fleet Manager Quick Login...');
  // Find the button that contains "Fleet Manager"
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Fleet Manager')) {
      await btn.click();
      break;
    }
  }

  // Wait for navigation or network idle
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Current URL after login:', page.url());
  
  await browser.close();
})();

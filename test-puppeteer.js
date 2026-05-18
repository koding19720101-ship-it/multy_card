const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Create room
  await page.type('input[placeholder="사용할 닉네임"]', 'HostUser');
  await page.click('button:has-text("새 방 만들기"), button:text("새 방 만들기"), button:contains("새 방 만들기")');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('새 방 만들기'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('Done testing host creation.');
  await browser.close();
})();

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1. Landing page
  await page.goto('http://localhost:3002');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'report/screenshots/01-landing.png', fullPage: true });
  console.log('01-landing captured');

  // 2. Landing page - privacy consent agreed
  const agreeBtn = page.locator('button').filter({ hasText: '읽고 이해하였으며' });
  if (await agreeBtn.count() > 0) {
    await agreeBtn.click();
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'report/screenshots/02-landing-agreed.png', fullPage: true });
  console.log('02-landing-agreed captured');

  // 3. Survey page (Korean)
  await page.goto('http://localhost:3002/survey');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'report/screenshots/03-survey-ko.png', fullPage: true });
  console.log('03-survey-ko captured');

  // 4. English survey page
  await page.goto('http://localhost:3002/en/survey');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'report/screenshots/04-survey-en.png', fullPage: true });
  console.log('04-survey-en captured');

  // 5. Admin page - login
  await page.goto('http://localhost:3002/admin');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'report/screenshots/05-admin-login.png', fullPage: true });
  console.log('05-admin-login captured');

  // 6. Admin page - after login
  const pwInput = page.locator('input[type="password"]');
  if (await pwInput.count() > 0) {
    await pwInput.fill('kmou2025admin');
    const submitBtn = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("확인")').first();
    await submitBtn.click();
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'report/screenshots/06-admin-overview.png', fullPage: true });
  console.log('06-admin-overview captured');

  // 7. Admin - responses tab
  const responsesTab = page.locator('button').filter({ hasText: '응답 목록' });
  if (await responsesTab.count() > 0) {
    await responsesTab.click();
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'report/screenshots/07-admin-responses.png', fullPage: true });
  console.log('07-admin-responses captured');

  // 8. Admin - statistics tab
  const statsTab = page.locator('button').filter({ hasText: '통계' });
  if (await statsTab.count() > 0) {
    await statsTab.click();
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'report/screenshots/08-admin-statistics.png', fullPage: true });
  console.log('08-admin-statistics captured');

  // 9. Complete page
  await page.goto('http://localhost:3002/complete');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'report/screenshots/09-complete.png', fullPage: true });
  console.log('09-complete captured');

  await browser.close();
  console.log('All screenshots captured!');
})();

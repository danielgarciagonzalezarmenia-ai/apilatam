export default async function run(page) {
  const out = {};
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERR: ' + e.message));

  await page.goto('http://localhost:8080/login.html');
  await page.waitForTimeout(1500);
  await page.locator('#auth-email').fill('danigar222009@gmail.com');
  await page.locator('#auth-password').fill('D@niel2009');
  await page.locator('#auth-submit').click();
  await page.waitForTimeout(7000);

  await page.goto('http://localhost:8080/dashboard.html');
  await page.waitForTimeout(4000);

  await page.waitForSelector('#rotate-key-btn', { timeout: 20000 }).catch(() => out.step = 'no rotate btn');
  await page.waitForTimeout(2000);

  out.btnText = await page.evaluate(() => {
    const b = document.getElementById('rotate-key-btn');
    return b ? b.textContent + '|disabled=' + b.disabled : 'nobtn';
  });

  await page.evaluate(() => {
    document.getElementById('rotate-key-btn').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });

  const appeared = await page.waitForSelector('.dialog-overlay.active', { timeout: 4000 }).then(() => true).catch(() => false);
  out.dialogAppeared = appeared;
  if (appeared) {
    out.dialogText = await page.evaluate(() => (document.querySelector('.dialog-overlay') || {}).textContent || '');
  }

  await page.waitForTimeout(1000);
  out.errors = errors;
  out.url = page.url();
  return out;
}
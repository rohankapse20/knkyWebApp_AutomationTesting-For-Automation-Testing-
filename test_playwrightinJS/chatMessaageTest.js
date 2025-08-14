const { test, expect } = require('@playwright/test');

test('Send message to all users in creator messages tab', async ({ page }) => {
  // 1. Login
  await page.goto('https://agency-test.x3845w4itv8m.knky.co/login');
  await page.fill('input[placeholder="example@knky.com"]', 'rashmi.gupta.iic.0116+chatagency@gmail.com');
  await page.fill('input[placeholder="Enter your password"]', 'a3JqFXPCc1HJL-y1LyATS');
  await page.click('button:has-text("Sign In")');

  // 2. Navigate to Creators tab
  await page.click('span:has-text("Creators")');

  // 3. Click creator card (id="card-1")
  await page.click('#card-1');

  // 4. Click "Login as creator"
  await page.click('div:has-text("Login as creator")');

  // 5. Click Messages tab
  await page.click('span:has-text("Messages")');

  // 6. Wait for the users list container to appear
  const userSelector = 'div#root > div > main > div > div:nth-child(2) > div > div > div';
  await page.waitForSelector(userSelector);

  // 7. Get all users
  let users = await page.$$(userSelector);
  console.log('Total users:', users.length);

  for (let i = 0; i < users.length; i++) {
    // Refetch users each iteration to avoid stale elements
    users = await page.$$(userSelector);
    const user = users[i];

    await user.click();

    // Wait for message input to be visible
    const messageInputSelector = 'input[placeholder="Type message..."]';
    await page.waitForSelector(messageInputSelector, { state: 'visible' });

    // Fill message box
    await page.fill(messageInputSelector, 'Hello! This is an automated test message.');

    // Click send button (using the img inside the last div in the messages section)
    // Adjust selector based on actual send button — example below:
    const sendButtonSelector = 'div#root > div:nth-child(2) > main > div > div:nth-child(3) div div div:nth-child(2) > img';
    await page.click(sendButtonSelector);

    // Wait a bit before next user
    await page.waitForTimeout(1000);
  }

  console.log('✅ Message sent to all users!');
});

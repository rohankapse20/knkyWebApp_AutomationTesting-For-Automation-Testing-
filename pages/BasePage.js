// basePage.js
require('dotenv').config();

class BasePage {
  constructor(page) {
    this.page = page;

    // Load from environment
    this.baseURL = process.env.BASE_URL;

    // Define the Locators 
    this.ageConfirmButton = page.locator('#age-wraning-close-button');
    this.signinButton = page.locator('[data-eid="Home_WithoutLoggedIn/Signin_btn"]');
  }

  async navigate() {
    if (!this.baseURL) {
      throw new Error('BASE_URL is not defined. Check your .env file.');
    }

 try {
  console.log('Navigating to:', this.baseURL);
  await this.page.goto(this.baseURL, { waitUntil: 'domcontentloaded' });
  console.log('Navigated to base URL');

  // Check if "502 Bad Gateway" error page is shown
  const error502 = await this.page.locator("//h1[contains(text(), '502 Bad Gateway')]").count();
  if (error502 > 0) {
    console.error('Site is currently down with 502 Bad Gateway error. Stopping the test.');
    throw new Error('502 Bad Gateway error detected. Aborting test.');
  }

} catch (err) {
  console.error('Navigation failed or 502 error detected:', err.message);
  throw new Error(`Navigation failed: ${err.message}`);
}

try {
  const ageConfirmButton = this.page.locator('button#age-confirm');
  if (await ageConfirmButton.isVisible({ timeout: 5000 })) {
    await ageConfirmButton.click();
    console.log('Clicked on age confirmation button.');
  } else {
    console.log('Age confirmation button not visible — skipping.');
  }
} catch (err) {
  console.log('Age confirmation button not found — skipping.');
}

    try {
      await this.signinButton.waitFor({ state: 'visible', timeout: 40000 });
      console.log('Sign-in button is visible. Page fully loaded.');
    } catch (err) {
      throw new Error('Sign-in button did not appear within 40s.');
    }
  }
}

module.exports = { BasePage };

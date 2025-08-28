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
    } catch (err) {
      throw new Error(`Navigation failed: ${err.message}`);
    }

    try {
      console.log('Waiting for age confirmation button...');
      await this.ageConfirmButton.waitFor({ state: 'visible', timeout: 50000 });
      await this.ageConfirmButton.click();
      console.log('Clicked on age confirmation button.');
    } catch (err) {
      throw new Error('Age confirmation button did not appear within 50s..!!!');
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

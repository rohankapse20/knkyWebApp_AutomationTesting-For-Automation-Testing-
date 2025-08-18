const { expect } = require('@playwright/test');

class BasePage {
  constructor(page, baseURL) {
    this.page = page;
    this.baseURL = baseURL;
    this.ageConfirmButton = page.locator('[data-eid="Home_WithoutLoggedIn/AgeConfirm_btn"]').first();
  }

  async navigate() {
    await this.page.goto(this.baseURL, { waitUntil: 'domcontentloaded' });
    console.log(`Navigated to: ${this.baseURL}`);
  }

  async clickAgeConfirmation(retries = 3, timeout = 5000) {
    let attempt = 0;
    while (attempt < retries) {
      try {
        // Ensure the button is visible and clickable
        await this.ageConfirmButton.waitFor({ state: 'visible', timeout });
        await this.ageConfirmButton.click();
        console.log('Clicked age confirmation button.');
        return;
      } 
      catch (error)
       {
        attempt++;
        console.log(`Attempt ${attempt} failed: ${error.message}`);
      
        if (attempt === retries)
        {
          throw new Error('Failed to click age confirmation button after multiple attempts.');
        }
        // Optionally, wait before retrying
        await this.page.waitForTimeout(1000);
      }
    }
  }
}

module.exports = { BasePage };

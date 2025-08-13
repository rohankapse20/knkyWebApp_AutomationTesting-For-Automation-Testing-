class BasePage {
  constructor(page, baseURL) {
    this.page = page;
    this.baseURL = baseURL;
    this.ageConfirmBtn = this.page.locator('[data-eid="Home_WithoutLoggedIn/AgeConfirm_btn"]');
  }

  async navigate() {
    this.page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    this.page.on('pageerror', err => console.error('PAGE ERROR:', err));
    this.page.on('requestfailed', request => console.warn('REQUEST FAILED:', request.url()));

    if (!this.baseURL) {
      throw new Error('Base URL is not defined');
    }

    await this.page.goto(this.baseURL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
  }
  
async clickAgeConfirmation() {
  try {
    // Wait for the age modal to appear
    await this.page.waitForSelector('#ageWarningModal', { state: 'visible', timeout: 10000 });
    console.log('Age confirmation modal appeared.');

    // Wait for the confirm button inside the modal to be visible and ready
    await this.ageConfirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Age confirmation button is visible, clicking now...');
    
    // Click the confirm button
    await this.ageConfirmBtn.click();

    // Wait for the modal to disappear after click
    await this.page.waitForSelector('#ageWarningModal', { state: 'hidden', timeout: 10000 });
    console.log('Age confirmation modal closed.');

  } catch (err) {
    console.warn('Age confirmation step skipped or failed:', err.message);
  }
}

}

module.exports = { BasePage };  // <-- This is correct export

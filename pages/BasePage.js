class BasePage {
  constructor(page) {
    this.page = page;
    this.ageConfirmButton = page.locator('#age-wraning-close-button');
    this.signinButton = page.locator('[data-eid="Home_WithoutLoggedIn/Signin_btn"]');
  }

  async navigate() {
    await this.page.goto('https://client-test.x3845w4itv8m.knky.co/fresh', { waitUntil: 'domcontentloaded' });
    console.log('Navigated to base URL'); 

try {
  console.log('Waiting for age confirmation button...');
  await this.ageConfirmButton.waitFor({ state: 'visible', timeout: 50000 });
  await this.ageConfirmButton.click();
  console.log('Clicked on age confirmation button.');
}
catch (err) 
{
  throw new Error('Age confirmation button did not appear within 50s..!!!');
}

    // Wait for sign-in button to be visible (page ready)
    await this.signinButton.waitFor({ state: 'visible', timeout: 40000 });
    console.log('Sign-in button is visible. Page fully loaded.');
  }
}

module.exports = { BasePage };

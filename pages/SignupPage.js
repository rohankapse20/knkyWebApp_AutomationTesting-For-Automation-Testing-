class SignupPage {
  constructor(page) {
    this.page = page;

    this.ageConfirmBtn = '#age-wraning-close-button';
    this.signInButton = page.locator("//button[contains(text(), 'Sign In') and contains(@class, 'style_btn-knky-dark')]");
    this.signUpButton = page.locator('//span[contains(text(), "Sign up")]');

    this.emailInput = page.locator('//input[@type="email" or contains(@placeholder, "Email")]');
    this.passwordInput = page.locator('//input[@type="password" or contains(@placeholder, "Password")]');

    this.ageCheckbox = page.locator('//input[@type="checkbox" and contains(@name, "age")]');
    this.createAccountBtn = page.locator('//button[contains(text(), "Create Account")]');

    this.clickUserType = page.locator(`xpath=//p[contains(@class, 'fw-medium') and contains(@class, 'fs-7') and normalize-space(.)="I'm a Creator"]`);
  }

  async navigate() {
    this.page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    this.page.on('pageerror', err => console.error('PAGE ERROR:', err));
    this.page.on('requestfailed', request => console.warn('REQUEST FAILED:', request.url()));

    try {
        await this.page.goto('https://client-test.x3845w4itv8m.knky.co/fresh', {
        waitUntil: 'domcontentloaded',  // less strict than 'load'
        timeout: 120000,                 // 2 minutes timeout
      });

      await this.page.waitForTimeout(1000); // wait for possible modals
    }
     catch (error) {
      console.error('Navigation failed:', error);
      throw error;
    }
  }

  async clickAgeConfirmation() {
    await this.page.click(this.ageConfirmBtn);
  }

  async goToSignup() {
    await this.signInButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.signInButton.click();
  }

  async gotoClickSignUp() {
    await this.signUpButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.signUpButton.scrollIntoViewIfNeeded();
    await this.signUpButton.click();
    await this.emailInput.waitFor({ timeout: 5000 });
  }

  async selectUserType() {
    await this.clickUserType.waitFor({ state: 'visible', timeout: 5000 });
    await this.clickUserType.scrollIntoViewIfNeeded();
    await this.clickUserType.click();
  }

  async fillSignupForm(email, password, acceptAge = true) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (acceptAge) {
      const isChecked = await this.ageCheckbox.isChecked();
      if (!isChecked) {
        await this.ageCheckbox.check();
      }
    }
  }

  async submit() {
    await this.createAccountBtn.click();
  }

  async isAccountCreated() {
    return await this.page.isVisible('text="Welcome"');
  }
}

module.exports = { SignupPage };

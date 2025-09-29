class SignupPage {
  constructor(page) {
    this.page = page;

    // Define the Locators
    this.signupBtn = page.locator('[data-eid="Home_WithoutLoggedIn/Signin_btn"]');
    this.signuplink = page.locator('[data-eid="SignIn/Signup_link"]');
    this.username = page.locator('//input[@placeholder="Enter username" and @type="text" and @min="4"]');
    this.emailField = page.locator('[data-eid="SignUp/Email"]');
    this.passwordField = page.locator('[data-eid="SignUp/Password"]');
    this.ageCheckbox = page.locator('[data-eid="SignUp/Age_confirmation"]');
    this.submitBtn = page.locator('[data-eid="SignUp/Create_account_button"]');

    // Modal button (age confirmation)
    this.ageConfirmBtn = page.locator('#age-wraning-close-button');
    this.modal = page.locator('#signUpModal');  

    // Error message locators
    this.emailError = page.locator('div.error[data-sentry-element="ErrorMessage"]', { hasText: 'Email' });
    this.passwordError = page.locator('div.error[data-sentry-element="ErrorMessage"]', { hasText: 'Password' });
    this.invalidEmailError = page.locator('div.error[data-sentry-element="ErrorMessage"]', { hasText: 'Invalid email' });
    this.passwordUpperError = page.locator('div.error[data-sentry-element="ErrorMessage"]', { hasText: 'Password must contain at least one uppercase character' });
    this.createAccountButton = page.locator('button[data-eid="SignUp/Create_account_button"]');
    this.emailAlreadyUsedPopup = page.locator('.swal2-popup.swal2-error h2#swal2-title', { hasText: 'Email already in use' });

    this.creatorOption = page.locator('div.userTypeSelectionBox[data-eid="SignUp/UserType_creator"]');
  }

  async goToSignup() {
    console.log('Waiting for signup button...');
    await this.signupBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.signupBtn.click();
    console.log('Signup button clicked.');

    console.log('Waiting for signup link...');
    await this.signuplink.waitFor({ state: 'visible', timeout: 10000 });
    await this.signuplink.click();
    console.log('Signup link clicked.');

    console.log('Waiting for email field...');
    await this.emailField.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Email field is visible.');
  }

  async selctUserType() {
    console.log('Selecting the User Type for Signup...');
    await this.creatorOption.waitFor({ state: 'visible', timeout: 10000 });
    await this.creatorOption.click();
  }

  async fillSignupForm(username, email, password) {
    // Fill username if provided
    if (username !== undefined && username !== null) {
      await this.username.waitFor({ state: 'visible', timeout: 5000 });
      await this.username.fill(username);
      console.log('Filled username.');
    }

    // Fill email if provided
    if (email !== undefined && email !== null) {
      await this.emailField.waitFor({ state: 'visible', timeout: 5000 });
      await this.emailField.fill(email);
      console.log('Filled email.');
    }

    // Fill password if provided
    if (password !== undefined && password !== null) {
      await this.passwordField.waitFor({ state: 'visible', timeout: 5000 });
      await this.passwordField.fill(password);
      console.log('Filled password.');
    }
  }

  async selectAgeConfm() {
    await this.ageCheckbox.waitFor({ state: 'attached', timeout: 5000 });
    await this.ageCheckbox.check();
    console.log('Age confirmation checkbox selected.');
  }

  async submit() {
    await this.submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await this.submitBtn.click();
    console.log('Submitted signup form.');
  }
}

module.exports = { SignupPage };

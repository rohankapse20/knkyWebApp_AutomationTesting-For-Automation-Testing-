class SignupPage {
  constructor(page) {
    this.page = page;

    // Define the Locators
    this.signupBtn = page.locator('[data-eid="Home_WithoutLoggedIn/Signin_btn"]');
    this.signuplink = page.locator('[data-eid="SignIn/Signup_link"]');
    this.emailField = page.locator('[data-eid="SignUp/Email"]');
    this.passwordField = page.locator('[data-eid="SignUp/Password"]');
    this.ageCheckbox = page.locator('[data-eid="SignUp/Age_confirmation"]');
    this.submitBtn = page.locator('[data-eid="SignUp/Create_account_button"]');

    // Modal button (age confirmation)
    this.ageConfirmBtn = page.locator('#age-wraning-close-button');
    this.modal = page.locator('#signUpModal');
  }

  // Created methods()

  async goToSignup() {
  
    // Wait and click signup button
    console.log('Waiting for signup button...');
    await this.signupBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.signupBtn.click();
    console.log('Signup button clicked.');
    
    // Wait and click signup link
    console.log('Waiting for signup link...');
    await this.signuplink.waitFor({ state: 'visible', timeout: 10000 });
    await this.signuplink.click();
    console.log('Signup link clicked.');

    // Wait for email field
    console.log('Waiting for email field...');
    await this.emailField.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Email field is visible.');
  }

  async fillSignupForm(email, password) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    console.log('Filled email and password.');
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

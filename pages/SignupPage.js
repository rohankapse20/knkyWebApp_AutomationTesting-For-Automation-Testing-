const { expect } = require('@playwright/test');

class SignupPage {
  constructor(page) {
    this.page = page;

    // Use unique and specific locator — not plain text
    this.signupBtn = page.locator('[data-eid="Home_WithoutLoggedIn/Signin_btn"]');
    this.signuplink = page.locator('[data-eid="SignIn/Signup_link"]');


    this.emailField = page.locator('[data-eid="SignUp/Email"]');
    this.passwordField = page.locator('[data-eid="SignUp/Password"]');
    this.ageCheckbox = page.locator('[data-eid="SignUp/Age_confirmation"]');
    this.submitBtn = page.locator('[data-eid="SignUp/Create_account_button"]');
  }

async goToSignup() {
  await this.signupBtn.waitFor({ state: 'visible', timeout: 5000 });
  await this.signupBtn.click();

  await this.signupBtn.waitFor({ state: 'visible', timeout: 5000 });
  await this.signuplink.click();
  
  await this.emailField.waitFor({ state: 'visible', timeout: 5000 });
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

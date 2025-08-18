const { expect } = require('@playwright/test');

class SigninPage {
  constructor(page) {
    this.page = page;

    this.openSignInBtn = page.locator('[data-eid="Home_WithoutLoggedIn/Signin_btn"]');
    this.emailInput = page.locator('[data-eid="SignIn/Email"]');
    this.passwordInput = page.locator('[eid="SignIn/Password"]');
    this.signInBtn = page.locator('[data-eid="SignIn/SignIn_btn"]');
  }

  async goToSignin() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.openSignInBtn.waitFor({ state: 'visible', timeout: 5000 });
    await this.openSignInBtn.click();
    await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Navigated to Sign In form');
  }

  async fillSigninForm(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    console.log('Filled sign-in form.');
  }

  async signinSubmit() {
    await this.signInBtn.waitFor({ state: 'visible', timeout: 5000 });
    await this.signInBtn.click();
    console.log('Submitted sign-in form.');
  }
}

module.exports = { SigninPage };


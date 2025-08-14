
class SigninPage {
  constructor(page) {
    this.page = page;

    // Locators
    this.openSignInBtn = page.locator('[data-eid="Home_WithoutLoggedIn/Signin_btn"]').first();
    this.emailInput = page.locator('[data-eid="SignIn/Email"]');
    this.passwordInput = page.locator('[eid="SignIn/Password"]');
    this.signInBtn = page.locator('[data-eid="SignIn/SignIn_btn"]');

    // // Adjust this to your actual success message or selector
    // this.successMsg = page.locator('text=Welcome back'); 
  }

  async goToSignin() {
    await this.page.waitForLoadState('networkidle');

    // Wait until the sign-in button is visible and enabled
    await this.openSignInBtn.waitFor({ state: 'visible', timeout: 5000 });
    await this.openSignInBtn.click();
  }

  async fillSigninForm(email, password) {
    await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async signinSubmit() {
    await this.signInBtn.waitFor({ state: 'visible', timeout: 5000 });
    await this.signInBtn.click();
  }

async verifyCompleteProfileShown() {
  const completeProfileBtn = this.page.locator('button.blinking-complete-profile');
  await expect(completeProfileBtn).toBeVisible();
  await expect(completeProfileBtn).toHaveText('Complete Your Profile');
  }
}

module.exports = { SigninPage };  
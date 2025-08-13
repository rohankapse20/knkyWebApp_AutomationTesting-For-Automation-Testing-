class SignupPage {
  constructor(page) {

    this.page = page;
    this.openSignInBtn = this.page.locator('[data-eid="Home_WithoutLoggedIn/Signin_btn"]').first(); // Use first() to locate the element
    this.signUpLink = this.page.locator('[data-eid="SignIn/Signup_link"]').first(); // Use first() to locate the element
    this.emailInput = this.page.locator('[data-eid="SignUp/Email"]');
    this.passwordInput = this.page.locator('[data-eid="SignUp/Password"]');
    this.ageConfirmationCheckbox = this.page.locator('[data-eid="SignUp/Age_confirmation"]');
    this.createAccountBtn = this.page.locator('[data-eid="SignUp/Create_account_button"]');

    
    // //  Define success message locator
    // this.successMsg = this.page.locator('text="Account created"');

     }

  async goToSignup() {
    await this.page.waitForLoadState('networkidle');
    await this.openSignInBtn.click();
    await this.signUpLink.click();
  }

  async fillSignupForm(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async selectAgeConfm()
  {
    await this.ageConfirmationCheckbox.click();
  }

  async submit() {
    await this.createAccountBtn.click();
  }

  
// async isAccountCreated() {
//   await this.page.waitForLoadState('domcontentloaded');
//   // return this.page.url().includes('/dashboard'); // replace with your actual success path
//   }
}

module.exports = { SignupPage };

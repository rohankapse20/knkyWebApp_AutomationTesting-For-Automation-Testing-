class SignupPage {
  constructor(page) {

    this.page = page;
    this.openSignInBtn = this.page.locator('[data-eid="Home_WithoutLoggedIn/Signin_btn"]').first(); // Use first() to locate the element
    this.signUpLink = this.page.locator('[data-eid="SignIn/Signup_link"]').first(); // Use first() to locate the element
    this.emailInput = this.page.locator('[data-eid="SignUp/Email"]');
    this.passwordInput = this.page.locator('[data-eid="SignUp/Password"]');
    this.ageConfirmationCheckbox = this.page.locator('[data-eid="SignUp/Age_confirmation"]');
    this.createAccountBtn = this.page.locator('[data-eid="SignUp/Create_account_button"]');

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
  await this.createAccountBtn.waitFor({ state: 'visible' });
  await this.createAccountBtn.click();

  // Wait for SweetAlert2 welcome message
  const welcomeTitle = this.page.locator('#swal2-title');
  await welcomeTitle.waitFor({ state: 'visible', timeout: 10000 });

  // Assert the message text
  const text = await welcomeTitle.textContent();
  if (text?.trim() !== 'Welcome to Knky')
  {
    throw new Error(`Unexpected welcome message: "${text}"`);
  }

  console.log('Signup confirmation message verified:', text);

  // Close the SweetAlert if needed (click OK button)
  const swalOkBtn = this.page.locator('.swal2-confirm');

  if (await swalOkBtn.isVisible())
  {
    await swalOkBtn.click();
  }
}
  async verifySignupSuccess() {
  const welcomeTitle = this.page.locator('#swal2-title');
  await expect(welcomeTitle).toHaveText('Welcome to Knky');
}
}

module.exports = { SignupPage };

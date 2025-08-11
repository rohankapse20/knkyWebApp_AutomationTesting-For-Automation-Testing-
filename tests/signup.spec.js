const { test, expect } = require('@playwright/test');
const { SignupPage } = require('../pages/SignupPage');
const { getSignupTestData } = require('../utils/readExcel');

// Get test data
const testData = getSignupTestData('./data/testData.xlsx');

for (const { email, password, isValid } of testData) {
  test(`Signup test with email: ${email} (valid: ${isValid})`, async ({ page }) => {
    const signup = new SignupPage(page);

    try {
      await signup.navigate();
      await signup.clickAgeConfirmation();
      await signup.goToSignup();
      await signup.gotoClickSignUp();
      await signup.selectUserType();
      await signup.fillSignupForm(email, password);
      await signup.submit();

      const success = await signup.isAccountCreated();
      expect(success).toBe(isValid);

    } catch (err) {
      console.error('Test failed:', err);
      throw err;
    }
  });
}

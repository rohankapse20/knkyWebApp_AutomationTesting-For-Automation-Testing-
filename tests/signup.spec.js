const { test, expect } = require('@playwright/test');
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SignupPage } = require('../pages/SignupPage');

const baseURL = process.env.BASE_URL || 'https://client-test.x3845w4itv8m.knky.co/fresh';
const signupData = getTestData('./data/testData.xlsx', 'signup_data');

test.describe('Signup Tests', () => {
  signupData.forEach(({ email, password }, index) => {
    test(`Signup user #${index + 1} - ${email}`, async ({ page }) => {
      const base = new BasePage(page, baseURL);
      const signup = new SignupPage(page);

      await base.navigate();
      await base.clickAgeConfirmation();

      await signup.goToSignup();
      await signup.fillSignupForm(email, password);
      await signup.selectAgeConfm();
      await signup.submit();

      // Verify welcome message after signup
      const welcomeTitle = page.locator('#swal2-title');
      await expect(welcomeTitle).toHaveText('Welcome to Knky');

      console.log(`Signup successful for user: ${email}`);
    });
  });
});

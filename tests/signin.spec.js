require('dotenv').config({ path: './.env' });
const { test, expect } = require('@playwright/test');
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SigninPage } = require('../pages/SigninPage');

const signinData = getTestData('./data/testData.xlsx', 'signin_data');

test.use({
  headless: false,
   viewport: { width: 1600, height: 900 },
});

test.describe('Signin Tests', () => {
  signinData.forEach(({ email, password }, index) => {
    test(`Signin user #${index + 1} - ${email}`, async ({ page }) => {
      // Create page objects
      const base = new BasePage(page);  // no need to pass baseURL
      const signin = new SigninPage(page);

      // Navigate to base URL and handle pre-login flows
      await base.navigate();

      //  Perform sign-in actions
      await signin.goToSignin();
      await signin.fillSigninForm(email, password);
      await signin.signinSubmit();

      // Assertion after sign-in
      const completeProfileBtn = page.locator('button.blinking-complete-profile');
      await expect(completeProfileBtn).toBeVisible();
      await expect(completeProfileBtn).toHaveText('Complete Your Profile');

      console.log(`Signin successful for user: ${email}`);
    });
  });
});

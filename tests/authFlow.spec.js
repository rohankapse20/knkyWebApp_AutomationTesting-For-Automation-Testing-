const { test, expect } = require('@playwright/test');
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SignupPage } = require('../pages/SignupPage');
const { SigninPage } = require('../pages/SigninPage');

const baseURL = process.env.BASE_URL || 'https://client-test.x3845w4itv8m.knky.co/fresh';
const testData = getTestData('./data/testData.xlsx', 'signup_data');

test.describe.serial('Signup then Signin Flow', () => {
  testData.forEach(({ email, password }, index) => {
    test(`[#${index + 1}] Signup and Signin :: ${email}`, async ({ page }) => {
      const base = new BasePage(page, baseURL);
      const signup = new SignupPage(page);
      const signin = new SigninPage(page);

      // Navigate and confirm age
      await base.navigate();
      await base.clickAgeConfirmation();

      // Signup flow
      await signup.goToSignup();
      await signup.fillSignupForm(email, password);
      await signup.selectAgeConfm();
      await signup.submit();

      // // Wait for signup success (navigation to home/dashboard)
      // await signup.waitForSignupSuccess();

      // Reload and confirm age again
      await page.reload({ waitUntil: 'domcontentloaded' });
      await base.clickAgeConfirmation();

      // Signin flow
      await signin.goToSignin();
      await signin.fillSigninForm(email, password);
      await signin.signinSubmit();
    });
  });
});

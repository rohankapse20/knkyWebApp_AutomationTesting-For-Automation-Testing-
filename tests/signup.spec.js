require('dotenv').config({ path: './.env' });
const { test, expect } = require('@playwright/test');
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SignupPage } = require('../pages/SignupPage');

const baseURL = process.env.BASE_URL ;
const signupData = getTestData('./data/testData.xlsx', 'signup_data');

// For full screen viewport
test.use({
  viewport: { width: 1600, height: 900 },
  headless: false, // Optional: visible browser
});

test.describe('Signup Tests', () => {
  signupData.forEach(({ email, password }, index) => {
    test(`Signup user #${index + 1} - ${email}`, async ({ page }) => {
      
      // Created object of class 
      const base = new BasePage(page, baseURL);
      const signup = new SignupPage(page);

      
      // call the methods()

      await base.navigate();
      await signup.goToSignup();
      await signup.fillSignupForm(email, password);
      await signup.selectAgeConfm();
      await signup.submit();

      await expect(page.locator('#swal2-title')).toHaveText('Welcome to Knky');
      console.log(`Signup successful for user: ${email}`);

    });
  });
});

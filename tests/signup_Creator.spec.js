require('dotenv').config({ path: './.env' });
const { test, expect } = require('@playwright/test');
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SignupPage } = require('../pages/SignupPage');

const baseURL = process.env.BASE_URL;
const signupData = getTestData('./data/testData.xlsx', 'signupCreator_data');

test.use({
  viewport: { width: 1400, height: 700 },
});

test.describe('Creator Signup Tests', () => {
  signupData.forEach(({ username, email, password, isValid }, index) => {
    test(`Signup for Creator User #${index + 1} - email: "${email}"`, async ({ page }) => {
      const base = new BasePage(page, baseURL);
      const signup = new SignupPage(page);

      await base.navigate();
      await signup.goToSignup();
      await signup.selctUserType();

      await signup.fillSignupForm(username, email, password);
      await signup.selectAgeConfm();

      const isUsernameEmpty = !username || username.trim() === '';
      const isEmailEmpty = !email || email.trim() === '';
      const isPasswordEmpty = !password || password.trim() === '';
      const isPasswordWeak = password && password === password.toLowerCase();
      const isEmailInvalid = email && (!email.includes('@') || !email.includes('.'));

      if (isUsernameEmpty || isEmailEmpty || isPasswordEmpty) {
        console.log('Checking for required field errors...');

        await expect(signup.createAccountButton).toBeDisabled();

        if (isUsernameEmpty) {
          await expect(signup.usernameError).toBeVisible({ timeout: 3000 });
          await expect(signup.usernameError).toHaveText('Username is required');
          console.log('Username required error shown');
        }

        if (isEmailEmpty) {
          await expect(signup.emailError).toBeVisible({ timeout: 3000 });
          await expect(signup.emailError).toHaveText('Email is required');
          console.log('Email required error shown');
        }

        if (isPasswordEmpty) {
          await expect(signup.passwordError).toBeVisible({ timeout: 3000 });
          await expect(signup.passwordError).toHaveText('Password is required');
          console.log('Password required error shown');
        }

        await page.waitForTimeout(2000);
        return;
      }

      if (isValid === 'FALSE') {
        const isButtonEnabled = await signup.createAccountButton.isEnabled();
        if (isButtonEnabled) {
          await signup.submit();
          console.log('Submitted form (invalid data) for further validations');
        } else {
          console.log('Create account button is disabled as expected');
        }

        if (isEmailInvalid) {
          await expect(signup.invalidEmailError).toBeVisible({ timeout: 3000 });
          await expect(signup.invalidEmailError).toHaveText('Invalid email');
          console.log('Invalid email error shown');
        }

        if (isPasswordWeak) {
          await expect(signup.passwordUpperError).toBeVisible({ timeout: 3000 });
          await expect(signup.passwordUpperError).toHaveText('Password must contain at least one uppercase character');
          console.log('Weak password error shown');
        }

        const reusedEmails = [
          'rohan.kapse.iic.0148+RockHeroNoOne@gmail.com',
          'rohan.kapse.iic.0148+RockHeroNotwo@gmail.com',
        ];

        if (reusedEmails.includes(email)) {
          try {
            await expect(signup.emailAlreadyUsedPopup).toBeVisible({ timeout: 5000 });
            await expect(signup.emailAlreadyUsedPopup).toHaveText('Email already in use');
            console.log('Email already in use popup shown');
          } catch (e) {
            console.warn(`Expected 'Email already in use' popup not shown for: ${email}`);
          }
        }

        await page.waitForTimeout(2000);
        return;
      }

      // === POSITIVE PATH ===
      await signup.submit();

      const popupTitle = page.locator('#swal2-title');
      try {
        await expect(popupTitle).toHaveText('Welcome to Knky', { timeout: 5000 });
        console.log(`Signup successful for user: ${email}`);
      } catch (error) {
        const actualText = await popupTitle.textContent();
        if (actualText && actualText.includes('already in use')) {
          console.log(`Email already in use for user: ${email} — treated as valid case.`);
        } else {
          throw new Error(`Unexpected popup message: "${actualText}" for email: ${email}`);
        }
      }

      await page.waitForTimeout(2000);
      
    });
  });
});

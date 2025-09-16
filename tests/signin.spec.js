require('dotenv').config({ path: './.env' });
const { test, expect } = require('@playwright/test');
const { getTestData } = require('../../utils/readExcel');
const { BasePage } = require('../../pages/BasePage');
const { SigninPage } = require('../../pages/SigninPage');

const signinData = getTestData('./data/testData.xlsx', 'signin_data');

// Configure viewport for all tests in this file
test.use({
  viewport: { width: 1400, height: 700 },
});

test.describe('Signin Tests (Positive and Negative Flow)', () => {
  signinData.forEach(({ email, password, isValid }, index) => {
    test(`Signin test #${index + 1} - ${email} - Valid: ${isValid}`, async ({ page }) => {
      const base = new BasePage(page);
      const signin = new SigninPage(page);

      try {
        // Navigate to base URL
        await base.navigate();

        // Go to sign-in form
        await signin.goToSignin();

        // Wait for input fields visible and clear previous data
        await signin.emailInput.waitFor({ state: 'visible', timeout: 7000 });
        await signin.passwordInput.waitFor({ state: 'visible', timeout: 7000 });
        await signin.emailInput.fill('');
        await signin.passwordInput.fill('');

        // Fill sign-in form
        await signin.fillSigninForm(email, password);
        await signin.signInBtn.waitFor({ state: 'visible', timeout: 7000 });

        const positiveTest = isValid?.toString().toLowerCase() === 'true';

        if (positiveTest) {
          // Positive test: submit and check successful sign-in
          await signin.signinSubmit();

          const completeProfileBtn = page.locator('button.blinking-complete-profile');
          await expect(completeProfileBtn).toBeVisible({ timeout: 15000 });
          await expect(completeProfileBtn).toHaveText('Complete Your Profile');

          console.log(`[PASS] Successful sign-in for: ${email}`);
        } else {
          // Negative test: check UI validation or backend error

          console.log(`[INFO] Running negative test for: ${email}`);

          // Wait for possible validation messages or disabled button state
          await page.waitForTimeout(2000);

          // Check if sign-in button is disabled
          const isBtnDisabled = await signin.signInBtn.isDisabled();

          // Check if inputs are empty or invalid (add more logic here if you have validation classes or error hints)
          const emailValue = await signin.emailInput.inputValue();
          const passwordValue = await signin.passwordInput.inputValue();
          const isEmailInvalid = !emailValue || emailValue.length < 3; // customize based on validation rules
          const isPasswordInvalid = !passwordValue || passwordValue.length < 3;

          if (isBtnDisabled || isEmailInvalid || isPasswordInvalid) {
            console.log(`[PASS] Negative test passed for ${email}: Form could not be submitted due to invalid or incomplete inputs.`);
            console.log(`Details — Button Disabled: ${isBtnDisabled}, Email Invalid: ${isEmailInvalid}, Password Invalid: ${isPasswordInvalid}`);
            return; // test passed, skip submission
          }

          // Submit form (button was enabled and inputs looked valid)
          await signin.signinSubmit();

          const errorMsg = page.locator(
            'div.error[data-sentry-element="ErrorMessage"][data-sentry-component="ErrorMes"]'
          );
          await errorMsg.waitFor({ state: 'visible', timeout: 15000 });

          const msgText = (await errorMsg.textContent())?.toLowerCase().trim() || '';

          const isUsernameOrEmailError =
            msgText.includes('incorrect username') ||
            msgText.includes('incorrect email') ||
            msgText.includes('user not found');

          const isPasswordError =
            msgText.includes('wrong password') ||
            msgText.includes('incorrect password') ||
            msgText.includes('invalid password');

          if (isUsernameOrEmailError) {
            console.log(`[PASS] Negative test passed for ${email}: Username or Email incorrect error shown.`);
            console.log(`Error message shown: "${msgText}"`);
          } else if (isPasswordError) {
            console.log(`[PASS] Negative test passed for ${email}: Password incorrect error shown.`);
            console.log(`Error message shown: "${msgText}"`);
          } else {
            throw new Error(`Unexpected error message for ${email}: "${msgText}"`);
          }
        }

      } catch (err) {
        console.error(`[FAIL] Test failed for ${email}:`, err.message);
        throw err;
      }
    });
    
  });
});

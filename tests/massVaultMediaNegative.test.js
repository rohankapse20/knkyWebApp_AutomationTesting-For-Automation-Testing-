const { test, expect } = require('@playwright/test');
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SigninPage } = require('../pages/SigninPage');
const { massVaultMediaNegativeTest_PO } = require('../pages/massVaultMediaNegativeTest_PO');
const {takeScreenshot} = require('../utils/helpers')

require('dotenv').config({ path: './.env' });

const BASE_URL = process.env.BASE_URL;
const CREATOR_EMAIL = process.env.CREATOR_EMAIL;

if (!BASE_URL || !CREATOR_EMAIL) {
  throw new Error("Missing required environment variables: BASE_URL or CREATOR_EMAIL");
}

const chatData = getTestData('./data/testData.xlsx', 'massMsgSend_Data');

test.use({ viewport: { width: 1500, height: 700 } });
// test.setTimeout(12000);

async function handleError(page, index, step, error) {
  console.error(`${step} failed: ${error.message}`);
  if (!page.isClosed()) {
    const screenshotPath = `error_${step.toLowerCase().replace(/\s+/g, '_')}_${index + 1}.png`;
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved: ${screenshotPath}`);
  }
  throw error;
}

test.describe('Negative Test for vault media feature', () => {

// Creator tries to send without selecting vault file
  chatData.forEach((dataRow, index) => {
    test(`Creator tries to send without selecting vault file #${index + 1} - ${dataRow.CreatorEmail}`, async ({ page }) => {
      test.setTimeout(120000);

      const base = new BasePage(page);
      const signin = new SigninPage(page);
      const massVaultMediaNegativeTest = new massVaultMediaNegativeTest_PO(page);

      try {
        console.log('Navigating to login page...');
        await base.navigate();
        await signin.goToSignin();
        await signin.fillSigninForm(dataRow.CreatorEmail, dataRow.CreatorPassword);
        await signin.signinSubmit();
        await massVaultMediaNegativeTest.handleOtpVerification();
      } catch (error) {
        await handleError(page, index, 'Login Flow', error);
      }

      try {
        const welcomePopup = page.locator('text=Welcome Back, PlayfulMistress');
        await expect(welcomePopup).toBeVisible({ timeout: 20000 });
        console.log(`Successfully logged in: ${dataRow.CreatorEmail}`);
      } catch (error) {
        await handleError(page, index, 'Login Confirmation', error);
      }

      try {
        await massVaultMediaNegativeTest.navigateToChat();
        await massVaultMediaNegativeTest.getStartedMassOption();
        console.log('Navigated to massVaultMediaNegativeTest and selected mass message option.');
      } catch (error) {
        await handleError(page, index, 'Navigate to massVaultMediaNegativeTest', error);
      }

      const messageType = dataRow.MessageType?.toLowerCase();
      console.log(`Sending Mass Message for type: ${messageType}`);

      try {
        await massVaultMediaNegativeTest.notsendMassMediaVault({
          type: messageType,
        });
        await page.waitForTimeout(1500);
        console.log('Tried to send mass message without selecting vault/media.');
      } catch (error) {
        await handleError(page, index, 'Send Mass Media Vault', error);
      }

// Test for disabled send button
try {
  await page.waitForTimeout(1000);

  // Call method from PO to get send button locator
  const sendButton = await massVaultMediaNegativeTest.notselectSendDetails();

  const isEnabled = await sendButton.isEnabled();

  if (isEnabled) {
    console.error("Test Failed: Send button is enabled when no media is selected.");
    await takeScreenshot(page, `send_button_should_be_disabled_but_enabled__${index + 1}`);
    throw new Error("Send button should be disabled, but it was enabled.");
  } else {
    console.log("Test Passed: Send button is disabled when no media is selected.");
  }

} catch (error) {
  await handleError(page, index, 'Send button disabled check', error);
}

   });
});

// Creator tries to send with no fans selected
chatData.forEach((dataRow, index) => {
  test(`Creator tries to send with no fans selected #${index + 1} - ${dataRow.CreatorEmail}`, async ({ page }) => {
    test.setTimeout(120000);

    const base = new BasePage(page);
    const signin = new SigninPage(page);
    const massVaultMediaNegativeTest = new massVaultMediaNegativeTest_PO(page);

    try {
      console.log('Navigating to login page...');
      await base.navigate();
      await signin.goToSignin();
      await signin.fillSigninForm(dataRow.CreatorEmail, dataRow.CreatorPassword);
      await signin.signinSubmit();
      await massVaultMediaNegativeTest.handleOtpVerification();
    } catch (error) {
      await handleError(page, index, 'Login Flow', error);
    }

    try {
      const welcomePopup = page.locator('text=Welcome Back, PlayfulMistress');
      await expect(welcomePopup).toBeVisible({ timeout: 20000 });
      console.log(`Successfully logged in: ${dataRow.CreatorEmail}`);
    } catch (error) {
      await handleError(page, index, 'Login Confirmation', error);
    }

    try {
      await massVaultMediaNegativeTest.navigateToChat();
      await massVaultMediaNegativeTest.getStartedMassOption();
      console.log('Navigated to massVaultMediaNegativeTest and selected mass message option.');
    } catch (error) {
      await handleError(page, index, 'Navigate to massVaultMediaNegativeTest', error);
    }

    const messageType = dataRow.MessageType?.toLowerCase();
    console.log(`Sending Mass Message for type: ${messageType}`);

    try {
      await massVaultMediaNegativeTest.sendMassMediaVault({
        type: messageType,
      });
      await page.waitForTimeout(1500);
      console.log('Tried to send mass message without selecting vault/media.');
    } catch (error) {
      await handleError(page, index, 'Send Mass Media Vault', error);
    }

    // Send button should be disabled
    try {
      await page.waitForTimeout(1000);

      const sendButton = await massVaultMediaNegativeTest.selectSendDetails();
      const isEnabled = await sendButton.isEnabled();

      if (isEnabled) {
        console.error("Test Failed: Send button is enabled without fans selected.");
        await takeScreenshot(page, `send_button_unexpected_enabled_${index + 1}`);
        throw new Error('Send button should be disabled, but it was enabled');
      } else {
       // await takeScreenshot(page, `send_button_is_disabled_${index + 1}`);
        console.log("Test Passed: Send button is correctly disabled when no fans are selected.");
      }

    } catch (error) {
      await handleError(page, index, 'Send button disabled check', error);
    }

   });   


});
});
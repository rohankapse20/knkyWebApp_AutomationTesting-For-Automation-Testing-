const { test, expect } = require('@playwright/test');
// const fs = require('fs');
// const path = require('path');
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SigninPage } = require('../pages/SigninPage');
const { ChatPage } = require('../pages/ChatPage');
const {takeScreenshot} = require('../utils/helpers')
const {handleError} = require('../utils/helpers')

require('dotenv').config({ path: './.env' });

// Data from Excel
const chatData = getTestData('./data/testData.xlsx', 'massMsgSend_Data');
const fanData = getTestData('./data/testData.xlsx', 'users_LoginData');

// Ensure environment variables are loaded
const BASE_URL = process.env.BASE_URL;
const CREATOR_EMAIL = process.env.CREATOR_EMAIL;
if (!BASE_URL || !CREATOR_EMAIL) {
  throw new Error("Missing required environment variables: BASE_URL or CREATOR_EMAIL");
}

// Playwright setup
test.use({ viewport: { width: 780, height: 700 } });
test.setTimeout(12000); // Increase timeout for slow tests

// Parallel Test
test.describe.parallel('Mass Vault Media Tests', () => {
// Test for Mass Vault Media Sending for Free to Fans
chatData.forEach((dataRow, index) => {
  test(`Mass Vault Media Send test #${index + 1} - ${dataRow.CreatorEmail}`, async ({ page }) => {
    test.setTimeout(240000);  //  Set timeout to 4 minutes

    const base = new BasePage(page);
    const signin = new SigninPage(page);
    const chat = new ChatPage(page);

    // Login and Send Mass Message Process
    try {
      console.log('Navigating to login page...');
      await base.navigate();
      await signin.goToSignin();
      await signin.fillSigninForm(dataRow.CreatorEmail, dataRow.CreatorPassword);
      await signin.signinSubmit();
      await chat.handleOtpVerification();
    } catch (error) {
      await handleError(page, index, 'Login Flow', error);
    }

    // Confirm successful login
    try {
      const welcomePopup = page.locator('text=Welcome Back, PlayfulMistress');
      await expect(welcomePopup).toBeVisible({ timeout: 20000 });
      console.log(`Successfully logged in: ${dataRow.CreatorEmail}`);
    } catch (error) {
      await handleError(page, index, 'Login Confirmation', error);
    }

    // Navigate to chat
    try {
      await chat.navigateToChat();
      await chat.getStartedMassOption();
      console.log('Navigated to chat and selected mass message option.');
    } catch (error) {
      await handleError(page, index, 'Navigate to Chat', error);
    }

// Send Mass Vault Media Message
const messageType = dataRow.MessageType?.toLowerCase();
console.log(`Sending Mass Message for type: ${messageType}`);
let sentMessage;

try {
  // Step 1 - Sending the Mass Media Vault message
  // Removed content: phrase parameter, so just send type without content
  sentMessage = await chat.sendMassMediaVault({
    type: messageType,
    // content property removed entirely
  });

  await page.waitForTimeout(1500); // Small buffer wait
  console.log('Mass message content sent.');
} catch (error) {
  await handleError(page, index, 'Step 1 - Send Mass Media Vault', error);
}

// Step 2 - Wait for success popup
try {
  console.log('Waiting for success popup...');
  await chat.waitForSuccessPopup({ timeout: 15000 });
  console.log('Success popup appeared.');
} catch (error) {
  await takeScreenshot(page, `error_success_popup_not_visible_${index + 1}`);
  console.error('Success popup did not appear.');
  throw new Error(`Success popup not visible. Screenshot: ${path}`);
}

// Step 3 - Close the success popup
try {
  console.log('Closing success popup...');
  await chat.closeSuccessPopup();
  await page.waitForTimeout(10000); // Wait after 10 Seconds closing
  console.log('Success popup closed.');
} catch (error) {
  await takeScreenshot(page, `error_closing_popup_${index + 1}`);
  throw new Error(`Step 4 - Failed to close success popup. Screenshot: ${path}`);
}

// Step 4 - Verify popup is no longer visible
try {
  console.log('Verifying success popup is not visible...');
  const isStillVisible = await chat.successPopup?.isVisible({ timeout: 3000 });

  if (isStillVisible) {
    const path = `screenshots/error_popup_still_visible_${Date.now()}.png`;
    await page.screenshot({ path, fullPage: true });
    throw new Error(`Step 5 - Success popup still visible after closing. Screenshot: ${path}`);
  }

  console.log(`Test Passed: Vault Media sent successfully by ${dataRow.CreatorEmail}`);
  expect(true).toBeTruthy(); // Pass the test

} catch (error) {

  await takeScreenshot(page, `error_checking_popup_visibility_${index + 1}`);
  throw new Error(`Step 4 - Error verifying popup visibility. Screenshot: ${path}`);
  }

  });
});



// Fan verify the vault media message 
fanData.forEach((fan, index) => {
  test(`Verify Vault Media message visible to Fans after paying the money #${index + 1} - ${fan.FanEmail}`, async ({ browser }) => {

    test.setTimeout(240000);  // Set timeout to 4 minutes

    const context = await browser.newContext();
    const page = await context.newPage();

    const base = new BasePage(page);
    const signin = new SigninPage(page);
    const chat = new ChatPage(page);

    try {
      // Login process for Fan
      await base.navigate();
      await signin.goToSignin();
      await signin.fillSigninForm(fan.FanEmail, fan.FanPassword);
      await signin.signinSubmit();
      await chat.handleOtpVerification();

      const welcomePopup = page.locator('text=Welcome Back,');
      await expect(welcomePopup).toBeVisible({ timeout: 20000 });
      console.log(`Logged in: ${fan.FanEmail}`);

      // Chat Navigation
      await chat.navigateToChat();

      // Go to chat with creator
      await chat.chatWithCreator();

      // Step 3: Unlock Vault Media by paying
      const paymentSuccess = await chat.CreatorChat_MassMedia(fan.FanEmail); // ❗ corrected from receivedVaultMedia()
      if (!paymentSuccess) {
        throw new Error(`Payment failed for fan: ${fan.FanEmail}`);
      }

    // Step 4: Verify Vault Media is received and viewable
    let verificationSuccess = false;
    try {
      verificationSuccess = await chat.receivedVaultMedia(fan.FanEmail);
    } catch (innerErr) {
      console.warn(`Vault media verification encountered an issue for fan: ${fan.FanEmail}`);
      console.warn(innerErr.message);
    }

    if (!verificationSuccess) {
      throw new Error(`Vault media not verified for fan: ${fan.FanEmail}`);
    }

   // Step 5: Confirm success message and close modal (optional UX steps)
try {
  const confirmationText = this.page.locator('text=/message.*unlocked/i');

  // NEW: Wait briefly for modal to appear in fast transitions
  await this.page.waitForTimeout(300);

  await confirmationText.waitFor({ state: 'visible', timeout: 7000 });
  console.log('Success message confirmed.');

  // NEW: Handle quick "Got it!" appearance
  const gotItBtn = this.page.locator('button.swal2-confirm.swal2-styled:has-text("Got it!")');
  try {
    if (await gotItBtn.isVisible({ timeout: 1000 })) {
      await gotItBtn.click();
      console.log('"Got it!" button clicked during confirmation modal.');
    }
  } catch (err) {
    console.warn('"Got it!" button not clicked (optional).');
  }

  const finalCloseBtn = page.locator('button:has-text("Close"), button.swal2-close');
  if (await finalCloseBtn.isVisible()) {
    await finalCloseBtn.click();
    console.log('Final modal closed.');
  } else {
    console.log('No final close button detected.');
  }

} catch (extraStepErr) {
  console.warn('Post-verification modal handling failed:', extraStepErr.message);
}
  console.log(`Test Passed: Fan ${fan.FanEmail} successfully received and viewed Vault Media.`);
  expect(true).toBeTruthy(); // Pass the test
  
} catch (error) {
    await takeScreenshot(page, `error_fan_flow_${index + 1}`);
    throw new Error(`Fan Flow Failed for ${fan.FanEmail}. Screenshot: ${path}`);
    }

});
});
});

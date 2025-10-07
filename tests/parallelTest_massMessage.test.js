const { test, expect } = require('@playwright/test');
// const fs = require('fs');
// const path = require('path');
// const { generateRandomMessage } = require('../utils/helpers');
  
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SigninPage } = require('../pages/SigninPage');
const { ChatPage } = require('../pages/ChatPage');
const {takeScreenshot} = require('../utils/helpers')
const {handleError} = require('../utils/helpers')

// Excel Test Data
const chatData = getTestData('./data/testData.xlsx', 'massMsgSend_Data');
const fanData = getTestData('./data/testData.xlsx', 'users_LoginData');

require('dotenv').config({ path: './.env' });

// Environment Validation
const BASE_URL = process.env.BASE_URL;
const CREATOR_EMAIL = process.env.CREATOR_EMAIL;
if (!BASE_URL || !CREATOR_EMAIL) {
  throw new Error("Missing required environment variables: BASE_URL or CREATOR_EMAIL");
}

// Test Settings
test.use({ viewport: { width: 770, height: 700 } });
test.setTimeout(60000);

// Parallel Tests
test.describe.parallel('Mass Message Send and Fan Verification Tests', () => {
  chatData.forEach((dataRow,index) => {
    test(`Creator Mass Message Send Test #${index + 1} - ${dataRow.CreatorEmail}`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      const base = new BasePage(page);
      const signin = new SigninPage(page);
      const chat = new ChatPage(page);

      try {
        await base.navigate();
        await signin.goToSignin();
        await signin.fillSigninForm(dataRow.CreatorEmail, dataRow.CreatorPassword);
        await signin.signinSubmit();
        await chat.handleOtpVerification();

        const welcomePopup = page.locator('text=Welcome Back, PlayfulMistressgw');
        await expect(welcomePopup).toBeVisible({ timeout: 20000 });
        console.log(`Logged in as Creator: ${dataRow.CreatorEmail}`);

        await chat.navigateToChat();
        await chat.getStartedMassOption();
        console.log('Navigated to chat and selected mass message option.');

        // Send mass message with hardcoded
        const sentMessage = await chat.sendMassMessageFromData({
          type: (dataRow.MessageType || '').toLowerCase(),
          content: 'Hello All My Fans and Subscribers!',  // hardcoded message
        });
        console.log(`Sent message: "${sentMessage}"`);

        await chat.followersActiveSubCheckbox();
        await page.waitForTimeout(1500);

        await chat.selectSendDetails();
        await page.waitForTimeout(1500);

        await chat.waitForSuccessPopup({ timeout: 15000 });
        await chat.closeSuccessPopup();
        console.log('Success popup closed.');

        // Confirm popup is really gone
        await page.waitForTimeout(5000);
        const isStillVisible = await chat.successPopup?.isVisible({ timeout: 2000 }).catch(() => false);
        if (isStillVisible) {
          await takeScreenshot(page, `error_popup_still_visible__${index + 1}`);
          throw new Error(`Success popup still visible after close. Screenshot: ${screenshotPath}`);
        }

        console.log(`Mass message sent successfully by ${dataRow.CreatorEmail}`);
        expect(true).toBeTruthy();

      } catch (error) {
        await handleError(page, index, 'Creator Mass Message Test', error);
      } finally {
        await page.waitForTimeout(3000);
        await page.close();
        await context.close();
      }
    });
  });


  // Fan tests — verify the message received by reading from saved JSON files
  
  fanData.forEach((fan, index) => {
    test(`Fan Message Verification Test #${index + 1} - ${fan.FanEmail}`, async ({ browser }) => {
      test.setTimeout(300_000); // 5 min timeout

      const expectedMessage = 'Hello All My Fans and Subscribers!';  // Hardcoded expected message
      const normalizedExpected = expectedMessage.toLowerCase().replace(/\s+/g, ' ').trim();

      const context = await browser.newContext();
      const page = await context.newPage();

      const base = new BasePage(page);
      const signin = new SigninPage(page);
      const chat = new ChatPage(page);

      try {
        await base.navigate();
        await signin.goToSignin();
        await signin.fillSigninForm(fan.FanEmail, fan.FanPassword);
        await signin.signinSubmit();
        await chat.handleOtpVerification();

        const welcomePopup = page.locator('text=Welcome Back,');
        await expect(welcomePopup).toBeVisible({ timeout: 20000 });
        console.log(`Logged in as Fan: ${fan.FanEmail}`);

        await chat.navigateToChat();
        await chat.chatWithCreator();

        let rawText = '';
        let matched = false;

        // Use the improved getLastReceivedMsgFromCreator with retries and highlighting
        const maxRetries = 10;
        const retryDelay = 3000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Attempt ${attempt}: Checking for message...`);
            rawText = await chat.getLastReceivedMsgFromCreator(expectedMessage);

            // Normalize and compare received text
            const normalizedReceived = rawText.toLowerCase().replace(/\s+/g, ' ').trim();

            if (normalizedReceived === normalizedExpected) {
              console.log(`Message matched on attempt ${attempt}.\nExpected: "${normalizedExpected}"\nReceived: "${normalizedReceived}"`);
              matched = true;
              break;
            } else {
              console.warn(`Message mismatch on attempt ${attempt}.\nExpected: "${normalizedExpected}"\nReceived: "${normalizedReceived}"`);
            }
          } catch (err) {
            console.warn(`Attempt ${attempt} failed: ${err.message}`);
          }

          if (attempt < maxRetries) {
            console.log(`Retrying after ${retryDelay}ms...`);
            await page.waitForTimeout(retryDelay);
          }
        }

        if (!matched) {
          await takeScreenshot(page, `message_not_visible_${index + 1}`);
          throw new Error(`Failed to verify message for fan ${fan.FanEmail} after ${maxRetries} attempts.\nScreenshot: ${screenshotPath}`);
        }

        console.log(`Message verified successfully for fan: ${fan.FanEmail}`);

      } catch (error) {
        console.error(`Test failed for fan ${fan.FanEmail}: ${error.message}`);
        throw error;
      } finally {
        await page.waitForTimeout(3000);
        await page.close();
        await context.close();
      }
    });
  });
});
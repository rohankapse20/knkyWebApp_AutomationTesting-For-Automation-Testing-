import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import 'dotenv/config'; // loads .env automatically

import { generateRandomMessage, takeScreenshot } from '../utils/helpers.js';
import { getTestData } from '../utils/readExcel.js';
import { BasePage } from '../pages/BasePage.js';
import { SigninPage } from '../pages/SigninPage.js';
import { ParallelMassMsgfun_PO } from '../pages/ParallelMassMsgfun_PO.js';

// Environment Validation
const BASE_URL = process.env.BASE_URL;
const CREATOR_EMAIL = process.env.CREATOR_EMAIL;
if (!BASE_URL || !CREATOR_EMAIL) {
  throw new Error('Missing required environment variables: BASE_URL or CREATOR_EMAIL');
}

// Excel Test Data
const chatData = getTestData('./data/testData.xlsx', 'massMsgSend_Data');
const fanData = getTestData('./data/testData.xlsx', 'users_LoginData');

// Test Settings
test.use({ viewport: { width: 770, height: 700 } });
test.setTimeout(60000);

// Error Handler
async function handleError(page, index, step, error) {
  console.error(`${step} failed: ${error.message}`);
  if (!page.isClosed()) {
    const screenshotPath = `error_${step.toLowerCase().replace(/\s+/g, '_')}_${index + 1}.png`;
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved: ${screenshotPath}`);
  }
  throw error;
}

// Parallel Tests
test.describe.parallel('Mass Message Send and Fan Verification Tests', () => {
  
  // Creator Mass Message Send Tests
  chatData.forEach((dataRow, index) => {
    test(`Creator Mass Message Send Test #${index + 1} - ${dataRow.CreatorEmail}`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      const base = new BasePage(page);
      const signin = new SigninPage(page);
      const msgfun = new ParallelMassMsgfun_PO(page);

      try {
        await base.navigate();
        await signin.goToSignin();
        await signin.fillSigninForm(dataRow.CreatorEmail, dataRow.CreatorPassword);
        await signin.signinSubmit();
        await msgfun.handleOtpVerification();

        const welcomePopup = page.locator('text=Welcome Back, PlayfulMistress');
        await expect(welcomePopup).toBeVisible({ timeout: 20000 });
        console.log(`Logged in as Creator: ${dataRow.CreatorEmail}`);

        await msgfun.navigateToChat();
        await msgfun.getStartedMassOption();
        console.log('Navigated to msgfun and selected mass message option.');

        // Main test execution
        const dynamicMessage = generateRandomMessage();

        const sentMessage = await msgfun.sendMassMessageFromData({
          type: (dataRow.MessageType || '').toLowerCase(),
          content: dynamicMessage,  // dynamically generated message
          creatorEmail: dataRow.CreatorEmail // for saving message if needed
        });

        console.log(`Sent message: "${sentMessage}"`);

        await msgfun.followersActiveSubCheckbox();
        await page.waitForTimeout(1500);

        await msgfun.selectSendDetails();
        await page.waitForTimeout(1500);

        await msgfun.waitForSuccessPopup({ timeout: 15000 });
        await msgfun.closeSuccessPopup();
        console.log('Success popup closed.');

        // Confirm popup is really gone
        await page.waitForTimeout(5000);
        const isStillVisible = await msgfun.successPopup?.isVisible({ timeout: 2000 }).catch(() => false);
        if (isStillVisible) {
          await takeScreenshot(page, `error_popup_still_visible__${index + 1}`);
          throw new Error('Success popup still visible after close.');
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

  // Fan Message Verification Tests
  fanData.forEach((fan, index) => {
    test(`Fan Message Verification Test #${index + 1} - ${fan.FanEmail}`, async ({ browser }) => {
      test.setTimeout(300_000); // 5 min timeout

      // Load expected message from sentMessages.json based on the fan's linked creator
      const sentMessagesPath = path.resolve(__dirname, '../../test-data/sentMessages.json');
      if (!fs.existsSync(sentMessagesPath)) {
        throw new Error(`sentMessages.json file not found at path: ${sentMessagesPath}`);
      }

      const sentMessages = JSON.parse(fs.readFileSync(sentMessagesPath, 'utf-8'));
      const creatorEmail = fan.CreatorEmail;

      if (!sentMessages[creatorEmail]) {
        throw new Error(`No message found for creator: ${creatorEmail} in sentMessages.json`);
      }

      const expectedMessage = sentMessages[creatorEmail].message;
      const normalizedExpected = expectedMessage.toLowerCase().replace(/\s+/g, ' ').trim();

      const context = await browser.newContext();
      const page = await context.newPage();

      const base = new BasePage(page);
      const signin = new SigninPage(page);
      const msgfun = new ParallelMassMsgfun_PO(page);

      try {
        await base.navigate();
        await signin.goToSignin();
        await signin.fillSigninForm(fan.FanEmail, fan.FanPassword);
        await signin.signinSubmit();
        await msgfun.handleOtpVerification();

        const welcomePopup = page.locator('text=Welcome Back,');
        await expect(welcomePopup).toBeVisible({ timeout: 20000 });
        console.log(`Logged in as Fan: ${fan.FanEmail}`);

        await msgfun.navigateToChat();
        await msgfun.chatWithCreator();

        let rawText = '';
        let matched = false;

        const maxRetries = 10;
        const retryDelay = 3000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Attempt ${attempt}: Checking for message...`);
            rawText = await msgfun.getLastReceivedMsgFromCreator(expectedMessage);

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
          throw new Error(`Failed to verify message for fan ${fan.FanEmail} after ${maxRetries} attempts.`);
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

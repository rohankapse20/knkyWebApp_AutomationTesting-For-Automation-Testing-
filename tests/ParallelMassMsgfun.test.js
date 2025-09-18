import path from 'path';
import fs from 'fs';
import { test, expect } from '@playwright/test';

const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SigninPage } = require('../pages/SigninPage');
const { ParallelMassMsgfun_PO } = require('../pages/ParallelMassMsgfun_PO');

const { takeScreenshot } = require('../utils/helpers');
const { generateDynamicMessage } = require('../utils/helpers');
const { handleError } = require('../utils/helpers');

// Excel Test Data
const chatData = getTestData('./data/testData.xlsx', 'massMsgSend_Data');
const fanData = getTestData('./data/testData.xlsx', 'users_LoginData');
// Shared file path (must match your writeSentMessageSafely directory)
const messagesFilePath = path.resolve(__dirname, '../../shared-test-data/sentMessages.json');

require('dotenv').config({ path: './.env' });
const { waitForFileUpdate } = require('../utils/fileUtils');


// Environment Validation
const BASE_URL = process.env.BASE_URL;
const CREATOR_EMAIL = process.env.CREATOR_EMAIL;
if (!BASE_URL || !CREATOR_EMAIL) {
  throw new Error("Missing required environment variables: BASE_URL or CREATOR_EMAIL");
}

// Set the Screensize and test time
test.use({ viewport: { width: 770, height: 700 } });
test.setTimeout(60000);

// Parallel Tests
test.describe.parallel('Mass Message Send and Fan Verification Tests', () => {
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

        const dynamicMessage = generateDynamicMessage();

        const sentMessage = await msgfun.sendMassMessageFromData({
          type: (dataRow.MessageType || '').toLowerCase(),
          content: dynamicMessage,
          creatorEmail: dataRow.CreatorEmail,
        });

        console.log(`Sent dynamic message: "${sentMessage}"`);

        await msgfun.followersActiveSubCheckbox();
        await page.waitForTimeout(1500);

        await msgfun.selectSendDetails();
        await page.waitForTimeout(1500);

        await msgfun.waitForSuccessPopup({ timeout: 15000 });
        await msgfun.closeSuccessPopup();
        console.log('Success popup closed.');

        await page.waitForTimeout(5000);
        const isStillVisible = await msgfun.successPopup?.isVisible({ timeout: 2000 }).catch(() => false);
        if (isStillVisible) {
          await takeScreenshot(page, `error_popup_still_visible__${index + 1}`);
          throw new Error(`Success popup still visible after close.`);
        }

        console.log(`Mass message sent successfully by ${dataRow.CreatorEmail}`);
        expect(true).toBeTruthy();

      } catch (error) {
        await handleError(page, index, 'Creator Mass Message Test', error);
      } finally {
        
        await page.close();
        await context.close();
      }
    });
  });


fanData.forEach((fan, index) => {
    test(`Fan Message Verification Test #${index + 1} - ${fan.FanEmail}`, async ({ browser }) => {
      test.setTimeout(300_000); // 5 minutes timeout per test

      const context = await browser.newContext();
      const page = await context.newPage();

      const base = new BasePage(page);
      const signin = new SigninPage(page);
      const msgfun = new ParallelMassMsgfun_PO(page);

      const defaultCreatorEmail = 'rohankapse520@gmail.com'
      const testId = `FanTest#${index + 1}-${fan.FanEmail}`;
      const creatorEmail = (fan.CreatorEmail || defaultCreatorEmail).trim().toLowerCase();

      try {
        // Step 1: Navigate and login as fan
        await base.navigate();
        await signin.goToSignin();
        await signin.fillSigninForm(fan.FanEmail, fan.FanPassword);
        await signin.signinSubmit();
        await msgfun.handleOtpVerification();

        const welcomePopup = page.locator('text=Welcome Back,');
        await expect(welcomePopup).toBeVisible({ timeout: 20000 });
        console.log(`[${testId}] Logged in as fan`);

        // Step 2: Get previous message (if any)
        const previousMessage = fs.existsSync(messagesFilePath)
          ? JSON.parse(fs.readFileSync(messagesFilePath, 'utf-8'))?.[creatorEmail]?.message ?? ''
          : '';

        console.log(`[${testId}] Waiting for Creator to send new message...`);
        // Step 3: Wait for updated message in shared file (polling)
        const latestMessage = await waitForFileUpdate(creatorEmail, previousMessage, 60, 3000); // up to 3 minutes
        console.log(`[${testId}] Latest message found: "${latestMessage}"`);

        // Step 4: Navigate to chat with creator
        await msgfun.navigateToChat();
        await msgfun.chatWithCreator();

        // Step 5: Verify the received message in chat UI with retries
        let matched = false;
        const maxRetries = 3;
        const retryDelay = 3000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`[${testId}] Attempt ${attempt} to verify message in chat UI`);
            await msgfun.getLastReceivedMsgFromCreator(latestMessage, testId);
            matched = true;
            break;
          } catch (err) {
            console.warn(`[${testId}] Verification attempt ${attempt} failed: ${err.message}`);
            if (attempt < maxRetries) {
              await page.waitForTimeout(retryDelay);
            }
          }
        }

        if (!matched) {
          const screenshotDir = path.resolve(__dirname, '../../screenshots');
          if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

          const safeEmail = creatorEmail.replace(/[@.]/g, '_');
          const screenshotName = `message_not_matched_${safeEmail}_${Date.now()}.png`;
          await page.screenshot({ path: path.join(screenshotDir, screenshotName), fullPage: true });

          throw new Error(`[${testId}] Message verification failed after ${maxRetries} attempts. Screenshot saved: ${screenshotName}`);
        }

        console.log(`[${testId}] Message verified successfully`);
      } catch (error) {
        console.error(`[${testId}] Test failed: ${error.message}`);
        throw error;
      } finally {
        await page.waitForTimeout(3000);
        await page.close();
        await context.close();
      }
    });
  });
});

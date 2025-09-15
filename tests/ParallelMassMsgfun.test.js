import { waitForFileUpdate } from '../utils/fileUtils';
import path from 'path';
import fs from 'fs';

const { test, expect } = require('@playwright/test');
const { generateDynamicMessage } = require('../utils/helpers');
const defaultCreatorEmail = 'rohankapse520@gmail.com';
const messagesFilePath = path.resolve(__dirname, '../../test-data/sentMessages.json');
  
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SigninPage } = require('../pages/SigninPage');
const { ParallelMassMsgfun_PO} = require('../pages/ParallelMassMsgfun_PO');
const {takeScreenshot} = require('../utils/helpers')

require('dotenv').config({ path: './.env' });

// Environment Validation
const BASE_URL = process.env.BASE_URL;
const CREATOR_EMAIL = process.env.CREATOR_EMAIL;
if (!BASE_URL || !CREATOR_EMAIL) {
  throw new Error("Missing required environment variables: BASE_URL or CREATOR_EMAIL");
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

  chatData.forEach((dataRow,index) => {
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

        // Import or define generateDynamicMessage
        const dynamicMessage = generateDynamicMessage();

        const sentMessage = await msgfun.sendMassMessageFromData({
        type: (dataRow.MessageType || '').toLowerCase(),
        content: dynamicMessage,
        creatorEmail: dataRow.CreatorEmail  // make sure this is set correctly
        });

        console.log(`Sent dynamic message: "${sentMessage}"`);

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


// Begin fan tests
fanData.forEach((fan, index) => {
  test(`Fan Message Verification Test #${index + 1} - ${fan.FanEmail}`, async ({ browser }) => {
    test.setTimeout(300_000); // 5 minutes timeout

    const context = await browser.newContext();
    const page = await context.newPage();

    const base = new BasePage(page);
    const signin = new SigninPage(page);
    const msgfun = new ParallelMassMsgfun_PO(page);

    const testId = `FanTest#${index + 1}-${fan.FanEmail}`;
    const creatorEmail = (fan.CreatorEmail || defaultCreatorEmail).trim().toLowerCase();

    try {
      // Step 1: Get previously known message
      const previousMessage = fs.existsSync(messagesFilePath)
        ? JSON.parse(fs.readFileSync(messagesFilePath, 'utf-8'))?.[creatorEmail]?.message ?? ''
        : '';

      // Step 2: Wait for creator to send new message
      console.log(`[${testId}] ⏳ Waiting 10 seconds to allow creator to send message...`);
      await new Promise((resolve) => setTimeout(resolve, 10_000));

      // Step 3: Wait for message to update
      console.log(`[${testId}] ⏳ Checking for updated message from ${creatorEmail}...`);
      const latestMessage = await waitForFileUpdate(creatorEmail, previousMessage, 20, 3000);
      console.log(`[${testId}] ✅ Latest message found: "${latestMessage}"`);

      // Step 4: Login as fan
      await base.navigate();
      await signin.goToSignin();
      await signin.fillSigninForm(fan.FanEmail, fan.FanPassword);
      await signin.signinSubmit();
      await msgfun.handleOtpVerification();

      const welcomePopup = page.locator('text=Welcome Back,');
      await expect(welcomePopup).toBeVisible({ timeout: 20000 });
      console.log(`[${testId}] ✅ Logged in as fan`);

      // Step 5: Navigate to chat
      await msgfun.navigateToChat();
      await msgfun.chatWithCreator();

      // Step 6: Try matching the received message
      let matched = false;
      const maxRetries = 10;
      const retryDelay = 3000;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[${testId}] 🔄 Attempt ${attempt}: Checking message from creator`);
          await msgfun.getLastReceivedMsgFromCreator(latestMessage, testId);
          matched = true;
          break;
        } catch (err) {
          console.warn(`[${testId}] ⚠️ Attempt ${attempt} failed: ${err.message}`);
          if (attempt < maxRetries) {
            await page.waitForTimeout(retryDelay);
          }
        }
      }

      // Step 7: If not matched, capture screenshot
      if (!matched) {
        const screenshotDir = path.resolve(__dirname, '../../screenshots');
        if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

        const safeEmail = creatorEmail.replace(/[@.]/g, '_');
        const screenshotName = `message_not_matched_${safeEmail}_${Date.now()}.png`;
        await page.screenshot({ path: path.join(screenshotDir, screenshotName), fullPage: true });

        throw new Error(`[${testId}] ❌ Message mismatch. Screenshot saved: ${screenshotName}`);
      }

      console.log(`[${testId}] ✅ Message verified successfully`);

    } catch (error) {
      console.error(`[${testId}] ❌ Test failed: ${error.message}`);
      throw error;
    } finally {
      try {
        await page.waitForTimeout(3000);
        await page.close();
        await context.close();
      } catch (finalError) {
        console.warn(`[${testId}] ⚠️ Error during cleanup: ${finalError.message}`);
      }
    }
  });

});
});

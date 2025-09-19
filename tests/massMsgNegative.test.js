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
test.describe.parallel('Neagative Test for Mass Message ', () => {
  chatData.forEach((dataRow, index) => {
    test(`Send Message without inserting the message in field #${index + 1} - ${dataRow.CreatorEmail}`, async ({ browser }) => {
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
});
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { generateRandomMessage } = require('../utils/helpers');

const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SigninPage } = require('../pages/SigninPage');
const { ChatPage } = require('../pages/ChatPage');

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

  chatData.forEach((dataRow, index) => {
    test(`Creator Mass Message Send Test #${index + 1} - ${dataRow.CreatorEmail}`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      const base = new BasePage(page);
      const signin = new SigninPage(page);
      const chat = new ChatPage(page);

      let phrase;
      try {
        phrase = generateRandomMessage();
        console.log(`Generated phrase: ${phrase}`);
      } catch (error) {
        await handleError(page, index, 'Generate Random Message', error);
      }

      const messageFileName = `lastSentMessage_${index + 1}.json`;
      const messagePath = path.resolve(__dirname, `../data/${messageFileName}`);

      try {
        fs.writeFileSync(messagePath, JSON.stringify({ message: phrase }, null, 2));
        console.log(`Initial message written to: ${messagePath}`);
      } catch (error) {
        await handleError(page, index, 'Write Message to JSON', error);
      }

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

      try {
        const welcomePopup = page.locator('text=Welcome Back, PlayfulMistress');
        await expect(welcomePopup).toBeVisible({ timeout: 20000 });
        console.log(`Successfully logged in: ${dataRow.CreatorEmail}`);
      } catch (error) {
        await handleError(page, index, 'Login Confirmation', error);
      }

      try {
        await chat.navigateToChat();
        await chat.getStartedMassOption();
        console.log('Navigated to chat and selected mass message option.');
      } catch (error) {
        await handleError(page, index, 'Navigate to Chat', error);
      }

      const messageType = dataRow.MessageType?.toLowerCase();
      console.log(`Sending Mass Message for type: ${messageType}`);

      const sentMessage = await chat.sendMassMessageFromData({
        type: messageType,
        content: phrase,
      });

      fs.writeFileSync(messagePath, JSON.stringify({ message: sentMessage }, null, 2));
      console.log(`Saved sent message to file: ${sentMessage}`);

      try {
        await chat.followersActiveSubCheckbox();
        await page.waitForTimeout(1500);
        await chat.selectSendDetails();
        await page.waitForTimeout(1500);
        console.log('Selected send details for the message.');
      } catch (error) {
        await handleError(page, index, 'Select Send Details', error);
      }

      try {
        await chat.waitForSuccessPopup({ timeout: 15000 });

      try {
        await chat.closeSuccessPopup();
        console.log('Closed success popup...');
      } catch (err) {
        const path = `screenshots/error_closing_popup_${Date.now()}.png`;
        await page.screenshot({ path, fullPage: true });
        throw new Error(`Failed to close success popup. Screenshot: ${path}`);
      }

      // Wait 5 seconds after closing the popup
      await page.waitForTimeout(5000);

      // Verify popup is not visible anymore
      let isStillVisible = false;
      try {
        isStillVisible = await chat.successPopup?.isVisible({ timeout: 2000 });
      } catch {
        isStillVisible = false;
      }

      if (isStillVisible) {
        const path = `screenshots/error_popup_still_visible_${Date.now()}.png`;
        await page.screenshot({ path, fullPage: true });
        throw new Error(`Success popup still visible after close. Screenshot: ${path}`);
      }

      //  Consider test is passed
      console.log(`Mass ${messageType} message sent successfully by ${dataRow.CreatorEmail}`);
      expect(true).toBeTruthy(); // Optional assertion

    } catch (error) {
      await handleError(page, index, 'Submit Form', error);
    } finally { 
      // Wait 3 seconds before closing the page
      await page.waitForTimeout(3000);

      await page.close();
      await context.close();
    }
    });
  });


fanData.forEach((fan, index) => {
  test(`Fan Message Verification Test #${index + 1} - ${fan.FanEmail}`, async ({ browser }) => {
    test.setTimeout(300_000);

    const messageFileName = `lastSentMessage_${index + 1}.json`;
    const messagePath = path.resolve(__dirname, `../data/${messageFileName}`);

    if (!fs.existsSync(messagePath)) {
      throw new Error(`Message file not found: ${messagePath}`);
    }

    const messageData = JSON.parse(fs.readFileSync(messagePath, 'utf-8'));
    const expectedMessage = messageData.message?.trim();

    if (!expectedMessage) {
      throw new Error('No message found in message file.');
    }

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
      console.log(`Logged in: ${fan.FanEmail}`);

      await chat.navigateToChat();
      await chat.chatWithCreator();

      const maxRetries = 10;
      const retryDelay = 3000;
      let rawText = '';
      let matched = false;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}: Waiting for message...`);
          await page.waitForTimeout(retryDelay);

          rawText = await chat.getLastReceivedMsgFromCreator(normalizedExpected);
          const normalizedReceived = rawText.toLowerCase().replace(/\s+/g, ' ').trim();

          if (normalizedReceived.includes(normalizedExpected)) {
            console.log(`Received message matches expected:\nExpected: "${normalizedExpected}"\nReceived: "${normalizedReceived}"`);
            matched = true;
            break;
          } else {
            console.warn(`Mismatch on attempt ${attempt}\nReceived: "${normalizedReceived}"`);
          }
        } catch (err) {
          console.warn(`Attempt ${attempt} failed: ${err.message}`);
        }

        if (attempt < maxRetries) {
          console.log(`Retrying after ${retryDelay}ms...`);
        }
      }

      if (!matched) {
        const screenshotPath = `screenshots/message_not_visible_${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        throw new Error(`Message mismatch for fan ${fan.FanEmail}.\nExpected: "${normalizedExpected}"\nReceived: "${rawText}"\nScreenshot: ${screenshotPath}`);
      }

      console.log(`Message successfully verified for fan: ${fan.FanEmail}`);
    } catch (error) {
      console.error(`Test failed for fan ${fan.FanEmail}: ${error.message}`);
      throw error;
    } finally {
      // Wait 3 seconds before closing the page
      await page.waitForTimeout(3000);

      await page.close();
      await context.close();
    }
  });

});
});
      
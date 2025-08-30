require('dotenv').config({ path: './.env' }); // Load environment variables from .env

const { test, expect } = require('@playwright/test');
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SigninPage } = require('../pages/SigninPage');
const { ChatPage } = require('../pages/ChatPage');
const { generatePhrase } = require('../utils/helpers');

const path = require('path');
const fs = require('fs');

// Data from Excel
const chatData = getTestData('./data/testData.xlsx', 'massMsgSend_Data');
const fanData = getTestData('./data/testData.xlsx', 'users_LoginData');

// Playwright setup
test.use({ viewport: { width: 1600, height: 900 } });
test.setTimeout(60000); // Increase timeout for slow tests

// Helper function to handle error logging and screenshot
async function handleError(page, index, step, error) {
  console.error(`${step} failed: ${error.message}`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = `error_${step.toLowerCase().replace(/\s+/g, '_')}_${index + 1}_${timestamp}.png`;
  if (!page.isClosed()) {
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved: ${screenshotPath}`);
  }
  throw error; // Rethrow the error to mark the test as failed
}

// Test Loop
for (const [index, dataRow] of chatData.entries()) {
  test(`Mass message test #${index + 1} - ${dataRow.CreatorEmail}`, async ({ page }) => {
    const base = new BasePage(page);
    const signin = new SigninPage(page);
    const chat = new ChatPage(page);

    // Generate dynamic message
    let phrase;
    try {
      phrase = await generatePhrase();
      console.log(`Generated phrase: ${phrase}`);
    } catch (error) {
      await handleError(page, index, 'Generate Phrase', error);
    }

    // Write message to JSON for fan verification
    const messagePath = path.resolve(__dirname, '../data/lastSentMessage.json');
    try {
      fs.writeFileSync(messagePath, JSON.stringify({ message: phrase }, null, 2));
      console.log(`Message written to: ${messagePath}`);
    } catch (error) {
      await handleError(page, index, 'Write Message to JSON', error);
    }

    // Try login flow
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

    // Try navigating to chat
    try {
      await chat.navigateToChat();
      await chat.getStartedMassOption();
      console.log('Navigated to chat and selected mass message option.');
    } catch (error) {
      await handleError(page, index, 'Navigate to Chat', error);
    }

    // Send Mass Message
    const messageType = dataRow.MessageType?.toLowerCase();
    console.log(`Sending Mass Message for ${messageType}`);
    try {
      await chat.sendMassMessageFromData({
        type: messageType,
        content: phrase, // Use generated phrase as message content
      });
    } catch (error) {
      await handleError(page, index, 'Send Mass Message', error);
    }

    // Select send details
    try {
      await chat.selectSendDetails();
      console.log('Selected send details for the message.');
    } catch (error) {
      await handleError(page, index, 'Select Send Details', error);
    }

    // Submit and verify success
    try {
      await chat.submitForm();
      await chat.waitForSuccessPopup();
      await chat.closeSuccessPopup();
      console.log(`Mass ${messageType} message sent successfully by ${dataRow.CreatorEmail}`);
      expect(true).toBeTruthy(); // Test passes if we get here
    } catch (error) {
      await handleError(page, index, 'Submit Form', error);
    }
  });
}


const delays = [0, 2000, 5000, 7000, 10000];

fanData.forEach((fan, index) => {
  test(`Verify message visible to fan #${index + 1} - ${fan.FanEmail}`, async ({ browser }) => {
    test.setTimeout(180_000); // 3 minutes

    const messagePath = path.resolve(__dirname, '../data/lastSentMessage.json');
    const messageData = JSON.parse(fs.readFileSync(messagePath, 'utf-8'));
    const expectedMessage = messageData.message?.trim();

    if (!expectedMessage) {
      throw new Error('No message found in lastSentMessage.json.');
    }

    const normalizedExpected = expectedMessage.toLowerCase().replace(/\s+/g, ' ').trim();
    let messageFound = false;

    for (let attempt = 0; attempt < delays.length; attempt++) {
      const delay = delays[attempt];
      console.log(`\n Attempt #${attempt + 1} - waiting ${delay / 1000}s...`);
      if (delay > 0) await new Promise(res => setTimeout(res, delay));

      let context;
      try {
        context = await browser.newContext();
        const page = await context.newPage();

        const base = new BasePage(page);
        const signin = new SigninPage(page);
        const chat = new ChatPage(page);

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

        const receivedMessage = await chat.getLastReceivedMsgFromCreator(expectedMessage);
        const normalizedReceived = receivedMessage.toLowerCase().replace(/\s+/g, ' ').trim();

        if (normalizedReceived.includes(normalizedExpected)) {
          console.log(`Message found on attempt #${attempt + 1} after ${delay / 1000}s delay`);
          console.log(`Test passed for fan ${fan.FanEmail}`);
          messageFound = true;
          break;
        }

      } catch (error) {
        console.warn(`Attempt #${attempt + 1} failed: ${error.message}`);
      } finally {
        if (context) await context.close();
      }
    }

    if (!messageFound) {
      const failContext = await browser.newContext();
      const failPage = await failContext.newPage();
      const screenshotPath = `screenshots/error_verify_message_fan_${index + 1}_${Date.now()}.png`;
      await failPage.goto('about:blank');
      await failPage.screenshot({ path: screenshotPath, fullPage: true });
      await failContext.close();

      throw new Error(`Message not received after all retries for fan ${fan.FanEmail}`);
    }
  });
});

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { generateRandomMessage } = require('../utils/helpers');
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SigninPage } = require('../pages/SigninPage');
const { ChatPage } = require('../pages/ChatPage');

require('dotenv').config({ path: './.env' });

// Ensure environment variables are loaded
const BASE_URL = process.env.BASE_URL;
const CREATOR_EMAIL = process.env.CREATOR_EMAIL;
if (!BASE_URL || !CREATOR_EMAIL) {
  throw new Error("Missing required environment variables: BASE_URL or CREATOR_EMAIL");
}

// Data from Excel
const chatData = getTestData('./data/testData.xlsx', 'massMsgSend_Data');
const fanData = getTestData('./data/testData.xlsx', 'users_LoginData');

// Playwright setup and test timeout
test.use({ viewport: { width: 780, height: 700 } });
test.setTimeout(60000); 

// Helper function to handle error logging and screenshot
async function handleError(page, index, step, error) {
  console.error(`${step} failed: ${error.message}`);
  // Capture a screenshot in case of an error
  if (!page.isClosed()) {
    const screenshotPath = `error_${step.toLowerCase().replace(/\s+/g, '_')}_${index + 1}.png`;
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved: ${screenshotPath}`);
  }
  throw error; // Rethrow the error to mark the test as failed
}

// Parallel Test
test.describe.parallel('Mass Message Send and verify by Fan Tests', () => {
// Test Loop for Mass Message Sending for Free to Fans
// Free Messages

chatData.forEach((dataRow, index) => {
  test(`Mass message send test #${index + 1} - ${dataRow.CreatorEmail}`, async ({ page }) => {
    const base = new BasePage(page);
    const signin = new SigninPage(page);
    const chat = new ChatPage(page);

    let phrase;
    try {
      phrase = generateRandomMessage(); // Generate random message
      console.log(`Generated phrase: ${phrase}`);
    } catch (error) {
      await handleError(page, index, 'Generate Random Message', error);
    }

    // Write message to JSON for fan verification
    const messagePath = path.resolve(__dirname, '../data/lastSentMessage.json');
    try {
      fs.writeFileSync(messagePath, JSON.stringify({ message: phrase }, null, 2));
      console.log(`Message written to: ${messagePath}`);
    } catch (error) {
      await handleError(page, index, 'Write Message to JSON', error);
    }

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

// Send Mass Message
const messageType = dataRow.MessageType?.toLowerCase();
console.log(` Sending Mass Message for type: ${messageType}`);
let sentMessage = '';
try {
  sentMessage = await chat.sendMassMessageFromData({
    type: messageType,
    content: phrase, // Use generated phrase as message content
  });
  await page.waitForTimeout(1000); // Buffer wait after typing message
} catch (error) {
  await handleError(page, index, 'Send Mass Message', error);
}

// Select send details and submit
try {
  await chat.selectSendDetails();
  console.log('Selected send details for the message.');
} catch (error) {
  await handleError(page, index, 'Select Send Details', error);
}

// Submit the Mass message form
try {
  
  // Wait for success popup to appear
  await chat.waitForSuccessPopup({ timeout: 15000 });

  // Try closing the success popup
  try {
    await chat.closeSuccessPopup();
    console.log('Closed success popup');
  } catch (err) {
    const path = `screenshots/error_closing_popup_${Date.now()}.png`;
    await page.screenshot({ path, fullPage: true });
    throw new Error(`Failed to click close on success popup. Screenshot: ${path}`);
  }

  // Wait 2 seconds after closing
  await page.waitForTimeout(2000);

  // Explicitly check if popup is still visible
  let isStillVisible = false;
  try {
    isStillVisible = await chat.successPopup?.isVisible({ timeout: 3000 });
  } catch {
    isStillVisible = false; // popup likely not found anymore
  }

  if (isStillVisible) {
    const path = `screenshots/error_popup_still_visible_${Date.now()}.png`;
    await page.screenshot({ path, fullPage: true });
    throw new Error(`Success popup still visible after close. Screenshot: ${path}`);
  }

  // Test passed
  console.log(`Mass ${messageType} message sent successfully by ${dataRow.CreatorEmail}`);
  expect(true).toBeTruthy();

} catch (error) {
  await handleError(page, index, 'Submit Form', error);
}
 
  });
});



fanData.forEach((fan, index) => {
  test(`Verify message visible to fan #${index + 1} - ${fan.FanEmail}`, async ({ browser }) => {
  
    test.setTimeout(300_000); // 5 minutes

    const messagePath = path.resolve(__dirname, '../data/lastSentMessage.json');
    const messageData = JSON.parse(fs.readFileSync(messagePath, 'utf-8'));
    const expectedMessage = messageData.message?.trim();

    if (!expectedMessage) {
      throw new Error('No message found in lastSentMessage.json.');
    }

const normalizedExpected = expectedMessage.toLowerCase().replace(/\s+/g, ' ').trim();
const delays = [0, 2000, 5000, 7000, 10000, 12000, 15000, 17000, 20000, 25000]; // Ten Retry intervals
const retryLimit = delays.length;

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

 // Assuming this is inside your fan test function async context

  await chat.navigateToChat();
  await chat.chatWithCreator();

// let messageFound = false;
// let messagePartiallyVisible = false;
// let timeTaken = 0;

  let rawText = '';

      try {
        
        console.log("Waiting for 20 seconds before fallback retry...");
        await this.page.waitForTimeout(20000);
        
        rawText = await chat.getLastReceivedMsgFromCreator(expectedMessage);
        console.log(`Received message matches expected: "${rawText}"`);
        console.log(`Test passed for fan ${fan.FanEmail}: Message visible.`);
      } catch (err) {
        const screenshotPath = `screenshots/message_not_visible_${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        throw new Error(`Message not visible or fully loaded for fan ${fan.FanEmail}: ${err.message}`);
      }

    } catch (error) {
      console.error(`Error in test for fan ${fan.FanEmail}: ${error.message}`);
      throw error;
    } finally {
      await page.close();
      await context.close();
    }

  });
});
});


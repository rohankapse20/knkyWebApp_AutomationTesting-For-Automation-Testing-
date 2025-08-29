const { test, expect } = require('@playwright/test');
const { getTestData } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SigninPage } = require('../pages/SigninPage');
const { ChatPage } = require('../pages/ChatPage')   // ✅ correct

const path = require('path');

const chatData = getTestData('./data/testData.xlsx', 'massMsgSend_Data');

test.use({
  viewport: { width: 1600, height: 900 },
});

test.setTimeout(60000); // set timeout for all tests in this file

chatData.forEach((dataRow, index) => {

  test(`'Mass message test - creator sends message' #${index + 1} - ${dataRow.CreatorEmail}`, async ({ page }) => {
    const base = new BasePage(page);
    const signin = new SigninPage(page);
    const chat = new ChatPage(page);

    try {
      await base.navigate();
      console.log('Navigated to base URL');
      await signin.goToSignin();
      console.log('Navigated to Signin page');
      await signin.fillSigninForm(dataRow.CreatorEmail, dataRow.CreatorPassword);
      console.log(`Filled signin form for ${dataRow.CreatorEmail}`);
      await signin.signinSubmit();
      console.log('Submitted signin form');
      await chat.handleOtpVerification();
      console.log('Handled OTP verification if required');
    } catch (error) {
      console.error('Error during login flow:', error.message);
      await page.screenshot({ path: `error_login_flow_${index + 1}.png` });
      throw error;
    }

    try {
      const welcomePopup = page.locator(`text=Welcome Back, PlayfulMistress`);
      await expect(welcomePopup).toBeVisible({ timeout: 20000 });
      console.log('Login confirmed: Welcome popup appeared');
    } catch (error) {
      console.error('Login failed: Welcome popup not found', error.message);
      await page.screenshot({ path: `error_login_confirm_${index + 1}.png` });
      throw error;
    }

    try {
      await chat.navigateToChat();
      await chat.getStartedMassOption();
      console.log('Navigated to Chat');
      console.log('Chat interface loaded');
    } catch (error) {
      console.error('Error navigating to Chat:', error.message);
      await page.screenshot({ path: `error_navigate_chat_${index + 1}.png` });
      throw error;
    }

    const messageType = dataRow.MessageType?.toLowerCase();

    // Get correct file path for media upload
    // const messageContent = messageType === 'media'
    //   ? path.resolve('C:\\Users\\Himani\\Pictures\\image5.jpeg') // Absolute path for file
    //   : dataRow.MessageContent;

    try {
      await chat.sendMassMessageFromData({
        type: messageType,
        // content: messageContent,
      });
      console.log(`Mass message (${messageType}) prepared`);
    } catch (error) {
      console.error('Error sending mass message:', error.message);
      await page.screenshot({ path: `error_send_mass_message_${index + 1}.png` });
      throw error;
    }

    try {
      await chat.selectSendDetails();
      console.log('Selected send details (followers)');
    } catch (error) {
      console.error('Error selecting send details:', error.message);
      await page.screenshot({ path: `error_select_send_details_${index + 1}.png` });
      throw error;
    }

    try {
      await chat.submitForm();
      console.log('Submitted send form');

      await chat.waitForSuccessPopup();
      console.log('Success popup appeared');

      await chat.closeSuccessPopup();
      console.log('Closed success popup');

      console.log(`Mass ${messageType} message sent successfully by ${dataRow.CreatorEmail}`);
      expect(true).toBeTruthy(); // marks test as passed
    } catch (error) {
      console.error('Error submitting send form:', error.message);
      if (!page.isClosed()) {
        await page.screenshot({ path: `error_submit_form_${index + 1}.png` });
      }
      throw error;
    }
  });
});


const fanData = getTestData('./data/testData.xlsx', 'users_LoginData');
const fs = require('fs');

fanData.forEach((fan, index) => {
  test(`Verify message visible to fan #${index + 1} - ${fan.FanEmail}`, async ({ page }) => {
    const base = new BasePage(page);
    const signin = new SigninPage(page);
    const chat = new ChatPage(page);

    try {
      // Explicit wait between tests (10 seconds)
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Navigate and login
      await base.navigate();
      await signin.goToSignin();
      await signin.fillSigninForm(fan.FanEmail, fan.FanPassword);
      await signin.signinSubmit();
      await chat.handleOtpVerification();

      // Confirm welcome popup
      const welcomePopup = page.locator('text=Welcome Back,');
      await expect(welcomePopup).toBeVisible({ timeout: 20000 });
      console.log(`Logged in as fan: ${fan.FanEmail}`);

      // Navigate to chat and open creator conversation
      await chat.navigateToChat();
      await chat.chatWithCreator();

      // Load expected message from JSON
      const messagePath = path.resolve(__dirname, '../data/lastSentMessage.json');
      let expectedSentMessage = '';

      try {
        const messageData = JSON.parse(fs.readFileSync(messagePath, 'utf-8'));
        expectedSentMessage = messageData.message?.trim() || '';
        console.log(`Expecting to find message: "${expectedSentMessage}"`);
      } catch (err) {
        throw new Error(`Failed to read or parse lastSentMessage.json: ${err.message}`);
      }

      if (!expectedSentMessage) {
        throw new Error('No message content found in lastSentMessage.json.');
      }

      // Validate last received message
      const lastReceivedMessage = await chat.getLastReceivedMsgFromCreator(expectedSentMessage);

      // Normalize whitespace & case in both strings before comparison
      const normalizedReceived = lastReceivedMessage.toLowerCase().replace(/\s+/g, ' ').trim();
      const normalizedExpected = expectedSentMessage.toLowerCase().replace(/\s+/g, ' ').trim();

      expect(normalizedReceived).toContain(normalizedExpected);

      console.log('Fan test passed: Message received successfully.');
    } catch (error) {
      console.error(`Verification failed for fan ${fan.FanEmail}:`, error.message);
      await page.screenshot({
        path: `screenshots/error_verify_message_fan_${index + 1}_${Date.now()}.png`,
        fullPage: true,
      });
      throw error;
    }
  });
});

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
test.setTimeout(60000);

chatData.forEach((dataRow, index) => {
  test(`Mass message test #${index + 1} - ${dataRow.CreatorEmail}`, async ({ page }) => {
    const base = new BasePage(page);
    const signin = new SigninPage(page);
    const chat = new ChatPage(page);

    // Generate dynamic message
    const phrase = await generatePhrase();
    console.log(`Generated phrase: ${phrase}`);

    // Optionally write message to JSON for fan verification
    const messagePath = path.resolve(__dirname, '../data/lastSentMessage.json');
    fs.writeFileSync(messagePath, JSON.stringify({ message: phrase }, null, 2));

    try {
      await base.navigate();
      await signin.goToSignin();
      await signin.fillSigninForm(dataRow.CreatorEmail, dataRow.CreatorPassword);
      await signin.signinSubmit();
      await chat.handleOtpVerification();
    } catch (error) {
      console.error('Login flow error:', error.message);
      await page.screenshot({ path: `error_login_flow_${index + 1}.png` });
      throw error;
    }

    try {
      const welcomePopup = page.locator(`text=Welcome Back, PlayfulMistress`);
      await expect(welcomePopup).toBeVisible({ timeout: 20000 });
    } catch (error) {
      console.error('Login confirmation failed:', error.message);
      await page.screenshot({ path: `error_login_confirm_${index + 1}.png` });
      throw error;
    }

    try {
      await chat.navigateToChat();
      await chat.getStartedMassOption();
    } catch (error) {
      console.error('Error navigating to chat:', error.message);
      await page.screenshot({ path: `error_navigate_chat_${index + 1}.png` });
      throw error;
    }

    const messageType = dataRow.MessageType?.toLowerCase();

    try {
      await chat.sendMassMessageFromData({
        type: messageType,
        content: phrase, // Use generated phrase as message content
      });
    } catch (error) {
      console.error('Error sending message:', error.message);
      await page.screenshot({ path: `error_send_mass_message_${index + 1}.png` });
      throw error;
    }

    try {
      await chat.selectSendDetails();
    } catch (error) {
      console.error('Error selecting send details:', error.message);
      await page.screenshot({ path: `error_select_send_details_${index + 1}.png` });
      throw error;
    }

    try {
      await chat.submitForm();
      await chat.waitForSuccessPopup();
      await chat.closeSuccessPopup();

      console.log(`Mass ${messageType} message sent by ${dataRow.CreatorEmail}`);
      expect(true).toBeTruthy(); // mark test as passed
    } catch (error) {
      console.error('Error in submission:', error.message);
      if (!page.isClosed()) {
        await page.screenshot({ path: `error_submit_form_${index + 1}.png` });
      }
      throw error;
    }
  });
});


// FAN VERIFICATION
fanData.forEach((fan, index) => {
  test(`Verify message visible to fan #${index + 1} - ${fan.FanEmail}`, async ({ page }) => {
    const base = new BasePage(page);
    const signin = new SigninPage(page);
    const chat = new ChatPage(page);

    try {
      await new Promise(resolve => setTimeout(resolve, 10000)); // small delay between tests

      await base.navigate();
      await signin.goToSignin();
      await signin.fillSigninForm(fan.FanEmail, fan.FanPassword);
      await signin.signinSubmit();
      await chat.handleOtpVerification();

      const welcomePopup = page.locator('text=Welcome Back,');
      await expect(welcomePopup).toBeVisible({ timeout: 20000 });

      await chat.navigateToChat();
      await chat.chatWithCreator();

      // Read expected message from file
      const messagePath = path.resolve(__dirname, '../data/lastSentMessage.json');
      const messageData = JSON.parse(fs.readFileSync(messagePath, 'utf-8'));
      const expectedMessage = messageData.message?.trim();

      if (!expectedMessage) {
        throw new Error('No message found in lastSentMessage.json.');
      }

      const receivedMessage = await chat.getLastReceivedMsgFromCreator(expectedMessage);

      // Normalize strings before asserting
      const normalizedReceived = receivedMessage.toLowerCase().replace(/\s+/g, ' ').trim();
      const normalizedExpected = expectedMessage.toLowerCase().replace(/\s+/g, ' ').trim();

      expect(normalizedReceived).toContain(normalizedExpected);
      console.log('Fan test passed: Message received successfully.');

    } catch (error) {
      console.error(`Fan verification failed: ${error.message}`);
      await page.screenshot({
        path: `screenshots/error_verify_message_fan_${index + 1}_${Date.now()}.png`,
        fullPage: true,
      });
      throw error;
    }
  });
});

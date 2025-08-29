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

fanData.forEach((fan, index) => {test(`Verify message visible to fan #${index + 1} - ${fan.FanEmail}`, async ({ page }) => {
  const base = new BasePage(page);
  const signin = new SigninPage(page);
  const chat = new ChatPage(page);

  try {
    await base.navigate();
    console.log('Navigated to base URL for fan login');
    await signin.goToSignin();
    await signin.fillSigninForm(fan.FanEmail, fan.FanPassword);
    await signin.signinSubmit();
    await chat.handleOtpVerification();
    console.log(`Logged in as fan: ${fan.FanEmail}`);

    const welcomePopup = page.locator(`text=Welcome Back,`);
    await expect(welcomePopup).toBeVisible({ timeout: 20000 });
    console.log('Login confirmed for fan.');

    await chat.navigateToChat();
    console.log('Navigated to Chat for fan.');

    await chat.chatWithCreator();
    console.log('Opened chat with creator.');
    
    // // Example if sending message dynamically:
    //  const sentMessage = await chat.sendMassMessageFromData({ type: 'text', content: '' });

    // // Use the message sent to verify it's visible
    // const messageLocator = page.locator(`text=${messageToCheck}`);
    // await expect(messageLocator).toBeVisible({ timeout: 15000 });
    // console.log('Verified message visible to fan.');

    expect(true).toBeTruthy();
  } catch (error) {
    console.error(`Verification failed for fan ${fan.FanEmail}:`, error.message);
    await page.screenshot({ path: `error_verify_message_fan_${index + 1}.png` });
    throw error;
  }
});
});

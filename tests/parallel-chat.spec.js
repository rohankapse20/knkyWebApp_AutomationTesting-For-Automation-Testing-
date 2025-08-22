const { test, expect } = require('@playwright/test');
const path = require('path');
const { readChatDataFromExcel } = require('../utils/readExcel');
const { BasePage } = require('../pages/BasePage');
const { SigninPage } = require('../pages/SigninPage');
const { ChatPage } = require('../pages/chatpage');

const chatData = readChatDataFromExcel('./test-data.xlsx');

chatData.forEach((dataRow, index) => {
  test(`Parallel chat test [Row ${index + 1}]`, async ({ browser }) => {
    const creatorContext = await browser.newContext();
    const creatorPage = await creatorContext.newPage();

    const creatorBase = new BasePage(creatorPage);
    const creatorSignin = new SigninPage(creatorPage);
    const creatorChat = new ChatPage(creatorPage);

    // Login as Creator
    await creatorBase.navigate();
    await creatorSignin.goToSignin();
    await creatorSignin.fillSigninForm(dataRow.CreatorEmail, dataRow.CreatorPassword);
    await creatorSignin.signinSubmit();
    await creatorChat.navigateToChat();

    const msgTimestamp = Date.now();
    let expectedMsg = '';

    // Send based on type
    if (dataRow.MessageType === 'text') {
      expectedMsg = `${dataRow.MessageContent} - ${msgTimestamp}`;
      await creatorChat.sendMessage(expectedMsg);
    } else if (dataRow.MessageType === 'media') {
      const fullPath = path.resolve(dataRow.MessageContent);
      expectedMsg = path.basename(dataRow.MessageContent);
      await creatorChat.sendMedia(fullPath);
    }

    // Fan emails
    const fans = [
      dataRow.FanEmail1,
      dataRow.FanEmail2,
      dataRow.FanEmail3
    ].filter(Boolean); // remove empty if any

    // Loop over all fans in parallel
    await Promise.all(fans.map(async (fanEmail) => {
      const fanContext = await browser.newContext();
      const fanPage = await fanContext.newPage();

      const fanBase = new BasePage(fanPage);
      const fanSignin = new SigninPage(fanPage);
      const fanChat = new ChatPage(fanPage);

      // Log in fan
      await fanBase.navigate();
      await fanSignin.goToSignin();
      await fanSignin.fillSigninForm(fanEmail, 'Rohan@001'); // shared fan password or make dynamic
      await fanSignin.signinSubmit();

      await fanChat.navigateToChatWithUser(dataRow.CreatorEmail);
      const received = await fanChat.getLastReceivedMessage();

      // Assert
      expect(received).toContain(expectedMsg);

      console.log(`${fanEmail} received message: ${received}`);

      await fanContext.close();
    }));

    await creatorContext.close();
  });
});

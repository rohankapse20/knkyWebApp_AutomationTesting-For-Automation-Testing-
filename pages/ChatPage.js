const { expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const { generateRandomMessage } = require('../utils/helpers.js');

class ChatPage {
  constructor(page) {
    this.page = page;

    // Define the locators
    this.getStartedMassChat = page.locator("//button[normalize-space(text())='Get Started']");
    this.messageText = page.locator("//textarea[@placeholder='Type your message here']");
    this.mediaRadio = page.locator("//input[@type='radio' and @value='Media']");
    this.addVaultMediaBtn = page.locator("//button[contains(., 'Add Vault Media')]");
    this.chooseButton = page.locator("//button[normalize-space(text())='Choose']");
    this.followersCheckbox = page.locator("//input[@id='followers']");
    this.sendButton = this.page.locator('button.btn.btn-primary:has-text("Send")').first();

    this.testVersAccept = page.locator("[data-eid='Home_WithoutLoggedIn/Testversion_btn']");
    this.chatoption = page.locator("//img[contains(@src, 'chat') and @width='28']");
    this.welcomeMessage = page.locator("text=Welcome");
  
    this.successPopup = this.page.locator("//h2[normalize-space()='Message sent successfully']");
    this.successCloseButton = this.page.locator("//button[contains(@class, 'swal2-confirm') and normalize-space(text())='Close']");
  }

async navigateToChat() {
  try {
    if (await this.testVersAccept.isVisible({ timeout: 20000 })) {
      await this.testVersAccept.click();
      console.log('Accepted test version');
    }

    await this.chatoption.waitFor({ state: 'visible', timeout: 20000 });
    await this.chatoption.click();
    console.log('Clicked Chat icon');

    const chatSearchInput = this.page.locator('#chat-search-box input[type="search"]');

    try {
      await chatSearchInput.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      console.warn('Chat input not found on first click, retrying...');
      await this.chatoption.click();
      await chatSearchInput.waitFor({ state: 'visible', timeout: 10000 });
    }

    console.log('Chat panel loaded successfully');
  } catch (error) {
    console.error('Error navigating to Chat:', error.message);
    await this.page.screenshot({ path: `error_navigate_chat.png` });
    throw error;
  }
}

async chatWithCreator(retryCount = 0) {
  const creatorName = 'PlayfulMistress';
  const MAX_RETRIES = 1;

  const searchInput = this.page.locator('#chat-search-box input[type="search"]');
  const emptyChatText = this.page.locator('text="Chat list is empty :("');
  const suggestionOption = this.page.locator(`//span[@class="profile-last-message" and normalize-space(text())="${creatorName}"]`);
  const chatItem = this.page.locator(
    `//div[contains(@class, 'chatList_chatItem__')][.//span[normalize-space(text())='${creatorName}']]`
  );

  try {
    console.log(`[${retryCount}] Starting chatWithCreator`);
    await this.page.waitForTimeout(1000);

    let isChatEmpty = await emptyChatText.isVisible({ timeout: 5000 }).catch(() => false);
    if (isChatEmpty) {
      console.log(`[${retryCount}] Chat list empty, performing search...`);
      await searchInput.waitFor({ state: 'visible', timeout: 10000 });
      await searchInput.fill('');
      await this.page.waitForTimeout(300);
      await searchInput.fill(creatorName);
      await this.page.waitForTimeout(1500);

      const suggestionVisible = await suggestionOption.isVisible({ timeout: 2000 }).catch(() => false);
      if (suggestionVisible) {
        await suggestionOption.click({ force: true });
        await this.page.waitForTimeout(500);
      } else {
        throw new Error(`No suggestion found for "${creatorName}"`);
      }
    } else {
      console.log(`[${retryCount}] Chat list not empty, finding creator directly...`);
      let visible = await chatItem.first().isVisible().catch(() => false);
      if (!visible) {
        for (let i = 0; i < 10; i++) {
          await this.page.mouse.wheel(0, 300);
          await this.page.waitForTimeout(300);
          visible = await chatItem.first().isVisible().catch(() => false);
          if (visible) break;
        }
      }

      if (visible) {
        await chatItem.first().click({ force: true });
        await this.page.waitForTimeout(3000);
      } else {
        throw new Error(`Could not find chat for "${creatorName}"`);
      }
    }

    // Verify chat loaded successfully
    const textareaVisible = await this.page.locator('textarea[placeholder="Send a message"]').isVisible({ timeout: 10000 }).catch(() => false);
    if (!textareaVisible) {
      if (retryCount < MAX_RETRIES) {
        console.warn(`[${retryCount}] Chat not loaded, retrying...`);
        return await this.chatWithCreator(retryCount + 1);
      } else {
        const screenshotPath = path.resolve(`screenshots/chat-failure-${Date.now()}.png`);
        await this.page.screenshot({ path: screenshotPath });
        throw new Error(`Chat load failed after retry. Screenshot: ${screenshotPath}`);
      }
    }

    console.log(`[${retryCount}] Chat loaded successfully with ${creatorName}`);

  } catch (err) {
    const screenshotPath = path.resolve(`screenshots/chat-error-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath });
    throw new Error(`chatWithCreator failed for ${creatorName}: ${err.message}. Screenshot: ${screenshotPath}`);
  }
}


async scrollToBottom() {
  await this.page.evaluate(() => {
    const chatContainer = document.querySelector('.h-100.overflow-y-auto');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    } else {
      console.warn('Chat container not found: .h-100.overflow-y-auto');
    }
  });
}



// async chatWithCreator(retryCount = 0) {
//   const creatorName = 'PlayfulMistress';
//   const MAX_RETRIES = 1;

//   const searchInput = this.page.locator('#chat-search-box input[type="search"]');
//   const emptyChatText = this.page.locator('text="Chat list is empty :("');
//   const suggestionOption = this.page.locator(`//span[@class="profile-last-message" and normalize-space(text())="${creatorName}"]`);
//   const ChatItem = this.page.locator(
//     `//div[contains(@class, 'chatList_chatItem__')][.//span[normalize-space(text())='${creatorName}']]`
//   );

//   try {
//     console.log(`[${retryCount}] Starting chatWithCreator`);
//     await this.page.waitForTimeout(1000); // Ensure panel is ready

//     // Double check: Is chat list actually empty?
//     let isChatEmpty = await emptyChatText.isVisible({ timeout: 3000 }).catch(() => false);
//     if (isChatEmpty) {
//       console.log(`[${retryCount}] 'Chat list is empty :(' is visible. Re-checking after short wait...`);
//       await this.page.waitForTimeout(1500);
//       isChatEmpty = await emptyChatText.isVisible({ timeout: 1000 }).catch(() => false);
//     }

//     if (isChatEmpty) {
//       // === Case: Chat is confirmed empty ===
//       console.log(`[${retryCount}] Chat list confirmed empty. Proceeding with search.`);

//       await searchInput.waitFor({ state: 'visible', timeout: 5000 });
//       await searchInput.click({ force: true });
//       await searchInput.fill('');
//       await this.page.waitForTimeout(300);
//       await searchInput.fill(creatorName);
//       await this.page.waitForTimeout(1500);

//       const isSuggestionVisible = await suggestionOption.isVisible({ timeout: 1000 }).catch(() => false);
//       if (isSuggestionVisible) {
//         console.log(`[${retryCount}] Suggestion found. Clicking...`);
//         await suggestionOption.click({ force: true });
//         await this.page.waitForTimeout(500);
//       } else {
//         throw new Error(`[${retryCount}] No suggestion visible after search for "${creatorName}"`);
//       }

//     } else {
//       // === Case: Chat list is NOT empty → Search visually in chat list ===
//       console.log(`[${retryCount}] Chat list not empty. Using fallback direct search.`);

//       let isVisible = await ChatItem.first().isVisible().catch(() => false);
//       if (!isVisible) {
//         console.log(`[${retryCount}] Creator not visible, scrolling...`);
//         for (let scrollTry = 0; scrollTry < 10; scrollTry++) {
//           await this.page.mouse.wheel(0, 300);
//           await this.page.waitForTimeout(300);
//           isVisible = await ChatItem.first().isVisible().catch(() => false);
//           if (isVisible) break;
//         }
//       }

//       if (isVisible) {
//         console.log(`[${retryCount}] Found creator chat item. Clicking...`);
//         await ChatItem.first().scrollIntoViewIfNeeded();
//         await ChatItem.first().click({ force: true });
//         await this.page.waitForTimeout(2000);
//       } else {
//         throw new Error(`[${retryCount}] Could not find chat for "${creatorName}" in fallback list.`);
//       }
//     }

//     // === Wait for chat to load ===
//     const chatLoaded = await this.waitForChatToLoad(creatorName);
//     if (!chatLoaded) {
//       if (retryCount < MAX_RETRIES) {
//         console.warn(`[${retryCount}] Chat did not load. Retrying...`);
//         await this.page.waitForTimeout(2000);
//         return await this.chatWithCreator(retryCount + 1);
//       } else {
//         const screenshotPath = path.resolve(`screenshots/chat-failure-${Date.now()}.png`);
//         await this.page.screenshot({ path: screenshotPath, fullPage: true });
//         throw new Error(`Chat load failed after retry. Screenshot saved at: ${screenshotPath}`);
//       }
//     }

//     console.log(`[${retryCount}] Chat loaded successfully with ${creatorName}`);

//   } catch (err) {
//     const screenshotPath = path.resolve(`screenshots/chat-error-${Date.now()}.png`);
//     await this.page.screenshot({ path: screenshotPath, fullPage: true });
//     throw new Error(`chatWithCreator failed for ${creatorName}: ${err.message}. Screenshot: ${screenshotPath}`);
//   }
// }

  async getStartedMassOption()
  {
    await this.getStartedMassChat.waitFor({ state: 'visible', timeout: 10000 });
      console.log('Loaded Chat interface');

  }
  async handleOtpVerification() {
    const otpModal = this.page.locator("//div[contains(text(), 'Login Verification')]");
    const otpInput = this.page.locator("//input[@placeholder='Enter OTP code']");
    const verifyBtn = this.page.locator("//button[normalize-space(text())='Verify']");

    try {
      await otpModal.waitFor({ state: 'visible', timeout: 10000 });
      await otpInput.fill('123456');

      for (let i = 0; i < 10; i++) {
        if (await verifyBtn.isEnabled()) break;
        await this.page.waitForTimeout(500);
      }

      await verifyBtn.click();
      await otpModal.waitFor({ state: 'hidden', timeout: 10000 });
      console.log('OTP Verified');
    } catch (error) {
      console.warn('OTP modal not shown or verification skipped.');
    }

    await this.page.waitForTimeout(2000);
  }

async sendMassMessageFromData({ type, content }) {
  let messageToSend = content || generateRandomMessage(); // Use provided content or generate random message

  try {
    // Ensure that 'Get Started' chat option is visible and clickable
    if (await this.getStartedMassChat.isVisible({ timeout: 5000 })) {
      await this.getStartedMassChat.click();
      console.log('Clicked Get Started');

      // Wait for 2 seconds to allow UI to update (textarea to appear)
      await this.page.waitForTimeout(2000);

      // Extra check: ensure message box is visible
      if (!(await this.messageText.isVisible({ timeout: 3000 }))) {
        await this.page.screenshot({ path: `error_message_text_not_visible_${type}.png` });
        throw new Error(`Message input field not visible after clicking 'Get Started'`);
      }

      // If content is not provided, a random message is used
      if (!content) {
        console.log('No content provided, using randomly generated message');
      }

      // Fill the message input box
      try {
        await this.messageText.fill(messageToSend);
        console.log('Filled message text:', messageToSend);
      } catch (error) {
        await this.page.screenshot({ path: `error_fill_message_${type}.png` });
        throw new Error(`Failed to fill message text: ${error.message}`);
      }

      // Save the message to file (used by fan test)
      const savePath = path.resolve(__dirname, '../data/lastSentMessage.json');
      try {
        fs.writeFileSync(savePath, JSON.stringify({ message: messageToSend }, null, 2), 'utf-8');
        console.log(`Saved sent message to: ${savePath}`);
      } catch (error) {
        console.error('Failed to save the sent message to file:', error.message);
        await this.page.screenshot({ path: `error_save_message_${type}.png` });
        throw new Error(`Failed to save message to file: ${error.message}`);
      }

    } else {
      // 'Get Started' not visible
      console.error('Get Started option not visible within timeout');
      await this.page.screenshot({ path: `error_get_started_not_visible_${type}.png` });
      throw new Error('Get Started option not visible');
    }

    return messageToSend; // Return the actual message sent for verification
  } catch (error) {
    // Catch all unexpected errors, log and screenshot
    console.error(`Error sending mass ${type} message:`, error.message);
    await this.page.screenshot({ path: `error_send_mass_${type}_${Date.now()}.png` });
    throw error;
  }
}


async selectSendDetails() {
  try {
    // For Followers Select
    await this.followersCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.followersCheckbox).toBeEnabled();
    await this.followersCheckbox.check();
    console.log('Checked followers checkbox');

    //For Active Subscribers Select
    const activeSubscribersCheckbox = this.page.locator("//input[@type='checkbox' and @id='subscribers']");
    await expect(activeSubscribersCheckbox).toBeEnabled();
    await activeSubscribersCheckbox.check();
    console.log('Checked active subscribers');


    // Scroll the Send button into view (or page down if needed)
    await this.sendButton.scrollIntoViewIfNeeded();
    console.log('Scrolled to Send button');

    // Wait a little for UI to stabilize
    await this.page.waitForTimeout(1000);

  } catch (error) {
    console.error('Failed to select followers checkbox:', error.message);
    await this.page.screenshot({ path: 'error_followers_checkbox.png' });
    throw error;
  }
}

async getLastReceivedMsgFromCreator(expectedMessage = '') {
  try {
    const messageLocator = this.page.locator('div.bg-chat-receiver div.px-2.pt-1').last();
    await messageLocator.waitFor({ timeout: 10000 });
    console.log('Last received message is initially visible.');

    await this.page.waitForTimeout(2000); // Let content load

    const rawText = await messageLocator.innerText();
    const normalizedReceived = rawText.replace(/\s+/g, ' ').trim().toLowerCase();
    const normalizedExpected = expectedMessage.replace(/\s+/g, ' ').trim().toLowerCase();

    console.log(`Checking Received Message:\n Received: "${normalizedReceived}"\n Expected: "${normalizedExpected}"`);

    if (!normalizedReceived.includes(normalizedExpected)) {
      throw new Error('Message does not match expected content.');
    }

    // Scrolling logic
    const maxAttempts = 5;
    const waitBetweenScrolls = 1000;

    let isFullyVisible = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`Scroll visibility check attempt #${attempt + 1}`);

      isFullyVisible = await this.page.evaluate((expectedText) => {
        const messages = Array.from(document.querySelectorAll('div.bg-chat-receiver div.px-2.pt-1'));
        const normalize = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();
        const targetText = normalize(expectedText);

        const target = messages.find(el =>
          normalize(el.innerText || '').includes(targetText)
        );

        if (!target) return false;

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const rect = target.getBoundingClientRect();
        const isVisible =
          rect.top >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.left >= 0 &&
          rect.right <= window.innerWidth;

        // Always highlight if found, even if not fully visible
        target.style.outline = '3px dashed orange';
        target.style.backgroundColor = '#fff8dc';
        target.style.padding = '5px';

        return isVisible;
      }, expectedMessage);

      if (isFullyVisible) {
        console.log(`Message is fully visible in viewport (after attempt #${attempt + 1})`);
        break;
      }

      await this.page.waitForTimeout(waitBetweenScrolls);
    }

    if (!isFullyVisible) {
      throw new Error('Message was found but not fully visible in viewport after retries.');
    }

    await this.page.waitForTimeout(2000); // Let final highlight show

    // Final visibility assurance before returning
    await messageLocator.waitFor({ state: 'visible', timeout: 5000 });

    return rawText;

  } catch (error) {
    const screenshotPath = `screenshots/error_get_last_message_${Date.now()}.png`;
    if (!this.page.isClosed?.()) {
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.error('Error in getLastReceivedMsgFromCreator:', error.message);
      console.log(`Screenshot saved: ${screenshotPath}`);
    } else {
      console.warn('Page already closed, screenshot skipped.');
    }
    throw error;
  }
}

async findMessageLocator(expectedMessage) {
  const messageLocators = this.page.locator('div.bg-chat-receiver div.px-2.pt-1');
  const count = await messageLocators.count();

  for (let i = count - 1; i >= 0; i--) {
    const msg = await messageLocators.nth(i).innerText();
    if (msg.toLowerCase().replace(/\s+/g, ' ').includes(expectedMessage.toLowerCase().trim())) {
      return messageLocators.nth(i);
    }
  }

  return null;
}


async submitForm() {
  try {
    await this.page.waitForTimeout(1000);
    await this.sendButton.scrollIntoViewIfNeeded();
    await expect(this.sendButton).toBeVisible({ timeout: 10000 });
    await expect(this.sendButton).toBeEnabled({ timeout: 10000 });

    await this.sendButton.evaluate((btn) => {
      return btn && !btn.disabled && btn.offsetParent !== null;
    });

    await this.sendButton.click({ trial: true });
    await this.sendButton.click();
    console.log('Clicked Send button');

  } catch (error) {
    console.error('Failed in submitForm():', error.message);
    if (!this.page.isClosed()) {
      await this.page.screenshot({ path: 'error_submit_form.png', fullPage: true });
    }
    throw error;
  }
}
// async waitForChatToLoad() {
// const chatContainer = this.page.locator('textarea[placeholder="Send a message"]').first();

//   await chatContainer.waitFor({ timeout: 10000 });
//   console.log('Chat container is visible.');
// }


async waitForSuccessPopup() {
  try {
    await this.successPopup.waitFor({ state: 'visible', timeout: 20000 });
    console.log('Success popup appeared');
  } catch (error) {
    console.error('Success popup not found:', error.message);
    await this.page.screenshot({ path: 'error_success_popup.png' });
    throw error;
  }
}

async closeSuccessPopup() {
  try {
    await this.successCloseButton.click();

    // Add a quick check to ensure the popup closes
    await this.successPopup.waitFor({ state: 'hidden', timeout: 5000 });
    console.log('Closed success popup');
  } catch (error) {
    console.error('Failed to close success popup:', error.message);

    // Guard against crashing on screenshot
    if (!this.page.isClosed()) {
      await this.page.screenshot({ path: 'error_close_success_popup.png' });
    }

    throw error;
  }
}

}

module.exports = { ChatPage };

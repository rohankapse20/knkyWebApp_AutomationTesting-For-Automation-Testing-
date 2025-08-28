const { expect } = require('@playwright/test');
const path = require('path');
//const fs = require('fs');
const { generateRandomMessage } = require('../utils/helpers.js');

class ChatPage {
  constructor(page) {
    this.page = page;

    // Locators
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

// async chatWithCreator() {

//   const creatorName = 'PlayfulMistress';
//   const searchInput = this.page.locator('#chat-search-box input[type="search"]');

//   try {

//     await searchInput.waitFor({ state: 'visible', timeout: 10000 });
//     await searchInput.click({ force: true });
//     await searchInput.fill('');
//     await this.page.waitForTimeout(300); // debounce
//     await searchInput.fill(creatorName);
//     console.log(`Typed creator name: ${creatorName}`);

//     // Wait for the suggestion list to appear and find an option that includes the name
//     const suggestions = this.page.locator('//div[contains(@class,"chat-item") and .//span[contains(text(),"' + creatorName + '")]]');

//     await suggestions.first().waitFor({ state: 'visible', timeout: 15000 });
//     console.log('Suggestion is visible, attempting to click');

//     await suggestions.first().click();
//     console.log(`Clicked on creator: ${creatorName}`);

//     await this.page.waitForTimeout(2000);
//   } 
//   catch (error) {
//     console.error(`Failed to select creator ${creatorName}:`, error.message);

//     const allSuggestions = await this.page.locator('//div[contains(@class,"chat-item")]').allTextContents();
//     console.log('All visible suggestions:', allSuggestions);

//     await this.page.screenshot({ path: 'error_chat_with_creator.png' });
//     throw error;
//   }
// }

async waitForChatToLoad(expectedName) {
    const chatHeader = this.page.locator('.chat-header span'); // adjust this if selector is different
    const chatMessages = this.page.locator('.chat-messages');  // adjust this too if needed

    try {
      await chatHeader.waitFor({ state: 'visible', timeout: 10000 });
      const headerText = await chatHeader.textContent();
      console.log('Chat header text:', headerText);

      if (!headerText?.includes(expectedName)) {
        console.warn(`Chat opened, but expected creator name not found. Header: ${headerText}`);
        return false;
      }

      await chatMessages.waitFor({ state: 'visible', timeout: 10000 });
      console.log('Chat messages are visible.');
      return true;
    } catch (err) {
      console.warn('Chat load wait failed:', err.message);
      return false;
    }
  }
async chatWithCreator() {
  const creatorName = 'PlayfulMistress';
  const searchInput = this.page.locator('#chat-search-box input[type="search"]');

  // Helper: checks if any suggestion exists
  const suggestionListLocator = this.page.locator('.chatList_chatItem__S5T5x .profile-last-message');

  try {
    // Step 1: Search Creator Name
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.click({ force: true });
    await searchInput.fill('');
    await this.page.waitForTimeout(300);
    await searchInput.fill(creatorName);
    console.log(`Typed creator name: ${creatorName}`);
    await this.page.waitForTimeout(1500);

    // Step 2: Check if suggestion list is available
    const suggestionsCount = await suggestionListLocator.count();
    console.log(`Suggestions found: ${suggestionsCount}`);

    if (suggestionsCount > 0) {
      // Step 3A: Click the correct one from suggestions
      for (let i = 0; i < suggestionsCount; i++) {
        const suggestionText = await suggestionListLocator.nth(i).innerText();
        if (suggestionText.trim() === creatorName) {
          console.log(`Clicking on suggestion: ${suggestionText}`);
          await suggestionListLocator.nth(i).click();
          break;
        }
      }
    } else {
      // Step 3B: Fallback - use outer HTML div structure directly
      console.log('No suggestions. Trying fallback selector...');
      const fallbackChat = this.page.locator(
        '//div[contains(@class, "chatList_chatItem__S5T5x")]//span[@class="profile-last-message" and normalize-space(text())="PlayfulMistress"]'
      );

      await fallbackChat.first().click({ force: true });
    }

    // Step 4: Confirm Chat Loaded
    const chatLoaded = await this.waitForChatToLoad(creatorName);
    if (!chatLoaded) {
      console.warn('Chat did not load properly, refreshing the page and retrying...');
      await this.page.reload();
      await this.page.waitForTimeout(4000);

      // Retry all steps
      return await this.chatWithCreator(); // Recursive retry once
    }

  } catch (error) {
    throw new Error(`Failed during chat interaction with ${creatorName}: ${error.message}`);
  }
}



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
  let messageToSend = content;
  try {
    if (await this.getStartedMassChat.isVisible({ timeout: 5000 })) {
      await this.getStartedMassChat.click();
      console.log('Clicked Get Started');
      
      if (!content) {
        messageToSend = generateRandomMessage();
      }
      
      await this.messageText.fill(messageToSend);
      console.log('Filled message text');
    }
    return messageToSend;
  } catch (error) {
    console.error(`Error sending mass ${type} message:`, error.message);
    await this.page.screenshot({ path: `error_send_mass_${type}.png` });
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

    // Optional: wait a little for UI to stabilize
    await this.page.waitForTimeout(1000);

  } catch (error) {
    console.error('Failed to select followers checkbox:', error.message);
    await this.page.screenshot({ path: 'error_followers_checkbox.png' });
    throw error;
  }
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

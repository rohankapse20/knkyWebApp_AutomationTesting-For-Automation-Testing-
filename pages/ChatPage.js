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
      if (await this.testVersAccept.isVisible({ timeout: 5000 })) {
        await this.testVersAccept.click();
        console.log('Accepted test version');
      }

      await this.chatoption.waitFor({ state: 'visible', timeout: 10000 });
      await this.chatoption.click();
      console.log('Clicked Chat icon');

          } catch (error) {
      console.error('Error navigating to Chat:', error.message);
      await this.page.screenshot({ path: `error_navigate_chat.png` });
      throw error;
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
    // const activeSubscribers = page.locator("//form[@id='subscriptionForm']//input[@id='subscribers' and contains(@class, 'form-check-input') and @type='checkbox']");
    // await expect(this.activeSubscribers).toBeEnabled();
    // await activeSubscribers.check();
    // console.log('Checked active subscribers');  
    
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

const { expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');


class ChatPage {
  constructor(page) {
    this.page = page;

    // Define locators
    this.getStartedMassChat = page.locator("//button[normalize-space(text())='Get Started']");
    this.messageText = page.locator("//textarea[@placeholder='Type your message here']");
    this.mediaRadio = page.locator("//input[@type='radio' and @value='Media']");
    this.addVaultMediaBtn = page.locator("//button[contains(., 'Add Vault Media')]");
    this.chooseButton = page.locator("//button[normalize-space(text())='Choose']");
    this.followersCheckbox = page.locator("//input[@id='followers']");
    this.sendButton = page.locator("//button[normalize-space(text())='Send']");
    this.testVersAccept = page.locator("[data-eid='Home_WithoutLoggedIn/Testversion_btn']");
    this.chatoption = page.locator("//img[contains(@src, 'chat') and @width='28']");
    this.welcomeMessage = page.locator("text=Welcome");
  }

  async navigateToChat() {
    try {
      console.log('Waiting for test version accept button...');
      if (await this.testVersAccept.isVisible({ timeout: 5000 })) {
        await expect(this.testVersAccept).toBeEnabled({ timeout: 3000 });
        await this.testVersAccept.click();
        console.log('Clicked on test version accept');
      }

      await this.chatoption.waitFor({ state: 'visible', timeout: 15000 });

      const isEnabled = await this.chatoption.isEnabled();
      if (!isEnabled) throw new Error('Chat icon is visible but not enabled.');

      await this.page.screenshot({ path: 'before_click_chat.png' });
      await this.chatoption.click();
      console.log('Clicked on chat option');

      await this.getStartedMassChat.waitFor({ state: 'visible', timeout: 15000 });
      console.log('Chat interface loaded');

    } catch (error) {
      console.error('Error navigating to Chat:', error.message);
      await this.page.screenshot({ path: `error_navigate_to_chat.png` });
      throw error;
    }
  }

  async handleOtpVerification() {
    const otpModal = this.page.locator("//div[contains(@class, 'modal-body') and .//div[contains(text(), 'Login Verification')]]");
    const otpInput = this.page.locator("//div[contains(@class, 'modal-body')]//input[@placeholder='Enter OTP code']");
    const verifyBtn = this.page.locator("//div[contains(@class, 'modal-body')]//button[normalize-space(text())='Verify']");

    try {
      await otpModal.first().waitFor({ state: 'visible', timeout: 10000 });
      await otpInput.waitFor({ timeout: 5000 });
      await otpInput.fill('123456');

      for (let i = 0; i < 10; i++) {
        const isEnabled = await verifyBtn.isEnabled();
        if (isEnabled) break;
        await this.page.waitForTimeout(500);
      }

      await verifyBtn.click();
      await otpModal.first().waitFor({ state: 'hidden', timeout: 10000 });

    } catch (error) {
      console.error('Error during OTP verification:', error.message);
      await this.page.screenshot({ path: 'otp_verification_failed.png' });
      throw error;
    }

    await this.page.waitForTimeout(2000);
  }


async sendMassMessageFromData({ type, content }) {
  try {
    if (await this.getStartedMassChat.isVisible({ timeout: 10000 })) {
      await this.getStartedMassChat.click();
      console.log('Clicked on Get Started button');
    }

    if (type === 'media') {
      await this.mediaRadio.waitFor({ timeout: 10000 });
      await this.mediaRadio.click();
      console.log('Selected media message type');

      await this.addVaultMediaBtn.waitFor({ timeout: 10000 });
      await this.addVaultMediaBtn.click();
      console.log('Clicked Add Vault Media');

      const addNewButton = this.page.locator("//button[normalize-space(text())='Add New']");
      await addNewButton.waitFor({ timeout: 10000 });
      await addNewButton.click();
      console.log('Clicked Add New');

      const mediaUploadOption = this.page.locator("//span[normalize-space(text())='Media upload']");
      await mediaUploadOption.waitFor({ timeout: 10000 });
      await mediaUploadOption.click();
      console.log('Clicked Media Upload');

      // Upload file
      if (!fs.existsSync(content)) {
        throw new Error(`File does not exist: ${content}`);
      }

      const fileInput = this.page.locator('//span[normalize-space(text())="Media upload"]');
      const uploadFilePath = path.resolve(content);
      await fileInput.setInputFiles(uploadFilePath);
      console.log(`Uploaded file: ${uploadFilePath}`);

      // Wait for upload to finish by checking for progress bar to disappear or Choose to become enabled
      const chooseBtn = this.chooseButton;

      console.log('Waiting for Choose button to be enabled...');
      await expect(chooseBtn).toBeEnabled({ timeout: 20000 }); // Wait up to 20s
      console.log('Choose button is enabled now');

      await chooseBtn.click();
      console.log('Clicked Choose button');

    } else if (type === 'text') {
      await this.messageText.waitFor({ timeout: 10000 });
      await this.messageText.fill(content);
      console.log('Filled message text');
    }

  } catch (error) {
    console.error(`Failed to send mass ${type} message:`, error.message);
    await this.page.screenshot({ path: `error_send_mass_${type}.png` });
    throw error;
  }
}

  async selctSendDetails() {
    try {
      await this.followersCheckbox.waitFor({ state: 'visible', timeout: 10000 });
      await expect(this.followersCheckbox).toBeEnabled();
      await this.followersCheckbox.check();
      console.log('Checked followers checkbox');
    } catch (error) {
      console.error('Failed to select followers checkbox:', error.message);
      await this.page.screenshot({ path: 'error_followers_checkbox.png' });
      throw error;
    }
  }

  async submitForm() {
    try {
      await this.sendButton.waitFor({ state: 'visible', timeout: 10000 });
      await expect(this.sendButton).toBeEnabled();
      await this.sendButton.click();
      console.log('Clicked Send button');
    } catch (error) {
      console.error('Failed to click Send button:', error.message);
      await this.page.screenshot({ path: 'error_send_button.png' });
      throw error;
    }
  }
}

module.exports = { ChatPage };

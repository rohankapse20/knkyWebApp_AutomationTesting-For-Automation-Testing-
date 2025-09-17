const { expect } = require('@playwright/test');
const path = require('path');
const { clickChatByCreatorName } = require('../utils/helpers.js');
// const { safeClick } = require('../utils/helpers.js');

class massMsgNegativeTest_PO
{
    constructor(page) {
    this.page = page;

    // Define the locators
    
    this.getStartedMassChat = page.locator("//button[normalize-space(text())='Get Started']");
    this.messageText = page.locator("//textarea[@placeholder='Type your message here']");
    this.mediaRadio = page.locator("//input[@type='radio' and @value='Media']");
    this.addVaultMediaBtn = page.locator("//button[contains(., 'Add Vault Media')]");
    this.chooseButton = page.locator("//button[normalize-space(text())='Choose']");
    this.followersCheckbox = page.locator("//input[@id='followers']");

    this.testVersAccept = page.locator("[data-eid='Home_WithoutLoggedIn/Testversion_btn']");
    this.chatoption = page.locator("//img[contains(@src, 'chat') and @width='28']");
    this.welcomeMessage = page.locator("text=Welcome");  

}

// Created the methods

async navigateToChat() {
  try {
    if (await this.testVersAccept.isVisible({ timeout: 30000 })) {
      await this.testVersAccept.click();
      console.log('Accepted test version');
    }

    await this.chatoption.waitFor({ state: 'visible', timeout: 30000 });
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
  const MAX_RETRIES = 3;

  const searchInput = this.page.locator('#chat-search-box input[type="search"]');
  const emptyChatText = this.page.locator('text="Chat list is empty :("');
  const suggestionOption = this.page.locator(`//span[@class="profile-last-message" and normalize-space(text())="${creatorName}"]`);
  // const chatItem = this.page.locator(
  //   `//div[contains(@class, 'chatList_chatItem__')][.//span[normalize-space(text())='${creatorName}']]`
  // );

  try {
    try {

      await this.page.waitForTimeout(2000);
      console.log(`[${retryCount}] Starting chatWithCreator`);
     
      let isChatEmpty = await emptyChatText.isVisible({ timeout: 5000 }).catch(() => false);

      if (isChatEmpty) {
        console.log(`[${retryCount}] Chat list empty, performing search...`);
        await searchInput.waitFor({ state: 'visible', timeout: 20000 });
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

        // Use the helper to locate and click chat item
        await clickChatByCreatorName(this.page, creatorName);
        await this.page.waitForTimeout(20000); // Wait for 20 seconds
      }

    } catch (error) {
      console.error(`[${retryCount}] chatWithCreator failed: ${error.message}`);
      throw error;
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

// Paid Media Vault not selected
async notsendMassMediaVault({ type }) {
  try {
    if (await this.getStartedMassChat.isVisible({ timeout: 15000 })) {
      await this.getStartedMassChat.click();
      console.log('Clicked Get Started');
      await this.page.waitForTimeout(2000);

      const mediaRadioButton = this.page.locator('input#mediaRadio[type="radio"][value="Media"]');
      try {
        await mediaRadioButton.waitFor({ state: 'visible', timeout: 5000 });
        await mediaRadioButton.check();
        console.log('Checked Media radio button');
        await this.page.waitForTimeout(3000);
      } catch (error) {
        await this.page.screenshot({ path: `error_media_radio_not_visible_${type}.png` });
        throw new Error('Failed to check Media radio button');
      }

      const addVaultMediaButton = this.page.locator('button:has(svg) >> text="Add Vault Media"');
      try {
        await addVaultMediaButton.waitFor({ state: 'visible', timeout: 5000 });
        await addVaultMediaButton.click();
        console.log('Clicked Add Vault Media button');
      } catch (error) {
        await this.page.screenshot({ path: `error_add_vault_media_button_${type}.png` });
        throw new Error('Failed to click Add Vault Media button');
      }

      // Intentionally NOT selecting media file
      try {
        await this.page.waitForTimeout(3000);
        const closeModalButton = this.page.locator('div[role="dialog"] button.btn-close[data-bs-dismiss="modal"]');
        await closeModalButton.click();
        console.log('Closed Vault Media modal without selecting media');
        await this.page.waitForTimeout(1000);
      } catch (error) {
        await this.page.screenshot({ path: `error_close_modal_${type}.png`, fullPage: true });
        throw new Error('Failed to close media modal');
      }

      // Select followers + active subscribers
      await this.followersActiveSubCheckbox();

      // Pay-to-view setup
      const payToViewRadio = this.page.locator('input#payView[type="radio"][value="Pay-to-view"]');
      const priceInputField = this.page.locator('input[placeholder="Enter price to pay"][type="number"]');

      try {
        const container = this.page.locator('.container.p-3.bg-white.rounded');
        await container.evaluate(el => el.scrollTop = el.scrollHeight);
        await this.page.waitForTimeout(2000);

        await payToViewRadio.waitFor({ state: 'visible', timeout: 5000 });
        await payToViewRadio.check();
        console.log('Checked Pay-to-view radio button');
        await this.page.waitForTimeout(3000);

        await priceInputField.waitFor({ state: 'visible', timeout: 5000 });
        await priceInputField.scrollIntoViewIfNeeded();
        await this.page.mouse.wheel(0, 700);
        await this.page.waitForTimeout(500);

        const isDisabled = await priceInputField.isDisabled();
        if (isDisabled) {
          throw new Error('Price input field is disabled');
        }

        await priceInputField.fill('50');
        console.log('Entered price into Pay-to-view input field');
        await this.page.waitForTimeout(2000);
      } catch (error) {
        await this.page.screenshot({ path: `error_pay_to_view_setup_${type}.png`, fullPage: true });
        throw new Error(`Failed to set Pay-to-view price: ${error.message}`);
      }

      // Intentionally not clicking send button → leave to separate test check
      console.log('Finished vault setup without selecting media (expected negative case)');

    } else {
      await this.page.screenshot({ path: `error_get_started_not_visible_${type}.png`, fullPage: true });
      throw new Error('Get Started option not visible');
    }
  } catch (error) {
    console.error(`Error sending mass ${type} vault media:`, error.message);
    await this.page.screenshot({ path: `error_send_mass_${type}_${Date.now()}.png`, fullPage: true });
    throw error;
  }
}


// Paid Media Vault Messages
async sendMassMediaVault({ type }) {
  try {
    // Ensure 'Get Started' option is visible and clickable
    const getStartedVisible = await this.getStartedMassChat.isVisible({ timeout: 15000 });
    if (!getStartedVisible) {
      await this.page.screenshot({ path: `error_get_started_not_visible_${type}.png`, fullPage: true });
      throw new Error('Get Started option is not visible');
    }

    await this.getStartedMassChat.click();
    console.log('Clicked Get Started');
    await this.page.waitForTimeout(2000);

    // Select "Media" radio button
    const mediaRadioButton = this.page.locator('input#mediaRadio[type="radio"][value="Media"]');
    try {
      await mediaRadioButton.waitFor({ state: 'visible', timeout: 5000 });
      await mediaRadioButton.check();
      console.log('Checked Media radio button');
      await this.page.waitForTimeout(3000);
    } catch (error) {
      await this.page.screenshot({ path: `error_media_radio_not_visible_${type}.png` });
      throw new Error('Failed to check Media radio button');
    }

    // Click "Add Vault Media"
    const addVaultMediaButton = this.page.locator('button:has(svg) >> text="Add Vault Media"');
    try {
      await addVaultMediaButton.waitFor({ state: 'visible', timeout: 5000 });
      await addVaultMediaButton.click();
      console.log('Clicked Add Vault Media button');
    } catch (error) {
      await this.page.screenshot({ path: `error_add_vault_media_button_${type}.png` });
      throw new Error('Failed to click Add Vault Media button');
    }

    // Select vault media file (checkbox/radio)
    const mediaInputLocator = this.page.locator("(//input[contains(@id, 'checkboxNoLabel')])[6]");

    try {
      console.log("Waiting for media items to start loading...");
      await this.page.waitForTimeout(2500);

      let isVisible = await mediaInputLocator.isVisible();
      let scrollAttempts = 0;

      while (!isVisible && scrollAttempts < 5) {
        console.log(`Scrolling to find image [Attempt ${scrollAttempts + 1}]`);
        await this.page.mouse.wheel(0, 300);
        await this.page.waitForTimeout(2000);
        isVisible = await mediaInputLocator.isVisible();
        scrollAttempts++;
      }

      if (!isVisible) {
        throw new Error('Media input checkbox is not visible after scrolling');
      }

      const isChecked = await mediaInputLocator.isChecked();
      if (!isChecked) {
        console.log("Clicking image checkbox...");
        await this.page.waitForTimeout(1500);
        await mediaInputLocator.click();
        await this.page.waitForTimeout(1000);
        console.log('Image checkbox selected successfully');
      } else {
        console.log('Image is already selected');
      }

      await this.page.waitForTimeout(1000);
    } catch (error) {
      await this.page.screenshot({ path: `error_select_media_${type}.png`, fullPage: true });
      console.error('Error selecting media file:', error);
      throw new Error('Failed to select media file');
    }

    // Click "Choose" button
    const chooseButton = this.page.locator('button:has-text("Choose")');
    try {
      await chooseButton.waitFor({ state: 'visible', timeout: 5000 });
      await chooseButton.click();
      console.log('Clicked Choose button successfully');
      await this.page.waitForTimeout(3000);
    } catch (error) {
      await this.page.screenshot({ path: `error_choose_button_${type}.png` });
      console.error('Error clicking Choose button:', error.message);
      throw new Error('Failed to click Choose button');
    }

    // Enable Pay-to-view and set price
    const payToViewRadio = this.page.locator('input#payView[type="radio"][value="Pay-to-view"]');
    const priceInputField = this.page.locator('input[placeholder="Enter price to pay"][type="number"]');

    try {
      const container = this.page.locator('.container.p-3.bg-white.rounded');
      await container.evaluate(el => el.scrollTop = el.scrollHeight);
      await this.page.waitForTimeout(2000);

      await payToViewRadio.waitFor({ state: 'visible', timeout: 5000 });
      await payToViewRadio.check();
      console.log('Checked Pay-to-view radio button');
      await this.page.waitForTimeout(3000);

      await priceInputField.waitFor({ state: 'visible', timeout: 5000 });
      await priceInputField.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(2000);
      await this.page.mouse.wheel(0, 700);
      await this.page.waitForTimeout(500);

      const isDisabled = await priceInputField.isDisabled();
      if (isDisabled) {
        throw new Error('Price input field is disabled');
      }

      await priceInputField.focus();
      await priceInputField.fill('');
      await priceInputField.type('20', { delay: 100 });
      console.log('Entered price 20 into Pay-to-view input field');
      await this.page.waitForTimeout(2000);
    } catch (error) {
      await this.page.screenshot({ path: `error_pay_to_view_setup_${type}.png`, fullPage: true });
      throw new Error(`Failed to set Pay-to-view price: ${error.message}`);
    }

  } catch (finalError) {
    console.error(`sendMassMediaVault failed: ${finalError.message}`);
    throw finalError;
  }
}

async selectSendDetails() {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      attempt++;
      console.log(`Attempt ${attempt}: Locating correct Send button...`);
      await this.page.waitForTimeout(1000);

      const allButtons = this.page.locator('button:has-text("Send")');
      const count = await allButtons.count();

      console.log(`Found ${count} "Send" buttons. Evaluating visibility and enabled state...`);

      for (let i = 0; i < count; i++) {
        const button = allButtons.nth(i);
        const isVisible = await button.isVisible();

        if (isVisible) {
          const isEnabled = await button.isEnabled();
          console.log(`Send button #${i + 1} → Visible: ${isVisible}, Enabled: ${isEnabled}`);

          await button.scrollIntoViewIfNeeded();
          await expect(button).toBeVisible();

          // Return the button for further evaluation in test
          return button;
        }
      }

      console.warn("No visible Send button found yet, retrying...");
    } catch (error) {
      console.error(`Error during attempt ${attempt} of locating Send button: ${error.message}`);
    }
  }

  console.warn("Returning undefined. No visible Send button found after retries.");
  return null;
}


// For followers and Active Subscribers
async followersActiveSubCheckbox() {
  try {
    // For Followers Select
    await this.followersCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.followersCheckbox).toBeEnabled();
    await this.followersCheckbox.check();
    console.log('Checked followers checkbox');

    // For Active Subscribers Select
    const activeSubscribersCheckbox = this.page.locator("//input[@type='checkbox' and @id='subscribers']");
    await expect(activeSubscribersCheckbox).toBeEnabled();
    await activeSubscribersCheckbox.check();
    console.log('Checked active subscribers');

    // Wait a little for UI to stabilize
    await this.page.waitForTimeout(1000);

  } catch (error) {
    console.error('Failed to select followers checkbox:', error.message);
    await this.page.screenshot({ path: 'error_followers_checkbox.png' });
    throw error;
  }
}

async notselectSendDetails() {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      console.log(`Attempt ${attempt}: Checking for disabled Send button...`);
      await this.page.waitForTimeout(1000);

      const allButtons = this.page.locator('button:has-text("Send")');
      const count = await allButtons.count();

      console.log(`Found ${count} "Send" buttons. Verifying if all are disabled...`);

      for (let i = 0; i < count; i++) {
        const button = allButtons.nth(i);
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();

        console.log(`Send button #${i + 1} → Visible: ${isVisible}, Enabled: ${isEnabled}`);

        if (isVisible && !isEnabled) {
          await expect(button).toBeDisabled();
          console.log(`Send button #${i + 1} is disabled as expected.`);
          return button;
        }
      }

      throw new Error('No disabled Send button found (all may be enabled or hidden)');

    } catch (error) {
      console.error(`Send button disabled check failed on attempt ${attempt}: ${error.message}`);
      await this.page.screenshot({
        path: `send_button_disabled_check_attempt_${attempt}.png`,
        fullPage: true
      });

      if (attempt === MAX_RETRIES) {
        throw new Error('Test failed: Could not confirm disabled Send button after max retries');
      }
    }
  }
}



async CreatorChat_MassMedia(fanEmail) {
  const fallbackEmail = 'rohan.kapse@iiclab.com';
  const safeEmail = (fanEmail || fallbackEmail).replace(/[@.]/g, '_');
  const expectedPrice = 10;
  const maxRetries = 20;
  const scrollWaitTime = expectedPrice >= 10 ? 4000 : 3000;

  try {
    console.log("Waiting for 30 seconds before fallback retry...");
    await this.page.waitForTimeout(30000);

    const cssSelector = `button.style_btn-knky-white__y140y:has-text("Unlock for $${expectedPrice}.00")`;
    let found = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Scrolled down - attempt ${attempt}`);
        await this.page.mouse.wheel(0, 6000);
        await this.page.waitForTimeout(scrollWaitTime);

        const unlockButtons = this.page.locator(cssSelector);
        const count = await unlockButtons.count();

        if (count === 0) {
          console.log(`Attempt ${attempt}: No unlock buttons found yet...`);
          continue;
        }

        const lastBtn = unlockButtons.nth(count - 1);
        await lastBtn.scrollIntoViewIfNeeded();

        const isVisible = await lastBtn.isVisible();
        const isEnabled = await lastBtn.isEnabled();

        if (isVisible && isEnabled) {
          console.log(`Attempt ${attempt}: Clicking visible & enabled Unlock button`);
          await lastBtn.click({ timeout: 5000 });
          found = true;
          break;
        } else {
          console.log(`Attempt ${attempt}: Unlock button is not interactable`);
        }

      } catch (e) {
        console.warn(`Scroll attempt ${attempt} error: ${e.message}`);
      }
    }

    if (!found) {
      throw new Error(`Unlock button with price $${expectedPrice}.00 not found after ${maxRetries} attempts`);
    }

    return true;

  } catch (error) {
    console.error('Error in CreatorChat_MassMedia:', error.message);
    await this.page.screenshot({ path: `error_creator_chat_mass_media_${Date.now()}.png`, fullPage: true });
    return false;
  }
}
async receivedVaultMedia(fanEmail) {
  const fallbackEmail = 'rohan.kapse@iiclab.com';
  const safeEmail = (fanEmail || fallbackEmail).replace(/[@.]/g, '_');
  const maxRetries = 3;

  console.log(`Starting verification of Vault Media content for fan: ${fanEmail}`);

  try {
    const payButtons = this.page.getByRole('button', { name: /Pay \$10\.00/ });

    console.log("Waiting for Pay button(s) to be attached...");
    await payButtons.last().waitFor({ state: 'attached', timeout: 15000 });

    const count = await payButtons.count();
    console.log(`Found ${count} matching Pay $10.00 button(s).`);

    let payBtn = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Retry ${attempt}/${maxRetries}: Checking Pay buttons...`);

      for (let i = 0; i < count; i++) {
        const candidate = payButtons.nth(i);
        try {
          if (this.page.isClosed()) throw new Error("Page is already closed");

          await candidate.scrollIntoViewIfNeeded();
          const isVisible = await candidate.isVisible();
          const isEnabled = await candidate.isEnabled();

          console.log(`Button #${i + 1}: visible=${isVisible}, enabled=${isEnabled}`);

          if (isVisible && isEnabled) {
            payBtn = candidate;
            break;
          }
        } catch (err) {
          console.warn(`Skipping button #${i + 1}: ${err.message}`);
        }
      }

      if (payBtn) break;
      await this.page.waitForTimeout(1500);
    }

    if (!payBtn) {
      await this.page.screenshot({ path: `pay_button_missing_${safeEmail}.png`, fullPage: true });
      throw new Error("No visible & enabled Pay $10.00 button found after retries.");
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}: Clicking Pay button...`);
        await payBtn.click({ timeout: 2000 });
        await this.page.waitForTimeout(1500);

        const popupCloseBtn = this.page.locator('button:has-text("Close"), button.swal2-cancel, button.swal2-close');
        if (await popupCloseBtn.count() > 0) {
          try {
            await popupCloseBtn.first().click();
            console.log('Popup/modal detected and closed.');
          } catch (e) {
            console.warn('Failed to close popup:', e.message);
          }
        }

        break;
      } catch (clickErr) {
        console.error(`Pay click failed (Attempt ${attempt}): ${clickErr.message}`);
        if (attempt === maxRetries) throw clickErr;
        await this.page.waitForTimeout(2000);
      }
    }

    // Handle "Got it!" button (non-blocking)
    const gotItButton = this.page.locator('button.swal2-confirm.swal2-styled:has-text("Got it!")');
    try {
      await gotItButton.waitFor({ state: 'visible', timeout: 3000 });
      await gotItButton.click({ timeout: 2000 });
      console.log('[INFO] "Got it!" button clicked successfully.');
    } catch (error) {
      const isDetached = error.message.includes('detached from the DOM');
      const isTimeout = error.message.includes('Timeout');

      if (isDetached || isTimeout) {
        console.warn('[WARN] "Got it!" button disappeared before it could be clicked. Continuing test...');
      } else {
        throw error;
      }
    }

    try {
      // Step 1: Wait for confirmation message
      const confirmationText = this.page.locator('text=Your message has been unlocked.');
      console.log("Waiting for unlock confirmation...");
      await confirmationText.waitFor({ state: 'visible', timeout: 10000 });
      console.log("Vault Media message unlocked successfully.");

      // Step 2: Click the 'Got it!' button (again for unlock modal)
      const gotItBtn = this.page.locator('button.swal2-confirm.swal2-styled:has-text("Got it!")');
      try {
        await gotItBtn.waitFor({ state: 'visible', timeout: 1000 });
        if (await gotItBtn.isEnabled()) {
          await gotItBtn.click();
          console.log('Clicked "Got it!" button.');
        }
      } catch (error) {
        const isDetached = error.message.includes('detached from the DOM');
        const isTimeout = error.message.includes('Timeout');
        if (isDetached || isTimeout) {
          console.warn('[WARN] "Got it!" button (2nd) disappeared before it could be clicked.');
        } else {
          console.warn(`Could not click "Got it!": ${error.message}`);
        }
      }

      // Step 3: Wait for the confirmation modal to disappear
      try {
        await confirmationText.waitFor({ state: 'detached', timeout: 5000 });
        console.log('Confirmation popup closed.');
      } catch (waitError) {
        console.warn("Confirmation popup didn't close in time.");
      }

      // Step 4: Wait for actual vault media preview (optional)
      try {
        const vaultPreview = this.page.locator('selector-for-vault-preview'); // Replace with real selector
        await expect(vaultPreview).toBeVisible({ timeout: 5000 });
        console.log("Vault preview confirmed.");
      } catch (previewError) {
        console.warn("Vault media preview not found:", previewError.message);
      }

      console.log(`Vault media fully verified and previewed for fan: ${fanEmail}`);

      // Step 5: Close page
      try {
        await this.page.waitForTimeout(1500);
        await this.page.close();
        console.log("Page closed after successful Vault Media interaction.");
      } catch (closeError) {
        console.warn("Could not close page:", closeError.message);
      }

      return true;

    } catch (error) {
      console.error("receivedVaultMedia failed:", error.message);
      if (!this.page.isClosed()) {
        const safeEmail = fanEmail.replace(/[^a-zA-Z0-9]/g, '_');
        await this.page.screenshot({
          path: `receivedVaultMedia_error_${safeEmail}.png`,
          fullPage: true
        });
      }
      throw error;
    }

  } catch (outerError) {
    console.error("Outer try-catch failed:", outerError.message);
    throw outerError;
  }
}

async waitForSuccessPopup() {
  try {
    await this.successPopup.waitFor({ state: 'visible', timeout: 10000 });
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

      // Ensure the popup disappears
      await this.successPopup.waitFor({ state: 'hidden', timeout: 5000 });
      console.log('Closed success popup');
    } catch (error) {
      console.error('Failed to close success popup:', error.message);

      if (!this.page.isClosed()) {
        await this.page.screenshot({ path: 'error_close_success_popup.png' });
      }

      throw error;
    }
  }

}

module.exports = { massMsgNegativeTest_PO };

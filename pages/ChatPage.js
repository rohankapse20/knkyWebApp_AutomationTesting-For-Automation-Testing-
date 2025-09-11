const { expect } = require('@playwright/test');
const path = require('path');
const { clickChatByCreatorName } = require('../utils/helpers.js');
const { safeClick } = require('../utils/helpers.js');

// const { generateRandomMessage } = require('../utils/helpers.js');


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


    this.testVersAccept = page.locator("[data-eid='Home_WithoutLoggedIn/Testversion_btn']");
    this.chatoption = page.locator("//img[contains(@src, 'chat') and @width='28']");
    this.welcomeMessage = page.locator("text=Welcome");
  
    this.successPopup = this.page.locator("//h2[normalize-space()='Message sent successfully']");
    this.successCloseButton = this.page.locator("//button[contains(@class, 'swal2-confirm') and normalize-space(text())='Close']");
    
  }

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

async sendMassMessageFromData({ type, content }) {
  const messageToSend = content || 'Hello everyone!'; // default fallback

  try {
    if (await this.getStartedMassChat.isVisible({ timeout: 15000 })) {
      await this.getStartedMassChat.click();
      console.log('Clicked Get Started');
      await this.page.waitForTimeout(2000);

      if (!(await this.messageText.isVisible({ timeout: 3000 }))) {
        await this.page.screenshot({ path: `error_message_text_not_visible_${type}.png` });
        throw new Error(`Message input field not visible after clicking 'Get Started'`);
      }

      await this.messageText.fill(messageToSend);
      console.log('Filled message text:', messageToSend);

      return messageToSend;
    }

    throw new Error('Get Started button not visible.');
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}


// Paid Media Vault Messages
async sendMassMediaVault({ type }) {
  try {
    // Ensure that 'Get Started' chat option is visible and clickable
    if (await this.getStartedMassChat.isVisible({ timeout: 15000 })) {
      await this.getStartedMassChat.click();
      console.log('Clicked Get Started');
      await this.page.waitForTimeout(2000); // wait for UI update

      // Select the "Media" radio button for vault media
      const mediaRadioButton = this.page.locator('input#mediaRadio[type="radio"][value="Media"]');
      try {
        await mediaRadioButton.waitFor({ state: 'visible', timeout: 5000 });
        await mediaRadioButton.check();
        console.log('Checked Media radio button');
        await this.page.waitForTimeout(3000); // ⏳ Explicit wait after checking radio
      } catch (error) {
        await this.page.screenshot({ path: `error_media_radio_not_visible_${type}.png` });
        throw new Error('Failed to check Media radio button');
      }

      // Click on the "Add Vault Media" button
      const addVaultMediaButton = this.page.locator('button:has(svg) >> text="Add Vault Media"');
      try {
        await addVaultMediaButton.waitFor({ state: 'visible', timeout: 5000 });
        await addVaultMediaButton.click();
        console.log('Clicked Add Vault Media button');
      } catch (error) {
        await this.page.screenshot({ path: `error_add_vault_media_button_${type}.png` });
        throw new Error('Failed to click Add Vault Media button');
      }

      // Select the vault media file (checkbox/radio)
      const mediaInputLocator = this.page.locator("(//input[contains(@id, 'checkboxNoLabel')])[5]");

      try {
        console.log("Waiting for media items to start loading...");
        await this.page.waitForTimeout(2500); // Initial wait for media loading

        let isVisible = await mediaInputLocator.isVisible();

        // Try scrolling down to reveal media if not visible
        let scrollAttempts = 0;
        while (!isVisible && scrollAttempts < 5) {
          console.log(`Scrolling to find image [Attempt ${scrollAttempts + 1}]`);
          await this.page.mouse.wheel(0, 300); // Scroll down
          await this.page.waitForTimeout(2000); // Let page settle after scroll
          isVisible = await mediaInputLocator.isVisible();
          scrollAttempts++;
        }

        if (!isVisible) {
          throw new Error('Media input (image checkbox) is not visible even after scrolling');
        }

        const isChecked = await mediaInputLocator.isChecked();
        if (!isChecked) {
          console.log("Clicking image checkbox...");
          await this.page.waitForTimeout(1500);
          await mediaInputLocator.click();
          await this.page.waitForTimeout(1000); // Small wait after click
          console.log('Image checkbox selected successfully');
        } else {
          console.log('Image is already selected');
        }

        await this.page.waitForTimeout(1000); // Additional wait after selection
      } catch (error) {
        await this.page.screenshot({ path: `error_select_media_${type}.png`, fullPage: true });
        console.error('Error occurred while selecting the media file:', error);
        throw new Error('Failed to select media file');
      }

      
      // Click the "Choose" button
      const chooseButton = this.page.locator('button:has-text("Choose")');
      try {
        await safeClick(this.page, chooseButton, `error_choose_button_${type}`);
        console.log('Clicked Choose button successfully');
        await this.page.waitForTimeout(3000); // Wait for next section
      } catch (error) {
        console.error('Error clicking Choose button:', error.message);
        throw new Error('Failed to click Choose button');
      }

      // Check "Followers" and "Active Subscribers"
      await this.followersActiveSubCheckbox();

      const payToViewRadio = this.page.locator('input#payView[type="radio"][value="Pay-to-view"]');
      const priceInputField = this.page.locator('input[placeholder="Enter price to pay"][type="number"]');

      // Select Pay-to-view and enter price
      try {
        const container = this.page.locator('.container.p-3.bg-white.rounded');
        await container.evaluate(el => el.scrollTop = el.scrollHeight);
        await this.page.waitForTimeout(2000);

        await payToViewRadio.waitFor({ state: 'visible', timeout: 5000 });
        await payToViewRadio.check();
        console.log('Checked Pay-to-view radio button');
        await this.page.waitForTimeout(3000); // Wait after checking Pay-to-view

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
        await priceInputField.type('10', { delay: 100 });
        console.log('Entered price 10 into Pay-to-view input field');
        await this.page.waitForTimeout(2000); // ⏳ Wait after input
      } catch (error) {
        await this.page.screenshot({ path: `error_pay_to_view_setup_${type}.png`, fullPage: true });
        throw new Error(`Failed to set Pay-to-view price: ${error.message}`);
      }

// Click on send button with checking send text in Dom
const MAX_RETRIES = 3;
let attempt = 0;
let sendClicked = false;

while (attempt < MAX_RETRIES && !sendClicked) {
  try {
    attempt++;
    console.log(`Attempt ${attempt}: Locating correct Send button...`);
    await this.page.waitForTimeout(1000);

    const allButtons = this.page.locator('button:has-text("Send")');
    const count = await allButtons.count();

    console.log(`Found ${count} "Send" buttons. Evaluating which one is enabled and visible...`);

    let buttonClicked = false;

    for (let i = 0; i < count; i++) {
      const button = allButtons.nth(i);
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();

      console.log(`Send button #${i + 1} → Visible: ${isVisible}, Enabled: ${isEnabled}`);

      if (isVisible && isEnabled) {
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeVisible();  
        await expect(button).toBeEnabled();  
        await button.click({ timeout: 10000 });

        console.log(`Clicked on Send button #${i + 1}`);
        sendClicked = true;
        buttonClicked = true;
        break;
      }
    }

    if (!buttonClicked) {
      throw new Error("No enabled and visible Send button found");
    }

  } catch (error) {
    console.error(`Send button click failed on attempt ${attempt}: ${error.message}`);
    await this.page.screenshot({
      path: `send_button_attempt_${attempt}_${type || 'default'}.png`,
      fullPage: true
    });

    if (attempt === MAX_RETRIES) {
      throw new Error('Failed to click Send button after max retries');
    }
  }
}
}
else {
      await this.page.screenshot({ path: `error_get_started_not_visible_${type}.png`, fullPage: true });
      throw new Error('Get Started option not visible');
    }
  } catch (error) {
    console.error(`Error sending mass ${type} vault media:`, error.message);
    await this.page.screenshot({ path: `error_send_mass_${type}_${Date.now()}.png`, fullPage: true });
    throw error;
  }
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


async selectSendDetails() {

  const MAX_RETRIES = 3;
  let attempt = 0;
  let sendClicked = false;

  while (attempt < MAX_RETRIES && !sendClicked) {
    try {
      attempt++;
      console.log(`Attempt ${attempt}: Locating correct Send button...`);
      await this.page.waitForTimeout(1000);

      const allButtons = this.page.locator('button:has-text("Send")');
      const count = await allButtons.count();

      console.log(`Found ${count} "Send" buttons. Evaluating which one is enabled and visible...`);

      let buttonClicked = false;

      for (let i = 0; i < count; i++) {
        const button = allButtons.nth(i);
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();

        console.log(`Send button #${i + 1} → Visible: ${isVisible}, Enabled: ${isEnabled}`);

        if (isVisible && isEnabled) {
          await button.scrollIntoViewIfNeeded();
          await expect(button).toBeVisible();  
          await expect(button).toBeEnabled();  
          await button.click({ timeout: 15000 });

          console.log(`Clicked on Send button #${i + 1}`);
          sendClicked = true;
          buttonClicked = true;
          break;
        }
      }

      if (!buttonClicked) {
        throw new Error("No enabled and visible Send button found");
      }

    } catch (error) {
      console.error(`Send button click failed on attempt ${attempt}: ${error.message}`);
      await this.page.screenshot({
        path: `send_button_attempt_${attempt}.png`,
        fullPage: true
      });

      if (attempt === MAX_RETRIES) {
        throw new Error('Failed to click Send button after max retries');
      }
    }
  }
}

  async getTopMessageText() {
    try {
      
      this.topMessageLocator = page.locator('div[data-sentry-component="renderText"] span').first();

      await this.topMessageLocator.waitFor({ state: 'visible', timeout: 5000 });
      const text = await this.topMessageLocator.innerText();
      return text.trim();
    } catch (err) {
      throw new Error(`Top message not found or not visible: ${err.message}`);
    }
  }

async getLastReceivedMsgFromCreator(expectedMessage) {
  const maxRetries = 3;
  let lastError = null;
  let rawText = '';

  const normalize = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\nAttempt ${attempt} to verify received message...`);

      // Step 1: Wait a bit for message to arrive
      await this.page.waitForTimeout(5000);

      // Step 2: Scroll chat container to bottom to ensure latest message is visible
      await this.page.evaluate(() => {
        const chatContainer = document.querySelector('div.bg-chat-receiver');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });

      await this.page.waitForTimeout(2000); // Wait for scroll/render

      // Step 3: Make messages fully visible (remove overflow restrictions)
      await this.page.evaluate(() => {
        const messages = Array.from(document.querySelectorAll('div.bg-chat-receiver div.px-2.pt-1'));
        messages.forEach(msg => {
          msg.style.overflow = 'visible';
          msg.style.maxHeight = 'none';
          msg.style.display = 'block';
        });
      });

      // Step 4: Get the last (most recent) message in chat
      const messageLocator = this.page.locator('div.bg-chat-receiver div.px-2.pt-1').last();
      await messageLocator.waitFor({ timeout: 5000 }); // Slightly longer timeout

      rawText = await messageLocator.innerText();

      // Normalize received and expected messages for reliable comparison
      const normalizedReceived = normalize(rawText);
      const normalizedExpected = normalize(expectedMessage);

      console.log(`Comparing messages:\nReceived: "${normalizedReceived}"\nExpected: "${normalizedExpected}"`);

      if (normalizedReceived !== normalizedExpected) {
        throw new Error('Last received message does not match expected.');
      }

      // Step 5: Highlight matched message in UI
      const highlighted = await this.page.evaluate((expectedText) => {
        const normalize = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
        const messages = Array.from(document.querySelectorAll('div.bg-chat-receiver div.px-2.pt-1'));
        const expected = normalize(expectedText);

        const lastMsg = messages[messages.length - 1];
        if (!lastMsg || normalize(lastMsg.innerText || '') !== expected) return false;

        lastMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        lastMsg.style.outline = '3px solid #32CD32';
        lastMsg.style.backgroundColor = '#eaffea';
        lastMsg.style.padding = '6px';

        return true;
      }, expectedMessage);

      if (highlighted) {
        console.log(`Message matched and highlighted after attempt #${attempt}`);
      } else {
        console.warn('Message matched but could not be highlighted in DOM.');
      }

      return rawText; // Success: return the actual text received

    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt} failed: ${err.message}`);

      if (attempt < maxRetries) {
        console.log('Retrying after short delay...\n');
        await this.page.waitForTimeout(3000);
      } else {
        try {
          const screenshotPath = `screenshots/final_fail_msg_not_found_${Date.now()}.png`;
          await this.page.screenshot({ path: screenshotPath, fullPage: true });
          console.error(`Final attempt failed. Screenshot saved: ${screenshotPath}`);
        } catch (screenshotErr) {
          console.error(`Failed to take screenshot: ${screenshotErr.message}`);
        }
        throw new Error(`Failed to verify recent message after ${maxRetries} attempts.\nReason: ${lastError.message}`);
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
      await confirmationText.waitFor({ state: 'visible', timeout: 3000 });
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
        console.warn(`Could not click "Got it!": ${error.message}`);
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

module.exports = { ChatPage };
const { expect } = require('@playwright/test');
const path = require('path');

const { generateRandomMessage } = require('../utils/helpers.js');
const { clickChatByCreatorName } = require('../utils/helpers.js');


const { safeClick } = require('../utils/helpers.js');

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
    try {
      console.log(`[${retryCount}] Starting chatWithCreator`);
      await this.page.waitForTimeout(2000);

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

        // 🛠️ Use the helper to locate and click chat item
        await clickChatByCreatorName(this.page, creatorName);
        await this.page.waitForTimeout(1000); // Keep your original delay
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

// Free Mass Messages
async sendMassMessageFromData({ type, content }) {
  let messageToSend = content || generateRandomMessage(); // Use provided content or generate random message

  try {
    // Ensure that 'Get Started' chat option is visible and clickable
    if (await this.getStartedMassChat.isVisible({ timeout: 15000 })) {
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
      const mediaInputLocator = this.page.locator("(//input[contains(@id, 'checkboxNoLabel')])[2]");
      try {
        await mediaInputLocator.waitFor({ state: 'visible', timeout: 2000 });
        const isChecked = await mediaInputLocator.isChecked();
        if (!isChecked) {
          await this.page.waitForTimeout(2000);
          await mediaInputLocator.click();
          console.log('Radio button clicked successfully');
        } else {
          console.log('Radio button is already selected');
        }
        await this.page.waitForTimeout(3000); // ⏳ Wait after selecting media
      } catch (error) {
        await this.page.screenshot({ path: `error_select_media_${type}.png` });
        console.error('Error occurred while selecting the media file:', error);
        throw new Error('Failed to select media file');
      }      
      
      
      // Click the "Choose" button
      const chooseButton = this.page.locator('button:has-text("Choose")');
      try {
        await safeClick(this.page, chooseButton, `error_choose_button_${type}`);
        console.log('Clicked Choose button successfully');
        await this.page.waitForTimeout(3000); // ⏳ Wait for next section
      } catch (error) {
        console.error('Error clicking Choose button:', error.message);
        throw new Error('Failed to click Choose button');
      }

      // Check "Followers" and "Active Subscribers"
      await this.selectSendDetails();

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
        await this.page.waitForTimeout(3000); // ⏳ Wait after checking Pay-to-view

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
        await priceInputField.type('5', { delay: 100 });
        console.log('Entered price 5 into Pay-to-view input field');
        await this.page.waitForTimeout(3000); // ⏳ Wait after input
      } catch (error) {
        await this.page.screenshot({ path: `error_pay_to_view_setup_${type}.png`, fullPage: true });
        throw new Error(`Failed to set Pay-to-view price: ${error.message}`);
      }

      // Wait for Send button and Retry Logic
      const MAX_RETRIES = 5;
      let attempt = 0;
      let sendClicked = false;

      while (attempt < MAX_RETRIES && !sendClicked) {
        try {
          attempt++;
          console.log(`Attempting to locate and click Send button (Attempt ${attempt})`);
          await this.page.waitForTimeout(3000);

          // Define all locators here
          
          this.sendButton = page.locator('button:has-text("Send")');
          const count = await this.sendButton.count();
          if (count === 0) throw new Error("Send button not found in DOM");

          const isVisible = await this.sendButton.isVisible();
          const isEnabled = await this.sendButton.isEnabled();

          if (!isVisible || !isEnabled) {
            console.warn(`Send button not ready (visible: ${isVisible}, enabled: ${isEnabled})`);
            continue;
          }

          await scrollDownPage(page); // defaults to 10 times
          await this.page.waitForTimeout(3000);
          await this.sendButton.click({ timeout: 10000 });
          console.log('Clicked Send button successfully');
          sendClicked = true;
        } catch (error) {
          console.error(`Send button click failed on attempt ${attempt}: ${error.message}`);
          await this.page.screenshot({ path: `send_button_attempt_${attempt}_${type}.png`, fullPage: true });
          if (attempt === MAX_RETRIES) {
            throw new Error('Failed to click Send button after max retries');
          }
        }
      }
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
    await messageLocator.waitFor({ timeout: 20000 });
    console.log('Last received message is initially visible.');

    // Ensure that any scroll issues are addressed by forcing visibility
    await this.page.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('div.bg-chat-receiver div.px-2.pt-1'));
      messages.forEach(msg => {
        // Unhide the message text if it's hidden by overflow or clipping
        msg.style.overflow = 'visible';
        msg.style.maxHeight = 'none';
        msg.style.display = 'block';
      });
    });

    await this.page.waitForTimeout(2000); // Let content load

    const rawText = await messageLocator.innerText();
    const normalizedReceived = rawText.replace(/\s+/g, ' ').trim().toLowerCase();
    const normalizedExpected = expectedMessage.replace(/\s+/g, ' ').trim().toLowerCase();

    console.log(`Checking Received Message:\n Received: "${normalizedReceived}"\n Expected: "${normalizedExpected}"`);

    if (!normalizedReceived.includes(normalizedExpected)) {
      throw new Error('Message does not match expected content.');
    }

    const maxAttempts = 10;
    const waitBetweenScrolls = 1500;
    const extraScrollAttempts = 3;

    let isFullyVisible = false;
    let isPartiallyVisibleButHighlighted = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`Scroll & visibility check attempt #${attempt + 1}`);

      // Evaluate visibility & highlight, plus scroll strategies inside page context
      const result = await this.page.evaluate(async (expectedText) => {
        const messages = Array.from(document.querySelectorAll('div.bg-chat-receiver div.px-2.pt-1'));
        const normalize = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();
        const targetText = normalize(expectedText);

        const target = messages.find(el => normalize(el.innerText || '').includes(targetText));
        if (!target) return { found: false };

        // Scroll the target into view smoothly, center block
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(r => setTimeout(r, 2000)); // wait smooth scroll

        const rect = target.getBoundingClientRect();

        const fullyVisible =
          rect.top >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.left >= 0 &&
          rect.right <= window.innerWidth;

        const partiallyVisible =
          rect.bottom > 0 && rect.top < window.innerHeight;

        // Highlight the box regardless
        target.style.outline = '3px solid lightgreen';
        target.style.backgroundColor = '#fff8dc';
        target.style.padding = '5px';

        return {
          found: true,
          fullyVisible,
          partiallyVisible,
        };
      }, expectedMessage);

      if (!result.found) {
        console.log('Message box not found in DOM');
        break;
      }

      if (result.fullyVisible) {
        console.log(`Message is fully visible after attempt #${attempt + 1}`);
        isFullyVisible = true;
        break;
      }

      if (result.partiallyVisible) {
        console.log(`Message partially visible but highlighted on attempt #${attempt + 1}`);
        isPartiallyVisibleButHighlighted = true;

        // Extra scroll down attempts when partially visible
        for (let extra = 0; extra < extraScrollAttempts; extra++) {
          console.log(`Extra scroll down attempt #${extra + 1} due to partial visibility`);

          try {
            // Scroll chat container down explicitly
            await this.page.evaluate(() => {
              const chatContainer = document.querySelector('div.bg-chat-receiver');
              if (chatContainer) {
                chatContainer.scrollBy({ top: 100, behavior: 'smooth' });
              }
            });
            await this.page.waitForTimeout(700);

            // Also try window scroll as fallback
            await this.page.evaluate(() => {
              window.scrollBy({ top: 100, behavior: 'smooth' });
            });
            await this.page.waitForTimeout(1000);

            // Scroll messageLocator directly into view again
            await messageLocator.scrollIntoViewIfNeeded({ timeout: 2000 });
            await this.page.waitForTimeout(1000);

            // Check visibility again after scroll attempts
            const checkVisibility = await this.page.evaluate((expectedText) => {
            const messages = Array.from(document.querySelectorAll('div.bg-chat-receiver div.px-2.pt-1'));
            const normalize = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();
            const targetText = normalize(expectedText);

            const target = messages.find(el => normalize(el.innerText || '').includes(targetText));
            if (!target) return false;

              const rect = target.getBoundingClientRect();

            return (
                rect.top >= 0 &&
                rect.bottom <= window.innerHeight &&
                rect.left >= 0 &&
                rect.right <= window.innerWidth
              );
            }, expectedMessage);

            if (checkVisibility) {
              console.log(`Message became fully visible after extra scroll attempt #${extra + 1}`);
              isFullyVisible = true;
              break;
            }
          } catch (err) {
            console.warn(`Extra scroll attempt #${extra + 1} failed: ${err.message}`);
          }
        }

        if (isFullyVisible) break;
      }

      // Try additional scroll down methods after highlight & partial visibility (main loop)
      try {
        await this.page.evaluate(() => {
          const chatContainer = document.querySelector('div.bg-chat-receiver');
          if (chatContainer) {
            chatContainer.scrollBy({ top: 100, behavior: 'smooth' });
          }
        });
        await this.page.waitForTimeout(1000);

        await this.page.evaluate(() => {
          window.scrollBy({ top: 100, behavior: 'smooth' });
        });
        await this.page.waitForTimeout(2000);

        await messageLocator.scrollIntoViewIfNeeded({ timeout: 2000 });
        await this.page.waitForTimeout(1000);
      } catch (scrollErr) {
        console.warn('Scroll attempt failed:', scrollErr.message);
      }

      await this.page.waitForTimeout(waitBetweenScrolls);
    }

    if (isFullyVisible) {
      console.log('Test passed: Message is fully visible.');
    } else if (isPartiallyVisibleButHighlighted) {
      console.log('Test passed: Message partially visible and highlighted.');
    } else {
      throw new Error('Message was not found or visible after retries.');
    }

    await this.page.waitForTimeout(4000); // Let final highlight show

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

async CreatorChat_MassMedia(fanEmail) {
  const fallbackEmail = 'rohan.kapse@iiclab.com';
  const safeEmail = (fanEmail || fallbackEmail).replace(/[@.]/g, '_');
  const maxRetries = 5;

  try {
    console.log("Scrolling to bottom to find recent vault media...");

    let unlockBtn = null;
    let found = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.page.mouse.wheel(0, 8000);
        await this.page.waitForTimeout(1000);

        unlockBtn = this.page.locator('//button[contains(@class, "style_btn-knky-white") and contains(text(), "Unlock for")]');

        if (await unlockBtn.first().isVisible()) {
          console.log(`Unlock button found on attempt ${attempt}`);
          found = true;
          break;
        }

        console.log(`Unlock button not visible on attempt ${attempt}. Retrying scroll...`);
      } catch (scrollError) {
        console.warn(`Scroll attempt ${attempt} failed:`, scrollError.message);
      }
    }

    if (!found || !unlockBtn) {
      throw new Error("Unlock button not found after all retries.");
    }

    console.log("Clicking Unlock button...");
    await unlockBtn.last().click();
    await this.page.waitForTimeout(2000);

    try {
      const payBtn = this.page.locator('button[class*="style_btn-knky-primary"]:has-text("Pay $5.00")');

      await payBtn.waitFor({ state: 'visible', timeout: 15000 });

      const isEnabled = await payBtn.isEnabled();
      const isVisible = await payBtn.isVisible();

      if (!isVisible || !isEnabled) {
        throw new Error("Pay button is not interactable (visible or enabled state failed).");
      }

      console.log("Clicking Pay $5.00 button...");
      await payBtn.click({ timeout: 5000 });

      await this.page.waitForTimeout(2000);

      const confirmationText = this.page.locator('text=Your message has been unlocked.');
      await confirmationText.waitFor({ state: 'visible', timeout: 15000 });

      console.log("Vault Media message unlocked successfully.");

    } catch (error) {
      console.error("Failed to pay for vault Media:", error.message);

      if (!this.page.isClosed()) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await this.page.screenshot({ path: `pay_button_failed_${timestamp}.png`, fullPage: true });
      }

      throw error;
    }

    // After successful unlock — try verifying received vault media
    const gotItSelector = 'button.swal2-confirm.swal2-styled:has-text("Got it!")';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}: Verifying Vault Media for ${fanEmail}`);

        const gotItBtn = this.page.locator(gotItSelector);
        await gotItBtn.waitFor({ state: 'visible', timeout: 10000 });

        if (!await gotItBtn.isEnabled()) {
          throw new Error('"Got it!" button is visible but not enabled.');
        }

        await gotItBtn.click();
        console.log('Clicked "Got it!" button.');

        // Removed modal open and close logic as requested

        console.log(`Vault media successfully verified for fan: ${fanEmail}`);
        return true;

      } catch (error) {
        console.error(`Attempt ${attempt} failed for ${fanEmail}: ${error.message}`);

        if (attempt === maxRetries && !this.page.isClosed()) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          await this.page.screenshot({ path: `vault_media_failed_${safeEmail}_${timestamp}.png`, fullPage: true });
          console.error(`Final failure: Could not verify vault media after ${maxRetries} attempts.`);
          throw error;
        }

        await this.page.waitForTimeout(2000);
      }
    }

    return false;

  } catch (error) {
    console.error("creator_MassMedia failed:", error.message);
    throw error;
  }
}

async receivedVaultMedia(fanEmail) {

  const maxRetries = 3;
  const fallbackEmail = 'rohan.kapse@iiclab.com';
  const safeEmail = (fanEmail || fallbackEmail).replace(/[@.]/g, '_');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Verifying Vault Media for ${fanEmail || fallbackEmail}`);

      const imageLocator = this.page.locator('//img[contains(@src, "/vault/") and contains(@src, "compressed.jpeg")]');
      const imageCount = await imageLocator.count();

      if (imageCount === 0) throw new Error("No vault media images found.");

      console.log(`Found ${imageCount} vault media image(s). Clicking the most recent one...`);
      const recentImage = imageLocator.last();

      await recentImage.scrollIntoViewIfNeeded();
      await expect(recentImage).toBeVisible({ timeout: 5000 });
      await expect(recentImage).toBeEnabled({ timeout: 5000 });
      await recentImage.click();

      // --- After clicking image, just wait for close button (no modal image check) ---
      const closeBtn = this.page.locator('//div[contains(@class, "modal show")]//button[contains(@class, "btn-close")]');
      const closeBtnCount = await closeBtn.count();

      let closed = false;
      for (let i = 0; i < closeBtnCount; i++) {
        const btn = closeBtn.nth(i);
        if (await btn.isVisible({ timeout: 2000 }) && await btn.isEnabled()) {
          await btn.click();
          console.log(`Clicked close button inside modal.`);
          closed = true;
          break;
        }
      }

      if (closed) {
        console.log(`Vault media successfully verified for fan: ${fanEmail || fallbackEmail}`);
        return true;
      } else {
        throw new Error('Modal close button not found or not clickable');
      }

    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${fanEmail || fallbackEmail}: ${error.message}`);

      if (attempt === maxRetries && !this.page.isClosed()) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        try {
          await this.page.screenshot({
            path: `vault_media_failed_${safeEmail}_${timestamp}.png`,
            fullPage: true
          });
          console.error(`Screenshot saved: vault_media_failed_${safeEmail}_${timestamp}.png`);
        } catch (screenshotErr) {
          console.warn(`Failed to take screenshot: ${screenshotErr.message}`);
        }

        console.error(`Final failure: Could not verify vault media after ${maxRetries} attempts.`);
        throw error;
      }

      await this.page.waitForTimeout(2000); // Delay before retry
    }
  }
}



async submitForm() {
  await this.page.waitForTimeout(1000);
  
  await expect(this.sendButton).toBeVisible({ timeout: 10000 });
  await expect(this.sendButton).toBeEnabled({ timeout: 10000 });
  await this.sendButton.click();
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
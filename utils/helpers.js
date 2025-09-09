const fs = require('fs');
const path = require('path');


// Generate a random phrase from predefined options
function generatePhrase() {
  const phrases = [
    "The Influencer is excited about today's stream! on your profile",
    "The Creator is sharing something exciting with you! under your new post",
    "The Developer says: 'Hi, how are you?' during your live session",
    "The Artist is live now! Join me! under the new video"
  ];
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
}

// Generate dynamic random message
function generateRandomMessage() {
  // Subjects
  const creators = ["The Creator", "The Influencer", "The Streamer", "The Developer", "The Artist", "The Content Creator"];
  const fans = ["The Fan", "The Follower", "The Subscriber", "The Viewer", "The Supporter", "The Audience"];

  // Actions
  const creatorActions = [
    "says: 'Hi, how are you?'",
    "posted a new picture!",
    "is live now! Join me!",
    "uploaded a new video, check it out!",
    "is sharing something exciting with you!",
    "just went live for a quick Q&A session.",
    "is excited about today's stream!",
  ];

  const fanActions = [
    "replied: 'I love your new post!'",
    "said: 'Great to see you live!'",
    "commented: 'I can't wait to join the stream!'",
    "responded: 'Your content is amazing!'",
    "sent a message: 'I'm a huge fan!'",
    "liked the post and commented: 'Awesome work!'",
  ];

  // Objects (places or content)
  const locations = [
    "in your latest vlog",
    "on your profile",
    "during your live session",
    "under your new post",
    "on your stream chat",
    "on your latest pic",
    "under the new video",
  ];

  // Creator message (random selection)
  const creatorMessage = `${creators[Math.floor(Math.random() * creators.length)]} ${creatorActions[Math.floor(Math.random() * creatorActions.length)]} ${locations[Math.floor(Math.random() * locations.length)]}`;

  // Fan message (random selection)
  //const fanMessage = `${fans[Math.floor(Math.random() * fans.length)]} ${fanActions[Math.floor(Math.random() * fanActions.length)]}`;

  // get Message for creator
  return `${creatorMessage}`;
}
console.log(generateRandomMessage());

// Fill input field after waiting for it to be visible
async function fillInput(page, selector, value) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout: 10000 });
  await element.fill(value);
  console.log(`Filled input ${selector} with value "${value}"`);
}

// Highlight an element on the page
async function highlightElement(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      el.style.outline = '3px solid red';
      el.style.transition = 'outline 0.3s ease-in-out';
      setTimeout(() => {
        el.style.outline = '';
      }, 1000);
    }
  }, selector);
  console.log(`Highlighted element: ${selector}`);
}


// Capture screenshot with timestamped filename
async function takeScreenshot(page, name = 'screenshot') {
  const dir = 'screenshots';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(dir, `${name}-${timestamp}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot saved: ${filePath}`);
}


// Select an option from a dropdown
async function selectDropdown(page, selector, option) {
  await highlightElement(page, selector);
  await page.selectOption(selector, option);
  console.log(`Selected "${option}" in dropdown ${selector}`);
}


// Upload file to input[type="file"]
async function uploadFile(page, selector, filePath) {
  const input = await page.$(selector);
  await input.setInputFiles(filePath);
  console.log(`Uploaded file: ${filePath} to input ${selector}`);
}


// Wait for chat to load by checking for specific elements
async function waitForChatToLoad(page, expectedName) {
  const chatHeader = page.locator('.chat-header span'); // adjust if needed
  const chatMessages = page.locator('.chat-messages'); // or another solid selector
  
  try {
    await chatHeader.waitFor({ state: 'visible', timeout: 10000 });
    const headerText = await chatHeader.textContent();
    console.log('Chat header text:', headerText);

    if (!headerText?.includes(expectedName)) {
      console.warn(`Chat opened, but expected creator name not found. Header: ${headerText}`);
      return false;
    }

    await chatMessages.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Chat loaded successfully with visible messages.');
    return true;
  } catch (err) {
    console.warn('Chat load wait failed:', err.message);
    return false;
  }
}

// Safely click an element with error handling and screenshot on failure
async function safeClick(page, locator, screenshotName = 'click_error') {
  try {
    await locator.waitFor({ state: 'attached', timeout: 5000 });

    if (!await locator.isVisible()) {
      await locator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500); // small delay after scroll
    }

    await locator.waitFor({ state: 'visible', timeout: 5000 });

    if (!await locator.isEnabled()) {
      throw new Error('Element is not enabled');
    }

    await locator.click();
  } catch (error) {
    await page.screenshot({ path: `${screenshotName}.png` });
    throw new Error(`Click failed on element: ${error.message}`);
  }

}


// Click on enable button
export async function clickEnabledButtonWithRetry(page, buttonText, maxRetries = 3, screenshotPrefix = 'click_button') {
  let attempt = 0;
  let clicked = false;

  while (attempt < maxRetries && !clicked) {
    try {
      attempt++;
      console.log(`Attempt ${attempt}: Finding and clicking button with text "${buttonText}"`);
      await page.waitForTimeout(1000); // short wait between retries

      const allButtons = page.locator('button', { hasText: buttonText });
      const count = await allButtons.count();

      if (count === 0) {
        console.warn(`No button with text "${buttonText}" found on the page.`);
        continue;
      }

      console.log(`Found ${count} button(s) with text "${buttonText}"`);

      for (let i = 0; i < count; i++) {
        const button = allButtons.nth(i);
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();

        console.log(`Button #${i + 1} → Visible: ${isVisible}, Enabled: ${isEnabled}`);

        if (isVisible && isEnabled) {
          await button.scrollIntoViewIfNeeded();
          await button.waitForElementState('visible');
          await button.waitForElementState('enabled');
          await button.click({ timeout: 10000 });
          console.log(`Successfully clicked button #${i + 1} with text "${buttonText}"`);
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        throw new Error(`All "${buttonText}" buttons were either hidden or disabled`);
      }

    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error.message}`);
      await page.screenshot({
        path: `${screenshotPrefix}_attempt_${attempt}.png`,
        fullPage: true,
      });

      if (attempt === maxRetries) {
        throw new Error(`Failed to click "${buttonText}" button after ${maxRetries} retries`);
      }
    }
  }
}


// Scroll through chat list to find and click chat by creator name
async function clickChatByCreatorName(page, creatorName) {
  const chatItem = page.locator(
    `//div[contains(@class, 'chatList_chatItem__')]//span[contains(@class, 'profile-last-message') and normalize-space(text())='${creatorName}']/ancestor::div[contains(@class, 'chatList_chatItem__')]`
  );

  let visible = await chatItem.first().isVisible().catch(() => false);

  if (!visible) {
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1000);
      visible = await chatItem.first().isVisible().catch(() => false);
      if (visible) break;
    }
  }

  if (visible) {
    await chatItem.first().click({ force: true });
    await page.waitForTimeout(3000);
  } else {
    throw new Error(`Could not find chat item with profile-last-message for "${creatorName}"`);
  }
}

// Scroll down a chat list container to load more items
async function scrollDownChatList(page, chatContainerSelector, scrollStep = 300, maxScrolls = 10) {
  const chatContainer = page.locator(chatContainerSelector);

  for (let i = 0; i < maxScrolls; i++) {
    await chatContainer.evaluate((node, step) => {
      node.scrollBy({ top: step, behavior: 'smooth' });
    }, scrollStep);

    await page.waitForTimeout(300);
    console.log(`Scrolled chat list ${i + 1} time(s)`);
  }
}

// Scroll the full page down by a certain step, multiple times
async function scrollDownPage(page, scrollStep = 500, maxScrolls = 10) {
  for (let i = 0; i < maxScrolls; i++) {
    await page.mouse.wheel(0, scrollStep);
    await page.waitForTimeout(300);
    console.log(`Scrolled page down ${i + 1} time(s)`);
  }
}

// Scroll a scrollable container up by X pixels
async function scrollElementUp(page, selector, pixels = 500) {
  const element = page.locator(selector);
  await element.evaluate((el, px) => el.scrollBy(0, -px), pixels);
  console.log(`Scrolled element ${selector} up by ${pixels}px`);
}


// Scroll the full page up by X pixels
async function scrollPageUp(page, pixels = 500) {
  await page.mouse.wheel(0, -pixels);
  console.log(`Scrolled page up by ${pixels}px`);
}

// Wait for an element to be clickable and then click it.
async function waitAndClick(locator, { timeout = 10000, description = '' } = {}) {
  try {
    if (description) console.log(`Waiting for ${description}`);

    await locator.waitFor({ state: 'attached', timeout });
    await locator.waitFor({ state: 'visible', timeout });
    await locator.waitFor({ state: 'enabled', timeout });

    await locator.click({ force: true });

    if (description) console.log(`Clicked ${description}`);
  } catch (err) {
    console.error(`Error clicking ${description || 'element'}: ${err.message}`);
    throw err;
  }
}

// Check if an element is visible on the page
async function isElementVisible(locator, timeout = 5000) {
  try {
    return await locator.isVisible({ timeout });
  } catch {
    return false;
  }
}

// Extract and return trimmed text content from a locator
async function getText(locator) {
  const text = await locator.textContent();
  console.log(`Extracted text: ${text}`);
  return text?.trim();
}

// Retry a function multiple times with delay
async function assertTextVisible(page, text, timeout = 5000) {
  const locator = page.locator(`text="${text}"`);
  await locator.waitFor({ state: 'visible', timeout });
  console.log(`Verified text is visible: "${text}"`);
}


  // Wait for network to be idle  
async function waitForNetworkIdle(page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
  console.log('Network is idle');
}

// Wait for URL to contain specific text
async function waitForUrlContains(page, partialUrl, timeout = 10000) {
  await page.waitForFunction(
    (url) => window.location.href.includes(url),
    partialUrl,
    { timeout }
  );
  console.log(`URL now contains: ${partialUrl}`);
}


// Generate a random email address
function generateRandomEmail(prefix = 'test') {
  const random = Math.floor(Math.random() * 100000);
  return `${prefix}${random}@example.com`;
}

// Scroll to an element if not in viewport
async function scrollToElement(locator) {
  try {
    await locator.scrollIntoViewIfNeeded();
    console.log('Scrolled to element');
  } catch (err) {
    console.warn('Scroll failed:', err.message);
  }
}


// Assert that an element's attribute matches expected value
async function assertAttribute(locator, attribute, expectedValue) {
  const value = await locator.getAttribute(attribute);
  if (value !== expectedValue) {
    throw new Error(`Attribute ${attribute} expected "${expectedValue}" but got "${value}"`);
  }
  console.log(`Attribute ${attribute} matches expected value: ${expectedValue}`);
}


// Clear an input field and type new text
async function clearAndType(locator, text) {
  await locator.click({ clickCount: 3 }); // select all
  await locator.press('Backspace'); // clear
  await locator.type(text);
  console.log(`Cleared and typed: ${text}`);
}

// Scroll down a chat list container to load more items
async function retry(fn, retries = 3, delay = 10000) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Retry ${i + 1} failed: ${err.message}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw lastError;
}



// Export all helpers
module.exports = {
  fillInput,
  highlightElement,
  takeScreenshot,
  selectDropdown,
  uploadFile,
  generatePhrase,
  generateRandomMessage,
  waitForChatToLoad,
  safeClick,
  clickChatByCreatorName,
  waitAndClick,
  waitForUrlContains,
  waitForNetworkIdle,
  assertTextVisible,
  getText,
  isElementVisible,
  retry,
  clearAndType,
  assertAttribute,
  scrollToElement,
  generateRandomEmail,
  scrollDownChatList,
  scrollDownPage,
  scrollPageUp,
  scrollElementUp,
};

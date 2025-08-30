const fs = require('fs');
const path = require('path');

// helpers.js
function generateRandomMessage() {
  const subjects = ["The cat", "A dog", "My neighbor", "The teacher", "A developer"];
  const actions = ["is coding", "is jumping", "is running", "is sleeping", "is eating"];
  const objects = ["on the roof", "under the bed", "in the kitchen", "in the office", "on the street"];

  // Line 1: Random combination of subject, action, and object
  const line1 = `${subjects[Math.floor(Math.random() * subjects.length)]} ${actions[Math.floor(Math.random() * actions.length)]} ${objects[Math.floor(Math.random() * objects.length)]}`;

  // Line 2: A similar random sentence but with a fixed ending.
  const line2 = `${subjects[Math.floor(Math.random() * subjects.length)]} ${actions[Math.floor(Math.random() * actions.length)]} in the park.`;

  return `${line1}\n${line2}`;
}

/**
 * Fill a text input field after waiting for visibility
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS or data-testid locator
 * @param {string} value - Text to fill
 */
async function fillInput(page, selector, value) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout: 10000 });
  await element.fill(value);
  console.log(`Filled input ${selector} with value "${value}"`);
}

/**
 * Click an element after waiting for it to be visible
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS or data-testid locator
 */
async function clickElement(page, selector) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout: 10000 });
  await element.click();
  console.log(`Clicked element ${selector}`);
}

/**
 * Highlight an element (useful for debugging)
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS or data-testid locator
 */
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

/**
 * Take a screenshot with a timestamp
 * @param {import('@playwright/test').Page} page
 * @param {string} name - Screenshot name (optional)
 */
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

/**
 * Select dropdown option by value, label, or index
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS or data-testid locator
 * @param {string|number} option - Option value, label, or index
 */
async function selectDropdown(page, selector, option) {
  await highlightElement(page, selector);
  await page.selectOption(selector, option);
  console.log(`Selected "${option}" in dropdown ${selector}`);
}

/**
 * Upload a file to input[type="file"]
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS or data-testid locator
 * @param {string} filePath - Path to file to upload
 */
async function uploadFile(page, selector, filePath) {
  const input = await page.$(selector);
  await input.setInputFiles(filePath);
  console.log(`Uploaded file: ${filePath} to input ${selector}`);
}

/**
 * Wait for the chat to load and verify creator name
 * @param {import('@playwright/test').Page} page
 * @param {string} expectedName - The expected creator's name in the chat header
 * @returns {boolean} - Whether the chat loaded successfully and the creator name was found
 */
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

// Export all helpers
module.exports = {
  fillInput,
  clickElement,
  highlightElement,
  takeScreenshot,
  selectDropdown,
  uploadFile,
  generateRandomMessage,
  waitForChatToLoad
};

// utils/helpers.js

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
 */
async function clickElement(page, selector) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout: 10000 });
  await element.click();
  console.log(`Clicked element ${selector}`);
}

/**
 * Highlight an element (useful for debugging)
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
 */
const fs = require('fs');
const path = require('path');

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
 */
async function selectDropdown(page, selector, option) {
  await highlightElement(page, selector);
  await page.selectOption(selector, option);
  console.log(`Selected "${option}" in dropdown ${selector}`);
}

/**
 * Upload a file to input[type="file"]
 */
async function uploadFile(page, selector, filePath) {
  const input = await page.$(selector);
  await input.setInputFiles(filePath);
  console.log(`Uploaded file: ${filePath} to input ${selector}`);
}
// helpers.js

/**
 * Asynchronously generates a unique two-line message using faker (ESM).
 * Useful when faker must be dynamically imported in a CommonJS environment.
 */
async function generatePhrase() {
  const { faker } = await import('@faker-js/faker');
  const line1 = faker.hacker.phrase();
  const line2 = faker.company.catchPhrase();
  return `${line1}\n${line2}`;
}

/**
 * Synchronously generates a unique two-line message.
 * WARNING: Only works if you're using "type": "module" in package.json
 * OR have imported faker elsewhere before calling this.
 */
let cachedFaker = null;

function generateRandomMessageSync() {
  if (!cachedFaker) {
    throw new Error(
      'faker is not loaded. Use generatePhrase() or modify your setup to allow synchronous imports.'
    );
  }
  const line1 = cachedFaker.hacker.phrase();
  const line2 = cachedFaker.company.catchPhrase();
  return `${line1}\n${line2}`;
}

/**
 * Load faker once for use with sync generator
 */
async function preloadFaker() {
  const { faker } = await import('@faker-js/faker');
  cachedFaker = faker;
}

module.exports = {
  generatePhrase,
  generateRandomMessageSync,
  preloadFaker
};


// For chat loading wait
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




//  Export all helpers
module.exports = {
  fillInput,
  clickElement,
  highlightElement,
  takeScreenshot,
  selectDropdown,
  uploadFile,
  waitForChatToLoad, 
  generatePhrase,
  generateRandomMessageSync,
  preloadFaker,


//  Call the function with define the helper then used the fun() by passing parameters

// const helpers = require('../utils/helpers');

// await helpers.fillInput(page, '[data-eid="SignUp/Email"]', 'test@example.com');
// await helpers.clickElement(page, '[data-eid="SignUp/Create_account_button"]');
// await helpers.takeScreenshot(page, 'after-submit');
// await helpers.highlightElement(page, '[data-eid="SignUp/Email"]');

};

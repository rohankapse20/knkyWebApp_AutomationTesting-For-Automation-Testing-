const fs = require('fs');
const path = require('path');


// Updated message content for a creator and fan interaction
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

  // Combine both
  return `${creatorMessage}`;
}

console.log(generateRandomMessage());



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

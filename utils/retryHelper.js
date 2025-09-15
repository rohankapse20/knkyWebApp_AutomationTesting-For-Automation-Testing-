
async function retry(fn, { retries = 3, delay = 1000, stepName = 'Step' } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Retry] Attempt ${attempt} for: ${stepName}`);
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`[Retry] ${stepName} failed on attempt ${attempt}: ${error.message}`);

      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  console.error(`[Retry] ${stepName} failed after ${retries} attempts`);
  throw lastError;
}

module.exports = { retry };


/*

>> Used in Test :

    // Import the function 
    const { retry } = require('../utils/retryHelper');

    // Inside a test step:
    await retry(async () => {
    await expect(page.locator('text=Welcome Back, PlayfulMistress')).toBeVisible({ timeout: 5000 });
    }, { retries: 3, delay: 2000, stepName: 'Welcome popup check' });


*/

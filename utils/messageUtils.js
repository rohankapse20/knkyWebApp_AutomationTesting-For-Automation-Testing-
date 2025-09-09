
const fs = require('fs');
const path = require('path');

const messagePath = path.resolve(__dirname, '../data/lastSentMessage.json');

async function getLatestExpectedMessage(maxRetries = 10, intervalMs = 2000) {
  let lastSeenMessage = '';
  let currentMessage = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fileContent = fs.readFileSync(messagePath, 'utf-8');
      const data = JSON.parse(fileContent);
      currentMessage = (data.message || '').trim();

      if (currentMessage && currentMessage !== lastSeenMessage) {
        console.log(`📩 Message received from file on attempt ${attempt}: ${currentMessage}`);
        return currentMessage;
      }

      console.log(`⏳ Waiting for updated message (Attempt ${attempt})...`);
      lastSeenMessage = currentMessage;

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (err) {
      console.warn(`⚠️ Failed to read/parse message on attempt ${attempt}: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(`❌ Timed out waiting for updated message in lastSentMessage.json`);
}

module.exports = {
  getLatestExpectedMessage
};

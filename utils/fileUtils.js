const fs = require('fs');
const path = require('path');

async function writeSentMessageSafely({ creatorEmail, messageToSend, type }) {
  const dirPath = path.resolve(__dirname, '../../shared-test-data');
  const filePath = path.join(dirPath, 'sentMessages.json');

  // Ensure the directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created shared directory: ${dirPath}`);
  }

  const MAX_RETRIES = 5;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      let sentMessages = {};
      if (fs.existsSync(filePath)) {
        try {
          sentMessages = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (e) {
          console.warn('Could not parse sentMessages.json. Creating a new one.');
          sentMessages = {};
        }
      }

      // Update message
      sentMessages[creatorEmail] = {
        message: messageToSend,
        type,
        timestamp: new Date().toISOString()
      };

      // Atomic write: write to temp and rename
      const tempFilePath = `${filePath}.tmp`;
      fs.writeFileSync(tempFilePath, JSON.stringify(sentMessages, null, 2));
      fs.renameSync(tempFilePath, filePath);

      console.log(`Saved sent message for ${creatorEmail}`);
      return;

    } catch (err) {
      console.warn(`Write attempt ${attempt} failed. Retrying...`);
      await new Promise(res => setTimeout(res, 200 + Math.random() * 500));
    }
  }

  throw new Error(`Failed to write to sentMessages.json after ${MAX_RETRIES} retries`);
}

async function waitForFileUpdate(creatorEmail, previousMessage, maxRetries = 40, delayMs = 3000) {
  const messagesFilePath = path.resolve(__dirname, '../../shared-test-data/sentMessages.json');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (fs.existsSync(messagesFilePath)) {
        const rawData = fs.readFileSync(messagesFilePath, 'utf-8');
        const messages = JSON.parse(rawData);
        const newMessage = messages?.[creatorEmail]?.message ?? '';

        if (newMessage && newMessage !== previousMessage) {
          console.log(`Message updated after ${attempt} attempt(s).`);
          return newMessage;
        } else {
          console.log(`Attempt ${attempt}: Message not updated yet.`);
        }
      } else {
        console.log(`Attempt ${attempt}: sentMessages.json not found yet.`);
      }
    } catch (err) {
      console.warn(`Attempt ${attempt}: Error reading/parsing file - ${err.message}`);
    }

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Timeout: Message not updated after ${maxRetries * delayMs / 1000}s.`);
}

module.exports = {
  writeSentMessageSafely,
  waitForFileUpdate,
};

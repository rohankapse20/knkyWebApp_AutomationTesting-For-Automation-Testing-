import fs from 'fs';
import path from 'path';

const messagesFilePath = path.resolve(__dirname, '../test-data/sentMessages.json');

export const waitForFileUpdate = async (creatorEmail, previousMessage = '', maxRetries = 20, delay = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (!fs.existsSync(messagesFilePath)) {
      throw new Error(`sentMessages.json not found at ${messagesFilePath}`);
    }

    const messages = JSON.parse(fs.readFileSync(messagesFilePath, 'utf-8'));
    const current = messages[creatorEmail];

    if (current?.message && current.message !== previousMessage) {
      return current.message;
    }

    console.log(`[waitForFileUpdate] ⏳ Attempt ${attempt}: Message not updated yet, retrying...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(`Timed out waiting for updated message for ${creatorEmail}`);
};

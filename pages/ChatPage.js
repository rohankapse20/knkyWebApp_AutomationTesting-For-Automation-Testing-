class ChatPage {
  constructor(page) {
    this.page = page;
    this.chatInput = page.locator('[data-eid="Chat/Input"]');
    this.sendBtn = page.locator('[data-eid="Chat/Send_btn"]');
    this.lastMessage = page.locator('.chat-message:last-child');
    this.uploadInput = page.locator('input[type="file"]'); 
  }

  async navigateToChat() {
    await this.page.click('[data-eid="Sidebar/Chat"]');
    await this.page.waitForSelector('[data-eid="Chat/Input"]');
  }

  async sendMessage(msg) {
    await this.chatInput.fill(msg);
    await this.sendBtn.click();
  }

  async sendMedia(filePath) {
    await this.uploadInput.setInputFiles(filePath);
    await this.sendBtn.click();
  }

  async navigateToChatWithUser(userEmail) {
    await this.page.click(`[data-eid="Chat/Contact"][data-user="${userEmail}"]`);
  }

  async getLastReceivedMessage() {
    await this.lastMessage.waitFor({ timeout: 5000 });
    return await this.lastMessage.textContent();
  }
}

module.exports = { ChatPage };

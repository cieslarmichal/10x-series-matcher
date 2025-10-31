import type { Page } from '@playwright/test';
import { BasePageModel } from './BasePageModel.ts';

export class WatchRoomPageModel extends BasePageModel {
  override readonly page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  get roomTitle() {
    return this.page.locator('h1, [data-testid="room-title"]');
  }

  get roomDescription() {
    return this.page.locator('[data-testid="room-description"]');
  }

  get inviteCodeDisplay() {
    return this.page.locator('[data-testid="invite-code"]');
  }

  get copyInviteLinkButton() {
    return this.page.getByRole('button', { name: /copy.*link|share/i });
  }

  get participantsList() {
    return this.page.locator('[data-testid="participants-list"]');
  }

  get generateRecommendationsButton() {
    return this.page.getByRole('button', { name: /generate.*recommendation/i });
  }

  get recommendationsList() {
    return this.page.locator('[data-testid="recommendations-list"]');
  }

  get loadingIndicator() {
    return this.page.locator('[data-testid="loading"], .loading, [role="progressbar"]');
  }

  get errorMessage() {
    return this.page.locator('[role="alert"]');
  }

  get leaveRoomButton() {
    return this.page.getByRole('button', { name: /leave.*room/i });
  }

  async gotoRoom(roomId: string): Promise<void> {
    await super.goto(`/watchrooms/${roomId}`);
  }

  async copyInviteLink(): Promise<void> {
    await this.copyInviteLinkButton.click();
  }

  async generateRecommendations(): Promise<void> {
    await this.generateRecommendationsButton.click();
  }

  async leaveRoom(): Promise<void> {
    await this.leaveRoomButton.click();
  }

  async waitForRecommendations(): Promise<void> {
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
  }

  async getParticipantsCount(): Promise<number> {
    return this.participantsList.locator('> *').count();
  }

  async getRecommendationsCount(): Promise<number> {
    return this.recommendationsList.locator('> *').count();
  }

  async getRoomTitle(): Promise<string> {
    return this.getTextContent(this.roomTitle);
  }

  async isGenerateButtonEnabled(): Promise<boolean> {
    return !(await this.generateRecommendationsButton.isDisabled());
  }
}

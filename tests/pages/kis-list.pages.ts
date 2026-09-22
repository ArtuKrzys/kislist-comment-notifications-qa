import type { Locator, Page } from '@playwright/test';

export class ProfilePage {
  constructor(private readonly page: Page, private readonly baseUrl: string) {}

  async open(): Promise<void> {
    await this.page.goto(new URL('/profile', this.baseUrl).toString());
  }

  async email(): Promise<string> {
    return this.page.getByRole('textbox', { name: 'Adres e-mail' }).inputValue();
  }
}

export class EditorListPage {
  constructor(private readonly page: Page, private readonly url: string) {}

  async open(): Promise<void> {
    await this.page.goto(this.url);
  }

  async openMembers(): Promise<void> {
    await this.page.getByTitle('Dodaj członka zespołu lub współpracownika').click();
  }

  member(email: string): Locator {
    return this.page.getByRole('dialog').getByText(email, { exact: true });
  }

  listName(name: string): Locator {
    return this.page.getByText(name, { exact: true }).first();
  }
}

export class SharedListPage {
  constructor(private readonly page: Page, private readonly url: string) {}

  async open(): Promise<void> {
    await this.page.goto(this.url);
  }

  listName(name: string): Locator {
    return this.page.getByText(name, { exact: true }).first();
  }

  comment(productName: string, body: string): Locator {
    return this.product(productName).getByText(body, { exact: true });
  }

  async addProductComment(productName: string, body: string): Promise<void> {
    await this.product(productName).getByRole('button', { name: 'Napisz komentarz' }).click();
    await this.page.locator('[contenteditable="true"][role="textbox"]').fill(body);
    await this.page.getByRole('button', { name: 'Wyślij', exact: true }).click();
  }

  private product(name: string): Locator {
    return this.page
      .getByRole('img', { name, exact: true })
      .locator('xpath=ancestor::*[.//button[normalize-space()="Napisz komentarz"]][1]');
  }
}

export class InboxPage {
  constructor(private readonly page: Page, private readonly baseUrl: string) {}

  async open(): Promise<void> {
    await this.page.goto(new URL('/inbox', this.baseUrl).toString());
  }

  async notificationCount(comment: string): Promise<number> {
    await this.page.reload();
    await this.page.getByRole('button', { name: /Powiadomienia/ }).first().waitFor({ state: 'visible' });
    return this.page.getByText(comment, { exact: true }).count();
  }
}

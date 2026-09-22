import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Browser, type Page } from '@playwright/test';

const ownerAuth = join('playwright', '.auth', 'owner.json');
const memberAuth = join('playwright', '.auth', 'member.json');

function testData(): { sharedListUrl: string; editorListUrl: string; listName: string; memberEmail: string; productName: string } {
  const sharedListUrl = process.env.KIS_SHARED_LIST_URL;
  const editorListUrl = process.env.KIS_EDITOR_LIST_URL;
  const listName = process.env.KIS_LIST_NAME;
  const memberEmail = process.env.KIS_MEMBER_EMAIL;
  const productName = process.env.KIS_PRODUCT_NAME;

  if (!sharedListUrl || !editorListUrl || !listName || !memberEmail || !productName) {
    throw new Error('Uzupełnij KIS_SHARED_LIST_URL, KIS_EDITOR_LIST_URL, KIS_LIST_NAME, KIS_MEMBER_EMAIL i KIS_PRODUCT_NAME w lokalnym pliku .env.');
  }

  const sharedUrl = new URL(sharedListUrl);
  const editorUrl = new URL(editorListUrl);
  if (sharedUrl.origin !== 'https://kislist.com' || !sharedUrl.pathname.startsWith('/list-preview/')) {
    throw new Error('KIS_SHARED_LIST_URL musi wskazywać udostępnioną listę w kislist.com.');
  }
  if (editorUrl.origin !== sharedUrl.origin || !/^\/lists\/[^/]+\/edit$/.test(editorUrl.pathname)) {
    throw new Error('KIS_EDITOR_LIST_URL musi wskazywać edycję tej samej listy w kislist.com.');
  }

  for (const file of [ownerAuth, memberAuth]) {
    if (!existsSync(file)) {
      throw new Error(`Brak lokalnej sesji ${file}. Uruchom skrypty auth:owner i auth:member.`);
    }
  }

  return { sharedListUrl, editorListUrl, listName, memberEmail, productName };
}

async function notificationCount(page: Page, comment: string): Promise<number> {
  await page.reload();
  await expect(page.getByRole('button', { name: /Powiadomienia/ }).first()).toBeVisible();
  return page.getByText(comment, { exact: true }).count();
}

async function openInbox(browser: Browser, storageState: string): Promise<{ page: Page; profileEmail: string; close: () => Promise<void> }> {
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  const baseUrl = process.env.KIS_BASE_URL ?? 'https://kislist.com';
  await page.goto(new URL('/profile', baseUrl).toString());
  const profileEmail = await page.getByRole('textbox', { name: 'Adres e-mail' }).inputValue();
  await page.goto(new URL('/inbox', baseUrl).toString());
  return { page, profileEmail, close: () => context.close() };
}

test('komentarz klienta do udostępnionej listy powiadamia właściciela i członka zespołu', async ({ browser }) => {
  test.setTimeout(60_000);
  const { sharedListUrl, editorListUrl, listName, memberEmail, productName } = testData();
  const comment = `QA-E2E-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const clientContext = await browser.newContext();
  const owner = await openInbox(browser, ownerAuth);
  const member = await openInbox(browser, memberAuth);

  try {
    expect(member.profileEmail.toLowerCase(), 'Sesja pracownika musi należeć do członka przypisanego do listy.').toBe(memberEmail.toLowerCase());
    expect(member.profileEmail.toLowerCase(), 'Sesje właściciela i pracownika muszą należeć do różnych kont.').not.toBe(owner.profileEmail.toLowerCase());

    await owner.page.goto(editorListUrl);
    await owner.page.locator('[title="Dodaj członka zespołu lub współpracownika"]').click();
    await expect(owner.page.getByRole('dialog').getByText(memberEmail, { exact: true })).toBeVisible();
    await owner.page.goto(new URL('/inbox', process.env.KIS_BASE_URL ?? 'https://kislist.com').toString());

    await member.page.goto(editorListUrl);
    await expect(member.page.getByText(listName, { exact: true }).first()).toBeVisible();
    await member.page.goto(new URL('/inbox', process.env.KIS_BASE_URL ?? 'https://kislist.com').toString());

    const clientPage = await clientContext.newPage();
    await clientPage.goto(sharedListUrl);
    await expect(clientPage.getByText(listName, { exact: true }).first()).toBeVisible();

    // Produkt identyfikujemy po nazwie, bo przycisk komentarza powtarza się przy każdym produkcie.
    const product = clientPage
      .getByRole('img', { name: productName })
      .locator('xpath=ancestor::*[.//button[normalize-space()="Napisz komentarz"]][1]');
    await product.getByRole('button', { name: 'Napisz komentarz' }).click();
    await clientPage.locator('[contenteditable="true"][role="textbox"]').fill(comment);
    await clientPage.getByRole('button', { name: 'Wyślij', exact: true }).click();
    await expect(product.getByText(comment, { exact: true })).toBeVisible();

    await expect.poll(() => notificationCount(owner.page, comment), {
      message: 'Powiadomienie kontrolne powinno dotrzeć do właściciela listy.',
      timeout: 30_000,
      intervals: [1_000, 2_000, 3_000],
    }).toBe(1);

    await expect.poll(() => notificationCount(member.page, comment), {
      message: 'Komentarz klienta powinien powiadomić także przypisanego członka zespołu.',
      timeout: 30_000,
      intervals: [1_000, 2_000, 3_000],
    }).toBe(1);
  } finally {
    await Promise.all([clientContext.close(), owner.close(), member.close()]);
  }
});

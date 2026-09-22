import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext } from '@playwright/test';
import { EditorListPage, InboxPage, ProfilePage, SharedListPage } from './pages/kis-list.pages';

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

test('komentarz klienta do udostępnionej listy powiadamia właściciela i członka zespołu', async ({ browser, page: clientPage }) => {
  // Dwa oczekiwania po 30 s oraz logowanie i kontrola członkostwa muszą zmieścić się w limicie testu.
  test.setTimeout(90_000);
  const { sharedListUrl, editorListUrl, listName, memberEmail, productName } = testData();
  const baseUrl = process.env.KIS_BASE_URL ?? 'https://kislist.com';
  const comment = `QA-E2E-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let ownerContext: BrowserContext | undefined;
  let memberContext: BrowserContext | undefined;

  try {
    ownerContext = await browser.newContext({ storageState: ownerAuth });
    memberContext = await browser.newContext({ storageState: memberAuth });
    const ownerPage = await ownerContext.newPage();
    const memberPage = await memberContext.newPage();
    const ownerProfile = new ProfilePage(ownerPage, baseUrl);
    const memberProfile = new ProfilePage(memberPage, baseUrl);
    const ownerList = new EditorListPage(ownerPage, editorListUrl);
    const memberList = new EditorListPage(memberPage, editorListUrl);
    const sharedList = new SharedListPage(clientPage, sharedListUrl);
    const ownerInbox = new InboxPage(ownerPage, baseUrl);
    const memberInbox = new InboxPage(memberPage, baseUrl);

    await ownerProfile.open();
    const ownerEmail = await ownerProfile.email();
    await memberProfile.open();
    const actualMemberEmail = await memberProfile.email();
    expect(actualMemberEmail.toLowerCase(), 'Sesja pracownika musi należeć do członka przypisanego do listy.').toBe(memberEmail.toLowerCase());
    expect(actualMemberEmail.toLowerCase(), 'Sesje właściciela i pracownika muszą należeć do różnych kont.').not.toBe(ownerEmail.toLowerCase());

    await ownerList.open();
    await ownerList.openMembers();
    await expect(ownerList.member(memberEmail)).toBeVisible();
    await ownerInbox.open();

    await memberList.open();
    await expect(memberList.listName(listName)).toBeVisible();
    await memberInbox.open();

    await sharedList.open();
    await expect(sharedList.listName(listName)).toBeVisible();
    await sharedList.addProductComment(productName, comment);
    await expect(sharedList.comment(productName, comment)).toBeVisible();

    await expect.poll(() => ownerInbox.notificationCount(comment), {
      message: 'Powiadomienie kontrolne powinno dotrzeć do właściciela listy.',
      timeout: 30_000,
      intervals: [1_000, 2_000, 3_000],
    }).toBe(1);

    await expect.poll(() => memberInbox.notificationCount(comment), {
      message: 'Komentarz klienta powinien powiadomić także przypisanego członka zespołu.',
      timeout: 30_000,
      intervals: [1_000, 2_000, 3_000],
    }).toBe(1);
  } finally {
    await Promise.all([ownerContext?.close(), memberContext?.close()]);
  }
});

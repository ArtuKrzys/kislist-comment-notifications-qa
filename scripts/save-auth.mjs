import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { chromium } from '@playwright/test';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const role = process.argv[2];
if (role !== 'owner' && role !== 'member') {
  throw new Error('Podaj rolę: owner albo member.');
}

const baseUrl = process.env.KIS_BASE_URL ?? 'https://kislist.com';
const authDirectory = join('playwright', '.auth');
const authFile = join(authDirectory, `${role}.json`);
mkdirSync(authDirectory, { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
const prompt = createInterface({ input: stdin, output: stdout });

try {
  await page.goto(new URL('/lists', baseUrl).toString());
  stdout.write(`Zaloguj się w otwartym oknie jako ${role === 'owner' ? 'właściciel' : 'pracownik'} (także kodem SMS, jeśli jest wymagany).\n`);
  await prompt.question('Gdy zobaczysz listy po zalogowaniu, naciśnij Enter tutaj...');

  await page.goto(new URL('/profile', baseUrl).toString());
  const profileEmail = await page.getByRole('textbox', { name: 'Adres e-mail' }).inputValue();
  if (!profileEmail) {
    throw new Error('Nie potwierdzono zalogowania w profilu. Plik sesji nie został zapisany.');
  }
  await page.goto(new URL('/inbox', baseUrl).toString());
  await page.getByRole('button', { name: /Powiadomienia/ }).first().waitFor();

  await context.storageState({ path: authFile, indexedDB: true });
  stdout.write(`Zapisano lokalną sesję: ${authFile}\n`);
} finally {
  prompt.close();
  await browser.close();
}

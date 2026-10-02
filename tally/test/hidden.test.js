import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const slug = 'hhkbu88gx5i4';

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('the public site does not link to the tally', () => {
  const files = [
    'landing/index.html',
    'landing/sitemap.xml',
    'landing/privacy/index.html',
    'landing/terms/index.html',
    'landing/disclosures/index.html',
    'landing/assets/main.js',
    'llms.txt',
  ];
  for (const file of files) {
    const text = read(file);
    assert.equal(text.includes(slug), false, file);
    assert.equal(text.includes('/t/'), false, file);
  }
});

test('the tally page is noindex and the sitemap omits it', () => {
  const page = read(`landing/t/${slug}/index.html`);
  assert.match(page, /noindex,nofollow/);
  assert.doesNotMatch(page, /googletagmanager|google-analytics|gtag\(|facebook\.com\/tr|plausible|umami/i);
  const sitemap = read('landing/sitemap.xml');
  assert.equal(sitemap.includes('/t/'), false);
  const robots = read('landing/robots.txt');
  assert.match(robots, /Disallow:\s*\/t\//);
});

test('the readme tells Isaac where the page is and how to add a key', () => {
  const readme = read('README.md');
  assert.match(readme, new RegExp(slug));
  assert.match(readme, /config\.js/);
  assert.match(readme, /public key/i);
});

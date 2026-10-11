import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { legacyDocUrls, legacyTarget, redirectsForLocale } from './legacy-doc-urls.mjs';
import { validateRegistry } from './check-legacy-doc-urls.mjs';

const inventory = JSON.parse(await fs.readFile(new URL('./legacy-doc-inventory.json', import.meta.url), 'utf8'));

test('both languages cover every route from the old Hugo tree', () => {
  validateRegistry(legacyDocUrls, inventory);
  assert.equal(inventory.paths.length, 50);
});

test('missing, conflicting, cyclic and retired-target mappings fail validation', () => {
  assert.throws(() => validateRegistry(legacyDocUrls.slice(1), inventory), /inventory/);
  assert.throws(() => validateRegistry([...legacyDocUrls, legacyDocUrls[0]], inventory), /Duplicate/);
  const redirects = legacyDocUrls.filter((item) => item.action === 'redirect');
  for (const to of [redirects[0].path, '/docs/prologue/flashcat', redirects[1].path]) {
    const invalid = legacyDocUrls.map((item) => item === redirects[0] ? { ...item, to } : item);
    assert.throws(() => validateRegistry(invalid, inventory), /Self redirect|chain|retired/);
  }
});

test('aliases preserve language and existing canonical routes never redirect to themselves', () => {
  assert.equal(legacyTarget('/zh/docs/prologue/architecture/'), '/zh/docs/concepts/architecture');
  assert.equal(legacyTarget('/docs/install/compose'), '/docs/install/docker-compose');
  assert.equal(legacyTarget('/docs/install/server/'), '/docs/install/overview');
  assert.equal(legacyTarget('/zh/docs/install/server'), '/zh/docs/install/overview');
  assert.equal(legacyTarget('/zh/docs/install/binary/'), '/zh/docs/install/binary');
  assert.equal(legacyTarget('/zh/docs/practice/java/'), '/zh/docs/practice/java');
  assert.equal(legacyTarget('/docs/install/binary'), null);
  assert.equal(legacyTarget('/zh/docs/practice/java'), null);
  assert.equal(legacyTarget('/zh/docs/prologue/flashcat'), null);
  assert.equal(legacyTarget('/zh/docs/unknown'), null);
  assert.equal(legacyTarget('/docs/practice/java-extra'), null);
});

test('the retired article is never emitted as a redirect', () => {
  for (const locale of ['en', 'zh-Hans']) {
    const rules = redirectsForLocale(locale);
    assert(!rules.some((item) => item.from.includes('flashcat')));
    assert(!rules.some((item) => item.from === item.to));
  }
});

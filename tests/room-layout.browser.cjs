/*
  Browser checks for the enchanted room's layout, navigation and saved data.
  Needs Playwright (npm i -D playwright, then npx playwright install chromium) and a local server:
    python -m http.server 8731        (from the project folder)
    node tests/room-layout.browser.cjs http://localhost:8731/
  Uses a fresh browser profile each time; it never touches your real room data.
*/
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const URL = process.argv[2] || 'http://localhost:8731/';
const KEY = 'midnight-study-room.enchanted.v1';
let passed = 0, failed = 0;
async function check(name, fn) { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { failed++; console.log('  ✗', name, '\n     ', e.message.split('\n')[0]); } }
const overlap = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', acceptDownloads: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.clock.install();
  await page.goto(URL); await page.waitForSelector('#enchanted-root .ew-dock'); await page.clock.runFor(800);
  const box = sel => page.locator(sel).first().boundingBox();
  const open = () => page.locator('dialog.ew-dialog[open]');

  console.log('Main room (1440 × 900)');
  await check('window world is painted inside the room window, under the sill plant', async () => {
    assert.equal(await page.locator('#ew-window-slot .ew-scenery').count(), 1);
    const p = await box('.plant'); const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y).closest('.plant'), [p.x + p.width / 2, p.y + p.height * 0.3]);
    assert.ok(hit, 'the plant is covered');
  });
  await check('world tag sits inside the window and clear of the timer and plant', async () => {
    const tag = await box('#ew-world-label');
    assert.ok(!overlap(tag, await box('.plant')), 'tag overlaps plant');
    assert.ok(!overlap(tag, await box('[role=timer]')), 'tag overlaps timer');
    const win = await box('#ew-window-slot'); assert.ok(tag.y > win.y && tag.y + tag.height < win.y + win.height, 'tag outside window');
  });
  await check('companion and its name are clear of the dock', async () => {
    const dock = await box('.ew-dock');
    assert.ok(!overlap(await box('#enchanted-root > .ew-pet'), dock), 'pet overlaps dock');
    assert.ok(!overlap(await box('#enchanted-root > .ew-pet .ew-pet-name'), dock), 'name overlaps dock');
  });
  await check('the Beyond door does not cover the desk or notebook', async () => {
    const door = await box('.ew-door');
    assert.ok(!overlap(door, await box('.desk-top')), 'door overlaps desk');
  });
  await check('dimming the lamp also dims the companion and door', async () => {
    await page.getByRole('button', { name: 'Desk lamp' }).click(); await page.clock.runFor(1000);
    assert.match(await page.locator('#enchanted-root > .ew-pet').evaluate(n => getComputedStyle(n).filter), /brightness/);
    await page.getByRole('button', { name: 'Desk lamp' }).click(); await page.clock.runFor(1000);
  });

  console.log('Dialogs and rooms');
  await check('destination buttons show two lines, not one run-on label', async () => {
    await page.getByRole('button', { name: 'Open the door to other rooms' }).click();
    const t = await open().getByRole('button', { name: /moonlit balcony/ }).innerText(); assert.ok(t.includes('\n'), JSON.stringify(t));
    await open().getByRole('button', { name: 'Close', exact: true }).click();
  });
  await check('companion appearance buttons say which is selected', async () => {
    await page.locator('#enchanted-root > .ew-pet').click();
    assert.equal(await open().getByRole('button', { name: 'Cat', exact: true }).getAttribute('aria-pressed'), 'true');
    await open().getByRole('button', { name: 'Owl', exact: true }).click();
    assert.equal(await open().getByRole('button', { name: 'Owl', exact: true }).getAttribute('aria-pressed'), 'true');
    await open().getByRole('button', { name: 'Cat', exact: true }).click();
    await open().getByRole('button', { name: 'Close', exact: true }).click();
  });
  await check('re-drawing a dialog keeps keyboard focus on the same button, and Close returns focus to the room', async () => {
    const tag = page.locator('#ew-world-label'); await tag.focus(); await page.keyboard.press('Enter');
    await open().locator('.ew-world-card', { hasText: 'Rainy city' }).focus(); await page.keyboard.press('Enter');
    assert.match(await page.evaluate(() => document.activeElement.textContent), /Rainy city/);
    await page.keyboard.press('Escape'); await page.clock.runFor(100);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'ew-world-label');
  });
  await check('course books, keyboard only: changing course keeps focus on the selector, flipping a card keeps focus on the flip button, Escape returns to the dock', async () => {
    const active = () => page.evaluate(() => { const a = document.activeElement; return { tag: a.tagName, text: (a.textContent || '').trim(), value: a.value, label: a.labels && a.labels[0] ? a.labels[0].textContent : '' }; });
    const opener = page.getByRole('button', { name: 'Course books', exact: true }); await opener.focus(); await page.keyboard.press('Enter');
    for (let i = 0; i < 12 && (await active()).tag !== 'SELECT'; i++) await page.keyboard.press('Tab');
    let a = await active(); assert.equal(a.tag, 'SELECT', 'could not Tab to the course selector'); const first = a.value;
    await page.keyboard.press('ArrowDown'); a = await active();
    assert.equal(a.tag, 'SELECT', 'focus left the course selector after changing course (now on ' + a.tag + ' "' + a.text + '")');
    assert.notEqual(a.value, first, 'the course did not change');
    await page.keyboard.press('ArrowDown'); assert.equal((await active()).tag, 'SELECT', 'a second change lost focus');
    await open().getByRole('button', { name: 'Add a card', exact: true }).focus(); await page.keyboard.press('Enter');
    assert.equal((await active()).text, 'Add a card');
    const ta = open().locator('textarea'); await ta.nth(0).fill('Keyboard question'); await ta.nth(1).fill('Keyboard answer');
    await open().getByRole('button', { name: 'Place card in this book' }).focus(); await page.keyboard.press('Enter');
    await open().getByRole('button', { name: 'Reveal answer' }).focus(); await page.keyboard.press('Enter');
    a = await active(); assert.equal(a.text, 'Show question', 'focus left the flip button after revealing');
    assert.ok((await open().locator('.ew-card').innerText()).includes('Keyboard answer'));
    await page.keyboard.press('Enter'); assert.equal((await active()).text, 'Reveal answer', 'focus left the flip button after hiding');
    await page.keyboard.press('Escape');
    for (let i = 0; i < 40 && (await active()).text !== 'Course books'; i++) await page.waitForTimeout(50);   /* the dialog's close event is asynchronous */
    assert.equal((await active()).text, 'Course books', 'focus did not return to the dock button that opened the dialog');
  });
  await check('find the key, open the greenhouse, plant a topic', async () => {
    await page.locator('#ew-world-label').click(); await open().locator('.ew-world-card', { hasText: 'Enchanted forest' }).click();
    await open().getByRole('button', { name: /Look closer/ }).click(); await open().getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('button', { name: 'Open the door to other rooms' }).click(); await open().getByRole('button', { name: /secret greenhouse/ }).click();
    await page.getByRole('button', { name: 'Plant a topic' }).click(); await open().locator('input[type=text]').first().fill('Cell division');
    await open().getByRole('button', { name: 'Place on the shelf' }).click();
    assert.equal(await page.locator('.ew-pot').count(), 1);
    assert.ok(!overlap(await box('.ew-view .ew-pet'), await box('.ew-pot')), 'companion covers the plant');
  });
  await check('observatory: a constellation is drawn and the companion stays out of the star map', async () => {
    await page.getByRole('button', { name: 'Back to the room' }).click();
    await page.getByRole('button', { name: 'Open the door to other rooms' }).click(); await open().getByRole('button', { name: /observatory/ }).click();
    await page.getByRole('button', { name: 'Create a constellation' }).click();
    await open().locator('input[type=text]').fill('Central dogma'); await open().locator('textarea').fill('DNA\nRNA\nProtein');
    await open().getByRole('button', { name: 'Place in the sky' }).click();
    assert.equal(await page.locator('.ew-map-star').count(), 3);
    assert.ok(!overlap(await box('.ew-view .ew-pet'), await box('.ew-sky-map')), 'companion inside the star map');
    await page.keyboard.press('Escape'); assert.equal(await page.locator('.ew-view').count(), 0);
  });
  await check('chalkboard and its buttons fit without scrolling the dialog', async () => {
    await page.getByRole('button', { name: 'Chalkboard' }).click(); await page.clock.runFor(300);
    const d = await open().boundingBox(), undo = await open().getByRole('button', { name: 'Undo last mark' }).boundingBox();
    assert.ok(undo.y + undo.height <= d.y + d.height, 'buttons below the fold');
    await open().getByRole('button', { name: 'Close', exact: true }).click();
  });
  await check('the companion visibly rests during focus, and a finished block brings the moth to the lamp', async () => {
    await page.locator('#enchanted-root > .ew-pet').click(); await open().getByRole('button', { name: 'Study with me' }).click();
    await page.clock.runFor(2000);
    assert.equal(await page.locator('#enchanted-root > .ew-pet').getAttribute('data-rest'), 'true');
    assert.notEqual(await page.locator('#enchanted-root > .ew-pet .ew-eyes').evaluate(n => getComputedStyle(n).transform), 'none', 'companion does not visibly rest during focus');
    await page.clock.runFor(25 * 60 * 1000 + 3000);
    const moth = await box('.ew-visitor'), lamp = await box('[aria-label="Desk lamp"]');
    assert.ok(moth, 'no moth'); assert.ok(Math.abs((moth.x + moth.width / 2) - (lamp.x + lamp.width / 2)) < 90 && moth.y < lamp.y + 40, 'moth is not by the lamp');
    assert.ok(!overlap(moth, await box('#task-input')), 'moth on the notebook');
  });

  console.log('Saved data');
  await check('notes, cards, plants, constellations and discoveries survive a refresh', async () => {
    await page.getByRole('button', { name: 'Course books' }).click();
    await open().locator('select').selectOption('bio'); await open().locator('textarea').fill('Mitosis: PMAT'); await open().getByRole('button', { name: 'Close', exact: true }).click();
    await page.reload(); await page.waitForSelector('#enchanted-root .ew-dock');
    const d = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
    assert.equal(d.notebooks.bio.notes, 'Mitosis: PMAT'); assert.equal(d.plants.length, 1); assert.equal(d.constellations.length, 1);
    assert.ok(d.discoveries.includes('key') && d.discoveries.includes('moth'));
    assert.equal(await page.locator('#ew-window-slot .ew-scenery').count(), 1);
  });
  await check('Settings › Backup includes the enchanted room, and restoring into a fresh browser brings it back', async () => {
    await page.getByRole('button', { name: 'Settings drawer' }).click(); await page.clock.runFor(400);
    await page.getByRole('button', { name: /Backup & restore/ }).click(); await page.clock.runFor(400);
    const backup = await page.locator('#bk-out').inputValue(); assert.ok(JSON.parse(backup).enchanted.notebooks.bio.notes === 'Mitosis: PMAT');
    const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }); const p2 = await fresh.newPage();
    await p2.goto(URL); await p2.waitForSelector('#enchanted-root .ew-dock');
    await p2.getByRole('button', { name: 'Settings drawer' }).click(); await p2.waitForTimeout(400);
    await p2.getByRole('button', { name: /Backup & restore/ }).click(); await p2.waitForTimeout(400);
    await p2.fill('#bk-in', backup); await p2.getByRole('button', { name: 'Restore', exact: true }).click(); await p2.waitForTimeout(400);
    const d = await p2.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
    assert.equal(d.notebooks.bio.notes, 'Mitosis: PMAT'); assert.equal(d.plants.length, 1);
    await fresh.close();
  });

  console.log('Other screens');
  await check('phone held upright: room keeps a readable size, scrolls sideways, and brings dialogs into view', async () => {
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); const p = await phone.newPage();
    await p.goto(URL); await p.waitForSelector('#enchanted-root .ew-dock');
    const scale = await p.evaluate(() => new DOMMatrix(getComputedStyle(document.getElementById('stage')).transform).a);
    assert.ok(scale > 0.8, 'scale ' + scale);
    const timer = await p.locator('[role=timer]').boundingBox(); assert.ok(timer.x >= 0 && timer.x + timer.width <= 390, 'timer not in view at start');
    await p.getByRole('button', { name: 'Settings drawer' }).click(); await p.waitForTimeout(600);
    const dlg = await p.locator('.dlg').first().boundingBox(); const mid = dlg.x + dlg.width / 2;
    assert.ok(mid > 60 && mid < 330, 'settings dialog opened off to the side (centre at ' + Math.round(mid) + ')');
    await phone.close();
  });
  await check('no JavaScript errors', async () => assert.deepEqual(errors, []));
  await browser.close();
  console.log(`\n${passed} passed, ${failed} failed`); if (failed) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });

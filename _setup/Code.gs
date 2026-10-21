/**
 * @OnlyCurrentDoc
 */

/**
 * Midnight Study Room · Room connector
 * ------------------------------------
 * Lives inside your "Midnight Study Room · Tasks" Google Sheet (Extensions → Apps Script).
 * Your study room talks to this connector to read tasks and to save your check-offs, edits,
 * moves, dismissals and studied minutes back into the sheet.
 *
 * Security: the connector only answers requests that include your private room key.
 * The key is created by setup() and stored in this script's private properties. It is never
 * in your website's code; you paste it into the room's Settings once, on your own laptop.
 *
 * You don't need to edit anything below.
 */

var SHEET_NAME = 'Tasks';
var COLS = ['id', 'status', 'title', 'course', 'kind', 'day', 'due', 'context', 'priority', 'minutes', 'studied', 'source', 'done_on', 'updated', 'updated_by', 'created', 'brief_date', 'edited'];
var EDITABLE = ['title', 'course', 'priority', 'day', 'due', 'context', 'minutes'];   // fields Lia can edit by hand
var DATE_COLS = { day: 1, due: 1, done_on: 1, brief_date: 1 };
var STAMP_COLS = { updated: 1, created: 1 };
var ROOM_FIELDS = ['status', 'title', 'course', 'kind', 'day', 'due', 'context', 'priority', 'minutes', 'studied', 'done_on', 'edited'];
var OK = {
  status: { open: 1, done: 1, dismissed: 1 },
  course: { '': 1, calc: 1, bio: 1, lab: 1, bme: 1, wri: 1, com: 1 },
  kind: { task: 1, study: 1, assignment: 1, exam: 1, quiz: 1, reminder: 1 },
  priority: { high: 1, normal: 1, low: 1 }
};

/** Run once from the editor: creates your room key and prepares the sheet. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('ROOM_KEY');
  if (!key) {
    key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    props.setProperty('ROOM_KEY', key);
  }
  var sh = sheet_();
  sh.getRange(1, 1, sh.getMaxRows(), COLS.length).setNumberFormat('@');
  Logger.log('Your room key: ' + key);
  return key;
}

/** Adds a "Midnight Study Room" menu to the sheet, to show the key again later. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Midnight Study Room').addItem('Show my room key', 'showKey').addToUi();
}
function showKey() {
  var key = PropertiesService.getScriptProperties().getProperty('ROOM_KEY') || setup();
  SpreadsheetApp.getUi().alert('Your room key', key + '\n\nPaste it into the study room: Settings drawer → Morning Brief connection.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function doGet() {
  return json_({ ok: true, hello: 'Midnight Study Room connector is running. The room talks to it with POST requests.' });
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false, error: 'bad-json' }); }
  try { return json_(handle_(body)); }
  catch (err) { return json_({ ok: false, error: 'connector-busy' }); }
}

/** The whole sync, separated from doPost so it can be tested. */
function handle_(body) {
  var key = PropertiesService.getScriptProperties().getProperty('ROOM_KEY');
  if (!key || !body || typeof body.key !== 'string' || body.key !== key) return { ok: false, error: 'not-authorized' };
  var changes = Array.isArray(body.changes) ? body.changes.slice(0, 500) : [];
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_();
    var values = sh.getDataRange().getValues();
    var header = (values[0] || []).slice(0, COLS.length).map(function (h) { return String(h).trim(); });
    if (header.slice(0, 17).join('|') !== COLS.slice(0, 17).join('|')) return { ok: false, error: 'header-changed' };
    if (header[17] !== 'edited') {
      if (header[17]) return { ok: false, error: 'header-changed' };
      sh.getRange(1, 18).setValue('edited');                      // one-time upgrade: add the "edited" column
    }
    var rows = values.slice(1).map(rowToObj_);
    var byId = {};
    rows.forEach(function (r, i) { if (r.id) byId[r.id] = i; });
    var touched = {}, appended = [];
    changes.forEach(function (c) {
      var t = clean_(c);
      if (!t) return;
      var i = byId[t.id];
      if (i === undefined) {
        var fresh = {};
        COLS.forEach(function (k) { fresh[k] = t[k] != null ? t[k] : ''; });
        delete fresh.changed;
        fresh.updated_by = 'room';
        if (!fresh.source) fresh.source = 'manual';
        if (!fresh.created) fresh.created = fresh.updated;
        byId[t.id] = rows.length;
        rows.push(fresh);
        appended.push(rows.length - 1);
        return;
      }
      var cur = rows[i];
      var sheetNewer = time_(t.updated) < time_(cur.updated);
      var fields = t.changed;                                     // exactly the fields changed in the room
      if (!fields) {                                              // an older room version sends whole rows:
        if (sheetNewer) return;                                   //   keep the sheet's newer copy (previous behaviour)
        fields = ROOM_FIELDS;
      } else if (sheetNewer && cur.updated_by !== 'brief') {
        return;                                                   // changed later from another device: keep that
      }
      // If the brief updated this task after the room's change, the room still applies only the fields
      // Lia actually changed, so the brief's fresher deadline, note or priority are never overwritten.
      fields.forEach(function (k) { if (t[k] != null) cur[k] = t[k]; });
      if (!sheetNewer) cur.updated = t.updated;
      cur.updated_by = 'room';
      touched[i] = true;
    });
    Object.keys(touched).forEach(function (i) {
      i = Number(i);
      if (appended.indexOf(i) >= 0) return;
      sh.getRange(i + 2, 1, 1, COLS.length).setValues([COLS.map(function (k) { return rows[i][k]; })]);
    });
    if (appended.length) {
      var start = values.length + 1;
      sh.getRange(start, 1, appended.length, COLS.length).setNumberFormat('@')
        .setValues(appended.map(function (i) { return COLS.map(function (k) { return rows[i][k]; }); }));
    }
    return { ok: true, tasks: rows.filter(function (r) { return r.id; }), now: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}
function rowToObj_(row) {
  var o = {};
  COLS.forEach(function (k, i) { o[k] = cell_(row[i], k); });
  o.id = String(o.id || '').trim();
  return o;
}
function cell_(v, k) {
  var tz = Session.getScriptTimeZone();
  if (v instanceof Date) return DATE_COLS[k] ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : v.toISOString();
  if (v == null) return '';
  return typeof v === 'number' ? (k === 'minutes' || k === 'studied' ? v : String(v)) : String(v);
}
function clean_(c) {
  if (!c || typeof c.id !== 'string' || !c.id.trim() || c.id.length > 120) return null;
  var t = { id: c.id.trim() };
  COLS.forEach(function (k) {
    if (k === 'id' || k === 'edited' || c[k] == null) return;
    var v = c[k];
    if (OK[k]) { v = String(v); if (!OK[k][v]) return; }
    else if (k === 'minutes' || k === 'studied') { v = Math.max(0, Math.min(10000, Number(v) || 0)); if (k === 'minutes' && !v) v = ''; }
    else if (DATE_COLS[k]) { v = String(v).slice(0, 10); if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return; }
    else if (STAMP_COLS[k]) { v = String(v).slice(0, 40); }
    else { v = String(v).replace(/^[=+\-@]+/, '').slice(0, k === 'title' ? 160 : 120); }   // never let text start like a formula
    t[k] = v;
  });
  if (c.edited != null) t.edited = list_(c.edited, EDITABLE).join(',');
  if (c.changed != null) t.changed = list_(c.changed, ROOM_FIELDS);
  if (!t.updated) t.updated = new Date().toISOString();
  return t;
}
function list_(v, allowed) {
  var a = Array.isArray(v) ? v : String(v || '').split(',');
  var out = [];
  a.forEach(function (x) { x = String(x).trim(); if (allowed.indexOf(x) >= 0 && out.indexOf(x) < 0) out.push(x); });
  return out;
}
function time_(s) { var t = Date.parse(s || ''); return isNaN(t) ? 0 : t; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

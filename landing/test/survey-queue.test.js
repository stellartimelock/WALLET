const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const model = require("../assets/survey-model.js");

function answerUntil(session, id) {
  let guard = 0;
  while (session.current() && session.current().id !== id) {
    const question = session.current();
    const skip = question.options[question.options.length - 1];
    const result = session.choose(skip.value);
    assert.equal(result.done, false);
    if (++guard > 20) throw new Error("never reached " + id);
  }
  assert.equal(session.current().id, id);
}

function walk(session, pick) {
  const seen = [];
  const steps = [];
  while (session.current()) {
    const question = session.current();
    assert.equal(seen.includes(question.id), false, "repeated " + question.id);
    seen.push(question.id);
    const before = session.getStep();
    steps.push(before);
    const option = pick(question);
    const result = session.choose(option.value);
    if (result.done) break;
    assert.equal(session.getStep(), before + 1, question.id + " did not advance by one");
    assert.ok(session.getStep() > before, "step moved backward after " + question.id);
  }
  return seen;
}

test("the base quiz is nine questions and the longest path stays near fourteen", () => {
  const start = model.createSession();
  assert.equal(start.queueIds().length, 9);

  const allYes = model.createSession();
  const seen = walk(allYes, (question) => question.options.find((option) => option.match));
  assert.ok(seen.length <= 14, "path was " + seen.length + ": " + seen.join(","));
  assert.ok(seen.length >= 10);
});

test("answering a later question does not rewind to follow-ups already answered", () => {
  const session = model.createSession();
  answerUntil(session, "outdoors");
  session.choose("yes");
  assert.equal(session.current().id, "roadside");
  session.choose("yes");
  assert.equal(session.current().id, "groceries");
  session.choose("yes");
  assert.equal(session.current().id, "delivery");
  const deliveryStep = session.getStep();
  const result = session.choose("yes");
  assert.equal(result.done, false);
  assert.equal(session.getStep(), deliveryStep + 1);
  assert.equal(session.current().id === "roadside", false);
  assert.equal(session.current().id === "groceries", false);
  assert.equal(session.getAnswers().roadside.value, "yes");
  assert.equal(session.getAnswers().groceries.value, "yes");
  assert.equal(session.queueIds().indexOf("roadside") < session.queueIds().indexOf("delivery"), true);
});

test("a moved follow-up anchor does not replay a question already answered", () => {
  const session = model.createSession();
  answerUntil(session, "outdoors");
  session.choose("yes");
  session.choose("yes");
  session.choose("yes");
  assert.equal(session.current().id, "delivery");
  const before = session.queueIds().slice();
  session.choose("yes");
  const after = session.queueIds();
  assert.deepEqual(after.slice(0, before.indexOf("delivery") + 1), before.slice(0, before.indexOf("delivery") + 1));
  assert.equal(after.filter((id) => id === "roadside").length, 1);
  assert.equal(after.filter((id) => id === "groceries").length, 1);
});

test("forward answers never repeat a question", () => {
  const session = model.createSession();
  const seen = walk(session, (question) => question.options[0]);
  assert.equal(new Set(seen).size, seen.length);
});

test("back is the only control that revisits a question", () => {
  const session = model.createSession();
  const first = session.current().id;
  session.choose(session.current().options[0].value);
  const second = session.current().id;
  session.choose(session.current().options[0].value);
  const third = session.current().id;
  assert.notEqual(second, first);
  assert.equal(session.back(), true);
  assert.equal(session.current().id, second);
  assert.equal(session.back(), true);
  assert.equal(session.current().id, first);
  session.choose(session.current().options[0].value);
  assert.equal(session.current().id, second);
  session.choose(session.current().options[0].value);
  assert.equal(session.current().id, third);
});

test("changing an earlier answer drops follow-ups that no longer apply", () => {
  const session = model.createSession();
  answerUntil(session, "outdoors");
  session.choose("yes");
  assert.equal(session.current().id, "roadside");
  assert.equal(session.back(), true);
  assert.equal(session.current().id, "outdoors");
  session.choose("no");
  assert.equal(session.current().id, "delivery");
  assert.equal(session.queueIds().includes("roadside"), false);
  assert.equal(session.queueIds().includes("groceries"), false);
  assert.equal(session.getAnswers().roadside, undefined);
});

test("every app can be matched, renamed, and has an empty store link plus a replaces line", () => {
  const session = model.createSession();
  walk(session, (question) => question.options.find((option) => option.match));
  const matched = session.appIds();
  const ids = Object.keys(model.APPS);
  assert.equal(ids.length, 20);
  ids.forEach((id) => {
    assert.ok(matched.includes(id), "missing match for " + id);
    const app = model.APPS[id];
    assert.equal(app.playUrl, "");
    assert.equal(app.iosUrl, "");
    assert.ok(app.replaces.length > 0, id);
    assert.equal(/^Stellar /.test(app.name), false, app.name);
    if (id !== "timelock") assert.equal(app.name.includes("Stellar "), false);
    const iconPath = path.join(__dirname, "../assets/app-icons", app.icon);
    assert.equal(fs.existsSync(iconPath), true, app.icon);
    assert.match(fs.readFileSync(iconPath, "utf8"), /<svg/);
  });
  assert.equal(model.APPS.timelock.name, "StellarTimeLock");
  assert.equal(model.APPS.fortress.name, "Fortress by StellarTimeLock");
  assert.deepEqual(model.APPS.text.replaces, ["Phone", "Messages"]);
  assert.deepEqual(model.APPS.browse.replaces, ["Chrome"]);
  assert.deepEqual(model.APPS.keyboard.replaces, ["Gboard"]);
  assert.deepEqual(model.normalizeAppIds(["vault", "send", "timelock"]), ["fortress", "flipsend", "timelock"]);
});

test("results keep first-seen order and lead with the first direct match", () => {
  const session = model.createSession();
  walk(session, (question) => question.options.find((option) => option.match) || question.options[0]);
  const ids = session.appIds();
  assert.ok(ids.indexOf("text") < ids.indexOf("fortress"));
  assert.equal(ids[0], "timelock");
});

test("the email body still lists matches, replaces, and answers", () => {
  const session = model.createSession();
  answerUntil(session, "crypto");
  session.choose("yes");
  const block = model.appsBlock(session.appIds());
  assert.match(block, /StellarTimeLock/);
  assert.match(block, /Funny Money/);
  assert.match(block, /Replaces: Custodial wallets/);
  assert.match(block, /coming soon/);
  assert.doesNotMatch(block, /play\.google\.com/);
  const answers = model.answersBlock(session.getAnswers(), session.queueIds());
  assert.match(answers, /Cryptocurrency or Stellar\/XLM: Yes/);
});

/* /survey — "Which of my apps fit you?"
 *
 * SURVEY_ACCESS_KEY is the only value you need to paste in.
 *
 * TODO: Create a free access key at https://web3forms.com for
 * isaacdschuster@gmail.com and paste it between the quotes below.
 * Submissions (answers + recommended apps) are delivered to the inbox
 * that owns the key, so the key has to be created for that address.
 * When a visitor enters an email, the request also sets Web3Forms
 * `email` (reply-to) and `ccemail` (a copy of the same results).
 * ccemail and the dashboard autoresponder are Web3Forms Pro features.
 * On the free plan Isaac still receives the full submission.
 *
 * Until a key is pasted, the form falls back to FormSubmit and posts
 * to isaacdschuster@gmail.com (still no backend). Confirm the one-time
 * activation email FormSubmit sends, or nothing is delivered. A visitor
 * who leaves an email gets an autoresponse copy of their results.
 * You can also paste FormSubmit's invisible-email code here (letters
 * and digits, not a UUID) if you would rather hide the address.
 */
var SURVEY_ACCESS_KEY = "";

(function () {
  var model = window.SurveyModel;
  var NOTIFY_EMAIL = "isaacdschuster@gmail.com";
  var STORAGE_KEY = "stl-survey-results";
  var PLACEHOLDER_KEYS = {
    "": true,
    "TODO": true,
    "YOUR_ACCESS_KEY": true,
    "YOUR_ACCESS_KEY_HERE": true
  };

  var quizEl = document.getElementById("survey-quiz");
  var resultsEl = document.getElementById("survey-results");
  var cardEl = document.getElementById("survey-card");
  var progressEl = document.getElementById("survey-progress");
  var progressFill = document.getElementById("survey-progress-fill");
  var stepEl = document.getElementById("survey-step");
  var backBtn = document.getElementById("survey-back");
  var appListEl = document.getElementById("survey-app-list");
  var resultsLede = document.getElementById("survey-results-lede");
  var formEl = document.getElementById("survey-form");
  var emailEl = document.getElementById("survey-email");
  var hintEl = document.getElementById("survey-mail-hint");
  var statusEl = document.getElementById("survey-mail-status");
  var submitBtn = document.getElementById("survey-submit");
  var retakeBtn = document.getElementById("survey-retake");
  var sentEl = document.getElementById("survey-sent");

  if (!model || !quizEl || !resultsEl || !cardEl || !formEl) return;

  var session = model.createSession();
  var currentRecord = null;
  var pickLocked = false;

  function visitorCopy(ids, source, questionIds, email) {
    return [
      "Here are the apps that fit you, from stellartimelock.com/survey.",
      "",
      "Apps for you:",
      model.appsBlock(ids),
      "",
      "Your answers:",
      model.answersBlock(source, questionIds),
      "",
      "Answers are only used to recommend apps. No tracking. No ads.",
      "This copy was sent to " + email + " because you asked for your results."
    ].join("\n");
  }

  function accessKey() {
    var key = String(SURVEY_ACCESS_KEY || "").trim();
    if (PLACEHOLDER_KEYS[key]) return "";
    return key;
  }

  function isUuid(key) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
  }

  function mailProvider() {
    var key = accessKey();
    if (isUuid(key)) return { kind: "web3forms", key: key };
    if (/^[A-Za-z0-9]{8,128}$/.test(key)) {
      return { kind: "formsubmit", action: "https://formsubmit.co/" + key };
    }
    return { kind: "formsubmit", action: "https://formsubmit.co/" + NOTIFY_EMAIL };
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function save(record) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (err) {
      /* Private mode can block storage. Results still show this visit. */
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.version !== 1 || !data.answers || typeof data.answers !== "object") return null;
      data.appIds = model.normalizeAppIds(data.appIds);
      if (!Array.isArray(data.questionIds)) data.questionIds = [];
      if (typeof data.email !== "string") data.email = "";
      return data;
    } catch (err) {
      return null;
    }
  }

  function clearSaved() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
  }

  function showQuiz() {
    quizEl.hidden = false;
    resultsEl.hidden = true;
    renderQuestion();
  }

  function renderQuestion(shouldFocus) {
    var question = session.current();
    if (!question) return;
    var total = session.queueIds().length;
    var step = session.getStep();
    var current = step + 1;
    var prior = session.getAnswers()[question.id];

    stepEl.textContent = "Question " + current + " of " + total;
    progressEl.setAttribute("aria-valuemin", "1");
    progressEl.setAttribute("aria-valuemax", String(total));
    progressEl.setAttribute("aria-valuenow", String(current));
    progressEl.setAttribute("aria-valuetext", "Question " + current + " of " + total);
    progressFill.style.width = ((current / total) * 100) + "%";

    cardEl.innerHTML = "";
    var title = document.createElement("h2");
    title.id = "survey-question";
    title.className = "survey-question";
    title.tabIndex = -1;
    title.textContent = question.prompt;
    cardEl.appendChild(title);

    var group = document.createElement("div");
    group.className = "survey-options";
    group.setAttribute("role", "group");
    group.setAttribute("aria-labelledby", "survey-question");

    question.options.forEach(function (option) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "survey-option";
      button.textContent = option.label;
      var selected = prior && prior.value === option.value;
      button.setAttribute("aria-pressed", selected ? "true" : "false");
      if (selected) button.classList.add("is-selected");
      button.addEventListener("click", function () {
        if (pickLocked) return;
        pickLocked = true;
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
        var delay = prefersReducedMotion() ? 0 : 150;
        window.setTimeout(function () {
          pickLocked = false;
          choose(option);
        }, delay);
      });
      group.appendChild(button);
    });

    cardEl.appendChild(group);
    backBtn.hidden = step === 0;
    if (shouldFocus) title.focus();
  }

  function choose(option) {
    var result = session.choose(option.value);
    if (result.done) {
      finish();
      return;
    }
    renderQuestion(true);
  }

  function finish() {
    var answers = session.getAnswers();
    currentRecord = {
      version: 1,
      answers: answers,
      appIds: session.appIds(),
      questionIds: session.queueIds(),
      email: "",
      completedAt: new Date().toISOString(),
      mailedAt: null
    };
    save(currentRecord);
    showResults(currentRecord, false);
  }

  function showResults(record, returning) {
    currentRecord = record;
    quizEl.hidden = true;
    resultsEl.hidden = false;
    renderApps(record.appIds);
    if (!record.appIds.length) {
      resultsLede.textContent = "Nothing on the list lined up — that's okay. You can retake the quiz, or send your answers anyway.";
    } else if (returning) {
      resultsLede.textContent = "Saved on this device from last time. Retake the quiz whenever you want.";
    } else {
      resultsLede.textContent = "Based on your answers. Saved on this device, so this page will show them again.";
    }

    var provider = mailProvider();
    hintEl.textContent = provider.kind === "web3forms"
      ? "Optional. Isaac gets your answers and this list. Add your email if you want a copy too."
      : "Optional. Isaac gets your answers and this list. Add your email if you want a copy too. A quick spam check runs, then you come back here.";

    emailEl.value = record.email || "";
    var alreadySent = !!record.mailedAt;
    formEl.hidden = alreadySent;
    sentEl.hidden = !alreadySent;
    if (alreadySent) sentEl.textContent = sentMessage(record);
    statusEl.textContent = "";
    submitBtn.disabled = false;
    var heading = document.getElementById("survey-results-title");
    if (heading) heading.focus();
  }

  function renderApps(ids) {
    appListEl.innerHTML = "";
    if (!ids.length) return;
    ids.forEach(function (id) {
      var app = model.APPS[id];
      if (!app) return;
      var item = document.createElement("li");
      item.className = "survey-app";

      var head = document.createElement("div");
      head.className = "survey-app-head";

      var icon = document.createElement("img");
      icon.className = "survey-app-icon";
      icon.src = "../assets/app-icons/" + app.icon;
      icon.alt = "";
      icon.width = 56;
      icon.height = 56;
      head.appendChild(icon);

      var titleWrap = document.createElement("div");
      titleWrap.className = "survey-app-title";

      var title = document.createElement("h2");
      title.className = "survey-app-name";
      title.textContent = app.name;
      titleWrap.appendChild(title);

      var playUrl = model.storeUrl(app.playUrl);
      var iosUrl = model.storeUrl(app.iosUrl);
      if (!playUrl && !iosUrl) {
        title.setAttribute("aria-label", app.name + ", coming soon");
        var badge = document.createElement("span");
        badge.className = "survey-badge";
        badge.textContent = "Coming soon";
        titleWrap.appendChild(badge);
      }

      head.appendChild(titleWrap);
      item.appendChild(head);

      var copy = document.createElement("p");
      copy.className = "survey-app-desc";
      copy.textContent = app.description;
      item.appendChild(copy);

      if (app.replaces && app.replaces.length) {
        var replaces = document.createElement("p");
        replaces.className = "survey-replaces";
        var label = document.createElement("span");
        label.className = "survey-replaces-label";
        label.textContent = "Replaces:";
        replaces.appendChild(label);
        app.replaces.forEach(function (name) {
          var chip = document.createElement("span");
          chip.className = "survey-chip";
          chip.textContent = name;
          replaces.appendChild(chip);
        });
        item.appendChild(replaces);
      }

      if (playUrl) {
        item.appendChild(storeLink(playUrl, "Get it on Google Play"));
      }
      if (iosUrl) {
        item.appendChild(storeLink(iosUrl, "Get it on the App Store"));
      }

      appListEl.appendChild(item);
    });
  }

  function storeLink(href, label) {
    var link = document.createElement("a");
    link.className = "survey-store";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    return link;
  }

  function sentMessage(record) {
    if (!record.email) return "Sent. Isaac has your results.";
    if (record.mailKind === "web3forms") {
      return "Sent. Isaac has your results. A copy was requested for " + record.email + ".";
    }
    return "Sent. Isaac has your results, and a copy went to " + record.email + ".";
  }

  function validEmail(value) {
    if (!value) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function markMailed(email, kind) {
    if (!currentRecord) return;
    currentRecord.email = email;
    currentRecord.mailKind = kind || currentRecord.mailKind || "formsubmit";
    currentRecord.mailedAt = new Date().toISOString();
    save(currentRecord);
    formEl.hidden = true;
    sentEl.hidden = false;
    sentEl.textContent = sentMessage(currentRecord);
    statusEl.textContent = "";
  }

  function submitWeb3Forms(provider, email) {
    var body = {
      access_key: provider.key,
      subject: "App quiz results — stellartimelock.com/survey",
      from_name: "Stellar TimeLock survey",
      "Notify": NOTIFY_EMAIL,
      "Recommended apps": model.appsBlock(currentRecord.appIds),
      "Answers": model.answersBlock(currentRecord.answers, currentRecord.questionIds),
      "Visitor asked for a copy": email ? "Yes" : "No"
    };
    if (email) {
      body.email = email;
      body.replyto = email;
      body.ccemail = email;
      body["Copy for visitor"] = visitorCopy(
        currentRecord.appIds,
        currentRecord.answers,
        currentRecord.questionIds,
        email
      );
    }

    submitBtn.disabled = true;
    statusEl.textContent = "Sending…";

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || !data.success) {
          var message = (data && (data.message || (data.body && data.body.message))) || "Email could not be sent.";
          throw new Error(message);
        }
        markMailed(email, "web3forms");
      });
    }).catch(function () {
      submitBtn.disabled = false;
      statusEl.textContent = "That didn't send. Check the address and try again.";
    });
  }

  function submitFormSubmit(provider, email) {
    formEl.action = provider.action;
    formEl.method = "POST";

    Array.prototype.forEach.call(formEl.querySelectorAll("[data-survey-field]"), function (node) {
      node.parentNode.removeChild(node);
    });

    function hidden(name, value) {
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      input.setAttribute("data-survey-field", "1");
      formEl.appendChild(input);
    }

    hidden("_subject", "App quiz results — stellartimelock.com/survey");
    hidden("_template", "table");
    hidden("_next", returnUrl());
    hidden("Notify", NOTIFY_EMAIL);
    hidden("Recommended apps", model.appsBlock(currentRecord.appIds));
    hidden("Answers", model.answersBlock(currentRecord.answers, currentRecord.questionIds));
    hidden("Visitor asked for a copy", email ? "Yes" : "No");
    if (email) {
      hidden("_autoresponse", visitorCopy(
        currentRecord.appIds,
        currentRecord.answers,
        currentRecord.questionIds,
        email
      ));
    }

    currentRecord.email = email;
    currentRecord.mailKind = "formsubmit";
    currentRecord.mailedAt = null;
    save(currentRecord);

    var honey = formEl.querySelector("[name='_honey']");
    if (honey && !honey.value) honey.disabled = true;
    emailEl.disabled = !email;
    submitBtn.disabled = true;
    statusEl.textContent = "Sending…";
    HTMLFormElement.prototype.submit.call(formEl);
  }

  function returnUrl() {
    var path = window.location.pathname.replace(/index\.html$/, "");
    if (path.slice(-1) !== "/") path += "/";
    return window.location.origin + path + "?sent=1";
  }

  formEl.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!currentRecord) return;

    var honey = formEl.querySelector("[name='_honey']");
    if (honey && honey.value) {
      markMailed((emailEl.value || "").trim(), "formsubmit");
      return;
    }

    var email = (emailEl.value || "").trim();
    if (!validEmail(email) || (email && emailEl.validity && emailEl.validity.typeMismatch)) {
      statusEl.textContent = "That email doesn't look right.";
      emailEl.focus();
      return;
    }

    var provider = mailProvider();
    if (provider.kind === "web3forms") {
      submitWeb3Forms(provider, email);
      return;
    }
    submitFormSubmit(provider, email);
  });

  backBtn.addEventListener("click", function () {
    if (pickLocked) return;
    if (!session.back()) return;
    renderQuestion(true);
  });

  retakeBtn.addEventListener("click", function () {
    clearSaved();
    currentRecord = null;
    session = model.createSession();
    emailEl.disabled = false;
    emailEl.value = "";
    formEl.hidden = false;
    sentEl.hidden = true;
    statusEl.textContent = "";
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    showQuiz();
    var title = document.querySelector("#survey-quiz h1");
    if (title) title.focus();
  });

  var params = new URLSearchParams(window.location.search);
  var sentFlag = params.get("sent") === "1";
  var saved = load();

  if (saved) {
    if (sentFlag && !saved.mailedAt) {
      saved.mailedAt = new Date().toISOString();
      save(saved);
    }
    if (sentFlag && window.history && window.history.replaceState) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    showResults(saved, !sentFlag);
  } else {
    showQuiz();
  }
})();

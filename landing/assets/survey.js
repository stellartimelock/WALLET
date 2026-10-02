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
  var NOTIFY_EMAIL = "isaacdschuster@gmail.com";
  var STORAGE_KEY = "stl-survey-results";
  var PLACEHOLDER_KEYS = {
    "": true,
    "TODO": true,
    "YOUR_ACCESS_KEY": true,
    "YOUR_ACCESS_KEY_HERE": true
  };

  var APPS = {
    timelock: {
      name: "Stellar TimeLock",
      description: "A non-custodial Stellar wallet with time-lock vaults. Your keys stay on your device.",
      href: "https://play.google.com/store/apps/details?id=com.stellartimelock",
      linkLabel: "Google Play"
    },
    funnymoney: {
      name: "Funny Money",
      description: "For people who are curious about cryptocurrency and Stellar.",
      href: null
    },
    lostcontext: {
      name: "Lost Context",
      description: "For people who use X and lose the thread.",
      href: null
    },
    naturally: {
      name: "Naturally",
      description: "For camping, road trips, van or car living, and hot springs.",
      href: null
    },
    delivery: {
      name: "Delivery Driver",
      description: "A mileage tracker for delivery and gig driving.",
      href: null
    },
    vault: {
      name: "Stellar Vault",
      description: "A private password manager.",
      href: null
    },
    os: {
      name: "Stellar OS",
      description: "A private, ad-free place for your phone, notes, and files.",
      href: null
    },
    text: {
      name: "AI Text Manager",
      description: "For people who text a lot or use AI chatbots.",
      href: null
    },
    pets: {
      name: "Stellar Pets",
      description: "For people who have pets.",
      href: null
    },
    match: {
      name: "Matchmaker",
      description: "For when you're single and looking to meet someone.",
      href: null
    },
    sourceify: {
      name: "Sourceify",
      description: "Help finding shelter, food, and services — or helping someone else find them.",
      href: null
    },
    treesaver: {
      name: "Tree Saver 5000",
      description: "For grocery shopping and keeping receipts.",
      href: null
    },
    send: {
      name: "Stellar Send",
      description: "Send files between your devices.",
      href: null
    },
    browse: {
      name: "Stellar Browse",
      description: "Private browsing, without the ads.",
      href: null
    },
    roadside: {
      name: "Roadside Mechanic",
      description: "Help when the car is in trouble.",
      href: null
    }
  };

  function yesNo(yesLabel, noLabel, yesApps) {
    return [
      { label: yesLabel, value: "yes", match: true, apps: yesApps },
      { label: noLabel, value: "no", match: false, apps: [] }
    ];
  }

  var CORE = [
    {
      id: "crypto",
      short: "Cryptocurrency or Stellar/XLM",
      prompt: "Are you interested in cryptocurrency, or in Stellar and XLM?",
      options: yesNo("Yes", "Not really", ["timelock", "funnymoney"])
    },
    {
      id: "twitter",
      short: "Uses X (Twitter)",
      prompt: "Do you use X (Twitter)?",
      options: [
        { label: "Yes", value: "yes", match: true, apps: ["lostcontext"] },
        { label: "Sometimes", value: "sometimes", match: true, apps: ["lostcontext"] },
        { label: "No", value: "no", match: false, apps: [] }
      ]
    },
    {
      id: "outdoors",
      short: "Camping, road trips, van or car living, or hot springs",
      prompt: "Do you go camping, take road trips, live in a van or car, or visit hot springs?",
      options: [
        { label: "Yes", value: "yes", match: true, apps: ["naturally"] },
        { label: "Sometimes", value: "sometimes", match: true, apps: ["naturally"] },
        { label: "Not really", value: "no", match: false, apps: [] }
      ]
    },
    {
      id: "delivery",
      short: "Delivery or gig driving",
      prompt: "Do you do delivery or gig driving?",
      options: yesNo("Yes", "Not right now", ["delivery"])
    },
    {
      id: "passwords",
      short: "Private password manager",
      prompt: "Do you want a private password manager?",
      options: yesNo("Yes", "I'm good", ["vault"])
    },
    {
      id: "phone",
      short: "Private ad-free phone, notes, and files",
      prompt: "Do you want a private, ad-free phone setup, with notes and files in one place?",
      options: yesNo("Yes", "Not really", ["os"])
    },
    {
      id: "texting",
      short: "Texting or AI chatbots",
      prompt: "Do you text a lot, or use AI chatbots?",
      options: [
        { label: "I text a lot", value: "texting", match: true, apps: ["text"] },
        { label: "I use AI chatbots", value: "chatbots", match: true, apps: ["text"] },
        { label: "Both", value: "both", match: true, apps: ["text"] },
        { label: "Neither", value: "neither", match: false, apps: [] }
      ]
    },
    {
      id: "pets",
      short: "Pets",
      prompt: "Do you have pets?",
      options: yesNo("Yes", "No", ["pets"])
    },
    {
      id: "dating",
      short: "Single and looking",
      prompt: "Are you single and looking?",
      options: yesNo("Yes", "No", ["match"])
    },
    {
      id: "help",
      short: "Shelter, food, or services",
      prompt: "Do you need help finding shelter, food, or services — or do you help others who do?",
      options: [
        { label: "I need that help", value: "need", match: true, apps: ["sourceify"] },
        { label: "I help others find it", value: "help", match: true, apps: ["sourceify"] },
        { label: "Both", value: "both", match: true, apps: ["sourceify"] },
        { label: "Neither", value: "neither", match: false, apps: [] }
      ]
    }
  ];

  var FOLLOW = [
    {
      id: "roadside",
      short: "Car trouble",
      prompt: "Does car trouble come up — breakdowns, warning lights, or getting stranded?",
      options: yesNo("Yes", "Not really", ["roadside"]),
      anchor: function (answers) {
        if (isYes(answers.delivery)) return "delivery";
        if (isYes(answers.outdoors)) return "outdoors";
        return null;
      }
    },
    {
      id: "groceries",
      short: "Groceries or receipts",
      prompt: "Do you shop for groceries, or want to keep receipts?",
      options: yesNo("Yes", "Not really", ["treesaver"]),
      anchor: function (answers) {
        if (isYes(answers.delivery)) return "delivery";
        if (isYes(answers.outdoors)) return "outdoors";
        return null;
      }
    },
    {
      id: "send",
      short: "Send files between devices",
      prompt: "Want to send files between your devices?",
      options: yesNo("Yes", "No", ["send"]),
      anchor: function (answers) {
        return isYes(answers.phone) ? "phone" : null;
      }
    },
    {
      id: "browse",
      short: "Private browsing",
      prompt: "Want private browsing, without ads following you?",
      options: yesNo("Yes", "No", ["browse"]),
      anchor: function (answers) {
        if (isYes(answers.phone)) return "phone";
        if (isYes(answers.passwords)) return "passwords";
        return null;
      }
    }
  ];

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

  if (!quizEl || !resultsEl || !cardEl || !formEl) return;

  var answers = {};
  var queue = [];
  var step = 0;
  var currentRecord = null;
  var pickLocked = false;

  function isYes(answer) {
    return !!(answer && answer.match);
  }

  function queueFrom(source) {
    var next = [];
    CORE.forEach(function (question) {
      next.push(question);
      FOLLOW.forEach(function (follow) {
        if (follow.anchor(source) === question.id) next.push(follow);
      });
    });
    return next;
  }

  function indexOfId(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return i;
    }
    return -1;
  }

  function prune(list) {
    var keep = {};
    list.forEach(function (question) { keep[question.id] = true; });
    Object.keys(answers).forEach(function (id) {
      if (!keep[id]) delete answers[id];
    });
  }

  function recommendedIds(source) {
    var list = queueFrom(source);
    var seen = {};
    var ids = [];
    list.forEach(function (question) {
      var answer = source[question.id];
      if (!answer) return;
      var chosen = null;
      for (var i = 0; i < question.options.length; i++) {
        if (question.options[i].value === answer.value) chosen = question.options[i];
      }
      if (!chosen) return;
      (chosen.apps || []).forEach(function (id) {
        if (seen[id] || !APPS[id]) return;
        seen[id] = true;
        ids.push(id);
      });
    });
    return ids;
  }

  function knownAppIds(ids) {
    var clean = [];
    (ids || []).forEach(function (id) {
      if (APPS[id] && clean.indexOf(id) === -1) clean.push(id);
    });
    return clean;
  }

  function appsBlock(ids) {
    if (!ids.length) return "None — no apps matched.";
    return ids.map(function (id) {
      var app = APPS[id];
      var where = app.href ? app.href : "coming soon";
      return app.name + " — " + app.description + " (" + where + ")";
    }).join("\n");
  }

  function answersBlock(source) {
    return queueFrom(source).map(function (question) {
      var answer = source[question.id];
      return question.short + ": " + (answer ? answer.label : "(skipped)");
    }).filter(function (line) {
      return line.indexOf("(skipped)") === -1;
    }).join("\n");
  }

  function visitorCopy(ids, source, email) {
    return [
      "Here are the apps that fit you, from stellartimelock.com/survey.",
      "",
      "Apps for you:",
      appsBlock(ids),
      "",
      "Your answers:",
      answersBlock(source),
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
      data.appIds = knownAppIds(data.appIds);
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
    var question = queue[step];
    if (!question) return;
    var total = queue.length;
    var current = step + 1;
    var prior = answers[question.id];

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
    var question = queue[step];
    answers[question.id] = {
      value: option.value,
      label: option.label,
      match: !!option.match
    };
    queue = queueFrom(answers);
    prune(queue);
    var idx = indexOfId(queue, question.id);
    if (idx < 0) idx = step;
    if (idx + 1 >= queue.length) {
      finish();
      return;
    }
    step = idx + 1;
    renderQuestion(true);
  }

  function finish() {
    var ids = recommendedIds(answers);
    currentRecord = {
      version: 1,
      answers: answers,
      appIds: ids,
      email: "",
      completedAt: new Date().toISOString(),
      mailedAt: null
    };
    save(currentRecord);
    showResults(currentRecord, false);
  }

  function showResults(record, returning) {
    currentRecord = record;
    answers = record.answers || {};
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
      var app = APPS[id];
      var item = document.createElement("li");
      item.className = "survey-app";

      var title = document.createElement("h2");
      title.className = "survey-app-name";
      if (app.href) {
        var link = document.createElement("a");
        link.href = app.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = app.name;
        title.appendChild(link);
      } else {
        title.textContent = app.name;
        title.setAttribute("aria-label", app.name + ", coming soon");
        var badge = document.createElement("span");
        badge.className = "survey-badge";
        badge.textContent = "Coming soon";
        title.appendChild(badge);
      }

      var copy = document.createElement("p");
      copy.textContent = app.description;

      item.appendChild(title);
      item.appendChild(copy);

      if (app.href) {
        var outbound = document.createElement("a");
        outbound.className = "survey-app-link";
        outbound.href = app.href;
        outbound.target = "_blank";
        outbound.rel = "noopener noreferrer";
        outbound.textContent = app.linkLabel || "Open";
        item.appendChild(outbound);
      }

      appListEl.appendChild(item);
    });
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
    answers = currentRecord.answers;
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
      "Recommended apps": appsBlock(currentRecord.appIds),
      "Answers": answersBlock(currentRecord.answers),
      "Visitor asked for a copy": email ? "Yes" : "No"
    };
    if (email) {
      body.email = email;
      body.replyto = email;
      body.ccemail = email;
      body["Copy for visitor"] = visitorCopy(currentRecord.appIds, currentRecord.answers, email);
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
    hidden("Recommended apps", appsBlock(currentRecord.appIds));
    hidden("Answers", answersBlock(currentRecord.answers));
    hidden("Visitor asked for a copy", email ? "Yes" : "No");
    if (email) hidden("_autoresponse", visitorCopy(currentRecord.appIds, currentRecord.answers, email));

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
    if (step === 0 || pickLocked) return;
    step -= 1;
    renderQuestion(true);
  });

  retakeBtn.addEventListener("click", function () {
    clearSaved();
    answers = {};
    currentRecord = null;
    step = 0;
    queue = queueFrom(answers);
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
    queue = queueFrom(answers);
    showQuiz();
  }
})();

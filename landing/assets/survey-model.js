/* Question graph and match scoring for /survey.
 *
 * Follow-ups are inserted after the answer that calls for them.
 * Questions the visitor has already passed stay put. Rebuilding the
 * list must not move those questions earlier — that rewind is what
 * kicked people back to answers they had already given.
 */
(function (root) {
  var APPS = {
    timelock: {
      name: "StellarTimeLock",
      description: "A non-custodial Stellar wallet with time-lock vaults. Your keys stay on your device.",
      replaces: ["Custodial wallets"],
      playUrl: "",
      iosUrl: "",
      icon: "timelock.svg"
    },
    funnymoney: {
      name: "Funny Money",
      description: "For people who are curious about cryptocurrency and Stellar.",
      replaces: ["Crypto explainers"],
      playUrl: "",
      iosUrl: "",
      icon: "funnymoney.svg"
    },
    lostcontext: {
      name: "Lost Context",
      description: "For people who use X and lose the thread.",
      replaces: ["X threads"],
      playUrl: "",
      iosUrl: "",
      icon: "lostcontext.svg"
    },
    naturally: {
      name: "Naturally",
      description: "For camping, road trips, van or car living, and hot springs.",
      replaces: ["Camping apps"],
      playUrl: "",
      iosUrl: "",
      icon: "naturally.svg"
    },
    delivery: {
      name: "Delivery Driver",
      description: "A mileage tracker for delivery and gig driving.",
      replaces: ["Mileage tracker"],
      playUrl: "",
      iosUrl: "",
      icon: "delivery.svg"
    },
    fortress: {
      name: "Fortress by StellarTimeLock",
      description: "A private password manager.",
      replaces: ["Proton Pass", "1Password", "Google Password Manager"],
      playUrl: "",
      iosUrl: "",
      icon: "fortress.svg"
    },
    os: {
      name: "OS",
      description: "A private, ad-free place for your phone, notes, and files.",
      replaces: ["Home screen", "Notes"],
      playUrl: "",
      iosUrl: "",
      icon: "os.svg"
    },
    text: {
      name: "Text Manager",
      description: "For people who text a lot or use AI chatbots.",
      replaces: ["Phone", "Messages"],
      playUrl: "",
      iosUrl: "",
      icon: "text.svg"
    },
    pets: {
      name: "Pets",
      description: "For people who have pets.",
      replaces: ["Pet apps"],
      playUrl: "",
      iosUrl: "",
      icon: "pets.svg"
    },
    match: {
      name: "Matchmaker",
      description: "For when you're single and looking to meet someone.",
      replaces: ["Dating apps"],
      playUrl: "",
      iosUrl: "",
      icon: "match.svg"
    },
    sourceify: {
      name: "Sourceify",
      description: "Help finding shelter, food, and services — or helping someone else find them.",
      replaces: ["Shelter lists", "211"],
      playUrl: "",
      iosUrl: "",
      icon: "sourceify.svg"
    },
    treesaver: {
      name: "Tree Saver 5000",
      description: "For grocery shopping and keeping receipts.",
      replaces: ["Grocery list", "Receipts"],
      playUrl: "",
      iosUrl: "",
      icon: "treesaver.svg"
    },
    flipsend: {
      name: "FlipSend",
      description: "Send files between your phone and PC without emailing them to yourself.",
      replaces: ["Quick Share", "Email to yourself"],
      playUrl: "",
      iosUrl: "",
      icon: "flipsend.svg"
    },
    browse: {
      name: "Browse",
      description: "Private browsing, without the ads.",
      replaces: ["Chrome"],
      playUrl: "",
      iosUrl: "",
      icon: "browse.svg"
    },
    roadside: {
      name: "Roadside Mechanic",
      description: "Help when the car is in trouble.",
      replaces: ["Roadside apps"],
      playUrl: "",
      iosUrl: "",
      icon: "roadside.svg"
    },
    keyboard: {
      name: "Keyboard",
      description: "A phone keyboard that replaces Gboard.",
      replaces: ["Gboard"],
      playUrl: "",
      iosUrl: "",
      icon: "keyboard.svg"
    },
    market: {
      name: "Market",
      description: "A place to share and find apps you build.",
      replaces: ["APK links"],
      playUrl: "",
      iosUrl: "",
      icon: "market.svg"
    },
    profile: {
      name: "Profile",
      description: "One profile you control, instead of retyping yourself into every app.",
      replaces: ["Social bios"],
      playUrl: "",
      iosUrl: "",
      icon: "profile.svg"
    },
    digest: {
      name: "Digest",
      description: "One daily read, instead of opening a pile of apps for updates.",
      replaces: ["News apps"],
      playUrl: "",
      iosUrl: "",
      icon: "digest.svg"
    },
    clock: {
      name: "Clock",
      description: "Replaces the stock Clock app — alarms, timer, stopwatch, and bedtime.",
      replaces: ["Alarms", "Timer", "Stopwatch", "Bedtime"],
      playUrl: "",
      iosUrl: "",
      icon: "clock.svg"
    },
    files: {
      name: "Files",
      description: "Replaces the stock Files app and adds a decrypt tool.",
      replaces: ["Files"],
      playUrl: "",
      iosUrl: "",
      icon: "files.svg"
    }
  };

  var LEGACY_IDS = {
    vault: "fortress",
    send: "flipsend"
  };

  function yesNo(yesLabel, noLabel, yesApps) {
    return [
      { label: yesLabel, value: "yes", match: true, weight: 2, apps: yesApps },
      { label: noLabel, value: "no", match: false, apps: [] }
    ];
  }

  function isYes(answer) {
    return !!(answer && answer.match);
  }

  var CORE = [
    {
      id: "crypto",
      short: "Cryptocurrency or Stellar/XLM",
      prompt: "Are you interested in cryptocurrency, or in Stellar and XLM?",
      options: yesNo("Yes", "Not really", ["timelock", "funnymoney"])
    },
    {
      id: "fewer",
      short: "Fewer apps on the phone",
      prompt: "Do you want fewer apps on your phone?",
      options: yesNo("Yes", "Not really", [
        "text",
        "fortress",
        "browse",
        "clock",
        "files",
        "keyboard",
        "flipsend",
        "os"
      ])
    },
    {
      id: "build",
      short: "Codes or builds apps",
      prompt: "Do you code or build apps?",
      options: yesNo("Yes", "Not really", ["market"])
    },
    {
      id: "twitter",
      short: "Uses X (Twitter)",
      prompt: "Do you use X (Twitter)?",
      options: [
        { label: "Yes", value: "yes", match: true, weight: 2, apps: ["lostcontext"] },
        { label: "Sometimes", value: "sometimes", match: true, weight: 1, apps: ["lostcontext"] },
        { label: "No", value: "no", match: false, apps: [] }
      ]
    },
    {
      id: "outdoors",
      short: "Camping, road trips, van or car living, or hot springs",
      prompt: "Do you go camping, take road trips, live in a van or car, or visit hot springs?",
      options: [
        { label: "Yes", value: "yes", match: true, weight: 2, apps: ["naturally"] },
        { label: "Sometimes", value: "sometimes", match: true, weight: 1, apps: ["naturally"] },
        { label: "Not really", value: "no", match: false, apps: [] }
      ]
    },
    {
      id: "delivery",
      short: "Delivery driving",
      prompt: "Do you drive for delivery?",
      options: yesNo("Yes", "Not right now", ["delivery"])
    },
    {
      id: "pets",
      short: "Pets",
      prompt: "Do you have pets?",
      options: yesNo("Yes", "No", ["pets"])
    },
    {
      id: "dating",
      short: "Single",
      prompt: "Are you single?",
      options: yesNo("Yes", "No", ["match"])
    },
    {
      id: "profile",
      short: "One profile you control",
      prompt: "Want one profile you control, instead of retyping yourself into every app?",
      options: yesNo("Yes", "Not really", ["profile"])
    },
    {
      id: "help",
      short: "Shelter, food, or services",
      prompt: "Do you need help finding shelter, food, or services — or do you help others who do?",
      options: [
        { label: "I need that help", value: "need", match: true, weight: 2, apps: ["sourceify"] },
        { label: "I help others find it", value: "help", match: true, weight: 2, apps: ["sourceify"] },
        { label: "Both", value: "both", match: true, weight: 2, apps: ["sourceify"] },
        { label: "Neither", value: "neither", match: false, apps: [] }
      ]
    }
  ];

  var FOLLOW = [
    {
      id: "digest",
      short: "One daily digest",
      prompt: "Want one daily digest instead of opening a bunch of apps for news and updates?",
      options: yesNo("Yes", "Not really", ["digest"]),
      anchor: function (answers) {
        return isYes(answers.fewer) ? "fewer" : null;
      }
    },
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
    }
  ];

  var BY_ID = {};
  CORE.concat(FOLLOW).forEach(function (question) {
    BY_ID[question.id] = question;
  });

  function questionById(id) {
    return BY_ID[id] || null;
  }

  function indexOfId(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return i;
    }
    return -1;
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

  /* Keep every question up through the one just answered, in the order
     the visitor already saw them. Only the not-yet-asked tail is rebuilt,
     so a follow-up whose anchor moves later cannot pull the step backward. */
  function reconcileQueue(queue, source, currentId) {
    var desired = queueFrom(source);
    var currentIdx = indexOfId(queue, currentId);
    if (currentIdx < 0) currentIdx = 0;
    var prefix = queue.slice(0, currentIdx + 1);
    var seen = {};
    prefix.forEach(function (question) { seen[question.id] = true; });
    var rest = [];
    desired.forEach(function (question) {
      if (seen[question.id]) return;
      seen[question.id] = true;
      rest.push(question);
    });
    return prefix.concat(rest);
  }

  function pruneAnswers(queue, answers) {
    var keep = {};
    queue.forEach(function (question) { keep[question.id] = true; });
    Object.keys(answers).forEach(function (id) {
      if (!keep[id]) delete answers[id];
    });
  }

  function chosenOption(question, answer) {
    if (!question || !answer) return null;
    for (var i = 0; i < question.options.length; i++) {
      if (question.options[i].value === answer.value) return question.options[i];
    }
    return null;
  }

  function recommendedIds(queue, source) {
    var rows = [];
    var pos = {};
    queue.forEach(function (question) {
      var chosen = chosenOption(question, source[question.id]);
      if (!chosen) return;
      var weight = chosen.weight || (chosen.match ? 1 : 0);
      if (!weight) return;
      (chosen.apps || []).forEach(function (id) {
        if (!APPS[id]) return;
        if (pos[id] == null) {
          pos[id] = rows.length;
          rows.push({ id: id, score: 0 });
        }
        rows[pos[id]].score += weight;
      });
    });
    rows.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return pos[a.id] - pos[b.id];
    });
    return rows.map(function (row) { return row.id; });
  }

  function normalizeAppIds(ids) {
    var clean = [];
    (ids || []).forEach(function (id) {
      var next = LEGACY_IDS[id] || id;
      if (APPS[next] && clean.indexOf(next) === -1) clean.push(next);
    });
    return clean;
  }

  function storeUrl(value) {
    return String(value || "").trim();
  }

  function appsBlock(ids) {
    if (!ids.length) return "None — no apps matched.";
    return ids.map(function (id) {
      var app = APPS[id];
      var replaces = (app.replaces || []).join(", ");
      var where = storeUrl(app.playUrl) || storeUrl(app.iosUrl) || "coming soon";
      var line = app.name + " — " + app.description;
      if (replaces) line += " Replaces: " + replaces + ".";
      return line + " (" + where + ")";
    }).join("\n");
  }

  function answersBlock(source, questionIds) {
    var list = (questionIds && questionIds.length)
      ? questionIds.map(questionById).filter(Boolean)
      : queueFrom(source);
    return list.map(function (question) {
      var answer = source[question.id];
      return question.short + ": " + (answer ? answer.label : "(skipped)");
    }).filter(function (line) {
      return line.indexOf("(skipped)") === -1;
    }).join("\n");
  }

  function createSession() {
    var answers = {};
    var queue = queueFrom(answers);
    var step = 0;

    function current() {
      return queue[step] || null;
    }

    function choose(value) {
      var question = queue[step];
      if (!question) throw new Error("No question at this step");
      var option = null;
      for (var i = 0; i < question.options.length; i++) {
        if (question.options[i].value === value) option = question.options[i];
      }
      if (!option) throw new Error("Unknown option " + value + " for " + question.id);
      var at = step;
      answers[question.id] = {
        value: option.value,
        label: option.label,
        match: !!option.match
      };
      queue = reconcileQueue(queue, answers, question.id);
      pruneAnswers(queue, answers);
      var idx = indexOfId(queue, question.id);
      if (idx < 0 || idx < at) idx = at;
      step = idx + 1;
      if (step >= queue.length) {
        return { done: true, step: step, appIds: recommendedIds(queue, answers) };
      }
      return { done: false, step: step, id: queue[step].id };
    }

    function back() {
      if (step <= 0) return false;
      step -= 1;
      return true;
    }

    return {
      choose: choose,
      back: back,
      current: current,
      getStep: function () { return step; },
      queueIds: function () { return queue.map(function (question) { return question.id; }); },
      getAnswers: function () { return answers; },
      appIds: function () { return recommendedIds(queue, answers); }
    };
  }

  var api = {
    APPS: APPS,
    CORE: CORE,
    FOLLOW: FOLLOW,
    createSession: createSession,
    queueFrom: queueFrom,
    reconcileQueue: reconcileQueue,
    recommendedIds: recommendedIds,
    normalizeAppIds: normalizeAppIds,
    appsBlock: appsBlock,
    answersBlock: answersBlock,
    questionById: questionById,
    storeUrl: storeUrl
  };

  if (typeof module === "object" && module.exports) module.exports = api;
  root.SurveyModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

const cards = [
  {
    type: "Vocabulary",
    title: "単語カード",
    hanzi: "学习",
    pinyin: "xuéxí",
    prompt: "意味を選んでください。",
    choices: ["勉強する", "旅行する", "休む", "買う"],
    answer: "勉強する",
    note: "毎日の学習を表す基本動詞です。",
  },
  {
    type: "Grammar",
    title: "語順ドリル",
    hanzi: "我 学习 汉语",
    pinyin: "wǒ xuéxí Hànyǔ",
    prompt: "自然な日本語に近い意味を選んでください。",
    choices: ["私は中国語を勉強します", "中国語は私を勉強します", "私は中国へ行きます", "私は本を買います"],
    answer: "私は中国語を勉強します",
    note: "中国語の基本語順は 主語 + 動詞 + 目的語 です。",
  },
  {
    type: "Listening",
    title: "リスニング",
    hanzi: "你好吗？",
    pinyin: "nǐ hǎo ma?",
    prompt: "音声を聞いて意味を選んでください。",
    choices: ["元気ですか", "何時ですか", "どこへ行きますか", "何を食べますか"],
    answer: "元気ですか",
    note: "吗 は Yes/No 疑問文を作る助詞です。",
  },
  {
    type: "Speaking",
    title: "音読練習",
    hanzi: "我每天学习汉语。",
    pinyin: "wǒ měitiān xuéxí Hànyǔ.",
    prompt: "音声のあとに声に出して読んでください。",
    choices: ["読めた", "もう一度聞く", "あとで復習", "難しい"],
    answer: "読めた",
    note: "毎天 は「毎日」。学習習慣を話すときに便利です。",
  },
];

const missions = [
  { name: "単語5問", time: "4分" },
  { name: "文法3問", time: "6分" },
  { name: "リスニング1問", time: "5分" },
  { name: "音読1問", time: "5分" },
];

const state = {
  index: Number(localStorage.getItem("currentIndex") || 0),
  completed: JSON.parse(localStorage.getItem("completedMissions") || "[]"),
  streak: Number(localStorage.getItem("streak") || 0),
  lastStudyDate: localStorage.getItem("lastStudyDate") || "",
};

const elements = {
  todayDone: document.querySelector("#todayDone"),
  streak: document.querySelector("#streak"),
  examProgress: document.querySelector("#examProgress"),
  missionList: document.querySelector("#missionList"),
  practiceType: document.querySelector("#practiceType"),
  practiceTitle: document.querySelector("#practiceTitle"),
  hanzi: document.querySelector("#hanzi"),
  pinyin: document.querySelector("#pinyin"),
  prompt: document.querySelector("#prompt"),
  choices: document.querySelector("#choices"),
  answerPanel: document.querySelector("#answerPanel"),
  answerText: document.querySelector("#answerText"),
  answerNote: document.querySelector("#answerNote"),
  speakButton: document.querySelector("#speakButton"),
  nextButton: document.querySelector("#nextButton"),
  skipButton: document.querySelector("#skipButton"),
  resetButton: document.querySelector("#resetButton"),
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function saveState() {
  localStorage.setItem("currentIndex", String(state.index));
  localStorage.setItem("completedMissions", JSON.stringify(state.completed));
  localStorage.setItem("streak", String(state.streak));
  localStorage.setItem("lastStudyDate", state.lastStudyDate);
}

function renderMissions() {
  elements.missionList.innerHTML = "";
  missions.forEach((mission, index) => {
    const item = document.createElement("div");
    item.className = "mission-item";
    const done = state.completed.includes(index);
    item.innerHTML = `
      <span class="check">${done ? "✓" : index + 1}</span>
      <p class="mission-name">${mission.name}</p>
      <span class="mission-time">${mission.time}</span>
    `;
    elements.missionList.appendChild(item);
  });
}

function renderProgress() {
  const done = state.completed.length;
  elements.todayDone.textContent = `${done}/4`;
  elements.streak.textContent = state.streak;
  elements.examProgress.textContent = Math.min(3 + done * 2 + state.streak, 100);
}

function renderCard() {
  const card = cards[state.index % cards.length];
  elements.practiceType.textContent = card.type;
  elements.practiceTitle.textContent = card.title;
  elements.hanzi.textContent = card.hanzi;
  elements.pinyin.textContent = card.pinyin;
  elements.prompt.textContent = card.prompt;
  elements.answerPanel.hidden = true;
  elements.choices.innerHTML = "";

  card.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.textContent = choice;
    button.addEventListener("click", () => selectChoice(button, choice, card));
    elements.choices.appendChild(button);
  });
}

function selectChoice(button, choice, card) {
  [...elements.choices.children].forEach((child) => {
    child.disabled = true;
    if (child.textContent === card.answer) child.classList.add("correct");
  });

  if (choice !== card.answer) {
    button.classList.add("wrong");
  }

  const missionIndex = state.index % missions.length;
  if (!state.completed.includes(missionIndex)) {
    state.completed.push(missionIndex);
  }

  if (state.lastStudyDate !== todayKey()) {
    state.streak += 1;
    state.lastStudyDate = todayKey();
  }

  elements.answerText.textContent = choice === card.answer ? "正解です。" : `正解は「${card.answer}」です。`;
  elements.answerNote.textContent = card.note;
  elements.answerPanel.hidden = false;
  saveState();
  renderMissions();
  renderProgress();
}

function speakCurrentCard() {
  const card = cards[state.index % cards.length];
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(card.hanzi);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

function nextCard() {
  state.index = (state.index + 1) % cards.length;
  saveState();
  renderCard();
}

function resetProgress() {
  state.index = 0;
  state.completed = [];
  state.streak = 0;
  state.lastStudyDate = "";
  saveState();
  renderCard();
  renderMissions();
  renderProgress();
}

elements.speakButton.addEventListener("click", speakCurrentCard);
elements.nextButton.addEventListener("click", nextCard);
elements.skipButton.addEventListener("click", nextCard);
elements.resetButton.addEventListener("click", resetProgress);

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

renderCard();
renderMissions();
renderProgress();

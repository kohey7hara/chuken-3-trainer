const importedVocabularyCards = typeof hskVocabularyCards === "undefined" ? [] : hskVocabularyCards;
const cards = [...learningContent.cards, ...importedVocabularyCards];
const lessons = learningContent.lessons;
const dailyGoal = 8;

const missions = [
  { name: "単語4問", type: "Vocabulary", time: "6分" },
  { name: "文法2問", type: "Grammar", time: "6分" },
  { name: "リスニング1問", type: "Listening", time: "4分" },
  { name: "音読1問", type: "Speaking", time: "4分" },
];

const state = {
  index: Number(localStorage.getItem("currentIndex") || 0),
  completedToday: JSON.parse(localStorage.getItem("completedToday") || "[]"),
  streak: Number(localStorage.getItem("streak") || 0),
  lastStudyDate: localStorage.getItem("lastStudyDate") || "",
  view: "today",
};

let activeUtterance = null;

const elements = {
  todayDone: document.querySelector("#todayDone"),
  streak: document.querySelector("#streak"),
  examProgress: document.querySelector("#examProgress"),
  missionList: document.querySelector("#missionList"),
  lessonTag: document.querySelector("#lessonTag"),
  lessonCount: document.querySelector("#lessonCount"),
  vocabCount: document.querySelector("#vocabCount"),
  cardCount: document.querySelector("#cardCount"),
  currentPosition: document.querySelector("#currentPosition"),
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

function currentCard() {
  return cards[state.index % cards.length];
}

function currentLesson() {
  return lessonForCard(currentCard());
}

function lessonForCard(card) {
  const lesson = lessons.find((item) => item.id === card.lesson);
  if (lesson) return lesson;
  if (card.type === "Vocabulary") {
    const pack = Math.max(1, Math.floor((card.lesson - 101) / 10) + 1);
    return { id: card.lesson, phase: "Vocab", title: `単語パック ${pack}`, theme: "2,000語" };
  }
  return lessons[0];
}

function saveState() {
  localStorage.setItem("currentIndex", String(state.index));
  localStorage.setItem("completedToday", JSON.stringify(state.completedToday));
  localStorage.setItem("streak", String(state.streak));
  localStorage.setItem("lastStudyDate", state.lastStudyDate);
}

function resetDailyIfNeeded() {
  if (state.lastStudyDate && state.lastStudyDate !== todayKey()) {
    state.completedToday = [];
  }
}

function visibleCards() {
  if (state.view === "today") return cards;
  const typeMap = {
    words: "Vocabulary",
    grammar: "Grammar",
    listen: "Listening",
  };
  const type = typeMap[state.view];
  return type ? cards.filter((card) => card.type === type) : cards;
}

function renderMissions() {
  elements.missionList.innerHTML = "";
  missions.forEach((mission) => {
    const total = state.completedToday.filter((type) => type === mission.type).length;
    const target = mission.type === "Vocabulary" ? 4 : mission.type === "Grammar" ? 2 : 1;
    const done = Math.min(total, target);
    const item = document.createElement("div");
    item.className = "mission-item";
    item.innerHTML = `
      <span class="check">${done >= target ? "✓" : done}</span>
      <p class="mission-name">${mission.name}</p>
      <span class="mission-time">${mission.time}</span>
    `;
    elements.missionList.appendChild(item);
  });
}

function renderProgress() {
  const done = Math.min(state.completedToday.length, dailyGoal);
  const totalLessons = lessons.length;
  const totalCards = cards.length;
  const totalVocabulary = cards.filter((card) => card.type === "Vocabulary").length;
  const currentVisibleTotal = visibleCards().length;
  const position = (state.index % currentVisibleTotal) + 1;
  const studiedCards = Number(localStorage.getItem("studiedCards") || 0);

  elements.todayDone.textContent = `${done}/${dailyGoal}`;
  elements.streak.textContent = state.streak;
  elements.examProgress.textContent = Math.min(5 + Math.floor((studiedCards / 2000) * 100), 100);
  elements.lessonCount.textContent = totalLessons;
  elements.vocabCount.textContent = totalVocabulary;
  elements.cardCount.textContent = totalCards;
  elements.currentPosition.textContent = `${position}/${currentVisibleTotal}`;
  elements.lessonTag.textContent = currentLesson().phase;
}

function renderCard() {
  const filtered = visibleCards();
  const card = state.view === "today" ? currentCard() : filtered[state.index % filtered.length];
  const lesson = lessonForCard(card);

  elements.practiceType.textContent = `${card.type} / Lesson ${lesson.id}`;
  elements.practiceTitle.textContent = `${card.title}: ${lesson.title}`;
  elements.hanzi.textContent = card.hanzi;
  elements.pinyin.textContent = card.pinyin || lesson.theme;
  elements.prompt.textContent = card.prompt;
  elements.answerPanel.hidden = true;
  elements.speakButton.textContent = "音声";
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

function markStudied(card) {
  if (state.completedToday.length < dailyGoal) {
    state.completedToday.push(card.type);
  }

  if (state.lastStudyDate !== todayKey()) {
    state.streak += 1;
    state.lastStudyDate = todayKey();
  }

  const studiedCards = Number(localStorage.getItem("studiedCards") || 0) + 1;
  localStorage.setItem("studiedCards", String(studiedCards));
}

function selectChoice(button, choice, card) {
  [...elements.choices.children].forEach((child) => {
    child.disabled = true;
    if (child.textContent === card.answer) child.classList.add("correct");
  });

  if (choice !== card.answer) {
    button.classList.add("wrong");
  }

  markStudied(card);
  elements.answerText.textContent = choice === card.answer ? "正解です。" : `正解は「${card.answer}」です。`;
  elements.answerNote.textContent = card.note;
  elements.answerPanel.hidden = false;
  saveState();
  renderMissions();
  renderProgress();
}

function speakCurrentCard() {
  const card = state.view === "today" ? currentCard() : visibleCards()[state.index % visibleCards().length];
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    showAudioMessage("このブラウザでは音声再生に対応していません。");
    return;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();

  const utterance = new SpeechSynthesisUtterance(card.hanzi);
  const voice = findMandarinVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || "zh-CN";
  utterance.rate = 0.78;
  utterance.pitch = 1;

  utterance.onstart = () => {
    elements.speakButton.textContent = "再生中";
  };
  utterance.onend = () => {
    elements.speakButton.textContent = "音声";
  };
  utterance.onerror = () => {
    elements.speakButton.textContent = "音声";
    showAudioMessage("音声を再生できませんでした。端末の音量とブラウザの音声設定を確認してください。");
  };

  activeUtterance = utterance;
  setTimeout(() => window.speechSynthesis.speak(activeUtterance), 80);
}

function findMandarinVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === "zh-CN") ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("zh")) ||
    voices.find((voice) => /chinese|mandarin|普通话|國語|中文/i.test(voice.name))
  );
}

function warmUpVoices() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

function showAudioMessage(message) {
  elements.answerText.textContent = "音声の確認";
  elements.answerNote.textContent = message;
  elements.answerPanel.hidden = false;
}

function nextCard() {
  state.index = (state.index + 1) % visibleCards().length;
  saveState();
  renderCard();
  renderProgress();
}

function resetProgress() {
  state.index = 0;
  state.completedToday = [];
  state.streak = 0;
  state.lastStudyDate = "";
  localStorage.setItem("studiedCards", "0");
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
    state.view = button.dataset.view;
    state.index = 0;
    saveState();
    renderCard();
    renderProgress();
  });
});

resetDailyIfNeeded();
warmUpVoices();
renderCard();
renderMissions();
renderProgress();

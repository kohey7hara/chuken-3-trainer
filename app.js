const importedVocabularyCards = typeof hskVocabularyCards === "undefined" ? [] : hskVocabularyCards;
const cards = [...learningContent.cards, ...importedVocabularyCards];
const lessons = learningContent.lessons;
const tutorials = typeof grammarTutorials === "undefined" ? [] : grammarTutorials;
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
  tutorialIndex: Number(localStorage.getItem("tutorialIndex") || 0),
  view: "today",
};

let activeUtterance = null;
let audioResetTimer = null;

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
  fallbackAudio: document.querySelector("#fallbackAudio"),
  speakButton: document.querySelector("#speakButton"),
  nextButton: document.querySelector("#nextButton"),
  skipButton: document.querySelector("#skipButton"),
  resetButton: document.querySelector("#resetButton"),
  practiceArea: document.querySelector(".practice-area"),
  tutorialPanel: document.querySelector("#tutorialPanel"),
  tutorialTitle: document.querySelector("#tutorialTitle"),
  tutorialPosition: document.querySelector("#tutorialPosition"),
  tutorialFocus: document.querySelector("#tutorialFocus"),
  tutorialExamPoint: document.querySelector("#tutorialExamPoint"),
  tutorialPattern: document.querySelector("#tutorialPattern"),
  tutorialCaution: document.querySelector("#tutorialCaution"),
  tutorialExamples: document.querySelector("#tutorialExamples"),
  tutorialDrillQuestion: document.querySelector("#tutorialDrillQuestion"),
  tutorialDrillChoices: document.querySelector("#tutorialDrillChoices"),
  tutorialFeedback: document.querySelector("#tutorialFeedback"),
  tutorialFeedbackTitle: document.querySelector("#tutorialFeedbackTitle"),
  tutorialFeedbackNote: document.querySelector("#tutorialFeedbackNote"),
  tutorialPrev: document.querySelector("#tutorialPrev"),
  tutorialNext: document.querySelector("#tutorialNext"),
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
  localStorage.setItem("tutorialIndex", String(state.tutorialIndex));
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
  const currentVisibleTotal = Math.max(visibleCards().length, 1);
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

function renderView() {
  const isTutorial = state.view === "tutorial";
  elements.practiceArea.hidden = isTutorial;
  elements.tutorialPanel.hidden = !isTutorial;

  if (isTutorial) {
    renderTutorial();
  } else {
    renderCard();
  }
  renderProgress();
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

  shuffledChoices(card).forEach((choice) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.textContent = choice;
    button.addEventListener("click", () => selectChoice(button, choice, card));
    elements.choices.appendChild(button);
  });
}

function renderTutorial() {
  if (!tutorials.length) return;

  const normalizedIndex = state.tutorialIndex % tutorials.length;
  const tutorial = tutorials[normalizedIndex];
  const drill = tutorial.drills[0];
  elements.tutorialTitle.textContent = tutorial.title;
  elements.tutorialPosition.textContent = `${normalizedIndex + 1}/${tutorials.length}`;
  elements.tutorialFocus.textContent = tutorial.focus;
  elements.tutorialExamPoint.textContent = tutorial.examPoint;
  elements.tutorialPattern.textContent = tutorial.pattern;
  elements.tutorialCaution.textContent = tutorial.caution;
  elements.tutorialFeedback.hidden = true;
  elements.tutorialExamples.innerHTML = "";
  elements.tutorialDrillChoices.innerHTML = "";
  elements.tutorialDrillQuestion.textContent = drill.question;

  tutorial.examples.forEach((example) => {
    const row = document.createElement("div");
    row.className = "example-row";
    row.innerHTML = `
      <p class="example-zh">${example.zh}</p>
      <p class="example-pinyin">${example.pinyin}</p>
      <p class="example-ja">${example.ja}</p>
    `;
    elements.tutorialExamples.appendChild(row);
  });

  shuffledTutorialChoices(tutorial, drill).forEach((choice) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.textContent = choice;
    button.addEventListener("click", () => selectTutorialChoice(button, choice, drill));
    elements.tutorialDrillChoices.appendChild(button);
  });
}

function shuffledTutorialChoices(tutorial, drill) {
  const seed = `${todayKey()}-${tutorial.id}-${state.tutorialIndex}`;
  return drill.choices
    .map((choice, index) => ({ choice, rank: seededRank(`${seed}-${index}-${choice}`) }))
    .sort((a, b) => a.rank - b.rank)
    .map((item) => item.choice);
}

function selectTutorialChoice(button, choice, drill) {
  [...elements.tutorialDrillChoices.children].forEach((child) => {
    child.disabled = true;
    if (child.textContent === drill.answer) child.classList.add("correct");
  });

  if (choice !== drill.answer) {
    button.classList.add("wrong");
  }

  elements.tutorialFeedbackTitle.textContent = choice === drill.answer ? "正解です。" : `正解は「${drill.answer}」です。`;
  elements.tutorialFeedbackNote.textContent = drill.note;
  elements.tutorialFeedback.hidden = false;
}

function shuffledChoices(card) {
  const choices = [...new Set(card.choices.map((choice) => String(choice || "").trim()).filter(Boolean))];
  while (choices.length < 4) {
    choices.push(`関連語${choices.length}`);
  }
  const seed = `${todayKey()}-${card.lesson}-${card.type}-${card.hanzi}-${state.view}`;
  return choices
    .map((choice, index) => ({ choice, rank: seededRank(`${seed}-${index}-${choice}`) }))
    .sort((a, b) => a.rank - b.rank)
    .map((item) => item.choice);
}

function seededRank(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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
  stopFallbackAudio();
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  playFallbackAudio(card.hanzi);
}

function speakText(text, allowRetry) {
  const utterance = new SpeechSynthesisUtterance(text);
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
  utterance.onerror = (event) => {
    if (event.error === "interrupted" || event.error === "canceled") {
      elements.speakButton.textContent = "音声";
      return;
    }
    if (allowRetry) {
      playFallbackAudio(text);
      return;
    }
    elements.speakButton.textContent = "音声";
    showAudioMessage("音声を再生できませんでした。端末に中国語の読み上げ音声が入っていない可能性があります。");
  };

  activeUtterance = utterance;
  window.speechSynthesis.resume();
  window.speechSynthesis.speak(activeUtterance);
}

function playFallbackAudio(text) {
  const audio = elements.fallbackAudio;
  if (!audio) {
    showAudioMessage("音声再生用の要素を初期化できませんでした。");
    return;
  }

  const audioText = normalizeSpeechText(text);
  const card = state.view === "today" ? currentCard() : visibleCards()[state.index % visibleCards().length];
  const remoteSources = [
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&q=${encodeURIComponent(audioText)}`,
    `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(audioText)}&le=zh`,
  ];
  const sources = card.lesson <= 20 ? [`./assets/audio/${audioKey(audioText)}.mp3`, ...remoteSources] : remoteSources;
  playAudioSource(sources, 0);
}

function playAudioSource(sources, index) {
  const audio = elements.fallbackAudio;
  if (!audio || index >= sources.length) {
    speakWithBrowserVoice(currentSpeechText());
    return;
  }

  clearAudioResetTimer();
  audio.src = sources[index];
  audio.onplay = () => {
    elements.speakButton.textContent = "再生中";
    audioResetTimer = setTimeout(() => {
      elements.speakButton.textContent = "音声";
    }, 12000);
  };
  audio.onended = () => {
    clearAudioResetTimer();
    elements.speakButton.textContent = "音声";
  };
  audio.onerror = () => {
    clearAudioResetTimer();
    playAudioSource(sources, index + 1);
  };
  audio.play().catch(() => {
    clearAudioResetTimer();
    playAudioSource(sources, index + 1);
  });
}

function speakWithBrowserVoice(text) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    elements.speakButton.textContent = "音声";
    showAudioMessage("音声を再生できませんでした。通信状況を確認して、ページを再読み込みしてください。");
    return;
  }
  speakText(text, false);
}

function stopFallbackAudio() {
  const audio = elements.fallbackAudio;
  if (!audio) return;
  clearAudioResetTimer();
  audio.pause();
  audio.currentTime = 0;
}

function normalizeSpeechText(text) {
  return String(text)
    .replace(/[。！？!?，,、；;：:「」『』（）()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function currentSpeechText() {
  const card = state.view === "today" ? currentCard() : visibleCards()[state.index % visibleCards().length];
  return normalizeSpeechText(card.hanzi);
}

function audioKey(text) {
  let hash = 5381;
  for (const char of text) {
    hash = ((hash << 5) + hash) ^ char.codePointAt(0);
  }
  return (hash >>> 0).toString(36);
}

function clearAudioResetTimer() {
  if (!audioResetTimer) return;
  clearTimeout(audioResetTimer);
  audioResetTimer = null;
}

function findMandarinVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === "zh-CN") ||
    voices.find((voice) => voice.lang === "zh-Hans-CN") ||
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
  if (state.view === "tutorial") {
    nextTutorial();
    return;
  }
  state.index = (state.index + 1) % visibleCards().length;
  saveState();
  renderView();
  renderProgress();
}

function previousTutorial() {
  if (!tutorials.length) return;
  state.tutorialIndex = (state.tutorialIndex - 1 + tutorials.length) % tutorials.length;
  saveState();
  renderTutorial();
}

function nextTutorial() {
  if (!tutorials.length) return;
  state.tutorialIndex = (state.tutorialIndex + 1) % tutorials.length;
  saveState();
  renderTutorial();
}

function resetProgress() {
  state.index = 0;
  state.completedToday = [];
  state.streak = 0;
  state.lastStudyDate = "";
  localStorage.setItem("studiedCards", "0");
  saveState();
  renderView();
  renderMissions();
  renderProgress();
}

elements.speakButton.addEventListener("click", speakCurrentCard);
elements.nextButton.addEventListener("click", nextCard);
elements.skipButton.addEventListener("click", nextCard);
elements.resetButton.addEventListener("click", resetProgress);
elements.tutorialPrev.addEventListener("click", previousTutorial);
elements.tutorialNext.addEventListener("click", nextTutorial);

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.view = button.dataset.view;
    state.index = 0;
    saveState();
    renderView();
  });
});

resetDailyIfNeeded();
warmUpVoices();
renderView();
renderMissions();

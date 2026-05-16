const fs = require("fs");
const vm = require("vm");

const outputDir = "assets/audio";
fs.mkdirSync(outputDir, { recursive: true });

const context = {};
vm.createContext(context);
vm.runInContext(`${fs.readFileSync("data.js", "utf8")}; this.learningContent = learningContent;`, context);

function normalizeSpeechText(text) {
  return String(text)
    .replace(/[。！？!?，,、；;：:「」『』（）()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function audioKey(text) {
  let hash = 5381;
  for (const char of text) {
    hash = ((hash << 5) + hash) ^ char.codePointAt(0);
  }
  return (hash >>> 0).toString(36);
}

const uniqueTexts = [
  ...new Set(
    context.learningContent.cards
      .filter((card) => card.lesson <= 20)
      .map((card) => normalizeSpeechText(card.hanzi))
      .filter((text) => text && !/[ぁ-んァ-ン]/.test(text)),
  ),
];

for (const text of uniqueTexts) {
  const file = `${outputDir}/${audioKey(text)}.mp3`;
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&q=${encodeURIComponent(text)}`;
  console.log(`${url}\t${file}\t${text}`);
}

console.error(`Listed ${uniqueTexts.length} local audio assets.`);

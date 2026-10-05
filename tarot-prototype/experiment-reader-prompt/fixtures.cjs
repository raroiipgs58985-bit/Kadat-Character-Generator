// Six fixed completed sessions. Cards and states are explicit; no draw or meaning is altered.
const production = require("../production-data.js");
const convergence = require("../experiment-convergence/session.js");
const refs = (ids) => ids.map(value => {
  const [card_id, suffix] = value.split(":");
  const card = production.getCard(card_id);
  if (!card) throw new Error(`Unknown fixture identity: ${card_id}`);
  return { card_id, ...(card.type === "major" ? { orientation: suffix === "r" ? "reversed" : "upright" } : {}) };
});
const specs = [
  { id: "01-major-heavy", label: "Преимущественно Major", question: "Как Келусу получить археотех Штрассе?",
    cards: refs(["major_00", "major_01", "major_02", "major_03", "major_04", "major_05", "major_06", "major_07", "major_08", "major_09", "major_10", "major_11", "major_12", "major_14", "excuteria_12", "major_21"]) },
  { id: "02-minor-heavy", label: "Все карты Minor; четыре масти", question: "Как снабдить отряд перед дальнейшим продвижением?",
    cards: refs(["adeptio_02", "adeptio_03", "adeptio_06", "discordia_01", "discordia_02", "discordia_04", "excuteria_02", "excuteria_03", "excuteria_04", "mandatio_02", "mandatio_03", "mandatio_04", "excuteria_07", "excuteria_08", "excuteria_12", "mandatio_06"]) },
  { id: "03-reversed-major", label: "Major Reversed и сохранённые ограничения источника", question: "Когда Штрассе отдаст археотех Келусу?",
    cards: refs(["major_00:r", "major_01:r", "major_04:r", "major_06:r", "major_10:r", "major_15:r", "major_19:r", "major_21:r", "excuteria_12", "adeptio_13", "discordia_01", "mandatio_10", "major_12", "major_18:r", "adeptio_04", "major_17:r"]) },
  { id: "04-tensions", label: "Контрастирующие знаки; без заранее выбранного пути", question: "Как сохранить единство отряда, не приняв опасного соглашения?",
    cards: refs(["major_06", "adeptio_11", "major_08", "discordia_03", "discordia_09", "discordia_14", "excuteria_04", "excuteria_13", "major_07", "major_15:r", "major_18", "discordia_01", "mandatio_07", "adeptio_09", "excuteria_12", "major_20"]) },
  { id: "05-shared-motifs", label: "Общие мотивы власти и служения через разные карты", question: "Как добиться разрешения на экспедицию?",
    cards: refs(["major_04", "adeptio_03", "mandatio_10", "adeptio_13", "excuteria_04", "mandatio_13", "excuteria_05", "excuteria_06", "adeptio_14", "adeptio_02", "adeptio_04", "mandatio_08", "major_05", "adeptio_09", "mandatio_09", "mandatio_14"]) },
  { id: "06-ambiguous", label: "Неопределённый вопрос; пробелы и перевод строки сохраняются", question: "  Что мне делать дальше?\nСрок мне пока неизвестен.  ",
    cards: refs(["major_00:r", "major_09:r", "major_18", "discordia_01", "excuteria_01", "excuteria_12", "major_10:r", "major_16", "major_19:r", "adeptio_05", "adeptio_06", "mandatio_03", "major_06:r", "discordia_04", "mandatio_07", "major_21:r"]) },
];
function completedSession(spec) {
  const draws = spec.cards.map(reference => {
    const card = production.getCard(reference.card_id);
    const art = card.type === "major" ? card[reference.orientation] : card;
    return { card_id: card.card_id, type: card.type,
      ...(card.type === "major" ? { orientation: reference.orientation } : {}),
      image: art.image, ...(art.artwork_id ? { artwork_id: art.artwork_id } : {}),
      ...(art.identity_id ? { identity_id: art.identity_id } : {}) };
  });
  const raw = { version: 2, data_version: production.version,
    session_id: `stage5b1-fixture-${spec.id}`, spread_id: "convergence",
    question: spec.question, question_status: "QUESTION_STATED", draws,
    progress: { opened_count: 16, current_index: 15, finished: true } };
  const session = convergence.restore(raw);
  if (!session) throw new Error(`Stage 5A rejected fixture: ${spec.id}`);
  return session;
}
module.exports = { specs, completedSession };

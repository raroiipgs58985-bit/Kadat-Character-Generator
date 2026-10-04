"use strict";
// Sixteen fixed readings, not a random or exhaustive draw suite.
const up = (cardId) => ({ cardId, state: "upright" });
const rev = (cardId) => ({ cardId, state: "reversed" });
const minor = (cardId) => ({ cardId, state: "standard" });
const fixture = (id, title, spreadId, seed, cards, coverage) => ({
  id, title, coverage, input: { spreadId, seed, question: "Что ожидает экспедицию?", cards },
});
const hopeful = [up("major_00"), up("major_17"), up("major_21")];
module.exports = [
  fixture("F01", "Император: преимущественно благоприятные Major", "imperator", "hope-0", hopeful,
    ["mostly_favourable_major", "reproducibility_reference", "display_question_only"]),
  fixture("F02", "Император: дурные знаки, Демон и Имматериум", "imperator", "adverse-17",
    [up("major_15"), up("major_18"), rev("major_02")], ["adverse_major", "daemon", "immaterium"]),
  fixture("F03", "Император: три перевёрнутые Major", "imperator", 403,
    [rev("major_00"), rev("major_11"), rev("major_13")], ["reversed_major"]),
  fixture("F04", "Император: истоки, власть и ремесло", "imperator", "mixed-4",
    [minor("adeptio_02"), up("major_04"), minor("mandatio_03")], ["mixed_major_minor"]),
  fixture("F05", "Ветвь: надежда и дурное освобождение как разные пути", "branch", "fork-5",
    [up("major_00"), minor("excuteria_06"), minor("adeptio_13"), minor("discordia_03"), up("major_17"), rev("major_15")],
    ["different_final_paths", "group_semantics", "daemon_reversed"]),
  fixture("F06", "Ветвь: Discordia без перевёрнутых Minor", "branch", "discordia-6",
    [1, 2, 3, 4, 5, 6].map((rank) => minor("discordia_" + String(rank).padStart(2, "0"))),
    ["discordia_heavy", "minor_standard_only", "group_semantics"]),
  fixture("F07", "Трон Терры: совет мученика и условный исход", "throne_of_terra", "throne-7",
    [minor("adeptio_01"), up("major_00"), minor("excuteria_01"), minor("adeptio_08"), rev("major_11"), up("major_12"), up("major_13")],
    ["mixed_major_minor", "advice_outcome_condition"]),
  fixture("F08", "Трон Терры: неблагоприятная карта в позиции совета", "throne_of_terra", "throne-8",
    [up("major_03"), minor("mandatio_05"), minor("excuteria_08"), minor("discordia_04"), minor("adeptio_09"), rev("major_15"), up("major_17")],
    ["adverse_advice", "daemon_reversed", "advice_outcome_condition"]),
  fixture("F09", "Трон Терры: надежда как препятствие", "throne_of_terra", "throne-9",
    [rev("major_05"), minor("adeptio_03"), rev("major_09"), up("major_17"), minor("mandatio_04"), rev("major_18"), up("major_20")],
    ["positive_obstacle", "immaterium_reversed", "reversed_major"]),
  fixture("F10", "Ореол: благоприятная карта остаётся испытанием", "haloed_rosette", "rosette-10",
    [up("major_14"), up("major_17"), minor("adeptio_02"), up("major_00"), up("major_21"), minor("mandatio_03"), up("major_06"), minor("discordia_02"), rev("major_09"), up("major_19")],
    ["positive_challenge", "inner_present_comparison"]),
  fixture("F11", "Ореол: явное противоречие внутреннего и настоящего", "haloed_rosette", "rosette-11",
    [up("major_15"), minor("discordia_08"), minor("excuteria_02"), rev("major_03"), up("major_19"), minor("mandatio_10"), up("major_17"), up("major_18"), rev("major_09"), up("major_20")],
    ["explicit_tension", "inner_present_comparison", "daemon", "immaterium"]),
  fixture("F12", "Ореол: повторяющиеся темы служения и долга", "haloed_rosette", "rosette-12",
    [minor("adeptio_02"), minor("adeptio_03"), minor("excuteria_02"), minor("excuteria_03"), up("major_05"), minor("mandatio_08"), minor("adeptio_07"), minor("adeptio_11"), minor("mandatio_09"), minor("excuteria_13")],
    ["repeated_themes", "minor_standard_only"]),
  fixture("F13", "Ореол: сила и слабость без выдуманной polarity", "haloed_rosette", "rosette-13",
    [up("major_11"), minor("discordia_03"), up("major_03"), minor("mandatio_02"), up("major_19"), minor("excuteria_04"), rev("major_01"), minor("mandatio_05"), rev("major_09"), up("major_21")],
    ["apparent_tension_neutral_fallback", "inner_present_comparison"]),
  fixture("F14", "Астро-гороскоп: 24 карты без выдуманных ролей", "astro_horoscope", "astro-14",
    [...Array.from({ length: 22 }, (_, rank) => (rank % 2 ? rev : up)("major_" + String(rank).padStart(2, "0"))), minor("adeptio_01"), minor("discordia_01")],
    ["astro_deferred", "no_individual_astro_roles"]),
  fixture("F15", "Император: те же карты, другой seed", "imperator", "hope-1", hopeful,
    ["different_seed_same_semantics", "paired_with_F01"]),
  fixture("F16", "Трон Терры: Discordia и неблагоприятный условный исход", "throne_of_terra", "throne-16",
    [minor("discordia_07"), minor("discordia_09"), minor("discordia_10"), minor("discordia_11"), minor("discordia_14"), rev("major_18"), rev("major_15")],
    ["discordia_heavy", "adverse_advice", "adverse_conditional_outcome", "daemon_reversed", "immaterium_reversed"]),
];

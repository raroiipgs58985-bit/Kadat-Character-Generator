# Stage 3 — source discrepancies and adopted policies

Date: **2026-10-04**. **No blocking assignment conflict; no artwork substitutions.** Eight nonblocking records are documented below. They comprise source/localization discrepancies, the accepted Astro policy, resolved historical documentation, one extraction typo and one grouped technical-metadata correction. They do not authorize automated curation.

Sources are the three supplied files recorded with SHA-256 in `data/source-provenance.json`. No additional artwork/source research was performed. English content comes from the supplied final package and The Emperor’s Tarot v1.30; Russian text comes from the supplied XLSX. Both language strings are retained when they disagree.

## SC-01 — Excuteria overview versus detailed section

The PDF Minor overview calls rank 4 **The Commander** and exchanges Navigator/Explorator at ranks 7–8. The detailed Excuteria section has **The Officer** at 4, **The Explorator** at 7 and **The Navigator** at 8. The final manually curated package follows this detailed order.

**Disposition: SOURCE_DISCREPANCY_RETAINED.** Current package IDs, names, ranks, order and artwork assignments remain unchanged. No alias is used to redraw or substitute a card.

## SC-02 — Russian suit spelling

The Russian workbook’s Excuteria sheet uses **Excuterem**. The PDF and final runtime package use **Excuteria**.

**Disposition: LOCALIZATION_SOURCE_RETAINED.** Canonical runtime suit key is `Excuteria`; the actual workbook sheet name remains in cell provenance. No silent suit renaming or new translation.

## SC-03 — The Immaterium wording

The English PDF, printed page 10, has **“ill-omened care”**. Its supplied Russian localization does not give an exact one-to-one rendering of that apparent typo.

**Disposition: SOURCE_DISCREPANCY_RETAINED.** English source text and Russian workbook value remain verbatim. No invented correction to the meaning.

## SC-04 — Major 0 variation

The English variation includes **“Passion”**; the provided Russian localization says **“Спокойствие”**.

**Disposition: LOCALIZATION_DISCREPANCY_RETAINED.** Both source values remain in separate EN/RU variation fields. Variations do not enter the main upright/reversed meanings.

## SC-05 — Astro-Horoscope introductory count versus flexible description

The PDF introduction, printed page 7, mentions a **twenty-four-card** Astro-Horoscope. The detailed spread section, printed page 21, describes a complex free arrangement with rows/columns, a great circle, concentric circles, a star and other possibilities; it does not supply one mandatory digital layout.

**Disposition: USER_ACCEPTED_STAGE2_1_POLICY.** The explicit accepted correction remains authoritative for this prototype: `SOURCE_FLEXIBLE`, `card_count: null`, `positions: []`, `startable: false`. No canonical fixed 24-card Astro UI. The generic 24-position engine fixture remains separate, internal, with no source functions. The introductory count is recorded here, not hidden or used to reverse the user's decision.

## SC-06 — Superseded blocking language inside the final ZIP

The ZIP’s `SOURCE_CONFLICTS.md` still labels the shared JB-LX-073 as a blocking 100-distinct-identity conflict. Its freeze/validation/reuse records and the user’s explicit later decision accept **99 unique identities with 100 assignments**.

**Disposition: RESOLVED / INTENTIONAL_REUSE.** `major_16` Upright and `mandatio_07` both keep JB-LX-073 and the same physical file. There are no unresolved duplicate conflicts and no requirement for 100 unique artworks. Historical blocking language has no runtime authority.

## SC-07 — Existing package extraction typo

`adeptio_14.symbolizes_en` contains **“le sser men”** in the final package. The supplied PDF presents **“lesser men”**.

**Disposition: EXTRACTION_DISCREPANCY_RECORDED.** The package string is retained in this integration; no silent meaning rewrite. This is a text-quality issue, not an artwork/identity conflict. Other PDF wrapping/spacing differences were compared without treating column layout as new meaning. The field’s source provenance remains available for an explicitly requested editorial correction.

## SC-08 — Ten stale size records, unchanged image bytes

Ten manifest entries in the ZIP have dimensions that differ from the actual supplied file. Runtime metadata uses dimensions measured from those files; `package_recorded_dimensions` preserves the old values. Detailed machine-readable audit: `data/technical-metadata-discrepancies.json`.

| Artwork ID | File                  | Package size | Actual size |
| ---------- | --------------------- | ------------ | ----------- |
| JB-VK-125  | major_00_reversed.jpg | 487 × 650    | 494 × 661   |
| JB-VK-002  | major_08_upright.jpg  | 732 × 1024   | 1157 × 1600 |
| JB-VK-040  | major_09_upright.jpg  | 327 × 480    | 628 × 900   |
| JB-VK-110  | major_14_reversed.jpg | 873 × 627    | 975 × 648   |
| JB-VK-003  | adeptio_12.jpg        | 690 × 1024   | 2169 × 3168 |
| JB-VK-037  | discordia_04.jpg      | 498 × 480    | 774 × 689   |
| JB-VK-055  | discordia_12.jpg      | 841 × 1024   | 976 × 1229  |
| JB-VK-042  | excuteria_02.jpg      | 744 × 1024   | 302 × 685   |
| JB-VK-027  | excuteria_13.jpg      | 740 × 1024   | 816 × 1123  |
| JB-VK-052  | mandatio_12.jpg       | 348 × 479    | 543 × 800   |

**Disposition: TECHNICAL_METADATA_CORRECTED.** No resampling, replacement, crop or image edit. Source technical-quality annotations are not automatically re-curated.

## Source omissions, not invented content

All **100 required Russian meaning states** exist in the supplied XLSX. Missing Russian meanings: **0**. For **64 cards**, that workbook has no separate Russian source-image description; `source_image_description_ru: null` and the IDs are listed in `data/source-provenance.json`. No new translations or literal descriptions were generated.

The source assigns common functions to Branch positions III–IV and V–VI; those functions are retained as shared groups. No finer distinction was invented. The internal 24-position fixture has `null` functions and is excluded from the canonical source lookup.

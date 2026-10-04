# Stage 4B-1 — bounded final validation

**PASS** — 60/60 checks.

Engine 4b1.1.0.0; Data 1.0.0; 16 fixed fixture outputs. Final pass: **1**. Full fixture regeneration: **0**.

One initial sample generation; seven outputs were repaired locally before final validation to remove repeated wording. Cached outputs were reused; additional bounded calls verify reproducibility, reload/browser parity, question independence, adapter and input rejection. No random fuzzing or Stage 4A semantic audit.

Protected scope: 198 pre-existing tracked files unchanged; frozen Stage 4A copies and authoritative archive bytes unchanged. Production UI, artwork and four Kadat generators unchanged. No publication, external AI/API or Stage 4B-2.

| Check | Status |
| --- | --- |
| frozen_data_version_loads | PASS |
| production_card_ids_resolve | PASS |
| source_states_index_without_new_minor_states | PASS |
| bounded_sixteen_fixed_fixtures | PASS |
| cached_outputs_match_current_source_hashes | PASS |
| fixtures_cover_required_edges | PASS |
| fixture_inputs_and_outputs_preserve_identities_and_states | PASS |
| semantic_anchors_equal_frozen_state_meanings | PASS |
| authored_fragments_resolve_verbatim_and_provenance | PASS |
| position_frames_match_frozen_templates | PASS |
| selective_core_plus_at_most_one_context_fragment | PASS |
| source_meaning_and_authored_framing_separate | PASS |
| all_positions_participate_in_main_prophecy | PASS |
| synthesis_templates_resolve_and_connectors_bounded | PASS |
| all_relation_and_section_references_resolve | PASS |
| source_relations_and_engine_heuristics_distinguished | PASS |
| imperator_structure_is_past_present_solution | PASS |
| branch_pairs_retain_group_only_roles | PASS |
| branch_alternatives_not_a_sequential_or_selected_future | PASS |
| branch_different_paths_preserve_both_source_tendencies | PASS |
| throne_roles_are_source_supported | PASS |
| throne_six_to_seven_outcome_is_conditional | PASS |
| adverse_advice_does_not_become_a_favourable_card | PASS |
| rosette_all_roles_and_temporal_plan_preserved | PASS |
| positive_rosette_card_two_remains_challenge | PASS |
| positive_throne_card_four_remains_obstacle | PASS |
| rosette_seven_present_comparison_source_explicit | PASS |
| rosette_extra_relations_are_heuristics | PASS |
| astro_is_controlled_deferred_without_invented_positions | PASS |
| reinforcement_requires_existing_shared_tags | PASS |
| tension_requires_opposed_explicit_source_tendencies | PASS |
| apparent_tension_uses_neutral_fallback | PASS |
| daemon_immaterium_adverse_in_both_orientations | PASS |
| discordia_stays_suit_context_and_minor_standard | PASS |
| major_reversed_uses_separate_source_meaning | PASS |
| stable_hash_known_vectors | PASS |
| same_input_seed_byte_identical | PASS |
| reload_same_input_seed_byte_identical | PASS |
| question_display_only_no_semantic_effect | PASS |
| different_seed_changes_wording_not_core_meaning | PASS |
| numeric_seed_has_stable_string_identity | PASS |
| unknown_card_rejected | PASS |
| minor_reversed_and_upright_rejected | PASS |
| major_standard_or_missing_state_rejected | PASS |
| unknown_spread_wrong_count_duplicate_and_position_rejected | PASS |
| nonportable_seed_rejected | PASS |
| completed_stage3_session_adapter_preserves_draws | PASS |
| adapter_default_seed_uses_saved_session_id | PASS |
| adapter_rejects_unfinished_version_artwork_and_minor_orientation | PASS |
| adapter_does_not_enable_disabled_production_astro | PASS |
| browser_umd_parity_with_network_and_randomness_blocked | PASS |
| engine_does_not_mutate_input_or_data | PASS |
| runtime_has_no_external_api_nlp_or_nondeterministic_capabilities | PASS |
| bundle_equals_all_frozen_json_documents | PASS |
| frozen_files_and_original_stage4a_bytes_unchanged | PASS |
| all_new_json_and_artifacts_parse_utf8 | PASS |
| all_preexisting_tracked_files_unchanged | PASS |
| production_ui_artwork_and_four_generators_untouched | PASS |
| isolated_branch_and_only_new_stage4b1_files | PASS |
| human_review_artifact_contains_all_main_prophecies_and_trace | PASS |

Checkpoint is ready for human review. Do not run a second full validation pass in this work session.

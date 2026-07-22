#!/usr/bin/env python3
from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one occurrence, found {count}")
    return text.replace(old, new, 1)


budget_path = Path("regiment-budget.js")
budget = budget_path.read_text(encoding="utf-8")
if "function planReductions" not in budget:
    marker = '  const api = { asNumber, calculate };'
    helper = '''  function planReductions(extraEquipment = [], overrun = 0) {
    let remainingOverrun = Math.max(0, Number(overrun) || 0);
    const reductions = [];

    for (const item of [...extraEquipment].reverse()) {
      if (remainingOverrun <= 0) break;
      const cost = asNumber(item?.entry?.cost);
      const quantity = Math.max(0, Number(item?.quantity ?? 0));
      if (!item?.entry?.id || cost === null || cost <= 0 || quantity <= 0) continue;

      const quantityToRemove = Math.min(quantity, Math.ceil(remainingOverrun / cost));
      reductions.push({
        id: item.entry.id,
        name: item.entry.name || item.entry.id,
        quantity: quantityToRemove,
        cost
      });
      remainingOverrun -= quantityToRemove * cost;
    }

    return {
      reductions,
      unresolvedOverrun: Math.max(0, remainingOverrun)
    };
  }

'''
    budget = replace_once(
        budget,
        marker,
        helper + '  const api = { asNumber, calculate, planReductions };',
        "budget API"
    )
    budget_path.write_text(budget, encoding="utf-8")


mode_path = Path("regiment-mode.js")
mode = mode_path.read_text(encoding="utf-8")
if "function reconcileSupply" not in mode:
    mode = replace_once(
        mode,
        '    extraEquipment: new Map(),\n    equipmentSearch: ""',
        '    extraEquipment: new Map(),\n    equipmentSearch: "",\n    supplyNotice: ""',
        "state notice"
    )
    mode = replace_once(
        mode,
        '    state.extraEquipment.clear();\n    state.equipmentSearch = "";',
        '    state.extraEquipment.clear();\n    state.equipmentSearch = "";\n    state.supplyNotice = "";',
        "reset notice"
    )

    marker = '  function priceLabel(entry, kind = "cost") {'
    reconcile = '''  function reconcileSupply() {
    const calc = calculate();
    if (calc.equipmentRemaining >= 0 || !state.extraEquipment.size) return calc;

    const plan = window.KADAT_REGIMENT_BUDGET.planReductions(
      calc.selected.extraEquipment,
      Math.abs(calc.equipmentRemaining)
    );
    const removed = [];

    for (const reduction of plan.reductions) {
      const current = state.extraEquipment.get(reduction.id) ?? 0;
      const next = Math.max(0, current - reduction.quantity);
      if (next > 0) state.extraEquipment.set(reduction.id, next);
      else state.extraEquipment.delete(reduction.id);
      removed.push(`${reduction.name} ×${reduction.quantity}`);
    }

    const adjusted = calculate();
    if (removed.length) {
      state.supplyNotice = `Лимит снабжения уменьшился. Автоматически сняты последние закупки: ${removed.join("; ")}.`;
    }
    if (adjusted.equipmentRemaining < 0 || plan.unresolvedOverrun > 0) {
      state.supplyNotice = "Закупки превышают доступный лимит снабжения. Уменьшите количество позиций с указанной стоимостью.";
    }
    return adjusted;
  }

'''
    mode = replace_once(mode, marker, reconcile + marker, "reconcile helper")

    heading = '${stageHeading(3, "DEFECTUS ET COPIAE", "Недостатки и снабжение", "Можно выбрать несколько недостатков. Их полковые очки суммируются. Неиспользованные полковые очки превращаются в очки дополнительного снаряжения по правилу источника.")}'
    mode = replace_once(
        mode,
        heading,
        heading + '\n        ${state.supplyNotice ? `<div class="message">${escapeHtml(state.supplyNotice)}</div>` : ""}',
        "supply notice"
    )
    mode = replace_once(
        mode,
        '      if (event.target.checked) state.drawbackIds.add(id);\n      else state.drawbackIds.delete(id);\n      renderStep();',
        '      state.supplyNotice = "";\n      if (event.target.checked) state.drawbackIds.add(id);\n      else state.drawbackIds.delete(id);\n      renderStep();',
        "drawback notice"
    )
    mode = replace_once(
        mode,
        '      state.extraEquipment.set(entry.id, current + 1);\n      renderStep();',
        '      state.supplyNotice = "";\n      state.extraEquipment.delete(entry.id);\n      state.extraEquipment.set(entry.id, current + 1);\n      renderStep();',
        "equipment plus"
    )
    mode = replace_once(
        mode,
        '      const current = state.extraEquipment.get(id) ?? 0;\n      if (current <= 1) state.extraEquipment.delete(id);',
        '      const current = state.extraEquipment.get(id) ?? 0;\n      state.supplyNotice = "";\n      if (current <= 1) state.extraEquipment.delete(id);',
        "equipment minus"
    )
    mode = replace_once(
        mode,
        '  function renderStep() {\n    if (!catalog || !refs.stage) return;\n    hideValidation();',
        '  function renderStep() {\n    if (!catalog || !refs.stage) return;\n    reconcileSupply();\n    hideValidation();',
        "render reconciliation"
    )
    mode = replace_once(
        mode,
        '    refs.points.classList.toggle("is-error", calc.remaining < 0 || calc.equipmentRemaining < 0);',
        '    const invalidBudget = calc.remaining < 0 || calc.equipmentRemaining < 0;\n    refs.points.classList.toggle("is-error", invalidBudget);\n    refs.next.disabled = state.step >= 3 && invalidBudget;\n    refs.submit.disabled = state.step === STEP_COUNT - 1 && invalidBudget;',
        "button lock"
    )
    mode_path.write_text(mode, encoding="utf-8")


test_path = Path("tests/regiment-budget-check.cjs")
test = test_path.read_text(encoding="utf-8")
if "const plan = budget.planReductions" not in test:
    marker = 'console.log("Regiment budget OK");'
    assertions = '''const plan = budget.planReductions([
  { entry: { id: "first", name: "Первая", cost: 5 }, quantity: 2 },
  { entry: { id: "last", name: "Последняя", cost: 15 }, quantity: 1 }
], 10);
assert.deepEqual(plan.reductions, [{ id: "last", name: "Последняя", quantity: 1, cost: 15 }]);
assert.equal(plan.unresolvedOverrun, 0);

'''
    test = replace_once(test, marker, assertions + marker, "budget test")
    test_path.write_text(test, encoding="utf-8")


index_path = Path("index.html")
index = index_path.read_text(encoding="utf-8")
index = index.replace("1.3.3", "1.3.4")
index_path.write_text(index, encoding="utf-8")

print("Negative supply fix applied.")

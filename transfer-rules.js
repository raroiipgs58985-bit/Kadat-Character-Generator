// Правило Кадата: два переноса по 5 очков можно делать из любой характеристики в любую другую.

transfersAreValid = function () {
  const race = getSelected(DATA.races, raceSelect.value);
  const limit = race.redistributionCount ?? 2;

  return state.transfers.length <= limit && state.transfers.every(transfer =>
    DATA.stats.includes(transfer.from)
    && DATA.stats.includes(transfer.to)
    && transfer.from !== transfer.to
  );
};

sanitizeTransfers = function () {
  if (!transfersAreValid()) resetTransfers();
};

refreshTransferControls = function () {
  const race = getSelected(DATA.races, raceSelect.value);
  const limit = race.redistributionCount ?? 2;
  const ready = generationReady();

  DATA.stats.forEach(stat => {
    const sourceButton = document.querySelector(`[data-transfer-from="${stat}"]`);
    const targetButton = document.querySelector(`[data-transfer-to="${stat}"]`);
    const card = document.querySelector(`[data-stat-card="${stat}"]`);
    const sourceAvailable = ready && state.transfers.length < limit;
    const targetAvailable = ready
      && state.pendingTransferFrom !== null
      && state.pendingTransferFrom !== stat
      && state.transfers.length < limit;

    if (sourceButton) {
      sourceButton.disabled = !sourceAvailable;
      sourceButton.classList.toggle("selected", state.pendingTransferFrom === stat);
    }
    if (targetButton) targetButton.disabled = !targetAvailable;
    if (card) card.classList.toggle("transfer-source", state.pendingTransferFrom === stat);
  });

  renderRedistributionPanel();
};

chooseTransferSource = function (stat) {
  const race = getSelected(DATA.races, raceSelect.value);
  const limit = race.redistributionCount ?? 2;

  if (!generationReady() || state.transfers.length >= limit) return;

  state.pendingTransferFrom = state.pendingTransferFrom === stat ? null : stat;
  refreshTransferControls();
};

completeTransfer = function (stat) {
  const race = getSelected(DATA.races, raceSelect.value);
  const limit = race.redistributionCount ?? 2;
  const from = state.pendingTransferFrom;

  if (!generationReady() || !from || from === stat || state.transfers.length >= limit) return;

  state.transfers.push({ from, to: stat });
  state.pendingTransferFrom = null;
  renderStats();
};

refreshTransferControls();

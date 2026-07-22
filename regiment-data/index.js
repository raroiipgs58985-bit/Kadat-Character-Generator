// Единая точка ожидания нормализованных данных генератора полков.
// Подключается после regiment-data-loader.js.
(() => {
  "use strict";

  window.KADAT_REGIMENT_CATALOG_READY = window.KADAT_REGIMENT_DATA_READY.then(data => ({
    data,
    categories: {
      homeworlds: data.homeworlds,
      origins: data.origins,
      commanders: data.commanders,
      regimentTypes: data.regimentTypes,
      trainingDoctrines: data.trainingDoctrines,
      equipmentDoctrines: data.equipmentDoctrines,
      drawbacks: data.drawbacks,
      extraEquipment: data.extraEquipment
    },
    findById(id) {
      for (const entries of Object.values(this.categories)) {
        const found = entries.find(entry => entry.id === id);
        if (found) return found;
      }
      return null;
    }
  }));
})();

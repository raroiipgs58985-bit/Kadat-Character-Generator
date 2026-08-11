(() => {
  "use strict";
  if (typeof document === "undefined") return;
  const DATA = window.KADAT_POWER_ARMOR_DATA;
  const ENGINE = window.KADAT_POWER_ARMOR_ENGINE;
  if (!DATA || !ENGINE) return;

  const ROMANS = ["I","II","III","IV","V"];
  const state = {
    step: 0, name: "", classId: "exoskeleton", groundSpeed: 5,
    alternateMovementType: "none", alternateSpeed: 5,
    leftManipulatorId: "glove", rightManipulatorId: "glove",
    armorId: "standard", armLayoutId: "one-heavy-one-light", bodyLayoutId: "two-heavy-two-light",
    design: null
  };
  const refs = {};
  let active = false;

  const esc = value => String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const currentClass = () => DATA.byId(DATA.classes, state.classId);
  const option = (items, selected) => items.map(item => `<option value="${esc(item.id)}"${item.id===selected?" selected":""}>${esc(item.name)}</option>`).join("");
  const speedOptions = max => Array.from({length:Math.max(1,Math.floor(max/5))},(_,i)=>(i+1)*5).map(v=>`<option value="${v}">${v} м</option>`).join("");

  function injectModeButton(){
    const switcher=document.querySelector("#registry-mode-switch");
    if(!switcher||switcher.querySelector('[data-registry-mode="power-armor"]')) return;
    const button=document.createElement("button");
    button.type="button";button.dataset.registryMode="power-armor";
    button.innerHTML="<span>ARMATURA</span><strong>СЕРВО-БРОНЯ</strong>";
    switcher.appendChild(button);
    switcher.addEventListener("click",e=>{
      const mode=e.target.closest("[data-registry-mode]")?.dataset.registryMode;
      if(mode==="power-armor") setMode(true); else setMode(false);
    });
  }

  function buildShell(){
    const footer=document.querySelector(".page-footer");
    if(!footer||document.querySelector("#power-armor-builder-view")) return;
    const section=document.createElement("section");
    section.id="power-armor-builder-view";section.className="builder-view power-armor-builder-view hidden";
    section.innerHTML=`
      <nav class="wizard-progress" aria-label="Этапы создания серво-брони">
        ${[["Шасси","Класс и масса"],["Движение","Скорость и системы"],["Манипуляторы","Руки и крепления"],["Броня","Защита и прочность"],["Компоновка","Вооружение и формуляр"]].map(([a,b],i)=>`<button type="button" class="wizard-step-button${i===0?" is-active":""}" data-pa-go="${i}"><span class="wizard-roman">${ROMANS[i]}</span><span class="wizard-step-copy"><strong>${a}</strong><small>${b}</small></span></button>`).join("")}
      </nav>
      <form id="power-armor-form" class="panel dossier-form" novalidate>
        <div class="dossier-rail dossier-rail-left" aria-hidden="true"></div><div class="dossier-rail dossier-rail-right" aria-hidden="true"></div>
        <div id="power-armor-stage"></div><div id="power-armor-validation" class="message hidden"></div>
        <div class="wizard-controls"><button id="pa-reset" type="button" class="secondary danger-quiet">Сбросить</button><button id="pa-prev" type="button" class="secondary">Назад</button><div class="wizard-status"><span id="pa-status">Этап 1 из 5</span><strong id="pa-mass">Масса: —</strong></div><button id="pa-next" type="button">Далее</button><button id="pa-submit" type="submit" class="authorization-button" hidden>Сформировать броню</button></div>
      </form>
      <section id="power-armor-result-view" class="result-view hidden" aria-live="polite"><div class="result-toolbar"><button id="pa-return" type="button" class="secondary">Вернуться к редактированию</button><div class="result-document-code"><span>ТЕХНИЧЕСКИЙ ФОРМУЛЯР</span><strong id="pa-code">ARM-000000</strong></div></div><section class="panel result-panel" tabindex="-1"><div class="result-stamp" aria-hidden="true">УЧТЕНО</div><div class="result-document-heading"><p>DEPARTMENTO MUNITORUM</p><h2>Формуляр серво-брони</h2><span>Уровень допуска: SIGMA</span></div><div id="pa-result"></div></section></section>`;
    footer.insertAdjacentElement("beforebegin",section);
    refs.section=section;refs.form=section.querySelector("#power-armor-form");refs.stage=section.querySelector("#power-armor-stage");refs.validation=section.querySelector("#power-armor-validation");refs.prev=section.querySelector("#pa-prev");refs.next=section.querySelector("#pa-next");refs.submit=section.querySelector("#pa-submit");refs.status=section.querySelector("#pa-status");refs.mass=section.querySelector("#pa-mass");refs.resultView=section.querySelector("#power-armor-result-view");refs.result=section.querySelector("#pa-result");refs.progress=[...section.querySelectorAll("[data-pa-go]")];
    refs.progress.forEach(b=>b.addEventListener("click",()=>go(Number(b.dataset.paGo))));
    refs.prev.addEventListener("click",()=>go(state.step-1));refs.next.addEventListener("click",()=>{if(validateStep(state.step))go(state.step+1)});
    section.querySelector("#pa-reset").addEventListener("click",reset);section.querySelector("#pa-return").addEventListener("click",()=>{refs.resultView.classList.add("hidden");refs.form.classList.remove("hidden");refs.progress[0].parentElement.classList.remove("hidden");render()});
    refs.form.addEventListener("submit",e=>{e.preventDefault();if(!validateAll())return;state.design=ENGINE.buildDesign(state,DATA);DATA.save(state.design);renderResult()});
  }

  function setMode(on){
    active=on;
    if(!refs.section)return;
    if(on){
      document.querySelectorAll("[data-registry-mode]").forEach(b=>b.classList.toggle("is-active",b.dataset.registryMode==="power-armor"));
      document.querySelector("#builder-view")?.classList.add("hidden");document.querySelector("#result-view")?.classList.add("hidden");document.querySelector("#regiment-builder-view")?.classList.add("hidden");document.querySelector("#xeno-builder-view")?.classList.add("hidden");refs.section.classList.remove("hidden");document.body.dataset.registryMode="power-armor";
      const h=document.querySelector(".masthead-copy h1"),p=document.querySelector(".masthead-copy > p:last-child"),proto=document.querySelector(".system-strip span:last-child");if(h)h.textContent="REGISTRUM ARMATURAE K-100";if(p)p.textContent="Когитатор проектирования экзо- и серво-брони";if(proto)proto.textContent="ПРОТОКОЛ: ТЕХНИЧЕСКИЙ ФОРМУЛЯР";window.scrollTo({top:0,behavior:"smooth"});
    }else if(document.body.dataset.registryMode==="power-armor") refs.section.classList.add("hidden");
  }

  function heading(i,k,t,d){return `<header class="stage-heading"><div class="stage-index">${ROMANS[i]}</div><div><p class="stage-kicker">${k}</p><h2>${t}</h2><p>${d}</p></div></header>`}
  function metrics(design){return `<div class="power-armor-metrics"><div><span>Учтённая масса</span><strong>${design.knownMass} кг</strong></div><div><span>Предел класса</span><strong>${design.armorClass.massMax} кг</strong></div><div><span>Прочность</span><strong>${design.integrity}</strong></div><div><span>Броня</span><strong>${design.armorPoints}</strong></div></div>`}

  function renderClass(){const c=currentClass();return `${heading(0,"STRUCTURA PRIMA","Шасси и весовая категория","Выберите класс. Класс задаёт диапазон полной массы, массу шасси, структурную целостность и слоты.")}<div class="armor-grid"><label>Название конструкции<input id="pa-name" value="${esc(state.name)}" placeholder="Наименование серво-брони"></label><label>Класс<select id="pa-class">${option(DATA.classes,state.classId)}</select></label></div><div class="power-armor-summary"><h3>${esc(c.name)}</h3><p>Полная масса класса: ${c.massMin}–${c.massMax} кг. Масса шасси: ${c.chassisMass} кг. Базовая структурная целостность: ${c.integrity}.</p><p>Слоты: ${c.armSlots} на каждую руку, ${c.bodySlots} на корпус. Предел структурного усиления: ${c.reinforcementLimit}.</p></div>`}
  function renderMovement(){const c=currentClass();const alt=state.alternateMovementType==="none"?null:c[state.alternateMovementType];return `${heading(1,"MOTUS SYSTEMATA","Передвижение","Наземная система обязательна. Дополнительно можно установить только одну неназемную систему.")}<div class="armor-grid"><label>Наземная скорость<select id="pa-ground">${speedOptions(c.ground.maxSpeed)}</select></label><label>Неназемная система<select id="pa-alt"><option value="none">Нет</option><option value="jump"${state.alternateMovementType==="jump"?" selected":""}>Прыжок</option>${c.flight?`<option value="flight"${state.alternateMovementType==="flight"?" selected":""}>АВВП / полноценный полёт</option>`:""}<option value="underwater"${state.alternateMovementType==="underwater"?" selected":""}>Подводное передвижение</option></select></label>${alt?`<label>Скорость дополнительной системы<select id="pa-alt-speed">${speedOptions(alt.maxSpeed)}</select></label>`:""}</div><div class="power-armor-note">Масса каждой двигательной системы начисляется за каждые 5 м базовой скорости строго по таблице.</div>`}
  function manipCard(m){return `<article class="power-armor-card"><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p><p>${esc(m.properties)}</p><strong>${m.mass>=0?"+":""}${m.mass} кг за руку</strong></article>`}
  function renderManipulators(){const l=DATA.byId(DATA.manipulators,state.leftManipulatorId),r=DATA.byId(DATA.manipulators,state.rightManipulatorId);return `${heading(2,"MANIPULATORA","Манипуляторы","Можно установить до двух манипуляторов — по одному на каждую руку. Их масса считается отдельно.")}<div class="armor-grid"><label>Левая рука<select id="pa-left">${option(DATA.manipulators,state.leftManipulatorId)}</select></label><label>Правая рука<select id="pa-right">${option(DATA.manipulators,state.rightManipulatorId)}</select></label>${manipCard(l)}${manipCard(r)}</div>`}
  function renderArmor(){const a=DATA.byId(DATA.armor,state.armorId),c=currentClass();return `${heading(3,"ARMATURA ET FIRMITAS","Броня и прочность","Выберите один тип брони/структурного улучшения. Значения берутся напрямую из таблицы.")}<label class="primary-field">Тип брони<select id="pa-armor">${option(DATA.armor,state.armorId)}</select></label><div class="power-armor-summary"><h3>${esc(a.name)}</h3><p>Модификатор прочности: ×${a.integrityModifier}. Очки брони: ${a.armor}. Масса: ${a.mass} кг. Занимаемые слоты крепления: ${a.mountSlots}.</p><p>Предел структурного усиления для класса: ${c.reinforcementLimit}. Отдельный числовой эффект одного уровня усиления в таблице не указан, поэтому когитатор его не придумывает.</p></div>`}
  function renderLayout(){const d=ENGINE.buildDesign(state,DATA);return `${heading(4,"ARMAMENTUM","Компоновка вооружения","Выберите допустимую схему размещения вооружения. Конкретные модели оружия в исходной таблице не перечислены.")}${metrics(d)}<div class="armor-grid"><label>Вооружение рук<select id="pa-arm-layout">${option(DATA.weaponLayouts.arms,state.armLayoutId)}</select></label><label>Вооружение корпуса<select id="pa-body-layout">${option(DATA.weaponLayouts.body,state.bodyLayoutId)}</select></label></div><div class="power-armor-summary"><h3>Свободные слоты после манипуляторов</h3><p>Левая рука: ${d.weaponSlots.leftFree}/${d.weaponSlots.leftTotal}. Правая рука: ${d.weaponSlots.rightFree}/${d.weaponSlots.rightTotal}. Корпус: ${d.weaponSlots.bodyFree}/${d.weaponSlots.bodyTotal}.</p><p class="power-armor-note">${esc(d.sourceNote)}</p></div>`}
  function render(){
    const renderers=[renderClass,renderMovement,renderManipulators,renderArmor,renderLayout];refs.stage.innerHTML=renderers[state.step]();refs.progress.forEach((b,i)=>b.classList.toggle("is-active",i===state.step));refs.status.textContent=`Этап ${state.step+1} из 5`;refs.prev.disabled=state.step===0;refs.next.hidden=state.step===4;refs.submit.hidden=state.step!==4;hideError();bind();updateMass();
  }
  function bind(){
    refs.stage.querySelector("#pa-name")?.addEventListener("input",e=>state.name=e.target.value);
    refs.stage.querySelector("#pa-class")?.addEventListener("change",e=>{state.classId=e.target.value;state.groundSpeed=5;state.alternateMovementType="none";state.alternateSpeed=5;render()});
    const g=refs.stage.querySelector("#pa-ground");if(g){g.value=String(state.groundSpeed);g.addEventListener("change",e=>{state.groundSpeed=Number(e.target.value);updateMass()})}
    refs.stage.querySelector("#pa-alt")?.addEventListener("change",e=>{state.alternateMovementType=e.target.value;state.alternateSpeed=5;render()});
    const as=refs.stage.querySelector("#pa-alt-speed");if(as){as.value=String(state.alternateSpeed);as.addEventListener("change",e=>{state.alternateSpeed=Number(e.target.value);updateMass()})}
    refs.stage.querySelector("#pa-left")?.addEventListener("change",e=>{state.leftManipulatorId=e.target.value;render()});refs.stage.querySelector("#pa-right")?.addEventListener("change",e=>{state.rightManipulatorId=e.target.value;render()});
    refs.stage.querySelector("#pa-armor")?.addEventListener("change",e=>{state.armorId=e.target.value;render()});refs.stage.querySelector("#pa-arm-layout")?.addEventListener("change",e=>{state.armLayoutId=e.target.value;updateMass()});refs.stage.querySelector("#pa-body-layout")?.addEventListener("change",e=>{state.bodyLayoutId=e.target.value;updateMass()});
  }
  function updateMass(){try{const d=ENGINE.buildDesign(state,DATA);refs.mass.textContent=`Масса: ${d.knownMass}/${d.armorClass.massMax} кг`;refs.mass.classList.toggle("negative",d.remainingMass<0)}catch{refs.mass.textContent="Масса: —"}}
  function showError(text){refs.validation.textContent=text;refs.validation.classList.remove("hidden")}
  function hideError(){refs.validation.textContent="";refs.validation.classList.add("hidden")}
  function validateStep(step){if(step===0&&!state.classId){showError("Выберите класс экзо-брони.");return false}if(step===1){const e=ENGINE.validate(state,DATA);if(e.length){showError(e[0]);return false}}return true}
  function validateAll(){const e=ENGINE.validate(state,DATA);if(e.length){showError(e.join(" "));return false}return true}
  function go(i){if(i<0||i>4)return;state.step=i;render();window.scrollTo({top:0,behavior:"smooth"})}
  function reset(){Object.assign(state,{step:0,name:"",classId:"exoskeleton",groundSpeed:5,alternateMovementType:"none",alternateSpeed:5,leftManipulatorId:"glove",rightManipulatorId:"glove",armorId:"standard",armLayoutId:"one-heavy-one-light",bodyLayoutId:"two-heavy-two-light",design:null});refs.resultView.classList.add("hidden");refs.form.classList.remove("hidden");refs.progress[0].parentElement.classList.remove("hidden");render()}
  function renderResult(){const d=state.design;refs.form.classList.add("hidden");refs.progress[0].parentElement.classList.add("hidden");refs.resultView.classList.remove("hidden");refs.section.querySelector("#pa-code").textContent=`ARM-${String(Date.now()).slice(-6)}`;refs.result.innerHTML=`<div class="power-armor-result-list"><article><h3>${esc(d.name)}</h3><p>${esc(d.armorClass.name)} · диапазон полной массы ${d.armorClass.massMin}–${d.armorClass.massMax} кг</p></article>${metrics(d)}<article><h3>Передвижение</h3><p>Наземная скорость: ${d.movement.groundSpeed} м; масса системы ${d.movement.groundMass} кг.</p><p>${d.movement.alternateSystem?`${d.movement.alternateType}: ${d.movement.alternateSpeed} м; масса ${d.movement.alternateMass} кг.`:"Дополнительная система не установлена."}</p></article><article><h3>Манипуляторы</h3><p>Левая: ${esc(d.manipulators.left.name)} (${d.manipulators.left.mass>=0?"+":""}${d.manipulators.left.mass} кг). Правая: ${esc(d.manipulators.right.name)} (${d.manipulators.right.mass>=0?"+":""}${d.manipulators.right.mass} кг).</p></article><article><h3>Броня</h3><p>${esc(d.armor.name)} · броня ${d.armorPoints} · модификатор прочности ×${d.armor.integrityModifier} · масса ${d.armor.mass} кг · слоты крепления ${d.mountSlots}.</p><p>Предел структурного усиления класса: ${d.reinforcementLimit}.</p></article><article><h3>Вооружение</h3><p>Руки: ${esc(d.armLayout?.name||"—")}. ${esc(d.armLayout?.ammo||"")}</p><p>Корпус: ${esc(d.bodyLayout?.name||"—")}. ${esc(d.bodyLayout?.ammo||"")}</p></article><article><h3>Масса и слоты</h3><p>Учтённая масса: ${d.knownMass} кг; запас до верхнего предела класса: ${d.remainingMass} кг.</p><p>Свободные слоты: левая рука ${d.weaponSlots.leftFree}/${d.weaponSlots.leftTotal}, правая ${d.weaponSlots.rightFree}/${d.weaponSlots.rightTotal}, корпус ${d.weaponSlots.bodyFree}/${d.weaponSlots.bodyTotal}.</p><p class="power-armor-note">${esc(d.sourceNote)}</p></article></div>`;window.scrollTo({top:0,behavior:"smooth"})}

  injectModeButton();buildShell();render();
})();

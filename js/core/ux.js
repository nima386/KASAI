(function(){
  const AREA_LABELS = {
    app: 'App',
    settings: 'Einstellungen',
    training: 'Training',
    run: 'Run',
    nutrition: 'Ernahrung',
    habits: 'Habits',
    plan: 'Plan',
  };

  let pulseTimer = null;
  let lastLocalSaveAt = 0;

  function isDebugUiEnabled(){
    try{
      return new URLSearchParams(location.search).has('debug') || localStorage.getItem('kasai.debug.ui') === '1';
    }catch(_){
      return false;
    }
  }

  function areaLabel(area){
    return AREA_LABELS[area] || AREA_LABELS.app;
  }

  function ensureSavePulse(){
    let el = document.getElementById('kasai-save-pulse');
    if(el) return el;
    el = document.createElement('div');
    el.id = 'kasai-save-pulse';
    el.className = 'kasai-save-pulse';
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<span class="kasai-save-dot"></span><span class="kasai-save-text">Bereit</span>';
    document.body.appendChild(el);
    return el;
  }

  function showSavePulse(state, text, duration){
    const el = ensureSavePulse();
    const textEl = el.querySelector('.kasai-save-text');
    el.className = `kasai-save-pulse show ${state || 'waiting'}`;
    if(textEl) textEl.textContent = text || 'Gespeichert';
    clearTimeout(pulseTimer);
    if(duration !== 0){
      pulseTimer = setTimeout(()=>el.classList.remove('show'), duration || 1400);
    }
  }

  function markLocalSave(area){
    if(!isDebugUiEnabled()) return;
    const now = Date.now();
    if(now - lastLocalSaveAt < 450) return;
    lastLocalSaveAt = now;
    showSavePulse('waiting', `${areaLabel(area)} lokal gespeichert`, 900);
  }

  function setSaveStatus(state, label){
    const clean = String(label || '').replace(/^\/\/\s*/, '').trim();
    if(!isDebugUiEnabled() && state !== 'error'){
      const el = document.getElementById('kasai-save-pulse');
      if(el) el.classList.remove('show');
      return;
    }
    if(state === 'syncing') return showSavePulse('syncing', clean || 'Speichert ...', 0);
    if(state === 'waiting') return showSavePulse('waiting', clean || 'Speichert ...', 1200);
    if(state === 'offline') return showSavePulse('offline', clean || 'Offline gespeichert', 1800);
    if(state === 'error') return showSavePulse('error', clean || 'Speichern fehlgeschlagen', 2600);
    if(state === 'ok') return showSavePulse('ok', clean || 'Gespeichert', 1200);
  }

  function setButtonBusy(button, busy, label){
    if(!button) return;
    if(busy){
      if(!button.dataset.kasaiOriginalLabel) button.dataset.kasaiOriginalLabel = button.innerHTML;
      button.classList.add('kasai-button-busy');
      button.setAttribute('aria-busy', 'true');
      if(label) button.innerHTML = label;
    }else{
      button.classList.remove('kasai-button-busy');
      button.removeAttribute('aria-busy');
      if(button.dataset.kasaiOriginalLabel){
        button.innerHTML = button.dataset.kasaiOriginalLabel;
        delete button.dataset.kasaiOriginalLabel;
      }
    }
  }

  function emptyState(title, body, action){
    const safeTitle = escapeHtml(title || 'Noch nichts da');
    const safeBody = escapeHtml(body || 'Sobald du etwas anlegst, erscheint es hier.');
    const safeAction = action ? `<div class="kasai-empty-action">${escapeHtml(action)}</div>` : '';
    return `<div class="kasai-empty-state"><div class="kasai-empty-mark">+</div><strong>${safeTitle}</strong><span>${safeBody}</span>${safeAction}</div>`;
    return `<div class="kasai-empty-state"><div class="kasai-empty-mark">＋</div><strong>${safeTitle}</strong><span>${safeBody}</span>${safeAction}</div>`;
  }

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;',
    }[char]));
  }

  function bindPressFeedback(){
    const selector = 'button,.nav-item,.pill-pick,.pill,.cat-card,.run-item,.settings-v2-row,.settings-v2-action,.meal-card,.habit-card,.plan-day-row';
    let active = null;
    document.addEventListener('pointerdown', event=>{
      const target = event.target.closest(selector);
      if(!target || target.disabled || target.classList.contains('disabled')) return;
      active = target;
      target.classList.add('kasai-ux-pressed');
    }, {passive:true});
    ['pointerup','pointercancel','pointerleave','blur'].forEach(type=>{
      document.addEventListener(type, ()=>{
        if(!active) return;
        active.classList.remove('kasai-ux-pressed');
        active = null;
      }, true);
    });
  }

  function upgradeEmptyStates(){
    document.querySelectorAll('.empty-hint,.run-empty,.run-proof-none').forEach(el=>{
      el.classList.add('kasai-empty-upgraded');
    });
  }

  function updateVersionLabels(){
    const version = window.KasaiVersion?.current || window.KASAI_APP_VERSION || '';
    if(!version) return;
    document.querySelectorAll('[data-kasai-version]').forEach(el=>{ el.textContent = version; });
  }

  function bootstrap(){
    ensureSavePulse();
    bindPressFeedback();
    upgradeEmptyStates();
    updateVersionLabels();
    if(!window.__kasaiUxObserver){
      window.__kasaiUxObserver = new MutationObserver(()=>{
        upgradeEmptyStates();
        updateVersionLabels();
      });
      window.__kasaiUxObserver.observe(document.body, {childList:true, subtree:true});
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bootstrap, {once:true});
  }else{
    bootstrap();
  }

  window.KasaiUX = Object.freeze({
    markLocalSave,
    setSaveStatus,
    setButtonBusy,
    emptyState,
    upgradeEmptyStates,
    updateVersionLabels,
  });
})();

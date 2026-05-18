(function(){
  const current = 'kasai-v43-timepush-i18n6-safearea1';
  const buildDate = '2026-05-18';

  window.KasaiVersion = Object.freeze({
    current,
    cache: current,
    buildDate,
    channel: 'pwa',
    label(){
      return `${current} · KASAI`;
    }
  });
})();

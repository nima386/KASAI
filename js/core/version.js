(function(){
  const current = 'kasai-v43-timepush-i18n3';
  const buildDate = '2026-05-17';

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

(function(){
  function warn(message, details){
    try{
      console.warn('[KASAI DOM]', message, details || '');
    }catch(_){}
  }

  function byId(id){
    return document.getElementById(id);
  }

  function query(selector, root){
    return (root || document).querySelector(selector);
  }

  function all(selector, root){
    return Array.from((root || document).querySelectorAll(selector));
  }

  function on(target, type, handler, options){
    const el = typeof target === 'string' ? byId(target) : target;
    if(!el){
      warn('Missing element for event binding', {target, type});
      return null;
    }
    el.addEventListener(type, handler, options);
    return el;
  }

  function onQuery(selector, type, handler, options){
    const el = query(selector);
    if(!el){
      warn('Missing selector for event binding', {selector, type});
      return null;
    }
    el.addEventListener(type, handler, options);
    return el;
  }

  function onAll(selector, type, handler, options){
    const nodes = all(selector);
    if(!nodes.length) warn('No elements matched selector for event binding', {selector, type});
    nodes.forEach(el=>el.addEventListener(type, handler, options));
    return nodes;
  }

  function setClick(id, handler, options){
    return on(id, 'click', handler, options);
  }

  window.KasaiDOM = {
    byId,
    query,
    all,
    on,
    onQuery,
    onAll,
    setClick,
  };
})();

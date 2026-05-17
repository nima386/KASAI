(function(){
  function safeClone(value){
    if(value == null) return value;
    try{
      if(typeof structuredClone === 'function') return structuredClone(value);
    }catch(_){}
    return JSON.parse(JSON.stringify(value));
  }

  function cloneWithUpdatedAt(value, timestamp){
    const clone = safeClone(value);
    if(clone && typeof clone === 'object'){
      clone.updatedAt = timestamp || new Date().toISOString();
    }
    return clone;
  }

  function userScopedKey(prefix, session){
    const userId = session?.user?.id;
    return userId ? `${prefix}_${userId}` : null;
  }

  function canUseLocalStorage(){
    try{
      const key = '__kasai_storage_probe__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    }catch(_){
      return false;
    }
  }

  window.KasaiState = Object.freeze({
    safeClone,
    cloneWithUpdatedAt,
    userScopedKey,
    canUseLocalStorage,
  });
})();

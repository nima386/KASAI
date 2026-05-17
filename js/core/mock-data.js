(function(){
  function createMockState(){
    const today = new Date();
    const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const todayKey = dateKey(today);
    return {
      profile: {
        name: 'KASAI Demo',
        weightKg: 82,
        stepGoal: 10000,
        waterGoal: 3000,
        kcalGoal: 2600,
        proteinMin: 1.8,
        proteinMax: 2.2,
      },
      hydration: {[todayKey]: 1600},
      steps: {[todayKey]: 6400},
      habits: {[todayKey]: {}},
      sessions: {[todayKey]: {}},
      meals: {[todayKey]: []},
      runs: [
        {id:'demo-run-1', date:todayKey, km:5, min:31, type:'Easy Run', pauses:1, proofImages:[], pr:false, createdAt:new Date().toISOString()},
      ],
      userHabits: [
        {id:'demo-habit-1', name:'Mobility', icon:'✦', target:1, unit:'x', color:'#8a80f8'},
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  window.KasaiMock = Object.freeze({
    createState: createMockState,
  });
})();

(() => {
  const SAVE_KEY = 'hearth-hollow-save-v1';
  const archetypes = {
    knight: {label:'Warden', icon:'🛡️', color:'knight', stat:'Might'},
    ranger: {label:'Ranger', icon:'🏹', color:'ranger', stat:'Wits'},
    mage: {label:'Arcanist', icon:'🔮', color:'mage', stat:'Lore'},
    bard: {label:'Bard', icon:'🎻', color:'bard', stat:'Charm'}
  };
  const names = [
    ['Tamsin','ranger'],['Orin','knight'],['Elowen','mage'],['Perrin','bard'],['Sable','ranger'],['Garrick','knight'],['Nim','mage'],['Lark','bard'],['Rowan','ranger'],['Branna','knight'],['Ivo','mage'],['Merry','bard']
  ];
  const questTemplates = [
    {title:'Mushroom Run',place:'Mossbell Woods',icon:'🍄',desc:'Gather mooncap mushrooms before the rain. The apothecary pays well for fresh caps.',risk:1,target:8,min:2,max:3,reward:[34,48],renown:5,days:1},
    {title:'A Wolf at the Door',place:'Old Barrow Road',icon:'🐺',desc:'A hungry pack has been stalking the westbound carts. Put the locals at ease.',risk:2,target:12,min:2,max:3,reward:[49,68],renown:8,days:2},
    {title:'The Sunken Reliquary',place:'Lower Mere',icon:'🗝️',desc:'A brass astrolabe lies somewhere in the flooded shrine. Mind the things below.',risk:3,target:16,min:2,max:3,reward:[67,91],renown:12,days:3},
    {title:'Lanterns in the Fen',place:'Greyfen Crossing',icon:'🕯️',desc:'Wayfarers report ghost lights luring travelers off the causeway. Find their source.',risk:2,target:13,min:2,max:3,reward:[55,74],renown:9,days:2},
    {title:'The Missing Miller',place:'Three Fields',icon:'🌾',desc:'The miller never came home. Search the nearby hills and bring him back safely.',risk:1,target:9,min:1,max:3,reward:[38,53],renown:6,days:1},
    {title:'Ashes of the Watchtower',place:'North Ridge',icon:'🏰',desc:'Something has nested in the ruined watchtower. The reeve needs it cleared.',risk:3,target:17,min:2,max:3,reward:[75,102],renown:13,days:3},
    {title:'A Courtly Errand',place:'Roseglass Manor',icon:'🌹',desc:'A delicate diplomatic delivery. Good manners matter more than a sharp blade.',risk:1,target:8,min:1,max:2,reward:[40,58],renown:7,days:1},
    {title:'Bandits at Brackenford',place:'Brackenford Pass',icon:'⚔️',desc:'A band of highwaymen has claimed the bridge. The village will pay for peace.',risk:2,target:14,min:2,max:3,reward:[62,82],renown:10,days:2},
    {title:'The Glasswing Nest',place:'Copperleaf Grove',icon:'🦋',desc:'A rare glasswing queen has made a home in the orchard. Catch, do not harm.',risk:2,target:12,min:1,max:3,reward:[52,70],renown:9,days:2},
    {title:'The Bell Beneath',place:'Saint Orra’s Crypt',icon:'🔔',desc:'A bell rings under the earth each midnight. The village sleep is wearing thin.',risk:3,target:18,min:2,max:3,reward:[82,112],renown:15,days:3}
  ];
  const $ = id => document.getElementById(id);
  const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  function freshHero(name,kind,level=1){return {id:'h'+Math.random().toString(36).slice(2,9),name,kind,level,xp:0,fatigue:0};}
  function newGame(){
    return {day:1,gold:180,renown:12,spirit:76,hall:1,crew:[freshHero('Mira','ranger'),freshHero('Bram','knight'),freshHero('Pip','mage')],quests:[],missions:[],logs:[],selected:null,party:[],lastRefresh:1,hired:0,won:false};
  }
  let state;
  try { const saved=JSON.parse(localStorage.getItem(SAVE_KEY)); state=saved&&saved.crew&&saved.day? saved:newGame(); } catch { state=newGame(); }
  if(!Array.isArray(state.quests)||!state.quests.length) state.quests=makeBoard();
  if(!Array.isArray(state.logs)||!state.logs.length) addLog('Welcome to the wayhouse. Your first contracts are waiting.','✦');
  let toastTimer;
  function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch(e){}}
  function logSafe(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function addLog(text,mark='✦'){state.logs.unshift({text,mark,day:state.day});state.logs=state.logs.slice(0,12);}
  function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300);}
  function makeBoard(){
    const pool=[...questTemplates];const out=[];while(out.length<3&&pool.length){const i=rand(0,pool.length-1);const t=pool.splice(i,1)[0];out.push({...t,id:'q'+Math.random().toString(36).slice(2,8)});}return out;
  }
  function heroPower(hero){return (hero.level*3+1)-Math.floor(hero.fatigue/35);}
  function usable(hero){return !state.missions.some(m=>m.heroes.includes(hero.id))&&hero.fatigue<95;}
  function heroById(id){return state.crew.find(h=>h.id===id);}
  function rank(){if(state.renown>=110)return 'Fabled';if(state.renown>=75)return 'Renowned';if(state.renown>=45)return 'Established';if(state.renown>=25)return 'Trusted';return 'Wayfarer';}
  function cap(){return 3+state.hall*2;}
  function missionSlots(){return 1+state.hall;}
  function season(){const day=((state.day-1)%24)+1;const seasons=['Midsummer','Harvesttide','Frostfall','Thaw'];return {name:seasons[Math.floor((state.day-1)/24)%4],day};}
  function questChance(q,party){const power=party.reduce((n,id)=>n+heroPower(heroById(id)),0);return {power,chance:clamp(Math.round(68+(power-q.target)*5-q.risk*5),15,96)};}
  function render(){
    const cal=season();$('season-label').textContent=`${cal.name}, ${cal.day}${ordinal(cal.day)}`;
    $('weather-label').textContent=pick(['Clear skies · good omens','A soft wind from the west','The hearth smoke rises straight','Rain on the far hills','The old road is quiet']);
    $('day-number').textContent=String(state.day).padStart(2,'0');$('gold-value').innerHTML=`${state.gold} <i>g</i>`;$('renown-value').textContent=state.renown;$('rank-value').textContent=rank();$('crew-value').innerHTML=`${state.crew.length} <i>/ ${cap()}</i>`;$('spirit-value').innerHTML=`${state.spirit}<span class="percent">%</span>`;$('spirit-bar').style.width=state.spirit+'%';$('roster-count').textContent=String(state.crew.length).padStart(2,'0');$('hall-level').textContent=state.hall;$('active-count').textContent=state.missions.length;$('refresh-days').textContent=`${Math.max(1,3-(state.day-state.lastRefresh))} DAY${3-(state.day-state.lastRefresh)===1?'':'S'}`;
    renderQuests();renderRoster();renderDispatch();renderMissions();renderLogs();
    const up=$('upgrade-button');const cost=state.hall===1?220:state.hall===2?400:650;up.querySelector('small').textContent=state.hall>=3?'Your guild hall is the pride of the valley':`More beds, better company — ${cost}g`;up.disabled=state.hall>=3||state.gold<cost;
    $('hire-button').disabled=state.crew.length>=cap();$('hire-button').style.opacity=state.crew.length>=cap()?'.45':'';
    save();
  }
  function ordinal(n){if(n%100>=11&&n%100<=13)return 'th';return ({1:'st',2:'nd',3:'rd'})[n%10]||'th';}
  function renderQuests(){
    const holder=$('quest-list');if(!state.quests.length){holder.innerHTML='<div class="empty-road"><b>The board is bare</b>New requests arrive in a day or two.</div>';return;}
    holder.innerHTML=state.quests.map(q=>`<article class="quest-card ${state.selected===q.id?'selected':''}" data-quest="${q.id}" tabindex="0" role="button" aria-label="Select ${logSafe(q.title)}"><div class="quest-top"><div class="quest-art">${q.icon}</div><div><h3 class="quest-title">${logSafe(q.title)}</h3><div class="quest-loc">⌖ ${logSafe(q.place)}</div></div><span class="difficulty">${'◆'.repeat(q.risk)}${'◇'.repeat(3-q.risk)} · ${q.risk===1?'Low':q.risk===2?'Medium':'High'}</span></div><p class="quest-desc">${logSafe(q.desc)}</p><div class="quest-meta"><span class="reward">◉ <b>${q.reward[0]}–${q.reward[1]}g</b></span><span class="reward renown">✧ +${q.renown} renown</span><span class="quest-duration">◷ ${q.days} day${q.days>1?'s':''}</span></div></article>`).join('');
    holder.querySelectorAll('.quest-card').forEach(el=>{el.addEventListener('click',()=>selectQuest(el.dataset.quest));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectQuest(el.dataset.quest);}});});
  }
  function selectQuest(id){state.selected=state.selected===id?null:id;state.party=[];render();}
  function renderRoster(){
    $('roster-list').innerHTML=state.crew.map(h=>{const a=archetypes[h.kind],busy=!usable(h),mission=state.missions.find(m=>m.heroes.includes(h.id));const fatigue=clamp(100-h.fatigue,0,100);return `<div class="hero-row"><div class="hero-avatar ${a.color}">${a.icon}</div><div class="hero-info"><div class="hero-name">${logSafe(h.name)} <span style="color:#a9905b;font-size:8px">Lv.${h.level}</span></div><div class="hero-class">${a.label} · ${a.stat} ${heroPower(h)}</div></div><div class="hero-bars"><div class="bar-label"><span>Vigor</span><span>${fatigue}%</span></div><div class="bar"><i style="width:${fatigue}%;background:${fatigue<35?'#bd7950':'#83a17d'}"></i></div></div><div class="hero-state ${busy?'busy':''}">${mission?'On quest':h.fatigue>=95?'Resting':'Ready'}</div></div>`;}).join('');
  }
  function renderDispatch(){
    const box=$('dispatch-content');const q=state.quests.find(x=>x.id===state.selected);
    if(!q){box.innerHTML='<div class="empty-dispatch"><div><div class="empty-glyph">⚑</div><h3>Pick a contract</h3><p>Select a request from the notice board to put together your expedition.</p></div></div>';return;}
    const elig=state.crew.filter(usable);const result=questChance(q,state.party);const cls=result.chance<50?'low':result.chance<72?'mid':'';
    box.innerHTML=`<div class="selected-contract"><div class="selected-contract-head"><div class="quest-art">${q.icon}</div><div><h3>${logSafe(q.title)}</h3><small>${logSafe(q.place)} · ${q.days} day${q.days>1?'s':''}</small></div></div><p class="contract-description">${logSafe(q.desc)}</p><div class="risk-row"><span>Risk</span><span class="risk-dots">${[1,2,3].map(i=>`<i class="${i<=q.risk?'on':''}"></i>`).join('')}</span><span>${q.risk===1?'Manageable':q.risk===2?'Uncertain':'Dangerous'}</span><span class="contract-payout">${q.reward[0]}g+</span></div></div><p class="party-label">CHOOSE YOUR PARTY <span style="font-weight:400;letter-spacing:0">(up to 3)</span></p><div class="party-options">${elig.map(h=>{const a=archetypes[h.kind],yes=state.party.includes(h.id);return `<button class="party-chip ${yes?'selected':''}" data-hero="${h.id}" type="button"><span>${a.icon}</span>${logSafe(h.name)} <small>+${heroPower(h)}</small></button>`;}).join('')||'<span style="font-size:9px;color:#a17654">Everyone is away or needs rest.</span>'}</div><div class="party-summary"><span>Party strength <b class="party-power">${result.power} / ${q.target} suggested</b></span><span class="chance ${cls}">${result.chance}% success</span></div><button class="dispatch-button" id="send-party" ${state.party.length===0||state.missions.length>=missionSlots()?'disabled':''}>${state.missions.length>=missionSlots()?'All expedition slots are full':state.party.length===0?'Select at least one adventurer':'Send expedition · '+state.party.length+' hero'+(state.party.length>1?'es':'')}</button>`;
    box.querySelectorAll('[data-hero]').forEach(btn=>btn.addEventListener('click',()=>toggleHero(btn.dataset.hero)));
    const send=$('send-party');if(send)send.addEventListener('click',dispatch);
  }
  function toggleHero(id){if(state.party.includes(id))state.party=state.party.filter(x=>x!==id);else if(state.party.length<3)state.party.push(id);render();}
  function dispatch(){
    const q=state.quests.find(x=>x.id===state.selected);if(!q||!state.party.length||state.missions.length>=missionSlots())return;
    const heroes=[...state.party];heroes.forEach(id=>{const h=heroById(id);if(h)h.fatigue=clamp(h.fatigue+28+q.risk*5,0,100);});
    state.missions.push({id:'m'+Math.random().toString(36).slice(2,8),quest:q,heroes,daysLeft:q.days,totalDays:q.days});state.quests=state.quests.filter(x=>x.id!==q.id);state.selected=null;state.party=[];
    addLog(`<b>${logSafe(heroById(heroes[0]).name)}</b> and ${heroes.length===1?'themselves':heroes.length-1+' companion'+(heroes.length>2?'s':'')} set out for <b>${logSafe(q.title)}</b>.`,'➜');render();toast('Expedition on the road. Good fortune to them!');
  }
  function renderMissions(){
    const box=$('active-list');if(!state.missions.length){box.innerHTML='<div class="empty-road"><b>Quiet roads today</b>Send an expedition to see your banner out there.</div>';return;}
    box.innerHTML=state.missions.map(m=>{const done=m.totalDays-m.daysLeft;const pct=Math.round(done/m.totalDays*100);return `<div class="active-card"><div class="active-emoji">${m.quest.icon}</div><div class="active-copy"><b>${logSafe(m.quest.title)}</b><small>${m.heroes.map(id=>logSafe(heroById(id)?.name||'Adventurer')).join(', ')}</small></div><div class="progress-track"><i style="width:${pct}%"></i></div><span class="days-left">${m.daysLeft===0?'Returning':m.daysLeft+'d left'}</span></div>`;}).join('');
  }
  function renderLogs(){
    $('log-list').innerHTML=state.logs.map(l=>`<div class="log-entry"><span class="log-mark">${l.mark}</span><span>${l.text}</span><span class="log-time">DAY ${String(l.day).padStart(2,'0')}</span></div>`).join('');
  }
  function resolveMission(m){
    const party=m.heroes.map(heroById).filter(Boolean);const chance=questChance(m.quest,m.heroes).chance;const roll=rand(1,100);const success=roll<=chance;
    if(success){const reward=rand(m.quest.reward[0],m.quest.reward[1]);const bonus=Math.floor(state.hall/2)*5;state.gold+=reward+bonus;state.renown+=m.quest.renown;state.spirit=clamp(state.spirit+rand(3,7),0,100);party.forEach(h=>{h.xp+=m.quest.risk+1;if(h.xp>=h.level*3){h.xp-=h.level*3;h.level++;state.spirit=clamp(state.spirit+2,0,100);addLog(`<b>${logSafe(h.name)}</b> has grown to level ${h.level}!`,'⬆');}});addLog(`<b>${logSafe(m.quest.title)}</b> complete! The party returns with <b>${reward+bonus}g</b> and ${m.quest.renown} renown.`,'✦');toast(`${m.quest.title} complete — ${reward+bonus}g earned!`);
    }else{const consolation=Math.floor(m.quest.reward[0]*.2);state.gold+=consolation;state.spirit=clamp(state.spirit-rand(3,7),0,100);party.forEach(h=>{h.fatigue=clamp(h.fatigue+10,0,100);h.xp+=1;});addLog(`<b>${logSafe(m.quest.title)}</b> went poorly. The party returns with ${consolation}g and a story for the tavern.`,'⚠');toast(`${m.quest.title} failed — your crew made it home.`);}
  }
  function nextDay(){
    state.day++;const upkeep=state.crew.length*2;state.gold-=upkeep;state.spirit=clamp(state.spirit-(state.gold<0?5:1),0,100);state.crew.forEach(h=>{if(!state.missions.some(m=>m.heroes.includes(h.id)))h.fatigue=clamp(h.fatigue-23,0,100);});
    const completed=[];state.missions.forEach(m=>{m.daysLeft--;if(m.daysLeft<=0)completed.push(m);});completed.forEach(m=>{resolveMission(m);state.missions=state.missions.filter(x=>x.id!==m.id);});
    if(state.day-state.lastRefresh>=3){state.quests=makeBoard();state.lastRefresh=state.day;addLog('New contracts have been posted on the notice board.','📜');}
    if(state.day%5===0){const gift=rand(10,25);state.gold+=gift;state.spirit=clamp(state.spirit+4,0,100);addLog(`A grateful neighbor left <b>${gift}g</b> by the guild door. The hearth is warm tonight.`,'♥');}
    if(state.spirit<25&&Math.random()<.25){state.renown=Math.max(0,state.renown-1);addLog('The empty hearth has the village whispering. Guild spirit is low.','♨');}
    if(state.renown>=110&&!state.won){state.won=true;showVictory();}
    render();toast(`Day ${state.day}. ${upkeep}g spent on guild upkeep.`);
  }
  function refreshBoard(){if(state.gold<25){toast('The guild purse needs 25g to post new notices.');return;}state.gold-=25;state.quests=makeBoard();state.lastRefresh=state.day;state.selected=null;addLog('You paid the town crier to find fresh contracts.','↻');render();toast('Fresh contracts posted.');}
  function recruit(){if(state.crew.length>=cap()){toast('The hall is full. Improve it to make room.');return;}if(state.gold<80){toast('You need 80g to welcome a new adventurer.');return;}const available=names.filter(([,k],i)=>true);const [name,kind]=pick(available);const newh=freshHero(name,kind,1);state.gold-=80;state.crew.push(newh);state.hired++;addLog(`<b>${name}</b> the ${archetypes[kind].label.toLowerCase()} joined your fellowship.`,'♟');render();toast(`${name} joined the guild!`);}
  function upgrade(){if(state.hall>=3)return;const cost=state.hall===1?220:400;if(state.gold<cost){toast(`You need ${cost}g for the next guild hall improvement.`);return;}state.gold-=cost;state.hall++;state.spirit=clamp(state.spirit+8,0,100);addLog(`The guild hall is now level ${state.hall}. More adventurers can call it home.`,'⌂');render();toast('The old wayhouse has a new lease on life!');}
  function showModal(html){$('modal-content').innerHTML=html;const d=$('modal');if(!d.open)d.showModal();}
  function showVictory(){showModal(`<div class="modal-hero">🏆</div><p class="eyebrow">A LEGEND TAKES SHAPE</p><h2>The realm knows your name.</h2><p>Your guild has earned <b>Fabled</b> renown. The old wayhouse is full of stories, and every new adventurer knows the road to your door.</p><button class="button button-gold" id="victory-close">Keep building <span>→</span></button>`);$('victory-close').onclick=()=>$('modal').close();}
  function help(){showModal(`<p class="eyebrow">A FIELD GUIDE FOR NEW GUILDMASTERS</p><h2>How to play</h2><p>You're the keeper of a small wayhouse on the edge of a big story. Choose your contracts wisely, look after your fellowship, and make the guild a name worth remembering.</p><div class="help-grid"><div class="help-step"><b>1 · Choose a contract</b><span>Click a notice to see its danger and suggested party strength.</span></div><div class="help-step"><b>2 · Gather your party</b><span>Send up to three ready adventurers. Different heroes bring different talents.</span></div><div class="help-step"><b>3 · End the day</b><span>Expeditions take time. Heroes recover when they're home; upkeep costs 2g per day.</span></div><div class="help-step"><b>4 · Grow your guild</b><span>Earn renown, hire new friends, and improve your hall for more beds and missions.</span></div></div><p>Reach <b>110 renown</b> to become a legend. Your progress saves automatically.</p><button class="button button-gold" id="help-close">Got it <span>→</span></button>`);$('help-close').onclick=()=>$('modal').close();}
  function offerRecruit(){if(state.crew.length>=cap()){toast('The hall is full. Improve it to make room.');return;}if(state.gold<80){toast('You need 80g to welcome a new adventurer.');return;}const [name,kind]=pick(names),a=archetypes[kind];showModal(`<p class="eyebrow">A NEW FACE AT THE DOOR</p><h2>Someone seeks a fellowship.</h2><p>Adventurers come and go through the valley. This one looks ready for a tale of their own.</p><div class="offer-card"><div class="hero-avatar ${a.color}">${a.icon}</div><div><h3>${name}</h3><small>${a.label} · Level 1 · ${a.stat} 4</small><div class="offer-stats"><span>✦ Ready for the road</span><span>◉ Cost: 80g</span></div></div></div><div class="modal-actions"><button class="button button-outline" id="decline-hire">Not now</button><button class="button button-gold" id="accept-hire">Welcome aboard <span>→</span></button></div>`);$('decline-hire').onclick=()=>$('modal').close();$('accept-hire').onclick=()=>{$('modal').close();const n=state.crew.length;state.gold-=80;state.crew.push(freshHero(name,kind));addLog(`<b>${name}</b> the ${a.label.toLowerCase()} joined your fellowship.`,'♟');render();toast(`${name} joined the guild!`);};}
  $('next-day').addEventListener('click',nextDay);$('refresh-board').addEventListener('click',refreshBoard);$('hire-button').addEventListener('click',offerRecruit);$('upgrade-button').addEventListener('click',upgrade);$('help-button').addEventListener('click',help);$('modal-close').addEventListener('click',()=>$('modal').close());
  $('reset-button').addEventListener('click',()=>{showModal('<div class="modal-hero">🕯️</div><p class="eyebrow">A FRESH PAGE</p><h2>Start a new guild?</h2><p>Your current fellowship and progress will be replaced. This cannot be undone.</p><div class="modal-actions"><button class="button button-outline" id="cancel-reset">Keep this guild</button><button class="button button-gold" id="confirm-reset">Begin again <span>→</span></button></div>');$('cancel-reset').onclick=()=>$('modal').close();$('confirm-reset').onclick=()=>{localStorage.removeItem(SAVE_KEY);state=newGame();state.quests=makeBoard();state.lastRefresh=1;state.logs=[];addLog('Welcome to the wayhouse. Your first contracts are waiting.','✦');$('modal').close();render();toast('A new guild is yours to shape.');};});
  let muted=false;$('sound-toggle').addEventListener('click',e=>{muted=!muted;e.currentTarget.textContent=muted?'♪':'♫';toast(muted?'Ambience muted.':'The hall is alive with quiet chatter.');});
  render();
})();

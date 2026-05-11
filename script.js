/* ===========================================================
   DEVOCIONAL — Quiz de Jesus
   Lógica: navegação, animações, áudio, personalização
   =========================================================== */

const SCREENS = [
  'intro','q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12','reveal','result'
];
const QUESTION_SCREENS = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12'];

const state = {
  current: 'intro',
  name: '',
  wish: '',
  answers: {},
  soundOn: true,
};

const stage = document.getElementById('stage');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const soundBtn = document.getElementById('soundToggle');

/* ============== PARTÍCULAS DOURADAS ================== */
function spawnSparkles(count = 18){
  const wrap = document.querySelector('.sparkles');
  for (let i = 0; i < count; i++){
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDuration = (8 + Math.random() * 10) + 's';
    s.style.animationDelay = (-Math.random() * 12) + 's';
    s.style.transform = `scale(${.5 + Math.random() * 1.2})`;
    wrap.appendChild(s);
  }
}
spawnSparkles();

/* ============== SOM (sino sutil via Web Audio) ================== */
let audioCtx = null;
function chime(){
  if (!state.soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    [880, 1320, 1760].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.06, now + i * 0.04 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 1.0);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 1.05);
    });
  } catch(e){ /* silencioso */ }
}

soundBtn.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  soundBtn.classList.toggle('muted', !state.soundOn);
});
// mostrar toggle de som após primeira interação
function revealSoundToggle(){
  soundBtn.style.display = 'flex';
}

/* ============== VIBRAÇÃO ================== */
function vibrate(ms = 12){
  if (navigator.vibrate) navigator.vibrate(ms);
}

/* ============== NAVEGAÇÃO ================== */
function showScreen(name){
  const all = document.querySelectorAll('.screen');
  const next = document.querySelector(`.screen[data-screen="${name}"]`);
  if (!next) return;

  all.forEach(s => {
    if (s === next) return;
    s.classList.remove('in');
    setTimeout(() => s.classList.remove('active'), 350);
  });

  setTimeout(() => {
    next.classList.add('active');
    // forçar reflow para a transição rolar
    void next.offsetWidth;
    requestAnimationFrame(() => next.classList.add('in'));
    state.current = name;
    updateProgress();
    refreshPersonalization();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 280);
}

function nextScreen(){
  const idx = SCREENS.indexOf(state.current);
  const target = SCREENS[idx + 1];
  if (!target) return;

  if (target === 'reveal'){
    showScreen('reveal');
    setTimeout(() => showScreen('result'), 2600);
    return;
  }
  showScreen(target);
}

function updateProgress(){
  const idx = QUESTION_SCREENS.indexOf(state.current);
  if (idx >= 0){
    progressWrap.hidden = false;
    progressFill.style.width = ((idx + 1) / QUESTION_SCREENS.length * 100) + '%';
    progressText.textContent = `${idx + 1} / 12`;
  } else {
    progressWrap.hidden = true;
  }
}

/* ============== PERSONALIZAÇÃO ================== */
const stateLabels = {
  vazio: 'sentem um vazio que precisa ser preenchido pelo amor d\'Ele',
  paz: 'já vivem em paz, mas anseiam por uma intimidade ainda maior com Jesus',
  ferido: 'precisam de cura no coração',
  chamas: 'desejam crescer ainda mais em fé e devoção',
};
function refreshPersonalization(){
  document.querySelectorAll('.lead-name').forEach(el => {
    el.textContent = state.name || '';
  });
  document.querySelectorAll('.lead-wish, .lead-wish-quote').forEach(el => {
    el.textContent = state.wish ? `"${state.wish}"` : 'realizar o pedido do seu coração';
  });
  const stateEl = document.querySelector('.lead-state');
  if (stateEl){
    stateEl.textContent = stateLabels[state.answers.estado] || 'buscam a presença de Jesus';
  }
}

/* ============== HANDLERS ================== */
document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]');
  if (!action) return;

  const type = action.dataset.action;
  vibrate();
  chime();
  revealSoundToggle();

  if (type === 'next'){
    nextScreen();
  }
  else if (type === 'submit-name'){
    const input = document.getElementById('nameInput');
    const v = (input.value || '').trim();
    if (!v){
      input.focus();
      input.style.borderColor = '#C97A6E';
      setTimeout(() => input.style.borderColor = '', 1200);
      return;
    }
    state.name = v.split(' ')[0]
      .replace(/\b\w/g, c => c.toUpperCase());
    nextScreen();
  }
  else if (type === 'submit-wish'){
    const input = document.getElementById('wishInput');
    const v = (input.value || '').trim();
    if (!v){
      input.focus();
      input.style.borderColor = '#C97A6E';
      setTimeout(() => input.style.borderColor = '', 1200);
      return;
    }
    state.wish = v;
    nextScreen();
  }
});

/* Opções de múltipla escolha */
document.querySelectorAll('.options').forEach(group => {
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('.option');
    if (!btn) return;
    const key = group.dataset.key;
    const value = btn.dataset.value;

    state.answers[key] = value;
    group.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    btn.classList.add('selected');

    vibrate(15);
    chime();
    revealSoundToggle();

    // Avança automaticamente após pequena pausa para o usuário sentir o feedback
    setTimeout(nextScreen, 480);
  });
});

/* Enter avança nos campos de texto */
const nameInputEl = document.getElementById('nameInput');
if (nameInputEl) {
  nameInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter'){
      e.preventDefault();
      document.querySelector('[data-action="submit-name"]').click();
    }
  });
}

/* ============== PLAYER ESTILO WHATSAPP ================== */
const wave    = document.getElementById('waWave');
const audio   = document.getElementById('waAudio');
const playBtn = document.getElementById('waPlay');
const timeEl  = document.getElementById('waTime');
const iconPlay  = playBtn ? playBtn.querySelector('.wa-icon-play')  : null;
const iconPause = playBtn ? playBtn.querySelector('.wa-icon-pause') : null;

const BAR_COUNT = 38;
const bars = [];
for (let i = 0; i < BAR_COUNT; i++){
  const b = document.createElement('span');
  b.className = 'wa-bar';
  // alturas variadas para simular waveform
  const h = 8 + Math.abs(Math.sin(i * 0.6)) * 24 + Math.random() * 8;
  b.style.height = h + 'px';
  wave.appendChild(b);
  bars.push(b);
}

function fmt(s){
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2,'0')}`;
}

audio.addEventListener('loadedmetadata', () => {
  timeEl.textContent = fmt(audio.duration || 0);
});
audio.addEventListener('timeupdate', () => {
  const dur = audio.duration || 0;
  const pct = dur ? audio.currentTime / dur : 0;
  bars.forEach((b, i) => b.classList.toggle('played', i / BAR_COUNT < pct));
  timeEl.textContent = fmt(dur - audio.currentTime);
});
audio.addEventListener('ended', () => {
  iconPlay.hidden = false; iconPause.hidden = true;
  bars.forEach(b => b.classList.remove('played'));
});

playBtn.addEventListener('click', () => {
  vibrate();
  if (audio.paused){
    const p = audio.play();
    if (p && p.catch) p.catch(() => {
      // Sem fonte de áudio: ainda assim simulamos progresso visual
      simulatePlayback();
    });
    iconPlay.hidden = true; iconPause.hidden = false;
  } else {
    audio.pause();
    iconPlay.hidden = false; iconPause.hidden = true;
  }
});

wave.addEventListener('click', (e) => {
  const rect = wave.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  if (audio.duration){
    audio.currentTime = audio.duration * pct;
  }
});

/* fallback se áudio não carregar (sem arquivo) */
let simInt = null;
function simulatePlayback(){
  if (simInt) return;
  let t = 0; const total = 47;
  timeEl.textContent = fmt(total);
  iconPlay.hidden = true; iconPause.hidden = false;
  simInt = setInterval(() => {
    t++;
    const pct = t / total;
    bars.forEach((b, i) => b.classList.toggle('played', i / BAR_COUNT < pct));
    timeEl.textContent = fmt(total - t);
    if (t >= total){
      clearInterval(simInt); simInt = null;
      iconPlay.hidden = false; iconPause.hidden = true;
      bars.forEach(b => b.classList.remove('played'));
    }
  }, 1000);
}

/* ============== CTA FINAL ================== */
document.getElementById('ctaButton').addEventListener('click', (e) => {
  e.preventDefault();
  vibrate(30);
  chime();
  const params = new URLSearchParams({
    nome:   state.name            || '',
    desejo: state.wish            || '',
    estado: state.answers.estado  || '',
  });
  setTimeout(() => {
    window.location.href = 'venda.html?' + params.toString();
  }, 160);
});

/* ============== INICIALIZAÇÃO ================== */
function init(){
  // ativa a tela inicial com transição
  const intro = document.querySelector('.screen[data-screen="intro"]');
  intro.classList.add('active');
  requestAnimationFrame(() => intro.classList.add('in'));
}
init();

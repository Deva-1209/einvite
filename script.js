/* ---------- FLOATING GOLD DUST BACKGROUND ---------- */
(function(){
  const container = document.getElementById('floatingParticles');
  if (!container) return;
  const COUNT = window.innerWidth < 640 ? 26 : 42;
  for (let i = 0; i < COUNT; i++){
    const dust = document.createElement('div');
    dust.className = 'dust';
    const size = 2 + Math.random() * 4;               // 2px - 6px
    const left = Math.random() * 100;                  // 0% - 100%
    const drift = (Math.random() * 60 - 30).toFixed(0); // -30px to 30px sideways drift
    const duration = 10 + Math.random() * 14;           // 10s - 24s to float up
    const delay = Math.random() * duration;             // stagger start times
    dust.style.width = size + 'px';
    dust.style.height = size + 'px';
    dust.style.left = left + '%';
    dust.style.setProperty('--drift', drift + 'px');
    dust.style.animationDuration = duration + 's';
    dust.style.animationDelay = '-' + delay + 's'; // negative delay = already mid-animation on load
    container.appendChild(dust);
  }
})();

/* ---------- BACKGROUND MUSIC ---------- */
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
bgMusic.volume = 0.5;

// --- Trim to a specific part of the song ---
// Set the timestamps (in seconds) of the section you want to play.
// Example: to play only from 1:05 to 1:40, use MUSIC_START = 65, MUSIC_END = 100.
// Leave MUSIC_END as null to just play from MUSIC_START to the end of the file.
const MUSIC_START = 0;      // <-- change this (seconds)
const MUSIC_END = null;     // <-- change this (seconds), or leave as null

function playMusic(){
  // Jump to the start point the first time playback begins
  if (bgMusic.currentTime < MUSIC_START || (MUSIC_END && bgMusic.currentTime >= MUSIC_END)) {
    bgMusic.currentTime = MUSIC_START;
  }
  bgMusic.play().then(() => {
    musicToggle.classList.add('playing');
    musicToggle.setAttribute('aria-pressed', 'true');
  }).catch(() => {
    // Autoplay blocked or music.mp3 not found — user can tap the button to start it manually
    musicToggle.classList.remove('playing');
  });
}

function pauseMusic(){
  bgMusic.pause();
  musicToggle.classList.remove('playing');
  musicToggle.setAttribute('aria-pressed', 'false');
}

// Loop back to MUSIC_START whenever playback reaches MUSIC_END
bgMusic.addEventListener('timeupdate', () => {
  if (MUSIC_END && bgMusic.currentTime >= MUSIC_END) {
    bgMusic.currentTime = MUSIC_START;
    if (!bgMusic.paused) bgMusic.play();
  }
});

musicToggle.addEventListener('click', () => {
  if (bgMusic.paused) { playMusic(); } else { pauseMusic(); }
});

/* ---------- DOOR OPEN + CONFETTI ---------- */
const doorIntro = document.getElementById('doorIntro');
const openBtn = document.getElementById('openDoorsBtn');

function launchConfetti(){
  const colors = ['#B8895A','#D8B48C','#8B4B5C','#F3E1DD','#5C2A38'];
  for(let i=0;i<60;i++){
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random()*100 + 'vw';
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    const duration = 2.2 + Math.random()*1.6;
    el.style.animationDuration = duration + 's';
    el.style.animationDelay = (Math.random()*0.4) + 's';
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), (duration+0.4)*1000);
  }
}

openBtn.addEventListener('click', () => {
  doorIntro.classList.add('open');
  launchConfetti();
  playMusic();
  document.body.classList.remove('locked');
  setTimeout(() => { doorIntro.classList.add('hidden'); }, 1500);
});

/* ---------- SCRATCH CARD ---------- */
const canvas = document.getElementById('scratchCanvas');
const ctx = canvas.getContext('2d');
let scratching = false;
let scratchedPct = 0;

function sizeCanvas(){
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  drawScratchSurface();
}

function drawScratchSurface(){
  const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
  g.addColorStop(0,'#D8B48C');
  g.addColorStop(0.5,'#B8895A');
  g.addColorStop(1,'#D8B48C');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for(let i=0;i<40;i++){
    ctx.beginPath();
    ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*1.5, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle = '#5C2A38';
  ctx.font = '13px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCRATCH HERE', canvas.width/2, canvas.height/2);
}

function getPos(e){
  const rect = canvas.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  return { x: point.clientX - rect.left, y: point.clientY - rect.top };
}

function scratch(e){
  e.preventDefault();
  const pos = getPos(e);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 24, 0, Math.PI*2);
  ctx.fill();
}

let birdsLaunched = false;
function checkClear(){
  const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let transparent = 0;
  for(let i=3;i<data.length;i+=4*20){ if(data[i]===0) transparent++; }
  const pct = transparent / (data.length/(4*20));
  if(pct > 0.55){
    canvas.style.transition = 'opacity .6s ease';
    canvas.style.opacity = '0';
    setTimeout(()=> canvas.style.display='none', 600);
    if(!birdsLaunched){
      birdsLaunched = true;
      launchBirds();
    }
  }
}

/* ---------- FLYING BIRDS (on scratch reveal) ---------- */
const BIRD_SVG = `<svg viewBox="0 0 60 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 12 C 10 -4, 20 -4, 30 8 C 40 -4, 50 -4, 60 12 C 50 6, 40 6, 30 14 C 20 6, 10 6, 0 12 Z"
    fill="var(--gold-light)"/>
</svg>`;

function launchBirds(){
  const colors = ['var(--gold-light)', 'var(--gold)', 'var(--ivory)'];
  const count = window.innerWidth < 640 ? 7 : 11;
  for (let i = 0; i < count; i++){
    const bird = document.createElement('div');
    bird.className = 'bird-fly';
    bird.innerHTML = BIRD_SVG;

    const size = 18 + Math.random() * 22;              // 18px - 40px wingspan
    const startX = 10 + Math.random() * 80;             // 10% - 90% across viewport
    const midX = (Math.random() * 50 - 25).toFixed(0);  // drift left/right as they climb
    const endX = (parseFloat(midX) + (Math.random() * 40 - 20)).toFixed(0);
    const tilt = (Math.random() * 16 - 8).toFixed(1);
    const duration = 3.4 + Math.random() * 2.2;
    const delay = Math.random() * 1.2;
    const fillColor = colors[Math.floor(Math.random() * colors.length)];

    bird.style.left = startX + '%';
    bird.style.width = size + 'px';
    bird.style.height = (size * 0.4) + 'px';
    bird.style.setProperty('--midx', midX + 'vw');
    bird.style.setProperty('--endx', endX + 'vw');
    bird.style.setProperty('--tilt', tilt + 'deg');
    bird.style.animationDuration = duration + 's';
    bird.style.animationDelay = delay + 's';
    bird.querySelector('svg path').setAttribute('fill', fillColor);
    bird.querySelector('svg').style.animationDuration = (0.35 + Math.random() * 0.25) + 's';

    document.body.appendChild(bird);
    setTimeout(() => bird.remove(), (duration + delay + 0.5) * 1000);
  }
}

canvas.addEventListener('mousedown', e => { scratching = true; scratch(e); });
canvas.addEventListener('mousemove', e => { if(scratching){ scratch(e); checkClear(); } });
window.addEventListener('mouseup', () => scratching = false);
canvas.addEventListener('touchstart', e => { scratching = true; scratch(e); }, {passive:false});
canvas.addEventListener('touchmove', e => { if(scratching){ scratch(e); checkClear(); } }, {passive:false});
canvas.addEventListener('touchend', () => scratching = false);

window.addEventListener('resize', sizeCanvas);
sizeCanvas();

/* ---------- SCROLL REVEAL ---------- */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

/* ---------- GOLDEN SPARKLE SHIMMER ---------- */
function addSparkles(container, count){
  for (let i = 0; i < count; i++){
    const s = document.createElement('div');
    s.className = 'sparkle';
    const size = 2 + Math.random() * 3;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 3) + 's';
    s.style.animationDuration = (2.2 + Math.random() * 2) + 's';
    container.appendChild(s);
  }
}

document.querySelectorAll('.hero, .couple-section').forEach(el => {
  addSparkles(el, el.classList.contains('hero') ? 22 : 14);
});

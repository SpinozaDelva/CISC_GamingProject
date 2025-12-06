// ===== WHACK-A-FACULTY GAME =====
// CISC 3140 - Large Application Development

document.addEventListener("DOMContentLoaded", () => {

  // ===== DOM ELEMENTS =====
  const gameBoard = document.getElementById("game-board");
  const startBtn = document.getElementById("startButton");
  const playAgainBtn = document.getElementById("playAgainButton");
  const timerEl = document.getElementById("timerValue");
  const scoreEl = document.getElementById("scoreValue");
  const gameOverScreen = document.getElementById("game-over");
  const finalScoreEl = document.getElementById("finalScore");
  const hammer = document.getElementById("hammer");

  // ===== HAMMER CURSOR =====
  const HAMMER_READY = "assets/HammerReady.png";
  const HAMMER_HIT = "assets/HammerHit.png";

  // ===== CREATE MUSIC AND SOUND EFFECTS OBJECTS =====
  const music = new Audio('assets/sound/bg_music.mp3');
  const sfxHammerSwing = new Audio('assets/sound/hammer_swing.mp3');
  const sfxPop = new Audio('assets/sound/pop.mp3');

  // Move hammer with mouse over game board
  gameBoard.addEventListener("mousemove", (e) => {
    hammer.style.display = "block";
    hammer.style.left = e.pageX + "px";
    hammer.style.top = e.pageY + "px";
  });

  // Hide hammer when leaving game board
  gameBoard.addEventListener("mouseleave", () => {
    hammer.style.display = "none";
  });

  // Show hammer when entering game board
  gameBoard.addEventListener("mouseenter", () => {
    hammer.style.display = "block";
    hammer.src = HAMMER_READY;
  });

  // Hammer swing animation on click
  gameBoard.addEventListener("mousedown", () => {
    hammer.src = HAMMER_HIT;
    hammer.classList.add("hit");
  });

  gameBoard.addEventListener("mouseup", () => {
    hammer.src = HAMMER_READY;
    hammer.classList.remove("hit");
  });

  // ===== GAME CONFIGURATION - SLOWER TIMING =====
  const GAME_DURATION = 60;           // seconds
  const MIN_POP_TIME = 1500;          // minimum time faculty stays up (ms) - SLOWER
  const MAX_POP_TIME = 2500;          // maximum time faculty stays up (ms) - SLOWER
  const MIN_SPAWN_DELAY = 800;        // minimum delay between spawns (ms) - SLOWER
  const MAX_SPAWN_DELAY = 1800;       // maximum delay between spawns (ms) - SLOWER
  const BONKED_DISPLAY_TIME = 600;    // how long bonked state shows (ms)
  const NUM_HOLES = 9;                // 3x3 grid

  // Faculty image files (normal and bonked states)
  const facultyImages = [
    { normal: "assets/T1_NORMAL.png", bonked: "assets/T1_BONKED.png" },
    { normal: "assets/T2_NORMAL.png", bonked: "assets/T2_BONKED.png" },
    { normal: "assets/T3_NORMAL.png", bonked: "assets/T3_BONKED.png" },
    { normal: "assets/T4_NORMAL.png", bonked: "assets/T4_BONKED.png" },
    { normal: "assets/T5_NORMAL.png", bonked: "assets/T5_BONKED.png" },
    { normal: "assets/T6_NORMAL.png", bonked: "assets/T6_BONKED.png" },
    { normal: "assets/T7_NORMAL.png", bonked: "assets/T7_BONKED.png" },
    { normal: "assets/T8_NORMAL.png", bonked: "assets/T8_BONKED.png" },
    { normal: "assets/T9_NORMAL.png", bonked: "assets/T9_BONKED.png" }
  ];

  // ===== GAME STATE =====
  let timeLeft = GAME_DURATION;
  let score = 0;
  let totalFaculty = 0; 
  let timerId = null;
  let spawnerId = null;
  let isGameRunning = false;
  let holes = [];
  let activeHoles = new Set();

  // ===== INITIALIZE GAME BOARD =====
  function createGameBoard() {
    gameBoard.innerHTML = "";
    holes = [];
    
    for (let i = 0; i < NUM_HOLES; i++) {
      const hole = document.createElement("div");
      hole.className = "hole";
      hole.dataset.index = i;

      const faculty = document.createElement("div");
      faculty.className = "faculty";
      faculty.dataset.index = i;
      
      hole.appendChild(faculty);
      gameBoard.appendChild(hole);
      holes.push({ hole, faculty, isActive: false, isBonked: false });
    }
  }

  // ===== BLOOD SPLATTER EFFECT =====
  function createBloodSplatter(holeElement) {
    // Main blood splat
    const blood = document.createElement("div");
    blood.className = "blood";
    holeElement.appendChild(blood);

    // Create blood drops
    for (let i = 0; i < 5; i++) {
      const drop = document.createElement("div");
      drop.className = "blood-drop";
      drop.style.left = (40 + Math.random() * 120) + "px";
      drop.style.top = (30 + Math.random() * 60) + "px";
      drop.style.animationDelay = (Math.random() * 0.2) + "s";
      holeElement.appendChild(drop);
    }

    // Remove blood elements after animation
    setTimeout(() => {
      const bloods = holeElement.querySelectorAll(".blood, .blood-drop");
      bloods.forEach(b => b.remove());
    }, 1000);
  }

  // ===== RANDOM HELPER FUNCTIONS =====
  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getRandomFaculty() {
    return facultyImages[Math.floor(Math.random() * facultyImages.length)];
  }

  function getRandomHoleIndex() {
    const availableHoles = [];
    for (let i = 0; i < NUM_HOLES; i++) {
      if (!activeHoles.has(i)) {
        availableHoles.push(i);
      }
    }
    if (availableHoles.length === 0) return -1;
    return availableHoles[Math.floor(Math.random() * availableHoles.length)];
  }

  // ===== FACULTY POP UP/DOWN =====
  function popUpFaculty() {
    if (!isGameRunning) return;

    const holeIndex = getRandomHoleIndex();
    if (holeIndex === -1) {
      scheduleNextSpawn();
      return;
    }

    const holeData = holes[holeIndex];
    const facultyImg = getRandomFaculty();

    // Set the faculty image and mark as active
    holeData.faculty.style.backgroundImage = `url('${facultyImg.normal}')`;
    holeData.faculty.dataset.normalImg = facultyImg.normal;
    holeData.faculty.dataset.bonkedImg = facultyImg.bonked;
    holeData.isActive = true;
    holeData.isBonked = false;
    activeHoles.add(holeIndex);

    // Count this appearance
    totalFaculty++;                                     
    scoreEl.textContent = `${score}/${totalFaculty}`;  

    // Show faculty (pop up)
    holeData.faculty.classList.add("show");

    // Schedule hiding (pop down) after random time
    const popTime = randomBetween(MIN_POP_TIME, MAX_POP_TIME);
    setTimeout(() => {
      hideFaculty(holeIndex);
    }, popTime);

    // Schedule next spawn
    scheduleNextSpawn();
  }

  function hideFaculty(holeIndex) {
    const holeData = holes[holeIndex];
    
    if (!holeData.isBonked) {
      holeData.faculty.classList.remove("show");
    }
    
    holeData.isActive = false;
    activeHoles.delete(holeIndex);
  }

  function scheduleNextSpawn() {
    if (!isGameRunning) return;
    
    const delay = randomBetween(MIN_SPAWN_DELAY, MAX_SPAWN_DELAY);
    spawnerId = setTimeout(popUpFaculty, delay);
  }

  // ===== HIT DETECTION =====
  function handleWhack(event) {
    if (!isGameRunning) return;

    // Play sound effect: hammer swing
    playSoundHammerSwing();

    const facultyEl = event.target;
    if (!facultyEl.classList.contains("faculty")) return;
    
    const holeIndex = parseInt(facultyEl.dataset.index);
    const holeData = holes[holeIndex];

    // Check if faculty is showing and not already bonked
    if (!holeData.isActive || holeData.isBonked) return;

    // HIT! Increment score  
    score++;
    scoreEl.textContent = `${score}/${totalFaculty}`;

    // Show bonked state
    holeData.isBonked = true;
    facultyEl.style.backgroundImage = `url('${facultyEl.dataset.bonkedImg}')`;
    facultyEl.classList.add("bonked");

    // Create blood splatter effect!
    createBloodSplatter(holeData.hole);

    // Play sound effect: pop!
    playSoundPop();

    // Hide after bonked animation
    setTimeout(() => {
      facultyEl.classList.remove("show", "bonked");
      holeData.isActive = false;
      holeData.isBonked = false;
      activeHoles.delete(holeIndex);
    }, BONKED_DISPLAY_TIME);
  }

  // ===== TIMER =====
  function startTimer() {
    timerId = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  // ===== GAME FLOW =====
  function startGame() {
    // Reset state
    timeLeft = GAME_DURATION;
    score = 0;
    totalFaculty = 0; 

    isGameRunning = true;
    activeHoles.clear();

    // Update display
    timerEl.textContent = timeLeft;

    //0/0 at start
    scoreEl.textContent = `${score}/${totalFaculty}`;

    // Hide/show buttons
    startBtn.style.display = "none";
    playAgainBtn.style.display = "none";
    gameOverScreen.style.display = "none";

    // Create fresh game board
    createGameBoard();

    // Add click listener for whacking
    gameBoard.addEventListener("click", handleWhack);

    // Start timer and spawning
    startTimer();

    // Start playing music
    playMusic();
    
    // Start spawning faculty after short delay
    setTimeout(() => {
      popUpFaculty();
    }, 500);
  }

  function endGame() {
    isGameRunning = false;

    // Stop timers
    clearInterval(timerId);
    clearTimeout(spawnerId);
    timerId = null;
    spawnerId = null;

    // Show game over screen
    finalScoreEl.textContent = `${score}/${totalFaculty}`;
    gameOverScreen.style.display = "block";
    playAgainBtn.style.display = "inline-block";

    // Stop playing music
    stopMusic();

    // Remove click listener
    gameBoard.removeEventListener("click", handleWhack);
  }

  function resetGame() {
    clearInterval(timerId);
    clearTimeout(spawnerId);
    
    timerEl.textContent = GAME_DURATION;
    scoreEl.textContent = 0;
    
    startBtn.style.display = "inline-block";
    playAgainBtn.style.display = "none";
    gameOverScreen.style.display = "none";

    gameBoard.innerHTML = "";
  }

  // ===== MUSIC AND SOUND EFFECTS =====
  function playMusic() {
    // Loop
    music.loop = true;
    
    // Set volume lower so that other sound effects can be heard better
    music.volume = 0.2;   
    
    // Play music
    music.play();         
  }

  function stopMusic() {
    // Stop music
    music.pause();

    // Reset to beginning for next time
    music.currentTime = 0;
  }

  function playSoundHammerSwing() {
    sfxHammerSwing.play();
  }

  function playSoundPop() {
    sfxPop.play();
  }

  // ===== EVENT LISTENERS =====
  startBtn.addEventListener("click", startGame);
  
  playAgainBtn.addEventListener("click", () => {
    gameOverScreen.style.display = "none";
    startGame();
  });

  // ===== INITIAL SETUP =====
  createGameBoard();

});

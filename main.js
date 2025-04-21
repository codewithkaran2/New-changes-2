// main.js

// Utility function to load a script dynamically with error handling.
function loadScript(url, callback) {
  const script = document.createElement("script");
  script.src = url;
  script.defer = true;
  script.onload = () => callback();
  script.onerror = () => {
    console.error(`Failed to load script: ${url}`);
  };
  document.body.appendChild(script);
}

// Global variable to store the selected game mode. Default is "duo".
let gameMode = "duo";

// Cache DOM elements for reuse.
const nameContainer = document.getElementById("nameContainer");
const p1NameInput = document.getElementById("p1Name");
const p2NameInput = document.getElementById("p2Name");
const startButton = document.getElementById("startButton");
const p2ControlBox = document.getElementById("p2ControlBox");
const modeBoxes = document.querySelectorAll(".modeBox");  // New: Game mode boxes

// Function to add a pulsing animation to the start button.
function animateStartButton() {
  if (startButton) {
    startButton.classList.add("animate-button");
  }
}

// Functions to select game mode with glowing effect:
function selectDuoMode() {
  gameMode = "duo";
  // Show both name inputs and control boxes for Duo Mode.
  if (nameContainer) {
    nameContainer.style.display = "block";
  }
  if (p1NameInput) {
    p1NameInput.placeholder = "Enter 🟦 Player 1 Name";
  }
  if (p2NameInput) {
    p2NameInput.style.display = "inline-block";
    p2NameInput.placeholder = "Enter 🟥 Player 2 Name";
  }
  if (p2ControlBox) {
    p2ControlBox.style.display = "block";
  }
  animateStartButton();
  highlightSelectedMode("duo");  // New: Highlight Duo Mode box
}

function selectSurvivalMode() {
  gameMode = "survival";
  // Show only one name input for Survival Mode.
  if (nameContainer) {
    nameContainer.style.display = "block";
  }
  if (p1NameInput) {
    p1NameInput.placeholder = "Enter Your Name";
  }
  if (p2NameInput) {
    p2NameInput.style.display = "none";
  }
  // Hide the second control box.
  if (p2ControlBox) {
    p2ControlBox.style.display = "none";
  }
  animateStartButton();
  highlightSelectedMode("survival");  // New: Highlight Survival Mode box
}

// New: Function to highlight selected game mode
function highlightSelectedMode(mode) {
  modeBoxes.forEach(box => {
    if (box.id === mode + "ModeBox") {
      box.classList.add("highlight-glow");
    } else {
      box.classList.remove("highlight-glow");
    }
  });
}

// Start game function that loads the appropriate script based on the selected game mode.
function startGame() {
  // Hide the start screen overlay.
  const startScreen = document.getElementById("startScreen");
  if (startScreen) startScreen.classList.add("hidden");

  animateStartButton();

  if (gameMode === "survival") {
    // Update the player control title if a name was provided.
    const playerName = p1NameInput.value.trim();
    if (playerName !== "") {
      const p1ControlTitle = document.getElementById("p1ControlTitle");
      if (p1ControlTitle) {
        p1ControlTitle.innerText = playerName + " 🎮:";
      }
    }
    // Dynamically load survivalMode.js
    loadScript("survivalMode.js", () => {
      if (typeof survivalStartGame === "function") {
        survivalStartGame();
      } else {
        console.error("Function survivalStartGame not found.");
      }
    });
  } else if (gameMode === "duo") {
    // Update player control titles if names were provided.
    const player1Name = p1NameInput.value.trim();
    const player2Name = p2NameInput.value.trim();
    const p1ControlTitle = document.getElementById("p1ControlTitle");
    if (player1Name !== "" && p1ControlTitle) {
      p1ControlTitle.innerText = player1Name + " 🎮:";
    }
    const p2ControlTitle = document.getElementById("p2ControlBox").querySelector("h3");
    if (player2Name !== "" && p2ControlTitle) {
      p2ControlTitle.innerText = player2Name + " 🎮:";
    }
    // Dynamically load duoMode.js
    loadScript("duoMode.js", () => {
      if (typeof duoStartGame === "function") {
        duoStartGame();
      } else {
        console.error("Function duoStartGame not found.");
      }
    });
  } else {
    console.error("Unknown game mode: " + gameMode);
  }
}

// Expose functions globally for HTML to access.
window.selectDuoMode = selectDuoMode;
window.selectSurvivalMode = selectSurvivalMode;
window.startGame = startGame;

// -- Fullscreen toggle --
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}
window.toggleFullScreen = toggleFullScreen;

// -- Feedback button open function --
function openFeedback() {
  window.open(
    'https://docs.google.com/forms/d/e/1FAIpQLSeAoFZsKul8s3ri1X4Dk6igH8n2kC3_mv_drBF1xBCmjr_9jw/viewform?usp=dialog',
    '_blank'
  );
}
window.openFeedback = openFeedback;

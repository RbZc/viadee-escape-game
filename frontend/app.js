const STORAGE_KEY = "viadee-escape-game-mvp-state";

const defaultScenario = {
  id: "mvp-security-scenario",
  title: "Data Center Escape",
  startViewId: "lobby",
  views: [
    {
      id: "lobby",
      roomName: "Lobby",
      title: "Lobby",
      description: "You are in the company lobby. Find a way into the server room.",
      hotspots: [
        {
          id: "lobby-drawer",
          label: "Open reception drawer",
          once: true,
          effects: { addItems: ["keycard"] },
          message: "You found a keycard.",
        },
        {
          id: "lobby-office",
          label: "Go to office",
          transitionTo: "office",
          message: "You walk into the office.",
        },
        {
          id: "lobby-server-room",
          label: "Open server room door",
          requiresItems: ["keycard"],
          transitionTo: "server-room",
          message: "The keycard unlocks the door.",
        },
      ],
    },
    {
      id: "office",
      roomName: "Office",
      title: "Office Desk",
      description: "A workstation is still running. Something useful might be nearby.",
      hotspots: [
        {
          id: "office-usb",
          label: "Take USB stick from desk",
          once: true,
          effects: { addItems: ["usb-stick"] },
          message: "You picked up a USB stick.",
        },
        {
          id: "office-lobby",
          label: "Return to lobby",
          transitionTo: "lobby",
        },
      ],
    },
    {
      id: "server-room",
      roomName: "Server Room",
      title: "Server Room",
      description: "Racks are humming. The exit lock is controlled by a terminal.",
      hotspots: [
        {
          id: "server-terminal",
          label: "Plug USB stick into terminal",
          requiresItems: ["usb-stick"],
          once: true,
          effects: { setFlags: ["terminalUnlocked"] },
          message: "Terminal accepted your update. Exit lock disabled.",
        },
        {
          id: "server-lobby",
          label: "Back to lobby",
          transitionTo: "lobby",
        },
        {
          id: "server-exit",
          label: "Open exit gate",
          requiresFlags: ["terminalUnlocked"],
          transitionTo: "exit",
          message: "You escaped successfully.",
        },
      ],
    },
    {
      id: "exit",
      roomName: "Exit",
      title: "Outside",
      description: "Fresh air. You completed the MVP scenario.",
      hotspots: [],
    },
  ],
  items: {
    keycard: { id: "keycard", name: "Keycard" },
    "usb-stick": { id: "usb-stick", name: "USB Stick" },
  },
};

let scenario = structuredClone(defaultScenario);
let gameState = {
  playerName: "",
  currentViewId: scenario.startViewId,
  inventory: [],
  flags: {},
  usedHotspots: {},
};

const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const editorScreen = document.getElementById("editor-screen");
const playerNameInput = document.getElementById("player-name-input");
const playerNameText = document.getElementById("player-name");
const currentRoomText = document.getElementById("current-room");
const currentViewTitle = document.getElementById("current-view-title");
const currentViewDescription = document.getElementById("current-view-description");
const hotspotsList = document.getElementById("hotspots-list");
const inventoryList = document.getElementById("inventory-list");
const eventMessage = document.getElementById("event-message");
const editorMessage = document.getElementById("editor-message");
const scenarioJsonArea = document.getElementById("scenario-json");

const startGameBtn = document.getElementById("start-game-btn");
const resumeGameBtn = document.getElementById("resume-game-btn");
const showGameBtn = document.getElementById("show-game-btn");
const showEditorBtn = document.getElementById("show-editor-btn");
const applyScenarioBtn = document.getElementById("apply-scenario-btn");
const resetScenarioBtn = document.getElementById("reset-scenario-btn");

function getView(viewId) {
  return scenario.views.find((v) => v.id === viewId);
}

function hasAll(items = [], inventory = []) {
  return items.every((item) => inventory.includes(item));
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      gameState,
      scenario,
    }),
  );
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    resumeGameBtn.disabled = true;
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.gameState && parsed?.scenario) {
      gameState = parsed.gameState;
      scenario = parsed.scenario;
      resumeGameBtn.disabled = false;
    }
  } catch (_error) {
    console.warn("Failed to parse saved game state.", _error);
    resumeGameBtn.disabled = true;
  }
}

function showScreen(screenName) {
  homeScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  editorScreen.classList.add("hidden");

  if (screenName === "home") homeScreen.classList.remove("hidden");
  if (screenName === "game") gameScreen.classList.remove("hidden");
  if (screenName === "editor") editorScreen.classList.remove("hidden");
}

function renderInventory() {
  inventoryList.innerHTML = "";
  if (gameState.inventory.length === 0) {
    inventoryList.innerHTML = '<span class="inventory-item">No items</span>';
    return;
  }

  for (const itemId of gameState.inventory) {
    const item = scenario.items[itemId];
    const badge = document.createElement("span");
    badge.className = "inventory-item";
    badge.textContent = item?.name ?? itemId;
    inventoryList.appendChild(badge);
  }
}

function applyHotspot(hotspot) {
  const alreadyUsed = !!gameState.usedHotspots[hotspot.id];
  if (hotspot.once && alreadyUsed) return;

  if (!hasAll(hotspot.requiresItems, gameState.inventory)) {
    eventMessage.textContent = "You are missing required item(s).";
    return;
  }

  const flags = hotspot.requiresFlags ?? [];
  const hasFlags = flags.every((flag) => !!gameState.flags[flag]);
  if (!hasFlags) {
    eventMessage.textContent = "This action is not available yet.";
    return;
  }

  const effects = hotspot.effects ?? {};
  const addItems = effects.addItems ?? [];
  const setFlags = effects.setFlags ?? [];
  const consumesItems = hotspot.consumesItems ?? [];

  if (!hasAll(consumesItems, gameState.inventory)) {
    eventMessage.textContent = "Missing consumable item(s).";
    return;
  }

  for (const itemId of consumesItems) {
    gameState.inventory = gameState.inventory.filter((id) => id !== itemId);
  }

  for (const itemId of addItems) {
    if (!gameState.inventory.includes(itemId)) {
      gameState.inventory.push(itemId);
    }
  }

  for (const flag of setFlags) {
    gameState.flags[flag] = true;
  }

  if (hotspot.once) {
    gameState.usedHotspots[hotspot.id] = true;
  }

  if (hotspot.transitionTo) {
    gameState.currentViewId = hotspot.transitionTo;
  }

  eventMessage.textContent = hotspot.message ?? "Action completed.";
  saveState();
  renderGame();
}

function renderHotspots(view) {
  hotspotsList.innerHTML = "";
  if (!view.hotspots.length) {
    hotspotsList.innerHTML = "<p>No further actions available.</p>";
    return;
  }

  for (const hotspot of view.hotspots) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hotspot-btn";
    button.textContent = hotspot.label;
    button.addEventListener("click", () => applyHotspot(hotspot));
    hotspotsList.appendChild(button);
  }
}

function renderGame() {
  const view = getView(gameState.currentViewId);
  if (!view) {
    eventMessage.textContent = "Start or resume a game first.";
    showScreen("home");
    return;
  }

  playerNameText.textContent = gameState.playerName || "Player";
  currentRoomText.textContent = view.roomName;
  currentViewTitle.textContent = view.title;
  currentViewDescription.textContent = view.description;

  renderHotspots(view);
  renderInventory();
  scenarioJsonArea.value = JSON.stringify(scenario, null, 2);
}

function startNewGame() {
  const name = playerNameInput.value.trim();
  gameState = {
    playerName: name || "Player",
    currentViewId: scenario.startViewId,
    inventory: [],
    flags: {},
    usedHotspots: {},
  };
  eventMessage.textContent = "Game started.";
  saveState();
  showScreen("game");
  renderGame();
}

function resumeGame() {
  loadState();
  if (!getView(gameState.currentViewId)) {
    showScreen("home");
    eventMessage.textContent = "No valid saved game found.";
    return;
  }
  showScreen("game");
  renderGame();
  eventMessage.textContent = "Loaded saved game.";
}

function openGameScreen() {
  if (!getView(gameState.currentViewId)) {
    showScreen("home");
    eventMessage.textContent = "Start or resume a game first.";
    return;
  }
  showScreen("game");
  renderGame();
}

function applyScenario() {
  try {
    const parsed = JSON.parse(scenarioJsonArea.value);
    if (!parsed?.startViewId || !Array.isArray(parsed?.views) || !parsed?.items) {
      throw new Error("Invalid scenario structure.");
    }

    scenario = parsed;
    gameState.currentViewId = scenario.startViewId;
    gameState.inventory = [];
    gameState.flags = {};
    gameState.usedHotspots = {};
    editorMessage.textContent = "Scenario applied successfully.";
    eventMessage.textContent = "Scenario reset with new data.";
    saveState();
    renderGame();
  } catch (error) {
    editorMessage.textContent = `Could not apply scenario: ${error.message}`;
  }
}

function resetScenario() {
  scenario = structuredClone(defaultScenario);
  scenarioJsonArea.value = JSON.stringify(scenario, null, 2);
  editorMessage.textContent = "Default scenario loaded.";
}

startGameBtn.addEventListener("click", startNewGame);
resumeGameBtn.addEventListener("click", resumeGame);
showGameBtn.addEventListener("click", openGameScreen);
showEditorBtn.addEventListener("click", () => showScreen("editor"));
applyScenarioBtn.addEventListener("click", applyScenario);
resetScenarioBtn.addEventListener("click", resetScenario);

loadState();
scenarioJsonArea.value = JSON.stringify(scenario, null, 2);
showScreen("home");

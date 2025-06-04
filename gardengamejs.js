// --- Game State ---
let coins = 100;
let selectedPlant = null;
let trowelUses = 0;
let harvestAllUses = 0;
let gardenStartTime = Date.now();
let gardenName = "Please choose a name";
let totalCoinsEarned = 0;

const inventory = {
  sunflower: 0, strawberry: 0, blueberry: 0, Tulip: 0, Tomato: 0,
  Potato: 0, Peach: 0, Papaya: 0, Pineapple: 0, grape: 0, apple: 0, pear: 0, orange: 0, blackberry: 0,
  coconut: 0, bamboo: 0,
  fertilizer: 0, wateringCan: 0
};

// --- Bunny Research Center with Stocking System ---
const carrotTypes = [
  { name: "Classic Orange", price: 5000, sell: 2000 },
  { name: "Purple Haze", price: 6000, sell: 2500 },
  { name: "White Satin", price: 7000, sell: 3000 },
  { name: "Atomic Red", price: 8000, sell: 3500 },
  { name: "Yellowstone", price: 9000, sell: 4000 },
  { name: "Cosmic Purple", price: 10000, sell: 4500 },
  { name: "Lunar White", price: 11000, sell: 5000 },
  { name: "Parisian Market", price: 12000, sell: 5500 }
  // ...add more as needed
];

let carrotStock = {};
let carrotRestockTime = 0;
const CARROT_MAX_STOCK = 3;
const CARROT_RESTOCK_INTERVAL = 10 * 60 * 1000; // 10 minutes

function saveCarrotStock() {
  localStorage.setItem("carrot_stock", JSON.stringify(carrotStock));
  localStorage.setItem("carrot_restock_time", carrotRestockTime);
}
function loadCarrotStock() {
  carrotStock = JSON.parse(localStorage.getItem("carrot_stock") || "{}");
  carrotRestockTime = parseInt(localStorage.getItem("carrot_restock_time") || "0", 10);
  carrotTypes.forEach(type => {
    const key = type.name.replace(/[^a-zA-Z0-9]/g, "_");
    if (typeof carrotStock[key] !== "number") carrotStock[key] = CARROT_MAX_STOCK;
  });
}
function restockCarrots(force) {
  const now = Date.now();
  if (force || now >= carrotRestockTime) {
    carrotTypes.forEach(type => {
      const key = type.name.replace(/[^a-zA-Z0-9]/g, "_");
      carrotStock[key] = CARROT_MAX_STOCK;
    });
    carrotRestockTime = now + CARROT_RESTOCK_INTERVAL;
    saveCarrotStock();
  }
}
function getCarrotRestockCountdown() {
  const ms = Math.max(0, carrotRestockTime - Date.now());
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function openCarrotResearch() {
  restockCarrots();
  let html = "<ul style='list-style:none;padding:0;'>";
  carrotTypes.forEach((type, idx) => {
    const key = type.name.replace(/[^a-zA-Z0-9]/g, "_");
    const stock = carrotStock[key];
    html += `<li style="margin-bottom:8px;">
      <b>${type.name}</b> 
      <span style="color:#888;">- ${type.price} coins</span>
      <span style="color:#388e3c;margin-left:8px;">Stock: ${stock}</span>
      <button style="margin-left:10px;padding:2px 10px;font-size:14px;" 
        onclick="buyCarrotType(${idx})" ${stock <= 0 ? "disabled" : ""}>Buy</button>
    </li>`;  
    document.getElementById("closeCarrotResearchBtn").onclick = function() {
  document.getElementById("carrotListDisplay").style.display = "none";

};
  });
  html += "</ul>";
  html += `<div style="margin-top:10px;color:#888;">Restocks in: <span id="carrotRestockTimer">${getCarrotRestockCountdown()}</span></div>`;
  document.getElementById("carrotListDisplay").innerHTML = html;
  document.getElementById("carrotListDisplay").style.display = "block";
  window._carrotTypes = carrotTypes;
  updateCarrotRestockTimer();
}

function buyCarrotType(idx) {
  const carrot = window._carrotTypes[idx];
  const key = carrot.name.replace(/[^a-zA-Z0-9]/g, "_");
  if (carrotStock[key] <= 0) {
    alert("Out of stock! Wait for restock.");
    return;
  }
  if (coins < carrot.price) {
    alert("Not enough coins!");
    return;
  }
  coins -= carrot.price;
  carrotStock[key]--;
  const invKey = "carrot_" + key;
  if (!inventory[invKey]) inventory[invKey] = 0;
  inventory[invKey]++;
  updateUI();
  alert(`You bought a ${carrot.name} carrot seed!`);
  saveCarrotStock();
  updateCarrotInventoryUI();
  openCarrotResearch(); // Refresh UI
}

function updateCarrotInventoryUI() {
  let carrotDiv = document.getElementById("carrotInventory");
  if (!carrotDiv) {
    carrotDiv = document.createElement("div");
    carrotDiv.id = "carrotInventory";
    document.getElementById("inventory").appendChild(carrotDiv);
  }
  let html = "<h3>Carrot Seeds</h3>";
  let found = false;
  for (let key in inventory) {
    if (key.startsWith("carrot_") && inventory[key] > 0) {
      found = true;
      const carrotName = key.replace("carrot_", "").replace(/_/g, " ");
      html += `<div>
        ${carrotName.charAt(0).toUpperCase() + carrotName.slice(1)}: <span>${inventory[key]}</span>
        <button onclick="plantCarrotSeed('${key}')">Plant 🌱</button>
      </div>`;
    }
  }
  if (!found) html += "<div>No carrot seeds yet.</div>";
  carrotDiv.innerHTML = html;
}

function plantCarrotSeed(invKey) {
  if (inventory[invKey] <= 0) return alert("No seeds!");
  inventory[invKey]--;
  const carrotName = invKey.replace("carrot_", "").replace(/_/g, " ");
  const carrot = carrotTypes.find(c => c.name.replace(/[^a-zA-Z0-9]/g, "_") === invKey.replace("carrot_", ""));
  const growTime = 120000; // 2 minutes
  const emoji = "🥕";
  const sellPrice = carrot ? carrot.sell : 2000;

  const plant = document.createElement("div");
  plant.className = "plant";
  plant.dataset.type = invKey;
  plant.dataset.ready = "false";
  plant.dataset.fertilized = "false";
  plant.dataset.regrow = "true";

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  plant.appendChild(tooltip);

  document.getElementById("garden").appendChild(plant);

  let readyAt = Date.now() + growTime;
  const interval = setInterval(() => {
    const left = Math.max(0, Math.floor((readyAt - Date.now()) / 1000));
    tooltip.textContent = left > 0 ? `${left}s remaining` : "Ready!";
  }, 500);

  const grow = () => {
    plant.textContent = emoji;
    plant.classList.add("flower");
    plant.dataset.ready = "true";
    clearInterval(interval);
    updateUI();
  };
  setTimeout(grow, growTime);

  plant.onclick = () => {
    if (plant.dataset.ready === "true") {
      coins += sellPrice;
      alert(`You harvested a ${carrotName} carrot for ${sellPrice} coins!`);
      plant.textContent = "🌱";
      plant.classList.remove("flower", "fertilized");
      plant.dataset.ready = "false";
      let regrowAt = Date.now() + growTime;
      const regrowInterval = setInterval(() => {
        const left = Math.max(0, Math.floor((regrowAt - Date.now()) / 1000));
        tooltip.textContent = left > 0 ? `${left}s remaining` : "Ready!";
      }, 500);
      setTimeout(() => {
        plant.textContent = emoji;
        plant.classList.add("flower");
        plant.dataset.ready = "true";
        clearInterval(regrowInterval);
        updateUI();
      }, growTime);
      updateUI();
      updateCarrotInventoryUI();
    } else {
      alert(`${carrotName} carrot is still growing!`);
    }
  };

  updateCarrotInventoryUI();
  updateUI();
}

function updateCarrotRestockTimer() {
  const timerEl = document.getElementById("carrotRestockTimer");
  if (!timerEl) return;
  timerEl.textContent = getCarrotRestockCountdown();
  if (carrotRestockTime - Date.now() <= 0) {
    restockCarrots(true);
    openCarrotResearch();
  } else {
    setTimeout(updateCarrotRestockTimer, 1000);
  }
}

window.addEventListener("DOMContentLoaded", function() {
  loadCarrotStock();
  restockCarrots();
});
document.getElementById("resetGameBtn").addEventListener("click", function() {
  carrotRestockTime = 0;
  carrotStock = {};
  saveCarrotStock();
});

// --- Plant Definitions ---
const plantData = {
  sunflower: { cost: 10, growTime: 25000, emoji: "🌻", class: "sunflower", sellPrice: 15, regrows: false },
  strawberry: { cost: 50, growTime: 60000, emoji: "🍓", class: "strawberry", sellPrice: 20, regrows: true },
  blueberry: { cost: 400, growTime: 120000, emoji: "🫐", class: "blueberry", sellPrice: 75, regrows: true },
  Tulip: { cost: 600, growTime: 50000, emoji: "🌷", class: "tulip", sellPrice: 750, regrows: false },
  Tomato: { cost: 800, growTime: 240000, emoji: "🍅", class: "tomato", sellPrice: 200, regrows: true },
  Potato: { cost: 1000, growTime: 200000, emoji: "🥔", class: "potato", sellPrice: 350, regrows: true },
  Peach: { cost: 1250, growTime: 100000, emoji: "🍑", class: "peach", sellPrice: 500, regrows: true },
  Papaya: { cost: 1500, growTime: 180000, emoji: "🥭", class: "papaya", sellPrice: 750, regrows: true },
  Pineapple: { cost: 2000, growTime: 220000, emoji: "🍍", class: "pineapple", sellPrice: 900, regrows: true },
  grape: { cost: 2500, growTime: 180000, emoji: "🍇", class: "grape", sellPrice: 1000, regrows: true },
  apple: { cost: 3000, growTime: 200000, emoji: "🍏", class: "apple", sellPrice: 1250, regrows: true },
  pear: { cost: 3500, growTime: 220000, emoji: "🍐", class: "pear", sellPrice: 1500, regrows: true },
  orange: { cost: 4500, growTime: 240000, emoji: "🍊", class: "orange", sellPrice: 1750, regrows: true },
  blackberry: { cost: 5000, growTime: 260000, emoji: "🫐", class: "blackberry", sellPrice: 2000, regrows: true },
  coconut: { cost: 7500, growTime: 300000, emoji: "🥥", class: "coconut", sellPrice: 3500, regrows: false },
  bamboo: { cost: 9000, growTime: 350000, emoji: "🎍", class: "bamboo", sellPrice: 10000, regrows: false }
};

// --- Achievements system ---
const fruitTypes = [
  "sunflower", "strawberry", "blueberry", "Tulip", "Tomato", "Potato", "Peach", "Papaya", "Pineapple",
  "grape", "apple", "pear", "orange", "blackberry", "coconut", "bamboo"
];
let achievements = {};
function saveAchievements() {
  localStorage.setItem("garden_achievements", JSON.stringify(achievements));
}
function loadAchievements() {
  const data = localStorage.getItem("garden_achievements");
  achievements = data ? JSON.parse(data) : {};
}
function unlockAchievement(key) {
  if (!achievements[key]) {
    achievements[key] = true;
    saveAchievements();
    showAchievementsModal();
  }
}
function showAchievementsModal() {
  const list = document.getElementById("achievementsList");
  list.innerHTML = "";
  fruitTypes.forEach(type => {
    const key = "first_" + type;
    const nice = type.charAt(0).toUpperCase() + type.slice(1);
    const unlocked = achievements[key];
    const li = document.createElement("li");
    if (unlocked) {
      li.textContent = `🏆 First ${nice}`;
      li.style.color = "#388e3c";
      li.style.background = "#fff";
    } else {
      li.textContent = "";
      li.style.background = "#222";
      li.style.width = "180px";
      li.style.height = "24px";
      li.style.borderRadius = "8px";
      li.style.margin = "6px 0";
      li.style.display = "inline-block";
    }
    list.appendChild(li);
  });
  document.getElementById("achievementsModal").style.display = "block";
}
document.getElementById("achievementsBtn").onclick = showAchievementsModal;

function checkFirstFruit(type) {
  const key = "first_" + type;
  if (!achievements[key]) {
    unlockAchievement(key);
  }
}
function checkFirstPlant(type) {
  const key = "first_" + type;
  if (!achievements[key]) {
    achievements[key] = true;
    saveAchievements();
  }
}

// --- Mutation Types (higher chance for demo) ---
const mutationTypes = {
  visual: {
    chance: 0.15,
    apply: plant => plant.classList.add("mutated-visual")
  },
  growth: {
    chance: 0.10,
    apply: plant => {
      plant.classList.add("mutated-growth");
      plant.dataset.mutGrowth = "true";
    }
  },
  yield: {
    chance: 0.10,
    apply: plant => {
      plant.classList.add("mutated-yield");
      plant.dataset.mutYield = "true";
    }
  },
  regrowth: {
    chance: 0.08,
    apply: plant => {
      plant.classList.add("mutated-regrow");
      plant.dataset.mutRegrow = "true";
    }
  },
  resistance: {
    chance: 0.08,
    apply: plant => {
      plant.classList.add("mutated-resist");
      plant.dataset.mutResist = "true";
    }
  }
};

// --- Environmental Events ---
const events = {
  solarFlare: { name: "Solar Flare", boost: 0.05, duration: 60000 },
  radiationStorm: { name: "Radiation Storm", boost: 0.07, duration: 60000 },
  chemicalSpill: { name: "Chemical Spill", boost: 0.03, yieldPenalty: 0.5, duration: 60000 },
  pesticideExposure: { name: "Pesticide Exposure", boost: -0.02, fastGrow: true, duration: 60000 },
  geneticDrift: { name: "Genetic Drift", forceMutate: true, duration: 30000 }
};
let activeEvent = null;

function getCurrentBoost() {
  if (!activeEvent) return 0;
  return events[activeEvent].boost || 0;
}
function isEventActive(name) {
  return activeEvent === name;
}
function startEvent(name) {
  const ev = events[name];
  activeEvent = name;
  setTimeout(() => { activeEvent = null; }, ev.duration);
}
function randomEventLoop() {
  const keys = Object.keys(events);
  setInterval(() => {
    if (activeEvent) return;
    if (Math.random() < 0.3) {
      const pick = keys[Math.floor(Math.random() * keys.length)];
      startEvent(pick);
    }
  }, 90000);
}
randomEventLoop();
function applyMutations(plant) {
  // Remove all mutation visuals and data
  plant.classList.remove(
    "mutated-visual",
    "mutated-growth",
    "mutated-yield",
    "mutated-regrow",
    "mutated-resist"
  );
  delete plant.dataset.mutGrowth;
  delete plant.dataset.mutYield;
  delete plant.dataset.mutRegrow;
  delete plant.dataset.mutResist;

  let chosen = "";
  for (const key in mutationTypes) {
    const base = mutationTypes[key].chance;
    let chance = base + getCurrentBoost();
    if (Math.random() < chance || (isEventActive("geneticDrift") && Math.random() < 0.5)) {
      chosen = key;
      break; // Only one mutation per fruit
    }
  }
  if (chosen) {
    mutationTypes[chosen].apply(plant);
    plant.dataset.mutated = chosen;
  } else {
    plant.dataset.mutated = "";
  }
  // Update tooltip
  const tooltip = plant.querySelector('.tooltip');
  if (tooltip) {
    tooltip.textContent = chosen ? `Mutation: ${chosen}` : "";
  }
}

// --- Garden Naming ---
function promptGardenName() {
  let name = "";
  while (!name) {
    name = prompt("Please choose a name for your garden:", gardenName === "Please choose a name" ? "" : gardenName);
    if (name === null) { // User cancelled
      name = gardenName || "My Garden";
      break;
    }
    name = name.trim();
  }
  gardenName = name;
  updateGardenTitle();
  saveGame();
}
function updateGardenTitle() {
  document.getElementById("gardenTitleDisplay").textContent = `🌻 ${gardenName}'s Garden`;
}

// --- UI Helpers ---
function updateUI() {
  document.getElementById('coins').textContent = coins;
  for (let k in inventory) {
    let id = k.charAt(0).toUpperCase() + k.slice(1);
    const el = document.getElementById(k + "Count") || document.getElementById(id + "Count");
    if (el) el.textContent = inventory[k];
  }
  document.getElementById('trowelCount').textContent = trowelUses;
  document.getElementById('harvestAllUses').textContent = "Harvest All Uses: " + harvestAllUses;
  updateCarrotInventoryUI();
}

function toggleGardenInfo() {
  const panel = document.getElementById("gardenInfoPanel");
  if (panel.style.display === "block") {
    panel.style.display = "none";
  } else {
    updateGardenInfo();
    panel.style.display = "block";
  }
}
document.getElementById("gardenTitle").onclick = toggleGardenInfo;

function getPlantCounts() {
  const garden = document.getElementById("garden");
  const plants = Array.from(garden.getElementsByClassName("plant"));
  const counts = {};
  for (let k in plantData) counts[k] = 0;
  plants.forEach(plant => {
    if (counts.hasOwnProperty(plant.dataset.type)) counts[plant.dataset.type]++;
  });
  return counts;
}

function getPlantCountsHTML() {
  const counts = getPlantCounts();
  let html = `<b>In Garden:</b><ul style="margin:0;padding-left:18px;">`;
  for (let k in counts) {
    html += `<li>${k.charAt(0).toUpperCase() + k.slice(1)}: ${counts[k]}</li>`;
  }
  html += `</ul>`;
  return html;
}

function updateGardenInfo() {
  const now = Date.now();
  const elapsed = now - gardenStartTime;
  const seconds = Math.floor((elapsed / 1000) % 60);
  const minutes = Math.floor((elapsed / 1000 / 60) % 60);
  const hours = Math.floor((elapsed / 1000 / 60 / 60));
  document.getElementById("gardenTime").textContent =
    `Time Spent: ${hours}h ${minutes}m ${seconds}s`;
  document.getElementById("totalCoinsEarned").textContent =
    `Total Coins Earned: ${totalCoinsEarned}`;
  document.getElementById("harvestAllUses").textContent = "Harvest All Uses: " + harvestAllUses;
  const counts = getPlantCounts();
  let html = "";
  for (let k in counts) {
    html += `<li>${k.charAt(0).toUpperCase() + k.slice(1)}: ${counts[k]}</li>`;
  }
  document.getElementById("gardenPlantCounts").innerHTML = html;
}

function showPlantInfoPanel(type, sellPrice, growTime, plantEl) {
  const panel = document.getElementById("plantInfoPanel");
  document.getElementById("infoType").textContent = `Type: ${type}`;
  document.getElementById("infoSell").textContent = `Sell Price: ${sellPrice}`;
  document.getElementById("infoTime").textContent = plantEl.textContent === "🌱" ? `Growing` : `Ready to harvest!`;
  document.getElementById("infoPlantCounts").innerHTML = getPlantCountsHTML();
  panel.style.display = "block";

  const trowelBtn = document.getElementById("trowelRemoveBtn");
  if (trowelUses > 0) {
    trowelBtn.style.display = "inline-block";
    trowelBtn.onclick = function() {
      if (selectedPlant && selectedPlant.el) {
        selectedPlant.el.remove();
        trowelUses--;
        saveGame();
        updateUI();
        panel.style.display = "none";
        trowelBtn.style.display = "none";
        selectedPlant = null;
      }
    };
  } else {
    trowelBtn.style.display = "none";
  }
}

document.getElementById("closePlantInfo").onclick = function() {
  document.getElementById("plantInfoPanel").style.display = "none";
  document.getElementById("trowelRemoveBtn").style.display = "none";
  selectedPlant = null;
};

// --- Shop Functions ---
function buySeed(type) {
  const p = plantData[type];
  if (coins >= p.cost) {
    coins -= p.cost;
    inventory[type]++;
    saveGame();
    updateUI();
  }
}
function buyFertilizer() {
  if (coins >= 50) {
    coins -= 50;
    inventory.fertilizer++;
    saveGame();
    updateUI();
  }
}
function buyWateringCan() {
  if (coins >= 150) {
    coins -= 150;
    inventory.wateringCan++;
    saveGame();
    updateUI();
  }
}
function buyTrowel() {
  if (coins >= 200) {
    coins -= 200;
    trowelUses += 5;
    saveGame();
    updateUI();
  }
}
function buyHarvestAll() {
  if (coins >= 500) {
    coins -= 500;
    harvestAllUses++;
    saveGame();
    updateUI();
    updateGardenInfo();
  }
}

// --- Planting ---
function plantSeed(type) {
  if (inventory[type] <= 0) return alert("No seeds!");
  inventory[type]--;
  checkFirstPlant(type); // Unlock achievement on planting
  saveGame();
  updateUI();

  const data = plantData[type];
  const plant = document.createElement("div");
  plant.className = "plant";
  plant.dataset.type = type;
  plant.dataset.ready = "false";
  plant.dataset.fertilized = "false";

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  plant.appendChild(tooltip);

  document.getElementById("garden").appendChild(plant);

  applyMutations(plant);

  let growTime = data.growTime;
  if (plant.dataset.mutGrowth === "true" || isEventActive("pesticideExposure")) {
    growTime *= 0.5;
  }

  let readyAt = Date.now() + growTime;
  const interval = setInterval(() => {
    const left = Math.max(0, Math.floor((readyAt - Date.now()) / 1000));
    tooltip.textContent = left > 0 ? `${left}s remaining` : "Ready!";
  }, 500);

  const grow = () => {
    plant.textContent = data.emoji;
    plant.classList.add("flower", data.class);
    plant.dataset.ready = "true";
    clearInterval(interval);
    saveGame();
    updateUI();
  };
  setTimeout(grow, growTime);

  plant.onclick = () => {
    if (plant.dataset.ready === "true") {
      let bonus = data.sellPrice;
      if (plant.dataset.mutYield === "true") bonus *= 2;
      if (isEventActive("chemicalSpill")) bonus *= (events.chemicalSpill.yieldPenalty || 1);
      coins += Math.floor(bonus);
      totalCoinsEarned += Math.floor(bonus);
      checkFirstFruit(type);
      saveGame();
      updateUI();

      if (data.regrows || plant.dataset.mutRegrow === "true") {
        plant.textContent = "🌱";
        plant.classList.remove(data.class, "flower", "fertilized");
        plant.dataset.ready = "false";
        setTimeout(grow, growTime);
      } else {
        clearInterval(interval);
        plant.remove();
      }
      updateGardenInfo();
    } else {
      selectedPlant = { el: plant, type, growTime: growTime, sell: data.sellPrice };
      showPlantInfoPanel(type, data.sellPrice, growTime, plant);
    }
  };
  updateGardenInfo();
}

// --- Plant Actions ---
function applyFertilizerToInfo() {
  if (!selectedPlant || inventory.fertilizer <= 0) return;
  const plant = selectedPlant.el;
  if (plant.dataset.ready === "true" || plant.dataset.fertilized === "true") return;
  inventory.fertilizer--;
  plant.dataset.fertilized = "true";
  plant.classList.add("fertilized");
  saveGame();
  updateUI();

  const p = plantData[plant.dataset.type];
  const growTime = p.growTime / 2;
  setTimeout(() => {
    plant.textContent = p.emoji;
    plant.classList.add("flower", p.class);
    plant.dataset.ready = "true";
    saveGame();
    updateUI();
  }, growTime);
}

function applyWateringToInfo() {
  if (!selectedPlant || inventory.wateringCan <= 0) return;
  const plant = selectedPlant.el;
  if (plant.dataset.ready === "true") return;
  inventory.wateringCan--;
  plant.textContent = plantData[selectedPlant.type].emoji;
  plant.classList.add("flower", plantData[selectedPlant.type].class);
  plant.dataset.ready = "true";
  saveGame();
  updateUI();
}

function useHarvestAll() {
  if (harvestAllUses <= 0) return;
  const garden = document.getElementById("garden");
  const plants = Array.from(garden.getElementsByClassName("plant"));
  let harvested = 0;
  plants.forEach(plant => {
    const type = plant.dataset.type;
    if (plant.dataset.ready === "true") {
      let val = plantData[type].sellPrice;
      if (plant.dataset.mutYield === "true") val *= 2;
      if (isEventActive("chemicalSpill")) val *= (events.chemicalSpill.yieldPenalty || 1);
      coins += Math.floor(val * 2);
      totalCoinsEarned += Math.floor(val * 2);
      checkFirstFruit(type);
      if (plantData[type].regrows || plant.dataset.mutRegrow === "true") {
        plant.textContent = "🌱";
        plant.classList.remove(plantData[type].class, "flower", "fertilized");
        plant.dataset.ready = "false";
        const growTime = (plant.dataset.mutGrowth === "true" || isEventActive("pesticideExposure"))
          ? plantData[type].growTime / 2
          : plantData[type].growTime;
        setTimeout(() => {
          plant.textContent = plantData[type].emoji;
          plant.classList.add("flower", plantData[type].class);
          plant.dataset.ready = "true";
          saveGame();
        }, growTime);
      } else {
        plant.remove();
      }
      harvested++;
    }
  });
  if (harvested > 0) {
    harvestAllUses--;
    saveGame();
    updateUI();
    updateGardenInfo();
  }
}

document.getElementById("gardenInfoPanel").addEventListener("click", function(e) {
  if (e.target && e.target.textContent && e.target.textContent.includes("Harvest All")) {
    useHarvestAll();
  }
});

// --- Pet Shop (demo logic) ---
function updatePetShop() {
  const pets = [
    { name: "Bunny", emoji: "🐰", price: 1000 },
    { name: "Chick", emoji: "🐣", price: 800 },
    { name: "Hamster", emoji: "🐹", price: 1200 }
  ];
  let html = "";
  pets.forEach(pet => {
    html += `
      <div class="pet-card" onclick="buyPet('${pet.name}',${pet.price})">
        <span class="pet-emoji">${pet.emoji}</span>
        <span class="pet-name">${pet.name}</span>
        <span class="pet-price">${pet.price} coins</span>
      </div>
    `;
  });
  document.getElementById("petEggsDisplay").innerHTML = html;
}
function buyPet(name, price) {
  if (coins < price) {
    alert("Not enough coins!");
    return;
  }
  coins -= price;
  activePetBuff = name;
  petBuffs[name].apply();
  alert(`You bought a ${name}! Buff activated: ${petBuffs[name].desc}`);
  updateUI();
  updatePetBuffDisplay();
}
updatePetShop();
const petBuffs = {
  Bunny: {
    name: "Bunny",
    desc: "🌱 Plants grow 25% faster!",
    apply: () => { window.petBuff = { growMultiplier: 0.75 }; }
  },
  Chick: {
    name: "Chick",
    desc: "💰 +20% coins from harvesting!",
    apply: () => { window.petBuff = { coinMultiplier: 1.2 }; }
  },
  Hamster: {
    name: "Hamster",
    desc: "🛒 Seeds cost 20% less!",
    apply: () => { window.petBuff = { seedDiscount: 0.8 }; }
  }
};
let activePetBuff = null;

// Show active pet buff in UI
function updatePetBuffDisplay() {
  let buffDiv = document.getElementById("petBuffDisplay");
  if (!buffDiv) {
    buffDiv = document.createElement("div");
    buffDiv.id = "petBuffDisplay";
    document.getElementById("petShopBox").appendChild(buffDiv);
  }
  if (activePetBuff) {
    buffDiv.innerHTML = `<b>Active Pet Buff:</b> ${petBuffs[activePetBuff].desc}`;
  } else {
    buffDiv.innerHTML = `<b>No pet buff active.</b>`;
  }
}
updatePetBuffDisplay();

// --- Save/Load ---
function saveGame() {
  const plants = Array.from(document.querySelectorAll(".plant")).map(p => ({
    type: p.dataset.type,
    ready: p.dataset.ready,
    classList: Array.from(p.classList),
    mutated: p.dataset.mutated || "",
    mutGrowth: p.dataset.mutGrowth,
    mutYield: p.dataset.mutYield,
    mutRegrow: p.dataset.mutRegrow,
    mutResist: p.dataset.mutResist,
    fertilized: p.dataset.fertilized
  }));
  localStorage.setItem("garden_game_save", JSON.stringify({
    coins, inventory, trowelUses, harvestAllUses, gardenStartTime, plants, gardenName, totalCoinsEarned
  }));
}
function loadGame() {
  const data = JSON.parse(localStorage.getItem("garden_game_save"));
  if (!data) {
    updateGardenTitle();
    promptGardenName();
    return;
  }
  coins = data.coins;
  Object.assign(inventory, data.inventory);
  trowelUses = data.trowelUses;
  harvestAllUses = data.harvestAllUses;
  gardenStartTime = data.gardenStartTime || Date.now();
  gardenName = data.gardenName || "Please choose a name";
  totalCoinsEarned = data.totalCoinsEarned || 0;
  updateGardenTitle();
  document.getElementById("garden").innerHTML = "";

  (data.plants || []).forEach(p => {
    const plant = document.createElement("div");
    plant.className = "plant";
    plant.dataset.type = p.type;
    plant.dataset.ready = p.ready;
    if (p.mutated) {
      plant.dataset.mutated = p.mutated;
      plant.classList.add("mutated");
    }
    if (p.mutGrowth) plant.dataset.mutGrowth = "true";
    if (p.mutYield) plant.dataset.mutYield = "true";
    if (p.mutRegrow) plant.dataset.mutRegrow = "true";
    if (p.mutResist) plant.dataset.mutResist = "true";
    if (p.fertilized) plant.dataset.fertilized = "true";

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    plant.appendChild(tooltip);

    const emoji = plantData[p.type] ? plantData[p.type].emoji : "🌱";
    if (plant.dataset.ready === "true") {
      plant.textContent = emoji;
      if (plantData[p.type]) plant.classList.add("flower", plantData[p.type].class);
    } else {
      plant.textContent = "🌱";
    }

    plant.onclick = () => {
      if (plant.dataset.ready === "true") {
        let coinsToAdd = plantData[p.type].sellPrice;
        if (plant.dataset.mutYield === "true") coinsToAdd *= 2;
        coins += coinsToAdd;
        totalCoinsEarned += coinsToAdd;
        checkFirstFruit(p.type);
        if (plantData[p.type].regrows || plant.dataset.mutRegrow === "true") {
          plant.textContent = "🌱";
          plant.classList.remove(plantData[p.type].class, "flower", "fertilized");
          plant.dataset.ready = "false";
          setTimeout(() => {
            plant.textContent = emoji;
            plant.classList.add("flower", plantData[p.type].class);
            plant.dataset.ready = "true";
          }, plantData[p.type].growTime);
        } else {
          plant.remove();
        }
        updateUI();
      } else {
        selectedPlant = { el: plant, type: p.type };
        showPlantInfoPanel(p.type, plantData[p.type].sellPrice, plantData[p.type].growTime, plant);
      }
    };

    document.getElementById("garden").appendChild(plant);
  });
  updateUI();
  updateGardenInfo();
}

// --- Reset Button ---
document.getElementById("resetGameBtn").onclick = function () {
  if (confirm("Reset your garden?")) {
    localStorage.removeItem("garden_game_save");
    localStorage.removeItem("garden_achievements");
    coins = 100;
    trowelUses = 0;
    harvestAllUses = 0;
    gardenStartTime = Date.now();
    gardenName = "Please choose a name";
    totalCoinsEarned = 0;
    achievements = {};
    updateGardenTitle();
    Object.assign(inventory, {
      sunflower: 0, strawberry: 0, blueberry: 0, Tulip: 0, Tomato: 0,
      Potato: 0, Peach: 0, Papaya: 0, Pineapple: 0, grape: 0, apple: 0, pear: 0, orange: 0, blackberry: 0,
      coconut: 0, bamboo: 0,
      fertilizer: 0, wateringCan: 0
    });
    document.getElementById("garden").innerHTML = "";
    carrotRestockTime = 0;
    carrotStock = {};
    saveCarrotStock();
    updateUI();
    updateGardenInfo();
    promptGardenName();
  }
};

// --- Startup ---
window.addEventListener("DOMContentLoaded", function() {
  loadAchievements();
  loadGame();
  updateGardenTitle();
  if (!gardenName || gardenName === "Please choose a name" || gardenName === "My Garden") {
    promptGardenName();
  }
});

setInterval(updateGardenInfo, 1000);
updateUI();
updateGardenInfo();
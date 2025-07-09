// === GAME STATE ===
const player = {
  name: "You",
  hp: 30,
  maxHp: 30,
  moves: [
    { name: "Flame Spiral", dmg: 6, type: "Fire" },
    { name: "Arc Shock", dmg: 5, type: "Electric" },
    { name: "Aqua Whip", dmg: 4, type: "Water" }
  ],
  shields: ["Fire", "Water", "Electric"]
};

const enemy = {
  name: "Dark Mage",
  hp: 30,
  maxHp: 30,
  moves: [
    { name: "Sludge Bolt", dmg: 5, type: "Water" },
    { name: "Static Claw", dmg: 4, type: "Electric" },
    { name: "Inferno Breath", dmg: 6, type: "Fire" }
  ],
  shields: ["Fire", "Water", "Electric"]
};

let isPlayerAttacking = true;
let gameState = "player";
let currentEnemyMove = null;

const animations = {
  player: {
    idle: [0, 1],
    attack: [2, 3, 2],
    shield: [2, 3, 2],
  },
  enemy: {
    idle: [4, 3],
    attack: [3, 2, 3],
    shield: [3, 2, 3],
  }
};

window.onload = () => {
  const attackDiv = document.getElementById("attack-buttons");
  const shieldDiv = document.getElementById("shield-buttons");

  player.moves.forEach(move => {
    const btn = document.createElement("button");
    btn.textContent = `${move.name} (${move.type})`;
    btn.onclick = () => playerAttack(move);
    attackDiv.appendChild(btn);
  });

  player.shields.forEach(type => {
    const btn = document.createElement("button");
    btn.textContent = `${type} Shield`;
    btn.onclick = () => playerDefend(type);
    shieldDiv.appendChild(btn);
  });

  startIdleAnimation();
  updateHP();
  updateTurn();
};

function playerAttack(move) {
  disableAll();
  playAnimation("player-sprite", animations.player.attack, () => {
    const enemyShield = randomShield(enemy);
    log(`You cast ${move.name} (${move.type})`);
    log(`${enemy.name} raises a ${enemyShield} Shield!`);

    handleInteraction(player, enemy, move, enemyShield);
    updateHP();
    checkEnd();

    if (player.hp > 0 && enemy.hp > 0) {
      gameState = "enemy";
      isPlayerAttacking = false;
      setTimeout(enemyPrepare, 1000);
    }
  });
}

function enemyPrepare() {
  currentEnemyMove = randomMove(enemy);
  log(`${enemy.name} prepares an attack...`);
  gameState = "player";
  isPlayerAttacking = false;
  updateTurn();
}

function playerDefend(shieldType) {
  disableAll();
  playAnimation("player-sprite", animations.player.shield, () => {
    const move = currentEnemyMove;
    log(`${enemy.name} casts ${move.name} (${move.type})`);
    log(`You raise a ${shieldType} Shield!`);

    playAnimation("enemy-sprite", animations.enemy.attack, () => {
      handleInteraction(enemy, player, move, shieldType);
      updateHP();
      checkEnd();

      if (player.hp > 0 && enemy.hp > 0) {
        gameState = "player";
        isPlayerAttacking = true;
        updateTurn();
      }
    });
  });
}

function updateTurn() {
  const attackDiv = document.getElementById("attack-buttons");
  const shieldDiv = document.getElementById("shield-buttons");
  const label = document.getElementById("action-label");

  if (gameState === "player") {
    if (isPlayerAttacking) {
      attackDiv.style.display = "flex";
      shieldDiv.style.display = "none";
      label.textContent = "Choose your attack:";
    } else {
      attackDiv.style.display = "none";
      shieldDiv.style.display = "flex";
      label.textContent = "Choose your shield:";
    }
  } else {
    attackDiv.style.display = "none";
    shieldDiv.style.display = "none";
    label.textContent = "Enemy is taking their turn...";
  }
}

function handleInteraction(attacker, defender, move, shieldType) {
  let dmg = move.dmg;
  const result = getMatchup(move.type, shieldType);

  if (result === "counter") {
    log(`${defender.name} absorbed the attack and healed ${dmg} HP!`);
    defender.hp = Math.min(defender.hp + dmg, defender.maxHp);
  } else if (result === "weak") {
    dmg *= 2;
    log(`It's super effective! ${defender.name} took ${dmg} damage!`);
    defender.hp -= dmg;
  } else {
    log(`${defender.name} took ${dmg} damage.`);
    defender.hp -= dmg;
  }
}

function getMatchup(attack, shield) {
  if (isCounter(attack, shield)) return "counter";
  if (isWeak(attack, shield)) return "weak";
  return "neutral";
}

function isCounter(attack, shield) {
  return (
    (attack === "Fire" && shield === "Water") ||
    (attack === "Water" && shield === "Electric") ||
    (attack === "Electric" && shield === "Fire")
  );
}

function isWeak(attack, shield) {
  return (
    (attack === "Water" && shield === "Fire") ||
    (attack === "Electric" && shield === "Water") ||
    (attack === "Fire" && shield === "Electric")
  );
}

function randomMove(wizard) {
  return wizard.moves[Math.floor(Math.random() * wizard.moves.length)];
}

function randomShield(wizard) {
  return wizard.shields[Math.floor(Math.random() * wizard.shields.length)];
}

function updateHP() {
  document.getElementById("player-hp-fill").style.width = `${Math.max(player.hp, 0) / player.maxHp * 100}%`;
  document.getElementById("enemy-hp-fill").style.width = `${Math.max(enemy.hp, 0) / enemy.maxHp * 100}%`;
}

function log(text) {
  const logBox = document.getElementById("log");
  const p = document.createElement("p");
  p.textContent = text;
  logBox.prepend(p);
}

function checkEnd() {
  if (player.hp <= 0) {
    log("💀 You have been defeated...");
    disableAll();
  } else if (enemy.hp <= 0) {
    log("🎉 You win! The enemy has been vanquished!");
    disableAll();
  }
}

function disableAll() {
  document.getElementById("attack-buttons").style.display = "none";
  document.getElementById("shield-buttons").style.display = "none";
  document.getElementById("action-label").textContent = "Game Over";
}

// === SPRITE CONTROL ===
function setPlayerFrame(index) {
  document.querySelector(".player-sprite").style.backgroundPosition = `-${index * 16}px 0px`;
}

function setEnemyFrame(index) {
  document.querySelector(".enemy-sprite").style.backgroundPosition = `-${index * 16}px 0px`;
}

function playAnimation(spriteClass, frames, callback, speed = 300) {
  const el = document.querySelector(`.${spriteClass}`);
  let i = 0;
  function step() {
    if (i < frames.length) {
      el.style.backgroundPosition = `-${frames[i] * 16}px 0px`;
      i++;
      setTimeout(step, speed);
    } else {
      if (callback) callback();
    }
  }
  step();
}

function startIdleAnimation() {
  let i = 0;
  let j = 0;
  setInterval(() => {
    const playerFrame = animations.player.idle[i];
    const enemyFrame = animations.enemy.idle[j];
    setPlayerFrame(playerFrame);
    setEnemyFrame(enemyFrame);
    i = (i + 1) % animations.player.idle.length;
    j = (j + 1) % animations.enemy.idle.length;
  }, 500);
}

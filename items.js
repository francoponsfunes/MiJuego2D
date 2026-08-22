// ============================================================================
// ITEMS.JS
// Inventario, recompensas y objetos recogibles.
// ============================================================================

let playerKeys = 0;
let playerBoomerangs = 0;
let playerAccessCards = 0;
let brightHeartsCollected = 0;

const droppedKeys = [];
const droppedHalfHearts = [];
const droppedBossItems = [];
const droppedBrightHearts = [];

function createPickup(x, y, size = 20, type = null) {
    const item = {
        x,
        y,
        width: size,
        height: size,
        room: currentRoom
    };

    if (type !== null) {
        item.type = type;
    }

    return item;
}

function isPlayerTouchingItem(item) {
    return (
        player.x < item.x + item.width &&
        player.x + player.width > item.x &&
        player.y < item.y + item.height &&
        player.y + player.height > item.y
    );
}

function drawItemEmoji(item, emoji, fontSize = 24) {
    ctx.font = fontSize + "px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        emoji,
        item.x + item.width / 2,
        item.y + item.height / 2
    );
}

function dropKey(x, y) {
    droppedKeys.push(createPickup(x, y));
}

function dropHalfHeart(x, y) {
    droppedHalfHearts.push(createPickup(x, y));
}

function dropFullHeart(x, y) {
    droppedBossItems.push(createPickup(x, y, 20, "heart"));
}

function dropBoomerang(x, y) {
    droppedBossItems.push(createPickup(x, y, 20, "boomerang"));
}

function dropAccessCard(x, y) {
    droppedBossItems.push(createPickup(x, y, 24, "accessCard"));
}

function ensureBrightHeartInPharmacy() {
    const room = rooms[currentRoom];

    if (!room || room.type !== "pharmacy" || room.rewardCollected) {
        return;
    }

    if (droppedBrightHearts.some((heart) => heart.room === currentRoom)) {
        return;
    }

    droppedBrightHearts.push(
        createPickup(
            canvas.width / 2 - 18,
            canvas.height / 2 - 18,
            36
        )
    );
}

function drawBrightHearts() {
    droppedBrightHearts.forEach((heart) => {
        if (heart.room !== currentRoom) {
            return;
        }

        ctx.save();

        ctx.shadowColor = "rgba(255, 240, 110, 0.95)";
        ctx.shadowBlur = 20;

        drawItemEmoji(heart, "💖", 34);

        ctx.restore();
    });
}

function checkBrightHeartPickup() {
    for (let index = droppedBrightHearts.length - 1; index >= 0; index--) {
        const heart = droppedBrightHearts[index];

        if (heart.room !== currentRoom || !isPlayerTouchingItem(heart)) {
            continue;
        }

        playerMaxHealth++;
        healPlayer(1);

        brightHeartsCollected++;
        rooms[currentRoom].rewardCollected = true;

        droppedBrightHearts.splice(index, 1);
    }
}

function drawKeys() {
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";

    ctx.fillText("🔑 x " + playerKeys, 20, 68);
    ctx.fillText("🪃 x " + playerBoomerangs, 20, 96);

    if (playerAccessCards > 0) {
        ctx.fillText("🪪 x " + playerAccessCards, 20, 124);
    }
}

function drawDroppedKeys() {
    droppedKeys.forEach((key) => {
        if (key.room === currentRoom) {
            drawItemEmoji(key, "🔑");
        }
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function checkKeyPickup() {
    for (let index = droppedKeys.length - 1; index >= 0; index--) {
        const key = droppedKeys[index];

        if (key.room !== currentRoom || !isPlayerTouchingItem(key)) {
            continue;
        }

        playerKeys++;
        droppedKeys.splice(index, 1);
    }
}

function drawDroppedHalfHearts() {
    droppedHalfHearts.forEach((heart) => {
        if (heart.room !== currentRoom) {
            return;
        }

        drawItemEmoji(heart, "❤️");

        ctx.fillStyle = rooms[currentRoom].color;

        ctx.fillRect(
            heart.x + heart.width / 2,
            heart.y,
            heart.width / 2,
            heart.height
        );
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function checkHalfHeartPickup() {
    for (let index = droppedHalfHearts.length - 1; index >= 0; index--) {
        const heart = droppedHalfHearts[index];

        if (
            heart.room !== currentRoom ||
            !isPlayerTouchingItem(heart) ||
            playerHealth >= playerMaxHealth
        ) {
            continue;
        }

        healPlayer(0.5);
        droppedHalfHearts.splice(index, 1);
    }
}

function drawBossDrops() {
    const emojis = {
        heart: "❤️",
        boomerang: "🪃",
        accessCard: "🪪"
    };

    droppedBossItems.forEach((item) => {
        if (item.room !== currentRoom || !emojis[item.type]) {
            return;
        }

        if (item.type === "accessCard") {
            ctx.save();

            ctx.shadowColor = "rgba(115, 205, 255, 0.95)";
            ctx.shadowBlur = 14;

            drawItemEmoji(item, emojis[item.type]);

            ctx.restore();
            return;
        }

        drawItemEmoji(item, emojis[item.type]);
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function checkBossDropPickup() {
    for (let index = droppedBossItems.length - 1; index >= 0; index--) {
        const item = droppedBossItems[index];

        if (item.room !== currentRoom || !isPlayerTouchingItem(item)) {
            continue;
        }

        if (item.type === "heart") {
            if (playerHealth >= playerMaxHealth) {
                continue;
            }

            healPlayer(1);

        } else if (item.type === "boomerang") {
            playerBoomerangs++;

        } else if (item.type === "accessCard") {
            playerAccessCards++;

        } else {
            continue;
        }

        droppedBossItems.splice(index, 1);
    }
}

function healPlayer(amount) {
    playerHealth = Math.min(
        playerMaxHealth,
        playerHealth + amount
    );
}
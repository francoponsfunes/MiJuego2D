// ============================================================================
// ITEMS.JS
// Llaves, corazones, drops y pickups
// ============================================================================


// ============================================================================
// ESTADO DE ITEMS
// ============================================================================

let playerKeys = 0;
let brightHeartsCollected = 0;

const droppedKeys = [];
const droppedHalfHearts = [];
const droppedBossItems = [];
const droppedBrightHearts = [];

// ============================================================================
// CREAR DROPS
// ============================================================================

function dropKey(x, y) {

    droppedKeys.push({
        x: x,
        y: y,

        width: 20,
        height: 20,

        room: currentRoom
    });
}


function dropHalfHeart(x, y) {

    droppedHalfHearts.push({
        x: x,
        y: y,

        width: 20,
        height: 20,

        room: currentRoom
    });
}


function dropFullHeart(x, y) {

    droppedBossItems.push({
        type: "heart",

        x: x,
        y: y,

        width: 20,
        height: 20,

        room: currentRoom
    });
}


function dropBoomerang(x, y) {

    droppedBossItems.push({
        type: "boomerang",

        x: x,
        y: y,

        width: 20,
        height: 20,

        room: currentRoom
    });
}


// ============================================================================
// CORAZÓN BRILLANTE DE LA FARMACIA
// ============================================================================

function ensureBrightHeartInPharmacy() {

    const room = rooms[currentRoom];

    if (
        !room ||
        room.type !== "pharmacy" ||
        room.rewardCollected
    ) {
        return;
    }

    const alreadyExists =
        droppedBrightHearts.some((heart) =>
            heart.room === currentRoom
        );

    if (alreadyExists) {
        return;
    }

    droppedBrightHearts.push({
        x: canvas.width / 2 - 18,
        y: canvas.height / 2 - 18,
        width: 36,
        height: 36,
        room: currentRoom
    });
}


function drawBrightHearts() {

    droppedBrightHearts.forEach((heart) => {

        if (heart.room !== currentRoom) {
            return;
        }

        ctx.save();

        ctx.shadowColor = "rgba(255, 240, 110, 0.95)";
        ctx.shadowBlur = 20;
        ctx.font = "34px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "💖",
            heart.x + heart.width / 2,
            heart.y + heart.height / 2
        );

        ctx.restore();
    });
}


function checkBrightHeartPickup() {

    for (
        let index = droppedBrightHearts.length - 1;
        index >= 0;
        index--
    ) {

        const heart = droppedBrightHearts[index];

        if (heart.room !== currentRoom) {
            continue;
        }

        const colliding =
            player.x < heart.x + heart.width &&
            player.x + player.width > heart.x &&
            player.y < heart.y + heart.height &&
            player.y + player.height > heart.y;

        if (!colliding) {
            continue;
        }

        playerMaxHealth += 1;
        playerHealth = Math.min(
            playerMaxHealth,
            playerHealth + 1
        );

        brightHeartsCollected++;
        rooms[currentRoom].rewardCollected = true;

        droppedBrightHearts.splice(index, 1);

        // En niveles con Farmacia, recoger la recompensa cierra el nivel.
        showVictory();
    }
}
// ============================================================================
// CONTADOR DE LLAVES
// ============================================================================

function drawKeys() {

    ctx.fillStyle = "white";
    ctx.font = "22px Arial";

    ctx.fillText(
        "🔑 x " + playerKeys,
        20,
        68
    );
}


// ============================================================================
// LLAVES EN EL SUELO
// ============================================================================

function drawDroppedKeys() {

    droppedKeys.forEach((key) => {

        if (key.room !== currentRoom) {
            return;
        }

        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "🔑",
            key.x + key.width / 2,
            key.y + key.height / 2
        );
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}


// ============================================================================
// RECOGER LLAVES
// ============================================================================

function checkKeyPickup() {

    droppedKeys.forEach((key, index) => {

        if (key.room !== currentRoom) {
            return;
        }

        if (
            player.x < key.x + key.width &&
            player.x + player.width > key.x &&
            player.y < key.y + key.height &&
            player.y + player.height > key.y
        ) {

            playerKeys++;

            droppedKeys.splice(index, 1);
        }
    });
}


// ============================================================================
// MEDIOS CORAZONES EN EL SUELO
// ============================================================================

function drawDroppedHalfHearts() {

    droppedHalfHearts.forEach((heart) => {

        if (heart.room !== currentRoom) {
            return;
        }

        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "❤️",
            heart.x + heart.width / 2,
            heart.y + heart.height / 2
        );

        // Ocultar la mitad derecha
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


// ============================================================================
// RECOGER MEDIOS CORAZONES
// ============================================================================

function checkHalfHeartPickup() {

    droppedHalfHearts.forEach((heart, index) => {

        if (heart.room !== currentRoom) {
            return;
        }

        if (
            player.x < heart.x + heart.width &&
            player.x + player.width > heart.x &&
            player.y < heart.y + heart.height &&
            player.y + player.height > heart.y
        ) {

            if (playerHealth < playerMaxHealth) {

                healPlayer(0.5);

                droppedHalfHearts.splice(index, 1);
            }
        }
    });
}


// ============================================================================
// DROPS DE MINIBOSSES / BOSS
// ============================================================================

function drawBossDrops() {

    droppedBossItems.forEach((item) => {

        if (item.room !== currentRoom) {
            return;
        }

        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (item.type === "heart") {

            ctx.fillText(
                "❤️",
                item.x + item.width / 2,
                item.y + item.height / 2
            );
        }

        if (item.type === "boomerang") {

            ctx.fillText(
                "🪃",
                item.x + item.width / 2,
                item.y + item.height / 2
            );
        }
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}


// ============================================================================
// RECOGER DROPS DE MINIBOSSES / BOSS
// ============================================================================

function checkBossDropPickup() {

    droppedBossItems.forEach((item, index) => {

        if (item.room !== currentRoom) {
            return;
        }

        if (
            player.x < item.x + item.width &&
            player.x + player.width > item.x &&
            player.y < item.y + item.height &&
            player.y + player.height > item.y
        ) {

            if (item.type === "heart") {

                if (playerHealth < playerMaxHealth) {

                    healPlayer(1);

                    droppedBossItems.splice(index, 1);
                }

            } else if (item.type === "boomerang") {

                droppedBossItems.splice(index, 1);
            }
        }
    });
}


// ============================================================================
// CURAR JUGADOR
// ============================================================================

function healPlayer(amount) {

    playerHealth += amount;

    if (playerHealth > playerMaxHealth) {
        playerHealth = playerMaxHealth;
    }
}

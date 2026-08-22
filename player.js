// ============================================================================
// JUGADOR
// ============================================================================

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height / 2 - 20,
    width: 40,
    height: 40,
    speed: 4,
    color: "white"
};

// ============================================================================
// BALANCE DE MOVIMIENTO
// ============================================================================

const PLAYER_SPEED_MULTIPLIER = 0.65;

// ============================================================================
// VIDA Y ESTADOS DEL JUGADOR
// ============================================================================

let playerMaxHealth = 3;
let playerHealth = playerMaxHealth;
let movementDisabledUntil = 0;
let invulnerableUntil = 0;
let playerKnockbackX = 0;
let playerKnockbackY = 0;
// ============================================================================
// CONTROLES
// ============================================================================

const keys = {};

document.addEventListener("keydown", (event) => {

    keys[event.key.toLowerCase()] = true;

    // Reiniciar cuando aparece ALPISTE
    if (event.key === "Enter" && gameOver) {
        restartGame();
        victory = false;
        return;
    }

    // Evitar que las flechas muevan la página
    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
    ) {
        event.preventDefault();

        if (!gameOver) {
            shoot(event.key);
        }
    }
});

document.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});


// ============================================================================
// DISPARO DEL JUGADOR
// ============================================================================

let canShoot = true;
const shootCooldown = 250;

function shoot(direction) {

    if (!canShoot || gameOver || victory) {
        return;
    }

    canShoot = false;

    const bullet = {
        x: player.x + player.width / 2 - 5,
        y: player.y + player.height / 2 - 5,
        width: 10,
        height: 10,
        speed: 7,
        direction: direction
    };

    bullets.push(bullet);

    setTimeout(() => {
        canShoot = true;
    }, shootCooldown);
}


function updatePlayer() {

    const movementDisabled =
        performance.now() < movementDisabledUntil;


    // ========================================================================
    // MOVIMIENTO NORMAL
    // ========================================================================

    // ========================================================================
// MOVIMIENTO NORMAL
// ========================================================================

const movementSpeed =
    player.speed *
    PLAYER_SPEED_MULTIPLIER;


if (!movementDisabled) {

    if (keys["w"]) {
        player.y -= movementSpeed;
    }

    if (keys["s"]) {
        player.y += movementSpeed;
    }

    if (keys["a"]) {
        player.x -= movementSpeed;
    }

    if (keys["d"]) {
        player.x += movementSpeed;
    }
}

    // ========================================================================
    // KNOCKBACK
    // ========================================================================

    player.x += playerKnockbackX;
    player.y += playerKnockbackY;

    playerKnockbackX *= 0.82;
    playerKnockbackY *= 0.82;


    // Cortar valores casi invisibles
    if (Math.abs(playerKnockbackX) < 0.05) {
        playerKnockbackX = 0;
    }

    if (Math.abs(playerKnockbackY) < 0.05) {
        playerKnockbackY = 0;
    }


    // ========================================================================
    // LÍMITES DE LA HABITACIÓN
    // ========================================================================

    if (player.x < 0) {
        player.x = 0;
        playerKnockbackX = 0;
    }

    if (player.y < 0) {
        player.y = 0;
        playerKnockbackY = 0;
    }

    if (
        player.x + player.width >
        canvas.width
    ) {

        player.x =
            canvas.width -
            player.width;

        playerKnockbackX = 0;
    }

    if (
        player.y + player.height >
        canvas.height
    ) {

        player.y =
            canvas.height -
            player.height;

        playerKnockbackY = 0;
    }
}
// ============================================================================
// DIBUJAR JUGADOR
// ============================================================================

function drawPlayer() {

    ctx.fillStyle = player.color;

    ctx.fillRect(
        player.x,
        player.y,
        player.width,
        player.height
    );
}


// ============================================================================
// DIBUJAR VIDA
// ============================================================================

function drawHealth() {

    const heartSize = 28;
    const startX = 20;
    const startY = 28;

    for (let i = 0; i < playerMaxHealth; i++) {

        const heartX = startX + i * heartSize;

        // Vida restante para este corazón
        const heartHealth = playerHealth - i;

        // Corazón completo
        if (heartHealth >= 1) {

            ctx.font = "24px Arial";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";

            ctx.fillText(
                "❤️",
                heartX,
                startY
            );
        }

        // Medio corazón
        else if (heartHealth === 0.5) {

            ctx.font = "24px Arial";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";

            // Dibujar corazón completo primero
            ctx.fillText(
                "❤️",
                heartX,
                startY
            );

            // Ocultar la mitad derecha
            ctx.fillStyle = rooms[currentRoom].color;

            ctx.fillRect(
                heartX + 12,
                startY - 14,
                14,
                28
            );

            // Pequeño borde
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";

            ctx.strokeRect(
                heartX + 12,
                startY - 14,
                14,
                28
            );
        }
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}
// ============================================================================
// KNOCKBACK DEL JUGADOR
// ============================================================================

function applyPlayerKnockback(
    sourceX,
    sourceY,
    force = 7
) {

    if (
        typeof sourceX !== "number" ||
        typeof sourceY !== "number"
    ) {
        return;
    }


    const playerCenterX =
        player.x +
        player.width / 2;

    const playerCenterY =
        player.y +
        player.height / 2;


    const dx =
        playerCenterX -
        sourceX;

    const dy =
        playerCenterY -
        sourceY;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        ) || 1;


    playerKnockbackX =
        (dx / distance) *
        force;

    playerKnockbackY =
        (dy / distance) *
        force;
}
function damagePlayerFromEntity(
    amount,
    entity,
    knockbackForce = 7
) {

    const sourceX =
        entity.x +
        entity.width / 2;

    const sourceY =
        entity.y +
        entity.height / 2;


    damagePlayer(
        amount,
        sourceX,
        sourceY,
        knockbackForce
    );
}
// ============================================================================
// DAÑO DEL JUGADOR
// ============================================================================

function damagePlayer(
    amount,
    sourceX = null,
    sourceY = null,
    knockbackForce = 7
) {

    if (gameOver || victory) {
        return false;
    }


    // ========================================================================
    // INVULNERABILIDAD
    // ========================================================================

    if (
        performance.now() <
        invulnerableUntil
    ) {
        return false;
    }


    // ========================================================================
    // DAÑO
    // ========================================================================

    playerHealth -= amount;

    if (playerHealth < 0) {
        playerHealth = 0;
    }


    // ========================================================================
    // MUERTE
    // ========================================================================

    if (playerHealth <= 0) {

        playerHealth = 0;

        gameOver = true;
        victory = false;

        return true;
    }


    // ========================================================================
    // INVULNERABILIDAD
    // ========================================================================

    invulnerableUntil =
        performance.now() +
        600;


    // ========================================================================
    // KNOCKBACK
    // ========================================================================

   applyPlayerKnockback(
    sourceX,
    sourceY,
    knockbackForce
);

    return true;
}

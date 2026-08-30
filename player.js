// ============================================================================
// PLAYER.JS - Estado, controles, movimiento, disparos y vida del jugador.
// ============================================================================

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height / 2 - 20,
    width: 40,
    height: 40,
    speed: 4,
    color: "white"
};

const PLAYER_SPEED_MULTIPLIER = 0.72;

const PLAYER_SHOOT_DIRECTIONS = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight"
];

const keys = {};

const shootCooldown = 400;
const PLAYER_DASH_SPEED = 10.5;
const PLAYER_DASH_DURATION = 145;
const PLAYER_DASH_COOLDOWN = 1150;

let playerMaxHealth = 3;
let playerHealth = playerMaxHealth;

let movementDisabledUntil = 0;
let invulnerableUntil = 0;
let contactInvulnerableUntil = 0;

let playerKnockbackX = 0;
let playerKnockbackY = 0;

let nextShotTime = 0;
let shootingDirection = null;

let playerDashDirectionX = 0;
let playerDashDirectionY = -1;

let playerDashUntil = 0;
let playerDashReadyAt = 0;
let playerDashWasActive = false;

let lastPlayerMovementX = 0;
let lastPlayerMovementY = -1;


// ============================================================================
// CONTROLES
// ============================================================================
document.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;

    if (
        event.key === "Enter" &&
        gameOver
    ) {
        resetPlayerDash();
        restartGame();

        return;
    }

    if (event.code === "Space") {
        event.preventDefault();

        if (!event.repeat) {
            tryStartPlayerDash();
        }

        return;
    }

    if (event.code === "ShiftRight") {
        event.preventDefault();

        if (!event.repeat) {
            launchBoomerang();
        }

        return;
    }

    if (
        PLAYER_SHOOT_DIRECTIONS.includes(
            event.key
        )
    ) {
        event.preventDefault();

        if (!gameOver) {
            shoot(event.key);
        }
    }
});
function getPlayerMovementInput() {
    const movementX =
        Number(Boolean(keys.d)) -
        Number(Boolean(keys.a));

    const movementY =
        Number(Boolean(keys.s)) -
        Number(Boolean(keys.w));

    const movementLength =
        Math.hypot(
            movementX,
            movementY
        );

    if (movementLength === 0) {
        return {
            x: 0,
            y: 0,
            moving: false
        };
    }

    return {
        x: movementX / movementLength,
        y: movementY / movementLength,
        moving: true
    };
}


function isPlayerDashing(
    now = performance.now()
) {
    return now < playerDashUntil;
}


function clearPlayerContactFlags() {
    if (
        typeof enemies !== "undefined"
    ) {
        enemies.forEach((enemy) => {
            enemy.touchingPlayer = false;
        });
    }

    if (
        typeof boss !== "undefined"
    ) {
        boss.touchingPlayer = false;
    }
}


function resetPlayerDash() {
    playerDashDirectionX = 0;
    playerDashDirectionY = -1;

    playerDashUntil = 0;
    playerDashReadyAt = 0;
    playerDashWasActive = false;

    lastPlayerMovementX = 0;
    lastPlayerMovementY = -1;

    clearPlayerContactFlags();
}


function tryStartPlayerDash() {
    const now =
        performance.now();

    const dialogOpen =
        typeof elevatorDialogOpen !==
            "undefined" &&
        elevatorDialogOpen;

    if (
        gameOver ||
        victory ||
        upgradeSelectionOpen ||
        dialogOpen ||
        now < movementDisabledUntil ||
        now < playerDashReadyAt ||
        isPlayerDashing(now)
    ) {
        return false;
    }

    const movement =
        getPlayerMovementInput();

    const directionX =
        movement.moving
            ? movement.x
            : lastPlayerMovementX;

    const directionY =
        movement.moving
            ? movement.y
            : lastPlayerMovementY;

    const directionLength =
        Math.hypot(
            directionX,
            directionY
        ) || 1;

    playerDashDirectionX =
        directionX / directionLength;

    playerDashDirectionY =
        directionY / directionLength;

    lastPlayerMovementX =
        playerDashDirectionX;

    lastPlayerMovementY =
        playerDashDirectionY;

    player.boomerangAimX =
        playerDashDirectionX;

    player.boomerangAimY =
        playerDashDirectionY;

    playerDashUntil =
        now + PLAYER_DASH_DURATION;

    playerDashReadyAt =
        now + PLAYER_DASH_COOLDOWN;

    playerDashWasActive = true;

    playerKnockbackX = 0;
    playerKnockbackY = 0;

    invulnerableUntil =
        Math.max(
            invulnerableUntil,
            playerDashUntil
        );

    clearPlayerContactFlags();

    return true;
}


function getPlayerDashCooldownProgress(
    now = performance.now()
) {
    if (now >= playerDashReadyAt) {
        return 1;
    }

    const cooldownStartedAt =
        playerDashReadyAt -
        PLAYER_DASH_COOLDOWN;

    return Math.max(
        0,
        Math.min(
            1,
            (
                now -
                cooldownStartedAt
            ) /
            PLAYER_DASH_COOLDOWN
        )
    );
}
// ============================================================================
// DISPAROS
// ============================================================================
function shoot(direction) {

    if (
        !PLAYER_SHOOT_DIRECTIONS.includes(direction)
    ) {
        return false;
    }

    shootingDirection = direction;
    player.aimDirection = direction;

    if (
        gameOver ||
        victory ||
        upgradeSelectionOpen
    ) {
        return false;
    }

    const now = performance.now();

    if (now < nextShotTime) {
        return false;
    }

    const bulletSize =
        getPlayerProjectileSize(10);

    const currentShootCooldown =
        getPlayerShootCooldown(
            shootCooldown
        );

    bullets.push({
        x:
            player.x +
            player.width / 2 -
            bulletSize / 2,

        y:
            player.y +
            player.height / 2 -
            bulletSize / 2,

        width: bulletSize,
        height: bulletSize,

        speed:
            getPlayerProjectileSpeed(7),

        damage:
            getPlayerBulletDamage(1),

        direction
    });

    nextShotTime =
        nextShotTime > 0 &&
        now - nextShotTime <
            currentShootCooldown

            ? nextShotTime +
                currentShootCooldown

            : now +
                currentShootCooldown;

    return true;
}
function updatePlayerShooting() {

    if (
        gameOver ||
        victory
    ) {

        return;
    }

    if (

        !shootingDirection ||

        !keys[
            shootingDirection.toLowerCase()
        ]

    ) {

        shootingDirection =

            PLAYER_SHOOT_DIRECTIONS.find((direction) =>

                keys[
                    direction.toLowerCase()
                ]

            ) || null;
    }

    if (
        shootingDirection
    ) {

        shoot(
            shootingDirection
        );
    }
}


// ============================================================================
// MOVIMIENTO Y KNOCKBACK
// ============================================================================
function updatePlayer(deltaTime = 1) {
    const now =
        performance.now();

    if (
        now < movementDisabledUntil
    ) {
        const stunMultiplier =
            getPlayerStunDurationMultiplier();

        movementDisabledUntil -=
            16.67 *
            deltaTime *
            (
                1 / stunMultiplier -
                1
            );
    }

    const movementDisabled =
        now < movementDisabledUntil;

    const dashActive =
        isPlayerDashing(now);

    if (
        !dashActive &&
        playerDashWasActive
    ) {
        playerDashWasActive = false;

        clearPlayerContactFlags();
    }

    if (dashActive) {
        const dashDistance =
            PLAYER_DASH_SPEED *
            deltaTime;

        player.x +=
            playerDashDirectionX *
            dashDistance;

        player.y +=
            playerDashDirectionY *
            dashDistance;

        playerKnockbackX = 0;
        playerKnockbackY = 0;

    } else if (!movementDisabled) {
        const movement =
            getPlayerMovementInput();

        if (movement.moving) {
            const directionX =
                movement.x;

            const directionY =
                movement.y;

            lastPlayerMovementX =
                directionX;

            lastPlayerMovementY =
                directionY;

            player.boomerangAimX =
                directionX;

            player.boomerangAimY =
                directionY;

            const shootingKeyPressed =
                shootingDirection &&
                keys[
                    shootingDirection
                        .toLowerCase()
                ];

            if (!shootingKeyPressed) {
                const currentDirectionMatchesMovement =
                    (
                        player.aimDirection ===
                            "ArrowLeft" &&
                        directionX < 0
                    ) ||
                    (
                        player.aimDirection ===
                            "ArrowRight" &&
                        directionX > 0
                    ) ||
                    (
                        player.aimDirection ===
                            "ArrowUp" &&
                        directionY < 0
                    ) ||
                    (
                        player.aimDirection ===
                            "ArrowDown" &&
                        directionY > 0
                    );

                if (
                    !currentDirectionMatchesMovement
                ) {
                    player.aimDirection =
                        directionX !== 0

                            ? directionX > 0
                                ? "ArrowRight"
                                : "ArrowLeft"

                            : directionY > 0
                                ? "ArrowDown"
                                : "ArrowUp";
                }
            }

            const movementSpeed =
                player.speed *
                PLAYER_SPEED_MULTIPLIER *
                getPlayerMovementMultiplier() *
                deltaTime;

            player.x +=
                directionX *
                movementSpeed;

            player.y +=
                directionY *
                movementSpeed;
        }
    }

    if (!dashActive) {
        player.x +=
            playerKnockbackX *
            deltaTime;

        player.y +=
            playerKnockbackY *
            deltaTime;

        const damping =
            Math.pow(
                0.82,
                deltaTime
            );

        playerKnockbackX *=
            damping;

        playerKnockbackY *=
            damping;

        if (
            Math.abs(
                playerKnockbackX
            ) < 0.05
        ) {
            playerKnockbackX = 0;
        }

        if (
            Math.abs(
                playerKnockbackY
            ) < 0.05
        ) {
            playerKnockbackY = 0;
        }
    }

    const limitedX =
        Math.max(
            0,
            Math.min(
                canvas.width -
                    player.width,
                player.x
            )
        );

    const limitedY =
        Math.max(
            0,
            Math.min(
                canvas.height -
                    player.height,
                player.y
            )
        );

    if (limitedX !== player.x) {
        player.x = limitedX;
        playerKnockbackX = 0;
    }

    if (limitedY !== player.y) {
        player.y = limitedY;
        playerKnockbackY = 0;
    }

    updatePlayerShooting();
}
// ============================================================================
// DIBUJAR JUGADOR
// ============================================================================
function drawPlayer() {
    const now =
        performance.now();

    const dashActive =
        isPlayerDashing(now);

    if (dashActive) {
        ctx.save();

        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#9eeeff";

        ctx.fillRect(
            player.x -
                playerDashDirectionX * 18,
            player.y -
                playerDashDirectionY * 18,
            player.width,
            player.height
        );

        ctx.restore();
    }

    ctx.fillStyle =
        dashActive
            ? "#dffbff"
            : player.color;

    ctx.fillRect(
        player.x,
        player.y,
        player.width,
        player.height
    );

    const cooldownProgress =
        getPlayerDashCooldownProgress(
            now
        );

    const barWidth =
        player.width;

    const barHeight = 4;

    const barX =
        player.x;

    const barY =
        player.y +
        player.height +
        5 <=
        canvas.height - barHeight

            ? player.y +
                player.height +
                5

            : player.y - 9;

    ctx.fillStyle =
        "rgba(0, 0, 0, 0.65)";

    ctx.fillRect(
        barX,
        barY,
        barWidth,
        barHeight
    );

    ctx.fillStyle =
        cooldownProgress >= 1
            ? "white"
            : "#65d9ff";

    ctx.fillRect(
        barX,
        barY,
        barWidth *
            cooldownProgress,
        barHeight
    );
}
// ============================================================================
// DIBUJAR VIDA
// ============================================================================

function drawHealth() {

    const heartSize = 28;
    const startX = 20;
    const startY = 28;

    ctx.font =
        "24px Arial";

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";

    for (

        let index = 0;

        index < playerMaxHealth;

        index++

    ) {

        const heartHealth =

            playerHealth -

            index;

        if (
            heartHealth <= 0
        ) {

            continue;
        }

        const heartX =

            startX +

            index *

            heartSize;

        ctx.fillText(

            "❤️",

            heartX,

            startY
        );

        if (
            heartHealth === 0.5
        ) {

            ctx.fillStyle =

                rooms[currentRoom]
                    .color;

            ctx.fillRect(

                heartX + 12,

                startY - 14,

                14,

                28
            );

            ctx.strokeStyle =
                "rgba(255, 255, 255, 0.15)";

            ctx.strokeRect(

                heartX + 12,

                startY - 14,

                14,

                28
            );
        }
    }

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "alphabetic";
}


// ============================================================================
// RETROCESO DEL JUGADOR
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

    const dx =

        player.x +

        player.width / 2 -

        sourceX;

    const dy =

        player.y +

        player.height / 2 -

        sourceY;

    const distance =

        Math.sqrt(

            dx * dx +

            dy * dy

        ) || 1;

    playerKnockbackX =

        dx /

        distance *

        force;

    playerKnockbackY =

        dy /

        distance *

        force;
}


// ============================================================================
// DAÑO PROVOCADO POR UN ENEMIGO
// ============================================================================
function damagePlayerFromEntity(

    amount,

    entity,

    knockbackForce = 7,

    damageType = "contact"

) {

    const now =
        performance.now();

    if (
        damageType === "contact" &&
        now <
        contactInvulnerableUntil
    ) {
        return false;
    }

    const damaged =
        damagePlayer(
            amount,

            entity.x +
                entity.width / 2,

            entity.y +
                entity.height / 2,

            knockbackForce
        );

    if (
        damaged &&
        damageType === "contact"
    ) {
        contactInvulnerableUntil =
            now +
            getPlayerContactProtectionDuration(
                600
            );
    }

    return damaged;
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

    if (
        gameOver ||
        victory ||
        performance.now() <
            invulnerableUntil
    ) {
        return false;
    }

    playerHealth =
        Math.max(
            0,
            playerHealth -
                amount
        );

    if (
        playerHealth === 0
    ) {
        gameOver = true;
        victory = false;

        return true;
    }

    invulnerableUntil =
        performance.now() +
        getPlayerInvulnerabilityDuration(
            600
        );

    applyPlayerKnockback(
        sourceX,
        sourceY,
        knockbackForce
    );

    return true;
}
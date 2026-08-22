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

const shootCooldown = 250;

let playerMaxHealth = 3;
let playerHealth = playerMaxHealth;

let movementDisabledUntil = 0;
let invulnerableUntil = 0;

let playerKnockbackX = 0;
let playerKnockbackY = 0;

let nextShotTime = 0;
let shootingDirection = null;


// ============================================================================
// CONTROLES
// ============================================================================

document.addEventListener("keydown", (event) => {

    keys[event.key.toLowerCase()] = true;

    if (
        event.key === "Enter" &&
        gameOver
    ) {

        restartGame();

        return;
    }

    if (
        event.code === "Space" ||
        event.code === "ShiftRight"
    ) {

        event.preventDefault();

        if (!event.repeat) {

            launchBoomerang();
        }

        return;
    }

    if (
        PLAYER_SHOOT_DIRECTIONS.includes(event.key)
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
        victory
    ) {

        return false;
    }

    const now = performance.now();

    if (
        now < nextShotTime
    ) {

        return false;
    }

    bullets.push({

        x:
            player.x +
            player.width / 2 -
            5,

        y:
            player.y +
            player.height / 2 -
            5,

        width: 10,

        height: 10,

        speed: 7,

        direction
    });

    nextShotTime =

        nextShotTime > 0 &&
        now - nextShotTime < shootCooldown

            ? nextShotTime + shootCooldown

            : now + shootCooldown;

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

    const movementDisabled =

        performance.now() <

        movementDisabledUntil;

    if (
        !movementDisabled
    ) {

        const movementX =

            Number(
                Boolean(keys.d)
            ) -

            Number(
                Boolean(keys.a)
            );

        const movementY =

            Number(
                Boolean(keys.s)
            ) -

            Number(
                Boolean(keys.w)
            );

        const movementLength =
            Math.hypot(

                movementX,

                movementY
            );

        if (
            movementLength > 0
        ) {

            const directionX =

                movementX /

                movementLength;

            const directionY =

                movementY /

                movementLength;

            player.boomerangAimX =
                directionX;

            player.boomerangAimY =
                directionY;

            const shootingKeyPressed =

                shootingDirection &&

                keys[
                    shootingDirection.toLowerCase()
                ];

            if (
                !shootingKeyPressed
            ) {

                const currentDirectionMatchesMovement =

                    (
                        player.aimDirection === "ArrowLeft" &&
                        movementX < 0
                    ) ||

                    (
                        player.aimDirection === "ArrowRight" &&
                        movementX > 0
                    ) ||

                    (
                        player.aimDirection === "ArrowUp" &&
                        movementY < 0
                    ) ||

                    (
                        player.aimDirection === "ArrowDown" &&
                        movementY > 0
                    );

                if (
                    !currentDirectionMatchesMovement
                ) {

                    player.aimDirection =

                        movementX !== 0

                            ? movementX > 0

                                ? "ArrowRight"

                                : "ArrowLeft"

                            : movementY > 0

                                ? "ArrowDown"

                                : "ArrowUp";
                }
            }

            const movementSpeed =

                player.speed *

                PLAYER_SPEED_MULTIPLIER *

                deltaTime;

            player.x +=

                directionX *

                movementSpeed;

            player.y +=

                directionY *

                movementSpeed;
        }
    }


    // Aplicar retroceso.

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


    // Mantener al jugador dentro de la sala.

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

    if (
        limitedX !== player.x
    ) {

        player.x =
            limitedX;

        playerKnockbackX =
            0;
    }

    if (
        limitedY !== player.y
    ) {

        player.y =
            limitedY;

        playerKnockbackY =
            0;
    }

    updatePlayerShooting();
}


// ============================================================================
// DIBUJAR JUGADOR
// ============================================================================

function drawPlayer() {

    ctx.fillStyle =
        player.color;

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

    knockbackForce = 7

) {

    damagePlayer(

        amount,

        entity.x +
        entity.width / 2,

        entity.y +
        entity.height / 2,

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

        600;

    applyPlayerKnockback(

        sourceX,

        sourceY,

        knockbackForce
    );

    return true;
}
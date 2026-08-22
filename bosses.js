// ============================================================================
// BOSSES.JS
// CUA CUA: estado, movimiento, fases, ataques, vida y drops
// ============================================================================


// ============================================================================
// CUA CUA
// ============================================================================

const boss = {

    x: 0,
    y: 0,

    width: 80,
    height: 80,

    speed: 1.2,

    health: 30,
    maxHealth: 30,

    active: false,
    defeated: false,
    touchingPlayer: false,


    // Movimiento
    movementX: 0,
    movementY: 0,
    movementTimer: 0,


    // Ataques
    attackTimer: 55,
attackCooldown: 92,
attackSequence: 0,


    // Fases
    phase: 1,

    


    spawned75: false,
spawned50: false,
spawned25: false,

// Coordinación de los asistentes.
assistantCommandTimer: 90,
assistantTurn: 0,
anesthesiaImmunityUntil: 0,
};


// ============================================================================
// ACTUALIZAR CUA CUA
// ============================================================================

function updateBoss(deltaTime) {

    if (
        !boss.active ||
        boss.defeated
    ) {
        return;
    }


    updateBossPhase();


    // ========================================================================
    // SPAWN AL 75%
    // ========================================================================

    if (
        boss.health <= boss.maxHealth * 0.75 &&
        !boss.spawned75
    ) {

        boss.spawned75 = true;

        spawnBossAnesthesiologists();
    }


    // ========================================================================
    // SPAWN AL 50%
    // ========================================================================

    if (
        boss.health <= boss.maxHealth * 0.50 &&
        !boss.spawned50
    ) {

        boss.spawned50 = true;

        spawnBossAnesthesiologists();
    }


    // ========================================================================
    // SPAWN AL 25%
    // ========================================================================

    if (
        boss.health <= boss.maxHealth * 0.25 &&
        !boss.spawned25
    ) {

        boss.spawned25 = true;

        spawnBossAnesthesiologists();
    }

// Cua Cua coordina las entradas.
// Nunca atacan los dos al mismo tiempo.
updateBossAssistantCommands(deltaTime);
    // ========================================================================
    // VELOCIDAD SEGÚN FASE
    // ========================================================================

    let movementSpeed;

    if (boss.phase === 1) {

        movementSpeed = 1.2;

    } else if (boss.phase === 2) {

        movementSpeed = 1.5;

    } else if (boss.phase === 3) {

        movementSpeed = 1.8;

    } else {

        movementSpeed = 2.2;
    }


    // ========================================================================
    // MOVIMIENTO
    // ========================================================================

    if (boss.dashDuration > 0) {

        boss.x +=
            boss.dashX *
            deltaTime;

        boss.y +=
            boss.dashY *
            deltaTime;

        boss.dashDuration -=
            deltaTime;

    } else {

        const dx =
            player.x -
            boss.x;

        const dy =
            player.y -
            boss.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            ) || 1;

        boss.x +=
            (dx / distance) *
            movementSpeed *
            deltaTime;

        boss.y +=
            (dy / distance) *
            movementSpeed *
            deltaTime;
    }


    // ========================================================================
    // LÍMITES DE LA HABITACIÓN
    // ========================================================================

    if (boss.x < 20) {
        boss.x = 20;
    }

    if (boss.y < 20) {
        boss.y = 20;
    }

    if (
        boss.x + boss.width >
        canvas.width - 20
    ) {

        boss.x =
            canvas.width -
            20 -
            boss.width;
    }

    if (
        boss.y + boss.height >
        canvas.height - 20
    ) {

        boss.y =
            canvas.height -
            20 -
            boss.height;
    }


    // ========================================================================
    // ATAQUES
    // ========================================================================

    boss.attackTimer -=
        deltaTime;

    if (boss.attackTimer <= 0) {

        bossAttack();

        if (boss.phase === 1) {

            boss.attackTimer = 120;

        } else if (boss.phase === 2) {

            boss.attackTimer = 100;

        } else if (boss.phase === 3) {

            boss.attackTimer = 80;

        } else {

            boss.attackTimer = 55;
        }
    }


    // ========================================================================
    // DASH
    // ========================================================================

    boss.dashTimer -=
        deltaTime;

    if (
        boss.dashTimer <= 0 &&
        boss.dashDuration <= 0
    ) {

        bossStartDash();

        if (boss.phase === 1) {

            boss.dashTimer = 360;

        } else if (boss.phase === 2) {

            boss.dashTimer = 300;

        } else if (boss.phase === 3) {

            boss.dashTimer = 240;

        } else {

            boss.dashTimer = 180;
        }
    }
}


// ============================================================================
// ACTUALIZAR FASE
// ============================================================================

function updateBossPhase() {

    const healthPercent =
        boss.health /
        boss.maxHealth;

    if (healthPercent > 0.75) {

        boss.phase = 1;

    } else if (healthPercent > 0.50) {

        boss.phase = 2;

    } else if (healthPercent > 0.25) {

        boss.phase = 3;

    } else {

        boss.phase = 4;
        boss.enraged = true;
    }
}
// ============================================================================
// DISPARO EN ABANICO
// ============================================================================

function shootBossFan(
    projectileCount,
    angleStep,
    speed
) {

    const bossCenterX =
        boss.x + boss.width / 2;

    const bossCenterY =
        boss.y + boss.height / 2;

    const playerCenterX =
        player.x + player.width / 2;

    const playerCenterY =
        player.y + player.height / 2;

    const baseAngle =
        Math.atan2(
            playerCenterY - bossCenterY,
            playerCenterX - bossCenterX
        );

    const firstOffset =
        -angleStep *
        (projectileCount - 1) / 2;

    for (
        let projectileIndex = 0;
        projectileIndex < projectileCount;
        projectileIndex++
    ) {

        const angle =
            baseAngle +
            firstOffset +
            projectileIndex * angleStep;

        shootBossProjectile(
            bossCenterX + Math.cos(angle) * 100,
            bossCenterY + Math.sin(angle) * 100,
            speed,
            angle
        );
    }
}


// ============================================================================
// ATAQUES SEGÚN FASE
// ============================================================================

function bossAttack() {

    const centerX =
        boss.x +
        boss.width / 2;

    const centerY =
        boss.y +
        boss.height / 2;


    // Cada ataque prepara la entrada de un asistente.
    const hasAssistant =
        enemies.some((enemy) =>
            enemy.type === "anesthesiologist" &&
            enemy.bossAssistant
        );

    if (hasAssistant) {

        boss.assistantCommandTimer =
            Math.min(
                boss.assistantCommandTimer,
                14
            );
    }

    boss.attackSequence++;


    // ========================================================================
    // FASE 1 - PRECISIÓN Y ABANICO
    // ========================================================================

    if (boss.phase === 1) {

        // Alterna un disparo rápido con un abanico.
        if (boss.attackSequence % 2 === 1) {

            shootBossFan(
                1,
                0,
                4.8
            );

        } else {

            shootBossFan(
                3,
                0.15,
                4.15
            );
        }

        return;
    }


    // ========================================================================
    // FASE 2 - ABANICO Y PINZA
    // ========================================================================

    if (boss.phase === 2) {

        if (boss.attackSequence % 2 === 1) {

            shootBossFan(
                3,
                0.17,
                4.45
            );

        } else {

            // Dos trayectorias dejan un espacio estrecho en el centro.
            shootBossFan(
                2,
                0.20,
                4.8
            );
        }

        return;
    }


    // ========================================================================
    // FASE 3 - DISPARO RADIAL
    // ========================================================================

    if (boss.phase === 3) {

        const numberOfProjectiles = 8;

        for (
            let i = 0;
            i < numberOfProjectiles;
            i++
        ) {

            const angle =
                (
                    Math.PI *
                    2 /
                    numberOfProjectiles
                ) *
                i;

            shootBossProjectile(
                centerX +
                    Math.cos(angle) *
                    100,

                centerY +
                    Math.sin(angle) *
                    100,

                4.5,
                angle
            );
        }

        return;
    }


    // ========================================================================
    // FASE 4 - RADIAL Y DIRIGIDO
    // ========================================================================

    const numberOfProjectiles = 10;

    for (
        let i = 0;
        i < numberOfProjectiles;
        i++
    ) {

        const angle =
            (
                Math.PI *
                2 /
                numberOfProjectiles
            ) *
            i;

        shootBossProjectile(
            centerX +
                Math.cos(angle) *
                100,

            centerY +
                Math.sin(angle) *
                100,

            5,
            angle
        );
    }

    shootBossProjectile(
        player.x + player.width / 2,
        player.y + player.height / 2,
        5.5
    );
}
// ============================================================================
// DASH
// ============================================================================

function bossStartDash() {

    const dx =
        player.x -
        boss.x;

    const dy =
        player.y -
        boss.y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        ) || 1;

    boss.dashX =
        (dx / distance) *
        4.5;

    boss.dashY =
        (dy / distance) *
        4.5;

    boss.dashDuration = 30;
}


// ============================================================================
// COORDINAR ANESTESIÓLOGOS DE CUA CUA
// ============================================================================

function updateBossAssistantCommands(deltaTime) {

    const assistants =
        enemies.filter((enemy) =>
            enemy.type === "anesthesiologist" &&
            enemy.bossAssistant
        );

    if (assistants.length === 0) {
        return;
    }

    boss.assistantCommandTimer -=
        deltaTime;

    if (boss.assistantCommandTimer > 0) {
        return;
    }

    const assistantAttacking =
        assistants.some((enemy) =>
            enemy.anesthesiologistState === "windup" ||
            enemy.anesthesiologistState === "dash"
        );

    // No se superpone con el dash ni con un ataque inminente de Cua Cua.
    if (
        assistantAttacking ||
        boss.dashDuration > 0 ||
        boss.attackTimer <= 25
    ) {
        return;
    }

    const readyAssistants =
        assistants.filter((enemy) =>
            enemy.anesthesiologistState === "orbit"
        );

    if (readyAssistants.length === 0) {
        return;
    }

    const chosenAssistant =
        readyAssistants.find((enemy) =>
            enemy.assistantSlot === boss.assistantTurn
        ) || readyAssistants[0];

    chosenAssistant.anesthesiologistState =
        "windup";

    chosenAssistant.stateTimer =
        boss.phase === 1
            ? 36
            : boss.phase === 2
                ? 32
                : boss.phase === 3
                    ? 28
                    : 25;

    chosenAssistant.windupDuration =
        chosenAssistant.stateTimer;

    // La posición queda fijada al comenzar el aviso.
    chosenAssistant.attackTargetX =
        player.x + player.width / 2;

    chosenAssistant.attackTargetY =
        player.y + player.height / 2;

    chosenAssistant.anesthesiaUsedThisDash =
        false;

    boss.assistantTurn =
        chosenAssistant.assistantSlot === 0
            ? 1
            : 0;

    // Espera una nueva señal de Cua Cua.
    boss.assistantCommandTimer =
        9999;
}


// ============================================================================
// GENERAR ANESTESIÓLOGOS DE CUA CUA
// ============================================================================

function spawnBossAnesthesiologists() {

    const currentAssistants =
        enemies.filter((enemy) =>
            enemy.type === "anesthesiologist" &&
            enemy.bossAssistant
        );

    const occupiedSlots =
        new Set(
            currentAssistants.map((enemy) =>
                enemy.assistantSlot
            )
        );

    // Siempre existen como máximo dos.
    for (let slot = 0; slot < 2; slot++) {

        if (occupiedSlots.has(slot)) {
            continue;
        }

        const angle =
            Math.PI / 2 +
            slot * Math.PI;

        enemies.push(
            createEnemy({

                type:
                    "anesthesiologist",

                bossAssistant:
                    true,

                assistantSlot:
                    slot,

                x:
                    boss.x +
                    boss.width / 2 +
                    Math.cos(angle) * 80 -
                    20,

                y:
                    boss.y +
                    boss.height / 2 +
                    Math.sin(angle) * 80 -
                    20,

                width:
                    40,

                height:
                    40,

                health:
                    4,

                maxHealth:
                    4,

                color:
                    "blue",

                knockbackResistance:
                    1.5,

                anesthesiologistState:
                    "orbit",

                orbitAngle:
                    angle,

                orbitRadius:
                    135,

                orbitSpeed:
                    0.012,

                orbitMoveSpeed:
                    2.15,

                returnSpeed:
                    3,

                dashSpeed:
                    5.35,

                dashDuration:
                    70,

                dashX:
                    0,

                dashY:
                    0,

                attackTargetX:
                    0,

                attackTargetY:
                    0,

                stateTimer:
                    0,

                windupDuration:
                    36,

                anesthesiaUsedThisDash:
                    false
            })
        );
    }

    // Esperan un poco antes de realizar la primera entrada.
    boss.assistantCommandTimer =
        Math.min(
            boss.assistantCommandTimer,
            48
        );
}
// ============================================================================
// COLISIÓN BALA / CUA CUA
// ============================================================================

function checkBossCollision() {

    if (
        !boss.active ||
        boss.defeated
    ) {
        return;
    }

    bullets.forEach(
        (bullet, bulletIndex) => {

            if (
                bullet.x <
                    boss.x +
                    boss.width &&

                bullet.x +
                    bullet.width >
                    boss.x &&

                bullet.y <
                    boss.y +
                    boss.height &&

                bullet.y +
                    bullet.height >
                    boss.y
            ) {

                boss.health--;

                bullets.splice(
                    bulletIndex,
                    1
                );

                if (boss.health <= 0) {

                    boss.health = 0;

                    boss.defeated = true;
                    boss.active = false;

                    rooms[5].cleared = true;
                    // Retirar asistentes al terminar la pelea.
for (
    let enemyIndex = enemies.length - 1;
    enemyIndex >= 0;
    enemyIndex--
) {

    if (enemies[enemyIndex].bossAssistant) {

        enemies.splice(
            enemyIndex,
            1
        );
    }
}


                    // ========================================================
                    // DROPS DE CUA CUA
                    // ========================================================

                    dropFullHeart(
                        boss.x + 10,
                        boss.y + boss.height / 2 - 10
                    );

                    dropBoomerang(
                        boss.x + boss.width / 2 - 10,
                        boss.y + boss.height / 2 - 10
                    );

                    dropBoomerang(
                        boss.x + boss.width - 30,
                        boss.y + boss.height / 2 - 10
                    );


                    showVictory();
                }
            }
        }
    );
}


// ============================================================================
// VICTORIA
// ============================================================================

function showVictory() {

    victory = true;
}


// ============================================================================
// DIBUJAR CUA CUA
// ============================================================================

function drawBoss() {

    if (
        !boss.active ||
        boss.defeated
    ) {
        return;
    }


    // Cuerpo
    ctx.fillStyle = "yellow";

    ctx.fillRect(
        boss.x,
        boss.y,
        boss.width,
        boss.height
    );


    // Ojos
    ctx.fillStyle = "black";

    ctx.fillRect(
        boss.x + 15,
        boss.y + 15,
        10,
        10
    );

    ctx.fillRect(
        boss.x + 55,
        boss.y + 15,
        10,
        10
    );


    // Pico
    ctx.fillStyle = "orange";

    ctx.fillRect(
        boss.x + 25,
        boss.y + 40,
        30,
        15
    );


    // Nombre
    ctx.fillStyle = "white";

    ctx.font =
        "bold 20px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "CUA CUA",
        boss.x +
            boss.width / 2,
        boss.y - 10
    );

    ctx.textAlign =
        "left";
}


// ============================================================================
// BARRA DE VIDA DE CUA CUA
// ============================================================================

function drawBossHealth() {

    if (
        !boss.active ||
        boss.defeated
    ) {
        return;
    }

    const barWidth = 400;
    const barHeight = 20;

    const x =
        canvas.width / 2 -
        barWidth / 2;

    const y = 50;


    // Fondo
    ctx.fillStyle = "black";

    ctx.fillRect(
        x,
        y,
        barWidth,
        barHeight
    );


    // Vida
    ctx.fillStyle = "red";

    const healthWidth =
        barWidth *
        (
            boss.health /
            boss.maxHealth
        );

    ctx.fillRect(
        x,
        y,
        healthWidth,
        barHeight
    );


    ctx.strokeStyle = "white";

    ctx.strokeRect(
        x,
        y,
        barWidth,
        barHeight
    );
}
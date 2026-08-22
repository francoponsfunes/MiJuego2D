// ============================================================================
// ENEMIES.JS
// Enemigos, spawns, movimiento, IA y renderizado
// ============================================================================


// ============================================================================
// ESTADO DE ENEMIGOS
// ============================================================================

let hospitalOrderUntil = 0;


// ============================================================================
// BALANCE DE SALA 2
// ============================================================================

const ROOM_2_SPEED_MULTIPLIER = 1.20;
const ROOM_3_LEPER_SPEED_MULTIPLIER = 1.10;

function getRoomSpeedMultiplier() {

    return currentRoom === 2
        ? ROOM_2_SPEED_MULTIPLIER
        : 1;
}

function getLeperSpeedMultiplier() {

    if (currentRoom === 2) {
        return ROOM_2_SPEED_MULTIPLIER;
    }

    if (currentRoom === 3) {
        return ROOM_3_LEPER_SPEED_MULTIPLIER;
    }

    return 1;
}


// ============================================================================
// LISTA DE ENEMIGOS
// ============================================================================

const enemies = [];


// ============================================================================
// CREAR ENEMIGO BASE
// ============================================================================

function createEnemy(config) {

    return {

        width: 40,
        height: 40,

        touchingPlayer: false,

        knockbackResistance: 1,

        knockbackX: 0,
        knockbackY: 0,

        ...config
    };
}


// ============================================================================
// CREAR VARIOS ENEMIGOS IGUALES
// ============================================================================

function spawnEnemyGroup(amount, configFactory) {

    for (let i = 0; i < amount; i++) {

        enemies.push(
            createEnemy(
                configFactory(i)
            )
        );
    }
}


// ============================================================================
// CONFIGURACIÓN DEL LEPROSO
// ============================================================================

function createLeperConfig(index = 0) {

    return {

        type: "leper",

        x:
            Math.random() *
            (canvas.width - 40),

        y:
            Math.random() *
            (canvas.height - 40),

        speed: 1.45,

        health: 4,
        maxHealth: 4,

        color: "red",

        flankSide:
            index % 2 === 0
                ? -1
                : 1,

        leperState: "chase",

        leperTimer:
            180 +
            Math.random() * 120,

        rushX: 0,
        rushY: 0
    };
}


// ============================================================================
// ACTUALIZAR LEPROSO
// ============================================================================

function updateLeper(enemy, deltaTime) {

    const enemyCenterX =
        enemy.x +
        enemy.width / 2;

    const enemyCenterY =
        enemy.y +
        enemy.height / 2;

    const playerCenterX =
        player.x +
        player.width / 2;

    const playerCenterY =
        player.y +
        player.height / 2;

    const dx =
        playerCenterX -
        enemyCenterX;

    const dy =
        playerCenterY -
        enemyCenterY;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        ) || 1;

    const directionX =
        dx / distance;

    const directionY =
        dy / distance;

    const orderMultiplier =
        performance.now() < hospitalOrderUntil
            ? 1.6
            : 1;

    const roomSpeedMultiplier =
        getLeperSpeedMultiplier();

    if (enemy.leperState === "chase") {

        enemy.leperTimer -=
            deltaTime;

        if (
            enemy.leperTimer <= 0 &&
            distance > 90 &&
            distance < 320
        ) {

            enemy.leperState = "windup";
            enemy.leperTimer = 18;

            return;
        }

        if (enemy.leperTimer <= 0) {
            enemy.leperTimer = 45;
        }

        let speed =
            enemy.speed *
            orderMultiplier *
            roomSpeedMultiplier;

        if (distance > 220) {
            speed *= 1.15;
        }

        if (distance < 80) {
            speed *= 0.80;
        }

        const flankDistance = 28;

        const flankX =
            -directionY *
            enemy.flankSide *
            flankDistance;

        const flankY =
            directionX *
            enemy.flankSide *
            flankDistance;

        const targetX =
            playerCenterX +
            flankX;

        const targetY =
            playerCenterY +
            flankY;

        const moveX =
            targetX -
            enemyCenterX;

        const moveY =
            targetY -
            enemyCenterY;

        const moveDistance =
            Math.sqrt(
                moveX * moveX +
                moveY * moveY
            ) || 1;

        enemy.x +=
            (moveX / moveDistance) *
            speed *
            deltaTime;

        enemy.y +=
            (moveY / moveDistance) *
            speed *
            deltaTime;

        return;
    }

    if (enemy.leperState === "windup") {

        enemy.leperTimer -=
            deltaTime;

        enemy.x +=
            directionX *
            enemy.speed *
            roomSpeedMultiplier *
            0.20 *
            deltaTime;

        enemy.y +=
            directionY *
            enemy.speed *
            roomSpeedMultiplier *
            0.20 *
            deltaTime;

        if (enemy.leperTimer <= 0) {

            enemy.rushX =
                directionX;

            enemy.rushY =
                directionY;

            enemy.leperState =
                "rush";

            enemy.leperTimer =
                28;
        }

        return;
    }

    if (enemy.leperState === "rush") {

        enemy.leperTimer -=
            deltaTime;

        const rushSpeed =
            enemy.speed *
            1.55 *
            orderMultiplier *
            roomSpeedMultiplier;

        enemy.x +=
            enemy.rushX *
            rushSpeed *
            deltaTime;

        enemy.y +=
            enemy.rushY *
            rushSpeed *
            deltaTime;

        if (enemy.leperTimer <= 0) {

            enemy.leperState =
                "chase";

            enemy.leperTimer =
                180 +
                Math.random() * 120;
        }
    }
}


// ============================================================================
// ACTUALIZAR DOCTOR LOCO
// ============================================================================

function updateDoctor(enemy, deltaTime) {

    const enemyCenterX =
        enemy.x +
        enemy.width / 2;

    const enemyCenterY =
        enemy.y +
        enemy.height / 2;

    const playerCenterX =
        player.x +
        player.width / 2;

    const playerCenterY =
        player.y +
        player.height / 2;

    const dx =
        playerCenterX -
        enemyCenterX;

    const dy =
        playerCenterY -
        enemyCenterY;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        ) || 1;

    const directionX =
        dx / distance;

    const directionY =
        dy / distance;

    const doctorSpeed =
        enemy.moveSpeed *
        getRoomSpeedMultiplier();

    enemy.doctorMoveTimer -=
        deltaTime;

    if (enemy.doctorMoveTimer <= 0) {

        enemy.strafeDirection *= -1;

        enemy.doctorMoveTimer =
            90 +
            Math.random() * 90;
    }

    const attacking =
        enemy.attackState === "windup" ||
        enemy.attackState === "burst";

    if (!attacking) {

        if (distance < 150) {

            enemy.x -=
                directionX *
                doctorSpeed *
                1.25 *
                deltaTime;

            enemy.y -=
                directionY *
                doctorSpeed *
                1.25 *
                deltaTime;

        } else if (distance > 280) {

            enemy.x +=
                directionX *
                doctorSpeed *
                deltaTime;

            enemy.y +=
                directionY *
                doctorSpeed *
                deltaTime;

        } else {

            const strafeX =
                -directionY *
                enemy.strafeDirection;

            const strafeY =
                directionX *
                enemy.strafeDirection;

            enemy.x +=
                strafeX *
                doctorSpeed *
                deltaTime;

            enemy.y +=
                strafeY *
                doctorSpeed *
                deltaTime;

            const distanceDifference =
                distance -
                enemy.preferredDistance;

            enemy.x +=
                directionX *
                distanceDifference *
                0.004 *
                deltaTime;

            enemy.y +=
                directionY *
                distanceDifference *
                0.004 *
                deltaTime;
        }
    }

    if (enemy.attackState === "cooldown") {

        enemy.attackTimer -=
            deltaTime;

        if (enemy.attackTimer <= 0) {

            enemy.attackState =
                "windup";

            enemy.attackTimer =
                24;
        }

        return;
    }

    if (enemy.attackState === "windup") {

        enemy.attackTimer -=
            deltaTime;

        if (enemy.attackTimer <= 0) {

            enemy.attackState =
                "burst";

            enemy.shotsRemaining =
                2;

            enemy.burstTimer =
                0;
        }

        return;
    }

    if (enemy.attackState === "burst") {

        enemy.burstTimer -=
            deltaTime;

        if (
            enemy.burstTimer <= 0 &&
            enemy.shotsRemaining > 0
        ) {

            shootEnemyProjectile(
                enemy
            );

            enemy.shotsRemaining--;

            enemy.burstTimer =
                10;
        }

        if (enemy.shotsRemaining <= 0) {

            enemy.attackState =
                "cooldown";

            enemy.attackTimer =
                90 +
                Math.random() * 25;
        }
    }
}


// ============================================================================
// ACTUALIZAR ENFERMERA
// ============================================================================

function updateNurse(enemy, deltaTime) {

    const roomSpeedMultiplier =
        getRoomSpeedMultiplier();

    const doctor =
        enemies.find(
            (otherEnemy) =>
                otherEnemy.type === "doctor"
        );

    if (!doctor) {

        const dx =
            player.x -
            enemy.x;

        const dy =
            player.y -
            enemy.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            ) || 1;

        const chaseSpeed =
            enemy.speed *
            roomSpeedMultiplier;

        enemy.x +=
            (dx / distance) *
            chaseSpeed *
            deltaTime;

        enemy.y +=
            (dy / distance) *
            chaseSpeed *
            deltaTime;

        return;
    }

    enemy.roleTimer -=
        deltaTime;

    if (enemy.roleTimer <= 0) {

        if (enemy.nurseRole === "guard") {

            enemy.nurseRole =
                "hunter";

            enemy.hunterBoostTimer =
                60;

        } else {

            enemy.nurseRole =
                "guard";

            enemy.hunterBoostTimer =
                0;
        }

        enemy.roleTimer =
            210 +
            Math.random() * 30;
    }

    if (enemy.nurseRole === "guard") {

        const doctorCenterX =
            doctor.x +
            doctor.width / 2;

        const doctorCenterY =
            doctor.y +
            doctor.height / 2;

        const playerCenterX =
            player.x +
            player.width / 2;

        const playerCenterY =
            player.y +
            player.height / 2;

        const dx =
            playerCenterX -
            doctorCenterX;

        const dy =
            playerCenterY -
            doctorCenterY;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            ) || 1;

        const targetX =
            doctorCenterX +
            (dx / distance) * 70;

        const targetY =
            doctorCenterY +
            (dy / distance) * 70;

        const moveX =
            targetX -
            enemy.x;

        const moveY =
            targetY -
            enemy.y;

        const moveDistance =
            Math.sqrt(
                moveX * moveX +
                moveY * moveY
            ) || 1;

        const guardSpeed =
            1.45 *
            roomSpeedMultiplier;

        enemy.x +=
            (moveX / moveDistance) *
            guardSpeed *
            deltaTime;

        enemy.y +=
            (moveY / moveDistance) *
            guardSpeed *
            deltaTime;

        return;
    }

    if (enemy.nurseRole === "hunter") {

        const dx =
            player.x -
            enemy.x;

        const dy =
            player.y -
            enemy.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            ) || 1;

        let hunterSpeed =
            1.8 *
            roomSpeedMultiplier;

        if (enemy.hunterBoostTimer > 0) {

            enemy.hunterBoostTimer -=
                deltaTime;

            hunterSpeed =
                2.25 *
                roomSpeedMultiplier;
        }

        enemy.x +=
            (dx / distance) *
            hunterSpeed *
            deltaTime;

        enemy.y +=
            (dy / distance) *
            hunterSpeed *
            deltaTime;
    }
}


// ============================================================================
// ACTUALIZAR ANESTESIÓLOGO
// ============================================================================

function updateAnesthesiologist(enemy, deltaTime) {

    const enemyCenterX =
        enemy.x +
        enemy.width / 2;

    const enemyCenterY =
        enemy.y +
        enemy.height / 2;

    const playerCenterX =
        player.x +
        player.width / 2;

    const playerCenterY =
        player.y +
        player.height / 2;

    const dx =
        playerCenterX -
        enemyCenterX;

    const dy =
        playerCenterY -
        enemyCenterY;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        ) || 1;

    const directionX =
        dx / distance;

    const directionY =
        dy / distance;

    if (enemy.anesthesiologistState === "harass") {

        enemy.attackTimer -=
            deltaTime;

        enemy.repositionTimer -=
            deltaTime;

        if (enemy.repositionTimer <= 0) {

            enemy.orbitDirection *= -1;

            enemy.repositionTimer =
                24 +
                Math.random() * 28;
        }

        const orbitX =
            -directionY *
            enemy.orbitDirection;

        const orbitY =
            directionX *
            enemy.orbitDirection;

        const distanceDifference =
            distance -
            enemy.preferredDistance;

        let radialCorrection =
            distanceDifference /
            enemy.preferredDistance;

        radialCorrection =
            Math.max(
                -1,
                Math.min(
                    1,
                    radialCorrection
                )
            );

        let moveX =
            orbitX +
            directionX *
            radialCorrection *
            1.30;

        let moveY =
            orbitY +
            directionY *
            radialCorrection *
            1.30;

        const moveDistance =
            Math.sqrt(
                moveX * moveX +
                moveY * moveY
            ) || 1;

        moveX /=
            moveDistance;

        moveY /=
            moveDistance;

        enemy.x +=
            moveX *
            enemy.harassSpeed *
            deltaTime;

        enemy.y +=
            moveY *
            enemy.harassSpeed *
            deltaTime;

        if (distance > 300) {

            enemy.x +=
                directionX *
                enemy.harassSpeed *
                0.75 *
                deltaTime;

            enemy.y +=
                directionY *
                enemy.harassSpeed *
                0.75 *
                deltaTime;
        }

        if (
            enemy.attackTimer <= 0 &&
            distance > 55 &&
            distance < 410
        ) {

            enemy.anesthesiologistState =
                "windup";

            enemy.stateTimer =
                enemy.windupDuration;

            enemy.willFake =
                Math.random() <
                enemy.fakeChance;

            return;
        }

        if (enemy.attackTimer <= 0) {
            enemy.attackTimer = 12;
        }

        return;
    }

    if (enemy.anesthesiologistState === "windup") {

        enemy.stateTimer -=
            deltaTime;

        enemy.x +=
            -directionY *
            enemy.orbitDirection *
            enemy.harassSpeed *
            0.28 *
            deltaTime;

        enemy.y +=
            directionX *
            enemy.orbitDirection *
            enemy.harassSpeed *
            0.28 *
            deltaTime;

        if (enemy.stateTimer <= 0) {

            if (enemy.willFake) {

                enemy.anesthesiologistState =
                    "fakeout";

                enemy.stateTimer =
                    enemy.fakeDuration;

                enemy.fakeDirection =
                    Math.random() < 0.5
                        ? -1
                        : 1;

                return;
            }

            enemy.dashX =
                directionX;

            enemy.dashY =
                directionY;

            enemy.anesthesiaUsedThisDash =
                false;

            enemy.anesthesiologistState =
                "dash";

            enemy.stateTimer =
                enemy.dashDuration;
        }

        return;
    }

    if (enemy.anesthesiologistState === "fakeout") {

        enemy.stateTimer -=
            deltaTime;

        const fakeX =
            -directionY *
            enemy.fakeDirection;

        const fakeY =
            directionX *
            enemy.fakeDirection;

        enemy.x +=
            fakeX *
            enemy.fakeSpeed *
            deltaTime;

        enemy.y +=
            fakeY *
            enemy.fakeSpeed *
            deltaTime;

        if (enemy.stateTimer <= 0) {

            const newEnemyCenterX =
                enemy.x +
                enemy.width / 2;

            const newEnemyCenterY =
                enemy.y +
                enemy.height / 2;

            const newDx =
                playerCenterX -
                newEnemyCenterX;

            const newDy =
                playerCenterY -
                newEnemyCenterY;

            const newDistance =
                Math.sqrt(
                    newDx * newDx +
                    newDy * newDy
                ) || 1;

            enemy.dashX =
                newDx /
                newDistance;

            enemy.dashY =
                newDy /
                newDistance;

            enemy.anesthesiaUsedThisDash =
                false;

            enemy.anesthesiologistState =
                "dash";

            enemy.stateTimer =
                enemy.dashDuration;
        }

        return;
    }

    if (enemy.anesthesiologistState === "dash") {

        enemy.stateTimer -=
            deltaTime;

        enemy.x +=
            enemy.dashX *
            enemy.dashSpeed *
            deltaTime;

        enemy.y +=
            enemy.dashY *
            enemy.dashSpeed *
            deltaTime;

        const hitWall =
            enemy.x <= 20 ||
            enemy.y <= 20 ||
            enemy.x + enemy.width >= canvas.width - 20 ||
            enemy.y + enemy.height >= canvas.height - 20;

        if (
            enemy.stateTimer <= 0 ||
            hitWall
        ) {

            enemy.anesthesiologistState =
                "retreat";

            enemy.stateTimer =
                enemy.retreatDuration;
        }

        return;
    }

    if (enemy.anesthesiologistState === "retreat") {

        enemy.stateTimer -=
            deltaTime;

        enemy.x -=
            directionX *
            enemy.retreatSpeed *
            deltaTime;

        enemy.y -=
            directionY *
            enemy.retreatSpeed *
            deltaTime;

        if (enemy.stateTimer <= 0) {

            enemy.anesthesiologistState =
                "harass";

            enemy.attackTimer =
                38 +
                Math.random() * 28;

            enemy.repositionTimer =
                20 +
                Math.random() * 30;

            if (Math.random() < 0.80) {
                enemy.orbitDirection *= -1;
            }
        }
    }
}


// ============================================================================
// ACTUALIZAR TRAUMATÓLOGO
// ============================================================================

function updateTraumatologist(enemy, deltaTime) {

    const enemyCenterX =
        enemy.x +
        enemy.width / 2;

    const enemyCenterY =
        enemy.y +
        enemy.height / 2;

    const playerCenterX =
        player.x +
        player.width / 2;

    const playerCenterY =
        player.y +
        player.height / 2;

    const dx =
        playerCenterX -
        enemyCenterX;

    const dy =
        playerCenterY -
        enemyCenterY;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        ) || 1;

    const directionX =
        dx / distance;

    const directionY =
        dy / distance;

    const enraged =
        enemy.health <=
        enemy.maxHealth * 0.50;

    enemy.enraged =
        enraged;

    const normalSpeed =
        enraged
            ? enemy.enragedSpeed
            : enemy.normalSpeed;

    const marchSpeed =
        enraged
            ? enemy.enragedMarchSpeed
            : enemy.marchSpeed;

    const chargeSpeed =
        enraged
            ? enemy.enragedChargeSpeed
            : enemy.chargeSpeed;

    const slamRadius =
        enraged
            ? enemy.enragedSlamRadius
            : enemy.slamRadius;

    enemy.currentSlamRadius =
        slamRadius;

    if (enemy.traumaState === "chase") {

        enemy.attackCooldownTimer -=
            deltaTime;

        const movementSpeed =
            distance > 245
                ? marchSpeed
                : normalSpeed;

        enemy.x +=
            directionX *
            movementSpeed *
            deltaTime;

        enemy.y +=
            directionY *
            movementSpeed *
            deltaTime;

        if (enemy.attackCooldownTimer <= 0) {

            if (distance <= enemy.slamTriggerDistance) {

                enemy.traumaState =
                    "slamWindup";

                enemy.stateTimer =
                    enraged
                        ? 22
                        : 28;

                enemy.slamHitThisAttack =
                    false;

                return;
            }

            if (distance <= enemy.chargeTriggerDistance) {

                enemy.traumaState =
                    "chargeWindup";

                enemy.stateTimer =
                    enraged
                        ? 23
                        : 30;

                enemy.attackHitThisStrike =
                    false;

                return;
            }
        }

        return;
    }

    if (enemy.traumaState === "chargeWindup") {

        enemy.stateTimer -=
            deltaTime;

        if (enemy.stateTimer <= 0) {

            enemy.chargeX =
                directionX;

            enemy.chargeY =
                directionY;

            enemy.attackHitThisStrike =
                false;

            enemy.traumaState =
                "charge";

            enemy.stateTimer =
                enraged
                    ? 20
                    : 21;
        }

        return;
    }

    if (enemy.traumaState === "charge") {

        enemy.stateTimer -=
            deltaTime;

        enemy.x +=
            enemy.chargeX *
            chargeSpeed *
            deltaTime;

        enemy.y +=
            enemy.chargeY *
            chargeSpeed *
            deltaTime;

        const hitWall =
            enemy.x <= 20 ||
            enemy.y <= 20 ||
            enemy.x + enemy.width >= canvas.width - 20 ||
            enemy.y + enemy.height >= canvas.height - 20;

        if (hitWall) {

            enemy.traumaState =
                "stunned";

            enemy.stateTimer =
                enraged
                    ? 44
                    : 54;

            return;
        }

        if (enemy.stateTimer <= 0) {

            enemy.traumaState =
                "recovery";

            enemy.stateTimer =
                enraged
                    ? 16
                    : 22;
        }

        return;
    }

    if (enemy.traumaState === "slamWindup") {

        enemy.stateTimer -=
            deltaTime;

        if (enemy.stateTimer <= 0) {

            enemy.traumaState =
                "slamActive";

            enemy.stateTimer =
                8;

            enemy.slamHitThisAttack =
                false;
        }

        return;
    }

    if (enemy.traumaState === "slamActive") {

        enemy.stateTimer -=
            deltaTime;

        if (enemy.stateTimer <= 0) {

            enemy.traumaState =
                "recovery";

            enemy.stateTimer =
                enraged
                    ? 16
                    : 23;
        }

        return;
    }

    if (enemy.traumaState === "stunned") {

        enemy.stateTimer -=
            deltaTime;

        if (enemy.stateTimer <= 0) {

            enemy.traumaState =
                "chase";

            enemy.attackCooldownTimer =
                enraged
                    ? 42
                    : 55;
        }

        return;
    }

    if (enemy.traumaState === "recovery") {

        enemy.stateTimer -=
            deltaTime;

        if (enemy.stateTimer <= 0) {

            enemy.traumaState =
                "chase";

            enemy.attackCooldownTimer =
                enraged
                    ? 44 + Math.random() * 25
                    : 58 + Math.random() * 32;
        }
    }
}
// ============================================================================
// ANESTESIÓLOGO ASISTENTE DE CUA CUA
// ============================================================================

function moveBossAssistantToward(
    enemy,
    targetX,
    targetY,
    speed,
    deltaTime
) {

    const dx =
        targetX -
        (enemy.x + enemy.width / 2);

    const dy =
        targetY -
        (enemy.y + enemy.height / 2);

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        ) || 1;

    enemy.x +=
        (dx / distance) *
        speed *
        deltaTime;

    enemy.y +=
        (dy / distance) *
        speed *
        deltaTime;

    return distance;
}


function updateBossAnesthesiologist(enemy, deltaTime) {

    if (
        !boss.active ||
        boss.defeated
    ) {
        return;
    }

    enemy.orbitAngle +=
        enemy.orbitSpeed *
        deltaTime;

    const bossCenterX =
        boss.x + boss.width / 2;

    const bossCenterY =
        boss.y + boss.height / 2;

    const orbitTargetX =
        bossCenterX +
        Math.cos(enemy.orbitAngle) *
        enemy.orbitRadius;

    const orbitTargetY =
        bossCenterY +
        Math.sin(enemy.orbitAngle) *
        enemy.orbitRadius;


    // Formación alrededor de Cua Cua.
    if (enemy.anesthesiologistState === "orbit") {

        moveBossAssistantToward(
            enemy,
            orbitTargetX,
            orbitTargetY,
            enemy.orbitMoveSpeed,
            deltaTime
        );

        return;
    }


    // Aviso antes de atacar.
    if (enemy.anesthesiologistState === "windup") {

        enemy.stateTimer -=
            deltaTime;

        moveBossAssistantToward(
            enemy,
            orbitTargetX,
            orbitTargetY,
            enemy.orbitMoveSpeed * 0.22,
            deltaTime
        );

        if (enemy.stateTimer <= 0) {

            const enemyCenterX =
                enemy.x + enemy.width / 2;

            const enemyCenterY =
                enemy.y + enemy.height / 2;

            const dashDx =
                enemy.attackTargetX -
                enemyCenterX;

            const dashDy =
                enemy.attackTargetY -
                enemyCenterY;

            const dashDistance =
                Math.sqrt(
                    dashDx * dashDx +
                    dashDy * dashDy
                ) || 1;

            enemy.dashX =
                dashDx / dashDistance;

            enemy.dashY =
                dashDy / dashDistance;

            enemy.anesthesiologistState =
                "dash";

            enemy.stateTimer =
                enemy.dashDuration;

            enemy.anesthesiaUsedThisDash =
                false;
        }

        return;
    }

// Anestesiólogos asistentes de Cua Cua.
if (
    enemy.type === "anesthesiologist" &&
    enemy.bossAssistant
) {

    const centerX =
        enemy.x + enemy.width / 2;

    const centerY =
        enemy.y + enemy.height / 2;

    const bossCenterX =
        boss.x + boss.width / 2;

    const bossCenterY =
        boss.y + boss.height / 2;


    // Vínculo visual con Cua Cua.
    if (
        enemy.anesthesiologistState === "orbit" ||
        enemy.anesthesiologistState === "return"
    ) {

        ctx.beginPath();

        ctx.moveTo(
            centerX,
            centerY
        );

        ctx.lineTo(
            bossCenterX,
            bossCenterY
        );

        ctx.strokeStyle =
            "rgba(90, 210, 255, 0.28)";

        ctx.lineWidth =
            2;

        ctx.stroke();
    }


    // Trayectoria anunciada.
    if (enemy.anesthesiologistState === "windup") {

        const warningProgress =
            1 -
            enemy.stateTimer /
            enemy.windupDuration;

        ctx.strokeStyle =
            "white";

        ctx.lineWidth =
            3;

        ctx.strokeRect(
            enemy.x - 5,
            enemy.y - 5,
            enemy.width + 10,
            enemy.height + 10
        );

        ctx.beginPath();

        ctx.moveTo(
            centerX,
            centerY
        );

        ctx.lineTo(
            enemy.attackTargetX,
            enemy.attackTargetY
        );

        ctx.strokeStyle =
            "rgba(120, 225, 255, 0.9)";

        ctx.lineWidth =
            3;

        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
            enemy.attackTargetX,
            enemy.attackTargetY,
            Math.max(
                5,
                18 * (1 - warningProgress)
            ),
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "white";

        ctx.lineWidth =
            2;

        ctx.stroke();
    }


    if (enemy.anesthesiologistState === "dash") {

        ctx.strokeStyle =
            "rgba(120, 225, 255, 1)";

        ctx.lineWidth =
            4;

        ctx.strokeRect(
            enemy.x - 4,
            enemy.y - 4,
            enemy.width + 8,
            enemy.height + 8
        );
    }
}
    // Entrada recta hacia la posición marcada.
    if (enemy.anesthesiologistState === "dash") {

        enemy.stateTimer -=
            deltaTime;

        enemy.x +=
            enemy.dashX *
            enemy.dashSpeed *
            deltaTime;

        enemy.y +=
            enemy.dashY *
            enemy.dashSpeed *
            deltaTime;

        const hitWall =
            enemy.x <= 20 ||
            enemy.y <= 20 ||
            enemy.x + enemy.width >= canvas.width - 20 ||
            enemy.y + enemy.height >= canvas.height - 20;

        if (
            enemy.stateTimer <= 0 ||
            hitWall
        ) {

            enemy.anesthesiologistState =
                "return";
        }

        return;
    }


    // Regreso a la formación.
    if (enemy.anesthesiologistState === "return") {

        const returnDistance =
            moveBossAssistantToward(
                enemy,
                orbitTargetX,
                orbitTargetY,
                enemy.returnSpeed,
                deltaTime
            );

        if (returnDistance <= 24) {

            enemy.anesthesiologistState =
                "orbit";
        }

        return;
    }

    enemy.anesthesiologistState =
        "orbit";
}
// ============================================================================
// DIRECCIÓN NORMALIZADA HACIA EL JUGADOR
// ============================================================================

function getEnemyDirectionToPlayer(enemy) {

    const enemyCenterX =
        enemy.x + enemy.width / 2;

    const enemyCenterY =
        enemy.y + enemy.height / 2;

    const playerCenterX =
        player.x + player.width / 2;

    const playerCenterY =
        player.y + player.height / 2;

    const dx =
        playerCenterX - enemyCenterX;

    const dy =
        playerCenterY - enemyCenterY;

    const distance =
        Math.sqrt(dx * dx + dy * dy) || 1;

    return {
        directionX: dx / distance,
        directionY: dy / distance,
        distance: distance
    };
}


// ============================================================================
// RITMO DE LA SALA 4
// ============================================================================

function getRoom4Phase(director) {

    const staffAlive =
        enemies.filter((enemy) =>
            enemy.type === "aggressiveNurse" ||
            enemy.type === "surgeon"
        ).length;

    if (
        director.health <= 6 ||
        staffAlive === 0
    ) {
        return 3;
    }

    if (
        director.health <= 12 ||
        staffAlive <= 2
    ) {
        return 2;
    }

    return 1;
}


function commandRoom4Staff(director, phase) {

    const nurses =
        enemies.filter((enemy) =>
            enemy.type === "aggressiveNurse"
        );

    nurses.forEach((nurse, index) => {

        nurse.commandDelay =
            8 +
            index *
            (
                phase >= 2
                    ? 23
                    : 30
            );
    });

    const surgeon =
        enemies.find((enemy) =>
            enemy.type === "surgeon"
        );

    if (surgeon) {

        surgeon.commandVolleyState =
            "windup";

        surgeon.commandVolleyTimer =
            phase === 1
                ? 34
                : phase === 2
                    ? 27
                    : 22;

        surgeon.commandVolleySpread =
            phase >= 2
                ? 0.24
                : 0.20;
    }

    director.commandsIssued++;
}


function getDirectorRecoveryDuration(phase) {

    if (phase === 3) {
        return 28;
    }

    if (phase === 2) {
        return 36;
    }

    return 46;
}


function getDirectorAttackInterval(phase, nextAttack) {

    if (nextAttack === "charge") {

        return phase === 1
            ? 68
            : phase === 2
                ? 52
                : 38;
    }

    return phase === 1
        ? 104
        : phase === 2
            ? 82
            : 66;
}


// ============================================================================
// ACTUALIZAR ENFERMERA AGRESIVA
// ============================================================================

function updateAggressiveNurse(enemy, deltaTime) {

    const {
        directionX,
        directionY,
        distance
    } = getEnemyDirectionToPlayer(enemy);

    if (enemy.commandDelay !== null) {

        enemy.commandDelay -=
            deltaTime;

        if (enemy.commandDelay <= 0) {

            enemy.commandDelay =
                null;

            if (
                enemy.nurseState !== "windup" &&
                enemy.nurseState !== "rush"
            ) {

                enemy.nurseState =
                    "windup";

                enemy.nurseTimer =
                    Math.max(
                        18,
                        enemy.windupDuration - 3
                    );

                enemy.rushX =
                    directionX;

                enemy.rushY =
                    directionY;

                enemy.commandRushCount++;
            }
        }
    }

    const orderMultiplier =
        performance.now() < hospitalOrderUntil
            ? 1.18
            : 1;

    enemy.nurseTimer -=
        deltaTime;

    if (enemy.nurseState === "chase") {

        const movement =
            enemy.speed *
            orderMultiplier *
            deltaTime;

        enemy.x +=
            directionX * movement;

        enemy.y +=
            directionY * movement;

        if (enemy.nurseTimer <= 0) {

            if (distance > 85) {

                enemy.nurseState =
                    "windup";

                enemy.nurseTimer =
                    enemy.windupDuration;

                enemy.rushX =
                    directionX;

                enemy.rushY =
                    directionY;

            } else {

                enemy.nurseTimer =
                    35;
            }
        }

        return;
    }

    if (enemy.nurseState === "windup") {

        enemy.x -=
            directionX *
            0.18 *
            deltaTime;

        enemy.y -=
            directionY *
            0.18 *
            deltaTime;

        if (enemy.nurseTimer <= 0) {

            enemy.nurseState =
                "rush";

            enemy.nurseTimer =
                enemy.rushDuration;
        }

        return;
    }

    if (enemy.nurseState === "rush") {

        const rushMovement =
            enemy.rushSpeed *
            orderMultiplier *
            deltaTime;

        enemy.x +=
            enemy.rushX * rushMovement;

        enemy.y +=
            enemy.rushY * rushMovement;

        const hitWall =
            enemy.x <= 20 ||
            enemy.y <= 20 ||
            enemy.x + enemy.width >= canvas.width - 20 ||
            enemy.y + enemy.height >= canvas.height - 20;

        if (
            enemy.nurseTimer <= 0 ||
            hitWall
        ) {

            enemy.nurseState =
                "recover";

            enemy.nurseTimer =
                enemy.recoverDuration +
                Math.random() * 14;
        }

        return;
    }

    if (enemy.nurseState === "recover") {

        enemy.x -=
            directionX *
            enemy.recoverSpeed *
            deltaTime;

        enemy.y -=
            directionY *
            enemy.recoverSpeed *
            deltaTime;

        if (enemy.nurseTimer <= 0) {

            enemy.nurseState =
                "chase";

            enemy.nurseTimer =
                enemy.chaseDuration +
                Math.random() * 35;
        }
    }
}


// ============================================================================
// ACTUALIZAR CIRUJANO
// ============================================================================

function updateSurgeon(enemy, deltaTime) {

    const {
        directionX,
        directionY,
        distance
    } = getEnemyDirectionToPlayer(enemy);

    enemy.strafeTimer -=
        deltaTime;

    if (enemy.strafeTimer <= 0) {

        enemy.strafeDirection *=
            -1;

        enemy.strafeTimer =
            75 +
            Math.random() * 55;
    }

    let movementX =
        -directionY *
        enemy.strafeDirection;

    let movementY =
        directionX *
        enemy.strafeDirection;

    if (distance < enemy.minimumDistance) {

        movementX -=
            directionX * 1.15;

        movementY -=
            directionY * 1.15;

    } else if (distance > enemy.maximumDistance) {

        movementX +=
            directionX * 0.75;

        movementY +=
            directionY * 0.75;
    }

    const movementLength =
        Math.sqrt(
            movementX * movementX +
            movementY * movementY
        ) || 1;

    const preparingShot =
        enemy.commandVolleyState === "windup" ||
        enemy.shootTimer <=
            enemy.aimWarningDuration;

    const movementMultiplier =
        preparingShot
            ? 0.35
            : 1;

    enemy.movementX =
        (movementX / movementLength) *
        enemy.movementSpeed *
        movementMultiplier;

    enemy.movementY =
        (movementY / movementLength) *
        enemy.movementSpeed *
        movementMultiplier;

    enemy.x +=
        enemy.movementX *
        deltaTime;

    enemy.y +=
        enemy.movementY *
        deltaTime;

    if (enemy.commandVolleyState === "windup") {

        enemy.commandVolleyTimer -=
            deltaTime;

        if (enemy.commandVolleyTimer <= 0) {

            shootEnemyProjectile(
                enemy,
                "scalpel",
                -enemy.commandVolleySpread
            );

            shootEnemyProjectile(
                enemy,
                "scalpel"
            );

            shootEnemyProjectile(
                enemy,
                "scalpel",
                enemy.commandVolleySpread
            );

            enemy.commandVolleyState =
                "idle";

            enemy.commandVolleyCount++;

            enemy.shootTimer =
                Math.max(
                    enemy.shootTimer,
                    58
                );
        }

        return;
    }

    enemy.shootTimer -=
        deltaTime;

    if (enemy.shootTimer <= 0) {

        shootEnemyProjectile(
            enemy,
            "scalpel"
        );

        enemy.shootTimer =
            enemy.shootCooldown;
    }
}


// ============================================================================
// INSPECCIÓN DEL DIRECTOR
// ============================================================================

function updateDirectorPressure(enemy, deltaTime, phase) {

    enemy.pressureTimer -=
        deltaTime;

    if (enemy.pressureState === "cooldown") {

        const canStartInspection =
            enemy.directorState === "pursue";

        if (
            enemy.pressureTimer <= 0 &&
            canStartInspection
        ) {

            enemy.pressureState =
                "mark";

            enemy.pressureMarkDuration =
                phase === 1
                    ? 34
                    : phase === 2
                        ? 28
                        : 23;

            enemy.pressureTimer =
                enemy.pressureMarkDuration;

            enemy.pressureRadius =
                phase === 1
                    ? 64
                    : phase === 2
                        ? 72
                        : 80;

            enemy.pressureTargetX =
                player.x +
                player.width / 2;

            enemy.pressureTargetY =
                player.y +
                player.height / 2;

            enemy.pressureHit =
                false;
        }

        return;
    }

    if (enemy.pressureState === "mark") {

        if (enemy.pressureTimer <= 0) {

            enemy.pressureState =
                "active";

            enemy.pressureTimer =
                13;

            enemy.pressureHit =
                false;
        }

        return;
    }

    if (enemy.pressureState === "active") {

        if (enemy.pressureTimer <= 0) {

            enemy.pressureState =
                "cooldown";

            enemy.pressureTimer =
                phase === 1
                    ? 145
                    : phase === 2
                        ? 112
                        : 84;

            enemy.pressureHit =
                false;
        }
    }
}


// ============================================================================
// ACTUALIZAR DIRECTOR
// ============================================================================

function updateDirector(enemy, deltaTime) {

    const {
        directionX,
        directionY,
        distance
    } = getEnemyDirectionToPlayer(enemy);

    const previousPhase =
        enemy.room4Phase;

    enemy.room4Phase =
        getRoom4Phase(enemy);

    const phase =
        enemy.room4Phase;

    if (phase !== previousPhase) {

        enemy.phaseFlashUntil =
            performance.now() +
            900;

        enemy.attackTimer =
            Math.min(
                enemy.attackTimer,
                55
            );
    }

    updateDirectorPressure(
        enemy,
        deltaTime,
        phase
    );

    if (enemy.directorState === "pursue") {

        if (enemy.pressureState === "cooldown") {

            enemy.attackTimer -=
                deltaTime;
        }

        const pursuitSpeed =
            enemy.speed +
            (phase - 1) * 0.14;

        if (distance > 95) {

            enemy.x +=
                directionX *
                pursuitSpeed *
                deltaTime;

            enemy.y +=
                directionY *
                pursuitSpeed *
                deltaTime;
        }

        if (enemy.attackTimer <= 0) {

            const staffAlive =
                enemies.some((otherEnemy) =>
                    otherEnemy.type === "aggressiveNurse" ||
                    otherEnemy.type === "surgeon"
                );

            const canGiveOrder =
                enemy.nextAttack === "order" &&
                phase < 3 &&
                staffAlive;

            if (canGiveOrder) {

                enemy.directorState =
                    "orderWindup";

                enemy.stateTimer =
                    enemy.orderWindupDuration;

                enemy.nextAttack =
                    "charge";

            } else {

                enemy.directorState =
                    "chargeWindup";

                enemy.stateTimer =
                    Math.max(
                        24,
                        enemy.chargeWindupDuration -
                            (phase - 1) * 4
                    );

                enemy.chargeX =
                    directionX;

                enemy.chargeY =
                    directionY;

                enemy.chargeRepeatsRemaining =
                    phase === 3
                        ? 1
                        : 0;

                enemy.nextAttack =
                    phase === 3
                        ? "charge"
                        : "order";
            }
        }

        return;
    }

    if (enemy.directorState === "orderWindup") {

        enemy.stateTimer -=
            deltaTime;

        if (enemy.stateTimer <= 0) {

            hospitalOrderUntil =
                performance.now() +
                enemy.orderDuration +
                (phase - 1) * 250;

            commandRoom4Staff(
                enemy,
                phase
            );

            enemy.directorState =
                "orderActive";

            enemy.stateTimer =
                enemy.orderActiveDuration;
        }

        return;
    }

    if (enemy.directorState === "orderActive") {

        enemy.stateTimer -=
            deltaTime;

        if (enemy.stateTimer <= 0) {

            enemy.directorState =
                "recover";

            enemy.stateTimer =
                getDirectorRecoveryDuration(
                    phase
                );
        }

        return;
    }

    if (enemy.directorState === "chargeWindup") {

        enemy.stateTimer -=
            deltaTime;

        if (enemy.stateTimer <= 0) {

            enemy.directorState =
                "charge";

            enemy.stateTimer =
                enemy.chargeDuration +
                (phase - 1) * 2;

            enemy.currentChargeSpeed =
                enemy.chargeSpeed +
                (phase - 1) * 0.28;

            enemy.chargeHit =
                false;
        }

        return;
    }

    if (enemy.directorState === "charge") {

        enemy.stateTimer -=
            deltaTime;

        enemy.x +=
            enemy.chargeX *
            enemy.currentChargeSpeed *
            deltaTime;

        enemy.y +=
            enemy.chargeY *
            enemy.currentChargeSpeed *
            deltaTime;

        const hitWall =
            enemy.x <= 20 ||
            enemy.y <= 20 ||
            enemy.x + enemy.width >= canvas.width - 20 ||
            enemy.y + enemy.height >= canvas.height - 20;

        if (
            enemy.stateTimer <= 0 ||
            hitWall
        ) {

            if (enemy.chargeRepeatsRemaining > 0) {

                enemy.chargeRepeatsRemaining--;

                enemy.directorState =
                    "chargeWindup";

                enemy.stateTimer =
                    22;

                enemy.chargeX =
                    directionX;

                enemy.chargeY =
                    directionY;

            } else {

                enemy.directorState =
                    "recover";

                enemy.stateTimer =
                    getDirectorRecoveryDuration(
                        phase
                    );
            }
        }

        return;
    }

    if (enemy.directorState === "recover") {

        enemy.stateTimer -=
            deltaTime;

        if (enemy.stateTimer <= 0) {

            enemy.directorState =
                "pursue";

            enemy.attackTimer =
                getDirectorAttackInterval(
                    phase,
                    enemy.nextAttack
                ) +
                Math.random() * 22;
        }
    }
}


// ============================================================================
// ACTUALIZAR ENEMIGOS
// ============================================================================

function updateEnemies(deltaTime) {

    enemies.forEach((enemy) => {

        if (typeof enemy.knockbackX !== "number") {
            enemy.knockbackX = 0;
        }

        if (typeof enemy.knockbackY !== "number") {
            enemy.knockbackY = 0;
        }

        if (enemy.type === "leper") {

            updateLeper(
                enemy,
                deltaTime
            );

        } else if (enemy.type === "doctor") {

            updateDoctor(
                enemy,
                deltaTime
            );

        } else if (enemy.type === "nurse") {

    updateNurse(
        enemy,
        deltaTime
    );

} else if (
    enemy.type === "anesthesiologist" &&
    enemy.bossAssistant
) {

    updateBossAnesthesiologist(
        enemy,
        deltaTime
    );

} else if (
    enemy.type === "anesthesiologist" &&
    currentRoom === 3
) {

    updateAnesthesiologist(
        enemy,
        deltaTime
    );

} else if (enemy.type === "traumatologist") {
            updateTraumatologist(
                enemy,
                deltaTime
            );

        } else if (enemy.type === "aggressiveNurse") {

            updateAggressiveNurse(
                enemy,
                deltaTime
            );

        } else if (enemy.type === "surgeon") {

            updateSurgeon(
                enemy,
                deltaTime
            );

        } else if (enemy.type === "director") {

            updateDirector(
                enemy,
                deltaTime
            );

        } else if (enemy.type === "anesthesiologist") {

            let movementMultiplier =
                1;

            if (
                performance.now() <
                hospitalOrderUntil
            ) {
                movementMultiplier =
                    1.6;
            }

            const movement =
                enemy.speed *
                movementMultiplier *
                deltaTime;

            if (enemy.x < player.x) {
                enemy.x += movement;
            }

            if (enemy.x > player.x) {
                enemy.x -= movement;
            }

            if (enemy.y < player.y) {
                enemy.y += movement;
            }

            if (enemy.y > player.y) {
                enemy.y -= movement;
            }
        }

        enemy.x +=
            enemy.knockbackX *
            deltaTime;

        enemy.y +=
            enemy.knockbackY *
            deltaTime;

        enemy.knockbackX *=
            0.92;

        enemy.knockbackY *=
            0.92;

        if (enemy.x < 20) {

            enemy.x =
                20;

            if (enemy.type === "surgeon") {

                enemy.movementX =
                    Math.abs(
                        enemy.movementX
                    );

            } else {

                enemy.knockbackX =
                    0;
            }
        }

        if (enemy.y < 20) {

            enemy.y =
                20;

            if (enemy.type === "surgeon") {

                enemy.movementY =
                    Math.abs(
                        enemy.movementY
                    );

            } else {

                enemy.knockbackY =
                    0;
            }
        }

        if (
            enemy.x + enemy.width >
            canvas.width - 20
        ) {

            enemy.x =
                canvas.width -
                20 -
                enemy.width;

            if (enemy.type === "surgeon") {

                enemy.movementX =
                    -Math.abs(
                        enemy.movementX
                    );

            } else {

                enemy.knockbackX =
                    0;
            }
        }

        if (
            enemy.y + enemy.height >
            canvas.height - 20
        ) {

            enemy.y =
                canvas.height -
                20 -
                enemy.height;

            if (enemy.type === "surgeon") {

                enemy.movementY =
                    -Math.abs(
                        enemy.movementY
                    );

            } else {

                enemy.knockbackY =
                    0;
            }
        }
    });
}


// ============================================================================
// CREAR ENEMIGOS DE LA SALA
// ============================================================================
function spawnEnemies(amount) {

    // ========================================================================
    // SALA 2
    // ========================================================================

    if (currentRoom === 2) {

        spawnEnemyGroup(
            2,
            (i) =>
                createLeperConfig(i)
        );

        enemies.push(
            createEnemy({

                type: "doctor",

                x:
                    canvas.width / 2 -
                    25,

                y: 100,

                width: 50,
                height: 50,

                health: 12,
                maxHealth: 12,

                color: "purple",

                knockbackResistance: 4,

                moveSpeed:
                    1.15,

                preferredDistance:
                    210,

                doctorMoveTimer:
                    90 +
                    Math.random() * 90,

                strafeDirection:
                    Math.random() < 0.5
                        ? -1
                        : 1,

                attackState:
                    "cooldown",

                attackTimer:
                    65,

                shotsRemaining:
                    0,

                burstTimer:
                    0,

                nursesSpawned:
                    false
            })
        );

        return;
    }


    // ========================================================================
    // SALA 3
    // ========================================================================

    if (currentRoom === 3) {

        spawnEnemyGroup(
            2,
            (i) =>
                createLeperConfig(i)
        );

        enemies.push(
            createEnemy({

                type:
                    "anesthesiologist",

                x:
                    canvas.width -
                    120,

                y:
                    100,

                width:
                    40,

                height:
                    40,

                speed:
                    2.70,

                health:
                    5,

                maxHealth:
                    5,

                color:
                    "blue",

                knockbackResistance:
                    1.5,

                anesthesiologistState:
                    "harass",

                preferredDistance:
                    145,

                harassSpeed:
                    2.70,

                orbitDirection:
                    Math.random() < 0.5
                        ? -1
                        : 1,

                repositionTimer:
                    24 +
                    Math.random() * 28,

                attackTimer:
                    30 +
                    Math.random() * 24,

                windupDuration:
                    16,

                fakeChance:
                    0.45,

                willFake:
                    false,

                fakeDirection:
                    1,

                fakeSpeed:
                    4.0,

                fakeDuration:
                    12,

                dashSpeed:
                    6.0,

                dashDuration:
                    26,

                dashX:
                    0,

                dashY:
                    0,

                retreatSpeed:
                    3.4,

                retreatDuration:
                    16,

                stateTimer:
                    0,

                anesthesiaUsedThisDash:
                    false
            })
        );

        enemies.push(
            createEnemy({

                type:
                    "traumatologist",

                x:
                    canvas.width / 2 -
                    25,

                y:
                    100,

                width:
                    50,

                height:
                    50,

                health:
                    15,

                maxHealth:
                    15,

                color:
                    "orange",

                knockbackResistance:
                    3,

                normalSpeed:
                    2.40,

                enragedSpeed:
                    2.70,

                marchSpeed:
                    3.30,

                enragedMarchSpeed:
                    3.70,

                traumaState:
                    "chase",

                stateTimer:
                    0,

                attackCooldownTimer:
                    55,

                chargeTriggerDistance:
                    320,

                slamTriggerDistance:
                    125,

                chargeSpeed:
                    6.35,

                enragedChargeSpeed:
                    7.0,

                chargeX:
                    0,

                chargeY:
                    0,

                attackHitThisStrike:
                    false,

                slamRadius:
                    96,

                enragedSlamRadius:
                    112,

                currentSlamRadius:
                    96,

                slamHitThisAttack:
                    false,

                enraged:
                    false
            })
        );

        return;
    }


    // ========================================================================
    // SALA 4
    // ========================================================================

    if (currentRoom === 4) {

        // ====================================================================
        // ENFERMERAS AGRESIVAS
        // ====================================================================

        spawnEnemyGroup(
            2,
            (i) => ({

                type:
                    "aggressiveNurse",

                x:
                    canvas.width -
                    145,

                y:
                    i === 0
                        ? 120
                        : canvas.height - 160,

                speed:
                    1.65,

                health:
                    5,

                maxHealth:
                    5,

                color:
                    "green",

                nurseState:
                    "chase",

                nurseTimer:
                    65 +
                    i * 70 +
                    Math.random() * 12,

                chaseDuration:
                    82,

                windupDuration:
                    24,

                rushDuration:
                    22,

                recoverDuration:
                    42,

                rushSpeed:
                    3.60,

                recoverSpeed:
                    0.75,

                rushX:
                    0,

                rushY:
                    0,

                commandDelay:
                    null,

                commandRushCount:
                    0
            })
        );


        // ====================================================================
        // CIRUJANO
        // ====================================================================

        enemies.push(
            createEnemy({

                type:
                    "surgeon",

                x:
                    125,

                y:
                    100,

                width:
                    45,

                height:
                    45,

                speed:
                    0.8,

                health:
                    8,

                maxHealth:
                    8,

                color:
                    "yellow",

                knockbackResistance:
                    2,

                movementState:
                    "reposition",

                movementX:
                    0,

                movementY:
                    0,

                movementSpeed:
                    1.45,

                strafeDirection:
                    Math.random() < 0.5
                        ? -1
                        : 1,

                strafeTimer:
                    80,

                minimumDistance:
                    165,

                maximumDistance:
                    290,

                aimWarningDuration:
                    18,

                commandVolleyState:
                    "idle",

                commandVolleyTimer:
                    0,

                commandVolleySpread:
                    0.20,

                commandVolleyCount:
                    0,

                shootTimer:
                    120,

                shootCooldown:
                    128
            })
        );


        // ====================================================================
        // DIRECTOR
        // ====================================================================

        enemies.push(
            createEnemy({

                type:
                    "director",

                x:
                    canvas.width / 2 -
                    30,

                y:
                    90,

                width:
                    60,

                height:
                    60,

                speed:
                    1.15,

                health:
                    18,

                maxHealth:
                    18,

                color:
                    "orange",

                knockbackResistance:
                    4,

                attackCooldown:
                    950,

                lastAttackTime:
                    0,

                directorState:
                    "pursue",

                stateTimer:
                    0,

                attackTimer:
                    125,

                attackInterval:
                    105,

                room4Phase:
                    1,

                phaseFlashUntil:
                    0,

                commandsIssued:
                    0,

                pressureState:
                    "cooldown",

                pressureTimer:
                    80,

                pressureMarkDuration:
                    34,

                pressureTargetX:
                    0,

                pressureTargetY:
                    0,

                pressureRadius:
                    64,

                pressureHit:
                    false,

                nextAttack:
                    "order",

                orderWindupDuration:
                    42,

                orderActiveDuration:
                    30,

                orderDuration:
                    2200,

                chargeWindupDuration:
                    36,

                chargeDuration:
                    28,

                chargeSpeed:
                    4.2,

                currentChargeSpeed:
                    4.2,

                chargeX:
                    0,

                chargeY:
                    0,

                chargeHit:
                    false,

                chargeRepeatsRemaining:
                    0,

                recoverDuration:
                    46
            })
        );

        return;
    }


    // ========================================================================
    // ENEMIGO BASE
    // ========================================================================

    spawnEnemyGroup(
        amount,
        (i) =>
            createLeperConfig(i)
    );
}


// ============================================================================
// ENFERMERAS DEL DOCTOR
// ============================================================================

function spawnNurses(doctor) {

    spawnEnemyGroup(
        2,
        (i) => {

            const angle =
                Math.PI *
                i;

            return {

                type:
                    "nurse",

                x:
                    doctor.x +
                    doctor.width / 2 +
                    Math.cos(angle) *
                    55 -
                    20,

                y:
                    doctor.y +
                    doctor.height / 2 +
                    Math.sin(angle) *
                    55 -
                    20,

                speed:
                    1.5,

                health:
                    4,

                maxHealth:
                    4,

                color:
                    "cyan",

                nurseRole:
                    i === 0
                        ? "guard"
                        : "hunter",

                roleTimer:
                    210 +
                    Math.random() * 30,

                hunterBoostTimer:
                    i === 1
                        ? 60
                        : 0
            };
        }
    );
}


// ============================================================================
// DIBUJAR ENEMIGOS
// ============================================================================

function drawEnemies() {

    enemies.forEach((enemy) => {

        ctx.fillStyle =
            enemy.color;

        ctx.fillRect(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
        );

        ctx.save();


        // ====================================================================
        // ENFERMERA AGRESIVA
        // ====================================================================

        if (
            enemy.type === "aggressiveNurse" &&
            enemy.nurseState === "windup"
        ) {

            const centerX =
                enemy.x + enemy.width / 2;

            const centerY =
                enemy.y + enemy.height / 2;

            ctx.strokeStyle =
                "white";

            ctx.lineWidth =
                3;

            ctx.strokeRect(
                enemy.x - 4,
                enemy.y - 4,
                enemy.width + 8,
                enemy.height + 8
            );

            ctx.beginPath();

            ctx.moveTo(
                centerX,
                centerY
            );

            ctx.lineTo(
                centerX + enemy.rushX * 115,
                centerY + enemy.rushY * 115
            );

            ctx.stroke();
        }


        // ====================================================================
        // CIRUJANO APUNTANDO
        // ====================================================================

        if (
            enemy.type === "surgeon" &&
            (
                enemy.shootTimer <= enemy.aimWarningDuration ||
                enemy.commandVolleyState === "windup"
            )
        ) {

            ctx.strokeStyle =
                "rgba(255, 255, 255, 0.85)";

            ctx.lineWidth =
                2;

            ctx.strokeRect(
                enemy.x - 4,
                enemy.y - 4,
                enemy.width + 8,
                enemy.height + 8
            );
        }


        // ====================================================================
        // DESCARGA TRIPLE DEL CIRUJANO
        // ====================================================================

        if (
            enemy.type === "surgeon" &&
            enemy.commandVolleyState === "windup"
        ) {

            const centerX =
                enemy.x + enemy.width / 2;

            const centerY =
                enemy.y + enemy.height / 2;

            const targetX =
                player.x + player.width / 2;

            const targetY =
                player.y + player.height / 2;

            const baseAngle =
                Math.atan2(
                    targetY - centerY,
                    targetX - centerX
                );

            ctx.strokeStyle =
                "rgba(255, 235, 150, 0.85)";

            ctx.lineWidth =
                2;

            [
                -enemy.commandVolleySpread,
                0,
                enemy.commandVolleySpread
            ].forEach((angleOffset) => {

                ctx.beginPath();

                ctx.moveTo(
                    centerX,
                    centerY
                );

                ctx.lineTo(
                    centerX +
                        Math.cos(baseAngle + angleOffset) *
                        145,
                    centerY +
                        Math.sin(baseAngle + angleOffset) *
                        145
                );

                ctx.stroke();
            });
        }


        // ====================================================================
        // INSPECCIÓN DEL DIRECTOR
        // ====================================================================

        if (
            enemy.type === "director" &&
            (
                enemy.pressureState === "mark" ||
                enemy.pressureState === "active"
            )
        ) {

            const directorCenterX =
                enemy.x + enemy.width / 2;

            const directorCenterY =
                enemy.y + enemy.height / 2;

            const inspectionActive =
                enemy.pressureState === "active";

            if (!inspectionActive) {

                ctx.beginPath();

                ctx.moveTo(
                    directorCenterX,
                    directorCenterY
                );

                ctx.lineTo(
                    enemy.pressureTargetX,
                    enemy.pressureTargetY
                );

                ctx.strokeStyle =
                    "rgba(255, 190, 70, 0.55)";

                ctx.lineWidth =
                    2;

                ctx.stroke();
            }

            ctx.beginPath();

            ctx.arc(
                enemy.pressureTargetX,
                enemy.pressureTargetY,
                enemy.pressureRadius,
                0,
                Math.PI * 2
            );

            if (inspectionActive) {

                ctx.fillStyle =
                    "rgba(255, 120, 40, 0.22)";

                ctx.fill();
            }

            ctx.strokeStyle =
                inspectionActive
                    ? "white"
                    : "rgba(255, 190, 70, 0.9)";

            ctx.lineWidth =
                inspectionActive
                    ? 5
                    : 3;

            ctx.stroke();

            if (!inspectionActive) {

                const inspectionProgress =
                    1 -
                    enemy.pressureTimer /
                    enemy.pressureMarkDuration;

                ctx.beginPath();

                ctx.arc(
                    enemy.pressureTargetX,
                    enemy.pressureTargetY,
                    Math.max(
                        8,
                        enemy.pressureRadius *
                            (1 - inspectionProgress)
                    ),
                    0,
                    Math.PI * 2
                );

                ctx.strokeStyle =
                    "white";

                ctx.lineWidth =
                    2;

                ctx.stroke();
            }

            ctx.fillStyle =
                "white";

            ctx.font =
                "bold 12px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                inspectionActive
                    ? "CONTROL"
                    : "INSPECCIÓN",
                enemy.pressureTargetX,
                enemy.pressureTargetY -
                    enemy.pressureRadius -
                    8
            );
        }


        // ====================================================================
        // ORDEN DEL DIRECTOR
        // ====================================================================

        if (
            enemy.type === "director" &&
            enemy.directorState === "orderWindup"
        ) {

            const progress =
                1 -
                enemy.stateTimer /
                enemy.orderWindupDuration;

            const centerX =
                enemy.x + enemy.width / 2;

            const centerY =
                enemy.y + enemy.height / 2;

            ctx.beginPath();

            ctx.arc(
                centerX,
                centerY,
                38 + progress * 42,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                "rgba(255, 210, 90, 0.9)";

            ctx.lineWidth =
                4;

            ctx.stroke();

            ctx.fillStyle =
                "white";

            ctx.font =
                "bold 22px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                "!",
                centerX,
                enemy.y - 12
            );
        }

        if (
            enemy.type === "director" &&
            performance.now() < hospitalOrderUntil
        ) {

            const centerX =
                enemy.x + enemy.width / 2;

            const centerY =
                enemy.y + enemy.height / 2;

            const pulseRadius =
                82 +
                Math.sin(performance.now() / 85) * 6;

            ctx.beginPath();

            ctx.arc(
                centerX,
                centerY,
                pulseRadius,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                "rgba(255, 150, 40, 0.85)";

            ctx.lineWidth =
                4;

            ctx.stroke();

            ctx.fillStyle =
                "white";

            ctx.font =
                "bold 14px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                "ORDEN",
                centerX,
                enemy.y - 12
            );
        }


        // ====================================================================
        // CAMBIO DE FASE DEL DIRECTOR
        // ====================================================================

        if (
            enemy.type === "director" &&
            performance.now() < enemy.phaseFlashUntil
        ) {

            const centerX =
                enemy.x + enemy.width / 2;

            const centerY =
                enemy.y + enemy.height / 2;

            ctx.beginPath();

            ctx.arc(
                centerX,
                centerY,
                68 + enemy.room4Phase * 9,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                "white";

            ctx.lineWidth =
                5;

            ctx.stroke();

            ctx.fillStyle =
                "white";

            ctx.font =
                "bold 14px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                "FASE " + enemy.room4Phase,
                centerX,
                enemy.y - 16
            );
        }


        // ====================================================================
        // CARGA DEL DIRECTOR
        // ====================================================================

        if (
            enemy.type === "director" &&
            enemy.directorState === "chargeWindup"
        ) {

            const centerX =
                enemy.x + enemy.width / 2;

            const centerY =
                enemy.y + enemy.height / 2;

            ctx.strokeStyle =
                "rgba(255, 120, 70, 0.95)";

            ctx.lineWidth =
                4;

            ctx.strokeRect(
                enemy.x - 6,
                enemy.y - 6,
                enemy.width + 12,
                enemy.height + 12
            );

            ctx.beginPath();

            ctx.moveTo(
                centerX,
                centerY
            );

            ctx.lineTo(
                centerX + enemy.chargeX * 250,
                centerY + enemy.chargeY * 250
            );

            ctx.stroke();
        }

        if (
            enemy.type === "director" &&
            enemy.directorState === "charge"
        ) {

            ctx.strokeStyle =
                "white";

            ctx.lineWidth =
                5;

            ctx.strokeRect(
                enemy.x - 5,
                enemy.y - 5,
                enemy.width + 10,
                enemy.height + 10
            );
        }


        // ====================================================================
        // ANESTESIÓLOGO
        // ====================================================================

        if (
            enemy.type === "anesthesiologist" &&
            currentRoom === 3 &&
            (
                enemy.anesthesiologistState === "windup" ||
                enemy.anesthesiologistState === "fakeout"
            )
        ) {

            ctx.strokeStyle =
                "white";

            ctx.lineWidth =
                3;

            ctx.strokeRect(
                enemy.x - 4,
                enemy.y - 4,
                enemy.width + 8,
                enemy.height + 8
            );
        }


        // ====================================================================
        // TRAUMATÓLOGO
        // ====================================================================

        if (
            enemy.type === "traumatologist" &&
            enemy.traumaState === "chargeWindup"
        ) {

            ctx.strokeStyle =
                "white";

            ctx.lineWidth =
                4;

            ctx.strokeRect(
                enemy.x - 6,
                enemy.y - 6,
                enemy.width + 12,
                enemy.height + 12
            );
        }

        if (
            enemy.type === "traumatologist" &&
            (
                enemy.traumaState === "slamWindup" ||
                enemy.traumaState === "slamActive"
            )
        ) {

            ctx.beginPath();

            ctx.arc(
                enemy.x +
                    enemy.width / 2,
                enemy.y +
                    enemy.height / 2,
                enemy.currentSlamRadius,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                enemy.traumaState === "slamActive"
                    ? "white"
                    : "rgba(255, 255, 255, 0.45)";

            ctx.lineWidth =
                enemy.traumaState === "slamActive"
                    ? 4
                    : 2;

            ctx.stroke();
        }

        if (
            enemy.type === "traumatologist" &&
            enemy.traumaState === "stunned"
        ) {

            ctx.strokeStyle =
                "white";

            ctx.lineWidth =
                2;

            ctx.strokeRect(
                enemy.x - 8,
                enemy.y - 8,
                enemy.width + 16,
                enemy.height + 16
            );
        }

        ctx.restore();
    });
}
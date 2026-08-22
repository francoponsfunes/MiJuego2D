// ============================================================================
// ENEMIES.JS
// Inteligencia, configuraciones y representación de los enemigos.
// ============================================================================

let hospitalOrderUntil = 0;

const ROOM_2_SPEED_MULTIPLIER = 1.20;

const ROOM_3_LEPER_SPEED_MULTIPLIER = 1.10;

function getRoomSpeedMultiplier() {
    return isCurrentRoomType("doctor") ? ROOM_2_SPEED_MULTIPLIER : 1;
}

function getLeperSpeedMultiplier() {
    if (isCurrentRoomType("doctor")) {
        return ROOM_2_SPEED_MULTIPLIER;
    }

    if (isCurrentRoomType("trauma")) {
        return ROOM_3_LEPER_SPEED_MULTIPLIER;
    }

    return 1;
}

const enemies = [];

// Creación y configuración de enemigos.
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

function spawnEnemyGroup(amount, configFactory) {
    for (let i = 0; i < amount; i++) {
        enemies.push(createEnemy(configFactory(i)));
    }
}

// Configuración de las salas de anestesia.
function createAnesthesiaPreparationConfig(index = 0) {
    const startsAsController = index % 2 === 0;

    return {
        type: "anesthesiologist",
        preparationAnesthesiologist: true,
        anesthesiaIndex: index,
        x: startsAsController ? 105 : canvas.width - 145,
        y: startsAsController ? 105 : canvas.height - 145,
        width: 40,
        height: 40,
        speed: 1.85,
        health: 6,
        maxHealth: 6,
        color: startsAsController ? "#4f9eff" : "#8068ff",
        knockbackResistance: 2,
        preparationState: startsAsController ? "zoneWindup" : "attackerWait",
        stateTimer: startsAsController ? 34 : 0,
        preferredDistance: 205,
        orbitDirection: startsAsController ? 1 : -1,
        zoneX: player.x + player.width / 2,
        zoneY: player.y + player.height / 2,
        zoneRadius: 88,
        zoneWindupDuration: 34,
        zoneActiveDuration: 55,
        zoneLocked: startsAsController,
        zoneHit: false,
        dashTargetX: 0,
        dashTargetY: 0,
        dashX: 0,
        dashY: 0,
        dashSpeed: 9.2,
        dashHit: false,
        retreatDuration: 13,
        controllerDelay: 26
    };
}

// Configuración y comportamiento de los leprosos.
function createLeperConfig(index = 0) {
    if (isCurrentRoomType("junction")) {
        const spawnPoints = [
            { x: 90, y: 90 },
            { x: canvas.width - 130, y: 90 },
            { x: 90, y: canvas.height - 150 },
            { x: canvas.width - 130, y: canvas.height - 150 }
        ];

        const spawnPoint = spawnPoints[index % spawnPoints.length];
        const openingDelays = [26, 82, 82, 26];
        const openingDelay = openingDelays[index % openingDelays.length];

        return {
            type: "leper",
            x: spawnPoint.x,
            y: spawnPoint.y,
            speed: 1.45,
            health: 4,
            maxHealth: 4,
            color: "red",
            flankSide: index % 2 === 0 ? -1 : 1,
            leperState: "windup",
            leperTimer: openingDelay,
            junctionAmbusher: true,
            junctionInitialDelay: openingDelay,
            rushX: 0,
            rushY: 0
        };
    }

    return {
        type: "leper",
        x: Math.random() * (canvas.width - 40),
        y: Math.random() * (canvas.height - 40),
        speed: 1.45,
        health: 4,
        maxHealth: 4,
        color: "red",
        flankSide: index % 2 === 0 ? -1 : 1,
        leperState: "chase",
        leperTimer: 180 + Math.random() * 120,
        rushX: 0,
        rushY: 0
    };
}

function updateLeper(enemy, deltaTime) {
    const enemyCenterX = enemy.x + enemy.width / 2;
    const enemyCenterY = enemy.y + enemy.height / 2;

    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    const dx = playerCenterX - enemyCenterX;
    const dy = playerCenterY - enemyCenterY;

    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const directionX = dx / distance;
    const directionY = dy / distance;

    const orderMultiplier = performance.now() < hospitalOrderUntil ? 1.6 : 1;
    const roomSpeedMultiplier = getLeperSpeedMultiplier();

    const isJunctionAmbusher =
        isCurrentRoomType("junction") && enemy.junctionAmbusher;

    const isJunctionInterceptor =
        isJunctionAmbusher && enemy.flankSide === 1;

    const playerInputX =
        Number(Boolean(keys["d"])) - Number(Boolean(keys["a"]));

    const playerInputY =
        Number(Boolean(keys["s"])) - Number(Boolean(keys["w"]));

    const playerInputLength =
        Math.sqrt(
            playerInputX * playerInputX +
            playerInputY * playerInputY
        ) || 1;

    const playerMovementX = playerInputX / playerInputLength;
    const playerMovementY = playerInputY / playerInputLength;

    const interceptionDistance =
        Math.min(125, Math.max(78, distance * 0.36));

    const interceptionTargetX = Math.max(
        40,
        Math.min(
            canvas.width - 40,
            playerCenterX + playerMovementX * interceptionDistance
        )
    );

    const interceptionTargetY = Math.max(
        40,
        Math.min(
            canvas.height - 40,
            playerCenterY + playerMovementY * interceptionDistance
        )
    );

    const minimumRushDistance = isJunctionAmbusher ? 70 : 90;
    const maximumRushDistance = isJunctionAmbusher ? 440 : 320;
    const rushSpeedMultiplier = isJunctionAmbusher ? 2.05 : 1.55;

    if (enemy.leperState === "chase") {
        enemy.leperTimer -= deltaTime;

        if (
            enemy.leperTimer <= 0 &&
            distance > minimumRushDistance &&
            distance < maximumRushDistance
        ) {
            enemy.leperState = "windup";
            enemy.leperTimer = isJunctionAmbusher ? 21 : 18;

            return;
        }

        if (enemy.leperTimer <= 0) {
            enemy.leperTimer = isJunctionAmbusher ? 24 : 45;
        }

        let speed =
            enemy.speed *
            orderMultiplier *
            roomSpeedMultiplier;

        if (distance > 220) {
            speed *= isJunctionAmbusher ? 1.22 : 1.15;
        }

        if (distance < 80) {
            speed *= isJunctionAmbusher ? 0.88 : 0.80;
        }

        const flankDistance = isJunctionAmbusher ? 46 : 28;

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
            flankX +
            (isJunctionInterceptor ? playerMovementX * 60 : 0);

        const targetY =
            playerCenterY +
            flankY +
            (isJunctionInterceptor ? playerMovementY * 60 : 0);

        const moveX = targetX - enemyCenterX;
        const moveY = targetY - enemyCenterY;

        const moveDistance =
            Math.sqrt(moveX * moveX + moveY * moveY) || 1;

        enemy.x += moveX / moveDistance * speed * deltaTime;
        enemy.y += moveY / moveDistance * speed * deltaTime;

        return;
    }

    if (enemy.leperState === "windup") {
        enemy.leperTimer -= deltaTime;

        if (isJunctionAmbusher) {
            enemy.junctionTargetX = isJunctionInterceptor
                ? interceptionTargetX
                : playerCenterX;

            enemy.junctionTargetY = isJunctionInterceptor
                ? interceptionTargetY
                : playerCenterY;
        }

        enemy.x +=
            directionX *
            enemy.speed *
            roomSpeedMultiplier *
            (isJunctionAmbusher ? 0.28 : 0.20) *
            deltaTime;

        enemy.y +=
            directionY *
            enemy.speed *
            roomSpeedMultiplier *
            (isJunctionAmbusher ? 0.28 : 0.20) *
            deltaTime;

        if (enemy.leperTimer <= 0) {
            const rushTargetX = isJunctionAmbusher
                ? enemy.junctionTargetX
                : playerCenterX;

            const rushTargetY = isJunctionAmbusher
                ? enemy.junctionTargetY
                : playerCenterY;

            const rushDistanceX = rushTargetX - enemyCenterX;
            const rushDistanceY = rushTargetY - enemyCenterY;

            const rushTargetDistance =
                Math.sqrt(
                    rushDistanceX * rushDistanceX +
                    rushDistanceY * rushDistanceY
                ) || 1;

            enemy.rushX = rushDistanceX / rushTargetDistance;
            enemy.rushY = rushDistanceY / rushTargetDistance;
            enemy.leperState = "rush";

            if (isJunctionAmbusher) {
                const plannedRushSpeed =
                    enemy.speed *
                    rushSpeedMultiplier *
                    orderMultiplier *
                    roomSpeedMultiplier;

                enemy.leperTimer = Math.max(
                    50,
                    Math.min(
                        138,
                        rushTargetDistance / plannedRushSpeed + 12
                    )
                );
            } else {
                enemy.leperTimer = 28;
            }
        }

        return;
    }

    if (enemy.leperState === "rush") {
        enemy.leperTimer -= deltaTime;

        const rushSpeed =
            enemy.speed *
            rushSpeedMultiplier *
            orderMultiplier *
            roomSpeedMultiplier;

        enemy.x += enemy.rushX * rushSpeed * deltaTime;
        enemy.y += enemy.rushY * rushSpeed * deltaTime;

        if (enemy.leperTimer <= 0) {
            enemy.leperState = "chase";

            enemy.leperTimer = isJunctionAmbusher
                ? 65 + Math.random() * 45
                : 180 + Math.random() * 120;
        }
    }
}

// Doctor y enfermeras del consultorio.
function updateDoctor(enemy, deltaTime) {
    const enemyCenterX = enemy.x + enemy.width / 2;
    const enemyCenterY = enemy.y + enemy.height / 2;

    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    const dx = playerCenterX - enemyCenterX;
    const dy = playerCenterY - enemyCenterY;

    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const directionX = dx / distance;
    const directionY = dy / distance;

    const doctorSpeed =
        enemy.moveSpeed *
        getRoomSpeedMultiplier();

    enemy.doctorMoveTimer -= deltaTime;

    if (enemy.doctorMoveTimer <= 0) {
        enemy.strafeDirection *= -1;
        enemy.doctorMoveTimer = 90 + Math.random() * 90;
    }

    const attacking =
        enemy.attackState === "windup" ||
        enemy.attackState === "burst";

    if (!attacking) {
        if (distance < 150) {
            enemy.x -= directionX * doctorSpeed * 1.25 * deltaTime;
            enemy.y -= directionY * doctorSpeed * 1.25 * deltaTime;
        } else if (distance > 280) {
            enemy.x += directionX * doctorSpeed * deltaTime;
            enemy.y += directionY * doctorSpeed * deltaTime;
        } else {
            const strafeX = -directionY * enemy.strafeDirection;
            const strafeY = directionX * enemy.strafeDirection;

            enemy.x += strafeX * doctorSpeed * deltaTime;
            enemy.y += strafeY * doctorSpeed * deltaTime;

            const distanceDifference =
                distance - enemy.preferredDistance;

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
        enemy.attackTimer -= deltaTime;

        if (enemy.attackTimer <= 0) {
            enemy.attackState = "windup";
            enemy.attackTimer = 24;
        }

        return;
    }

    if (enemy.attackState === "windup") {
        enemy.attackTimer -= deltaTime;

        if (enemy.attackTimer <= 0) {
            enemy.attackState = "burst";
            enemy.shotsRemaining = 2;
            enemy.burstTimer = 0;
        }

        return;
    }

    if (enemy.attackState === "burst") {
        enemy.burstTimer -= deltaTime;

        if (
            enemy.burstTimer <= 0 &&
            enemy.shotsRemaining > 0
        ) {
            shootEnemyProjectile(enemy);

            enemy.shotsRemaining--;
            enemy.burstTimer = 10;
        }

        if (enemy.shotsRemaining <= 0) {
            enemy.attackState = "cooldown";
            enemy.attackTimer = 90 + Math.random() * 25;
        }
    }
}

function updateNurse(enemy, deltaTime) {
    const roomSpeedMultiplier = getRoomSpeedMultiplier();

    const doctor = enemies.find(
        (otherEnemy) => otherEnemy.type === "doctor"
    );

    if (!doctor) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const distance =
            Math.sqrt(dx * dx + dy * dy) || 1;

        const chaseSpeed =
            enemy.speed *
            roomSpeedMultiplier;

        enemy.x += dx / distance * chaseSpeed * deltaTime;
        enemy.y += dy / distance * chaseSpeed * deltaTime;

        return;
    }

    enemy.roleTimer -= deltaTime;

    if (enemy.roleTimer <= 0) {
        if (enemy.nurseRole === "guard") {
            enemy.nurseRole = "hunter";
            enemy.hunterBoostTimer = 60;
        } else {
            enemy.nurseRole = "guard";
            enemy.hunterBoostTimer = 0;
        }

        enemy.roleTimer = 210 + Math.random() * 30;
    }

    if (enemy.nurseRole === "guard") {
        const doctorCenterX =
            doctor.x + doctor.width / 2;

        const doctorCenterY =
            doctor.y + doctor.height / 2;

        const playerCenterX =
            player.x + player.width / 2;

        const playerCenterY =
            player.y + player.height / 2;

        const dx = playerCenterX - doctorCenterX;
        const dy = playerCenterY - doctorCenterY;

        const distance =
            Math.sqrt(dx * dx + dy * dy) || 1;

        const targetX =
            doctorCenterX + dx / distance * 70;

        const targetY =
            doctorCenterY + dy / distance * 70;

        const moveX = targetX - enemy.x;
        const moveY = targetY - enemy.y;

        const moveDistance =
            Math.sqrt(moveX * moveX + moveY * moveY) || 1;

        const guardSpeed =
            1.45 *
            roomSpeedMultiplier;

        enemy.x +=
            moveX /
            moveDistance *
            guardSpeed *
            deltaTime;

        enemy.y +=
            moveY /
            moveDistance *
            guardSpeed *
            deltaTime;

        return;
    }

    if (enemy.nurseRole === "hunter") {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const distance =
            Math.sqrt(dx * dx + dy * dy) || 1;

        let hunterSpeed =
            1.8 *
            roomSpeedMultiplier;

        if (enemy.hunterBoostTimer > 0) {
            enemy.hunterBoostTimer -= deltaTime;

            hunterSpeed =
                2.25 *
                roomSpeedMultiplier;
        }

        enemy.x +=
            dx /
            distance *
            hunterSpeed *
            deltaTime;

        enemy.y +=
            dy /
            distance *
            hunterSpeed *
            deltaTime;
    }
}

// Sala de preparación anestésica.
function updatePreparationAnesthesiologist(enemy, deltaTime) {
    const touchingPlayerBeforeMoving =
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y;

    if (
        touchingPlayerBeforeMoving &&
        !enemy.touchingPlayer
    ) {
        enemy.touchingPlayer = true;

        damagePlayerFromEntity(
            0.5,
            enemy,
            enemy.preparationState === "dash" ? 10 : 7
        );

        if (
            enemy.preparationState === "dash" &&
            !enemy.dashHit
        ) {
            enemy.dashHit = true;
            enemy.preparationState = "retreat";
            enemy.stateTimer = enemy.retreatDuration;
        }
    }

    if (!touchingPlayerBeforeMoving) {
        enemy.touchingPlayer = false;
    }

    const enemyX =
        enemy.x + enemy.width / 2;

    const enemyY =
        enemy.y + enemy.height / 2;

    const playerX =
        player.x + player.width / 2;

    const playerY =
        player.y + player.height / 2;

    const distanceX = playerX - enemyX;
    const distanceY = playerY - enemyY;

    const distance =
        Math.hypot(distanceX, distanceY) || 1;

    const directionX = distanceX / distance;
    const directionY = distanceY / distance;

    const partner = enemies.find(
        (candidate) =>
            candidate !== enemy &&
            candidate.preparationAnesthesiologist
    );

    const shouldBecomeController =
        !partner ||
        (
            partner.preparationState === "attackerWait" &&
            enemy.anesthesiaIndex < partner.anesthesiaIndex
        );

    function orbit(speed, preferredDistance) {
        const orbitX =
            -directionY *
            enemy.orbitDirection;

        const orbitY =
            directionX *
            enemy.orbitDirection;

        const correction = Math.max(
            -1,
            Math.min(
                1,
                (distance - preferredDistance) /
                preferredDistance
            )
        );

        const movementX =
            orbitX +
            directionX *
            correction *
            1.35;

        const movementY =
            orbitY +
            directionY *
            correction *
            1.35;

        const movementDistance =
            Math.hypot(movementX, movementY) || 1;

        enemy.x +=
            movementX /
            movementDistance *
            speed *
            deltaTime;

        enemy.y +=
            movementY /
            movementDistance *
            speed *
            deltaTime;
    }

    if (enemy.preparationState === "attackerWait") {
        orbit(
            enemy.speed,
            enemy.preferredDistance
        );

        if (shouldBecomeController) {
            enemy.preparationState = "controllerCooldown";
            enemy.stateTimer = partner ? 28 : 18;
            enemy.zoneLocked = false;
        }

        return;
    }

    if (enemy.preparationState === "controllerCooldown") {
        enemy.stateTimer -= deltaTime;

        orbit(
            enemy.speed * 1.08,
            enemy.preferredDistance
        );

        if (enemy.stateTimer <= 0) {
            enemy.preparationState = "zoneWindup";
            enemy.stateTimer = enemy.zoneWindupDuration;
            enemy.zoneLocked = false;
        }

        return;
    }

    if (enemy.preparationState === "zoneWindup") {
        if (
            !enemy.zoneLocked ||
            enemy.stateTimer >= enemy.zoneWindupDuration
        ) {
            const inputX =
                Number(Boolean(keys["d"])) -
                Number(Boolean(keys["a"]));

            const inputY =
                Number(Boolean(keys["s"])) -
                Number(Boolean(keys["w"]));

            const inputLength =
                Math.hypot(inputX, inputY) || 1;

            enemy.zoneX = Math.max(
                55,
                Math.min(
                    canvas.width - 55,
                    playerX + inputX / inputLength * 70
                )
            );

            enemy.zoneY = Math.max(
                55,
                Math.min(
                    canvas.height - 55,
                    playerY + inputY / inputLength * 70
                )
            );

            enemy.zoneLocked = true;
        }

        enemy.stateTimer -= deltaTime;

        orbit(
            enemy.speed * 0.42,
            enemy.preferredDistance
        );

        if (enemy.stateTimer <= 0) {
            enemy.preparationState = "zoneActive";
            enemy.stateTimer = enemy.zoneActiveDuration;
            enemy.zoneHit = false;

            if (partner) {
                partner.preparationState = "dashWindup";
                partner.stateTimer = 22;
                partner.dashTargetX = enemy.zoneX;
                partner.dashTargetY = enemy.zoneY;
                partner.dashHit = false;
            }
        }

        return;
    }

    if (enemy.preparationState === "zoneActive") {
        enemy.stateTimer -= deltaTime;

        orbit(
            enemy.speed * 0.55,
            enemy.preferredDistance + 20
        );

        const distanceToZone = Math.hypot(
            playerX - enemy.zoneX,
            playerY - enemy.zoneY
        );

        if (
            distanceToZone <= enemy.zoneRadius &&
            !enemy.zoneHit
        ) {
            enemy.zoneHit = true;

            movementDisabledUntil = Math.max(
                movementDisabledUntil,
                performance.now() + 420
            );
        }

        const soloZoneElapsed =
            enemy.zoneActiveDuration -
            enemy.stateTimer;

        if (
            !partner &&
            soloZoneElapsed >= 10
        ) {
            enemy.preparationState = "dashWindup";
            enemy.stateTimer = 16;
            enemy.dashTargetX = enemy.zoneX;
            enemy.dashTargetY = enemy.zoneY;
            enemy.dashHit = false;

            return;
        }

        if (enemy.stateTimer <= 0) {
            enemy.preparationState = "attackerWait";
            enemy.zoneLocked = false;
        }

        return;
    }

    if (enemy.preparationState === "dashWindup") {
        if (enemy.stateTimer > 7) {
            const escapeX =
                Number(Boolean(keys["d"])) -
                Number(Boolean(keys["a"]));

            const escapeY =
                Number(Boolean(keys["s"])) -
                Number(Boolean(keys["w"]));

            const escapeDistance =
                Math.hypot(escapeX, escapeY) || 1;

            const canPlayerMove =
                performance.now() >= movementDisabledUntil;

            const travelFrames =
                distance /
                Math.max(enemy.dashSpeed, 1);

            const predictedFrames = Math.min(
                36,
                travelFrames +
                Math.min(enemy.stateTimer, 10)
            );

            const anticipationDistance = canPlayerMove
                ? Math.min(
                    105,
                    predictedFrames *
                    player.speed *
                    PLAYER_SPEED_MULTIPLIER
                )
                : 0;

            enemy.dashTargetX = Math.max(
                40,
                Math.min(
                    canvas.width - 40,
                    playerX +
                    escapeX /
                    escapeDistance *
                    anticipationDistance
                )
            );

            enemy.dashTargetY = Math.max(
                40,
                Math.min(
                    canvas.height - 40,
                    playerY +
                    escapeY /
                    escapeDistance *
                    anticipationDistance
                )
            );
        }

        enemy.stateTimer -= deltaTime;

        if (enemy.stateTimer <= 0) {
            const attackX =
                enemy.dashTargetX -
                enemyX;

            const attackY =
                enemy.dashTargetY -
                enemyY;

            const attackDistance =
                Math.hypot(attackX, attackY) || 1;

            enemy.dashX = attackX / attackDistance;
            enemy.dashY = attackY / attackDistance;

            enemy.preparationState = "dash";
            enemy.dashHit = false;

            enemy.stateTimer = Math.max(
                30,
                Math.min(
                    76,
                    attackDistance /
                    enemy.dashSpeed +
                    12
                )
            );
        }

        return;
    }

    if (enemy.preparationState === "dash") {
        enemy.stateTimer -= deltaTime;

        enemy.x +=
            enemy.dashX *
            enemy.dashSpeed *
            deltaTime;

        enemy.y +=
            enemy.dashY *
            enemy.dashSpeed *
            deltaTime;

        const touchingPlayer =
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y;

        if (
            touchingPlayer &&
            !enemy.dashHit
        ) {
            enemy.dashHit = true;
            enemy.touchingPlayer = true;

            damagePlayerFromEntity(
                0.5,
                enemy,
                10
            );

            enemy.preparationState = "retreat";
            enemy.stateTimer = enemy.retreatDuration;

            return;
        }

        const hitWall =
            enemy.x <= 20 ||
            enemy.y <= 20 ||
            enemy.x + enemy.width >= canvas.width - 20 ||
            enemy.y + enemy.height >= canvas.height - 20;

        if (
            enemy.stateTimer <= 0 ||
            hitWall
        ) {
            enemy.preparationState = "retreat";
            enemy.stateTimer = enemy.retreatDuration;
        }

        return;
    }

    if (enemy.preparationState === "retreat") {
        enemy.stateTimer -= deltaTime;

        enemy.x -=
            directionX *
            3.4 *
            deltaTime;

        enemy.y -=
            directionY *
            3.4 *
            deltaTime;

        if (enemy.stateTimer <= 0) {
            enemy.preparationState = "controllerCooldown";

            enemy.stateTimer = partner
                ? enemy.controllerDelay
                : Math.max(
                    16,
                    enemy.controllerDelay - 8
                );

            enemy.zoneLocked = false;
            enemy.orbitDirection *= -1;
        }
    }
}

// Anestesiólogo y traumatólogo.
function updateAnesthesiologist(enemy, deltaTime) {
    const enemyCenterX =
        enemy.x + enemy.width / 2;

    const enemyCenterY =
        enemy.y + enemy.height / 2;

    const playerCenterX =
        player.x + player.width / 2;

    const playerCenterY =
        player.y + player.height / 2;

    const dx = playerCenterX - enemyCenterX;
    const dy = playerCenterY - enemyCenterY;

    const distance =
        Math.sqrt(dx * dx + dy * dy) || 1;

    const directionX = dx / distance;
    const directionY = dy / distance;

    if (enemy.anesthesiologistState === "harass") {
        enemy.attackTimer -= deltaTime;
        enemy.repositionTimer -= deltaTime;

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

        radialCorrection = Math.max(
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

        moveX /= moveDistance;
        moveY /= moveDistance;

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
            enemy.anesthesiologistState = "windup";
            enemy.stateTimer = enemy.windupDuration;
            enemy.willFake = Math.random() < enemy.fakeChance;

            return;
        }

        if (enemy.attackTimer <= 0) {
            enemy.attackTimer = 12;
        }

        return;
    }

    if (enemy.anesthesiologistState === "windup") {
        enemy.stateTimer -= deltaTime;

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
                enemy.anesthesiologistState = "fakeout";
                enemy.stateTimer = enemy.fakeDuration;

                enemy.fakeDirection =
                    Math.random() < 0.5 ? -1 : 1;

                return;
            }

            enemy.dashX = directionX;
            enemy.dashY = directionY;
            enemy.anesthesiaUsedThisDash = false;
            enemy.anesthesiologistState = "dash";
            enemy.stateTimer = enemy.dashDuration;
        }

        return;
    }

    if (enemy.anesthesiologistState === "fakeout") {
        enemy.stateTimer -= deltaTime;

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
                enemy.x + enemy.width / 2;

            const newEnemyCenterY =
                enemy.y + enemy.height / 2;

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

            enemy.dashX = newDx / newDistance;
            enemy.dashY = newDy / newDistance;
            enemy.anesthesiaUsedThisDash = false;
            enemy.anesthesiologistState = "dash";
            enemy.stateTimer = enemy.dashDuration;
        }

        return;
    }

    if (enemy.anesthesiologistState === "dash") {
        enemy.stateTimer -= deltaTime;

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
            enemy.anesthesiologistState = "retreat";
            enemy.stateTimer = enemy.retreatDuration;
        }

        return;
    }

    if (enemy.anesthesiologistState === "retreat") {
        enemy.stateTimer -= deltaTime;

        enemy.x -=
            directionX *
            enemy.retreatSpeed *
            deltaTime;

        enemy.y -=
            directionY *
            enemy.retreatSpeed *
            deltaTime;

        if (enemy.stateTimer <= 0) {
            enemy.anesthesiologistState = "harass";

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

function updateTraumatologist(enemy, deltaTime) {
    const enemyCenterX =
        enemy.x + enemy.width / 2;

    const enemyCenterY =
        enemy.y + enemy.height / 2;

    const playerCenterX =
        player.x + player.width / 2;

    const playerCenterY =
        player.y + player.height / 2;

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

    const directionX = dx / distance;
    const directionY = dy / distance;

    const enraged =
        enemy.health <=
        enemy.maxHealth * 0.50;

    enemy.enraged = enraged;

    const normalSpeed = enraged
        ? enemy.enragedSpeed
        : enemy.normalSpeed;

    const marchSpeed = enraged
        ? enemy.enragedMarchSpeed
        : enemy.marchSpeed;

    const chargeSpeed = enraged
        ? enemy.enragedChargeSpeed
        : enemy.chargeSpeed;

    const slamRadius = enraged
        ? enemy.enragedSlamRadius
        : enemy.slamRadius;

    enemy.currentSlamRadius = slamRadius;

    if (enemy.traumaState === "chase") {
        enemy.attackCooldownTimer -= deltaTime;

        const movementSpeed = distance > 245
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
            if (
                distance <=
                enemy.slamTriggerDistance
            ) {
                enemy.traumaState = "slamWindup";
                enemy.stateTimer = enraged ? 22 : 28;
                enemy.slamHitThisAttack = false;

                return;
            }

            if (
                distance <=
                enemy.chargeTriggerDistance
            ) {
                enemy.traumaState = "chargeWindup";
                enemy.stateTimer = enraged ? 23 : 30;
                enemy.attackHitThisStrike = false;

                return;
            }
        }

        return;
    }

    if (enemy.traumaState === "chargeWindup") {
        enemy.stateTimer -= deltaTime;

        if (enemy.stateTimer <= 0) {
            enemy.chargeX = directionX;
            enemy.chargeY = directionY;
            enemy.attackHitThisStrike = false;
            enemy.traumaState = "charge";
            enemy.stateTimer = enraged ? 20 : 21;
        }

        return;
    }

    if (enemy.traumaState === "charge") {
        enemy.stateTimer -= deltaTime;

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
            enemy.traumaState = "stunned";
            enemy.stateTimer = enraged ? 44 : 54;

            return;
        }

        if (enemy.stateTimer <= 0) {
            enemy.traumaState = "recovery";
            enemy.stateTimer = enraged ? 16 : 22;
        }

        return;
    }

    if (enemy.traumaState === "slamWindup") {
        enemy.stateTimer -= deltaTime;

        if (enemy.stateTimer <= 0) {
            enemy.traumaState = "slamActive";
            enemy.stateTimer = 8;
            enemy.slamHitThisAttack = false;
        }

        return;
    }

    if (enemy.traumaState === "slamActive") {
        enemy.stateTimer -= deltaTime;

        if (enemy.stateTimer <= 0) {
            enemy.traumaState = "recovery";
            enemy.stateTimer = enraged ? 16 : 23;
        }

        return;
    }

    if (enemy.traumaState === "stunned") {
        enemy.stateTimer -= deltaTime;

        if (enemy.stateTimer <= 0) {
            enemy.traumaState = "chase";
            enemy.attackCooldownTimer = enraged ? 42 : 55;
        }

        return;
    }

    if (enemy.traumaState === "recovery") {
        enemy.stateTimer -= deltaTime;

        if (enemy.stateTimer <= 0) {
            enemy.traumaState = "chase";

            enemy.attackCooldownTimer = enraged
                ? 44 + Math.random() * 25
                : 58 + Math.random() * 32;
        }
    }
}
// Asistentes del jefe.
function moveBossAssistantToward(enemy, targetX, targetY, speed, deltaTime) {
    const dx = targetX - (enemy.x + enemy.width / 2);
    const dy = targetY - (enemy.y + enemy.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    enemy.x += dx / distance * speed * deltaTime;
    enemy.y += dy / distance * speed * deltaTime;

    return distance;
}

function updateBossAnesthesiologist(enemy, deltaTime) {
    if (!boss.active || boss.defeated) {
        return;
    }

    enemy.orbitAngle += enemy.orbitSpeed * deltaTime;

    const bossCenterX = boss.x + boss.width / 2;
    const bossCenterY = boss.y + boss.height / 2;

    const orbitTargetX =
        bossCenterX +
        Math.cos(enemy.orbitAngle) *
        enemy.orbitRadius;

    const orbitTargetY =
        bossCenterY +
        Math.sin(enemy.orbitAngle) *
        enemy.orbitRadius;

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

    if (enemy.anesthesiologistState === "windup") {
        enemy.stateTimer -= deltaTime;

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

            enemy.dashX = dashDx / dashDistance;
            enemy.dashY = dashDy / dashDistance;
            enemy.anesthesiologistState = "dash";
            enemy.stateTimer = enemy.dashDuration;
            enemy.anesthesiaUsedThisDash = false;
        }

        return;
    }

    if (enemy.anesthesiologistState === "dash") {
        enemy.stateTimer -= deltaTime;

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
            enemy.anesthesiologistState = "return";
        }

        return;
    }

    if (enemy.anesthesiologistState === "return") {
        const returnDistance = moveBossAssistantToward(
            enemy,
            orbitTargetX,
            orbitTargetY,
            enemy.returnSpeed,
            deltaTime
        );

        if (returnDistance <= 24) {
            enemy.anesthesiologistState = "orbit";
        }

        return;
    }

    enemy.anesthesiologistState = "orbit";
}

// Coordinación de la sala del director.
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

    return {
        directionX: dx / distance,
        directionY: dy / distance,
        distance: distance
    };
}

function getRoom4Phase(director) {
    const staffAlive = enemies.filter(
        (enemy) =>
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
    const nurses = enemies.filter(
        (enemy) =>
            enemy.type === "aggressiveNurse"
    );

    nurses.forEach((nurse, index) => {
        nurse.commandDelay =
            8 +
            index *
            (phase >= 2 ? 23 : 30);
    });

    const surgeon = enemies.find(
        (enemy) => enemy.type === "surgeon"
    );

    if (surgeon) {
        surgeon.commandVolleyState = "windup";

        surgeon.commandVolleyTimer =
            phase === 1
                ? 34
                : phase === 2
                    ? 27
                    : 22;

        surgeon.commandVolleySpread =
            phase >= 2 ? 0.24 : 0.20;
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

// Preparación quirúrgica.
function updateSurgicalPreparationSurgeon(enemy, deltaTime) {
    const surgicalCadenceMultiplier =
        1 / (0.92 * 0.92);

    const enemyX =
        enemy.x + enemy.width / 2;

    const enemyY =
        enemy.y + enemy.height / 2;

    const playerX =
        player.x + player.width / 2;

    const playerY =
        player.y + player.height / 2;

    const distanceX = playerX - enemyX;
    const distanceY = playerY - enemyY;

    const distance =
        Math.hypot(distanceX, distanceY) || 1;

    const directionX = distanceX / distance;
    const directionY = distanceY / distance;

    const partner = enemies.find(
        (candidate) =>
            candidate !== enemy &&
            candidate.type === "surgeon" &&
            candidate.surgicalPreparationSurgeon
    );

    const inputX =
        Number(Boolean(keys["d"])) -
        Number(Boolean(keys["a"]));

    const inputY =
        Number(Boolean(keys["s"])) -
        Number(Boolean(keys["w"]));

    let movementX =
        -directionY *
        enemy.orbitDirection;

    let movementY =
        directionX *
        enemy.orbitDirection;

    const distanceCorrection = Math.max(
        -1,
        Math.min(
            1,
            (distance - enemy.preferredDistance) /
            enemy.preferredDistance
        )
    );

    movementX +=
        directionX *
        distanceCorrection *
        1.2;

    movementY +=
        directionY *
        distanceCorrection *
        1.2;

    if (partner) {
        const partnerX =
            partner.x + partner.width / 2;

        const partnerY =
            partner.y + partner.height / 2;

        const separationX =
            enemyX - partnerX;

        const separationY =
            enemyY - partnerY;

        const separation =
            Math.hypot(
                separationX,
                separationY
            ) || 1;

        if (separation < 235) {
            movementX +=
                separationX /
                separation *
                1.05;

            movementY +=
                separationY /
                separation *
                1.05;
        }
    }

    const movementDistance =
        Math.hypot(movementX, movementY) || 1;

    const movementMultiplier =
        enemy.surgicalState === "aim"
            ? 0.32
            : 1;

    enemy.movementX =
        movementX /
        movementDistance *
        enemy.movementSpeed *
        movementMultiplier;

    enemy.movementY =
        movementY /
        movementDistance *
        enemy.movementSpeed *
        movementMultiplier;

    enemy.x += enemy.movementX * deltaTime;
    enemy.y += enemy.movementY * deltaTime;

    function updateAimTarget() {
        const inputDistance =
            Math.hypot(inputX, inputY) || 1;

        const travelFrames =
            Math.min(34, distance / 5);

        const predictionDistance =
            enemy.currentPattern === "precision"
                ? Math.min(
                    100,
                    (travelFrames + 5) *
                    player.speed *
                    PLAYER_SPEED_MULTIPLIER
                )
                : 30;

        enemy.aimTargetX = Math.max(
            35,
            Math.min(
                canvas.width - 35,
                playerX +
                inputX /
                inputDistance *
                predictionDistance
            )
        );

        enemy.aimTargetY = Math.max(
            35,
            Math.min(
                canvas.height - 35,
                playerY +
                inputY /
                inputDistance *
                predictionDistance
            )
        );
    }

    if (
        enemy.surgicalState === "reposition" ||
        enemy.surgicalState === "recover"
    ) {
        enemy.surgicalTimer -= deltaTime;

        if (enemy.surgicalTimer <= 0) {
            enemy.currentPattern = partner
                ? enemy.surgicalRole
                : enemy.soloNextPattern;

            enemy.currentAimDuration = (
                partner
                    ? enemy.aimDuration
                    : Math.max(
                        19,
                        enemy.aimDuration - 5
                    )
            ) * surgicalCadenceMultiplier;

            enemy.surgicalState = "aim";
            enemy.surgicalTimer = enemy.currentAimDuration;

            updateAimTarget();
        }

        return;
    }

    if (enemy.surgicalState === "aim") {
        if (enemy.surgicalTimer > 7) {
            updateAimTarget();
        }

        enemy.surgicalTimer -= deltaTime;

        if (enemy.surgicalTimer > 0) {
            return;
        }

        const currentCenterX =
            enemy.x + enemy.width / 2;

        const currentCenterY =
            enemy.y + enemy.height / 2;

        const directAngle = Math.atan2(
            playerY - currentCenterY,
            playerX - currentCenterX
        );

        const aimedAngle = Math.atan2(
            enemy.aimTargetY - currentCenterY,
            enemy.aimTargetX - currentCenterX
        );

        const aimOffset =
            aimedAngle - directAngle;

        if (enemy.currentPattern === "precision") {
            shootEnemyProjectile(
                enemy,
                "scalpel",
                aimOffset
            );
        } else {
            [
                -enemy.coverageSpread,
                0,
                enemy.coverageSpread
            ].forEach((spread) => {
                shootEnemyProjectile(
                    enemy,
                    "scalpel",
                    aimOffset + spread
                );
            });
        }

        enemy.lastShotPattern =
            enemy.currentPattern;

        enemy.surgicalAttackCount++;

        enemy.soloNextPattern =
            enemy.currentPattern === "precision"
                ? "coverage"
                : "precision";

        enemy.surgicalState = "recover";

        enemy.surgicalTimer = (
            partner
                ? enemy.attackCooldown
                : Math.max(
                    35,
                    enemy.attackCooldown - 24
                )
        ) * surgicalCadenceMultiplier;

        if (
            partner &&
            (
                partner.surgicalState === "reposition" ||
                partner.surgicalState === "recover"
            )
        ) {
            const handoffDelay = (
                enemy.currentPattern === "precision"
                    ? 18
                    : 25
            ) * surgicalCadenceMultiplier;

            partner.surgicalTimer = Math.min(
                partner.surgicalTimer,
                handoffDelay
            );
        }
    }
}

function updateSurgicalPreparationNurse(enemy, deltaTime) {
    const enemyX =
        enemy.x + enemy.width / 2;

    const enemyY =
        enemy.y + enemy.height / 2;

    const playerX =
        player.x + player.width / 2;

    const playerY =
        player.y + player.height / 2;

    const playerDistance =
        Math.hypot(
            playerX - enemyX,
            playerY - enemyY
        ) || 1;

    const inputX =
        Number(Boolean(keys["d"])) -
        Number(Boolean(keys["a"]));

    const inputY =
        Number(Boolean(keys["s"])) -
        Number(Boolean(keys["w"]));

    const surgeons = enemies.filter(
        (candidate) =>
            candidate.surgicalPreparationSurgeon
    );

    const threateningSurgeon = surgeons.find(
        (surgeon) =>
            surgeon.surgicalState === "aim"
    );

    if (enemy.nurseState === "intercept") {
        let targetX =
            playerX + inputX * 58;

        let targetY =
            playerY + inputY * 58;

        if (threateningSurgeon) {
            const shooterX =
                threateningSurgeon.x +
                threateningSurgeon.width / 2;

            const shooterY =
                threateningSurgeon.y +
                threateningSurgeon.height / 2;

            const shotX =
                playerX - shooterX;

            const shotY =
                playerY - shooterY;

            const shotDistance =
                Math.hypot(shotX, shotY) || 1;

            const perpendicularX =
                -shotY / shotDistance;

            const perpendicularY =
                shotX / shotDistance;

            const escapeProjection =
                inputX * perpendicularX +
                inputY * perpendicularY;

            const escapeSide =
                Math.abs(escapeProjection) > 0.1
                    ? Math.sign(escapeProjection)
                    : enemy.flankSide;

            targetX =
                playerX +
                perpendicularX *
                escapeSide *
                96 +
                inputX *
                25;

            targetY =
                playerY +
                perpendicularY *
                escapeSide *
                96 +
                inputY *
                25;
        } else {
            targetX += enemy.flankSide * 46;
            targetY -= enemy.flankSide * 30;
        }

        targetX = Math.max(
            42,
            Math.min(
                canvas.width - 42,
                targetX
            )
        );

        targetY = Math.max(
            42,
            Math.min(
                canvas.height - 42,
                targetY
            )
        );

        const moveX =
            targetX - enemyX;

        const moveY =
            targetY - enemyY;

        const moveDistance =
            Math.hypot(moveX, moveY) || 1;

        const interceptSpeed =
            enemy.speed *
            (surgeons.length > 0 ? 1 : 1.24);

        enemy.x +=
            moveX /
            moveDistance *
            interceptSpeed *
            deltaTime;

        enemy.y +=
            moveY /
            moveDistance *
            interceptSpeed *
            deltaTime;

        enemy.nurseTimer -= deltaTime;

        if (
            enemy.nurseTimer <= 0 &&
            playerDistance > 58
        ) {
            const targetPlayerX =
                playerX + inputX * 54;

            const targetPlayerY =
                playerY + inputY * 54;

            const attackX =
                targetPlayerX - enemyX;

            const attackY =
                targetPlayerY - enemyY;

            const attackDistance =
                Math.hypot(
                    attackX,
                    attackY
                ) || 1;

            enemy.rushX =
                attackX / attackDistance;

            enemy.rushY =
                attackY / attackDistance;

            enemy.nurseState = "windup";
            enemy.nurseTimer = enemy.windupDuration;
            enemy.rushHit = false;
        }

        return;
    }

    if (enemy.nurseState === "windup") {
        enemy.nurseTimer -= deltaTime;

        if (enemy.nurseTimer <= 0) {
            enemy.nurseState = "rush";
            enemy.nurseTimer = enemy.rushDuration;
            enemy.rushHit = false;
        }

        return;
    }

    if (enemy.nurseState === "rush") {
        enemy.nurseTimer -= deltaTime;

        enemy.x +=
            enemy.rushX *
            enemy.rushSpeed *
            deltaTime;

        enemy.y +=
            enemy.rushY *
            enemy.rushSpeed *
            deltaTime;

        const touchingPlayer =
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y;

        if (
            touchingPlayer &&
            !enemy.rushHit
        ) {
            enemy.rushHit = true;
            enemy.touchingPlayer = true;

            damagePlayerFromEntity(
                0.5,
                enemy,
                8
            );

            enemy.nurseState = "recover";
            enemy.nurseTimer = enemy.recoverDuration;

            return;
        }

        const hitWall =
            enemy.x <= 20 ||
            enemy.y <= 20 ||
            enemy.x + enemy.width >= canvas.width - 20 ||
            enemy.y + enemy.height >= canvas.height - 20;

        if (
            enemy.nurseTimer <= 0 ||
            hitWall
        ) {
            enemy.nurseState = "recover";
            enemy.nurseTimer = enemy.recoverDuration;
        }

        return;
    }

    if (enemy.nurseState === "recover") {
        enemy.nurseTimer -= deltaTime;

        if (enemy.nurseTimer <= 0) {
            enemy.nurseState = "intercept";

            enemy.nurseTimer =
                surgeons.length > 0
                    ? 54
                    : 34;

            enemy.flankSide *= -1;
        }
    }
}

// Enfermeras, cirujano y director.
function updateAggressiveNurse(enemy, deltaTime) {
    const {
        directionX,
        directionY,
        distance
    } = getEnemyDirectionToPlayer(enemy);

    if (enemy.commandDelay !== null) {
        enemy.commandDelay -= deltaTime;

        if (enemy.commandDelay <= 0) {
            enemy.commandDelay = null;

            if (
                enemy.nurseState !== "windup" &&
                enemy.nurseState !== "rush"
            ) {
                enemy.nurseState = "windup";

                enemy.nurseTimer = Math.max(
                    18,
                    enemy.windupDuration - 3
                );

                enemy.rushX = directionX;
                enemy.rushY = directionY;
                enemy.commandRushCount++;
            }
        }
    }

    const orderMultiplier =
        performance.now() < hospitalOrderUntil
            ? 1.18
            : 1;

    enemy.nurseTimer -= deltaTime;

    if (enemy.nurseState === "chase") {
        const movement =
            enemy.speed *
            orderMultiplier *
            deltaTime;

        enemy.x += directionX * movement;
        enemy.y += directionY * movement;

        if (enemy.nurseTimer <= 0) {
            if (distance > 85) {
                enemy.nurseState = "windup";
                enemy.nurseTimer = enemy.windupDuration;
                enemy.rushX = directionX;
                enemy.rushY = directionY;
            } else {
                enemy.nurseTimer = 35;
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
            enemy.nurseState = "rush";
            enemy.nurseTimer = enemy.rushDuration;
        }

        return;
    }

    if (enemy.nurseState === "rush") {
        const rushMovement =
            enemy.rushSpeed *
            orderMultiplier *
            deltaTime;

        enemy.x +=
            enemy.rushX *
            rushMovement;

        enemy.y +=
            enemy.rushY *
            rushMovement;

        const hitWall =
            enemy.x <= 20 ||
            enemy.y <= 20 ||
            enemy.x + enemy.width >= canvas.width - 20 ||
            enemy.y + enemy.height >= canvas.height - 20;

        if (
            enemy.nurseTimer <= 0 ||
            hitWall
        ) {
            enemy.nurseState = "recover";

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
            enemy.nurseState = "chase";

            enemy.nurseTimer =
                enemy.chaseDuration +
                Math.random() * 35;
        }
    }
}

function updateSurgeon(enemy, deltaTime) {
    const {
        directionX,
        directionY,
        distance
    } = getEnemyDirectionToPlayer(enemy);

    enemy.strafeTimer -= deltaTime;

    if (enemy.strafeTimer <= 0) {
        enemy.strafeDirection *= -1;

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
        movementX -= directionX * 1.15;
        movementY -= directionY * 1.15;
    } else if (distance > enemy.maximumDistance) {
        movementX += directionX * 0.75;
        movementY += directionY * 0.75;
    }

    const movementLength =
        Math.sqrt(
            movementX * movementX +
            movementY * movementY
        ) || 1;

    const preparingShot =
        enemy.commandVolleyState === "windup" ||
        enemy.shootTimer <= enemy.aimWarningDuration;

    const movementMultiplier =
        preparingShot ? 0.35 : 1;

    enemy.movementX =
        movementX /
        movementLength *
        enemy.movementSpeed *
        movementMultiplier;

    enemy.movementY =
        movementY /
        movementLength *
        enemy.movementSpeed *
        movementMultiplier;

    enemy.x += enemy.movementX * deltaTime;
    enemy.y += enemy.movementY * deltaTime;

    if (enemy.commandVolleyState === "windup") {
        enemy.commandVolleyTimer -= deltaTime;

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

            enemy.commandVolleyState = "idle";
            enemy.commandVolleyCount++;

            enemy.shootTimer = Math.max(
                enemy.shootTimer,
                58
            );
        }

        return;
    }

    enemy.shootTimer -= deltaTime;

    if (enemy.shootTimer <= 0) {
        shootEnemyProjectile(
            enemy,
            "scalpel"
        );

        enemy.shootTimer =
            enemy.shootCooldown;
    }
}

function updateDirectorPressure(enemy, deltaTime, phase) {
    enemy.pressureTimer -= deltaTime;

    if (enemy.pressureState === "cooldown") {
        const canStartInspection =
            enemy.directorState === "pursue";

        if (
            enemy.pressureTimer <= 0 &&
            canStartInspection
        ) {
            enemy.pressureState = "mark";

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
                player.x + player.width / 2;

            enemy.pressureTargetY =
                player.y + player.height / 2;

            enemy.pressureHit = false;
        }

        return;
    }

    if (enemy.pressureState === "mark") {
        if (enemy.pressureTimer <= 0) {
            enemy.pressureState = "active";
            enemy.pressureTimer = 13;
            enemy.pressureHit = false;
        }

        return;
    }

    if (enemy.pressureState === "active") {
        if (enemy.pressureTimer <= 0) {
            enemy.pressureState = "cooldown";

            enemy.pressureTimer =
                phase === 1
                    ? 145
                    : phase === 2
                        ? 112
                        : 84;

            enemy.pressureHit = false;
        }
    }
}

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
            performance.now() + 900;

        enemy.attackTimer = Math.min(
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
            enemy.attackTimer -= deltaTime;
        }

        const pursuitSpeed =
            enemy.speed +
            (phase - 1) *
            0.14;

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
            const staffAlive = enemies.some(
                (otherEnemy) =>
                    otherEnemy.type === "aggressiveNurse" ||
                    otherEnemy.type === "surgeon"
            );

            const canGiveOrder =
                enemy.nextAttack === "order" &&
                phase < 3 &&
                staffAlive;

            if (canGiveOrder) {
                enemy.directorState = "orderWindup";
                enemy.stateTimer = enemy.orderWindupDuration;
                enemy.nextAttack = "charge";
            } else {
                enemy.directorState = "chargeWindup";

                enemy.stateTimer = Math.max(
                    24,
                    enemy.chargeWindupDuration -
                    (phase - 1) * 4
                );

                enemy.chargeX = directionX;
                enemy.chargeY = directionY;

                enemy.chargeRepeatsRemaining =
                    phase === 3 ? 1 : 0;

                enemy.nextAttack =
                    phase === 3
                        ? "charge"
                        : "order";
            }
        }

        return;
    }

    if (enemy.directorState === "orderWindup") {
        enemy.stateTimer -= deltaTime;

        if (enemy.stateTimer <= 0) {
            hospitalOrderUntil =
                performance.now() +
                enemy.orderDuration +
                (phase - 1) * 250;

            commandRoom4Staff(
                enemy,
                phase
            );

            enemy.directorState = "orderActive";
            enemy.stateTimer = enemy.orderActiveDuration;
        }

        return;
    }

    if (enemy.directorState === "orderActive") {
        enemy.stateTimer -= deltaTime;

        if (enemy.stateTimer <= 0) {
            enemy.directorState = "recover";

            enemy.stateTimer =
                getDirectorRecoveryDuration(phase);
        }

        return;
    }

    if (enemy.directorState === "chargeWindup") {
        enemy.stateTimer -= deltaTime;

        if (enemy.stateTimer <= 0) {
            enemy.directorState = "charge";

            enemy.stateTimer =
                enemy.chargeDuration +
                (phase - 1) * 2;

            enemy.currentChargeSpeed =
                enemy.chargeSpeed +
                (phase - 1) * 0.28;

            enemy.chargeHit = false;
        }

        return;
    }

    if (enemy.directorState === "charge") {
        enemy.stateTimer -= deltaTime;

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
                enemy.directorState = "chargeWindup";
                enemy.stateTimer = 22;
                enemy.chargeX = directionX;
                enemy.chargeY = directionY;
            } else {
                enemy.directorState = "recover";

                enemy.stateTimer =
                    getDirectorRecoveryDuration(phase);
            }
        }

        return;
    }

    if (enemy.directorState === "recover") {
        enemy.stateTimer -= deltaTime;

        if (enemy.stateTimer <= 0) {
            enemy.directorState = "pursue";

            enemy.attackTimer =
                getDirectorAttackInterval(
                    phase,
                    enemy.nextAttack
                ) +
                Math.random() * 22;
        }
    }
}
// Actualización general y límites de la sala.
const ENEMY_UPDATE_HANDLERS = {
    leper: updateLeper,
    doctor: updateDoctor,
    nurse: updateNurse,
    traumatologist: updateTraumatologist,
    director: updateDirector
};

function updateFallbackAnesthesiologist(enemy, deltaTime) {
    const multiplier =
        performance.now() < hospitalOrderUntil ? 1.6 : 1;

    const movement =
        enemy.speed *
        multiplier *
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

function getEnemyUpdateHandler(enemy) {
    if (enemy.type === "anesthesiologist") {
        if (enemy.preparationAnesthesiologist) {
            return updatePreparationAnesthesiologist;
        }

        if (enemy.bossAssistant) {
            return updateBossAnesthesiologist;
        }

        return isCurrentRoomType("trauma")
            ? updateAnesthesiologist
            : updateFallbackAnesthesiologist;
    }

    if (enemy.type === "aggressiveNurse") {
        return enemy.surgicalPreparationNurse
            ? updateSurgicalPreparationNurse
            : updateAggressiveNurse;
    }

    if (enemy.type === "surgeon") {
        return enemy.surgicalPreparationSurgeon
            ? updateSurgicalPreparationSurgeon
            : updateSurgeon;
    }

    return ENEMY_UPDATE_HANDLERS[enemy.type] || null;
}

function updateEnemyKnockbackAndBounds(enemy, deltaTime) {
    enemy.x += enemy.knockbackX * deltaTime;
    enemy.y += enemy.knockbackY * deltaTime;

    enemy.knockbackX *= 0.92;
    enemy.knockbackY *= 0.92;

    if (enemy.x < 20) {
        enemy.x = 20;

        if (enemy.type === "surgeon") {
            enemy.movementX = Math.abs(enemy.movementX);
        } else {
            enemy.knockbackX = 0;
        }
    }

    if (enemy.y < 20) {
        enemy.y = 20;

        if (enemy.type === "surgeon") {
            enemy.movementY = Math.abs(enemy.movementY);
        } else {
            enemy.knockbackY = 0;
        }
    }

    if (enemy.x + enemy.width > canvas.width - 20) {
        enemy.x =
            canvas.width -
            20 -
            enemy.width;

        if (enemy.type === "surgeon") {
            enemy.movementX = -Math.abs(enemy.movementX);
        } else {
            enemy.knockbackX = 0;
        }
    }

    if (enemy.y + enemy.height > canvas.height - 20) {
        enemy.y =
            canvas.height -
            20 -
            enemy.height;

        if (enemy.type === "surgeon") {
            enemy.movementY = -Math.abs(enemy.movementY);
        } else {
            enemy.knockbackY = 0;
        }
    }
}

function updateEnemies(deltaTime) {
    enemies.forEach((enemy) => {
        if (typeof enemy.knockbackX !== "number") {
            enemy.knockbackX = 0;
        }

        if (typeof enemy.knockbackY !== "number") {
            enemy.knockbackY = 0;
        }

        const updateHandler =
            getEnemyUpdateHandler(enemy);

        if (updateHandler) {
            updateHandler(
                enemy,
                deltaTime
            );
        }

        updateEnemyKnockbackAndBounds(
            enemy,
            deltaTime
        );
    });
}

// Generación de enemigos según la sala.
function spawnSurgicalPreparationEnemies() {
    spawnEnemyGroup(
        2,
        (index) => {
            const precision = index === 0;

            return {
                type: "surgeon",
                surgicalPreparationSurgeon: true,
                surgicalIndex: index,
                x: precision ? 90 : canvas.width - 140,
                y: precision ? 105 : canvas.height - 145,
                width: 44,
                height: 44,
                health: 7,
                maxHealth: 7,
                speed: 1.35,
                color: precision ? "#f0ca63" : "#e68d63",
                knockbackResistance: 2.4,
                surgicalState: "reposition",
                surgicalTimer: precision ? 36 : 72,
                surgicalRole: precision ? "precision" : "coverage",
                currentPattern: precision ? "precision" : "coverage",
                lastShotPattern: null,
                soloNextPattern: precision ? "precision" : "coverage",
                aimTargetX: player.x + player.width / 2,
                aimTargetY: player.y + player.height / 2,
                aimDuration: precision ? 25 : 30,
                currentAimDuration: precision ? 25 : 30,
                attackCooldown: precision ? 74 : 90,
                coverageSpread: 0.23,
                preferredDistance: precision ? 215 : 255,
                orbitDirection: precision ? 1 : -1,
                surgicalAttackCount: 0,
                movementX: 0,
                movementY: 0,
                strafeTimer: 100,
                strafeDirection: precision ? 1 : -1,
                minimumDistance: 155,
                maximumDistance: 285,
                movementSpeed: precision ? 1.65 : 1.5,
                aimWarningDuration: 18,
                shootTimer: 999999,
                shootCooldown: 999999,
                commandVolleyState: "idle",
                commandVolleyTimer: 0,
                commandVolleySpread: 0.2,
                commandVolleyCount: 0
            };
        }
    );

    enemies.push(
        createEnemy({
            type: "aggressiveNurse",
            surgicalPreparationNurse: true,
            x: canvas.width / 2 - 20,
            y: 115,
            width: 40,
            height: 40,
            health: 5,
            maxHealth: 5,
            speed: 2.15,
            color: "#72be87",
            knockbackResistance: 1.7,
            nurseState: "intercept",
            nurseTimer: 46,
            flankSide: 1,
            windupDuration: 19,
            rushDuration: 24,
            rushSpeed: 5.15,
            rushX: 0,
            rushY: 0,
            rushHit: false,
            recoverDuration: 29,
            recoverSpeed: 0.7,
            chaseDuration: 60,
            commandDelay: null,
            commandRushCount: 0
        })
    );
}

function spawnAnesthesiaPreparationEnemies() {
    spawnEnemyGroup(
        2,
        (index) =>
            createAnesthesiaPreparationConfig(index)
    );
}

function spawnEnemies(amount) {
    if (isCurrentRoomType("doctor")) {
        spawnEnemyGroup(
            2,
            (index) =>
                createLeperConfig(index)
        );

        enemies.push(
            createEnemy({
                type: "doctor",
                x: canvas.width / 2 - 25,
                y: 100,
                width: 50,
                height: 50,
                health: 12,
                maxHealth: 12,
                color: "purple",
                knockbackResistance: 4,
                moveSpeed: 1.15,
                preferredDistance: 210,
                doctorMoveTimer: 90 + Math.random() * 90,
                strafeDirection: Math.random() < 0.5 ? -1 : 1,
                attackState: "cooldown",
                attackTimer: 65,
                shotsRemaining: 0,
                burstTimer: 0,
                nursesSpawned: false
            })
        );

        return;
    }

    if (isCurrentRoomType("trauma")) {
        spawnEnemyGroup(
            2,
            (index) =>
                createLeperConfig(index)
        );

        enemies.push(
            createEnemy({
                type: "anesthesiologist",
                x: canvas.width - 120,
                y: 100,
                width: 40,
                height: 40,
                speed: 2.70,
                health: 5,
                maxHealth: 5,
                color: "blue",
                knockbackResistance: 1.5,
                anesthesiologistState: "harass",
                preferredDistance: 145,
                harassSpeed: 2.70,
                orbitDirection: Math.random() < 0.5 ? -1 : 1,
                repositionTimer: 24 + Math.random() * 28,
                attackTimer: 30 + Math.random() * 24,
                windupDuration: 16,
                fakeChance: 0.45,
                willFake: false,
                fakeDirection: 1,
                fakeSpeed: 4.0,
                fakeDuration: 12,
                dashSpeed: 6.0,
                dashDuration: 26,
                dashX: 0,
                dashY: 0,
                retreatSpeed: 3.4,
                retreatDuration: 16,
                stateTimer: 0,
                anesthesiaUsedThisDash: false
            })
        );

        enemies.push(
            createEnemy({
                type: "traumatologist",
                x: canvas.width / 2 - 25,
                y: 100,
                width: 50,
                height: 50,
                health: 15,
                maxHealth: 15,
                color: "orange",
                knockbackResistance: 3,
                normalSpeed: 2.40,
                enragedSpeed: 2.70,
                marchSpeed: 3.30,
                enragedMarchSpeed: 3.70,
                traumaState: "chase",
                stateTimer: 0,
                attackCooldownTimer: 55,
                chargeTriggerDistance: 320,
                slamTriggerDistance: 125,
                chargeSpeed: 6.35,
                enragedChargeSpeed: 7.0,
                chargeX: 0,
                chargeY: 0,
                attackHitThisStrike: false,
                slamRadius: 96,
                enragedSlamRadius: 112,
                currentSlamRadius: 96,
                slamHitThisAttack: false,
                enraged: false
            })
        );

        return;
    }

    if (isCurrentRoomType("director")) {
        spawnEnemyGroup(
            2,
            (index) => ({
                type: "aggressiveNurse",
                x: canvas.width - 145,
                y: index === 0 ? 120 : canvas.height - 160,
                speed: 1.65,
                health: 5,
                maxHealth: 5,
                color: "green",
                nurseState: "chase",
                nurseTimer:
                    65 +
                    index * 70 +
                    Math.random() * 12,
                chaseDuration: 82,
                windupDuration: 24,
                rushDuration: 22,
                recoverDuration: 42,
                rushSpeed: 3.60,
                recoverSpeed: 0.75,
                rushX: 0,
                rushY: 0,
                commandDelay: null,
                commandRushCount: 0
            })
        );

        enemies.push(
            createEnemy({
                type: "surgeon",
                x: 125,
                y: 100,
                width: 45,
                height: 45,
                speed: 0.8,
                health: 8,
                maxHealth: 8,
                color: "yellow",
                knockbackResistance: 2,
                movementState: "reposition",
                movementX: 0,
                movementY: 0,
                movementSpeed: 1.45,
                strafeDirection: Math.random() < 0.5 ? -1 : 1,
                strafeTimer: 80,
                minimumDistance: 165,
                maximumDistance: 290,
                aimWarningDuration: 18,
                commandVolleyState: "idle",
                commandVolleyTimer: 0,
                commandVolleySpread: 0.20,
                commandVolleyCount: 0,
                shootTimer: 120,
                shootCooldown: 128
            })
        );

        enemies.push(
            createEnemy({
                type: "director",
                x: canvas.width / 2 - 30,
                y: 90,
                width: 60,
                height: 60,
                speed: 1.15,
                health: 18,
                maxHealth: 18,
                color: "orange",
                knockbackResistance: 4,
                attackCooldown: 950,
                lastAttackTime: 0,
                directorState: "pursue",
                stateTimer: 0,
                attackTimer: 125,
                attackInterval: 105,
                room4Phase: 1,
                phaseFlashUntil: 0,
                commandsIssued: 0,
                pressureState: "cooldown",
                pressureTimer: 80,
                pressureMarkDuration: 34,
                pressureTargetX: 0,
                pressureTargetY: 0,
                pressureRadius: 64,
                pressureHit: false,
                nextAttack: "order",
                orderWindupDuration: 42,
                orderActiveDuration: 30,
                orderDuration: 2200,
                chargeWindupDuration: 36,
                chargeDuration: 28,
                chargeSpeed: 4.2,
                currentChargeSpeed: 4.2,
                chargeX: 0,
                chargeY: 0,
                chargeHit: false,
                chargeRepeatsRemaining: 0,
                recoverDuration: 46
            })
        );

        return;
    }

    spawnEnemyGroup(
        amount,
        (index) =>
            createLeperConfig(index)
    );
}

function spawnNurses(doctor) {
    spawnEnemyGroup(
        2,
        (index) => {
            const angle =
                Math.PI * index;

            return {
                type: "nurse",
                x:
                    doctor.x +
                    doctor.width / 2 +
                    Math.cos(angle) * 55 -
                    20,
                y:
                    doctor.y +
                    doctor.height / 2 +
                    Math.sin(angle) * 55 -
                    20,
                speed: 1.5,
                health: 4,
                maxHealth: 4,
                color: "cyan",
                nurseRole:
                    index === 0
                        ? "guard"
                        : "hunter",
                roleTimer:
                    210 +
                    Math.random() * 30,
                hunterBoostTimer:
                    index === 1
                        ? 60
                        : 0
            };
        }
    );
}

// Señales visuales de los enemigos.
function drawEnemies() {
    enemies.forEach((enemy) => {
        ctx.fillStyle = enemy.color;

        ctx.fillRect(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
        );

        ctx.save();

        if (
            enemy.type === "aggressiveNurse" &&
            enemy.nurseState === "windup"
        ) {
            const centerX =
                enemy.x + enemy.width / 2;

            const centerY =
                enemy.y + enemy.height / 2;

            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;

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

        if (
            enemy.type === "surgeon" &&
            (
                enemy.shootTimer <= enemy.aimWarningDuration ||
                enemy.commandVolleyState === "windup"
            )
        ) {
            ctx.strokeStyle =
                "rgba(255, 255, 255, 0.85)";

            ctx.lineWidth = 2;

            ctx.strokeRect(
                enemy.x - 4,
                enemy.y - 4,
                enemy.width + 8,
                enemy.height + 8
            );
        }

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

            const baseAngle = Math.atan2(
                targetY - centerY,
                targetX - centerX
            );

            ctx.strokeStyle =
                "rgba(255, 235, 150, 0.85)";

            ctx.lineWidth = 2;

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

                ctx.lineWidth = 2;

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

            ctx.strokeStyle = inspectionActive
                ? "white"
                : "rgba(255, 190, 70, 0.9)";

            ctx.lineWidth = inspectionActive
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

                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;

                ctx.stroke();
            }

            ctx.fillStyle = "white";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";

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

            ctx.lineWidth = 4;

            ctx.stroke();

            ctx.fillStyle = "white";
            ctx.font = "bold 22px Arial";
            ctx.textAlign = "center";

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
                Math.sin(
                    performance.now() / 85
                ) * 6;

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

            ctx.lineWidth = 4;

            ctx.stroke();

            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";

            ctx.fillText(
                "ORDEN",
                centerX,
                enemy.y - 12
            );
        }

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

            ctx.strokeStyle = "white";
            ctx.lineWidth = 5;

            ctx.stroke();

            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";

            ctx.fillText(
                "FASE " + enemy.room4Phase,
                centerX,
                enemy.y - 16
            );
        }

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

            ctx.lineWidth = 4;

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
            ctx.strokeStyle = "white";
            ctx.lineWidth = 5;

            ctx.strokeRect(
                enemy.x - 5,
                enemy.y - 5,
                enemy.width + 10,
                enemy.height + 10
            );
        }

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

                ctx.lineWidth = 2;

                ctx.stroke();
            }

            if (
                enemy.anesthesiologistState === "windup"
            ) {
                const warningProgress =
                    1 -
                    enemy.stateTimer /
                    enemy.windupDuration;

                ctx.strokeStyle = "white";
                ctx.lineWidth = 3;

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

                ctx.lineWidth = 3;

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

                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;

                ctx.stroke();
            }

            if (
                enemy.anesthesiologistState === "dash"
            ) {
                ctx.strokeStyle =
                    "rgba(120, 225, 255, 1)";

                ctx.lineWidth = 4;

                ctx.strokeRect(
                    enemy.x - 4,
                    enemy.y - 4,
                    enemy.width + 8,
                    enemy.height + 8
                );
            }
        }

        if (
            enemy.type === "anesthesiologist" &&
            isCurrentRoomType("trauma") &&
            (
                enemy.anesthesiologistState === "windup" ||
                enemy.anesthesiologistState === "fakeout"
            )
        ) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;

            ctx.strokeRect(
                enemy.x - 4,
                enemy.y - 4,
                enemy.width + 8,
                enemy.height + 8
            );
        }

        if (
            enemy.type === "traumatologist" &&
            enemy.traumaState === "chargeWindup"
        ) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 4;

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
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
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
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;

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
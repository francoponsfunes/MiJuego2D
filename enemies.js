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

    return isCurrentRoomType("doctor")
        ? ROOM_2_SPEED_MULTIPLIER
        : 1;
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

    // ========================================================================
    // CRUCE CENTRAL
    // Los cuatro leprosos atacan formando dos diagonales.
    // ========================================================================

    if (isCurrentRoomType("junction")) {

        const spawnPoints = [
            {
                x: 90,
                y: 90
            },
            {
                x: canvas.width - 130,
                y: 90
            },
            {
                x: 90,
                y: canvas.height - 150
            },
            {
                x: canvas.width - 130,
                y: canvas.height - 150
            }
        ];

        const spawnPoint =
            spawnPoints[
                index % spawnPoints.length
            ];


        // Primera diagonal:
        // superior izquierda + inferior derecha.
        //
        // Segunda diagonal:
        // superior derecha + inferior izquierda.
        const openingDelays = [
            26,
            82,
            82,
            26
        ];

        const openingDelay =
            openingDelays[
                index % openingDelays.length
            ];


        return {

            type: "leper",

            x: spawnPoint.x,
            y: spawnPoint.y,

            speed: 1.45,

            health: 4,
            maxHealth: 4,

            color: "red",

            flankSide:
                index % 2 === 0
                    ? -1
                    : 1,

            leperState:
                "windup",

            leperTimer:
                openingDelay,

            junctionAmbusher:
                true,

            junctionInitialDelay:
                openingDelay,

            rushX: 0,
            rushY: 0
        };
    }


    // ========================================================================
    // LEPROSO NORMAL PARA LAS OTRAS SALAS
    // ========================================================================

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

        leperState:
            "chase",

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
function createLeperConfig(index = 0) {

    // ========================================================================
    // CRUCE CENTRAL
    // Los cuatro leprosos atacan formando dos diagonales.
    // ========================================================================

    if (isCurrentRoomType("junction")) {

        const spawnPoints = [
            {
                x: 90,
                y: 90
            },
            {
                x: canvas.width - 130,
                y: 90
            },
            {
                x: 90,
                y: canvas.height - 150
            },
            {
                x: canvas.width - 130,
                y: canvas.height - 150
            }
        ];

        const spawnPoint =
            spawnPoints[
                index % spawnPoints.length
            ];


        // Primera diagonal:
        // superior izquierda + inferior derecha.
        //
        // Segunda diagonal:
        // superior derecha + inferior izquierda.
        const openingDelays = [
            26,
            82,
            82,
            26
        ];

        const openingDelay =
            openingDelays[
                index % openingDelays.length
            ];


        return {

            type: "leper",

            x: spawnPoint.x,
            y: spawnPoint.y,

            speed: 1.45,

            health: 4,
            maxHealth: 4,

            color: "red",

            flankSide:
                index % 2 === 0
                    ? -1
                    : 1,

            leperState:
                "windup",

            leperTimer:
                openingDelay,

            junctionAmbusher:
                true,

            junctionInitialDelay:
                openingDelay,

            rushX: 0,
            rushY: 0
        };
    }


    // ========================================================================
    // LEPROSO NORMAL PARA LAS OTRAS SALAS
    // ========================================================================

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

        leperState:
            "chase",

        leperTimer:
            180 +
            Math.random() * 120,

        rushX: 0,
        rushY: 0
    };
}
function updateLeper(enemy, deltaTime) {

    const enemyX = enemy.x + enemy.width / 2;
    const enemyY = enemy.y + enemy.height / 2;

    const playerX = player.x + player.width / 2;
    const playerY = player.y + player.height / 2;

    const distanceX = playerX - enemyX;
    const distanceY = playerY - enemyY;

    const distance =
        Math.hypot(
            distanceX,
            distanceY
        ) || 1;

    const directionX =
        distanceX / distance;

    const directionY =
        distanceY / distance;

    const orderMultiplier =
        performance.now() < hospitalOrderUntil
            ? 1.6
            : 1;

    const roomMultiplier =
        getLeperSpeedMultiplier();

    const junctionAmbusher =
        isCurrentRoomType("junction") &&
        enemy.junctionAmbusher;

    const interceptor =
        junctionAmbusher &&
        enemy.flankSide === 1;

    const inputX =
        Number(Boolean(keys["d"])) -
        Number(Boolean(keys["a"]));

    const inputY =
        Number(Boolean(keys["s"])) -
        Number(Boolean(keys["w"]));

    const inputLength =
        Math.hypot(
            inputX,
            inputY
        ) || 1;

    const movementX =
        inputX / inputLength;

    const movementY =
        inputY / inputLength;

    const predictionDistance =
        Math.min(
            125,
            Math.max(
                78,
                distance * 0.36
            )
        );

    const interceptionX =
        Math.max(
            40,
            Math.min(
                canvas.width - 40,
                playerX +
                    movementX * predictionDistance
            )
        );

    const interceptionY =
        Math.max(
            40,
            Math.min(
                canvas.height - 40,
                playerY +
                    movementY * predictionDistance
            )
        );

    const rushMultiplier =
        junctionAmbusher
            ? 2.05
            : 1.55;


    // ========================================================================
    // PERSECUCIÓN Y CIERRE DE RUTAS
    // ========================================================================

    if (enemy.leperState === "chase") {

        enemy.leperTimer -=
            deltaTime;

        const minimumDistance =
            junctionAmbusher
                ? 70
                : 90;

        const maximumDistance =
            junctionAmbusher
                ? 440
                : 320;

        if (
            enemy.leperTimer <= 0 &&
            distance > minimumDistance &&
            distance < maximumDistance
        ) {

            enemy.leperState =
                "windup";

            enemy.leperTimer =
                junctionAmbusher
                    ? 21
                    : 18;

            return;
        }

        if (enemy.leperTimer <= 0) {

            enemy.leperTimer =
                junctionAmbusher
                    ? 24
                    : 45;
        }

        let speed =
            enemy.speed *
            orderMultiplier *
            roomMultiplier;

        if (distance > 220) {

            speed *=
                junctionAmbusher
                    ? 1.22
                    : 1.15;
        }

        if (distance < 80) {

            speed *=
                junctionAmbusher
                    ? 0.88
                    : 0.80;
        }

        const flankDistance =
            junctionAmbusher
                ? 46
                : 28;

        const targetX =
            playerX -
            directionY *
                enemy.flankSide *
                flankDistance +
            (
                interceptor
                    ? movementX * 60
                    : 0
            );

        const targetY =
            playerY +
            directionX *
                enemy.flankSide *
                flankDistance +
            (
                interceptor
                    ? movementY * 60
                    : 0
            );

        const movementToTargetX =
            targetX -
            enemyX;

        const movementToTargetY =
            targetY -
            enemyY;

        const movementDistance =
            Math.hypot(
                movementToTargetX,
                movementToTargetY
            ) || 1;

        enemy.x +=
            movementToTargetX /
            movementDistance *
            speed *
            deltaTime;

        enemy.y +=
            movementToTargetY /
            movementDistance *
            speed *
            deltaTime;

        return;
    }


    // ========================================================================
    // ADVERTENCIA Y ELECCIÓN DEL OBJETIVO
    // ========================================================================

    if (enemy.leperState === "windup") {

        enemy.leperTimer -=
            deltaTime;

        if (junctionAmbusher) {

            enemy.junctionTargetX =
                interceptor
                    ? interceptionX
                    : playerX;

            enemy.junctionTargetY =
                interceptor
                    ? interceptionY
                    : playerY;
        }

        const advance =
            junctionAmbusher
                ? 0.28
                : 0.20;

        enemy.x +=
            directionX *
            enemy.speed *
            roomMultiplier *
            advance *
            deltaTime;

        enemy.y +=
            directionY *
            enemy.speed *
            roomMultiplier *
            advance *
            deltaTime;

        if (enemy.leperTimer <= 0) {

            const targetX =
                junctionAmbusher
                    ? enemy.junctionTargetX
                    : playerX;

            const targetY =
                junctionAmbusher
                    ? enemy.junctionTargetY
                    : playerY;

            const attackX =
                targetX -
                enemyX;

            const attackY =
                targetY -
                enemyY;

            const attackDistance =
                Math.hypot(
                    attackX,
                    attackY
                ) || 1;

            enemy.rushX =
                attackX /
                attackDistance;

            enemy.rushY =
                attackY /
                attackDistance;

            enemy.leperState =
                "rush";

            if (junctionAmbusher) {

                const attackSpeed =
                    enemy.speed *
                    rushMultiplier *
                    orderMultiplier *
                    roomMultiplier;

                enemy.leperTimer =
                    Math.max(
                        50,
                        Math.min(
                            138,
                            attackDistance /
                                attackSpeed +
                                12
                        )
                    );

            } else {

                enemy.leperTimer =
                    28;
            }
        }

        return;
    }


    // ========================================================================
    // EMBESTIDA
    // ========================================================================

    if (enemy.leperState === "rush") {

        enemy.leperTimer -=
            deltaTime;

        const speed =
            enemy.speed *
            rushMultiplier *
            orderMultiplier *
            roomMultiplier;

        enemy.x +=
            enemy.rushX *
            speed *
            deltaTime;

        enemy.y +=
            enemy.rushY *
            speed *
            deltaTime;

        if (enemy.leperTimer <= 0) {

            enemy.leperState =
                "chase";

            enemy.leperTimer =
                junctionAmbusher
                    ? 65 +
                        Math.random() * 45
                    : 180 +
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


    // +15% en Sala 2
    const doctorSpeed =
        enemy.moveSpeed *
        getRoomSpeedMultiplier();


    // ========================================================================
    // CAMBIO DE DIRECCIÓN LATERAL
    // ========================================================================

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


    // ========================================================================
    // MOVIMIENTO
    // ========================================================================

    if (!attacking) {


        // --------------------------------------------------------------------
        // DEMASIADO CERCA -> RETROCEDER
        // --------------------------------------------------------------------

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
        }


        // --------------------------------------------------------------------
        // DEMASIADO LEJOS -> ACERCARSE
        // --------------------------------------------------------------------

        else if (distance > 280) {

            enemy.x +=
                directionX *
                doctorSpeed *
                deltaTime;

            enemy.y +=
                directionY *
                doctorSpeed *
                deltaTime;
        }


        // --------------------------------------------------------------------
        // DISTANCIA IDEAL -> MOVIMIENTO LATERAL
        // --------------------------------------------------------------------

        else {

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


            // Corrección de distancia
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


    // ========================================================================
    // ATAQUE - COOLDOWN
    // ========================================================================

    if (enemy.attackState === "cooldown") {

        enemy.attackTimer -=
            deltaTime;


        if (enemy.attackTimer <= 0) {

            enemy.attackState =
                "windup";

            // Advertencia antes de disparar
            enemy.attackTimer =
                24;
        }


        return;
    }


    // ========================================================================
    // ATAQUE - PREPARACIÓN
    // ========================================================================

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


    // ========================================================================
    // ATAQUE - RÁFAGA
    // ========================================================================

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


            // Separación entre las dos jeringas
            enemy.burstTimer =
                10;
        }


        if (enemy.shotsRemaining <= 0) {

            enemy.attackState =
                "cooldown";


            // Cadencia mejorada
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


    // ========================================================================
    // SI EL DOCTOR MUERE
    // ========================================================================

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


    // ========================================================================
    // CAMBIO DE ROL
    // ========================================================================

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


    // ========================================================================
    // GUARDIA
    // ========================================================================

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


        // Se coloca entre Doctor y jugador
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


    // ========================================================================
    // CAZADORA
    // ========================================================================

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


        // Impulso al convertirse en cazadora
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
// Hostigador constante: reposiciona, amaga, entra y vuelve rápido.
// ============================================================================
function changeRoom(newRoom) {

    if (
        !rooms[newRoom] ||
        !isRoomEnabled(newRoom) ||
        changingRoom
    ) {

        return;
    }

    changingRoom =
        true;

    currentRoom =
        newRoom;

    enemies.length =
        0;

    bullets.length =
        0;

    enemyProjectiles.length =
        0;

    bossProjectiles.length =
        0;

    boss.touchingPlayer =
        false;

    player.x =
        canvas.width / 2 -
        player.width / 2;

    player.y =
        canvas.height / 2 -
        player.height / 2;

    const room =
        rooms[currentRoom];

    room.visited =
        true;


    // ========================================================================
    // SALA DEL BOSS
    // ========================================================================

    if (room.type === "boss") {

        if (!room.cleared) {

            resetBossForFight();

        } else {

            boss.active =
                false;

            boss.defeated =
                true;
        }

    } else {

        boss.active =
            false;

        boss.defeated =
            isBossDefeated();

        boss.touchingPlayer =
            false;


        // ====================================================================
        // CREACIÓN DE ENEMIGOS
        // ====================================================================

        if (!room.cleared) {

            if (
                room.type ===
                "anesthesiaPreparation"
            ) {

                spawnAnesthesiaPreparationEnemies();

            } else {

                spawnEnemies(
                    room.enemyCount
                );
            }
        }


        // ====================================================================
        // FARMACIA
        // ====================================================================

        if (room.type === "pharmacy") {

            ensureBrightHeartInPharmacy();
        }
    }

    changingRoom =
        false;
}
function updatePreparationAnesthesiologist(enemy, deltaTime) {

    // ========================================================================
    // DAÑO POR CONTACTO
    // ========================================================================

    const touchingPlayerBeforeMoving =

        player.x <
            enemy.x + enemy.width &&

        player.x + player.width >
            enemy.x &&

        player.y <
            enemy.y + enemy.height &&

        player.y + player.height >
            enemy.y;


    if (

        touchingPlayerBeforeMoving &&

        !enemy.touchingPlayer

    ) {

        enemy.touchingPlayer =
            true;


        damagePlayerFromEntity(

            0.5,

            enemy,

            enemy.preparationState === "dash"
                ? 10
                : 7

        );


        if (

            enemy.preparationState === "dash" &&

            !enemy.dashHit

        ) {

            enemy.dashHit =
                true;

            enemy.preparationState =
                "retreat";

            enemy.stateTimer =
                enemy.retreatDuration;
        }
    }


    if (
        !touchingPlayerBeforeMoving
    ) {

        enemy.touchingPlayer =
            false;
    }


    // ========================================================================
    // POSICIONES
    // ========================================================================

    const enemyX =
        enemy.x + enemy.width / 2;

    const enemyY =
        enemy.y + enemy.height / 2;

    const playerX =
        player.x + player.width / 2;

    const playerY =
        player.y + player.height / 2;


    const distanceX =
        playerX - enemyX;

    const distanceY =
        playerY - enemyY;


    const distance =

        Math.hypot(

            distanceX,

            distanceY

        ) || 1;


    const directionX =
        distanceX / distance;

    const directionY =
        distanceY / distance;


    // ========================================================================
    // COMPROBAR SI TODAVÍA TIENE COMPAÑERO
    // ========================================================================

    const partner = enemies.find((candidate) =>

        candidate !== enemy &&

        candidate.preparationAnesthesiologist

    );


    const shouldBecomeController =

        !partner ||

        (
            partner.preparationState === "attackerWait" &&

            enemy.anesthesiaIndex <
                partner.anesthesiaIndex
        );


    // ========================================================================
    // MOVIMIENTO CIRCULAR
    // ========================================================================

    function orbit(speed, preferredDistance) {

        const orbitX =

            -directionY *
            enemy.orbitDirection;


        const orbitY =

            directionY * 0 +

            directionX *
            enemy.orbitDirection;


        const correction = Math.max(

            -1,

            Math.min(

                1,

                (
                    distance -
                    preferredDistance
                ) / preferredDistance

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

            Math.hypot(

                movementX,

                movementY

            ) || 1;


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


    // ========================================================================
    // ATACANTE EN ESPERA
    // ========================================================================

    if (
        enemy.preparationState === "attackerWait"
    ) {

        orbit(

            enemy.speed,

            enemy.preferredDistance

        );


        if (
            shouldBecomeController
        ) {

            enemy.preparationState =
                "controllerCooldown";


            // Si quedó solo, comienza su propio ataque antes.

            enemy.stateTimer =

                partner
                    ? 28
                    : 18;


            enemy.zoneLocked =
                false;
        }


        return;
    }


    // ========================================================================
    // REPOSICIONAMIENTO DEL CONTROLADOR
    // ========================================================================

    if (
        enemy.preparationState === "controllerCooldown"
    ) {

        enemy.stateTimer -=
            deltaTime;


        orbit(

            enemy.speed * 1.08,

            enemy.preferredDistance

        );


        if (
            enemy.stateTimer <= 0
        ) {

            enemy.preparationState =
                "zoneWindup";

            enemy.stateTimer =
                enemy.zoneWindupDuration;

            enemy.zoneLocked =
                false;
        }


        return;
    }


    // ========================================================================
    // MARCADO DE LA ZONA DE ANESTESIA
    // ========================================================================

    if (
        enemy.preparationState === "zoneWindup"
    ) {

        if (

            !enemy.zoneLocked ||

            enemy.stateTimer >=
                enemy.zoneWindupDuration

        ) {

            const inputX =

                Number(
                    Boolean(keys["d"])
                ) -

                Number(
                    Boolean(keys["a"])
                );


            const inputY =

                Number(
                    Boolean(keys["s"])
                ) -

                Number(
                    Boolean(keys["w"])
                );


            const inputLength =

                Math.hypot(

                    inputX,

                    inputY

                ) || 1;


            enemy.zoneX = Math.max(

                55,

                Math.min(

                    canvas.width - 55,

                    playerX +

                    inputX /
                    inputLength *
                    70

                )

            );


            enemy.zoneY = Math.max(

                55,

                Math.min(

                    canvas.height - 55,

                    playerY +

                    inputY /
                    inputLength *
                    70

                )

            );


            enemy.zoneLocked =
                true;
        }


        enemy.stateTimer -=
            deltaTime;


        orbit(

            enemy.speed * 0.42,

            enemy.preferredDistance

        );


        if (
            enemy.stateTimer <= 0
        ) {

            enemy.preparationState =
                "zoneActive";

            enemy.stateTimer =
                enemy.zoneActiveDuration;

            enemy.zoneHit =
                false;


            // Si hay dos anestesiólogos, se mantiene
            // la combinación habitual entre ambos.

            if (
                partner
            ) {

                partner.preparationState =
                    "dashWindup";

                partner.stateTimer =
                    22;

                partner.dashTargetX =
                    enemy.zoneX;

                partner.dashTargetY =
                    enemy.zoneY;

                partner.dashHit =
                    false;
            }
        }


        return;
    }


    // ========================================================================
    // ZONA ACTIVA
    // ========================================================================

    if (
        enemy.preparationState === "zoneActive"
    ) {

        enemy.stateTimer -=
            deltaTime;


        orbit(

            enemy.speed * 0.55,

            enemy.preferredDistance + 20

        );


        const distanceToZone = Math.hypot(

            playerX -
                enemy.zoneX,

            playerY -
                enemy.zoneY

        );


        if (

            distanceToZone <=
                enemy.zoneRadius &&

            !enemy.zoneHit

        ) {

            enemy.zoneHit =
                true;


            movementDisabledUntil = Math.max(

                movementDisabledUntil,

                performance.now() + 420

            );
        }


        // ====================================================================
        // ANESTESIÓLOGO SOLITARIO
        // Primero activa la zona y después prepara su propio dash.
        // ====================================================================

        const soloZoneElapsed =

            enemy.zoneActiveDuration -

            enemy.stateTimer;


        if (

            !partner &&

            soloZoneElapsed >= 10

        ) {

            enemy.preparationState =
                "dashWindup";

            enemy.stateTimer =
                16;

            enemy.dashTargetX =
                enemy.zoneX;

            enemy.dashTargetY =
                enemy.zoneY;

            enemy.dashHit =
                false;


            return;
        }


        if (
            enemy.stateTimer <= 0
        ) {

            enemy.preparationState =
                "attackerWait";

            enemy.zoneLocked =
                false;
        }


        return;
    }


    // ========================================================================
    // PREPARACIÓN INTELIGENTE DEL DASH
    // ========================================================================

    if (
        enemy.preparationState === "dashWindup"
    ) {

        if (
            enemy.stateTimer > 7
        ) {

            const escapeX =

                Number(
                    Boolean(keys["d"])
                ) -

                Number(
                    Boolean(keys["a"])
                );


            const escapeY =

                Number(
                    Boolean(keys["s"])
                ) -

                Number(
                    Boolean(keys["w"])
                );


            const escapeDistance =

                Math.hypot(

                    escapeX,

                    escapeY

                ) || 1;


            const canPlayerMove =

                performance.now() >=
                movementDisabledUntil;


            const travelFrames =

                distance /

                Math.max(

                    enemy.dashSpeed,

                    1

                );


            const predictedFrames = Math.min(

                36,

                travelFrames +

                Math.min(

                    enemy.stateTimer,

                    10

                )

            );


            const anticipationDistance =

                canPlayerMove

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


        enemy.stateTimer -=
            deltaTime;


        if (
            enemy.stateTimer <= 0
        ) {

            const attackX =

                enemy.dashTargetX -
                enemyX;


            const attackY =

                enemy.dashTargetY -
                enemyY;


            const attackDistance =

                Math.hypot(

                    attackX,

                    attackY

                ) || 1;


            enemy.dashX =

                attackX /
                attackDistance;


            enemy.dashY =

                attackY /
                attackDistance;


            enemy.preparationState =
                "dash";

            enemy.dashHit =
                false;


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


    // ========================================================================
    // DASH
    // ========================================================================

    if (
        enemy.preparationState === "dash"
    ) {

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


        const touchingPlayer =

            player.x <
                enemy.x + enemy.width &&

            player.x + player.width >
                enemy.x &&

            player.y <
                enemy.y + enemy.height &&

            player.y + player.height >
                enemy.y;


        if (

            touchingPlayer &&

            !enemy.dashHit

        ) {

            enemy.dashHit =
                true;

            enemy.touchingPlayer =
                true;


            damagePlayerFromEntity(

                0.5,

                enemy,

                10

            );


            enemy.preparationState =
                "retreat";

            enemy.stateTimer =
                enemy.retreatDuration;


            return;
        }


        const hitWall =

            enemy.x <= 20 ||

            enemy.y <= 20 ||

            enemy.x + enemy.width >=
                canvas.width - 20 ||

            enemy.y + enemy.height >=
                canvas.height - 20;


        if (

            enemy.stateTimer <= 0 ||

            hitWall

        ) {

            enemy.preparationState =
                "retreat";

            enemy.stateTimer =
                enemy.retreatDuration;
        }


        return;
    }


    // ========================================================================
    // RETIRADA
    // ========================================================================

    if (
        enemy.preparationState === "retreat"
    ) {

        enemy.stateTimer -=
            deltaTime;


        enemy.x -=

            directionX *
            3.4 *
            deltaTime;


        enemy.y -=

            directionY *
            3.4 *
            deltaTime;


        if (
            enemy.stateTimer <= 0
        ) {

            enemy.preparationState =
                "controllerCooldown";


            // Cuando queda solo, descansa menos
            // antes de iniciar la siguiente combinación.

            enemy.stateTimer =

                partner

                    ? enemy.controllerDelay

                    : Math.max(

                        16,

                        enemy.controllerDelay - 8

                    );


            enemy.zoneLocked =
                false;

            enemy.orbitDirection *=
                -1;
        }
    }
}
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


    // ========================================================================
    // HOSTIGAMIENTO
    // ========================================================================

    if (enemy.anesthesiologistState === "harass") {

        enemy.attackTimer -=
            deltaTime;

        enemy.repositionTimer -=
            deltaTime;


        // Cambia de lado continuamente.
        // La intención es que el jugador tenga que vigilarlo siempre.
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


        // Nunca debe quedarse fuera de la pelea.
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


        // Ataques frecuentes: muy poco tiempo muerto.
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

            enemy.attackTimer =
                12;
        }


        return;
    }


    // ========================================================================
    // PREPARACIÓN
    // ========================================================================

    if (enemy.anesthesiologistState === "windup") {

        enemy.stateTimer -=
            deltaTime;


        // Se desliza ligeramente de costado mientras telegrafía el ataque.
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


    // ========================================================================
    // AMAGUE
    // ========================================================================

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


    // ========================================================================
    // DASH DE ANESTESIA
    // ========================================================================

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


    // ========================================================================
    // RETIRADA CORTA
    // ========================================================================

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


            // Menos de un segundo a poco más de uno
            // antes de volver a amenazar.
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
// Amenaza territorial: no existe una distancia completamente segura.
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


    // ========================================================================
    // FASE
    // ========================================================================

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


    // ========================================================================
    // PERSECUCIÓN / ELECCIÓN DE ATAQUE
    // ========================================================================

    if (enemy.traumaState === "chase") {

        enemy.attackCooldownTimer -=
            deltaTime;


        // Lejos = marcha. Cerca/media = avance pesado.
        // El Traumatólogo siempre está intentando recuperar espacio.
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

            // ------------------------------------------------------------
            // CERCA -> GOLPE DE ÁREA
            // ------------------------------------------------------------

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


            // ------------------------------------------------------------
            // MEDIA DISTANCIA -> CARGA
            // ------------------------------------------------------------

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


    // ========================================================================
    // PREPARACIÓN DE CARGA
    // ========================================================================

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


    // ========================================================================
    // CARGA
    // ========================================================================

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

            // Buena esquiva = ventana de castigo.
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


    // ========================================================================
    // PREPARACIÓN DEL GOLPE DE ÁREA
    // ========================================================================

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


    // ========================================================================
    // GOLPE DE ÁREA
    // ========================================================================

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


    // ========================================================================
    // ATURDIDO POR CHOCAR CONTRA LA PARED
    // ========================================================================

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


    // ========================================================================
    // RECUPERACIÓN
    // ========================================================================

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
// Orbita al boss, anuncia una entrada recta y vuelve a su puesto.
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


    // ========================================================================
    // FORMACIÓN ALREDEDOR DE CUA CUA
    // ========================================================================

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


    // ========================================================================
    // ADVERTENCIA: EL PUNTO DEL JUGADOR YA QUEDÓ FIJADO
    // ========================================================================

    if (enemy.anesthesiologistState === "windup") {

        enemy.stateTimer -=
            deltaTime;

        // Conserva la formación, pero casi se detiene para que se lea el aviso.
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


    // ========================================================================
    // ENTRADA RECTA
    // ========================================================================

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


    // ========================================================================
    // REGRESO A LA FORMACIÓN
    // ========================================================================

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
// La dificultad sube cuando cae el personal o baja la vida del Director.
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

        // Nunca salen juntas: forman una secuencia esquivable.
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
// Persigue por intervalos, avisa su embestida y luego necesita recuperarse.
// ============================================================================
function updateSurgicalPreparationSurgeon(enemy, deltaTime) {

    // ========================================================================
    // DOS REDUCCIONES SUCESIVAS DEL 8 % EN LA CADENCIA
    // ========================================================================

    const surgicalCadenceMultiplier =
        1 / (0.92 * 0.92);


    // ========================================================================
    // POSICIONES
    // ========================================================================

    const enemyX =
        enemy.x + enemy.width / 2;

    const enemyY =
        enemy.y + enemy.height / 2;

    const playerX =
        player.x + player.width / 2;

    const playerY =
        player.y + player.height / 2;


    const distanceX =
        playerX - enemyX;

    const distanceY =
        playerY - enemyY;


    const distance =

        Math.hypot(

            distanceX,

            distanceY

        ) || 1;


    const directionX =
        distanceX / distance;

    const directionY =
        distanceY / distance;


    // ========================================================================
    // CIRUJANO COMPAÑERO
    // ========================================================================

    const partner = enemies.find((candidate) =>

        candidate !== enemy &&

        candidate.type === "surgeon" &&

        candidate.surgicalPreparationSurgeon

    );


    const inputX =

        Number(
            Boolean(keys["d"])
        ) -

        Number(
            Boolean(keys["a"])
        );


    const inputY =

        Number(
            Boolean(keys["s"])
        ) -

        Number(
            Boolean(keys["w"])
        );


    // ========================================================================
    // MOVIMIENTO LATERAL
    // ========================================================================

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

            (

                distance -

                enemy.preferredDistance

            ) /

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


    // ========================================================================
    // SEPARACIÓN ENTRE CIRUJANOS
    // ========================================================================

    if (
        partner
    ) {

        const partnerX =

            partner.x +

            partner.width / 2;


        const partnerY =

            partner.y +

            partner.height / 2;


        const separationX =

            enemyX -

            partnerX;


        const separationY =

            enemyY -

            partnerY;


        const separation =

            Math.hypot(

                separationX,

                separationY

            ) || 1;


        if (
            separation < 235
        ) {

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

        Math.hypot(

            movementX,

            movementY

        ) || 1;


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


    enemy.x +=

        enemy.movementX *

        deltaTime;


    enemy.y +=

        enemy.movementY *

        deltaTime;


    // ========================================================================
    // APUNTADO PREDICTIVO
    // ========================================================================

    function updateAimTarget() {

        const inputDistance =

            Math.hypot(

                inputX,

                inputY

            ) || 1;


        const travelFrames = Math.min(

            34,

            distance / 5

        );


        const predictionDistance =

            enemy.currentPattern === "precision"

                ? Math.min(

                    100,

                    (

                        travelFrames +

                        5

                    ) *

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


    // ========================================================================
    // REPOSICIONAMIENTO Y RECUPERACIÓN
    // ========================================================================

    if (

        enemy.surgicalState === "reposition" ||

        enemy.surgicalState === "recover"

    ) {

        enemy.surgicalTimer -=

            deltaTime;


        if (
            enemy.surgicalTimer <= 0
        ) {

            enemy.currentPattern =

                partner

                    ? enemy.surgicalRole

                    : enemy.soloNextPattern;


            enemy.currentAimDuration =

                (

                    partner

                        ? enemy.aimDuration

                        : Math.max(

                            19,

                            enemy.aimDuration - 5

                        )

                ) *

                surgicalCadenceMultiplier;


            enemy.surgicalState =

                "aim";


            enemy.surgicalTimer =

                enemy.currentAimDuration;


            updateAimTarget();
        }


        return;
    }


    // ========================================================================
    // APUNTAR Y DISPARAR
    // ========================================================================

    if (
        enemy.surgicalState === "aim"
    ) {

        if (
            enemy.surgicalTimer > 7
        ) {

            updateAimTarget();
        }


        enemy.surgicalTimer -=

            deltaTime;


        if (
            enemy.surgicalTimer > 0
        ) {

            return;
        }


        const currentCenterX =

            enemy.x +

            enemy.width / 2;


        const currentCenterY =

            enemy.y +

            enemy.height / 2;


        const directAngle = Math.atan2(

            playerY -

            currentCenterY,

            playerX -

            currentCenterX

        );


        const aimedAngle = Math.atan2(

            enemy.aimTargetY -

            currentCenterY,

            enemy.aimTargetX -

            currentCenterX

        );


        const aimOffset =

            aimedAngle -

            directAngle;


        // ====================================================================
        // DISPARO DE PRECISIÓN
        // ====================================================================

        if (
            enemy.currentPattern === "precision"
        ) {

            shootEnemyProjectile(

                enemy,

                "scalpel",

                aimOffset

            );

        }

        // ====================================================================
        // DISPARO DE COBERTURA
        // ====================================================================

        else {

            [

                -enemy.coverageSpread,

                0,

                enemy.coverageSpread

            ].forEach((spread) => {

                shootEnemyProjectile(

                    enemy,

                    "scalpel",

                    aimOffset +

                    spread

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


        enemy.surgicalState =

            "recover";


        // ====================================================================
        // RECUPERACIÓN ENTRE DISPAROS
        // ====================================================================

        enemy.surgicalTimer =

            (

                partner

                    ? enemy.attackCooldown

                    : Math.max(

                        35,

                        enemy.attackCooldown - 24

                    )

            ) *

            surgicalCadenceMultiplier;


        // ====================================================================
        // COORDINACIÓN ENTRE CIRUJANOS
        // ====================================================================

        if (

            partner &&

            (

                partner.surgicalState === "reposition" ||

                partner.surgicalState === "recover"

            )

        ) {

            const handoffDelay =

                (

                    enemy.currentPattern === "precision"

                        ? 18

                        : 25

                ) *

                surgicalCadenceMultiplier;


            partner.surgicalTimer = Math.min(

                partner.surgicalTimer,

                handoffDelay

            );
        }
    }
}
function updateSurgicalPreparationNurse(enemy, deltaTime) {

    // ========================================================================
    // POSICIONES
    // ========================================================================

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

        Number(
            Boolean(keys["d"])
        ) -

        Number(
            Boolean(keys["a"])
        );


    const inputY =

        Number(
            Boolean(keys["s"])
        ) -

        Number(
            Boolean(keys["w"])
        );


    // ========================================================================
    // CIRUJANOS PRESENTES
    // ========================================================================

    const surgeons = enemies.filter((candidate) =>

        candidate.surgicalPreparationSurgeon

    );


    const threateningSurgeon = surgeons.find((surgeon) =>

        surgeon.surgicalState === "aim"

    );


    // ========================================================================
    // INTERCEPCIÓN
    // ========================================================================

    if (
        enemy.nurseState === "intercept"
    ) {

        let targetX =

            playerX +
            inputX * 58;


        let targetY =

            playerY +
            inputY * 58;


        // Si un cirujano está apuntando, la enfermera intenta
        // ocupar la dirección más probable de esquiva.

        if (
            threateningSurgeon
        ) {

            const shooterX =

                threateningSurgeon.x +

                threateningSurgeon.width / 2;


            const shooterY =

                threateningSurgeon.y +

                threateningSurgeon.height / 2;


            const shotX =

                playerX -
                shooterX;


            const shotY =

                playerY -
                shooterY;


            const shotDistance =

                Math.hypot(

                    shotX,

                    shotY

                ) || 1;


            const perpendicularX =

                -shotY /
                shotDistance;


            const perpendicularY =

                shotX /
                shotDistance;


            const escapeProjection =

                inputX *
                perpendicularX +

                inputY *
                perpendicularY;


            const escapeSide =

                Math.abs(
                    escapeProjection
                ) > 0.1

                    ? Math.sign(
                        escapeProjection
                    )

                    : enemy.flankSide;


            targetX =

                playerX +

                perpendicularX *

                escapeSide *

                96 +

                inputX * 25;


            targetY =

                playerY +

                perpendicularY *

                escapeSide *

                96 +

                inputY * 25;

        } else {

            targetX +=

                enemy.flankSide *
                46;


            targetY -=

                enemy.flankSide *
                30;
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

            targetX -
            enemyX;


        const moveY =

            targetY -
            enemyY;


        const moveDistance =

            Math.hypot(

                moveX,

                moveY

            ) || 1;


        const interceptSpeed =

            enemy.speed *

            (

                surgeons.length > 0

                    ? 1

                    : 1.24

            );


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


        enemy.nurseTimer -=

            deltaTime;


        if (

            enemy.nurseTimer <= 0 &&

            playerDistance > 58

        ) {

            const targetPlayerX =

                playerX +
                inputX * 54;


            const targetPlayerY =

                playerY +
                inputY * 54;


            const attackX =

                targetPlayerX -
                enemyX;


            const attackY =

                targetPlayerY -
                enemyY;


            const attackDistance =

                Math.hypot(

                    attackX,

                    attackY

                ) || 1;


            enemy.rushX =

                attackX /
                attackDistance;


            enemy.rushY =

                attackY /
                attackDistance;


            enemy.nurseState =

                "windup";


            enemy.nurseTimer =

                enemy.windupDuration;


            enemy.rushHit =

                false;
        }


        return;
    }


    // ========================================================================
    // ADVERTENCIA
    // ========================================================================

    if (
        enemy.nurseState === "windup"
    ) {

        enemy.nurseTimer -=

            deltaTime;


        if (
            enemy.nurseTimer <= 0
        ) {

            enemy.nurseState =

                "rush";


            enemy.nurseTimer =

                enemy.rushDuration;


            enemy.rushHit =

                false;
        }


        return;
    }


    // ========================================================================
    // EMBESTIDA
    // ========================================================================

    if (
        enemy.nurseState === "rush"
    ) {

        enemy.nurseTimer -=

            deltaTime;


        enemy.x +=

            enemy.rushX *

            enemy.rushSpeed *

            deltaTime;


        enemy.y +=

            enemy.rushY *

            enemy.rushSpeed *

            deltaTime;


        const touchingPlayer =

            player.x <
                enemy.x + enemy.width &&

            player.x + player.width >
                enemy.x &&

            player.y <
                enemy.y + enemy.height &&

            player.y + player.height >
                enemy.y;


        if (

            touchingPlayer &&

            !enemy.rushHit

        ) {

            enemy.rushHit =

                true;


            enemy.touchingPlayer =

                true;


            damagePlayerFromEntity(

                0.5,

                enemy,

                8

            );


            enemy.nurseState =

                "recover";


            enemy.nurseTimer =

                enemy.recoverDuration;


            return;
        }


        const hitWall =

            enemy.x <= 20 ||

            enemy.y <= 20 ||

            enemy.x + enemy.width >=
                canvas.width - 20 ||

            enemy.y + enemy.height >=
                canvas.height - 20;


        if (

            enemy.nurseTimer <= 0 ||

            hitWall

        ) {

            enemy.nurseState =

                "recover";


            enemy.nurseTimer =

                enemy.recoverDuration;
        }


        return;
    }


    // ========================================================================
    // RECUPERACIÓN
    // ========================================================================

    if (
        enemy.nurseState === "recover"
    ) {

        enemy.nurseTimer -=

            deltaTime;


        if (
            enemy.nurseTimer <= 0
        ) {

            enemy.nurseState =

                "intercept";


            enemy.nurseTimer =

                surgeons.length > 0

                    ? 54

                    : 34;


            enemy.flankSide *=

                -1;
        }
    }
}
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


    // ========================================================================
    // PERSECUCIÓN CONTROLADA
    // ========================================================================

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

                // La dirección queda fijada antes de la embestida.
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


    // ========================================================================
    // ADVERTENCIA
    // ========================================================================

    if (enemy.nurseState === "windup") {

        // Retrocede apenas para crear una ventana de reacción.
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


    // ========================================================================
    // EMBESTIDA RECTA
    // ========================================================================

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


    // ========================================================================
    // RECUPERACIÓN
    // ========================================================================

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
// Mantiene distancia, rodea al jugador y se frena al preparar el bisturí.
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


    // Movimiento lateral constante.
    let movementX =
        -directionY *
        enemy.strafeDirection;

    let movementY =
        directionX *
        enemy.strafeDirection;


    // Corrige la distancia sin correr directamente hacia el jugador.
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


    // ========================================================================
    // DESCARGA ORDENADA POR EL DIRECTOR
    // ========================================================================

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

            // Evita superponer inmediatamente el tiro normal.
            enemy.shootTimer =
                Math.max(
                    enemy.shootTimer,
                    58
                );
        }

        return;
    }


    // ========================================================================
    // BISTURÍ
    // ========================================================================

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
// PRESIÓN INDEPENDIENTE DEL DIRECTOR: INSPECCIÓN
// Marca la posición del jugador y activa la zona tras una advertencia.
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
// Alterna una orden visible con una carga frontal anunciada.
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

        // La nueva fase entra rápido, pero nunca de forma instantánea.
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


    // ========================================================================
    // PERSECUCIÓN LENTA
    // ========================================================================

    if (enemy.directorState === "pursue") {

        // Mientras inspecciona, sigue moviéndose pero no superpone
        // otra advertencia propia.
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

                // La carga no sigue al jugador después del aviso.
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


    // ========================================================================
    // ORDEN MÉDICA
    // ========================================================================

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


    // ========================================================================
    // CARGA FRONTAL
    // ========================================================================

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

                // La segunda carga vuelve a apuntar y también se anuncia.
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


    // ========================================================================
    // RECUPERACIÓN
    // ========================================================================

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

        // ====================================================================
        // ASEGURAR KNOCKBACK
        // ====================================================================

        if (
            typeof enemy.knockbackX !== "number"
        ) {

            enemy.knockbackX =
                0;
        }


        if (
            typeof enemy.knockbackY !== "number"
        ) {

            enemy.knockbackY =
                0;
        }


        // ====================================================================
        // IA ESPECÍFICA
        // ====================================================================

        if (
            enemy.type === "leper"
        ) {

            updateLeper(
                enemy,
                deltaTime
            );

        } else if (
            enemy.type === "doctor"
        ) {

            updateDoctor(
                enemy,
                deltaTime
            );

        } else if (
            enemy.type === "nurse"
        ) {

            updateNurse(
                enemy,
                deltaTime
            );

        }

        // ====================================================================
        // ANESTESIÓLOGOS DE PREPARACIÓN
        // ====================================================================

        else if (

            enemy.type === "anesthesiologist" &&

            enemy.preparationAnesthesiologist

        ) {

            updatePreparationAnesthesiologist(
                enemy,
                deltaTime
            );

        }

        // ====================================================================
        // ASISTENTES DE CUA CUA
        // ====================================================================

        else if (

            enemy.type === "anesthesiologist" &&

            enemy.bossAssistant

        ) {

            updateBossAnesthesiologist(
                enemy,
                deltaTime
            );

        }

        // ====================================================================
        // ANESTESIÓLOGO DE SALA 3
        // ====================================================================

        else if (

            enemy.type === "anesthesiologist" &&

            isCurrentRoomType("trauma")

        ) {

            updateAnesthesiologist(
                enemy,
                deltaTime
            );

        }

        // ====================================================================
        // TRAUMATÓLOGO
        // ====================================================================

        else if (
            enemy.type === "traumatologist"
        ) {

            updateTraumatologist(
                enemy,
                deltaTime
            );

        }

        // ====================================================================
        // ENFERMERA DE PREPARACIÓN QUIRÚRGICA
        // ====================================================================

        else if (

            enemy.type === "aggressiveNurse" &&

            enemy.surgicalPreparationNurse

        ) {

            updateSurgicalPreparationNurse(
                enemy,
                deltaTime
            );

        }

        // ====================================================================
        // ENFERMERAS DE SALA 4
        // ====================================================================

        else if (
            enemy.type === "aggressiveNurse"
        ) {

            updateAggressiveNurse(
                enemy,
                deltaTime
            );

        }

        // ====================================================================
        // CIRUJANOS DE PREPARACIÓN QUIRÚRGICA
        // ====================================================================

        else if (

            enemy.type === "surgeon" &&

            enemy.surgicalPreparationSurgeon

        ) {

            updateSurgicalPreparationSurgeon(
                enemy,
                deltaTime
            );

        }

        // ====================================================================
        // CIRUJANO DE SALA 4
        // ====================================================================

        else if (
            enemy.type === "surgeon"
        ) {

            updateSurgeon(
                enemy,
                deltaTime
            );

        }

        // ====================================================================
        // DIRECTOR
        // ====================================================================

        else if (
            enemy.type === "director"
        ) {

            updateDirector(
                enemy,
                deltaTime
            );

        }

        // ====================================================================
        // ENEMIGOS GENÉRICOS
        // ====================================================================

        else {

            if (
                enemy.type === "anesthesiologist"
            ) {

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


                if (
                    enemy.x < player.x
                ) {

                    enemy.x +=
                        movement;
                }


                if (
                    enemy.x > player.x
                ) {

                    enemy.x -=
                        movement;
                }


                if (
                    enemy.y < player.y
                ) {

                    enemy.y +=
                        movement;
                }


                if (
                    enemy.y > player.y
                ) {

                    enemy.y -=
                        movement;
                }
            }
        }


        // ====================================================================
        // APLICAR KNOCKBACK
        // ====================================================================

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


        // ====================================================================
        // LÍMITE IZQUIERDO
        // ====================================================================

        if (
            enemy.x < 20
        ) {

            enemy.x =
                20;


            if (
                enemy.type === "surgeon"
            ) {

                enemy.movementX =

                    Math.abs(
                        enemy.movementX
                    );

            } else {

                enemy.knockbackX =
                    0;
            }
        }


        // ====================================================================
        // LÍMITE SUPERIOR
        // ====================================================================

        if (
            enemy.y < 20
        ) {

            enemy.y =
                20;


            if (
                enemy.type === "surgeon"
            ) {

                enemy.movementY =

                    Math.abs(
                        enemy.movementY
                    );

            } else {

                enemy.knockbackY =
                    0;
            }
        }


        // ====================================================================
        // LÍMITE DERECHO
        // ====================================================================

        if (

            enemy.x + enemy.width >

            canvas.width - 20

        ) {

            enemy.x =

                canvas.width -

                20 -

                enemy.width;


            if (
                enemy.type === "surgeon"
            ) {

                enemy.movementX =

                    -Math.abs(
                        enemy.movementX
                    );

            } else {

                enemy.knockbackX =
                    0;
            }
        }


        // ====================================================================
        // LÍMITE INFERIOR
        // ====================================================================

        if (

            enemy.y + enemy.height >

            canvas.height - 20

        ) {

            enemy.y =

                canvas.height -

                20 -

                enemy.height;


            if (
                enemy.type === "surgeon"
            ) {

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
function spawnSurgicalPreparationEnemies() {

    // ========================================================================
    // CIRUJANOS
    // ========================================================================

    spawnEnemyGroup(

        2,

        (index) => {

            const precision =
                index === 0;


            return {

                type:
                    "surgeon",

                surgicalPreparationSurgeon:
                    true,

                surgicalIndex:
                    index,


                // ============================================================
                // POSICIONES INICIALES
                // ============================================================

                x:

                    precision

                        ? 90

                        : canvas.width - 140,


                y:

                    precision

                        ? 105

                        : canvas.height - 145,


                width:
                    44,

                height:
                    44,


                // ============================================================
                // VIDA Y MOVIMIENTO
                // ============================================================

                health:
                    7,

                maxHealth:
                    7,

                speed:
                    1.35,


                color:

                    precision

                        ? "#f0ca63"

                        : "#e68d63",


                knockbackResistance:
                    2.4,


                // ============================================================
                // ROL DE CADA CIRUJANO
                // ============================================================

                surgicalState:
                    "reposition",


                surgicalTimer:

                    precision

                        ? 36

                        : 72,


                surgicalRole:

                    precision

                        ? "precision"

                        : "coverage",


                currentPattern:

                    precision

                        ? "precision"

                        : "coverage",


                lastShotPattern:
                    null,


                soloNextPattern:

                    precision

                        ? "precision"

                        : "coverage",


                // ============================================================
                // APUNTADO
                // ============================================================

                aimTargetX:

                    player.x +
                    player.width / 2,


                aimTargetY:

                    player.y +
                    player.height / 2,


                aimDuration:

                    precision

                        ? 25

                        : 30,


                currentAimDuration:

                    precision

                        ? 25

                        : 30,


                attackCooldown:

                    precision

                        ? 74

                        : 90,


                coverageSpread:
                    0.23,


                // ============================================================
                // POSICIONAMIENTO
                // ============================================================

                preferredDistance:

                    precision

                        ? 215

                        : 255,


                orbitDirection:

                    precision

                        ? 1

                        : -1,


                surgicalAttackCount:
                    0,


                // ============================================================
                // COMPATIBILIDAD CON EL CIRUJANO EXISTENTE
                // ============================================================

                movementX:
                    0,

                movementY:
                    0,

                strafeTimer:
                    100,


                strafeDirection:

                    precision

                        ? 1

                        : -1,


                minimumDistance:
                    155,

                maximumDistance:
                    285,


                movementSpeed:

                    precision

                        ? 1.65

                        : 1.5,


                aimWarningDuration:
                    18,

                shootTimer:
                    999999,

                shootCooldown:
                    999999,

                commandVolleyState:
                    "idle",

                commandVolleyTimer:
                    0,

                commandVolleySpread:
                    0.2,

                commandVolleyCount:
                    0
            };
        }
    );


    // ========================================================================
    // ENFERMERA
    // ========================================================================

    enemies.push(

        createEnemy({

            type:
                "aggressiveNurse",

            surgicalPreparationNurse:
                true,


            x:

                canvas.width / 2 -
                20,


            y:
                115,


            width:
                40,

            height:
                40,


            health:
                5,

            maxHealth:
                5,


            speed:
                2.15,


            color:
                "#72be87",


            knockbackResistance:
                1.7,


            nurseState:
                "intercept",


            nurseTimer:
                46,


            flankSide:
                1,


            windupDuration:
                19,


            rushDuration:
                24,


            rushSpeed:
                5.15,


            rushX:
                0,


            rushY:
                0,


            rushHit:
                false,


            recoverDuration:
                29,


            recoverSpeed:
                0.7,


            chaseDuration:
                60,


            commandDelay:
                null,


            commandRushCount:
                0
        })
    );
}
function spawnAnesthesiaPreparationEnemies() {

    spawnEnemyGroup(

        2,

        (index) => {

            const startsAsController =
                index % 2 === 0;


            return {

                type:
                    "anesthesiologist",

                preparationAnesthesiologist:
                    true,

                anesthesiaIndex:
                    index,


                // ============================================================
                // POSICIÓN INICIAL
                // ============================================================

                x:

                    startsAsController

                        ? 105

                        : canvas.width - 145,


                y:

                    startsAsController

                        ? 105

                        : canvas.height - 145,


                width:
                    40,

                height:
                    40,


                // ============================================================
                // MOVIMIENTO Y VIDA
                // ============================================================

                speed:
                    1.85,

                health:
                    6,

                maxHealth:
                    6,


                color:

                    startsAsController

                        ? "#4f9eff"

                        : "#8068ff",


                knockbackResistance:
                    2,


                // ============================================================
                // ROL INICIAL
                // ============================================================

                preparationState:

                    startsAsController

                        ? "zoneWindup"

                        : "attackerWait",


                stateTimer:

                    startsAsController

                        ? 34

                        : 0,


                preferredDistance:
                    205,


                orbitDirection:

                    startsAsController

                        ? 1

                        : -1,


                // ============================================================
                // ZONA DE ANESTESIA
                // ============================================================

                zoneX:

                    player.x +
                    player.width / 2,


                zoneY:

                    player.y +
                    player.height / 2,


                zoneRadius:
                    88,


                // Antes: 52.
                // Ahora la zona se activa considerablemente más rápido.

                zoneWindupDuration:
                    34,


                zoneActiveDuration:
                    55,


                zoneLocked:
                    startsAsController,


                zoneHit:
                    false,


                // ============================================================
                // DASH DEL COMPAÑERO
                // ============================================================

                dashTargetX:
                    0,

                dashTargetY:
                    0,

                dashX:
                    0,

                dashY:
                    0,


                // Antes: 6.6.

                dashSpeed:
                    9.2,


                dashHit:
                    false,


                // ============================================================
                // DESCANSO ENTRE COMBINACIONES
                // ============================================================

                retreatDuration:
                    13,


                // Antes: 42.

                controllerDelay:
                    26
            };
        }
    );
}
function spawnEnemies(amount) {


    // ========================================================================
    // SALA 2
    // 2 LEPROSOS + DOCTOR LOCO
    // ========================================================================

    if (isCurrentRoomType("doctor")) {

        spawnEnemyGroup(
            2,
            (i) =>
                createLeperConfig(i)
        );


        // ====================================================================
        // DOCTOR LOCO
        // ====================================================================

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


                // ============================================================
                // MOVIMIENTO
                // ============================================================

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


                // ============================================================
                // ATAQUE
                // ============================================================

                attackState:
                    "cooldown",

                // Primer ataque más rápido
                attackTimer:
                    65,

                shotsRemaining:
                    0,

                burstTimer:
                    0,


                // ============================================================
                // ENFERMERAS
                // ============================================================

                nursesSpawned:
                    false
            })
        );


        return;
    }


    // ========================================================================
    // SALA 3
    // 2 LEPROSOS + ANESTESIÓLOGO + TRAUMATÓLOGO
    // ========================================================================

    if (isCurrentRoomType("trauma")) {

        // ====================================================================
        // 2 LEPROSOS
        // ====================================================================

        spawnEnemyGroup(
            2,
            (i) =>
                createLeperConfig(i)
        );


        // ====================================================================
        // ANESTESIÓLOGO
        // Hostigador: reposiciona, amaga y entra con dash de anestesia
        // ====================================================================

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


                // ============================================================
                // HOSTIGAMIENTO
                // ============================================================

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


                // ============================================================
                // FRECUENCIA DE ATAQUE
                // ============================================================

                attackTimer:
                    30 +
                    Math.random() * 24,

                windupDuration:
                    16,


                // ============================================================
                // AMAGUE
                // ============================================================

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


                // ============================================================
                // DASH
                // ============================================================

                dashSpeed:
                    6.0,

                dashDuration:
                    26,

                dashX:
                    0,

                dashY:
                    0,


                // ============================================================
                // RETIRADA
                // ============================================================

                retreatSpeed:
                    3.4,

                retreatDuration:
                    16,


                // ============================================================
                // ESTADO
                // ============================================================

                stateTimer:
                    0,

                anesthesiaUsedThisDash:
                    false
            })
        );


        // ====================================================================
        // TRAUMATÓLOGO
        // Amenaza territorial: carga, golpe de área y castigo por distancia
        // ====================================================================

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


                // ============================================================
                // MOVIMIENTO
                // ============================================================

                normalSpeed:
                    2.40,

                enragedSpeed:
                    2.70,

                marchSpeed:
                    3.30,

                enragedMarchSpeed:
                    3.70,


                // ============================================================
                // ELECCIÓN DE ATAQUE
                // ============================================================

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


                // ============================================================
                // CARGA
                // ============================================================

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


                // ============================================================
                // GOLPE DE ÁREA
                // ============================================================

                slamRadius:
                    96,

                enragedSlamRadius:
                    112,

                currentSlamRadius:
                    96,

                slamHitThisAttack:
                    false,


                // ============================================================
                // FASE
                // ============================================================

                enraged:
                    false
            })
        );


        return;
    }


    // ========================================================================
    // SALA 4
    // 2 ENFERMEROS AGRESIVOS + CIRUJANO + DIRECTOR
    // ========================================================================

    if (isCurrentRoomType("director")) {


        // ====================================================================
        // ENFERMEROS AGRESIVOS
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
    // ENEMIGO BASE: LEPROSO
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


                // ============================================================
                // ROL
                // ============================================================

                nurseRole:
                    i === 0
                        ? "guard"
                        : "hunter",

                roleTimer:
                    210 +
                    Math.random() * 30,


                // La cazadora empieza con impulso
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

        // ====================================================================
        // CUERPO TEMPORAL
        // ====================================================================

        ctx.fillStyle =
            enemy.color;


        ctx.fillRect(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
        );


        // ====================================================================
        // TELEGRÁFICOS TEMPORALES DE GAMEPLAY
        // Se reemplazarán por animaciones/sprites en la etapa visual.
        // ====================================================================

        ctx.save();


        // Enfermera agresiva preparando una embestida
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


        // Cirujano apuntando el próximo bisturí
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


        // Descarga triple coordinada por el Director
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


        // Inspección: presión propia e independiente del Director.
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


            // La línea deja claro que la zona pertenece al Director.
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


            // El círculo interior se cierra hasta que se activa la zona.
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


        // Director preparando la orden médica
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


        // La orden permanece visible mientras dura la aceleración.
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


        // Transición breve entre las tres fases de la sala
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


        // Director preparando la carga frontal
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


        // Cuerpo resaltado durante la carga del Director
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


            // El vínculo visual muestra que trabajan para Cua Cua.
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


        // Anestesiólogo preparando entrada / amague
        if (
            enemy.type === "anesthesiologist" &&
            isCurrentRoomType("trauma") &&
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


        // Traumatólogo preparando carga
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


        // Traumatólogo preparando / ejecutando golpe de área
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


        // Traumatólogo aturdido tras chocar con pared
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

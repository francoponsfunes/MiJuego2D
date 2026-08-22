// ============================================================================
// ROOMS.JS
// Mapa del nivel, puertas, cambios de sala y minimapa
// ============================================================================


// ============================================================================
// NIVEL ACTUAL
// Cada nivel decide si incluye o no una Farmacia.
// ============================================================================

let currentLevel = 1;
let currentRoom = 1;
let changingRoom = false;
let pharmacyUnlockNoticeUntil = 0;

const levelConfigs = {

    1: {
        startRoom: 1,
        bossRoom: 5,
        pharmacyRoom: 10,
        hasPharmacy: true
    }
};


// ============================================================================
// MAPA DISPERSO DEL NIVEL 1
//
//                         [4 Director]
//                              |
//                    [8 Preparación]
//                              |
// [10 Farmacia]-[2 Doctor]-[6 Cruce]-[7 Anestesia]-[3 Trauma]
//                              |
//                         [1 Inicio]-[9 Antesala]-[5 Cua Cua]
// ============================================================================

const rooms = {

    1: {
        id: 1,
        type: "start",
        name: "Recepción",
        enemyCount: 0,
        color: "#222222",
        mapX: 0,
        mapY: 0,
        up: 6,
        down: null,
        left: null,
        right: 9,
        startsCleared: true,
        cleared: true,
        visited: true
    },

    2: {
        id: 2,
        type: "doctor",
        name: "Consultorio",
        enemyCount: 3,
        color: "#242424",
        mapX: -1,
        mapY: -1,
        up: null,
        down: null,
        left: 10,
        right: 6,
        startsCleared: false,
        cleared: false,
        visited: false
    },

    3: {
        id: 3,
        type: "trauma",
        name: "Traumatología",
        enemyCount: 4,
        color: "#262626",
        mapX: 2,
        mapY: -1,
        up: null,
        down: null,
        left: 7,
        right: null,
        startsCleared: false,
        cleared: false,
        visited: false
    },

    4: {
        id: 4,
        type: "director",
        name: "Dirección",
        enemyCount: 4,
        color: "#282828",
        mapX: 0,
        mapY: -3,
        up: null,
        down: 8,
        left: null,
        right: null,
        startsCleared: false,
        cleared: false,
        visited: false
    },

    5: {
        id: 5,
        type: "boss",
        name: "Cua Cua",
        enemyCount: 0,
        color: "#301515",
        mapX: 2,
        mapY: 0,
        up: null,
        down: null,
        left: 9,
        right: null,
        startsCleared: false,
        cleared: false,
        visited: false
    },

    6: {
        id: 6,
        type: "junction",
        name: "Cruce central",
        enemyCount: 4,
        color: "#20242a",
        mapX: 0,
        mapY: -1,
        up: 8,
        down: 1,
        left: 2,
        right: 7,
        startsCleared: false,
        cleared: false,
        visited: false,
        provisional: true
    },

    7: {
        id: 7,
        type: "anesthesiaPreparation",
        name: "Sala de anestesia",
        enemyCount: 2,
        color: "#1f2a30",
        mapX: 1,
        mapY: -1,
        up: null,
        down: null,
        left: 6,
        right: 3,
        startsCleared: false,
        cleared: false,
        visited: false,
        provisional: true
    },

    8: {
        id: 8,
        type: "surgicalPreparation",
        name: "Preparación quirúrgica",
        enemyCount: 2,
        color: "#2b2922",
        mapX: 0,
        mapY: -2,
        up: 4,
        down: 6,
        left: null,
        right: null,
        startsCleared: false,
        cleared: false,
        visited: false,
        provisional: true
    },

    9: {
        id: 9,
        type: "bossAntechamber",
        name: "Antesala de Cua Cua",
        enemyCount: 0,
        color: "#24201f",
        mapX: 1,
        mapY: 0,
        up: null,
        down: null,
        left: 1,
        right: 5,
        startsCleared: true,
        cleared: true,
        visited: false
    },

    10: {
        id: 10,
        type: "pharmacy",
        name: "Farmacia",
        enemyCount: 0,
        color: "#243126",
        mapX: -2,
        mapY: -1,
        up: null,
        down: null,
        left: null,
        right: 2,
        startsCleared: true,
        cleared: true,
        visited: false,
        rewardCollected: false
    }
};


// ============================================================================
// CONSULTAS DEL MAPA
// ============================================================================

function getCurrentLevelConfig() {
    return levelConfigs[currentLevel];
}


function levelHasPharmacy() {

    const config = getCurrentLevelConfig();

    return Boolean(
        config &&
        config.hasPharmacy
    );
}


function getRoomType(roomId = currentRoom) {

    return rooms[roomId]
        ? rooms[roomId].type
        : null;
}


function isCurrentRoomType(type) {
    return getRoomType() === type;
}


function getBossRoomId() {
    return getCurrentLevelConfig().bossRoom;
}


function isBossDefeated() {

    const bossRoom =
        rooms[getBossRoomId()];

    return Boolean(
        bossRoom &&
        bossRoom.cleared
    );
}


function isRoomEnabled(roomId) {

    const room = rooms[roomId];

    if (!room) {
        return false;
    }

    if (room.type === "pharmacy") {
        return levelHasPharmacy();
    }

    return true;
}


function canEnterRoom(fromRoomId, targetRoomId) {

    const targetRoom = rooms[targetRoomId];

    if (
        !targetRoom ||
        !isRoomEnabled(targetRoomId)
    ) {
        return false;
    }

    // La Farmacia solo se abre después de derrotar al jefe del nivel.
    if (
        targetRoom.type === "pharmacy" &&
        !isBossDefeated()
    ) {
        return false;
    }

    // La entrada al jefe requiere las tres llaves.
    if (
        targetRoom.type === "boss" &&
        !targetRoom.cleared &&
        playerKeys < 3 &&
        !bossDoorUnlocked
    ) {
        return false;
    }

    return true;
}


// ============================================================================
// PUERTAS
// ============================================================================

const doors = {
    top: false,
    bottom: false,
    left: false,
    right: false
};

const doorDirections = {
    top: "up",
    bottom: "down",
    left: "left",
    right: "right"
};


function canUseDoor(direction) {

    const room = rooms[currentRoom];

    if (!room || !room.cleared) {
        return false;
    }

    const targetRoomId = room[direction];

    if (targetRoomId === null) {
        return false;
    }

    return canEnterRoom(
        currentRoom,
        targetRoomId
    );
}


function updateDoors() {

    doors.top = canUseDoor("up");
    doors.bottom = canUseDoor("down");
    doors.left = canUseDoor("left");
    doors.right = canUseDoor("right");

    if (
        isCurrentRoomType("boss") &&
        boss.active &&
        !boss.defeated
    ) {
        doors.top = false;
        doors.bottom = false;
        doors.left = false;
        doors.right = false;
    }
}


function getDoorColor(visualDirection) {

    const room = rooms[currentRoom];
    const direction = doorDirections[visualDirection];
    const targetRoomId = room[direction];

    if (
        targetRoomId === null ||
        !isRoomEnabled(targetRoomId)
    ) {
        return "#111";
    }

    if (doors[visualDirection]) {
        return "#777";
    }

    const targetType = getRoomType(targetRoomId);

    if (
        targetType === "boss" ||
        targetType === "pharmacy"
    ) {
        return "#553737";
    }

    return "#333";
}


// ============================================================================
// DIBUJAR HABITACIÓN
// ============================================================================

function drawRoom() {

    ctx.fillStyle = rooms[currentRoom].color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, 20);
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    ctx.fillRect(0, 0, 20, canvas.height);
    ctx.fillRect(canvas.width - 20, 0, 20, canvas.height);

    ctx.fillStyle = getDoorColor("top");
    ctx.fillRect(canvas.width / 2 - 45, 0, 90, 20);

    ctx.fillStyle = getDoorColor("bottom");
    ctx.fillRect(
        canvas.width / 2 - 45,
        canvas.height - 20,
        90,
        20
    );

    ctx.fillStyle = getDoorColor("left");
    ctx.fillRect(
        0,
        canvas.height / 2 - 45,
        20,
        90
    );

    ctx.fillStyle = getDoorColor("right");
    ctx.fillRect(
        canvas.width - 20,
        canvas.height / 2 - 45,
        20,
        90
    );


    // ========================================================================
    // AVISOS DE LA EMBOSCADA DEL CRUCE CENTRAL
    // ========================================================================

    if (isCurrentRoomType("junction")) {

        enemies.forEach((enemy) => {

            if (
                !enemy.junctionAmbusher ||
                enemy.leperState !== "windup"
            ) {
                return;
            }

            const centerX =
                enemy.x + enemy.width / 2;

            const centerY =
                enemy.y + enemy.height / 2;


            const isInterceptor =
                enemy.flankSide === 1;


            const targetX =
                Number.isFinite(enemy.junctionTargetX)
                    ? enemy.junctionTargetX
                    : player.x + player.width / 2;

            const targetY =
                Number.isFinite(enemy.junctionTargetY)
                    ? enemy.junctionTargetY
                    : player.y + player.height / 2;

            const timerRatio =
                Math.max(
                    0,
                    Math.min(
                        1,
                        enemy.leperTimer /
                            enemy.junctionInitialDelay
                    )
                );

            const warningRadius =
                14 +
                timerRatio * 22;

            ctx.beginPath();

            ctx.arc(
                centerX,
                centerY,
                warningRadius,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                enemy.leperTimer <= 23
                    ? (
                        isInterceptor
                            ? "rgba(255, 100, 100, 0.98)"
                            : "rgba(255, 255, 255, 0.95)"
                    )
                    : (
                        isInterceptor
                            ? "rgba(255, 115, 85, 0.78)"
                            : "rgba(255, 190, 80, 0.78)"
                    );

            ctx.lineWidth =
                enemy.leperTimer <= 23
                    ? 3
                    : 2;

            ctx.stroke();

            // En los últimos instantes aparece la dirección de la entrada.
            if (enemy.leperTimer <= 23) {

                ctx.beginPath();

                ctx.moveTo(
                    centerX,
                    centerY
                );

                ctx.lineTo(
                    targetX,
                    targetY
                );

                ctx.strokeStyle =
                    isInterceptor
                        ? "rgba(255, 105, 105, 0.75)"
                        : "rgba(255, 255, 255, 0.60)";

                ctx.lineWidth = 2;
                ctx.stroke();


                ctx.beginPath();

                ctx.arc(
                    targetX,
                    targetY,
                    isInterceptor
                        ? 12
                        : 9,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }
        });
    }


    // ========================================================================
    // PROTOCOLO DE LA SALA DE ANESTESIA
    // ========================================================================

    if (isCurrentRoomType("anesthesiaPreparation")) {

        enemies.forEach((enemy) => {

            if (!enemy.preparationAnesthesiologist) {
                return;
            }

            if (
                enemy.preparationState === "zoneWindup" ||
                enemy.preparationState === "zoneActive"
            ) {

                const zoneActive =
                    enemy.preparationState === "zoneActive";

                const enemyCenterX =
                    enemy.x + enemy.width / 2;

                const enemyCenterY =
                    enemy.y + enemy.height / 2;

                ctx.beginPath();

                ctx.moveTo(
                    enemyCenterX,
                    enemyCenterY
                );

                ctx.lineTo(
                    enemy.zoneX,
                    enemy.zoneY
                );

                ctx.strokeStyle =
                    zoneActive
                        ? "rgba(125, 105, 255, 0.38)"
                        : "rgba(105, 195, 255, 0.62)";

                ctx.lineWidth = 2;
                ctx.stroke();


                ctx.beginPath();

                ctx.arc(
                    enemy.zoneX,
                    enemy.zoneY,
                    enemy.zoneRadius,
                    0,
                    Math.PI * 2
                );

                if (zoneActive) {

                    ctx.fillStyle =
                        "rgba(105, 85, 255, 0.24)";

                    ctx.fill();
                }

                ctx.strokeStyle =
                    zoneActive
                        ? "rgba(185, 170, 255, 0.98)"
                        : "rgba(105, 205, 255, 0.92)";

                ctx.lineWidth =
                    zoneActive
                        ? 4
                        : 3;

                ctx.stroke();


                if (!zoneActive) {

                    const progress =
                        1 -
                        enemy.stateTimer /
                            enemy.zoneWindupDuration;

                    ctx.beginPath();

                    ctx.arc(
                        enemy.zoneX,
                        enemy.zoneY,
                        Math.max(
                            8,
                            enemy.zoneRadius *
                                (1 - progress)
                        ),
                        0,
                        Math.PI * 2
                    );

                    ctx.strokeStyle =
                        "rgba(255, 255, 255, 0.92)";

                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }


            if (enemy.preparationState === "dashWindup") {

                const enemyCenterX =
                    enemy.x + enemy.width / 2;

                const enemyCenterY =
                    enemy.y + enemy.height / 2;

                ctx.strokeStyle =
                    "rgba(255, 125, 210, 0.95)";

                ctx.lineWidth = 4;

                ctx.strokeRect(
                    enemy.x - 5,
                    enemy.y - 5,
                    enemy.width + 10,
                    enemy.height + 10
                );

                ctx.beginPath();

                ctx.moveTo(
                    enemyCenterX,
                    enemyCenterY
                );

                ctx.lineTo(
                    enemy.dashTargetX,
                    enemy.dashTargetY
                );

                ctx.stroke();


                ctx.beginPath();

                ctx.arc(
                    enemy.dashTargetX,
                    enemy.dashTargetY,
                    12,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }
        });
    }


    // ========================================================================
    // FUEGO CRUZADO DE PREPARACIÓN QUIRÚRGICA
    // ========================================================================

    if (isCurrentRoomType("surgicalPreparation")) {

        enemies.forEach((enemy) => {

            if (
                !enemy.surgicalPreparationSurgeon ||
                enemy.surgicalState !== "aim"
            ) {
                return;
            }

            const centerX = enemy.x + enemy.width / 2;
            const centerY = enemy.y + enemy.height / 2;

            const targetX = enemy.aimTargetX;
            const targetY = enemy.aimTargetY;

            const aimX = targetX - centerX;
            const aimY = targetY - centerY;
            const aimDistance = Math.hypot(aimX, aimY) || 1;

            const aimAngle = Math.atan2(aimY, aimX);

            const progress = Math.max(
                0,
                Math.min(
                    1,
                    1 - enemy.surgicalTimer /
                        enemy.currentAimDuration
                )
            );

            const precision = enemy.currentPattern === "precision";

            ctx.strokeStyle = precision
                ? "rgba(255, 225, 115, 0.95)"
                : "rgba(255, 155, 115, 0.95)";

            ctx.lineWidth = 2 + progress * 2;

            ctx.strokeRect(
                enemy.x - 5,
                enemy.y - 5,
                enemy.width + 10,
                enemy.height + 10
            );

            const offsets = precision
                ? [0]
                : [
                    -enemy.coverageSpread,
                    0,
                    enemy.coverageSpread
                ];

            offsets.forEach((offset) => {

                const angle = aimAngle + offset;
                const warningLength = Math.min(290, aimDistance + 30);

                ctx.beginPath();

                ctx.moveTo(centerX, centerY);

                ctx.lineTo(
                    centerX + Math.cos(angle) * warningLength,
                    centerY + Math.sin(angle) * warningLength
                );

                ctx.strokeStyle = precision
                    ? "rgba(255, 238, 175, 0.8)"
                    : "rgba(255, 185, 140, 0.75)";

                ctx.lineWidth = precision ? 2.6 : 1.8;
                ctx.stroke();
            });

            if (precision) {

                ctx.beginPath();

                ctx.arc(
                    targetX,
                    targetY,
                    Math.max(7, 16 - progress * 8),
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }
        });
    }
}


// ============================================================================
// CAMBIAR DE HABITACIÓN
// ============================================================================

function resetBossForFight() {

    boss.active = true;
    boss.defeated = false;
    boss.health = boss.maxHealth;

    boss.x =
        canvas.width / 2 -
        boss.width / 2;

    boss.y = 100;

    boss.phase = 1;
    boss.spawned75 = false;
    boss.spawned50 = false;
    boss.spawned25 = false;

    boss.assistantCommandTimer = 90;
    boss.assistantTurn = 0;
    boss.anesthesiaImmunityUntil = 0;
    boss.attackSequence = 0;

    boss.attackTimer = 55;
    boss.dashTimer = 190;
    boss.dashDuration = 0;

    boss.enraged = false;
    boss.touchingPlayer = false;

    bossProjectiles.length = 0;
}


function changeRoom(newRoom) {

    if (
        !rooms[newRoom] ||
        !isRoomEnabled(newRoom) ||
        changingRoom
    ) {
        return;
    }

    changingRoom = true;
    currentRoom = newRoom;

    enemies.length = 0;
    bullets.length = 0;
    enemyProjectiles.length = 0;
    bossProjectiles.length = 0;

    boss.touchingPlayer = false;

    player.x =
        canvas.width / 2 -
        player.width / 2;

    player.y =
        canvas.height / 2 -
        player.height / 2;

    const room = rooms[currentRoom];
    room.visited = true;

    if (room.type === "boss") {

        if (!room.cleared) {
            resetBossForFight();
        } else {
            boss.active = false;
            boss.defeated = true;
        }

    } else {

        boss.active = false;
        boss.defeated = isBossDefeated();
        boss.touchingPlayer = false;

        if (!room.cleared) {

            if (room.type === "anesthesiaPreparation") {

                spawnAnesthesiaPreparationEnemies();

            } else if (room.type === "surgicalPreparation") {

                spawnSurgicalPreparationEnemies();

            } else {

                spawnEnemies(room.enemyCount);
            }
        }

        if (room.type === "pharmacy") {
            ensureBrightHeartInPharmacy();
        }
    }

    changingRoom = false;
}


function moveThroughDoor(direction) {

    const room = rooms[currentRoom];
    const nextRoom = room[direction];

    if (!canUseDoor(direction)) {
        return;
    }

    if (
        getRoomType(nextRoom) === "boss" &&
        !rooms[nextRoom].cleared
    ) {
        bossDoorUnlocked = true;
    }

    changeRoom(nextRoom);

    if (direction === "right") {
        player.x = 25;
    } else if (direction === "left") {
        player.x = canvas.width - player.width - 25;
    } else if (direction === "up") {
        player.y = canvas.height - player.height - 25;
    } else if (direction === "down") {
        player.y = 25;
    }
}


// ============================================================================
// DETECTAR CAMBIO DE HABITACIÓN
// ============================================================================

function checkRoomChange() {

    if (changingRoom) {
        return;
    }

    if (
        isCurrentRoomType("boss") &&
        boss.active &&
        !boss.defeated
    ) {
        return;
    }

    const room = rooms[currentRoom];

    if (!room.cleared) {
        return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const insideHorizontalDoor =
        player.y + player.height / 2 >= centerY - 45 &&
        player.y + player.height / 2 <= centerY + 45;

    const insideVerticalDoor =
        player.x + player.width / 2 >= centerX - 45 &&
        player.x + player.width / 2 <= centerX + 45;

    if (
        player.x + player.width >= canvas.width - 20 &&
        insideHorizontalDoor
    ) {
        moveThroughDoor("right");
        return;
    }

    if (
        player.x <= 20 &&
        insideHorizontalDoor
    ) {
        moveThroughDoor("left");
        return;
    }

    if (
        player.y <= 20 &&
        insideVerticalDoor
    ) {
        moveThroughDoor("up");
        return;
    }

    if (
        player.y + player.height >= canvas.height - 20 &&
        insideVerticalDoor
    ) {
        moveThroughDoor("down");
    }
}


// ============================================================================
// INFORMACIÓN DE LA HABITACIÓN
// ============================================================================

function drawRoomInfo() {

    ctx.fillStyle = "white";
    ctx.font = "18px Arial";

    ctx.fillText(
        rooms[currentRoom].name,
        canvas.width - 245,
        canvas.height - 24
    );
}


// ============================================================================
// MINIMAPA BASADO EN COORDENADAS
// ============================================================================

function drawMinimap() {

    const enabledRooms =
        Object.values(rooms).filter((room) =>
            isRoomEnabled(room.id)
        );

    const minMapX =
        Math.min(...enabledRooms.map((room) => room.mapX));

    const maxMapX =
        Math.max(...enabledRooms.map((room) => room.mapX));

    const minMapY =
        Math.min(...enabledRooms.map((room) => room.mapY));

    const maxMapY =
        Math.max(...enabledRooms.map((room) => room.mapY));

    const roomSize = 22;
    const gap = 7;
    const step = roomSize + gap;

    const mapWidth =
        (maxMapX - minMapX + 1) * step - gap;

    const mapHeight =
        (maxMapY - minMapY + 1) * step - gap;

    const mapX =
        canvas.width - mapWidth - 18;

    const mapY = 18;

    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.fillRect(
        mapX - 8,
        mapY - 8,
        mapWidth + 16,
        mapHeight + 16
    );

    enabledRooms.forEach((room) => {

        if (!room.visited) {
            return;
        }

        const centerX =
            mapX +
            (room.mapX - minMapX) * step +
            roomSize / 2;

        const centerY =
            mapY +
            (room.mapY - minMapY) * step +
            roomSize / 2;

        ["up", "down", "left", "right"].forEach((direction) => {

            const targetRoomId = room[direction];
            const targetRoom = rooms[targetRoomId];

            if (
                !targetRoom ||
                !targetRoom.visited ||
                !isRoomEnabled(targetRoomId)
            ) {
                return;
            }

            const targetX =
                mapX +
                (targetRoom.mapX - minMapX) * step +
                roomSize / 2;

            const targetY =
                mapY +
                (targetRoom.mapY - minMapY) * step +
                roomSize / 2;

            ctx.strokeStyle = "rgba(170, 170, 170, 0.55)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(targetX, targetY);
            ctx.stroke();
        });
    });

    enabledRooms.forEach((room) => {

        const x =
            mapX +
            (room.mapX - minMapX) * step;

        const y =
            mapY +
            (room.mapY - minMapY) * step;

        const isCurrent = room.id === currentRoom;

        if (!room.visited) {

            ctx.fillStyle = "rgba(10, 10, 10, 0.72)";
            ctx.fillRect(x, y, roomSize, roomSize);

            ctx.strokeStyle = "rgba(70, 70, 70, 0.55)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, roomSize, roomSize);

            ctx.fillStyle = "rgba(105, 105, 105, 0.7)";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("?", x + roomSize / 2, y + roomSize / 2);

            return;
        }

        if (room.type === "boss") {
            ctx.fillStyle = "rgba(105, 25, 25, 0.92)";
        } else if (room.type === "pharmacy") {
            ctx.fillStyle = "rgba(45, 120, 68, 0.92)";
        } else if (isCurrent) {
            ctx.fillStyle = "rgba(245, 245, 245, 0.96)";
        } else if (room.cleared) {
            ctx.fillStyle = "rgba(130, 130, 130, 0.72)";
        } else {
            ctx.fillStyle = "rgba(75, 75, 75, 0.84)";
        }

        ctx.fillRect(x, y, roomSize, roomSize);

        ctx.strokeStyle = isCurrent
            ? "rgba(255, 220, 90, 0.95)"
            : "rgba(220, 220, 220, 0.48)";

        ctx.lineWidth = isCurrent ? 2 : 1;
        ctx.strokeRect(x, y, roomSize, roomSize);

        if (
            room.type === "boss" ||
            room.type === "pharmacy"
        ) {
            ctx.fillStyle = "white";
            ctx.font = "bold 13px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                room.type === "boss" ? "B" : "+",
                x + roomSize / 2,
                y + roomSize / 2
            );
        }
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}


// ============================================================================
// REINICIAR HABITACIONES
// ============================================================================

function resetRoomsForNewRun() {

    const startRoom =
        getCurrentLevelConfig().startRoom;

    Object.values(rooms).forEach((room) => {

        room.cleared = room.startsCleared;
        room.visited = room.id === startRoom;

        if (room.type === "pharmacy") {
            room.rewardCollected = false;
        }
    });

    currentRoom = startRoom;
    changingRoom = false;
    pharmacyUnlockNoticeUntil = 0;
}


// ============================================================================
// COMPROBAR SI LA SALA ESTÁ COMPLETADA
// ============================================================================

function checkRoomClear() {

    const room = rooms[currentRoom];

    if (
        room.type !== "boss" &&
        enemies.length === 0 &&
        !room.cleared
    ) {
        room.cleared = true;
    }
}

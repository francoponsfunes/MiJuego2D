// ============================================================================
// ROOMS.JS
// Mapa, puertas, avisos visuales, cambios de sala y minimapa.
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
        hasPharmacy: true,
        bossImplemented: true,
        bossKeysRequired: 3
    },

    2: {
        startRoom: 11,
        bossRoom: 23,
        pharmacyRoom: null,
        hasPharmacy: false,
        bossImplemented: false,
        bossKeysRequired: 3
    }
};

const ROOM_DIRECTIONS = [
    "up",
    "down",
    "left",
    "right"
];

const ROOM_DEFINITIONS = [
    {
        id: 1,
        type: "start",
        name: "Recepción",
        enemyCount: 0,
        color: "#222222",
        mapX: 0,
        mapY: 0,
        up: 6,
        right: 9,
        startsCleared: true
    },

    {
        id: 2,
        type: "doctor",
        name: "Consultorio",
        enemyCount: 3,
        color: "#242424",
        mapX: -1,
        mapY: -1,
        left: 10,
        right: 6
    },

    {
        id: 3,
        type: "trauma",
        name: "Traumatología",
        enemyCount: 4,
        color: "#262626",
        mapX: 2,
        mapY: -1,
        left: 7
    },

    {
        id: 4,
        type: "director",
        name: "Dirección",
        enemyCount: 4,
        color: "#282828",
        mapX: 0,
        mapY: -3,
        down: 8
    },

    {
        id: 5,
        type: "boss",
        name: "Cua Cua",
        enemyCount: 0,
        color: "#301515",
        mapX: 2,
        mapY: 0,
        left: 9
    },

    {
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
        provisional: true
    },

    {
        id: 7,
        type: "anesthesiaPreparation",
        name: "Sala de anestesia",
        enemyCount: 2,
        color: "#1f2a30",
        mapX: 1,
        mapY: -1,
        left: 6,
        right: 3,
        provisional: true
    },

    {
        id: 8,
        type: "surgicalPreparation",
        name: "Preparación quirúrgica",
        enemyCount: 2,
        color: "#2b2922",
        mapX: 0,
        mapY: -2,
        up: 4,
        down: 6,
        provisional: true
    },

    {
        id: 9,
        type: "bossAntechamber",
        name: "Antesala de Cua Cua",
        enemyCount: 0,
        color: "#24201f",
        mapX: 1,
        mapY: 0,
        left: 1,
        right: 5,
        startsCleared: true
    },

    {
        id: 10,
        type: "pharmacy",
        name: "Farmacia",
        enemyCount: 0,
        color: "#243126",
        mapX: -2,
        mapY: -1,
        right: 2,
        startsCleared: true
    }
];
const LEVEL_2_ROOM_DEFINITIONS = [
    {
        id: 11,
        type: "start",
        name: "Ascensor - Piso 2",
        enemyCount: 0,
        color: "#242a31",
        mapX: 0,
        mapY: 0,
        up: 12,
        startsCleared: true
    },

    {
        id: 12,
        type: "transferIntroduction",
        name: "Sector de traslados",
        enemyCount: 0,
        plannedEnemyCount: 2,
        color: "#27313a",
        mapX: 0,
        mapY: -1,
        up: 15,
        down: 11,
        left: 13,
        right: 14
    },

    {
        id: 13,
        type: "securityIntroduction",
        name: "Puesto del celador",
        enemyCount: 0,
        plannedEnemyCount: 2,
        keyReward: true,
        color: "#2b3037",
        mapX: -1,
        mapY: -1,
        up: 16,
        right: 12
    },

    {
        id: 14,
        type: "transferCorridor",
        name: "Pasillo de traslados",
        enemyCount: 0,
        plannedEnemyCount: 3,
        color: "#293540",
        mapX: 1,
        mapY: -1,
        up: 18,
        left: 12,
        right: 17
    },

    {
        id: 15,
        type: "inpatientJunction",
        name: "Cruce de internación",
        enemyCount: 0,
        plannedEnemyCount: 3,
        color: "#30343a",
        mapX: 0,
        mapY: -2,
        up: 22,
        down: 12,
        left: 16,
        right: 18
    },

    {
        id: 16,
        type: "securityWard",
        name: "Guardia de internación",
        enemyCount: 0,
        plannedEnemyCount: 3,
        keyReward: true,
        color: "#30313d",
        mapX: -1,
        mapY: -2,
        down: 13,
        left: 19,
        right: 15
    },

    {
        id: 17,
        type: "transferStorage",
        name: "Depósito de traslados",
        enemyCount: 0,
        plannedEnemyCount: 4,
        optionalRoom: true,
        color: "#34322d",
        mapX: 2,
        mapY: -1,
        left: 14
    },

    {
        id: 18,
        type: "inpatientWard",
        name: "Sala de internación",
        enemyCount: 0,
        plannedEnemyCount: 3,
        keyReward: true,
        color: "#28373b",
        mapX: 1,
        mapY: -2,
        up: 21,
        down: 14,
        left: 15
    },

    {
        id: 19,
        type: "optionalChallenge",
        name: "Ala restringida",
        enemyCount: 0,
        plannedEnemyCount: 4,
        optionalRoom: true,
        color: "#382f34",
        mapX: -2,
        mapY: -2,
        left: 20,
        right: 16
    },

    {
        id: 20,
        type: "supplyRoom",
        name: "Sala de suministros",
        enemyCount: 0,
        color: "#29382f",
        mapX: -3,
        mapY: -2,
        right: 19,
        startsCleared: true
    },

    {
        id: 21,
        type: "advancedWard",
        name: "Internación avanzada",
        enemyCount: 0,
        plannedEnemyCount: 4,
        keyReward: true,
        color: "#363139",
        mapX: 1,
        mapY: -3,
        down: 18,
        left: 22
    },

    {
        id: 22,
        type: "bossAntechamber",
        name: "Antesala de traslados",
        enemyCount: 0,
        color: "#302a2d",
        mapX: 0,
        mapY: -3,
        up: 23,
        down: 15,
        right: 21,
        startsCleared: true
    },

    {
        id: 23,
        type: "boss",
        name: "Jefatura de traslados",
        enemyCount: 0,
        color: "#392326",
        mapX: 0,
        mapY: -4,
        down: 22
    }
];

const LEVEL_ROOM_DEFINITIONS = {
    1: ROOM_DEFINITIONS,
    2: LEVEL_2_ROOM_DEFINITIONS
};

function createRoomDefinition(config) {
    const room = {
        up: null,
        down: null,
        left: null,
        right: null,
        startsCleared: false,
        ...config
    };

    room.cleared =
        room.startsCleared;

    room.visited =
        room.id ===
        levelConfigs[currentLevel].startRoom;

    if (
        room.type === "pharmacy"
    ) {
        room.rewardCollected =
            false;
    }

    return room;
}

function createRoomsForLevel(level) {
    const definitions =
        LEVEL_ROOM_DEFINITIONS[level];

    if (!definitions) {
        return {};
    }

    return Object.fromEntries(
        definitions.map((config) => [
            config.id,
            createRoomDefinition(config)
        ])
    );
}

let rooms = createRoomsForLevel(currentLevel);

function getCurrentLevelConfig() {
    return levelConfigs[
        currentLevel
    ];
}

function levelHasPharmacy() {
    const config =
        getCurrentLevelConfig();

    return Boolean(
        config &&
        config.hasPharmacy
    );
}

function getRoomType(
    roomId = currentRoom
) {
    return rooms[roomId]
        ? rooms[roomId].type
        : null;
}

function isCurrentRoomType(type) {
    return (
        getRoomType() === type
    );
}

function getBossRoomId() {
    return (
        getCurrentLevelConfig()
            .bossRoom
    );
}

function isBossDefeated() {
    const bossRoom =
        rooms[
            getBossRoomId()
        ];

    return Boolean(
        bossRoom &&
        bossRoom.cleared
    );
}

function isRoomEnabled(roomId) {
    const room =
        rooms[roomId];

    if (!room) {
        return false;
    }

    return (
        room.type !== "pharmacy" ||
        levelHasPharmacy()
    );
}

function canEnterRoom(fromRoomId, targetRoomId) {
    const targetRoom =
        rooms[targetRoomId];

    const levelConfig =
        getCurrentLevelConfig();

    if (
        !targetRoom ||
        !isRoomEnabled(targetRoomId)
    ) {
        return false;
    }

    if (
        targetRoom.type === "pharmacy" &&
        !isBossDefeated()
    ) {
        return false;
    }

    if (
        targetRoom.type === "boss" &&
        !targetRoom.cleared
    ) {
        if (levelConfig.bossImplemented === false) {
            return false;
        }

        if (
            playerKeys < levelConfig.bossKeysRequired &&
            !bossDoorUnlocked
        ) {
            return false;
        }
    }

    return true;
}
function updateDoors() {
    Object.entries(
        doorDirections
    ).forEach(([
        visual,
        direction
    ]) => {
        doors[visual] =
            canUseDoor(
                direction
            );
    });

    if (
        isCurrentRoomType("boss") &&
        boss.active &&
        !boss.defeated
    ) {
        Object.keys(
            doors
        ).forEach((direction) => {
            doors[direction] =
                false;
        });
    }
}

function getDoorColor(
    visualDirection
) {
    const room =
        rooms[currentRoom];

    const direction =
        doorDirections[
            visualDirection
        ];

    const targetRoomId =
        room[direction];

    if (
        targetRoomId === null ||
        !isRoomEnabled(
            targetRoomId
        )
    ) {
        return "#111";
    }

    if (
        doors[visualDirection]
    ) {
        return "#777";
    }

    const targetType =
        getRoomType(
            targetRoomId
        );

    return (
        targetType === "boss" ||
        targetType === "pharmacy"
    )
        ? "#553737"
        : "#333";
}

function drawRoomBorders() {
    ctx.fillStyle =
        "#111";

    [
        [
            0,
            0,
            canvas.width,
            20
        ],

        [
            0,
            canvas.height - 20,
            canvas.width,
            20
        ],

        [
            0,
            0,
            20,
            canvas.height
        ],

        [
            canvas.width - 20,
            0,
            20,
            canvas.height
        ]
    ].forEach((border) => {
        ctx.fillRect(
            ...border
        );
    });
}

function drawRoomDoors() {
    const positions = {
        top: [
            canvas.width / 2 - 45,
            0,
            90,
            20
        ],

        bottom: [
            canvas.width / 2 - 45,
            canvas.height - 20,
            90,
            20
        ],

        left: [
            0,
            canvas.height / 2 - 45,
            20,
            90
        ],

        right: [
            canvas.width - 20,
            canvas.height / 2 - 45,
            20,
            90
        ]
    };

    Object.entries(
        positions
    ).forEach(([
        direction,
        position
    ]) => {
        ctx.fillStyle =
            getDoorColor(
                direction
            );

        ctx.fillRect(
            ...position
        );
    });
}

function drawJunctionWarnings() {
    enemies.forEach((enemy) => {
        if (
            !enemy.junctionAmbusher ||
            enemy.leperState !== "windup"
        ) {
            return;
        }

        const centerX =
            enemy.x +
            enemy.width / 2;

        const centerY =
            enemy.y +
            enemy.height / 2;

        const interceptor =
            enemy.flankSide === 1;

        const targetX =
            Number.isFinite(
                enemy.junctionTargetX
            )
                ? enemy.junctionTargetX
                : (
                    player.x +
                    player.width / 2
                );

        const targetY =
            Number.isFinite(
                enemy.junctionTargetY
            )
                ? enemy.junctionTargetY
                : (
                    player.y +
                    player.height / 2
                );

        const timerRatio =
            Math.max(
                0,

                Math.min(
                    1,

                    enemy.leperTimer /
                        enemy.junctionInitialDelay
                )
            );

        const imminent =
            enemy.leperTimer <= 23;

        ctx.beginPath();

        ctx.arc(
            centerX,
            centerY,
            14 + timerRatio * 22,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            imminent
                ? interceptor
                    ? "rgba(255, 100, 100, 0.98)"
                    : "rgba(255, 255, 255, 0.95)"
                : interceptor
                    ? "rgba(255, 115, 85, 0.78)"
                    : "rgba(255, 190, 80, 0.78)";

        ctx.lineWidth =
            imminent
                ? 3
                : 2;

        ctx.stroke();

        if (!imminent) {
            return;
        }

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
            interceptor
                ? "rgba(255, 105, 105, 0.75)"
                : "rgba(255, 255, 255, 0.60)";

        ctx.lineWidth = 2;

        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
            targetX,
            targetY,

            interceptor
                ? 12
                : 9,

            0,

            Math.PI * 2
        );

        ctx.stroke();
    });
}

function drawAnesthesiaZone(
    enemy
) {
    const active =
        enemy.preparationState ===
        "zoneActive";

    const centerX =
        enemy.x +
        enemy.width / 2;

    const centerY =
        enemy.y +
        enemy.height / 2;

    ctx.beginPath();

    ctx.moveTo(
        centerX,
        centerY
    );

    ctx.lineTo(
        enemy.zoneX,
        enemy.zoneY
    );

    ctx.strokeStyle =
        active
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

    if (active) {
        ctx.fillStyle =
            "rgba(105, 85, 255, 0.24)";

        ctx.fill();
    }

    ctx.strokeStyle =
        active
            ? "rgba(185, 170, 255, 0.98)"
            : "rgba(105, 205, 255, 0.92)";

    ctx.lineWidth =
        active
            ? 4
            : 3;

    ctx.stroke();

    if (active) {
        return;
    }

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
                (
                    1 - progress
                )
        ),

        0,

        Math.PI * 2
    );

    ctx.strokeStyle =
        "rgba(255, 255, 255, 0.92)";

    ctx.lineWidth = 2;

    ctx.stroke();
}

function drawAnesthesiaDashWarning(
    enemy
) {
    const centerX =
        enemy.x +
        enemy.width / 2;

    const centerY =
        enemy.y +
        enemy.height / 2;

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
        centerX,
        centerY
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

function drawAnesthesiaWarnings() {
    enemies.forEach((enemy) => {
        if (
            !enemy.preparationAnesthesiologist
        ) {
            return;
        }

        if (
            enemy.preparationState === "zoneWindup" ||
            enemy.preparationState === "zoneActive"
        ) {
            drawAnesthesiaZone(
                enemy
            );
        }

        if (
            enemy.preparationState === "dashWindup"
        ) {
            drawAnesthesiaDashWarning(
                enemy
            );
        }
    });
}

function drawSurgicalWarnings() {
    enemies.forEach((enemy) => {
        if (
            !enemy.surgicalPreparationSurgeon ||
            enemy.surgicalState !== "aim"
        ) {
            return;
        }

        const centerX =
            enemy.x +
            enemy.width / 2;

        const centerY =
            enemy.y +
            enemy.height / 2;

        const aimX =
            enemy.aimTargetX -
            centerX;

        const aimY =
            enemy.aimTargetY -
            centerY;

        const aimDistance =
            Math.hypot(
                aimX,
                aimY
            ) || 1;

        const aimAngle =
            Math.atan2(
                aimY,
                aimX
            );

        const progress =
            Math.max(
                0,

                Math.min(
                    1,

                    1 -
                        enemy.surgicalTimer /
                            enemy.currentAimDuration
                )
            );

        const precision =
            enemy.currentPattern ===
            "precision";

        ctx.strokeStyle =
            precision
                ? "rgba(255, 225, 115, 0.95)"
                : "rgba(255, 155, 115, 0.95)";

        ctx.lineWidth =
            2 +
            progress * 2;

        ctx.strokeRect(
            enemy.x - 5,
            enemy.y - 5,
            enemy.width + 10,
            enemy.height + 10
        );

        const offsets =
            precision
                ? [
                    0
                ]
                : [
                    -enemy.coverageSpread,
                    0,
                    enemy.coverageSpread
                ];

        offsets.forEach((offset) => {
            const angle =
                aimAngle +
                offset;

            const length =
                Math.min(
                    290,

                    aimDistance +
                        30
                );

            ctx.beginPath();

            ctx.moveTo(
                centerX,
                centerY
            );

            ctx.lineTo(
                centerX +
                    Math.cos(angle) *
                        length,

                centerY +
                    Math.sin(angle) *
                        length
            );

            ctx.strokeStyle =
                precision
                    ? "rgba(255, 238, 175, 0.8)"
                    : "rgba(255, 185, 140, 0.75)";

            ctx.lineWidth =
                precision
                    ? 2.6
                    : 1.8;

            ctx.stroke();
        });

        if (!precision) {
            return;
        }

        ctx.beginPath();

        ctx.arc(
            enemy.aimTargetX,

            enemy.aimTargetY,

            Math.max(
                7,

                16 -
                    progress * 8
            ),

            0,

            Math.PI * 2
        );

        ctx.stroke();
    });
}

function drawRoom() {
    ctx.fillStyle =
        rooms[currentRoom].color;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawRoomBorders();

    drawRoomDoors();

    if (
        isCurrentRoomType(
            "junction"
        )
    ) {
        drawJunctionWarnings();

    } else if (
        isCurrentRoomType(
            "anesthesiaPreparation"
        )
    ) {
        drawAnesthesiaWarnings();

    } else if (
        isCurrentRoomType(
            "surgicalPreparation"
        )
    ) {
        drawSurgicalWarnings();
    }
}

function resetBossForFight() {
    Object.assign(
        boss,
        {
            active:
                true,

            defeated:
                false,

            health:
                boss.maxHealth,

            x:
                canvas.width / 2 -
                boss.width / 2,

            y:
                100,

            phase:
                1,

            spawned75:
                false,

            spawned50:
                false,

            spawned25:
                false,

            assistantCommandTimer:
                90,

            assistantTurn:
                0,

            anesthesiaImmunityUntil:
                0,

            attackSequence:
                0,

            attackTimer:
                55,

            dashTimer:
                190,

            dashDuration:
                0,

            enraged:
                false,

            touchingPlayer:
                false
        }
    );

    bossProjectiles.length =
        0;
}

function spawnRoomEnemies(
    room
) {
    if (
        room.type ===
        "anesthesiaPreparation"
    ) {
        spawnAnesthesiaPreparationEnemies();

    } else if (
        room.type ===
        "surgicalPreparation"
    ) {
        spawnSurgicalPreparationEnemies();

    } else {
        spawnEnemies(
            room.enemyCount
        );
    }
}

function changeRoom(
    newRoom
) {
    if (
        !rooms[newRoom] ||

        !isRoomEnabled(
            newRoom
        ) ||

        changingRoom
    ) {
        return;
    }

    changingRoom =
        true;

    currentRoom =
        newRoom;

    [
        enemies,
        bullets,
        enemyProjectiles,
        bossProjectiles
    ].forEach((collection) => {
        collection.length =
            0;
    });

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

    if (
        room.type === "boss"
    ) {
        if (
            !room.cleared
        ) {
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

        if (
            !room.cleared
        ) {
            spawnRoomEnemies(
                room
            );
        }

        if (
            room.type ===
            "pharmacy"
        ) {
            ensureBrightHeartInPharmacy();
        }
    }

    changingRoom =
        false;
}

function moveThroughDoor(
    direction
) {
    const room =
        rooms[currentRoom];

    const nextRoom =
        room[direction];

    if (
        !canUseDoor(
            direction
        )
    ) {
        return;
    }

    if (
        getRoomType(
            nextRoom
        ) === "boss" &&

        !rooms[nextRoom].cleared
    ) {
        bossDoorUnlocked =
            true;
    }

    changeRoom(
        nextRoom
    );

    if (
        direction === "right"
    ) {
        player.x =
            25;

    } else if (
        direction === "left"
    ) {
        player.x =
            canvas.width -
            player.width -
            25;

    } else if (
        direction === "up"
    ) {
        player.y =
            canvas.height -
            player.height -
            25;

    } else if (
        direction === "down"
    ) {
        player.y =
            25;
    }
}

function checkRoomChange() {
    if (
        changingRoom ||

        (
            isCurrentRoomType(
                "boss"
            ) &&

            boss.active &&

            !boss.defeated
        )
    ) {
        return;
    }

    const room =
        rooms[currentRoom];

    if (
        !room.cleared
    ) {
        return;
    }

    const centerX =
        canvas.width / 2;

    const centerY =
        canvas.height / 2;

    const insideHorizontalDoor =
        player.y +
            player.height / 2 >=
                centerY - 45 &&

        player.y +
            player.height / 2 <=
                centerY + 45;

    const insideVerticalDoor =
        player.x +
            player.width / 2 >=
                centerX - 45 &&

        player.x +
            player.width / 2 <=
                centerX + 45;

    if (
        player.x +
            player.width >=
                canvas.width - 20 &&

        insideHorizontalDoor
    ) {
        moveThroughDoor(
            "right"
        );

        return;
    }

    if (
        player.x <= 20 &&
        insideHorizontalDoor
    ) {
        moveThroughDoor(
            "left"
        );

        return;
    }

    if (
        player.y <= 20 &&
        insideVerticalDoor
    ) {
        moveThroughDoor(
            "up"
        );

        return;
    }

    if (
        player.y +
            player.height >=
                canvas.height - 20 &&

        insideVerticalDoor
    ) {
        moveThroughDoor(
            "down"
        );
    }
}
function drawRoomInfo() {
    ctx.fillStyle = "white";

    ctx.font = "18px Arial";

    ctx.fillText(
        "Piso " +
        currentLevel +
        " · " +
        rooms[currentRoom].name,

        20,

        canvas.height - 24
    );
}
function getMinimapLayout(
    enabledRooms
) {
    const coordinatesX =
        enabledRooms.map(
            (room) =>
                room.mapX
        );

    const coordinatesY =
        enabledRooms.map(
            (room) =>
                room.mapY
        );

    const minMapX =
        Math.min(
            ...coordinatesX
        );

    const maxMapX =
        Math.max(
            ...coordinatesX
        );

    const minMapY =
        Math.min(
            ...coordinatesY
        );

    const maxMapY =
        Math.max(
            ...coordinatesY
        );

    const roomSize =
        22;

    const gap =
        7;

    const step =
        roomSize +
        gap;

    const mapWidth =
        (
            maxMapX -
            minMapX +
            1
        ) *
            step -
        gap;

    const mapHeight =
        (
            maxMapY -
            minMapY +
            1
        ) *
            step -
        gap;

    return {
        minMapX,

        minMapY,

        roomSize,

        step,

        mapWidth,

        mapHeight,

        mapX:
            canvas.width -
            mapWidth -
            18,

        mapY:
            18
    };
}

function getMinimapRoomPosition(
    room,
    layout
) {
    return {
        x:
            layout.mapX +

            (
                room.mapX -
                layout.minMapX
            ) *
                layout.step,

        y:
            layout.mapY +

            (
                room.mapY -
                layout.minMapY
            ) *
                layout.step
    };
}

function drawMinimapConnections(
    enabledRooms,
    layout
) {
    enabledRooms.forEach((room) => {
        if (
            !room.visited
        ) {
            return;
        }

        const position =
            getMinimapRoomPosition(
                room,
                layout
            );

        const centerX =
            position.x +
            layout.roomSize / 2;

        const centerY =
            position.y +
            layout.roomSize / 2;

        ROOM_DIRECTIONS.forEach((direction) => {
            const targetRoomId =
                room[direction];

            const targetRoom =
                rooms[targetRoomId];

            if (
                !targetRoom ||

                !targetRoom.visited ||

                !isRoomEnabled(
                    targetRoomId
                )
            ) {
                return;
            }

            const target =
                getMinimapRoomPosition(
                    targetRoom,
                    layout
                );

            ctx.strokeStyle =
                "rgba(170, 170, 170, 0.55)";

            ctx.lineWidth =
                2;

            ctx.beginPath();

            ctx.moveTo(
                centerX,
                centerY
            );

            ctx.lineTo(
                target.x +
                    layout.roomSize / 2,

                target.y +
                    layout.roomSize / 2
            );

            ctx.stroke();
        });
    });
}

function getMinimapRoomColor(
    room,
    isCurrent
) {
    if (
        room.type === "boss"
    ) {
        return (
            "rgba(105, 25, 25, 0.92)"
        );
    }

    if (
        room.type === "pharmacy"
    ) {
        return (
            "rgba(45, 120, 68, 0.92)"
        );
    }

    if (
        isCurrent
    ) {
        return (
            "rgba(245, 245, 245, 0.96)"
        );
    }

    return room.cleared
        ? "rgba(130, 130, 130, 0.72)"
        : "rgba(75, 75, 75, 0.84)";
}

function drawMinimapRoom(
    room,
    layout
) {
    const position =
        getMinimapRoomPosition(
            room,
            layout
        );

    const x =
        position.x;

    const y =
        position.y;

    const size =
        layout.roomSize;

    const isCurrent =
        room.id ===
        currentRoom;

    if (
        !room.visited
    ) {
        ctx.fillStyle =
            "rgba(10, 10, 10, 0.72)";

        ctx.fillRect(
            x,
            y,
            size,
            size
        );

        ctx.strokeStyle =
            "rgba(70, 70, 70, 0.55)";

        ctx.lineWidth =
            1;

        ctx.strokeRect(
            x,
            y,
            size,
            size
        );

        ctx.fillStyle =
            "rgba(105, 105, 105, 0.7)";

        ctx.font =
            "bold 14px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            "?",

            x +
                size / 2,

            y +
                size / 2
        );

        return;
    }

    ctx.fillStyle =
        getMinimapRoomColor(
            room,
            isCurrent
        );

    ctx.fillRect(
        x,
        y,
        size,
        size
    );

    ctx.strokeStyle =
        isCurrent
            ? "rgba(255, 220, 90, 0.95)"
            : "rgba(220, 220, 220, 0.48)";

    ctx.lineWidth =
        isCurrent
            ? 2
            : 1;

    ctx.strokeRect(
        x,
        y,
        size,
        size
    );

    if (
        room.type !== "boss" &&
        room.type !== "pharmacy"
    ) {
        return;
    }

    ctx.fillStyle =
        "white";

    ctx.font =
        "bold 13px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        room.type === "boss"
            ? "B"
            : "+",

        x +
            size / 2,

        y +
            size / 2
    );
}

function drawMinimap() {
    const enabledRooms =
        Object.values(
            rooms
        ).filter((room) =>
            isRoomEnabled(
                room.id
            )
        );

    const layout =
        getMinimapLayout(
            enabledRooms
        );

    ctx.fillStyle =
        "rgba(0, 0, 0, 0.38)";

    ctx.fillRect(
        layout.mapX - 8,
        layout.mapY - 8,
        layout.mapWidth + 16,
        layout.mapHeight + 16
    );

    drawMinimapConnections(
        enabledRooms,
        layout
    );

    enabledRooms.forEach((room) => {
        drawMinimapRoom(
            room,
            layout
        );
    });

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "alphabetic";
}
function resetRoomsForNewRun() {
    currentLevel = 1;

    rooms = createRoomsForLevel(currentLevel);

    const startRoom =
        getCurrentLevelConfig().startRoom;

    Object.values(rooms).forEach((room) => {
        room.cleared =
            room.startsCleared;

        room.visited =
            room.id === startRoom;

        if (room.type === "pharmacy") {
            room.rewardCollected = false;
        }
    });

    currentRoom = startRoom;

    changingRoom = false;

    pharmacyUnlockNoticeUntil = 0;
}

function advanceToNextLevel() {
    const nextLevel =
        currentLevel + 1;

    const nextLevelConfig =
        levelConfigs[nextLevel];

    if (!nextLevelConfig) {
        return false;
    }

    [
        enemies,
        bullets,
        enemyProjectiles,
        bossProjectiles,
        droppedKeys,
        droppedHalfHearts,
        droppedBossItems,
        droppedBrightHearts
    ].forEach((collection) => {
        collection.length = 0;
    });

    currentLevel =
        nextLevel;

    rooms =
        createRoomsForLevel(currentLevel);

    currentRoom =
        nextLevelConfig.startRoom;

    playerKeys = 0;

    bossDoorUnlocked = false;

    changingRoom = false;

    pharmacyUnlockNoticeUntil = 0;

    hospitalOrderUntil = 0;

    playerKnockbackX = 0;

    playerKnockbackY = 0;

    movementDisabledUntil = 0;

    player.x =
        canvas.width / 2 -
        player.width / 2;

    player.y =
        canvas.height / 2 -
        player.height / 2;

    Object.assign(boss, {
        active: false,
        defeated: false,
        touchingPlayer: false,
        health: boss.maxHealth,
        phase: 1,
        spawned75: false,
        spawned50: false,
        spawned25: false,
        assistantCommandTimer: 90,
        assistantTurn: 0,
        anesthesiaImmunityUntil: 0,
        attackSequence: 0,
        dashDuration: 0,
        enraged: false
    });

    rooms[currentRoom].visited = true;

    return true;
}
function checkRoomClear() {
    const room =
        rooms[currentRoom];

    if (
        room.type !== "boss" &&
        enemies.length === 0 &&
        !room.cleared
    ) {
        room.cleared =
            true;
    }
}
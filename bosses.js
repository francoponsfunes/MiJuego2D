// ============================================================================
// BOSSES.JS
// Estado, fases, patrones, asistentes y recompensas del jefe.
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

    movementX: 0,
    movementY: 0,
    movementTimer: 0,

    attackTimer: 55,
    attackCooldown: 92,
    attackSequence: 0,

    phase: 1,

    spawned75: false,
    spawned50: false,
    spawned25: false,

    assistantCommandTimer: 90,
    assistantTurn: 0,
    anesthesiaImmunityUntil: 0,

    dashTimer: 190,
    dashDuration: 0,
    dashX: 0,
    dashY: 0,

    enraged: false
};

const BOSS_PHASE_SETTINGS = {
    1: {
        movementSpeed: 1.45,
        attackCooldown: 92,
        dashCooldown: 260,
        assistantWindup: 36
    },

    2: {
        movementSpeed: 1.65,
        attackCooldown: 86,
        dashCooldown: 230,
        assistantWindup: 32
    },

    3: {
        movementSpeed: 1.8,
        attackCooldown: 80,
        dashCooldown: 240,
        assistantWindup: 28
    },

    4: {
        movementSpeed: 2.2,
        attackCooldown: 55,
        dashCooldown: 180,
        assistantWindup: 25
    }
};

const BOSS_ATTACK_PATTERNS = {
    1: [
        {
            count: 1,
            spread: 0,
            speed: 4.8
        },
        {
            count: 3,
            spread: 0.15,
            speed: 4.15
        }
    ],

    2: [
        {
            count: 3,
            spread: 0.17,
            speed: 4.45
        },
        {
            count: 2,
            spread: 0.20,
            speed: 4.8
        }
    ]
};

const BOSS_SPAWN_THRESHOLDS = [
    {
        ratio: 0.75,
        flag: "spawned75"
    },
    {
        ratio: 0.50,
        flag: "spawned50"
    },
    {
        ratio: 0.25,
        flag: "spawned25"
    }
];

function getBossAssistants() {
    return enemies.filter((enemy) =>
        enemy.type === "anesthesiologist" &&
        enemy.bossAssistant
    );
}

function updateBossAssistantSpawns() {
    BOSS_SPAWN_THRESHOLDS.forEach((threshold) => {
        if (
            boss.health >
                boss.maxHealth * threshold.ratio ||

            boss[threshold.flag]
        ) {
            return;
        }

        boss[threshold.flag] = true;

        spawnBossAnesthesiologists();
    });
}

function updateBossMovement(
    deltaTime,
    movementSpeed
) {
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
            Math.hypot(
                dx,
                dy
            ) || 1;

        boss.x +=
            dx /
            distance *
            movementSpeed *
            deltaTime;

        boss.y +=
            dy /
            distance *
            movementSpeed *
            deltaTime;
    }

    boss.x =
        Math.max(
            20,
            Math.min(
                canvas.width -
                    20 -
                    boss.width,

                boss.x
            )
        );

    boss.y =
        Math.max(
            20,
            Math.min(
                canvas.height -
                    20 -
                    boss.height,

                boss.y
            )
        );
}

function updateBossTimers(
    deltaTime,
    phaseSettings
) {
    boss.attackTimer -=
        deltaTime;

    if (
        boss.attackTimer <= 0
    ) {
        bossAttack();

        boss.attackTimer =
            phaseSettings.attackCooldown;
    }

    boss.dashTimer -=
        deltaTime;

    if (
        boss.dashTimer <= 0 &&
        boss.dashDuration <= 0
    ) {
        bossStartDash();

        boss.dashTimer =
            phaseSettings.dashCooldown;
    }
}

function updateBoss(deltaTime) {
    if (
        !boss.active ||
        boss.defeated
    ) {
        return;
    }

    updateBossPhase();

    updateBossAssistantSpawns();

    updateBossAssistantCommands(
        deltaTime
    );

    const phaseSettings =
        BOSS_PHASE_SETTINGS[
            boss.phase
        ];

    updateBossMovement(
        deltaTime,
        phaseSettings.movementSpeed
    );

    updateBossTimers(
        deltaTime,
        phaseSettings
    );
}

function updateBossPhase() {
    const healthPercent =
        boss.health /
        boss.maxHealth;

    if (
        healthPercent > 0.75
    ) {
        boss.phase = 1;

    } else if (
        healthPercent > 0.50
    ) {
        boss.phase = 2;

    } else if (
        healthPercent > 0.25
    ) {
        boss.phase = 3;

    } else {
        boss.phase = 4;

        boss.enraged = true;
    }
}

function shootBossFan(
    projectileCount,
    angleStep,
    speed
) {
    const centerX =
        boss.x +
        boss.width / 2;

    const centerY =
        boss.y +
        boss.height / 2;

    const playerCenterX =
        player.x +
        player.width / 2;

    const playerCenterY =
        player.y +
        player.height / 2;

    const baseAngle =
        Math.atan2(
            playerCenterY -
                centerY,

            playerCenterX -
                centerX
        );

    const firstOffset =
        -angleStep *
        (
            projectileCount - 1
        ) /
        2;

    for (
        let index = 0;
        index < projectileCount;
        index++
    ) {
        const angle =
            baseAngle +
            firstOffset +
            index *
                angleStep;

        shootBossProjectile(
            centerX +
                Math.cos(angle) *
                    100,

            centerY +
                Math.sin(angle) *
                    100,

            speed,

            angle
        );
    }
}

function shootBossRadial(
    projectileCount,
    speed
) {
    const centerX =
        boss.x +
        boss.width / 2;

    const centerY =
        boss.y +
        boss.height / 2;

    for (
        let index = 0;
        index < projectileCount;
        index++
    ) {
        const angle =
            Math.PI *
            2 /
            projectileCount *
            index;

        shootBossProjectile(
            centerX +
                Math.cos(angle) *
                    100,

            centerY +
                Math.sin(angle) *
                    100,

            speed,

            angle
        );
    }
}

function bossAttack() {
    if (
        getBossAssistants().length > 0
    ) {
        boss.assistantCommandTimer =
            Math.min(
                boss.assistantCommandTimer,
                14
            );
    }

    boss.attackSequence++;

    const patterns =
        BOSS_ATTACK_PATTERNS[
            boss.phase
        ];

    if (patterns) {
        const pattern =
            patterns[
                (
                    boss.attackSequence -
                    1
                ) %
                2
            ];

        shootBossFan(
            pattern.count,
            pattern.spread,
            pattern.speed
        );

        return;
    }

    if (
        boss.phase === 3
    ) {
        shootBossRadial(
            8,
            4.5
        );

        return;
    }

    shootBossRadial(
        10,
        5
    );

    shootBossProjectile(
        player.x +
            player.width / 2,

        player.y +
            player.height / 2,

        5.5
    );
}

function bossStartDash() {
    const dx =
        player.x -
        boss.x;

    const dy =
        player.y -
        boss.y;

    const distance =
        Math.hypot(
            dx,
            dy
        ) || 1;

    boss.dashX =
        dx /
        distance *
        4.5;

    boss.dashY =
        dy /
        distance *
        4.5;

    boss.dashDuration =
        30;
}

function updateBossAssistantCommands(
    deltaTime
) {
    const assistants =
        getBossAssistants();

    if (
        assistants.length === 0
    ) {
        return;
    }

    boss.assistantCommandTimer -=
        deltaTime;

    if (
        boss.assistantCommandTimer > 0
    ) {
        return;
    }

    const assistantAttacking =
        assistants.some((assistant) =>
            assistant.anesthesiologistState ===
                "windup" ||

            assistant.anesthesiologistState ===
                "dash"
        );

    if (
        assistantAttacking ||

        boss.dashDuration > 0 ||

        boss.attackTimer <= 25
    ) {
        return;
    }

    const readyAssistants =
        assistants.filter((assistant) =>
            assistant.anesthesiologistState ===
            "orbit"
        );

    if (
        readyAssistants.length === 0
    ) {
        return;
    }

    const chosenAssistant =
        readyAssistants.find((assistant) =>
            assistant.assistantSlot ===
            boss.assistantTurn
        ) ||
        readyAssistants[0];

    chosenAssistant.anesthesiologistState =
        "windup";

    chosenAssistant.stateTimer =
        BOSS_PHASE_SETTINGS[
            boss.phase
        ].assistantWindup;

    chosenAssistant.windupDuration =
        chosenAssistant.stateTimer;

    chosenAssistant.attackTargetX =
        player.x +
        player.width / 2;

    chosenAssistant.attackTargetY =
        player.y +
        player.height / 2;

    chosenAssistant.anesthesiaUsedThisDash =
        false;

    boss.assistantTurn =
        chosenAssistant.assistantSlot === 0
            ? 1
            : 0;

    boss.assistantCommandTimer =
        9999;
}

function createBossAssistant(
    slot
) {
    const angle =
        Math.PI /
            2 +

        slot *
            Math.PI;

    return createEnemy({
        type:
            "anesthesiologist",

        bossAssistant:
            true,

        assistantSlot:
            slot,

        x:
            boss.x +
            boss.width / 2 +
            Math.cos(angle) *
                80 -
            20,

        y:
            boss.y +
            boss.height / 2 +
            Math.sin(angle) *
                80 -
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
            3.0,

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
    });
}

function spawnBossAnesthesiologists() {
    const occupiedSlots =
        new Set(
            getBossAssistants().map(
                (assistant) =>
                    assistant.assistantSlot
            )
        );

    for (
        let slot = 0;
        slot < 2;
        slot++
    ) {
        if (
            !occupiedSlots.has(slot)
        ) {
            enemies.push(
                createBossAssistant(
                    slot
                )
            );
        }
    }

    boss.assistantCommandTimer =
        Math.min(
            boss.assistantCommandTimer,
            48
        );
}

function dropBossRewards() {
    const centerY =
        boss.y +
        boss.height / 2 -
        10;

    dropFullHeart(
        boss.x +
            10,

        centerY
    );

    dropBoomerang(
        boss.x +
            boss.width / 2 -
            10,

        centerY
    );

    dropBoomerang(
        boss.x +
            boss.width -
            30,

        centerY
    );

    dropAccessCard(
        boss.x +
            boss.width / 2 -
            12,

        boss.y +
            boss.height -
            12
    );
}

function defeatBoss() {
    boss.health =
        0;

    boss.defeated =
        true;

    boss.active =
        false;

    rooms[
        getBossRoomId()
    ].cleared =
        true;

    for (
        let index = enemies.length - 1;
        index >= 0;
        index--
    ) {
        if (
            enemies[index].bossAssistant
        ) {
            enemies.splice(
                index,
                1
            );
        }
    }

    dropBossRewards();

    if (
        levelHasPharmacy()
    ) {
        pharmacyUnlockNoticeUntil =
            performance.now() +
            3500;
    }
}

function checkBossCollision() {
    if (
        !boss.active ||
        boss.defeated
    ) {
        return;
    }

    for (
        let index = bullets.length - 1;
        index >= 0;
        index--
    ) {
        const bullet =
            bullets[index];

        const isBoomerang =
            bullet.type ===
            "boomerang";

        if (
            (
                isBoomerang &&
                bullet.hitBoss
            ) ||

            !areEntitiesColliding(
                bullet,
                boss
            )
        ) {
            continue;
        }

        boss.health -=
            isBoomerang
                ? bullet.damage
                : 1;

        if (
            isBoomerang
        ) {
            bullet.hitBoss =
                true;

        } else {
            bullets.splice(
                index,
                1
            );
        }

        if (
            boss.health <= 0
        ) {
            defeatBoss();

            break;
        }
    }
}

function showVictory() {
    victory =
        true;
}

function drawBoss() {
    if (
        !boss.active ||
        boss.defeated
    ) {
        return;
    }

    ctx.fillStyle =
        "yellow";

    ctx.fillRect(
        boss.x,
        boss.y,
        boss.width,
        boss.height
    );

    ctx.fillStyle =
        "black";

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

    ctx.fillStyle =
        "orange";

    ctx.fillRect(
        boss.x + 25,
        boss.y + 40,
        30,
        15
    );

    ctx.fillStyle =
        "white";

    ctx.font =
        "bold 20px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "CUA CUA",

        boss.x +
            boss.width / 2,

        boss.y -
            10
    );

    ctx.textAlign =
        "left";
}

function drawBossHealth() {
    if (
        !boss.active ||
        boss.defeated
    ) {
        return;
    }

    const barWidth =
        400;

    const barHeight =
        20;

    const x =
        canvas.width / 2 -
        barWidth / 2;

    const y =
        50;

    ctx.fillStyle =
        "black";

    ctx.fillRect(
        x,
        y,
        barWidth,
        barHeight
    );

    ctx.fillStyle =
        "red";

    ctx.fillRect(
        x,
        y,

        barWidth *
            boss.health /
            boss.maxHealth,

        barHeight
    );

    ctx.strokeStyle =
        "white";

    ctx.strokeRect(
        x,
        y,
        barWidth,
        barHeight
    );
}
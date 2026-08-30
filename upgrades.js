// ============================================================================
// UPGRADES.JS
// Mejoras permanentes de la partida y pantalla de elección entre pisos.
// ============================================================================

const PLAYER_UPGRADE_DEFINITIONS = [
    {
        id: "damage",
        name: "Munición reforzada",
        icon: "🔩",
        category: "offense",
        maxLevel: 5,
        description: "+20% de daño con los disparos por nivel."
    },
    {
        id: "fireRate",
        name: "Pulso acelerado",
        icon: "⏱️",
        category: "offense",
        maxLevel: 5,
        description: "Reduce un 8% la espera entre disparos por nivel."
    },
    {
        id: "knockback",
        name: "Guantes de impacto",
        icon: "🧤",
        category: "offense",
        maxLevel: 4,
        description: "+18% de retroceso contra enemigos por nivel."
    },
    {
        id: "projectileSpeed",
        name: "Lente quirúrgica",
        icon: "🔍",
        category: "offense",
        maxLevel: 4,
        description: "+12% de velocidad para los disparos por nivel."
    },
    {
        id: "projectileSize",
        name: "Proyectil expansivo",
        icon: "⭕",
        category: "offense",
        maxLevel: 3,
        description: "+10% de tamaño para los disparos por nivel."
    },
    {
        id: "contactProtection",
        name: "Bata acolchada",
        icon: "🥼",
        category: "defense",
        maxLevel: 3,
        description: "+180 ms de protección contra contactos consecutivos."
    },
    {
        id: "invulnerability",
        name: "Respuesta nerviosa",
        icon: "⚡",
        category: "defense",
        maxLevel: 3,
        description: "+100 ms de invulnerabilidad después de recibir daño."
    },
    {
        id: "stunResistance",
        name: "Tolerancia anestésica",
        icon: "🛡️",
        category: "defense",
        maxLevel: 3,
        description: "Reduce un 18% la duración de anestesia y stun."
    },
    {
        id: "movementSpeed",
        name: "Calzado ligero",
        icon: "👟",
        category: "mobility",
        maxLevel: 4,
        description: "+6% de velocidad de movimiento por nivel."
    },
    {
        id: "boomerang",
        name: "Búmeran reforzado",
        icon: "🪃",
        category: "utility",
        maxLevel: 2,
        description: "+1 rebote y +15% de retroceso del búmeran."
    }
];

const playerUpgradeLevels = {};

let upgradeSelectionOpen = false;
let offeredPlayerUpgrades = [];
let selectedPlayerUpgradeIndex = 0;


// ============================================================================
// ESTADO Y CONSULTAS
// ============================================================================

function resetPlayerUpgrades() {

    PLAYER_UPGRADE_DEFINITIONS.forEach((upgrade) => {

        playerUpgradeLevels[upgrade.id] = 0;
    });

    upgradeSelectionOpen = false;
    offeredPlayerUpgrades = [];
    selectedPlayerUpgradeIndex = 0;
}


function getPlayerUpgradeDefinition(upgradeId) {

    return PLAYER_UPGRADE_DEFINITIONS.find(

        (upgrade) => upgrade.id === upgradeId

    ) || null;
}


function getPlayerUpgradeLevel(upgradeId) {

    return playerUpgradeLevels[upgradeId] || 0;
}


function canImprovePlayerUpgrade(upgrade) {

    return (

        upgrade &&

        getPlayerUpgradeLevel(upgrade.id) <
        upgrade.maxLevel
    );
}


function applyPlayerUpgrade(upgradeId) {

    const upgrade =
        getPlayerUpgradeDefinition(
            upgradeId
        );

    if (
        !canImprovePlayerUpgrade(
            upgrade
        )
    ) {

        return false;
    }

    playerUpgradeLevels[upgradeId] =

        getPlayerUpgradeLevel(
            upgradeId
        ) + 1;

    return true;
}


// ============================================================================
// VALORES DERIVADOS DE LAS MEJORAS
// ============================================================================

function getPlayerBulletDamage(
    baseDamage = 1
) {

    return baseDamage * (

        1 +

        getPlayerUpgradeLevel(
            "damage"
        ) * 0.20
    );
}


function getPlayerShootCooldown(
    baseCooldown
) {

    const improvedCooldown =

        baseCooldown *

        Math.pow(

            0.92,

            getPlayerUpgradeLevel(
                "fireRate"
            )
        );

    return Math.max(

        180,

        Math.round(
            improvedCooldown
        )
    );
}


function getPlayerKnockbackForce(

    baseForce = 8,

    bullet = null

) {

    let multiplier =

        1 +

        getPlayerUpgradeLevel(
            "knockback"
        ) * 0.18;

    if (

        bullet &&

        bullet.type === "boomerang"

    ) {

        multiplier *=

            1 +

            getPlayerUpgradeLevel(
                "boomerang"
            ) * 0.15;
    }

    return baseForce *
        multiplier;
}


function getPlayerProjectileSpeed(
    baseSpeed = 7
) {

    return baseSpeed * (

        1 +

        getPlayerUpgradeLevel(
            "projectileSpeed"
        ) * 0.12
    );
}


function getPlayerProjectileSize(
    baseSize = 10
) {

    return Math.round(

        baseSize * (

            1 +

            getPlayerUpgradeLevel(
                "projectileSize"
            ) * 0.10
        )
    );
}


function getPlayerMovementMultiplier() {

    return (

        1 +

        getPlayerUpgradeLevel(
            "movementSpeed"
        ) * 0.06
    );
}


function getPlayerInvulnerabilityDuration(
    baseDuration = 600
) {

    return (

        baseDuration +

        getPlayerUpgradeLevel(
            "invulnerability"
        ) * 100
    );
}


function getPlayerContactProtectionDuration(
    baseDuration = 600
) {

    return (

        getPlayerInvulnerabilityDuration(
            baseDuration
        ) +

        getPlayerUpgradeLevel(
            "contactProtection"
        ) * 180
    );
}


function getPlayerStunDurationMultiplier() {

    return Math.max(

        0.55,

        1 -

        getPlayerUpgradeLevel(
            "stunResistance"
        ) * 0.18
    );
}


function getPlayerBoomerangMaxBounces(
    baseBounces = 2
) {

    return (

        baseBounces +

        getPlayerUpgradeLevel(
            "boomerang"
        )
    );
}


// ============================================================================
// GENERACIÓN DE LAS TRES OPCIONES
// ============================================================================

function shufflePlayerUpgrades(
    upgrades
) {

    const shuffled = [
        ...upgrades
    ];

    for (

        let index =
            shuffled.length - 1;

        index > 0;

        index--

    ) {

        const randomIndex =

            Math.floor(

                Math.random() *

                (
                    index + 1
                )
            );

        [

            shuffled[index],

            shuffled[randomIndex]

        ] = [

            shuffled[randomIndex],

            shuffled[index]
        ];
    }

    return shuffled;
}


function addRandomPlayerUpgrade(

    choices,

    candidates

) {

    const availableCandidates =

        shufflePlayerUpgrades(
            candidates
        ).filter(

            (upgrade) =>

                !choices.some(

                    (choice) =>

                        choice.id ===
                        upgrade.id
                )
        );

    if (
        availableCandidates.length === 0
    ) {

        return false;
    }

    choices.push(
        availableCandidates[0]
    );

    return true;
}


function createPlayerUpgradeChoices() {

    const availableUpgrades =

        PLAYER_UPGRADE_DEFINITIONS.filter(

            canImprovePlayerUpgrade
        );

    const choices = [];

    const offensiveUpgrades =

        availableUpgrades.filter(

            (upgrade) =>

                upgrade.category ===
                "offense"
        );

    const survivalUpgrades =

        availableUpgrades.filter(

            (upgrade) =>

                upgrade.category ===
                    "defense" ||

                upgrade.category ===
                    "mobility"
        );

    addRandomPlayerUpgrade(

        choices,

        offensiveUpgrades
    );

    addRandomPlayerUpgrade(

        choices,

        survivalUpgrades
    );

    while (

        choices.length < 3 &&

        addRandomPlayerUpgrade(

            choices,

            availableUpgrades
        )

    ) {

        // Completar hasta tres opciones diferentes.
    }

    return choices;
}


// ============================================================================
// APERTURA, CANCELACIÓN Y CONFIRMACIÓN
// ============================================================================

function openPlayerUpgradeSelection() {

    if (

        upgradeSelectionOpen ||

        gameOver ||

        victory ||

        !levelConfigs[
            currentLevel + 1
        ]

    ) {

        return false;
    }

    offeredPlayerUpgrades =

        createPlayerUpgradeChoices();

    if (
        offeredPlayerUpgrades.length === 0
    ) {

        return false;
    }

    selectedPlayerUpgradeIndex = 0;

    upgradeSelectionOpen = true;

    elevatorDialogOpen = false;

    shootingDirection = null;

    return true;
}


function cancelPlayerUpgradeSelection() {

    if (
        !upgradeSelectionOpen
    ) {

        return false;
    }

    upgradeSelectionOpen = false;

    offeredPlayerUpgrades = [];

    selectedPlayerUpgradeIndex = 0;

    elevatorDialogOpen = true;

    return true;
}


function confirmPlayerUpgradeSelection() {

    if (
        !upgradeSelectionOpen
    ) {

        return false;
    }

    const selectedUpgrade =

        offeredPlayerUpgrades[

            selectedPlayerUpgradeIndex
        ];

    if (

        !selectedUpgrade ||

        !applyPlayerUpgrade(
            selectedUpgrade.id
        )

    ) {

        return false;
    }

    upgradeSelectionOpen = false;

    offeredPlayerUpgrades = [];

    selectedPlayerUpgradeIndex = 0;

    playerAccessCards =

        Math.max(

            0,

            playerAccessCards - 1
        );

    nextShotTime = 0;

    shootingDirection = null;

    return advanceToNextLevel();
}


// ============================================================================
// CONTROLES DE LA ELECCIÓN
// ============================================================================

function movePlayerUpgradeSelection(
    direction
) {

    const choiceCount =

        offeredPlayerUpgrades.length;

    if (
        choiceCount === 0
    ) {

        return;
    }

    selectedPlayerUpgradeIndex =

        (

            selectedPlayerUpgradeIndex +

            direction +

            choiceCount

        ) % choiceCount;
}


function handlePlayerUpgradeKeydown(
    event
) {

    if (
        !upgradeSelectionOpen
    ) {

        return;
    }

    event.preventDefault();

    event.stopImmediatePropagation();

    const key =

        event.key.toLowerCase();

    if (

        key === "arrowleft" ||

        key === "a"

    ) {

        movePlayerUpgradeSelection(
            -1
        );

    } else if (

        key === "arrowright" ||

        key === "d"

    ) {

        movePlayerUpgradeSelection(
            1
        );

    } else if (

        [
            "1",
            "2",
            "3"
        ].includes(
            key
        )

    ) {

        const requestedIndex =

            Number(key) - 1;

        if (

            offeredPlayerUpgrades[
                requestedIndex
            ]

        ) {

            selectedPlayerUpgradeIndex =

                requestedIndex;
        }

    } else if (

        key === "enter"

    ) {

        confirmPlayerUpgradeSelection();

    } else if (

        key === "escape"

    ) {

        cancelPlayerUpgradeSelection();
    }
}


// ============================================================================
// INTERFAZ
// ============================================================================

function getPlayerUpgradeCardBounds(
    index
) {

    const cardWidth = 210;

    const cardHeight = 276;

    const gap = 20;

    const totalWidth =

        cardWidth * 3 +

        gap * 2;

    return {

        x:

            canvas.width / 2 -

            totalWidth / 2 +

            index *

            (
                cardWidth +
                gap
            ),

        y: 160,

        width:
            cardWidth,

        height:
            cardHeight
    };
}


function getPlayerUpgradeConfirmBounds() {

    return {

        x:
            canvas.width / 2 -
            115,

        y:
            470,

        width:
            230,

        height:
            46
    };
}


function isPointInsidePlayerUpgradeBounds(

    x,

    y,

    bounds

) {

    return (

        x >=
            bounds.x &&

        x <=
            bounds.x +
            bounds.width &&

        y >=
            bounds.y &&

        y <=
            bounds.y +
            bounds.height
    );
}


function getPlayerUpgradeCategoryLabel(
    category
) {

    const labels = {

        offense:
            "OFENSIVA",

        defense:
            "DEFENSA",

        mobility:
            "MOVILIDAD",

        utility:
            "UTILIDAD"
    };

    return labels[category] ||
        "MEJORA";
}


function drawPlayerUpgradeWrappedText(

    text,

    centerX,

    startY,

    maxWidth,

    lineHeight,

    maxLines = 4

) {

    const words =
        text.split(" ");

    const lines = [];

    let currentLine = "";

    words.forEach((word) => {

        const testLine =

            currentLine

                ? currentLine +
                    " " +
                    word

                : word;

        if (

            ctx.measureText(
                testLine
            ).width >
                maxWidth &&

            currentLine

        ) {

            lines.push(
                currentLine
            );

            currentLine =
                word;

        } else {

            currentLine =
                testLine;
        }
    });

    if (
        currentLine
    ) {

        lines.push(
            currentLine
        );
    }

    lines
        .slice(
            0,
            maxLines
        )
        .forEach(

            (
                line,
                index
            ) => {

                ctx.fillText(

                    line,

                    centerX,

                    startY +

                    index *
                    lineHeight
                );
            }
        );
}


function drawPlayerUpgradeCard(

    upgrade,

    index

) {

    const bounds =

        getPlayerUpgradeCardBounds(
            index
        );

    const selected =

        index ===

        selectedPlayerUpgradeIndex;

    const centerX =

        bounds.x +

        bounds.width / 2;

    ctx.fillStyle =

        selected

            ? "#263b39"

            : "#1b2025";

    ctx.fillRect(

        bounds.x,

        bounds.y,

        bounds.width,

        bounds.height
    );

    ctx.strokeStyle =

        selected

            ? "#86e0c2"

            : "#596267";

    ctx.lineWidth =

        selected

            ? 4

            : 2;

    ctx.strokeRect(

        bounds.x,

        bounds.y,

        bounds.width,

        bounds.height
    );

    ctx.fillStyle =
        "#90aaa3";

    ctx.font =
        "bold 12px Arial";

    ctx.fillText(

        getPlayerUpgradeCategoryLabel(

            upgrade.category
        ),

        centerX,

        bounds.y + 24
    );

    ctx.font =
        "38px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(

        upgrade.icon,

        centerX,

        bounds.y + 67
    );

    ctx.font =
        "bold 18px Arial";

    ctx.fillStyle =
        "#f4f6f6";

    drawPlayerUpgradeWrappedText(

        upgrade.name,

        centerX,

        bounds.y + 104,

        bounds.width - 24,

        21,

        2
    );

    ctx.font =
        "15px Arial";

    ctx.fillStyle =
        "#c3cbcc";

    drawPlayerUpgradeWrappedText(

        upgrade.description,

        centerX,

        bounds.y + 160,

        bounds.width - 28,

        20,

        4
    );

    const currentUpgradeLevel =

        getPlayerUpgradeLevel(
            upgrade.id
        );

    ctx.font =
        "bold 14px Arial";

    ctx.fillStyle =

        selected

            ? "#9bf2d3"

            : "#9ca7aa";

    ctx.fillText(

        "NIVEL " +

        currentUpgradeLevel +

        "  →  " +

        (
            currentUpgradeLevel + 1
        ),

        centerX,

        bounds.y +

        bounds.height -

        22
    );
}


function drawPlayerUpgradeSelection() {

    if (
        !upgradeSelectionOpen
    ) {

        return;
    }

    ctx.save();

    ctx.fillStyle =
        "rgba(0, 0, 0, 0.88)";

    ctx.fillRect(

        0,

        0,

        canvas.width,

        canvas.height
    );

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillStyle =
        "#f1f4f3";

    ctx.font =
        "bold 30px Arial";

    ctx.fillText(

        "TRATAMIENTO DISPONIBLE",

        canvas.width / 2,

        72
    );

    ctx.fillStyle =
        "#b9c3c4";

    ctx.font =
        "16px Arial";

    ctx.fillText(

        "Elegí una mejora permanente para esta partida.",

        canvas.width / 2,

        112
    );

    offeredPlayerUpgrades.forEach(

        drawPlayerUpgradeCard
    );

    const confirmBounds =

        getPlayerUpgradeConfirmBounds();

    ctx.fillStyle =
        "#285d4b";

    ctx.fillRect(

        confirmBounds.x,

        confirmBounds.y,

        confirmBounds.width,

        confirmBounds.height
    );

    ctx.strokeStyle =
        "#86e0c2";

    ctx.lineWidth =
        2;

    ctx.strokeRect(

        confirmBounds.x,

        confirmBounds.y,

        confirmBounds.width,

        confirmBounds.height
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 16px Arial";

    ctx.fillText(

        "ENTER · ELEGIR",

        canvas.width / 2,

        confirmBounds.y +

        confirmBounds.height / 2
    );

    ctx.fillStyle =
        "#aeb8ba";

    ctx.font =
        "14px Arial";

    ctx.fillText(

        "A / D o ← / → para elegir · ESC para volver",

        canvas.width / 2,

        552
    );

    ctx.restore();
}


function handlePlayerUpgradeClick(
    event
) {

    if (
        !upgradeSelectionOpen
    ) {

        return;
    }

    event.preventDefault();

    event.stopImmediatePropagation();

    const canvasBounds =

        canvas.getBoundingClientRect();

    const clickX =

        (
            event.clientX -
            canvasBounds.left
        ) *

        canvas.width /

        canvasBounds.width;

    const clickY =

        (
            event.clientY -
            canvasBounds.top
        ) *

        canvas.height /

        canvasBounds.height;

    const clickedCardIndex =

        offeredPlayerUpgrades.findIndex(

            (
                upgrade,
                index
            ) =>

                isPointInsidePlayerUpgradeBounds(

                    clickX,

                    clickY,

                    getPlayerUpgradeCardBounds(
                        index
                    )
                )
        );

    if (
        clickedCardIndex >= 0
    ) {

        selectedPlayerUpgradeIndex =

            clickedCardIndex;

        return;
    }

    if (

        isPointInsidePlayerUpgradeBounds(

            clickX,

            clickY,

            getPlayerUpgradeConfirmBounds()
        )

    ) {

        confirmPlayerUpgradeSelection();
    }
}


// ============================================================================
// INICIALIZACIÓN
// ============================================================================

resetPlayerUpgrades();

document.addEventListener(

    "keydown",

    handlePlayerUpgradeKeydown,

    true
);

canvas.addEventListener(

    "click",

    handlePlayerUpgradeClick,

    true
);
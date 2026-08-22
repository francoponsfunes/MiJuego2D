// ============================================================================
// UI.JS
// Ascensor, mensajes e interfaces del juego.
// ============================================================================

let elevatorDialogOpen = false;

function getElevatorBounds() {
    return {
        x: canvas.width + 8,
        y: canvas.height / 2 - 65,
        width: 84,
        height: 130
    };
}

function canUseElevator() {
    return Boolean(
        isCurrentRoomType("boss") &&
        isBossDefeated() &&
        playerAccessCards > 0 &&
        !gameOver &&
        !victory
    );
}

function isPlayerNearElevator() {
    if (
        !isCurrentRoomType("boss")
    ) {
        return false;
    }

    const elevator =
        getElevatorBounds();

    const playerCenterX =
        player.x +
        player.width / 2;

    const playerCenterY =
        player.y +
        player.height / 2;

    const closestX =
        Math.max(
            elevator.x,
            Math.min(
                playerCenterX,
                elevator.x +
                    elevator.width
            )
        );

    const closestY =
        Math.max(
            elevator.y,
            Math.min(
                playerCenterY,
                elevator.y +
                    elevator.height
            )
        );

    return (
        Math.hypot(
            playerCenterX -
                closestX,

            playerCenterY -
                closestY
        ) <= 55
    );
}

function createStyledElement(
    tag,
    styles,
    text = null
) {
    const element =
        document.createElement(tag);

    Object.assign(
        element.style,
        styles
    );

    if (
        text !== null
    ) {
        element.textContent =
            text;
    }

    return element;
}

function ensureExteriorElevator() {
    if (
        canvas.exteriorElevatorView
    ) {
        return (
            canvas.exteriorElevatorView
        );
    }

    if (
        typeof document.createElement !==
            "function" ||

        !document.body ||

        typeof canvas.getBoundingClientRect !==
            "function"
    ) {
        return null;
    }

    const container =
        createStyledElement(
            "div",
            {
                position: "fixed",
                display: "none",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                zIndex: "10",
                color: "#edf2f4",
                fontFamily: "Arial, sans-serif",
                userSelect: "none"
            }
        );

    const title =
        createStyledElement(
            "div",
            {
                fontSize: "13px",
                fontWeight: "700",
                whiteSpace: "nowrap"
            },
            "ASCENSOR"
        );

    const door =
        createStyledElement(
            "div",
            {
                position: "relative",
                boxSizing: "border-box",
                width: "100%",
                border: "3px solid #73787d",
                background: "#292d31",
                boxShadow:
                    "0 0 0 5px #0e1216"
            }
        );

    const divider =
        createStyledElement(
            "div",
            {
                position: "absolute",
                top: "7px",
                bottom: "7px",
                left: "50%",
                width: "2px",
                background:
                    "rgba(210, 220, 225, 0.48)"
            }
        );

    const reader =
        createStyledElement(
            "div",
            {
                position: "absolute",
                top: "50%",
                right: "10px",
                width: "8px",
                height: "12px",
                transform:
                    "translateY(-50%)",
                background: "#ec7474"
            }
        );

    const status =
        createStyledElement(
            "div",
            {
                fontSize: "11px",
                fontWeight: "700",
                textAlign: "center",
                whiteSpace: "nowrap"
            }
        );

    door.appendChild(
        divider
    );

    door.appendChild(
        reader
    );

    container.appendChild(
        title
    );

    container.appendChild(
        door
    );

    container.appendChild(
        status
    );

    container.addEventListener(
        "click",
        openElevatorDialog
    );

    document.body.appendChild(
        container
    );

    canvas.exteriorElevatorView = {
        container,
        door,
        reader,
        status
    };

    return (
        canvas.exteriorElevatorView
    );
}

function drawElevator() {
    const view =
        ensureExteriorElevator();

    if (!view) {
        return;
    }

    if (
        !isCurrentRoomType("boss") ||
        gameOver ||
        victory
    ) {
        view.container.style.display =
            "none";

        return;
    }

    const elevator =
        getElevatorBounds();

    const bounds =
        canvas.getBoundingClientRect();

    const scaleX =
        bounds.width /
        canvas.width;

    const scaleY =
        bounds.height /
        canvas.height;

    const unlocked =
        canUseElevator();

    view.container.style.display =
        "flex";

    view.container.style.left =
        bounds.right +
        8 * scaleX +
        "px";

    view.container.style.top =
        bounds.top +
        (
            elevator.y - 22
        ) *
            scaleY +
        "px";

    view.container.style.width =
        elevator.width *
        scaleX +
        "px";

    view.container.style.cursor =
        unlocked
            ? "pointer"
            : "default";

    view.door.style.height =
        elevator.height *
        scaleY +
        "px";

    view.door.style.background =
        unlocked
            ? "#34464a"
            : "#292d31";

    view.door.style.borderColor =
        unlocked
            ? "#8ad0be"
            : "#73787d";

    view.reader.style.background =
        unlocked
            ? "#76f0ad"
            : "#ec7474";

    view.status.textContent =
        !isBossDefeated()
            ? "BLOQUEADO"
            : playerAccessCards <= 0
                ? "FALTA TARJETA"
                : isPlayerNearElevator()
                    ? "E · USAR"
                    : "HABILITADO";
}

function getElevatorDialogButtons() {
    const panelX =
        canvas.width / 2 -
        265;

    const panelY =
        canvas.height / 2 -
        130;

    return {
        ascend: {
            x:
                panelX +
                28,

            y:
                panelY +
                184,

            width: 220,

            height: 46
        },

        stay: {
            x:
                panelX +
                282,

            y:
                panelY +
                184,

            width: 220,

            height: 46
        }
    };
}

function openElevatorDialog() {
    if (
        !canUseElevator() ||
        !isPlayerNearElevator()
    ) {
        return false;
    }

    elevatorDialogOpen =
        true;

    return true;
}

function closeElevatorDialog() {
    elevatorDialogOpen =
        false;
}

function confirmElevatorAscent() {
    if (
        !elevatorDialogOpen ||
        !canUseElevator() ||
        !isPlayerNearElevator()
    ) {
        return false;
    }

    playerAccessCards--;

    elevatorDialogOpen =
        false;

    showVictory();

    return true;
}

function handleElevatorKeydown(
    event
) {
    if (
        gameOver ||
        victory
    ) {
        return;
    }

    if (
        elevatorDialogOpen
    ) {
        event.preventDefault();

        if (
            typeof event.stopImmediatePropagation ===
            "function"
        ) {
            event.stopImmediatePropagation();
        }

        if (
            event.key ===
            "Escape"
        ) {
            closeElevatorDialog();

        } else if (
            event.key ===
            "Enter"
        ) {
            confirmElevatorAscent();
        }

        return;
    }

    if (
        event.key.toLowerCase() === "e" &&
        !event.repeat &&
        openElevatorDialog()
    ) {
        event.preventDefault();
    }
}

function isPointInsideRectangle(
    x,
    y,
    rectangle
) {
    return (
        x >=
            rectangle.x &&

        x <=
            rectangle.x +
                rectangle.width &&

        y >=
            rectangle.y &&

        y <=
            rectangle.y +
                rectangle.height
    );
}

function handleElevatorClick(
    event
) {
    if (
        !elevatorDialogOpen
    ) {
        return;
    }

    const bounds =
        canvas.getBoundingClientRect();

    const clickX =
        (
            event.clientX -
            bounds.left
        ) *
        canvas.width /
        bounds.width;

    const clickY =
        (
            event.clientY -
            bounds.top
        ) *
        canvas.height /
        bounds.height;

    const buttons =
        getElevatorDialogButtons();

    if (
        isPointInsideRectangle(
            clickX,
            clickY,
            buttons.ascend
        )
    ) {
        confirmElevatorAscent();

    } else if (
        isPointInsideRectangle(
            clickX,
            clickY,
            buttons.stay
        )
    ) {
        closeElevatorDialog();
    }
}

function drawElevatorButton(
    button,
    color,
    label
) {
    ctx.fillStyle =
        color;

    ctx.fillRect(
        button.x,
        button.y,
        button.width,
        button.height
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 17px Arial";

    ctx.fillText(
        label,

        button.x +
            button.width / 2,

        button.y +
            button.height / 2
    );
}

function drawElevatorDialog() {
    if (
        !elevatorDialogOpen
    ) {
        return;
    }

    const panelX =
        canvas.width / 2 -
        265;

    const panelY =
        canvas.height / 2 -
        130;

    const buttons =
        getElevatorDialogButtons();

    ctx.save();

    ctx.fillStyle =
        "rgba(0, 0, 0, 0.76)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle =
        "#171c20";

    ctx.fillRect(
        panelX,
        panelY,
        530,
        260
    );

    ctx.strokeStyle =
        "#79928f";

    ctx.lineWidth =
        2;

    ctx.strokeRect(
        panelX,
        panelY,
        530,
        260
    );

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillStyle =
        "#f0f3f3";

    ctx.font =
        "bold 27px Arial";

    ctx.fillText(
        "¿Querés subir al siguiente piso?",

        canvas.width / 2,

        panelY + 62
    );

    ctx.fillStyle =
        "#bdc6c7";

    ctx.font =
        "16px Arial";

    ctx.fillText(
        "Podés quedarte para explorar y recoger objetos.",

        canvas.width / 2,

        panelY + 105
    );

    const pharmacyRoomId =
        getCurrentLevelConfig()
            .pharmacyRoom;

    if (
        levelHasPharmacy() &&
        rooms[pharmacyRoomId] &&
        !rooms[pharmacyRoomId].rewardCollected
    ) {
        ctx.fillStyle =
            "#ffe48c";

        ctx.font =
            "bold 15px Arial";

        ctx.fillText(
            "La recompensa de la farmacia sigue disponible.",

            canvas.width / 2,

            panelY + 140
        );
    }

    drawElevatorButton(
        buttons.ascend,
        "#285d4b",
        "ENTER · SUBIR"
    );

    drawElevatorButton(
        buttons.stay,
        "#434b50",
        "ESC · QUEDARSE"
    );

    ctx.restore();
}

document.addEventListener(
    "keydown",
    handleElevatorKeydown,
    true
);

if (
    typeof canvas.addEventListener ===
    "function"
) {
    canvas.addEventListener(
        "click",
        handleElevatorClick
    );
}

function drawCenteredOverlay(
    background,
    lines
) {
    ctx.fillStyle =
        background;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.textAlign =
        "center";

    lines.forEach((line) => {
        ctx.fillStyle =
            line.color;

        ctx.font =
            line.font;

        ctx.fillText(
            line.text,

            canvas.width / 2,

            canvas.height / 2 +
                line.offset
        );
    });

    ctx.textAlign =
        "left";
}

function drawGameOver() {
    if (!gameOver) {
        return;
    }

    drawCenteredOverlay(
        "rgba(0, 0, 0, 0.80)",
        [
            {
                text:
                    "ALPISTE",

                color:
                    "white",

                font:
                    "bold 70px Arial",

                offset:
                    0
            },

            {
                text:
                    "Presioná ENTER para volver a intentar",

                color:
                    "white",

                font:
                    "24px Arial",

                offset:
                    60
            }
        ]
    );
}

function drawVictory() {
    if (!victory) {
        return;
    }

    drawCenteredOverlay(
        "rgba(0, 0, 0, 0.91)",
        [
            {
                text:
                    "NIVEL 1 COMPLETADO",

                color:
                    "#b9c7c4",

                font:
                    "bold 24px Arial",

                offset:
                    -54
            },

            {
                text:
                    "PISO 2",

                color:
                    "white",

                font:
                    "bold 72px Arial",

                offset:
                    18
            },

            {
                text:
                    "El siguiente piso estará disponible próximamente.",

                color:
                    "#c8cece",

                font:
                    "20px Arial",

                offset:
                    78
            }
        ]
    );
}

function drawPharmacyUnlockNotice() {
    if (
        performance.now() >=
        pharmacyUnlockNoticeUntil
    ) {
        return;
    }

    ctx.fillStyle =
        "rgba(0, 0, 0, 0.72)";

    ctx.fillRect(
        canvas.width / 2 - 190,
        canvas.height - 88,
        380,
        48
    );

    ctx.fillStyle =
        "rgba(255, 245, 150, 1)";

    ctx.font =
        "bold 22px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "FARMACIA DESBLOQUEADA",

        canvas.width / 2,

        canvas.height - 64
    );

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "alphabetic";
}
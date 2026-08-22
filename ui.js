// ============================================================================
// UI.JS
// Interfaces, mensajes de derrota y victoria
// ============================================================================


// ============================================================================
// GAME OVER
// ============================================================================

function drawGameOver() {

    if (!gameOver) {
        return;
    }

    // Oscurecer pantalla
    ctx.fillStyle = "rgba(0, 0, 0, 0.80)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // ALPISTE
    ctx.fillStyle = "white";

    ctx.font = "bold 70px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "ALPISTE",
        canvas.width / 2,
        canvas.height / 2
    );


    // Texto secundario
    ctx.font = "24px Arial";

    ctx.fillText(
        "Presioná ENTER para volver a intentar",
        canvas.width / 2,
        canvas.height / 2 + 60
    );

    ctx.textAlign = "left";
}


// ============================================================================
// VICTORIA
// ============================================================================

function drawVictory() {

    if (!victory) {
        return;
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle = "white";

    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "TENES EL ALTA",
        canvas.width / 2,
        canvas.height / 2
    );


    ctx.font = "25px Arial";

    ctx.fillText(
        "Derrotaste a CUA CUA 🦆",
        canvas.width / 2,
        canvas.height / 2 + 55
    );

    ctx.textAlign = "left";
}
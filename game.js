// ============================================================================
// GAME.JS - Estado general, reinicio y ciclo principal.
// ============================================================================

let gameOver = false;

let victory = false;

let bossDoorUnlocked = false;

let lastTime = 0;


// ============================================================================
// REINICIAR PARTIDA
// ============================================================================

function restartGame() {


    // Limpiar objetos, proyectiles y enemigos.

    [

        droppedKeys,

        droppedHalfHearts,

        droppedBossItems,

        droppedBrightHearts,

        bullets,

        enemyProjectiles,

        bossProjectiles,

        enemies

    ].forEach((collection) => {

        collection.length = 0;
    });


    // Reiniciar posición del jugador.

    player.x =

        canvas.width / 2 -

        player.width / 2;

    player.y =

        canvas.height / 2 -

        player.height / 2;


    // Reiniciar vida y objetos.

    playerMaxHealth = 3;

    playerHealth =
        playerMaxHealth;

    playerKeys = 0;

    playerBoomerangs = 0;

    playerAccessCards = 0;

    brightHeartsCollected = 0;


    // Reiniciar controles y estados.

    player.aimDirection =
        "ArrowUp";

    nextShotTime = 0;

    shootingDirection = null;

    playerKnockbackX = 0;

    playerKnockbackY = 0;

    invulnerableUntil = 0;

    movementDisabledUntil = 0;


    // Reiniciar estado general.

    gameOver = false;

    victory = false;

    elevatorDialogOpen = false;

    bossDoorUnlocked = false;

    resetRoomsForNewRun();


    // Reiniciar a Cua Cua.

    Object.assign(

        boss,

        {

            active:
                false,

            defeated:
                false,

            touchingPlayer:
                false,

            health:
                boss.maxHealth,

            assistantCommandTimer:
                90,

            assistantTurn:
                0,

            anesthesiaImmunityUntil:
                0,

            attackSequence:
                0
        }
    );


    // Generar enemigos iniciales si corresponde.

    if (

        !rooms[currentRoom]
            .cleared

    ) {

        spawnEnemies(

            rooms[currentRoom]
                .enemyCount
        );
    }
}


// ============================================================================
// CICLO PRINCIPAL
// ============================================================================

function gameLoop(currentTime) {


    // Mantener una velocidad consistente entre distintos FPS.

    const deltaTime =

        lastTime

            ? Math.min(

                3,

                Math.max(

                    0,

                    (
                        currentTime -
                        lastTime
                    ) / 16.67
                )
            )

            : 1;

    lastTime =
        currentTime;


    // Limpiar pantalla.

    ctx.clearRect(

        0,

        0,

        canvas.width,

        canvas.height
    );


    // Actualizar únicamente si la partida está activa.

    if (

        !gameOver &&

        !victory &&

        !elevatorDialogOpen

    ) {

        updatePlayer(
            deltaTime
        );

        updateBullets(
            deltaTime
        );

        updateEnemyProjectiles(
            deltaTime
        );

        updateBossProjectiles(
            deltaTime
        );

        updateEnemies(
            deltaTime
        );

        updateBoss(
            deltaTime
        );

        resolveEnemyCollisions();

        resolveDroppedItemCollisions();

        checkBulletCollisions();

        checkBossCollision();

        checkPlayerDamage();

        checkEnemyProjectileCollisions();

        checkBossProjectileCollisions();

        checkKeyPickup();

        checkHalfHeartPickup();

        checkBossDropPickup();

        checkBrightHeartPickup();

        checkRoomClear();

        checkRoomChange();
    }


    // Dibujar habitación y ascensor.

    updateDoors();

    drawRoom();

    drawElevator();


    // Dibujar personajes.

    drawPlayer();

    drawEnemies();

    drawBoss();


    // Dibujar proyectiles.

    drawBullets();

    drawEnemyProjectiles();

    drawBossProjectiles();


    // Dibujar objetos.

    drawDroppedKeys();

    drawDroppedHalfHearts();

    drawBossDrops();

    drawBrightHearts();


    // Dibujar interfaz.

    drawHealth();

    drawKeys();

    drawBossHealth();

    drawRoomInfo();

    drawMinimap();

    drawPharmacyUnlockNotice();


    // Dibujar pantallas y menús.

    drawGameOver();

    drawVictory();

    drawElevatorDialog();


    // Solicitar el siguiente frame.

    requestAnimationFrame(
        gameLoop
    );
}


// ============================================================================
// INICIAR JUEGO
// ============================================================================

requestAnimationFrame(
    gameLoop
);
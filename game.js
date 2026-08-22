// ========================
// VIDA DEL JUGADOR
// ========================


let gameOver = false;
let victory = false;
let bossDoorUnlocked = false;

// ============================================================================
// REINICIAR JUEGO
// ============================================================================

function restartGame() {

    // ========================================================================
    // ITEMS Y PROYECTILES
    // ========================================================================

    droppedKeys.length = 0;
    droppedHalfHearts.length = 0;
    droppedBossItems.length = 0;
    droppedBrightHearts.length = 0;

    bullets.length = 0;
    enemyProjectiles.length = 0;
    bossProjectiles.length = 0;


    // ========================================================================
    // JUGADOR
    // ========================================================================

    player.x =
        canvas.width / 2 - 20;

    player.y =
        canvas.height / 2 - 20;

    playerMaxHealth = 3;
    playerHealth = playerMaxHealth;
    playerKeys = 0;
    brightHeartsCollected = 0;

    playerKnockbackX = 0;
    playerKnockbackY = 0;

    invulnerableUntil = 0;
    movementDisabledUntil = 0;
    



    // ========================================================================
    // ESTADO GENERAL
    // ========================================================================

    gameOver = false;
    victory = false;

    bossDoorUnlocked = false;

    resetRoomsForNewRun();


    // ========================================================================
    // ENEMIGOS
    // ========================================================================

    enemies.length = 0;


    // ========================================================================
    // CUA CUA
    // ========================================================================

    boss.active = false;
    boss.defeated = false;
    boss.touchingPlayer = false;

    boss.health =
        boss.maxHealth;

    boss.assistantCommandTimer = 90;
    boss.assistantTurn = 0;
    boss.anesthesiaImmunityUntil = 0;
    boss.attackSequence = 0;


    // ========================================================================
    // GENERAR SALA INICIAL
    // ========================================================================

    if (!rooms[currentRoom].cleared) {
        spawnEnemies(
            rooms[currentRoom].enemyCount
        );
    }
}
// ============================================================================
// GAME LOOP
// ============================================================================

let lastTime = 0;

function gameLoop(currentTime) {

    const deltaTime = lastTime

        ? Math.min(
            3,
            Math.max(
                0,
                (currentTime - lastTime) / 16.67
            )
        )

        : 1;

    lastTime = currentTime;


    // ========================================================================
    // LIMPIAR PANTALLA
    // ========================================================================

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // ========================================================================
    // ACTUALIZACIÓN
    // ========================================================================

    if (!gameOver) {


        // ====================================================================
        // JUGADOR
        // ====================================================================

        updatePlayer(deltaTime);


        // ====================================================================
        // PROYECTILES
        // ====================================================================

        updateBullets(deltaTime);

        updateEnemyProjectiles(
            deltaTime
        );

        updateBossProjectiles(
            deltaTime
        );


        // ====================================================================
        // ENEMIGOS Y BOSS
        // ====================================================================

        updateEnemies(
            deltaTime
        );

        updateBoss(
            deltaTime
        );


        // ====================================================================
        // COLISIONES FÍSICAS
        // ====================================================================

        resolveEnemyCollisions();

        resolveDroppedItemCollisions();


        // ====================================================================
        // COMBATE
        // ====================================================================

        checkBulletCollisions();

        checkBossCollision();

        checkPlayerDamage();

        checkEnemyProjectileCollisions();

        checkBossProjectileCollisions();


        // ====================================================================
        // OBJETOS
        // ====================================================================

        checkKeyPickup();

        checkHalfHeartPickup();

        checkBossDropPickup();

        checkBrightHeartPickup();


        // ====================================================================
        // SALAS
        // ====================================================================

        checkRoomClear();

        checkRoomChange();
    }


    // ========================================================================
    // HABITACIÓN
    // ========================================================================

    updateDoors();

    drawRoom();


    // ========================================================================
    // ENTIDADES
    // ========================================================================

    drawPlayer();

    drawEnemies();

    drawBoss();


    // ========================================================================
    // PROYECTILES
    // ========================================================================

    drawBullets();

    drawEnemyProjectiles();

    drawBossProjectiles();


    // ========================================================================
    // OBJETOS
    // ========================================================================

    drawDroppedKeys();

    drawDroppedHalfHearts();

    drawBossDrops();

    drawBrightHearts();


    // ========================================================================
    // INTERFAZ
    // ========================================================================

    drawHealth();

    drawKeys();

    drawBossHealth();

    drawRoomInfo();

    drawMinimap();

    drawPharmacyUnlockNotice();


    // ========================================================================
    // ESTADOS FINALES
    // ========================================================================

    drawGameOver();

    drawVictory();


    requestAnimationFrame(
        gameLoop
    );
}


requestAnimationFrame(gameLoop);

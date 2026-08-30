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

    player.x =
        canvas.width / 2 -
        player.width / 2;

    player.y =
        canvas.height / 2 -
        player.height / 2;

    playerMaxHealth = 3;

    playerHealth =
        playerMaxHealth;

    playerKeys = 0;

    playerBoomerangs = 0;

    playerAccessCards = 0;

    brightHeartsCollected = 0;

    player.aimDirection =
        "ArrowUp";

    nextShotTime = 0;

    shootingDirection = null;

    playerKnockbackX = 0;

    playerKnockbackY = 0;

    invulnerableUntil = 0;

    contactInvulnerableUntil = 0;

    movementDisabledUntil = 0;

    resetPlayerUpgrades();

    gameOver = false;

    victory = false;

    elevatorDialogOpen = false;

    bossDoorUnlocked = false;

    resetRoomsForNewRun();

    Object.assign(
        boss,
        {
            active: false,

            defeated: false,

            touchingPlayer: false,

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

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (
        !gameOver &&
        !victory &&
        !elevatorDialogOpen &&
        !upgradeSelectionOpen
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

    updateDoors();

    drawRoom();

    drawElevator();

    drawPlayer();

    drawEnemies();

    drawBoss();

    drawBullets();

    drawEnemyProjectiles();

    drawBossProjectiles();

    drawDroppedKeys();

    drawDroppedHalfHearts();

    drawBossDrops();

    drawBrightHearts();

    drawHealth();

    drawKeys();

    drawBossHealth();

    drawRoomInfo();

    drawMinimap();

    drawPharmacyUnlockNotice();

    drawGameOver();

    drawVictory();

    drawElevatorDialog();

    drawPlayerUpgradeSelection();

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
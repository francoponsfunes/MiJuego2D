// ============================================================================
// COLLISIONS.JS
// Colisiones entre balas, enemigos, drops y knockback
// ============================================================================


// ============================================================================
// COLISIÓN BALA DEL JUGADOR / ENEMIGO
// ============================================================================

function checkBulletCollisions() {

    for (
        let bulletIndex = bullets.length - 1;
        bulletIndex >= 0;
        bulletIndex--
    ) {

        const bullet =
            bullets[bulletIndex];

        for (
            let enemyIndex = enemies.length - 1;
            enemyIndex >= 0;
            enemyIndex--
        ) {

            const enemy =
                enemies[enemyIndex];

            const colliding =
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y;

            if (!colliding) {
                continue;
            }


            // ================================================================
            // DAÑO
            // ================================================================

            enemy.health--;


            // ================================================================
            // DOCTOR: GENERAR ENFERMERAS
            // ================================================================

            if (
                enemy.type === "doctor" &&
                enemy.health <= 8 &&
                !enemy.nursesSpawned
            ) {

                enemy.nursesSpawned = true;

                spawnNurses(enemy);
            }


            // ================================================================
            // KNOCKBACK
            // ================================================================

            applyEnemyKnockback(
                enemy,
                bullet
            );


            // La bala desaparece.
            bullets.splice(
                bulletIndex,
                1
            );


            // ================================================================
            // ENEMIGO DERROTADO
            // ================================================================

            if (enemy.health <= 0) {

                const dropX =
                    enemy.x;

                const dropY =
                    enemy.y;

                const enemyType =
                    enemy.type;

                enemies.splice(
                    enemyIndex,
                    1
                );


                // ============================================================
                // DROP DEL DOCTOR
                // ============================================================

                if (
                    currentRoom === 2 &&
                    enemyType === "doctor"
                ) {

                    dropKey(
                        dropX + 10,
                        dropY + 10
                    );

                    dropHalfHeart(
                        dropX + 35,
                        dropY + 10
                    );
                }


                // ============================================================
                // DROP DEL TRAUMATÓLOGO
                // ============================================================

                if (
                    currentRoom === 3 &&
                    enemyType === "traumatologist"
                ) {

                    dropKey(
                        dropX + 5,
                        dropY + 10
                    );

                    dropFullHeart(
                        dropX + 35,
                        dropY + 10
                    );
                }


                // ============================================================
                // DROP DEL DIRECTOR
                // ============================================================

                if (
                    currentRoom === 4 &&
                    enemyType === "director"
                ) {
                    // La Inspección castiga quedarse dentro de la zona.
if (
    enemy.pressureState === "active" &&
    !enemy.pressureHit
) {

    const playerCenterX =
        player.x + player.width / 2;

    const playerCenterY =
        player.y + player.height / 2;

    const pressureDx =
        playerCenterX -
        enemy.pressureTargetX;

    const pressureDy =
        playerCenterY -
        enemy.pressureTargetY;

    const pressureDistance =
        Math.sqrt(
            pressureDx * pressureDx +
            pressureDy * pressureDy
        );

    if (
        pressureDistance <=
        enemy.pressureRadius
    ) {

        enemy.pressureHit =
            true;

        damagePlayer(
            0.5,
            enemy.pressureTargetX,
            enemy.pressureTargetY,
            8
        );
    }
}

                    dropKey(
                        dropX + 5,
                        dropY + 10
                    );

                    dropFullHeart(
                        dropX + 35,
                        dropY + 10
                    );
                }


                // ============================================================
                // SALA NORMAL COMPLETADA
                // La Sala 5 solamente se completa al vencer a Cua Cua.
                // ============================================================

                if (
                    currentRoom < 5 &&
                    enemies.length === 0 &&
                    !rooms[currentRoom].cleared
                ) {

                    rooms[currentRoom].cleared =
                        true;
                }
            }


            // Una bala solo golpea una vez.
            break;
        }
    }
}
// ============================================================================
// COLISIÓN ENTRE ENEMIGOS
// ============================================================================

function resolveEnemyCollisions() {

    for (let i = 0; i < enemies.length; i++) {

        for (let j = i + 1; j < enemies.length; j++) {

            const enemyA = enemies[i];
            const enemyB = enemies[j];


            const centerAX =
                enemyA.x +
                enemyA.width / 2;

            const centerAY =
                enemyA.y +
                enemyA.height / 2;

            const centerBX =
                enemyB.x +
                enemyB.width / 2;

            const centerBY =
                enemyB.y +
                enemyB.height / 2;


            // 80% del cuerpo
            const halfWidthA =
                enemyA.width *
                0.8 /
                2;

            const halfHeightA =
                enemyA.height *
                0.8 /
                2;

            const halfWidthB =
                enemyB.width *
                0.8 /
                2;

            const halfHeightB =
                enemyB.height *
                0.8 /
                2;


            const dx =
                centerBX -
                centerAX;

            const dy =
                centerBY -
                centerAY;


            const overlapX =
                halfWidthA +
                halfWidthB -
                Math.abs(dx);

            const overlapY =
                halfHeightA +
                halfHeightB -
                Math.abs(dy);


            if (
                overlapX <= 0 ||
                overlapY <= 0
            ) {
                continue;
            }


            // Los movimientos forzados de Sala 3
            // no deben perder fuerza por chocarse con aliados.
            const forcedA =
                (
                    enemyA.type === "traumatologist" &&
                    enemyA.traumaState === "charge"
                ) ||
                (
                    enemyA.type === "anesthesiologist" &&
                    enemyA.anesthesiologistState === "dash"
                );


            const forcedB =
                (
                    enemyB.type === "traumatologist" &&
                    enemyB.traumaState === "charge"
                ) ||
                (
                    enemyB.type === "anesthesiologist" &&
                    enemyB.anesthesiologistState === "dash"
                );


            // ====================================================================
            // SEPARACIÓN HORIZONTAL
            // ====================================================================

            if (overlapX < overlapY) {

                if (forcedA && !forcedB) {

                    if (dx >= 0) {
                        enemyB.x += overlapX;
                    } else {
                        enemyB.x -= overlapX;
                    }

                } else if (forcedB && !forcedA) {

                    if (dx >= 0) {
                        enemyA.x -= overlapX;
                    } else {
                        enemyA.x += overlapX;
                    }

                } else {

                    const push =
                        overlapX / 2;

                    if (dx >= 0) {

                        enemyA.x -= push;
                        enemyB.x += push;

                    } else {

                        enemyA.x += push;
                        enemyB.x -= push;
                    }
                }
            }


            // ====================================================================
            // SEPARACIÓN VERTICAL
            // ====================================================================

            else {

                if (forcedA && !forcedB) {

                    if (dy >= 0) {
                        enemyB.y += overlapY;
                    } else {
                        enemyB.y -= overlapY;
                    }

                } else if (forcedB && !forcedA) {

                    if (dy >= 0) {
                        enemyA.y -= overlapY;
                    } else {
                        enemyA.y += overlapY;
                    }

                } else {

                    const push =
                        overlapY / 2;

                    if (dy >= 0) {

                        enemyA.y -= push;
                        enemyB.y += push;

                    } else {

                        enemyA.y += push;
                        enemyB.y -= push;
                    }
                }
            }
        }
    }
}


// ============================================================================
// COLISIÓN ENTRE DROPS
// ============================================================================

function resolveDroppedItemCollisions() {

    const items = [];


    // Llaves
    droppedKeys.forEach((key) => {

        items.push({
            object: key
        });
    });


    // Medios corazones
    droppedHalfHearts.forEach((heart) => {

        items.push({
            object: heart
        });
    });


    // Comparar cada objeto con los demás
    for (let i = 0; i < items.length; i++) {

        for (let j = i + 1; j < items.length; j++) {

            const itemA = items[i].object;
            const itemB = items[j].object;


            // Solo pueden chocar objetos de la misma sala
            if (
                itemA.room !== itemB.room ||
                itemA.room !== currentRoom
            ) {
                continue;
            }


            const centerAX =
                itemA.x + itemA.width / 2;

            const centerAY =
                itemA.y + itemA.height / 2;

            const centerBX =
                itemB.x + itemB.width / 2;

            const centerBY =
                itemB.y + itemB.height / 2;


            const halfWidthA =
                itemA.width / 2;

            const halfHeightA =
                itemA.height / 2;

            const halfWidthB =
                itemB.width / 2;

            const halfHeightB =
                itemB.height / 2;


            const dx =
                centerBX - centerAX;

            const dy =
                centerBY - centerAY;


            const overlapX =
                halfWidthA +
                halfWidthB -
                Math.abs(dx);

            const overlapY =
                halfHeightA +
                halfHeightB -
                Math.abs(dy);


            if (overlapX <= 0 || overlapY <= 0) {
                continue;
            }


            // ================================================================
            // SEPARACIÓN HORIZONTAL
            // ================================================================

            if (overlapX < overlapY) {

                const pushX = overlapX / 2;

                if (dx > 0) {

                    itemA.x -= pushX;
                    itemB.x += pushX;

                } else {

                    itemA.x += pushX;
                    itemB.x -= pushX;
                }
            }


            // ================================================================
            // SEPARACIÓN VERTICAL
            // ================================================================

            else {

                const pushY = overlapY / 2;

                if (dy > 0) {

                    itemA.y -= pushY;
                    itemB.y += pushY;

                } else {

                    itemA.y += pushY;
                    itemB.y -= pushY;
                }
            }
        }
    }
}


// ============================================================================
// KNOCKBACK DEL ENEMIGO
// ============================================================================

function applyEnemyKnockback(enemy, bullet) {

    // Los ataques comprometidos de Sala 3 no se cancelan
    // simplemente disparándoles. Siguen recibiendo daño,
    // pero el jugador tiene que respetar y esquivar el ataque.
    const committedAttack =
        currentRoom === 3 &&
        (
            (
                enemy.type === "anesthesiologist" &&
                (
                    enemy.anesthesiologistState === "windup" ||
                    enemy.anesthesiologistState === "fakeout" ||
                    enemy.anesthesiologistState === "dash"
                )
            ) ||
            (
                enemy.type === "traumatologist" &&
                (
                    enemy.traumaState === "chargeWindup" ||
                    enemy.traumaState === "charge" ||
                    enemy.traumaState === "slamWindup" ||
                    enemy.traumaState === "slamActive"
                )
            )
        );


    if (committedAttack) {
        return;
    }


    const force = 8;


    if (bullet.direction === "ArrowRight") {

        enemy.knockbackX = force;
        enemy.knockbackY = 0;
    }

    else if (bullet.direction === "ArrowLeft") {

        enemy.knockbackX = -force;
        enemy.knockbackY = 0;
    }

    else if (bullet.direction === "ArrowUp") {

        enemy.knockbackX = 0;
        enemy.knockbackY = -force;
    }

    else if (bullet.direction === "ArrowDown") {

        enemy.knockbackX = 0;
        enemy.knockbackY = force;
    }
}

function checkPlayerDamage() {

    if (gameOver || victory) {
        return;
    }


    enemies.forEach((enemy) => {

        const colliding =
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y;


        // ====================================================================
        // ANESTESIÓLOGO
        // ====================================================================

        if (enemy.type === "anesthesiologist") {

    // ================================================================
    // ANESTESIÓLOGO DE SALA 3
    // ================================================================

    if (currentRoom === 3) {

        if (
            colliding &&
            enemy.anesthesiologistState === "dash" &&
            !enemy.anesthesiaUsedThisDash
        ) {

            enemy.anesthesiaUsedThisDash =
                true;

            movementDisabledUntil =
                Math.max(
                    movementDisabledUntil,
                    performance.now() + 700
                );

            enemy.anesthesiologistState =
                "retreat";

            enemy.stateTimer =
                enemy.retreatDuration;
        }

        return;
    }


    // ================================================================
    // ANESTESIÓLOGOS ASISTENTES DE CUA CUA
    // ================================================================

    if (
        enemy.bossAssistant &&
        colliding &&
        enemy.anesthesiologistState === "dash" &&
        !enemy.anesthesiaUsedThisDash
    ) {

        enemy.anesthesiaUsedThisDash =
            true;

        const now =
            performance.now();

        if (
            now >=
            boss.anesthesiaImmunityUntil
        ) {

            movementDisabledUntil =
                Math.max(
                    movementDisabledUntil,
                    now + 450
                );

            boss.anesthesiaImmunityUntil =
                now + 1400;
        }

        enemy.anesthesiologistState =
            "return";
    }

    return;
}
        // ====================================================================
        // TRAUMATÓLOGO
        // ====================================================================

        if (enemy.type === "traumatologist") {


            // ================================================================
            // CARGA FRONTAL
            // ================================================================

            if (
                colliding &&
                enemy.traumaState === "charge" &&
                !enemy.attackHitThisStrike
            ) {

                enemy.attackHitThisStrike =
                    true;


                damagePlayerFromEntity(
                    1,
                    enemy,
                    11
                );


                enemy.traumaState =
                    "recovery";

                enemy.stateTimer =
                    enemy.enraged
                        ? 22
                        : 30;


                return;
            }


            // ================================================================
            // GOLPE DE ÁREA
            // ================================================================

            if (
                enemy.traumaState === "slamActive" &&
                !enemy.slamHitThisAttack
            ) {

                const playerCenterX =
                    player.x +
                    player.width / 2;

                const playerCenterY =
                    player.y +
                    player.height / 2;

                const enemyCenterX =
                    enemy.x +
                    enemy.width / 2;

                const enemyCenterY =
                    enemy.y +
                    enemy.height / 2;


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
                    );


                if (
                    distance <=
                    enemy.currentSlamRadius
                ) {

                    enemy.slamHitThisAttack =
                        true;


                    damagePlayerFromEntity(
                        1,
                        enemy,
                        12
                    );
                }
            }


            // El contacto normal con el Traumatólogo
            // no hace daño.
            return;
        }


        // ====================================================================
        // DIRECTOR
        // ====================================================================

        if (enemy.type === "director") {

            // La carga es su golpe fuerte y está anunciada visualmente.
            if (
                colliding &&
                enemy.directorState === "charge" &&
                !enemy.chargeHit
            ) {

                enemy.chargeHit =
                    true;

                damagePlayerFromEntity(
                    1,
                    enemy,
                    11
                );

                enemy.directorState =
                    "recover";

                enemy.stateTimer =
                    enemy.recoverDuration;

                return;
            }


            // El contacto normal ya no reemplaza a sus ataques.
            if (colliding) {

                const now =
                    performance.now();


                if (
                    now - enemy.lastAttackTime >=
                    enemy.attackCooldown
                ) {

                    damagePlayerFromEntity(
                        0.5,
                        enemy
                    );


                    enemy.lastAttackTime =
                        now;
                }
            }


            return;
        }


        // ====================================================================
        // RESTO DE ENEMIGOS
        // ====================================================================

        if (
            colliding &&
            !enemy.touchingPlayer
        ) {

            enemy.touchingPlayer =
                true;


            damagePlayerFromEntity(
                0.5,
                enemy
            );
        }


        if (!colliding) {

            enemy.touchingPlayer =
                false;
        }
    });


    // ========================================================================
    // CUA CUA
    // ========================================================================

    if (
        boss.active &&
        !boss.defeated
    ) {

        const bossColliding =
            player.x < boss.x + boss.width &&
            player.x + player.width > boss.x &&
            player.y < boss.y + boss.height &&
            player.y + player.height > boss.y;


        if (
            bossColliding &&
            !boss.touchingPlayer
        ) {

            boss.touchingPlayer =
                true;


            damagePlayerFromEntity(
                0.5,
                boss
            );
        }


        if (!bossColliding) {

            boss.touchingPlayer =
                false;
        }
    }
}

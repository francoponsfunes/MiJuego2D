// ============================================================================
// COLLISIONS.JS
// Colisiones, recompensas y reacciones de los enemigos.
// ============================================================================

function areEntitiesColliding(first, second) {
    return (
        first.x < second.x + second.width &&
        first.x + first.width > second.x &&
        first.y < second.y + second.height &&
        first.y + first.height > second.y
    );
}

function getEntityOverlap(first, second, scale = 1) {
    const dx =
        second.x + second.width / 2 -
        first.x - first.width / 2;

    const dy =
        second.y + second.height / 2 -
        first.y - first.height / 2;

    return {
        dx,

        dy,

        overlapX:
            first.width * scale / 2 +
            second.width * scale / 2 -
            Math.abs(dx),

        overlapY:
            first.height * scale / 2 +
            second.height * scale / 2 -
            Math.abs(dy)
    };
}

function separateEntities(
    first,
    second,
    overlap,
    forcedFirst = false,
    forcedSecond = false,
    includeZero = true
) {
    const horizontal =
        overlap.overlapX < overlap.overlapY;

    const axis =
        horizontal ? "x" : "y";

    const distance =
        horizontal ? overlap.dx : overlap.dy;

    const amount =
        horizontal
            ? overlap.overlapX
            : overlap.overlapY;

    const direction =
        includeZero
            ? distance >= 0
                ? 1
                : -1
            : distance > 0
                ? 1
                : -1;

    if (forcedFirst && !forcedSecond) {
        second[axis] += amount * direction;
        return;
    }

    if (forcedSecond && !forcedFirst) {
        first[axis] -= amount * direction;
        return;
    }

    const push = amount / 2;

    first[axis] -= push * direction;
    second[axis] += push * direction;
}

function dropDefeatedEnemyRewards(enemy) {
    if (
        isCurrentRoomType("doctor") &&
        enemy.type === "doctor"
    ) {
        dropKey(
            enemy.x + 10,
            enemy.y + 10
        );

        dropHalfHeart(
            enemy.x + 35,
            enemy.y + 10
        );

        return;
    }

    const grantsFullHeart =
        (
            isCurrentRoomType("trauma") &&
            enemy.type === "traumatologist"
        ) ||
        (
            isCurrentRoomType("director") &&
            enemy.type === "director"
        );

    if (grantsFullHeart) {
        dropKey(
            enemy.x + 5,
            enemy.y + 10
        );

        dropFullHeart(
            enemy.x + 35,
            enemy.y + 10
        );
    }
}

function checkBulletCollisions() {
    for (
        let bulletIndex = bullets.length - 1;
        bulletIndex >= 0;
        bulletIndex--
    ) {
        const bullet = bullets[bulletIndex];

        const isBoomerang =
            bullet.type === "boomerang";

        for (
            let enemyIndex = enemies.length - 1;
            enemyIndex >= 0;
            enemyIndex--
        ) {
            const enemy = enemies[enemyIndex];

            if (
                (
                    isBoomerang &&
                    bullet.hitEnemies.has(enemy)
                ) ||
                !areEntitiesColliding(
                    bullet,
                    enemy
                )
            ) {
                continue;
            }

            enemy.health -=
                isBoomerang
                    ? bullet.damage
                    : 1;

            if (isBoomerang) {
                bullet.hitEnemies.add(enemy);
            }

            if (
                enemy.type === "doctor" &&
                enemy.health <= 8 &&
                !enemy.nursesSpawned
            ) {
                enemy.nursesSpawned = true;

                spawnNurses(enemy);
            }

            applyEnemyKnockback(
                enemy,
                bullet
            );

            if (!isBoomerang) {
                bullets.splice(
                    bulletIndex,
                    1
                );
            }

            if (enemy.health <= 0) {
                enemies.splice(
                    enemyIndex,
                    1
                );

                dropDefeatedEnemyRewards(enemy);

                if (
                    !isCurrentRoomType("boss") &&
                    enemies.length === 0 &&
                    !rooms[currentRoom].cleared
                ) {
                    rooms[currentRoom].cleared = true;
                }
            }

            if (!isBoomerang) {
                break;
            }
        }
    }
}

function isEnemyMovementForced(enemy) {
    return (
        (
            enemy.type === "traumatologist" &&
            enemy.traumaState === "charge"
        ) ||
        (
            enemy.type === "anesthesiologist" &&
            enemy.anesthesiologistState === "dash"
        )
    );
}

function resolveEnemyCollisions() {
    for (
        let firstIndex = 0;
        firstIndex < enemies.length;
        firstIndex++
    ) {
        for (
            let secondIndex = firstIndex + 1;
            secondIndex < enemies.length;
            secondIndex++
        ) {
            const first =
                enemies[firstIndex];

            const second =
                enemies[secondIndex];

            const overlap =
                getEntityOverlap(
                    first,
                    second,
                    0.8
                );

            if (
                overlap.overlapX <= 0 ||
                overlap.overlapY <= 0
            ) {
                continue;
            }

            separateEntities(
                first,
                second,
                overlap,
                isEnemyMovementForced(first),
                isEnemyMovementForced(second)
            );
        }
    }
}

function resolveDroppedItemCollisions() {
    const items = [
        ...droppedKeys,
        ...droppedHalfHearts,
        ...droppedBossItems,
        ...droppedBrightHearts
    ];

    for (
        let firstIndex = 0;
        firstIndex < items.length;
        firstIndex++
    ) {
        for (
            let secondIndex = firstIndex + 1;
            secondIndex < items.length;
            secondIndex++
        ) {
            const first =
                items[firstIndex];

            const second =
                items[secondIndex];

            if (
                first.room !== second.room ||
                first.room !== currentRoom
            ) {
                continue;
            }

            const overlap =
                getEntityOverlap(
                    first,
                    second
                );

            if (
                overlap.overlapX <= 0 ||
                overlap.overlapY <= 0
            ) {
                continue;
            }

            separateEntities(
                first,
                second,
                overlap,
                false,
                false,
                false
            );
        }
    }
}

function isCommittedEnemyAttack(enemy) {
    if (isCurrentRoomType("trauma")) {
        const anesthesiaAttack =
            enemy.type === "anesthesiologist" &&
            [
                "windup",
                "fakeout",
                "dash"
            ].includes(
                enemy.anesthesiologistState
            );

        const traumaAttack =
            enemy.type === "traumatologist" &&
            [
                "chargeWindup",
                "charge",
                "slamWindup",
                "slamActive"
            ].includes(
                enemy.traumaState
            );

        return (
            anesthesiaAttack ||
            traumaAttack
        );
    }

    if (isCurrentRoomType("junction")) {
        return (
            enemy.type === "leper" &&
            enemy.junctionAmbusher &&
            [
                "windup",
                "rush"
            ].includes(
                enemy.leperState
            )
        );
    }

    if (
        isCurrentRoomType(
            "anesthesiaPreparation"
        )
    ) {
        return (
            enemy.type === "anesthesiologist" &&
            enemy.preparationAnesthesiologist &&
            [
                "dashWindup",
                "dash"
            ].includes(
                enemy.preparationState
            )
        );
    }

    if (
        isCurrentRoomType(
            "surgicalPreparation"
        )
    ) {
        return (
            (
                enemy.surgicalPreparationSurgeon &&
                enemy.surgicalState === "aim"
            ) ||
            (
                enemy.surgicalPreparationNurse &&
                [
                    "windup",
                    "rush"
                ].includes(
                    enemy.nurseState
                )
            )
        );
    }

    return false;
}

function applyEnemyKnockback(enemy, bullet) {
    if (
        isCommittedEnemyAttack(enemy)
    ) {
        return;
    }

    const direction =
        PROJECTILE_DIRECTIONS[
            bullet.direction
        ];

    if (!direction) {
        return;
    }

    enemy.knockbackX =
        direction.x * 8;

    enemy.knockbackY =
        direction.y * 8;
}

function handleAnesthesiologistContact(
    enemy,
    colliding
) {
    if (
        isCurrentRoomType("trauma")
    ) {
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

    if (
        !enemy.bossAssistant ||
        !colliding ||
        enemy.anesthesiologistState !== "dash" ||
        enemy.anesthesiaUsedThisDash
    ) {
        return;
    }

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

function getDistanceBetweenEntityCenters(
    first,
    second
) {
    const dx =
        first.x +
        first.width / 2 -
        second.x -
        second.width / 2;

    const dy =
        first.y +
        first.height / 2 -
        second.y -
        second.height / 2;

    return Math.hypot(
        dx,
        dy
    );
}

function handleTraumatologistContact(
    enemy,
    colliding
) {
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

    if (
        enemy.traumaState !== "slamActive" ||
        enemy.slamHitThisAttack
    ) {
        return;
    }

    if (
        getDistanceBetweenEntityCenters(
            player,
            enemy
        ) <=
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

function handleDirectorContact(
    enemy,
    colliding
) {
    if (
        enemy.pressureState === "active" &&
        !enemy.pressureHit
    ) {
        const distance =
            Math.hypot(
                player.x +
                    player.width / 2 -
                    enemy.pressureTargetX,

                player.y +
                    player.height / 2 -
                    enemy.pressureTargetY
            );

        if (
            distance <=
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

    if (!colliding) {
        return;
    }

    const now =
        performance.now();

    if (
        now -
            enemy.lastAttackTime >=
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

function checkPlayerDamage() {
    if (
        gameOver ||
        victory
    ) {
        return;
    }

    enemies.forEach((enemy) => {
        const colliding =
            areEntitiesColliding(
                player,
                enemy
            );

        if (
            enemy.type ===
            "anesthesiologist"
        ) {
            handleAnesthesiologistContact(
                enemy,
                colliding
            );

            return;
        }

        if (
            enemy.type ===
            "traumatologist"
        ) {
            handleTraumatologistContact(
                enemy,
                colliding
            );

            return;
        }

        if (
            enemy.type ===
            "director"
        ) {
            handleDirectorContact(
                enemy,
                colliding
            );

            return;
        }

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

    if (
        !boss.active ||
        boss.defeated
    ) {
        return;
    }

    const colliding =
        areEntitiesColliding(
            player,
            boss
        );

    if (
        colliding &&
        !boss.touchingPlayer
    ) {
        boss.touchingPlayer =
            true;

        damagePlayerFromEntity(
            0.5,
            boss
        );
    }

    if (!colliding) {
        boss.touchingPlayer =
            false;
    }
}
// ============================================================================
// PROJECTILES.JS
// Proyectiles del juego
// ============================================================================


// ============================================================================
// BALAS DEL JUGADOR
// ============================================================================

const bullets = [];


// ============================================================================
// ACTUALIZAR BALAS DEL JUGADOR
// ============================================================================
function updateBullets(deltaTime = 1) {

    for (
        let bulletIndex = bullets.length - 1;
        bulletIndex >= 0;
        bulletIndex--
    ) {

        const bullet = bullets[bulletIndex];

        const movement =
            bullet.speed * deltaTime;


        // ====================================================================
        // DIRECCIÓN DEL DISPARO
        // ====================================================================

        if (bullet.direction === "ArrowUp") {

            bullet.y -= movement;
        }

        if (bullet.direction === "ArrowDown") {

            bullet.y += movement;
        }

        if (bullet.direction === "ArrowLeft") {

            bullet.x -= movement;
        }

        if (bullet.direction === "ArrowRight") {

            bullet.x += movement;
        }


        // ====================================================================
        // ELIMINAR DISPAROS FUERA DE LA HABITACIÓN
        // ====================================================================

        if (
            bullet.x < -20 ||
            bullet.x > canvas.width + 20 ||
            bullet.y < -20 ||
            bullet.y > canvas.height + 20
        ) {

            bullets.splice(
                bulletIndex,
                1
            );
        }
    }
}
// ============================================================================
// DIBUJAR BALAS DEL JUGADOR
// ============================================================================

function drawBullets() {

    ctx.fillStyle = "cyan";

    bullets.forEach((bullet) => {

        ctx.fillRect(
            bullet.x,
            bullet.y,
            bullet.width,
            bullet.height
        );
    });
}
// ============================================================================
// PROYECTILES ENEMIGOS
// ============================================================================

const enemyProjectiles = [];


// ============================================================================
// CREAR PROYECTIL ENEMIGO
// ============================================================================

function shootEnemyProjectile(
    enemy,
    type = "syringe",
    angleOffset = 0
) {

    const enemyCenterX =
        enemy.x + enemy.width / 2;

    const enemyCenterY =
        enemy.y + enemy.height / 2;

    const playerCenterX =
        player.x + player.width / 2;

    const playerCenterY =
        player.y + player.height / 2;

    const dx =
        playerCenterX - enemyCenterX;

    const dy =
        playerCenterY - enemyCenterY;

    const distance =
        Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
        return;
    }

    const speed =
        type === "scalpel"
            ? 5
            : 4.6;

    const angle =
        Math.atan2(dy, dx) +
        angleOffset;

    enemyProjectiles.push({

        type: type,

        x:
            enemyCenterX - 5,

        y:
            enemyCenterY - 5,

        width:
            type === "scalpel"
                ? 12
                : 10,

        height:
            type === "scalpel"
                ? 6
                : 10,

        vx:
            Math.cos(angle) * speed,

        vy:
            Math.sin(angle) * speed
    });
}


// ============================================================================
// ACTUALIZAR PROYECTILES ENEMIGOS
// ============================================================================

function updateEnemyProjectiles(deltaTime) {

    for (
        let i = enemyProjectiles.length - 1;
        i >= 0;
        i--
    ) {

        const projectile =
            enemyProjectiles[i];

        projectile.x +=
            projectile.vx * deltaTime;

        projectile.y +=
            projectile.vy * deltaTime;

        // Eliminar proyectil fuera de la sala
        if (
            projectile.x < -20 ||
            projectile.x > canvas.width + 20 ||
            projectile.y < -20 ||
            projectile.y > canvas.height + 20
        ) {

            enemyProjectiles.splice(i, 1);
        }
    }
}
// ============================================================================
// COLISIONES PROYECTILES ENEMIGOS / JUGADOR
// ============================================================================

function checkEnemyProjectileCollisions() {

    for (
        let i = enemyProjectiles.length - 1;
        i >= 0;
        i--
    ) {

        const projectile =
            enemyProjectiles[i];

        const colliding =
            player.x <
                projectile.x + projectile.width &&
            player.x + player.width >
                projectile.x &&
            player.y <
                projectile.y + projectile.height &&
            player.y + player.height >
                projectile.y;

        if (colliding) {

            damagePlayerFromEntity(
    0.5,
    projectile
);

            enemyProjectiles.splice(i, 1);
        }
    }
}

// ============================================================================
// DIBUJAR PROYECTILES ENEMIGOS
// ============================================================================

function drawEnemyProjectiles() {

    enemyProjectiles.forEach((projectile) => {

        ctx.fillStyle = "white";

        ctx.fillRect(
            projectile.x,
            projectile.y,
            projectile.width,
            projectile.height
        );
    });
}
// ============================================================================
// PROYECTILES DE CUA CUA
// ============================================================================

const bossProjectiles = [];


// ============================================================================
// CREAR PROYECTIL DE CUA CUA
// ============================================================================

function shootBossProjectile(
    targetX,
    targetY,
    speed,
    angle = null
) {

    const centerX =
        boss.x + boss.width / 2;

    const centerY =
        boss.y + boss.height / 2;

    let vx;
    let vy;

    if (angle !== null) {

        vx =
            Math.cos(angle) * speed;

        vy =
            Math.sin(angle) * speed;

    } else {

        const dx =
            targetX - centerX;

        const dy =
            targetY - centerY;

        const distance =
            Math.sqrt(dx * dx + dy * dy) || 1;

        vx =
            (dx / distance) * speed;

        vy =
            (dy / distance) * speed;
    }

    bossProjectiles.push({

        x: centerX - 6,
        y: centerY - 6,

        width: 12,
        height: 12,

        vx: vx,
        vy: vy
    });
}


// ============================================================================
// ACTUALIZAR PROYECTILES DE CUA CUA
// ============================================================================

function updateBossProjectiles(deltaTime) {

    for (
        let i = bossProjectiles.length - 1;
        i >= 0;
        i--
    ) {

        const projectile =
            bossProjectiles[i];

        projectile.x +=
            projectile.vx * deltaTime;

        projectile.y +=
            projectile.vy * deltaTime;

        if (
            projectile.x < -30 ||
            projectile.x > canvas.width + 30 ||
            projectile.y < -30 ||
            projectile.y > canvas.height + 30
        ) {

            bossProjectiles.splice(i, 1);
        }
    }
}

// ============================================================================
// COLISIONES PROYECTILES DE CUA CUA / JUGADOR
// ============================================================================

function checkBossProjectileCollisions() {

    for (
        let i = bossProjectiles.length - 1;
        i >= 0;
        i--
    ) {

        const projectile =
            bossProjectiles[i];

        const colliding =
            player.x <
                projectile.x + projectile.width &&
            player.x + player.width >
                projectile.x &&
            player.y <
                projectile.y + projectile.height &&
            player.y + player.height >
                projectile.y;

        if (colliding) {

            damagePlayerFromEntity(
    0.5,
    projectile
);

            bossProjectiles.splice(i, 1);
        }
    }
}

// ============================================================================
// DIBUJAR PROYECTILES DE CUA CUA
// ============================================================================

function drawBossProjectiles() {

    bossProjectiles.forEach((projectile) => {

        ctx.fillStyle = "white";

        ctx.fillRect(
            projectile.x,
            projectile.y,
            projectile.width,
            projectile.height
        );
    });
}

// ============================================================================
// PROJECTILES.JS
// Proyectiles del jugador, enemigos y jefe.
// ============================================================================

const bullets = [];
const enemyProjectiles = [];
const bossProjectiles = [];

const PROJECTILE_DIRECTIONS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }
};

function isOutsideCanvas(projectile, margin) {
    return (
        projectile.x < -margin ||
        projectile.x > canvas.width + margin ||
        projectile.y < -margin ||
        projectile.y > canvas.height + margin
    );
}

function updateLinearProjectiles(projectiles, deltaTime, margin) {
    for (let index = projectiles.length - 1; index >= 0; index--) {
        const projectile = projectiles[index];

        projectile.x += projectile.vx * deltaTime;
        projectile.y += projectile.vy * deltaTime;

        if (isOutsideCanvas(projectile, margin)) {
            projectiles.splice(index, 1);
        }
    }
}
function checkProjectilePlayerCollisions(
    projectiles
) {

    for (
        let index =
            projectiles.length - 1;

        index >= 0;

        index--
    ) {
        const projectile =
            projectiles[index];

        const colliding =
            player.x <
                projectile.x +
                projectile.width &&

            player.x +
                player.width >
                projectile.x &&

            player.y <
                projectile.y +
                projectile.height &&

            player.y +
                player.height >
                projectile.y;

        if (!colliding) {
            continue;
        }

        damagePlayerFromEntity(
            0.5,
            projectile,
            7,
            "projectile"
        );

        projectiles.splice(
            index,
            1
        );
    }
}
function drawRectProjectiles(projectiles) {
    projectiles.forEach((projectile) => {
        ctx.fillStyle = "white";

        ctx.fillRect(
            projectile.x,
            projectile.y,
            projectile.width,
            projectile.height
        );
    });
}
function launchBoomerang() {

    if (
        gameOver ||
        victory ||
        upgradeSelectionOpen ||
        playerBoomerangs <= 0
    ) {
        return false;
    }

    let aimX =
        Number(Boolean(keys.d)) -
        Number(Boolean(keys.a));

    let aimY =
        Number(Boolean(keys.s)) -
        Number(Boolean(keys.w));

    if (
        aimX === 0 &&
        aimY === 0
    ) {
        const shootingX =
            Number(
                Boolean(
                    keys.arrowright
                )
            ) -
            Number(
                Boolean(
                    keys.arrowleft
                )
            );

        const shootingY =
            Number(
                Boolean(
                    keys.arrowdown
                )
            ) -
            Number(
                Boolean(
                    keys.arrowup
                )
            );

        if (
            shootingX !== 0 ||
            shootingY !== 0
        ) {
            aimX =
                shootingX;

            aimY =
                shootingY;

        } else if (
            Number.isFinite(
                player.boomerangAimX
            ) &&
            Number.isFinite(
                player.boomerangAimY
            ) &&
            (
                player.boomerangAimX !== 0 ||
                player.boomerangAimY !== 0
            )
        ) {
            aimX =
                player.boomerangAimX;

            aimY =
                player.boomerangAimY;

        } else {
            const fallbackAim =
                PROJECTILE_DIRECTIONS[
                    player.aimDirection
                ] ||
                PROJECTILE_DIRECTIONS[
                    shootingDirection
                ] ||
                PROJECTILE_DIRECTIONS
                    .ArrowUp;

            aimX =
                fallbackAim.x;

            aimY =
                fallbackAim.y;
        }
    }

    const aimLength =
        Math.hypot(
            aimX,
            aimY
        );

    if (
        aimLength === 0
    ) {
        return false;
    }

    aimX /=
        aimLength;

    aimY /=
        aimLength;

    player.boomerangAimX =
        aimX;

    player.boomerangAimY =
        aimY;

    const direction =
        Math.abs(aimX) >=
        Math.abs(aimY)

            ? aimX >= 0
                ? "ArrowRight"
                : "ArrowLeft"

            : aimY >= 0
                ? "ArrowDown"
                : "ArrowUp";

    const size = 24;
    const speed = 9;

    bullets.push({
        type: "boomerang",

        x:
            player.x +
            player.width / 2 -
            size / 2,

        y:
            player.y +
            player.height / 2 -
            size / 2,

        width: size,
        height: size,

        speed,
        direction,

        vx:
            aimX *
            speed,

        vy:
            aimY *
            speed,

        damage: 2,

        bounces: 0,

        maxBounces:
            getPlayerBoomerangMaxBounces(
                2
            ),

        rotation: 0,

        hitEnemies:
            new Set(),

        hitBoss:
            false
    });

    playerBoomerangs--;

    return true;
}
function updateBullets(deltaTime = 1) {
    for (let index = bullets.length - 1; index >= 0; index--) {
        const bullet = bullets[index];

        if (bullet.type !== "boomerang") {
            const direction =
                PROJECTILE_DIRECTIONS[bullet.direction];

            if (direction) {
                bullet.x +=
                    direction.x *
                    bullet.speed *
                    deltaTime;

                bullet.y +=
                    direction.y *
                    bullet.speed *
                    deltaTime;
            }

            if (isOutsideCanvas(bullet, 20)) {
                bullets.splice(index, 1);
            }

            continue;
        }

        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;
        bullet.rotation += 0.24 * deltaTime;

        const minX = 20;
        const minY = 20;

        const maxX =
            canvas.width - 20 - bullet.width;

        const maxY =
            canvas.height - 20 - bullet.height;

        const hitHorizontalWall =
            bullet.x <= minX ||
            bullet.x >= maxX;

        const hitVerticalWall =
            bullet.y <= minY ||
            bullet.y >= maxY;

        if (!hitHorizontalWall && !hitVerticalWall) {
            continue;
        }

        if (bullet.bounces >= bullet.maxBounces) {
            bullets.splice(index, 1);
            continue;
        }

        bullet.bounces++;

        if (hitHorizontalWall) {
            bullet.x = Math.max(
                minX,
                Math.min(maxX, bullet.x)
            );

            bullet.vx *= -1;

            bullet.direction =
                bullet.vx > 0
                    ? "ArrowRight"
                    : "ArrowLeft";
        }

        if (hitVerticalWall) {
            bullet.y = Math.max(
                minY,
                Math.min(maxY, bullet.y)
            );

            bullet.vy *= -1;

            bullet.direction =
                bullet.vy > 0
                    ? "ArrowDown"
                    : "ArrowUp";
        }

        bullet.hitEnemies.clear();
        bullet.hitBoss = false;
    }
}

function drawBullets() {
    bullets.forEach((bullet) => {
        if (bullet.type === "boomerang") {
            ctx.save();

            ctx.translate(
                bullet.x + bullet.width / 2,
                bullet.y + bullet.height / 2
            );

            ctx.rotate(bullet.rotation);

            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText("🪃", 0, 0);

            ctx.restore();

            return;
        }

        ctx.fillStyle = "cyan";

        ctx.fillRect(
            bullet.x,
            bullet.y,
            bullet.width,
            bullet.height
        );
    });
}

function shootEnemyProjectile(
    enemy,
    type = "syringe",
    angleOffset = 0
) {
    const centerX =
        enemy.x + enemy.width / 2;

    const centerY =
        enemy.y + enemy.height / 2;

    const dx =
        player.x +
        player.width / 2 -
        centerX;

    const dy =
        player.y +
        player.height / 2 -
        centerY;

    if (Math.hypot(dx, dy) === 0) {
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
        type,

        x: centerX - 5,
        y: centerY - 5,

        width:
            type === "scalpel"
                ? 12
                : 10,

        height:
            type === "scalpel"
                ? 6
                : 10,

        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed
    });
}

function updateEnemyProjectiles(deltaTime) {
    updateLinearProjectiles(
        enemyProjectiles,
        deltaTime,
        20
    );
}

function checkEnemyProjectileCollisions() {
    checkProjectilePlayerCollisions(
        enemyProjectiles
    );
}

function drawEnemyProjectiles() {
    drawRectProjectiles(
        enemyProjectiles
    );
}

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
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;

    } else {
        const dx = targetX - centerX;
        const dy = targetY - centerY;

        const distance =
            Math.hypot(dx, dy) || 1;

        vx = dx / distance * speed;
        vy = dy / distance * speed;
    }

    bossProjectiles.push({
        x: centerX - 6,
        y: centerY - 6,

        width: 12,
        height: 12,

        vx,
        vy
    });
}

function updateBossProjectiles(deltaTime) {
    updateLinearProjectiles(
        bossProjectiles,
        deltaTime,
        30
    );
}

function checkBossProjectileCollisions() {
    checkProjectilePlayerCollisions(
        bossProjectiles
    );
}

function drawBossProjectiles() {
    drawRectProjectiles(
        bossProjectiles
    );
}
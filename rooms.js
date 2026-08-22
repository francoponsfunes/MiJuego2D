// ============================================================================
// ROOMS.JS
// Habitaciones, puertas, cambios de sala y minimapa
// ============================================================================


// ============================================================================
// ESTADO DE HABITACIONES
// ============================================================================

let currentRoom = 1;
let changingRoom = false;


// ============================================================================
// CONFIGURACIÓN DE HABITACIONES
// ============================================================================

const rooms = {

    1: {
        enemyCount: 0,
        color: "#222",
        up: 2,
        down: null,
        left: 3,
        right: 4,
        cleared: false,
        visited: true
    },

    2: {
        enemyCount: 3,
        color: "#242424",
        up: null,
        down: 1,
        left: null,
        right: null,
        cleared: false,
        visited: false
    },

    3: {
        enemyCount: 4,
        color: "#262626",
        up: null,
        down: null,
        left: null,
        right: 1,
        cleared: false,
        visited: false
    },

    4: {
        enemyCount: 4,
        color: "#282828",
        up: null,
        down: 5,
        left: 1,
        right: null,
        cleared: false,
        visited: false
    },

    5: {
        enemyCount: 0,
        color: "#301515",
        up: 4,
        down: null,
        left: null,
        right: null,
        cleared: false,
        visited: false
    }
};


// ============================================================================
// PUERTAS
// ============================================================================

const doors = {
    top: false,
    bottom: false,
    left: false,
    right: false
};


function updateDoors() {

    const roomClear = rooms[currentRoom].cleared;

    doors.top =
        roomClear &&
        rooms[currentRoom].up !== null;

    doors.bottom =
        roomClear &&
        rooms[currentRoom].down !== null;

    doors.left =
        roomClear &&
        rooms[currentRoom].left !== null;

    doors.right =
        roomClear &&
        rooms[currentRoom].right !== null;

    // Puerta especial hacia CUA CUA
    if (
        currentRoom === 4 &&
        rooms[currentRoom].down === 5
    ) {

        doors.bottom =
            roomClear &&
            (
                playerKeys >= 3 ||
                bossDoorUnlocked
            );
    }
    // La Sala 5 permanece cerrada mientras Cua Cua siga activo.
if (
    currentRoom === 5 &&
    boss.active &&
    !boss.defeated
) {

    doors.top = false;
    doors.bottom = false;
    doors.left = false;
    doors.right = false;
}
}


// ============================================================================
// DIBUJAR HABITACIÓN
// ============================================================================

function drawRoom() {

    // Fondo
    ctx.fillStyle = rooms[currentRoom].color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Paredes
    ctx.fillStyle = "#111";

    ctx.fillRect(0, 0, canvas.width, 20);
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    ctx.fillRect(0, 0, 20, canvas.height);
    ctx.fillRect(canvas.width - 20, 0, 20, canvas.height);

    // Puertas
    ctx.fillStyle = doors.top ? "#777" : "#333";
    ctx.fillRect(canvas.width / 2 - 45, 0, 90, 20);

    ctx.fillStyle = doors.bottom ? "#777" : "#333";
    ctx.fillRect(
        canvas.width / 2 - 45,
        canvas.height - 20,
        90,
        20
    );

    ctx.fillStyle = doors.left ? "#777" : "#333";
    ctx.fillRect(
        0,
        canvas.height / 2 - 45,
        20,
        90
    );

    ctx.fillStyle = doors.right ? "#777" : "#333";
    ctx.fillRect(
        canvas.width - 20,
        canvas.height / 2 - 45,
        20,
        90
    );
}


// ============================================================================
// CAMBIAR DE HABITACIÓN
// ============================================================================

function changeRoom(newRoom) {

    if (!rooms[newRoom] || changingRoom) {
        return;
    }

    changingRoom = true;

    currentRoom = newRoom;

    enemies.length = 0;
    bullets.length = 0;
    enemyProjectiles.length = 0;
    bossProjectiles.length = 0;

    boss.touchingPlayer = false;

    player.x =
        canvas.width / 2 -
        player.width / 2;

    player.y =
        canvas.height / 2 -
        player.height / 2;

    rooms[currentRoom].visited = true;


    // ========================================================================
    // SALAS NORMALES
    // ========================================================================

    if (currentRoom < 5) {

        boss.active = false;
        boss.defeated = false;
        boss.touchingPlayer = false;
        boss.health = boss.maxHealth;

        if (!rooms[currentRoom].cleared) {

            spawnEnemies(
                rooms[currentRoom].enemyCount
            );
        }
    }


    // ========================================================================
    // SALA 5 - CUA CUA
    // ========================================================================

    else {

        if (!rooms[5].cleared) {

            boss.active = true;
            boss.defeated = false;

            boss.health = boss.maxHealth;

            boss.x =
                canvas.width / 2 -
                boss.width / 2;

            boss.y = 100;

            // Reiniciar fases
            boss.phase = 1;

            boss.spawned75 = false;
            boss.spawned50 = false;
            boss.spawned25 = false;
            boss.assistantCommandTimer = 90;
boss.assistantTurn = 0;
boss.anesthesiaImmunityUntil = 0;
boss.attackSequence = 0;

// Ataque inicial más temprano.
boss.attackTimer = 55;
boss.dashTimer = 190;
boss.dashDuration = 0;

            // Reiniciar ataques
            boss.attackTimer = 120;
            boss.dashTimer = 300;
            boss.dashDuration = 0;

            boss.enraged = false;
            boss.touchingPlayer = false;

            bossProjectiles.length = 0;

        } else {

            boss.active = false;
            boss.defeated = true;
            boss.touchingPlayer = false;
        }
    }

    changingRoom = false;
}


// ============================================================================
// DETECTAR CAMBIO DE HABITACIÓN
// ============================================================================

function checkRoomChange() {

    if (changingRoom) {
        return;
    }

    // Nunca se puede abandonar la batalla activa contra Cua Cua.
    if (
        currentRoom === 5 &&
        boss.active &&
        !boss.defeated
    ) {
        return;
    }

    const room = rooms[currentRoom];

    // La sala debe estar completada
    if (!room.cleared) {
        return;
    }

    const doorWidth = 90;
    const doorHeight = 90;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;


    // ========================================================================
    // PUERTA DERECHA
    // ========================================================================

    const atRightEdge =
        player.x + player.width >= canvas.width - 20;

    const insideRightDoor =
        player.y + player.height / 2 >= centerY - doorHeight / 2 &&
        player.y + player.height / 2 <= centerY + doorHeight / 2;

    if (
        atRightEdge &&
        insideRightDoor &&
        room.right !== null
    ) {

        changeRoom(room.right);

        player.x = 25;

        return;
    }


    // ========================================================================
    // PUERTA IZQUIERDA
    // ========================================================================

    const atLeftEdge =
        player.x <= 20;

    const insideLeftDoor =
        player.y + player.height / 2 >= centerY - doorHeight / 2 &&
        player.y + player.height / 2 <= centerY + doorHeight / 2;

    if (
        atLeftEdge &&
        insideLeftDoor &&
        room.left !== null
    ) {

        changeRoom(room.left);

        player.x =
            canvas.width - player.width - 25;

        return;
    }


    // ========================================================================
    // PUERTA ARRIBA
    // ========================================================================

    const atTopEdge =
        player.y <= 20;

    const insideTopDoor =
        player.x + player.width / 2 >= centerX - doorWidth / 2 &&
        player.x + player.width / 2 <= centerX + doorWidth / 2;

    if (
        atTopEdge &&
        insideTopDoor &&
        room.up !== null
    ) {

        changeRoom(room.up);

        player.y =
            canvas.height - player.height - 25;

        return;
    }


    // ========================================================================
    // PUERTA ABAJO
    // ========================================================================

    if (
        player.y + player.height >= canvas.height - 20 &&
        player.x + player.width / 2 >= canvas.width / 2 - 50 &&
        player.x + player.width / 2 <= canvas.width / 2 + 50 &&
        rooms[currentRoom].down !== null
    ) {

        const nextRoom = rooms[currentRoom].down;

        // Puerta especial de Sala 4 hacia CUA CUA
        if (
            currentRoom === 4 &&
            nextRoom === 5
        ) {

            if (
                playerKeys < 3 &&
                !bossDoorUnlocked
            ) {
                return;
            }

            bossDoorUnlocked = true;
        }

        changeRoom(nextRoom);

        player.y = 25;

        return;
    }
}


// ============================================================================
// INFORMACIÓN DE LA HABITACIÓN
// ============================================================================

function drawRoomInfo() {

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";

    ctx.fillText(
        "SALA: " + currentRoom,
        canvas.width - 110,
        30
    );
}


// ============================================================================
// MINIMAPA
// ============================================================================

function drawMinimap() {

    const mapX = canvas.width - 155;
    const mapY = 18;

    const roomSize = 24;
    const gap = 10;

    const positions = {
        1: { x: 1, y: 1 },
        2: { x: 1, y: 0 },
        3: { x: 0, y: 1 },
        4: { x: 2, y: 1 },
        5: { x: 2, y: 2 }
    };

    // Panel translúcido
    ctx.fillStyle = "rgba(0, 0, 0, 0.30)";

    ctx.fillRect(
        mapX - 10,
        mapY - 8,
        110,
        105
    );


    // ========================================================================
    // CONEXIONES
    // ========================================================================

    for (const roomNumber in rooms) {

        const room = rooms[roomNumber];

        if (!room.visited) {
            continue;
        }

        const pos = positions[roomNumber];

        const centerX =
            mapX +
            pos.x * (roomSize + gap) +
            roomSize / 2;

        const centerY =
            mapY +
            pos.y * (roomSize + gap) +
            roomSize / 2;

        const connections = [
            room.up,
            room.down,
            room.left,
            room.right
        ];

        connections.forEach((connectedRoom) => {

            if (connectedRoom === null) {
                return;
            }

            if (!rooms[connectedRoom].visited) {
                return;
            }

            const targetPos = positions[connectedRoom];

            const targetX =
                mapX +
                targetPos.x * (roomSize + gap) +
                roomSize / 2;

            const targetY =
                mapY +
                targetPos.y * (roomSize + gap) +
                roomSize / 2;

            ctx.strokeStyle = "rgba(170, 170, 170, 0.55)";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(targetX, targetY);
            ctx.stroke();
        });
    }


    // ========================================================================
    // HABITACIONES DEL MINIMAPA
    // ========================================================================

    for (const roomNumber in rooms) {

        const room = rooms[roomNumber];
        const pos = positions[roomNumber];

        const x =
            mapX +
            pos.x * (roomSize + gap);

        const y =
            mapY +
            pos.y * (roomSize + gap);

        const isCurrent =
            Number(roomNumber) === currentRoom;


        // Sala no descubierta
        if (!room.visited) {

            ctx.fillStyle = "rgba(10, 10, 10, 0.65)";

            ctx.fillRect(
                x,
                y,
                roomSize,
                roomSize
            );

            ctx.strokeStyle = "rgba(70, 70, 70, 0.45)";
            ctx.lineWidth = 1;

            ctx.strokeRect(
                x,
                y,
                roomSize,
                roomSize
            );

            ctx.fillStyle = "rgba(90, 90, 90, 0.55)";
            ctx.font = "bold 15px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(
                "?",
                x + roomSize / 2,
                y + roomSize / 2
            );

            continue;
        }


        // ====================================================================
        // SALA 5 - BOSS
        // ====================================================================

        if (Number(roomNumber) === 5) {

            ctx.fillStyle = "rgba(55, 15, 15, 0.85)";

            ctx.fillRect(
                x,
                y,
                roomSize,
                roomSize
            );

            ctx.strokeStyle = "rgba(150, 70, 70, 0.75)";
            ctx.lineWidth = 1;

            ctx.strokeRect(
                x,
                y,
                roomSize,
                roomSize
            );

            // Diablito
            const devilX = x + roomSize / 2;
            const devilY = y + roomSize / 2;

            ctx.fillStyle = "rgba(210, 45, 45, 0.95)";


            // Cabeza
            ctx.beginPath();

            ctx.arc(
                devilX,
                devilY + 2,
                7,
                0,
                Math.PI * 2
            );

            ctx.fill();


            // Cuerno izquierdo
            ctx.beginPath();

            ctx.moveTo(
                devilX - 5,
                devilY - 4
            );

            ctx.lineTo(
                devilX - 9,
                devilY - 10
            );

            ctx.lineTo(
                devilX - 1,
                devilY - 6
            );

            ctx.closePath();
            ctx.fill();


            // Cuerno derecho
            ctx.beginPath();

            ctx.moveTo(
                devilX + 5,
                devilY - 4
            );

            ctx.lineTo(
                devilX + 9,
                devilY - 10
            );

            ctx.lineTo(
                devilX + 1,
                devilY - 6
            );

            ctx.closePath();
            ctx.fill();


            // Ojos
            ctx.fillStyle = "rgba(0, 0, 0, 0.9)";

            ctx.fillRect(
                devilX - 4,
                devilY,
                2,
                2
            );

            ctx.fillRect(
                devilX + 2,
                devilY,
                2,
                2
            );

            continue;
        }


        // ====================================================================
        // SALAS NORMALES
        // ====================================================================

        if (isCurrent) {

            ctx.fillStyle = "rgba(245, 245, 245, 0.95)";

        } else if (room.cleared) {

            ctx.fillStyle = "rgba(130, 130, 130, 0.70)";

        } else {

            ctx.fillStyle = "rgba(75, 75, 75, 0.80)";
        }

        ctx.fillRect(
            x,
            y,
            roomSize,
            roomSize
        );

        ctx.strokeStyle = "rgba(220, 220, 220, 0.45)";
        ctx.lineWidth = 1;

        ctx.strokeRect(
            x,
            y,
            roomSize,
            roomSize
        );
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}
// ============================================================================
// COMPROBAR SI LA SALA ESTÁ COMPLETADA
// ============================================================================

function checkRoomClear() {

    console.log(
        "CHECK ROOM:",
        "sala =", currentRoom,
        "enemigos =", enemies.length,
        "cleared =", rooms[currentRoom].cleared
    );

    if (
        currentRoom < 5 &&
        enemies.length === 0 &&
        !rooms[currentRoom].cleared
    ) {

        rooms[currentRoom].cleared = true;

        console.log(
            ">>> SALA COMPLETADA <<<",
            currentRoom
        );
    }
}
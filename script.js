const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const TaskType = 'normal'; // Change to 'rotation' or 'mirror' as needed
const Rotd = 0; // Change rotation degree as needed

const TargetX = [0, 0]; // Target X positions
const TargetY = [0, 0.8]; // Target Y positions
const TargetRadius = 0.05; // Target radius as a fraction of the canvas size
const CursorSize = 10;

let cursor = { x: 0, y: 0 };
let currentTargetIndex = 0;
let currentTarget = { x: TargetX[currentTargetIndex], y: TargetY[currentTargetIndex] };
let isTrialOn = true;
let clickCount = 0;
const maxClicks = 20;
let cursorPath = []; // Array to store cursor positions
let tracking = false;

canvas.addEventListener('mousemove', moveCursor);
canvas.addEventListener('click', handleClick);

function moveCursor(event) {
    const rect = canvas.getBoundingClientRect();
    const hx = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const hy = ((event.clientY - rect.top) / canvas.height) * -2 + 1;

    let vx, vy;
    switch (TaskType) {
        case 'normal':
            vx = hx;
            vy = hy;
            break;
        case 'mirror':
            vx = -hx;
            vy = hy;
            break;
        case 'rotation':
            vx = hx * Math.cos(Rotd * Math.PI / 180) - hy * Math.sin(Rotd * Math.PI / 180);
            vy = hx * Math.sin(Rotd * Math.PI / 180) + hy * Math.cos(Rotd * Math.PI / 180);
            break;
    }

    cursor = { x: vx, y: vy };

    if (tracking) {
        cursorPath.push({ x: vx, y: vy }); // Store cursor position
    }

    draw();
}

function handleClick(event) {
    if (clickCount < maxClicks) {
        const rect = canvas.getBoundingClientRect();
        const hx = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
        const hy = ((event.clientY - rect.top) / canvas.height) * -2 + 1;

        // Check if the click is within the current target
        const distance = Math.sqrt((hx - currentTarget.x) ** 2 + (hy - currentTarget.y) ** 2);
        if (distance < TargetRadius) {
            clickCount++;
            currentTargetIndex = (currentTargetIndex + 1) % TargetX.length;
            currentTarget = { x: TargetX[currentTargetIndex], y: TargetY[currentTargetIndex] };
        }

        if (clickCount === 1) {
            tracking = true;
        } else if (clickCount >= maxClicks) {
            tracking = false;
        }
    }
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(canvas.width / 2, -canvas.height / 2);

    // Draw target
    ctx.beginPath();
    ctx.arc(currentTarget.x, currentTarget.y, TargetRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'blue';
    ctx.fill();

    // Draw cursor path if max clicks reached
    if (clickCount >= maxClicks) {
        // Draw final target
        ctx.beginPath();
        ctx.arc(TargetX[1], TargetY[1], TargetRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
        
        ctx.beginPath();
        for (let i = 0; i < cursorPath.length; i++) {
            const x = cursorPath[i].x;
            const y = cursorPath[i].y;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 0.01;
        ctx.stroke();
    }

    // Draw cursor
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, CursorSize / canvas.width, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();

    ctx.restore();
}

// Initial draw
draw();
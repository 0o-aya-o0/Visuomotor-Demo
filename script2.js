const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const TargetX = [0, 0]; // Target X positions
const TargetY = [0, 0.8]; // Target Y positions
const TargetRadius = 0.05; // Target radius as a fraction of the canvas size
const CursorSize = 10;
const rotationAngle = -30 * (Math.PI / 180); // 30 degrees counterclockwise in radians

let cursor = { x: 0, y: 0 };
let currentTargetIndex = 0;
let currentTarget = { x: TargetX[currentTargetIndex], y: TargetY[currentTargetIndex] };
let clickCount = 0;
const maxClicks = 20;
let trialCount = 0;
const maxTrials = 10;
let cursorPaths = []; // Array to store cursor paths
let cursorPath = []; // Array to store current cursor path
let tracking = false;
let showUpperTarget = false;
let cursorVisible = false;

canvas.addEventListener('mousemove', moveCursor);
canvas.addEventListener('click', handleClick);

// Add these event listeners for cursor visibility
canvas.addEventListener('mouseenter', () => {
    cursorVisible = true;
    canvas.style.cursor = 'none';
    draw();
});
canvas.addEventListener('mouseleave', () => {
    cursorVisible = false;
    canvas.style.cursor = 'default';
    draw();
});

function moveCursor(event) {
    const rect = canvas.getBoundingClientRect();
    const hx = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const hy = ((event.clientY - rect.top) / canvas.height) * -2 + 1;

    // Rotate the cursor position
    const rotatedCursor = rotatePoint(hx, hy, rotationAngle);

    cursor = { x: rotatedCursor.x, y: rotatedCursor.y };

    if (tracking) {
        cursorPath.push({ x: rotatedCursor.x, y: rotatedCursor.y }); // Store cursor position
    }

    draw();
}

function handleClick(event) {
    if (trialCount < maxTrials) {
        const rect = canvas.getBoundingClientRect();
        const hx = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
        const hy = ((event.clientY - rect.top) / canvas.height) * -2 + 1;

        // Rotate the click position
        const rotatedClick = rotatePoint(hx, hy, rotationAngle);

        // Check if the click is within the current target
        const distance = Math.sqrt((rotatedClick.x - currentTarget.x) ** 2 + (rotatedClick.y - currentTarget.y) ** 2);
        if (distance < TargetRadius) {
            clickCount++;
            currentTargetIndex = (currentTargetIndex + 1) % TargetX.length;
            currentTarget = { x: TargetX[currentTargetIndex], y: TargetY[currentTargetIndex] };

            // Save cursor path and clear current path
            cursorPaths.push([...cursorPath]);
            cursorPath = [];
            
            // Toggle showUpperTarget
            showUpperTarget = !showUpperTarget;

            // Increment trial count
            if (clickCount % 2 === 0) {
                trialCount++;
            }
        }

        if (clickCount === 1) {
            tracking = true;
        } else if (trialCount >= maxTrials) {
            tracking = false;
        }
    }
    draw();
}

function rotatePoint(x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: x * cos - y * sin,
        y: x * sin + y * cos
    };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(canvas.width / 2, -canvas.height / 2);

    // Draw cursor paths if max trials reached
    if (trialCount >= maxTrials) {
        // Draw final target
        ctx.beginPath();
        ctx.arc(TargetX[showUpperTarget ? 1 : 0], TargetY[showUpperTarget ? 1 : 0], TargetRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill();

        // Draw second target
        ctx.beginPath();
        ctx.arc(TargetX[showUpperTarget ? 0 : 1], TargetY[showUpperTarget ? 0 : 1], TargetRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill();

        for (let i = 1; i < cursorPaths.length; i += 2) { // Start from index 1 to get even clicks
            const path = cursorPaths[i];

            // Draw path
            ctx.beginPath();
            for (let j = 0; j < path.length; j++) {
                const x = path[j].x;
                const y = path[j].y;
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 0.005;
            ctx.stroke();
        }
    }

    if (trialCount < maxTrials) {
        // Draw target
        ctx.beginPath();
        ctx.arc(currentTarget.x, currentTarget.y, TargetRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill();
    }

    // Draw cursor if visible
    if (cursorVisible) {
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, CursorSize / canvas.width, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
    }

    ctx.restore();
}

// Initial draw
draw();

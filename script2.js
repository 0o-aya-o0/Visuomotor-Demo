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
let trialCount = 0;
const maxTrials = 30; // Total trials: 10 no rotation, 10 with 30 degree rotation, 10 no rotation
let cursorPaths = []; // Array to store cursor paths
let cursorPath = []; // Array to store current cursor path
let tracking = false;
let showGoalTarget = false;
let cursorVisible = false;
let baseCursor = { x: 0, y: 0 }; // To store the base cursor position for rotation trials
let pathsDrawn = false; // To check if paths are drawn

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

    cursor = { x: hx, y: hy };

    if (tracking) {
        cursorPath.push({ x: hx, y: hy }); // Store cursor position
    }

    draw();
}

function handleClick(event) {
    if (trialCount < maxTrials) {
        const rect = canvas.getBoundingClientRect();
        const hx = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
        const hy = ((event.clientY - rect.top) / canvas.height) * -2 + 1;

        let adjustedClick = { x: hx, y: hy };
        if (trialCount >= 11 && trialCount < 21) { // Apply rotation for trials 11-20
            adjustedClick = rotatePoint(hx - baseCursor.x, hy - baseCursor.y, rotationAngle);
            adjustedClick.x += baseCursor.x;
            adjustedClick.y += baseCursor.y;
        }

        // Check if the click is within the current target
        const distance = Math.sqrt((adjustedClick.x - currentTarget.x) ** 2 + (adjustedClick.y - currentTarget.y) ** 2);
        if (distance < TargetRadius) {
            clickCount++;
            currentTargetIndex = (currentTargetIndex + 1) % TargetX.length;
            currentTarget = { x: TargetX[currentTargetIndex], y: TargetY[currentTargetIndex] };

            // Save cursor path and clear current path
            if (clickCount % 2 === 0) {
                cursorPaths.push({ path: [...cursorPath], trial: trialCount });
                cursorPath = [];
                if (trialCount === 9 || trialCount === 19) {
                    cursor = { ...cursorPaths[cursorPaths.length - 1].path.slice(-1)[0] }; // Update cursor position to the end of the path
                }
            } else {
                cursorPath = []; // Clear path on the upward movement
            }

            // Toggle showGoalTarget
            showGoalTarget = !showGoalTarget;

            // Increment trial count
            if (clickCount % 2 === 0) {
                trialCount++;
                if (trialCount === 10 || trialCount === 20) {
                    baseCursor = { ...cursor }; // Update base cursor position for rotation trials
                }
            }
        }

        if (clickCount === 1) {
            tracking = true;
        }
    }
    if (trialCount >= maxTrials && !pathsDrawn) {
        pathsDrawn = true;
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

    if (trialCount < maxTrials || pathsDrawn) {
        // Draw the current target if not all trials are complete
        if (trialCount < maxTrials) {
            ctx.beginPath();
            ctx.arc(currentTarget.x, currentTarget.y, TargetRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'green';
            ctx.fill();
        } else {
            // Draw both targets after all trials
            for (let i = 0; i < TargetX.length; i++) {
                ctx.beginPath();
                ctx.arc(TargetX[i], TargetY[i], TargetRadius, 0, 2 * Math.PI);
                ctx.fillStyle = 'green';
                ctx.fill();
            }
        }
    }

    // Draw cursor if visible
    if (cursorVisible && trialCount < maxTrials) {
        let displayCursor = cursor;
        if (trialCount >= 11 && trialCount < 21) { // Apply rotation for trials 11-20
            displayCursor = rotatePoint(cursor.x - baseCursor.x, cursor.y - baseCursor.y, rotationAngle);
            displayCursor.x += baseCursor.x;
            displayCursor.y += baseCursor.y;
        }
        ctx.beginPath();
        ctx.arc(displayCursor.x, displayCursor.y, CursorSize / canvas.width, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
    }

    ctx.restore();

    // Draw the title with current trial count
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`visuomotor adaptation (${trialCount}/${maxTrials} trials)`, canvas.width / 2, 30);

    // Draw paths if all trials are complete
    if (pathsDrawn) {
        drawPaths();
        drawFinalCursorAndTitle();
    }
}

function drawPaths() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(canvas.width / 2, -canvas.height / 2);

    // Draw all paths
    for (let i = 0; i < cursorPaths.length; i++) {
        let path = cursorPaths[i].path;
        if (cursorPaths[i].trial >= 11 && cursorPaths[i].trial < 21) { // Apply rotation for trials 11-20
            path = path.map(point => {
                const rotatedPoint = rotatePoint(point.x - baseCursor.x, point.y - baseCursor.y, rotationAngle);
                return {
                    x: rotatedPoint.x + baseCursor.x,
                    y: rotatedPoint.y + baseCursor.y
                };
            });
        }
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

    ctx.restore();
}

function drawFinalCursorAndTitle() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(canvas.width / 2, -canvas.height / 2);

    // Draw the final cursor
    let displayCursor = cursor;
    if (trialCount >= 11 && trialCount < 21) { // Apply rotation for trials 11-20
        displayCursor = rotatePoint(cursor.x - baseCursor.x, cursor.y - baseCursor.y, rotationAngle);
        displayCursor.x += baseCursor.x;
        displayCursor.y += baseCursor.y;
    }
    ctx.beginPath();
    ctx.arc(displayCursor.x, displayCursor.y, CursorSize / canvas.width, 0, 2 * Math.PI);
    ctx.fillStyle = 'blue';
    ctx.fill();

    // Draw both targets
    for (let i = 0; i < TargetX.length; i++) {
        ctx.beginPath();
        ctx.arc(TargetX[i], TargetY[i], TargetRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill();
    }

    ctx.restore();

    // Draw the final title
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`visuomotor adaptation (${trialCount}/${maxTrials} trials)`, canvas.width / 2, 30);
}

// Initial draw
draw();


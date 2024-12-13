const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const graphCanvas = document.getElementById('graph');

const TargetX = [0, 0]; // Target X positions
const TargetY = [0, 0.8]; // Target Y positions
const TargetRadius = 0.05; // Visual target radius
const LogicalTargetRadius = 0.2; // Logical target radius for click detection
const CursorSize = 10;
const rotationAngle = -30 * (Math.PI / 180); // 30 degrees counterclockwise in radians

let cursor = { x: 0, y: 0 };
let currentTargetIndex = 0;
let currentTarget = { x: TargetX[currentTargetIndex], y: TargetY[currentTargetIndex] };
let clickCount = 0;
let trialCount = 0;
const maxTrials = 30; // Total trials
let cursorPaths = []; // Array to store cursor paths
let cursorPath = []; // Array to store current cursor path
let tracking = false;

canvas.addEventListener('mousemove', moveCursor);
canvas.addEventListener('click', handleClick);

function moveCursor(event) {
    const rect = canvas.getBoundingClientRect();
    const hx = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const hy = ((event.clientY - rect.top) / canvas.height) * -2 + 1;

    cursor = { x: hx, y: hy };

    if (tracking) {
        cursorPath.push({ x: hx, y: hy });
    }

    draw();
}

function handleClick() {
    if (trialCount < maxTrials) {
        // Calculate displacement and record max X displacement for the trial
        const xDisplacements = cursorPath.map(point => Math.abs(point.x - currentTarget.x));
        const maxXDisplacement = Math.max(...xDisplacements);

        // Record data for the trial
        cursorPaths.push({ trial: trialCount + 1, maxXDisplacement });
        cursorPath = [];
        trialCount++;
    }

    if (trialCount >= maxTrials) {
        plotGraph();
    }

    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(canvas.width / 2, -canvas.height / 2);

    // Draw current target
    ctx.beginPath();
    ctx.arc(currentTarget.x, currentTarget.y, TargetRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'green';
    ctx.fill();

    // Draw cursor
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, CursorSize / canvas.width, 0, 2 * Math.PI);
    ctx.fillStyle = 'blue';
    ctx.fill();

    ctx.restore();
}

function plotGraph() {
    const trialNumbers = cursorPaths.map(entry => entry.trial);
    const maxDisplacements = cursorPaths.map(entry => entry.maxXDisplacement);

    new Chart(graphCanvas, {
        type: 'scatter',
        data: {
            labels: trialNumbers,
            datasets: [
                {
                    type: 'scatter',
                    label: '最大変位量',
                    data: trialNumbers.map((trial, index) => ({
                        x: trial,
                        y: maxDisplacements[index],
                    })),
                    borderColor: 'black',
                    backgroundColor: 'black',
                    showLine: false,
                },
                {
                    type: 'line',
                    label: 'トレンド',
                    data: trialNumbers.map((trial, index) => ({
                        x: trial,
                        y: maxDisplacements[index],
                    })),
                    borderColor: 'red',
                    borderWidth: 2,
                    tension: 0.4,
                },
            ],
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'トライアル数',
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'X座標の最大変位量',
                    },
                },
            },
        },
    });
}

draw();

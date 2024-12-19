const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

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
let cursorPaths = [];
let cursorPath = [];
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
        cursorPath.push({ x: hx, y: hy });
    }

    draw();
}

function handleClick(event) {
    if (trialCount < maxTrials) {
        const rect = canvas.getBoundingClientRect();
        const hx = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
        const hy = ((event.clientY - rect.top) / canvas.height) * -2 + 1;

        let adjustedClick = { x: hx, y: hy };
        if (trialCount >= 11 && trialCount < 21) {
            adjustedClick = rotatePoint(hx - baseCursor.x, hy - baseCursor.y, rotationAngle);
            adjustedClick.x += baseCursor.x;
            adjustedClick.y += baseCursor.y;
        }

        // Check if the click is within the logical target radius
        const distance = Math.sqrt((adjustedClick.x - currentTarget.x) ** 2 + (adjustedClick.y - currentTarget.y) ** 2);
        if (distance < LogicalTargetRadius) {
            clickCount++;
            currentTargetIndex = (currentTargetIndex + 1) % TargetX.length;
            currentTarget = { x: TargetX[currentTargetIndex], y: TargetY[currentTargetIndex] };

            if (clickCount % 2 === 0) {
                cursorPaths.push({ path: [...cursorPath], trial: trialCount });
                cursorPath = [];
            } else {
                cursorPath = [];
            }

            showGoalTarget = !showGoalTarget;

            if (clickCount % 2 === 0) {
                trialCount++;
                if (trialCount === 10 || trialCount === 20) {
                    baseCursor = { ...cursor };
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

    plotGraph(); // Update graph after every click
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
        if (trialCount < maxTrials) {
            ctx.beginPath();
            ctx.arc(currentTarget.x, currentTarget.y, TargetRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'green';
            ctx.fill();
        } else {
            for (let i = 0; i < TargetX.length; i++) {
                ctx.beginPath();
                ctx.arc(TargetX[i], TargetY[i], TargetRadius, 0, 2 * Math.PI);
                ctx.fillStyle = 'green';
                ctx.fill();
            }
        }
    }

    if (cursorVisible && trialCount < maxTrials) {
        let displayCursor = cursor;
        if (trialCount >= 11 && trialCount < 21) {
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

    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`visuomotor adaptation (${trialCount}/${maxTrials} trials)`, canvas.width / 2, 30);

    if (pathsDrawn) {
        drawPaths();
    }
}

function drawPaths() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(canvas.width / 2, -canvas.height / 2);

    for (let i = 0; i < cursorPaths.length; i++) {
        let path = cursorPaths[i].path;
        if (cursorPaths[i].trial >= 11 && cursorPaths[i].trial < 21) {
            path = path.map(point => {
                const rotatedPoint = rotatePoint(point.x - baseCursor.x, point.y - baseCursor.y, rotationAngle);
                return {
                    x: rotatedPoint.x + baseCursor.x,
                    y: rotatedPoint.y + baseCursor.y
                };
            });
        }
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

function plotGraph() {
    console.log('デバッグ: グラフ更新中...');

    const trialNumbers = cursorPaths.length > 0 ? cursorPaths.map((_, index) => index + 1) : [0];
    const maxDisplacements = cursorPaths.length > 0
        ? cursorPaths.map(entry => {
            const xDisplacements = entry.path.map(point => Math.abs(point.x - TargetX[entry.trial % TargetX.length]));
            return Math.max(...xDisplacements) * 100;
        })
        : [0]; // 初期状態でゼロ値を表示

    console.log('Trial Numbers:', trialNumbers);
    console.log('Max Displacements:', maxDisplacements);

    const graphCanvas = document.getElementById('graph');
    new Chart(graphCanvas, {
        type: 'line',
        data: {
            labels: trialNumbers,
            datasets: [
                {
                    label: 'Maximum X Displacement (cm)',
                    data: maxDisplacements,
                    borderColor: 'red',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Trial Number',
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Horizontal displacement (cm)',
                    },
                    min: -100,
                    max: 100,
                },
            },
        },
    });

    console.log('デバッグ: グラフ描画完了');
}

function initializeGraph() {
    console.log('デバッグテスト: 初期グラフを設定します');

    const graphCanvas = document.getElementById('graph');
    graphCanvas.width = 600; // 横幅を400pxに設定
    graphCanvas.height = 600; // 高さを400pxに設定

    // 仮データ
    const trialNumbers = Array.from({ length: 30 }, (_, i) => i + 1); // 1〜30の試行番号
    const maxDisplacements = [
        ...Array(10).fill(20),  // trial no. 1~10
        ...Array(10).fill(50),  // trial no. 11~20
        ...Array(10).fill(-30), // trial no. 21~30
    ]; // 仮データを設定

    // デバッグ用ログ
    console.log('maxDisplacements:', maxDisplacements);

    window.chart = new Chart(graphCanvas, {
        type: 'line',
        data: {
            labels: trialNumbers,
            datasets: [
                // データセット1: trial no.1~10 (黒丸、線なし)
                {
                    label: '',
                    data: maxDisplacements.map((value, index) => (index < 10 ? value : null)), // index < 10
                    borderColor: 'transparent', // 線を非表示にするために透明色を設定
                    backgroundColor: 'black',
                    borderWidth: 0, // 線の幅をゼロ
                    pointBorderColor: 'black',
                    pointBackgroundColor: 'black',
                    pointRadius: 5,
                    showLine: false, // 線を非表示
                },
                // データセット2: trial no.11~20 (白丸・黒縁、赤点線)
                {
                    label: '',
                    data: maxDisplacements.map((value, index) => (index >= 10 && index < 20 ? value : null)), // 10 <= index < 20
                    borderColor: 'red',
                    backgroundColor: 'white',
                    borderWidth: 2,
                    pointBorderColor: 'black',
                    pointBackgroundColor: 'white',
                    pointRadius: 5,
                    showLine: true, // 線を表示
                    borderDash: [2, 2], // 点線
                },
                // データセット3: trial no.21~30 (グレーの丸、赤点線)
                {
                    label: '',
                    data: maxDisplacements.map((value, index) => (index >= 20 ? value : null)), // index >= 20
                    borderColor: 'red',
                    backgroundColor: 'gray',
                    borderWidth: 2,
                    pointBorderColor: 'gray',
                    pointBackgroundColor: 'gray',
                    pointRadius: 5,
                    showLine: true, // 線を表示
                    borderDash: [2, 2], // 点線
                },
            ],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time ->', // X軸のタイトル
                    },
                    ticks: {
                        callback: function (value, index, ticks) {
                            if (value === 5) return 'Before'; // 試行番号 1-10の範囲を代表
                            if (value === 15) return 'Prisms'; // 試行番号 11-20の範囲を代表
                            if (value === 25) return 'After'; // 試行番号 21-30の範囲を代表
                            return ''; // 他の値は非表示
                        },
                        autoSkip: false,
                        maxRotation: 0,
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Horizontal displacement (cm)', // Y軸のタイトル
                    },
                    ticks: {
                        callback: function (value) {
                            if ([-100, -50, 0, 50, 100].includes(value)) return value; // 特定の目盛りだけ表示
                            return ''; // 他の値は非表示
                        },
                        stepSize: 50,
                    },
                    min: -100,
                    max: 100,
                },
            },
            plugins: {
                legend: {
                    display: false, // 凡例を非表示
                },
                customDashedLine: {
                    id: 'customDashedLine',
                    beforeDraw: (chart) => {
                        const { ctx, scales } = chart;
            
                        if (!scales.x || !scales.y) {
                            console.error('xAxis または yAxis が未定義です');
                            return;
                        }
            
                        const xAxis = scales.x;
                        const yAxis = scales.y;
            
                        // X軸の10.5と20.5の位置に対応する座標を計算
                        const x105 = xAxis.getPixelForValue(10.5); // 試行番号10.5の位置を取得
                        const x205 = xAxis.getPixelForValue(20.5); // 試行番号20.5の位置を取得
                        const yStart = yAxis.top; // Y軸の上端
                        const yEnd = yAxis.bottom; // Y軸の下端

                        console.log('x105:', x105, 'x205:', x205, 'yStart:', yStart, 'yEnd:', yEnd);
            
                        ctx.save();
                        ctx.setLineDash([5, 5]); // 点線を設定
                        ctx.strokeStyle = 'gray'; // 点線の色を指定
                        ctx.lineWidth = 1; // 点線の幅を指定
            
                        // 点線の描画 (X=10.5)
                        ctx.beginPath();
                        ctx.moveTo(x105, yStart);
                        ctx.lineTo(x105, yEnd);
                        ctx.stroke();
            
                        // 点線の描画 (X=20.5)
                        ctx.beginPath();
                        ctx.moveTo(x205, yStart);
                        ctx.lineTo(x205, yEnd);
                        ctx.stroke();
            
                        ctx.restore();
                    },
                },
            },
        },
    });
    

    console.log('初期グラフが設定されました');

}


// 初期化時にグラフを表示
initializeGraph();

// handleClick の修正版
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

        const distance = Math.sqrt((adjustedClick.x - currentTarget.x) ** 2 + (adjustedClick.y - currentTarget.y) ** 2);
        if (distance < LogicalTargetRadius) {
            clickCount++;
            currentTargetIndex = (currentTargetIndex + 1) % TargetX.length;
            currentTarget = { x: TargetX[currentTargetIndex], y: TargetY[currentTargetIndex] };

            if (clickCount % 2 === 0) {
                cursorPaths.push({ path: [...cursorPath], trial: trialCount });
                cursorPath = [];
                if (trialCount === 9 || trialCount === 19) {
                    cursor = { ...cursorPaths[cursorPaths.length - 1].path.slice(-1)[0] };
                }
            } else {
                cursorPath = [];
            }

            showGoalTarget = !showGoalTarget;

            if (clickCount % 2 === 0) {
                trialCount++;
                if (trialCount === 10 || trialCount === 20) {
                    baseCursor = { ...cursor };
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

    // グラフの更新
    updateGraph();
    draw();
}

// 初期状態で描画
draw();


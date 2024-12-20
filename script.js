const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const TargetX = [0, 0]; // Target X positions
const TargetY = [0, 0.8]; // Target Y positions
const TargetRadius = 0.05; // Visual target radius
const LogicalTargetRadius = 0.2; // Logical target radius for click detection
const CursorSize = 10;
const rotationAngle = -30 * (Math.PI / 180); // 30 degrees counterclockwise in radians

let cursor = { x: 0, y: 0 };
let currentTargetIndex = 0;
let currentTarget = {
  x: TargetX[currentTargetIndex],
  y: TargetY[currentTargetIndex],
};
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
let graphRendered = false; // Flag to ensure graph is only rendered once

canvas.addEventListener("mousemove", moveCursor);
canvas.addEventListener("click", handleClick);

// Add these event listeners for cursor visibility
canvas.addEventListener("mouseenter", () => {
  cursorVisible = true;
  canvas.style.cursor = "none";
  draw();
});
canvas.addEventListener("mouseleave", () => {
  cursorVisible = false;
  canvas.style.cursor = "default";
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
      adjustedClick = rotatePoint(
        hx - baseCursor.x,
        hy - baseCursor.y,
        rotationAngle
      );
      adjustedClick.x += baseCursor.x;
      adjustedClick.y += baseCursor.y;
    }

    // Check if the click is within the logical target radius
    const distance = Math.sqrt(
      (adjustedClick.x - currentTarget.x) ** 2 +
        (adjustedClick.y - currentTarget.y) ** 2
    );
    if (distance < LogicalTargetRadius) {
      clickCount++;
      currentTargetIndex = (currentTargetIndex + 1) % TargetX.length;
      currentTarget = {
        x: TargetX[currentTargetIndex],
        y: TargetY[currentTargetIndex],
      };

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
    drawGraph();
  }

  draw();
}

function rotatePoint(x, y, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
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
      ctx.fillStyle = "green";
      ctx.fill();
    } else {
      for (let i = 0; i < TargetX.length; i++) {
        ctx.beginPath();
        ctx.arc(TargetX[i], TargetY[i], TargetRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "green";
        ctx.fill();
      }
    }
  }

  if (cursorVisible && trialCount < maxTrials) {
    let displayCursor = cursor;
    if (trialCount >= 11 && trialCount < 21) {
      displayCursor = rotatePoint(
        cursor.x - baseCursor.x,
        cursor.y - baseCursor.y,
        rotationAngle
      );
      displayCursor.x += baseCursor.x;
      displayCursor.y += baseCursor.y;
    }
    ctx.beginPath();
    ctx.arc(
      displayCursor.x,
      displayCursor.y,
      CursorSize / canvas.width,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = "blue";
    ctx.fill();
  }

  ctx.restore();

  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.fillText(
    `visuomotor adaptation (${trialCount}/${maxTrials} trials)`,
    canvas.width / 2,
    30
  );

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
      path = path.map((point) => {
        const rotatedPoint = rotatePoint(
          point.x - baseCursor.x,
          point.y - baseCursor.y,
          rotationAngle
        );
        return {
          x: rotatedPoint.x + baseCursor.x,
          y: rotatedPoint.y + baseCursor.y,
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
    ctx.strokeStyle = "green";
    ctx.lineWidth = 0.005;
    ctx.stroke();
  }

  ctx.restore();
}

function drawGraph() {
  if (graphRendered) return;

  console.log("Drawing Graph");

  const trialNumbers = Array.from({ length: 30 }, (_, i) => i + 1);
  const maxDisplacements = cursorPaths.map((entry) => {
    const xDisplacements = entry.path.map((point) =>
      Math.abs(point.x - TargetX[entry.trial % TargetX.length])
    );
    return Math.max(...xDisplacements) * 100;
  });

  const graphCanvas = document.getElementById("graph");
  graphCanvas.style.display = "block";

  new Chart(graphCanvas, {
    type: "line",
    data: {
      labels: trialNumbers,
      datasets: [
        // Trial 1~10 (黒丸、線なし)
        {
          label: "",
          data: maxDisplacements.map((value, index) =>
            index < 10 ? value : null
          ),
          borderColor: "transparent",
          backgroundColor: "black",
          borderWidth: 0,
          pointBorderColor: "black",
          pointBackgroundColor: "black",
          pointRadius: 5,
          showLine: false,
        },
        // Trial 11~20 (白丸、赤点線)
        {
          label: "",
          data: maxDisplacements.map((value, index) =>
            index >= 10 && index < 20 ? value : null
          ),
          borderColor: "red",
          backgroundColor: "white",
          borderWidth: 2,
          pointBorderColor: "black",
          pointBackgroundColor: "white",
          pointRadius: 5,
          showLine: true,
          borderDash: [5, 5],
        },
        // Trial 21~30 (グレー丸、赤点線)
        {
          label: "",
          data: maxDisplacements.map((value, index) =>
            index >= 20 ? value : null
          ),
          borderColor: "red",
          backgroundColor: "gray",
          borderWidth: 2,
          pointBorderColor: "gray",
          pointBackgroundColor: "gray",
          pointRadius: 5,
          showLine: true,
          borderDash: [5, 5],
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
            text: "Time ->",
          },
          ticks: {
            callback: function (value) {
              if (value === 5) return "Before";
              if (value === 15) return "Prisms";
              if (value === 25) return "After";
              return "";
            },
            autoSkip: false,
            maxRotation: 0,
          },
        },
        y: {
          title: {
            display: true,
            text: "Horizontal displacement (cm)",
          },
          ticks: {
            callback: function (value) {
              if ([-100, -50, 0, 50, 100].includes(value)) return value;
              return "";
            },
            stepSize: 50,
          },
          min: -100,
          max: 100,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        customLabels: {
          id: "customLabels",
          beforeDraw: (chart) => {
            const { ctx, scales } = chart;

            if (!scales.x || !scales.y) return;

            const xAxis = scales.x;
            const yAxis = scales.y;

            // Left Label
            const leftLabelX = xAxis.left - 20;
            const leftLabelY = (yAxis.bottom + yAxis.top) / 2 + 70;
            ctx.save();
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            ctx.translate(leftLabelX, leftLabelY);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText("Left", 0, 0);
            ctx.restore();

            // Right Label
            const rightLabelX = xAxis.left - 20;
            const rightLabelY = (yAxis.bottom + yAxis.top) / 2 - 70;
            ctx.save();
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            ctx.translate(rightLabelX, rightLabelY);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText("Right", 0, 0);
            ctx.restore();
          },
        },
      },
    },
  });

  graphRendered = true;
}

draw();

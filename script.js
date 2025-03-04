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
let lastClickPosition = { x: 0, y: 0 }; // Store the last click position

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

  // Store the actual cursor position
  cursor = { x: hx, y: hy };

  if (tracking) {
    // For trials 11-20 with the top target, store the rotated cursor position
    if (trialCount >= 11 && trialCount < 21 && currentTargetIndex === 1) {
      // Apply rotation to the cursor position
      const rotatedCursor = rotatePoint(
        hx, 
        hy, 
        rotationAngle, 
        0, // Use (0, 0) as the pivot
        0
      );
      cursorPath.push(rotatedCursor);
    } else {
      cursorPath.push({ x: hx, y: hy });
    }
  }

  draw();
}

function handleClick(event) {
  if (trialCount < maxTrials) {
    const rect = canvas.getBoundingClientRect();
    const hx = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const hy = ((event.clientY - rect.top) / canvas.height) * -2 + 1;

    // Store the original click position
    const originalClick = { x: hx, y: hy };

    console.log(`----- CLICK EVENT -----`);
    console.log(`Trial: ${trialCount}, Target Index: ${currentTargetIndex}`);
    console.log(`Original Click: (${hx.toFixed(4)}, ${hy.toFixed(4)})`);
    console.log(`Current target at (${currentTarget.x.toFixed(4)}, ${currentTarget.y.toFixed(4)})`);
    
    // For trials 11-20 with the top target, apply rotation to the click position for hit detection
    let clickForHitDetection = { ...originalClick };
    if (trialCount >= 11 && trialCount < 21 && currentTargetIndex === 1) {
      // Apply rotation to the click position
      clickForHitDetection = rotatePoint(
        hx, 
        hy, 
        rotationAngle, 
        0, // Use (0, 0) as the pivot
        0
      );
      console.log(`Rotated Click: (${clickForHitDetection.x.toFixed(4)}, ${clickForHitDetection.y.toFixed(4)})`);
    }
    
    // Calculate the direct distance to the target
    const directDistance = Math.sqrt(
      (clickForHitDetection.x - currentTarget.x) ** 2 +
        (clickForHitDetection.y - currentTarget.y) ** 2
    );
    
    console.log(`Direct distance to target: ${directDistance.toFixed(4)}, Threshold: ${LogicalTargetRadius}`);

    // Use direct distance for all trials
    const isHit = directDistance < LogicalTargetRadius;
    console.log(`Using distance hit detection: ${isHit ? "HIT" : "MISS"}`);

    if (isHit) {
      console.log("Target hit!");
      clickCount++;

      // Toggle between targets
      currentTargetIndex = (currentTargetIndex + 1) % TargetX.length;
      currentTarget = {
        x: TargetX[currentTargetIndex],
        y: TargetY[currentTargetIndex],
      };

      console.log(`New target index: ${currentTargetIndex}, New target at (${currentTarget.x.toFixed(4)}, ${currentTarget.y.toFixed(4)})`);

      // Handle path recording
      if (clickCount % 2 === 0) {
        // Save the path when returning to the starting position
        // Store the previous target index (1 means it was moving to the top target)
        const previousTargetIndex = (currentTargetIndex + 1) % 2;
        cursorPaths.push({
          path: [...cursorPath],
          trial: trialCount,
          targetIndex: previousTargetIndex,
        });
        cursorPath = [];

        // Increment trial count after completing a round trip
        trialCount++;
        console.log(`Completed round trip, new trial: ${trialCount}`);
      } else {
        // Reset path when starting a new movement
        cursorPath = [];
      }

      showGoalTarget = !showGoalTarget;
    } else {
      console.log("Target missed!");
    }

    // Start tracking after the first successful click
    if (clickCount === 1) {
      tracking = true;
      console.log("Tracking started");
    }
  }

  // Draw the graph when all trials are complete
  if (trialCount >= maxTrials && !pathsDrawn) {
    pathsDrawn = true;
    drawGraph();
  }

  draw();
}

function rotatePoint(x, y, angle, pivotX = 0, pivotY = 0) {
  // Translate point to origin (relative to pivot)
  const translatedX = x - pivotX;
  const translatedY = y - pivotY;
  
  // Apply rotation
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;
  
  // Translate back
  const finalX = rotatedX + pivotX;
  const finalY = rotatedY + pivotY;
  
  return { x: finalX, y: finalY };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(canvas.width / 2, -canvas.height / 2);

  // Draw targets
  if (trialCount < maxTrials || pathsDrawn) {
    if (trialCount < maxTrials) {
      // Draw the target at its original position
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

  // Draw cursor
  if (cursorVisible && trialCount < maxTrials) {
    let displayCursor = { ...cursor };

    // Apply rotation for trials 11-20 with the top target
    if (trialCount >= 11 && trialCount < 21 && currentTargetIndex === 1) {
      // For trials 11-20, apply rotation to cursor
      displayCursor = rotatePoint(
        cursor.x, 
        cursor.y, 
        rotationAngle, 
        0, // Use (0, 0) as the pivot
        0
      );
    }

    // Draw the cursor
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

  // Draw title
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
    
    // Draw the path
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
    // Use the correct target index based on the trial
    const targetIndex = entry.trial % 2; // Alternate between the two targets
    // Calculate displacement with sign (positive = right, negative = left)
    const xDisplacements = entry.path.map(
      (point) => (point.x - TargetX[targetIndex]) * 100 // Convert to cm directly
    );
    // Find the displacement with the largest magnitude
    const maxMagnitude = Math.max(...xDisplacements.map(Math.abs));
    // Find the displacement with that magnitude (preserving sign)
    for (const disp of xDisplacements) {
      if (Math.abs(disp) === maxMagnitude) {
        return disp;
      }
    }
    return 0; // Fallback
  });

  const graphCanvas = document.getElementById("graph");
  graphCanvas.style.display = "block";

  // Register the custom plugin
  Chart.register({
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
  });

  new Chart(graphCanvas, {
    type: "line",
    data: {
      labels: trialNumbers,
      datasets: [
        // Trial 1~10 (黒丸、線なし)
        {
          label: "Before",
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
          label: "Prisms",
          data: maxDisplacements.map((value, index) =>
            index >= 11 && index < 21 ? value : null
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
          label: "After",
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
          display: true,
          position: "top",
        },
        customLabels: {
          id: "customLabels",
        },
      },
    },
  });

  graphRendered = true;
}

draw();

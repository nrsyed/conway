var canvas, ctx, cellWidth, cellHeight;
var grid, newGrid;
var rows, cols;
var colors = ['rgb(240, 240, 240)', 'rgb(10, 10, 10)'];

function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 800;
  rows = 5;
  cols = 5;

  cellWidth = canvas.width / cols;
  cellHeight = canvas.height / rows;

  grid = Array.from(Array(rows), () => Array(cols).fill(0));

  document.getElementById('canvas-width').innerHTML = canvas.width;
  document.getElementById('canvas-height').innerHTML = canvas.height;
}

function setCellColor(row, col, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function drawGrid() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      setCellColor(i, j, colors[grid[i][j]]);
    }
  }
}

init();
drawGrid();

var canvas, ctx, cellWidth, cellHeight;
var grid, newGrid;
var numRows, numCols;
var colors = ['rgb(240, 240, 240)', 'rgb(10, 10, 10)'];

function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 800;
  numRows = 5;
  numCols = 5;

  cellWidth = canvas.width / numCols;
  cellHeight = canvas.height / numRows;

  grid = Array.from(Array(numRows), () => Array(numCols).fill(0));
  grid[1][1] = 1;
  grid[2][2] = 1;

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
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      setCellColor(i, j, colors[grid[i][j]]);
    }
  }
}

function neighborSum(row, col) {
  let sum = -grid[row][col];
  for (let i of [-1, 0, 1]) {
    for (let j of [-1, 0, 1]) {
      if (row + i >= 0 && row + i < numRows && col + j >= 0 && col + j < numCols) {
        sum += grid[row + i][col + j];
      }
    }
  }
  return sum;
}

init();
drawGrid();

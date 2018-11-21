var game;
var canvas, ctx, cellWidth, cellHeight;
var colors = ['rgb(240, 240, 240)', 'rgb(10, 10, 10)'];
var rows, cols;

function setCellColor(row, col, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
}

function drawGrid() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      setCellColor(i, j, colors[game.grid[i][j]]);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function GameOfLife(numRows, numCols, survivalMin=2, survivalMax=3, birthVal=3) {
  this.numRows = numRows;
  this.numCols = numCols;
  this.grid = Array.from(Array(numRows), () => Array(numCols).fill(0));

  this.survivalMin = survivalMin;
  this.survivalMax = survivalMax;
  this.birthVal = birthVal;
}

GameOfLife.prototype = {
  constructor: GameOfLife,

  // TODO: method documentation.
  neighborSum: function(row, col) {
    // Initialize sum to zero and subtract value of the cell at (row, col),
    // canceling its effect when the all cells in the neighborhood square
    // are summed.
    let sum = -this.grid[row][col];
    for (let i of [-1, 0, 1]) {
      for (let j of [-1, 0, 1]) {
        if (row + i >= 0 && row + i < this.numRows
            && col + j >= 0 && col + j < this.numCols) {
          sum += this.grid[row + i][col + j];
        }
      }
    }
    return sum;
  },

  // TODO: method documentation.
  updateGrid: function() {
    let newGrid = Array.from(Array(this.numRows), () => Array(this.numCols).fill(0));
    for (let i = 0; i < this.numRows; i++) {
      for (let j = 0; j < this.numCols; j++) {
        let numLiveNeighbors = this.neighborSum(i, j);

        // Take action for the cases where the this.grid[i][j] is alive and
        // where it is not, based on the number of live neighbors.
        if ((this.grid[i][j] && numLiveNeighbors >= this.survivalMin
              && numLiveNeighbors <= this.survivalMax)
            || (!this.grid[i][j] && numLiveNeighbors == this.birthVal)) {
          newGrid[i][j] = 1;
        } else {
          newGrid[i][j] = 0;
        }
      }
    }
  this.grid = newGrid;
  },

  randomizeGrid: function(seedDensity=0.3) {
    for (let i = 0; i < this.numRows; i++) {
      for (let j = 0; j < this.numCols; j++) {
        this.grid[i][j] = Math.random() < seedDensity ? 1 : 0;
      }
    }
    return this;
  },

  numLiveCells: function() {
    let sum = 0;
    for (let i = 0; i < this.numRows; i++) {
      for (let j = 0; j < this.numCols; j++) {
        sum += this.grid[i][j];
      }
    }
    return sum;
  }
}

async function run(iterations=5000, delay=100) {
  let generationSpan = document.getElementById('generation');
  let liveSpan = document.getElementById('live-cells');
  for (let i = 1; i < iterations; i++) {
    game.updateGrid();
    drawGrid();
    generationSpan.innerHTML = i;
    liveSpan.innerHTML = game.numLiveCells();
    await sleep(delay);
  }
}

function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  canvas.width = 1000;
  canvas.height = 1000;
  let N = 150;
  rows = N;
  cols = N;

  cellWidth = canvas.width / cols;
  cellHeight = canvas.height / rows;

  game = new GameOfLife(rows, cols, 1, 4, 3).randomizeGrid(0.02);

  document.getElementById('canvas-width').innerHTML = canvas.width;
  document.getElementById('canvas-height').innerHTML = canvas.height;
}

init();
drawGrid();
run(5000, 1);

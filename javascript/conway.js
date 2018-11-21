var gc;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function GameCanvas(canvas, canvasWidth=1000, canvasHeight=1000) {
  this.canvas = canvas;
  this.context = canvas.getContext("2d");
  this.canvas.width = canvasWidth;
  this.canvas.height = canvasHeight;
  this.fillStyles = ["rgb(240, 240, 240)", "rgb(10, 10, 10)"];
  this.running = true;
}

GameCanvas.prototype = {
  constructor: GameCanvas,

  newGame: function(numRows, numCols, survivalMin=2, survivalMax=3, birthVal=3) {
    this.game = new GameOfLife(numRows, numCols, survivalMin, survivalMax, birthVal);
    this.cellWidth = this.canvas.width / numCols;
    this.cellHeight = this.canvas.height / numRows;
  },

  setCellColor: function(row, col, fillStyle) {
    this.context.fillStyle = fillStyle;
    this.context.fillRect(
      col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
  },

  drawGrid: function() {
    for (let i = 0; i < this.game.numRows; i++) {
      for (let j = 0; j < this.game.numCols; j++) {
        this.setCellColor(i, j, this.fillStyles[this.game.grid[i][j]]);
      }
    }
  },

  runGame: async function(maxIter=100, delay=100) {
    this.drawGrid();
    while (this.running) {
      await sleep(delay);
      this.game.updateGrid();
      this.drawGrid();
    }
  }
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

  neighborSum: function(row, col) {
    // Initialize sum to zero and subtract value of the cell at (row, col),
    // canceling its effect when all cells in the neighborhood are summed.
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

  randomizeGrid: function(seedDensity=0.2) {
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

function keyDown(e) {
  if (e.keyCode == 32) {
    if (gc.running) {
      gc.running = false;
    } else {
      gc.running = true;
      gc.runGame();
    }
  }
}

function init() {
  window.addEventListener("keydown", keyDown);
  gc = new GameCanvas(document.getElementById("canvas"));

  gc.newGame(100, 100, 2, 3, 3);
  gc.game.randomizeGrid(0.1);
  gc.runGame();
}

init();

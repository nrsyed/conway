var gc;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function GameCanvas(canvas, cellCounter=null, generationCounter=null,
                    delay=100, seedDensity=0.08, numRows=30, numCols=30) {
  this.canvas = canvas;
  this.cellCounter = cellCounter;
  this.context = canvas.getContext("2d");
  this.delay = delay;
  this.fillStyles = ["rgb(240, 240, 240)", "rgb(10, 10, 10)"];
  this.generationCounter = generationCounter;
  this.running = true;
  this.seedDensity = seedDensity;

  this.cellWidth = this.canvas.width / numCols;
  this.cellHeight = this.canvas.height / numRows;
  this.game = new GameOfLife(numRows, numCols);
}

GameCanvas.prototype = {
  constructor: GameCanvas,

  clearGrid: function() {
    this.game.clearGrid();
    this.drawGrid();
    this.updateCounters();
  },

  drawGrid: function() {
    for (let i = 0; i < this.game.numRows; i++) {
      for (let j = 0; j < this.game.numCols; j++) {
        this.setCellColor(i, j, this.fillStyles[this.game.grid[i][j]]);
      }
    }
  },

  newGrid: function(numRows, numCols) {
    this.running = false;
    this.game.initializeGrid(numRows, numCols);
    this.cellWidth = this.canvas.width / numCols;
    this.cellHeight = this.canvas.height / numRows;
    this.updateCounters();
  },

  randomizeGrid: function() {
    this.game.randomizeGrid(this.seedDensity);
    this.updateCounters();
  },

  run: async function() {
    this.drawGrid();
    while (this.running) {
      await sleep(this.delay);
      this.game.updateGrid();
      this.drawGrid();
      this.updateCounters();
    }
  },

  setCellColor: function(row, col, fillStyle) {
    this.context.fillStyle = fillStyle;
    this.context.fillRect(
      col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
  },

  toggleCell: function(row, col) {
    let newValue = 1 - this.game.grid[row][col];
    this.game.grid[row][col] = newValue;
    this.setCellColor(row, col, this.fillStyles[newValue]);
  },

  updateCounters: function() {
      if (this.cellCounter) {
        this.cellCounter.innerHTML = this.game.numLiveCells();
      }

      if (this.generationCounter) {
        this.generationCounter.innerHTML = this.game.generationCount;
      }
  }
}

function GameOfLife(numRows, numCols, survivalMin=2, survivalMax=3, birthVal=3) {
  this.generationCount = 0;
  this.initializeGrid(numRows, numCols);

  this.birthVal = birthVal;
  this.survivalMin = survivalMin;
  this.survivalMax = survivalMax;
}

GameOfLife.prototype = {
  constructor: GameOfLife,

  clearGrid: function() {
    this.grid = this.getZeroGrid();
    this.generationCount = 0;
  },

  getZeroGrid: function() {
    return Array.from(Array(this.numRows), () => Array(this.numCols).fill(0));
  },

  initializeGrid: function(numRows, numCols) {
    this.numRows = numRows;
    this.numCols = numCols;
    this.grid = this.getZeroGrid();
    this.generationCount = 0;
  },

  randomizeGrid: function(seedDensity) {
    for (let i = 0; i < this.numRows; i++) {
      for (let j = 0; j < this.numCols; j++) {
        this.grid[i][j] = Math.random() <= seedDensity ? 1 : 0;
      }
    }
    this.generationCount = 0;
  },

  updateGrid: function() {
    let updatedGrid = this.getZeroGrid();
    for (let i = 0; i < this.numRows; i++) {
      for (let j = 0; j < this.numCols; j++) {
        let numLiveNeighbors = this.neighborSum(i, j);

        // Take action for the cases where the this.grid[i][j] is alive and
        // where it is not, based on the number of live neighbors.
        if ((this.grid[i][j] && numLiveNeighbors >= this.survivalMin
              && numLiveNeighbors <= this.survivalMax)
            || (!this.grid[i][j] && numLiveNeighbors == this.birthVal)) {
          updatedGrid[i][j] = 1;
        } else {
          updatedGrid[i][j] = 0;
        }
      }
    }
    this.grid = updatedGrid;
    this.generationCount++;
  },

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
  switch (e.keyCode) {
    case 32:
      // Spacebar: pause/unpause Game execution.
      if (gc.running) {
        gc.running = false;
      } else {
        gc.running = true;
        gc.run();
      }
      break;
    case 82:
      // r: randomize grid.
      gc.randomizeGrid();
      gc.drawGrid();
      break;
    case 16:
      // Shift: clear grid.
      gc.clearGrid();
      break;
    default:
      //console.log(e.keyCode);
  }
}

function click(e) {
  let cellX = Math.floor(e.layerX / gc.cellWidth);
  let cellY = Math.floor(e.layerY / gc.cellHeight);
  gc.toggleCell(cellY, cellX);
}

function sliderInput(e) {
  let slider = e.target;
  let sliderId = slider.id.split("-")[0];
  let sliderVal = slider.value;

  let sliderMin = slider.min;
  let sliderRange = slider.max - sliderMin;
  let sliderWidth = slider.offsetWidth;
  let position = sliderVal / sliderRange;

  let thumbWidth = parseInt(
    window.getComputedStyle(slider).getPropertyValue("--thumb-width"));
  let effectiveWidth = sliderWidth - thumbWidth;

  let output = document.getElementById(sliderId + "-balloon");
  let balloonWidth = parseInt(window.getComputedStyle(output).getPropertyValue(
    "width"));
  let leftOffset = (-(balloonWidth - thumbWidth) / 2) + (position * effectiveWidth);
  output.setAttribute("style", "left: " + leftOffset + "px");

  if (sliderId == "lower") {
    gc.game.survivalMin = sliderVal;
  } else if (sliderId == "upper") {
    gc.game.survivalMax = sliderVal;
  } else {
    gc.game.birthVal = sliderVal;
  }

  output.innerHTML = sliderVal;
}

function sizeSubmit(e) {
  e.preventDefault();
  setSize();
}

function setDelay() {
  if (validateDelay()) {
    gc.delay = Number(document.getElementById("delay").value);
  } else {
    document.getElementById("delay").value = gc.delay;
  }
}

function setDensity() {
  if (validateDensity()) {
    gc.seedDensity = Number(document.getElementById("density").value);
  } else {
    document.getElementById("density").value = gc.seedDensity;
  }
}

function setSize() {
  if (validateSize()) {
    let newSize = Number(document.getElementById("size").value);

    gc.newGrid(newSize, newSize);
    gc.randomizeGrid();
    gc.run();
    gc.running = true;

  } else {
    document.getElementById("size").value = gc.grid.numRows;
  }
}

function validateDelay() {
  let delay = document.getElementById("delay").value;
  let delayVal = Number(delay);
  return delay != "" && Number.isInteger(delayVal) && delayVal >= 1 && delayVal <= 5000;
}

function validateDensity() {
  let density = document.getElementById("density").value;
  let densityVal = Number(density);
  return density != "" && density > 0 && density <= 1;
}

function validateSize() {
  let size = document.getElementById("size").value;
  let sizeVal = Number(size);
  return size != "" && Number.isInteger(sizeVal) && sizeVal >= 2 && sizeVal <= 500;
}

function settingsSubmit(e) {
  if (e.keyCode == 13) {
    setDelay();
    setDensity();
  }
}

function init() {
  let sliders = document.querySelectorAll(".slider input");
  for (slider of sliders) {
    slider.addEventListener("input", sliderInput);
  }

  window.addEventListener("keydown", keyDown);

  let canvas = document.getElementById("canvas");
  canvas.addEventListener("click", click);

  let sizeForm = document.getElementById("size-form");
  sizeForm.addEventListener("submit", sizeSubmit);

  let settings = document.getElementById("settings-form");
  settings.addEventListener("keydown", settingsSubmit);

  let cellCounter = document.getElementById("live-cells");
  let generationCounter = document.getElementById("generation");

  gc = new GameCanvas(canvas, cellCounter, generationCounter);
  gc.randomizeGrid();
  gc.run();
}

init();

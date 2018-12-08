var gc;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @class GameCanvas
 * Class to display Conway's Game of Life grid in a <canvas> HTML element,
 * as well as to serve as an interface with a GameOfLife object.
 */

/**
 * @constructor
 * @param {object} canvas - Reference to canvas DOM element.
 * @param {object} cellCounter - Optional reference to a DOM element whose
 *    innerHTML text will display the number of living cells in the grid.
 * @param {object} generationCounter - Optional reference to a DOM element
 *    whose innerHTML text will display the current Game generation.
 * @param {int} delay - Delay (in milliseconds) between frame updates.
 * @param {float} seedDensity - The likelihood (0.01 < p < 1.0) of a cell
 *    being live when the grid is randomized.
 * @param {int} numRows - The number of grid rows.
 * @param {int} numCols - The number of grid columns.
 */
function GameCanvas(canvas, cellCounter=null, generationCounter=null,
                    delay=100, seedDensity=0.08, numRows=30, numCols=30) {
  this.canvas = canvas;
  this.cellCounter = cellCounter;
  this.delay = delay;
  this.generationCounter = generationCounter;
  this.seedDensity = seedDensity;

  /** @member {object} context - Canvas context. */
  this.context = canvas.getContext("2d");

  /** @member {array} fillStyles - Live cell and dead cell colors. */
  this.fillStyles = ["rgb(240,240,240)", "rgb(40,40,40)"];

  /** @member {bool} running - true if the Game is active, false if paused. */
  this.running = true;

  /** @member {int} cellWidth - Width of each grid cell in pixels. */
  this.cellWidth = this.canvas.width / numCols;

  /** @member {int} cellHeight - Height of each grid cell in pixels. */
  this.cellHeight = this.canvas.height / numRows;

  this.game = new GameOfLife(numRows, numCols);
}

GameCanvas.prototype = {
  constructor: GameCanvas,

  /** @method clearGrid - Fill the grid with zeros. */
  clearGrid: function() {
    this.game.clearGrid();
    this.drawGrid();
    this.updateCounters();
  },

  /** @method drawGrid - Draw the grid in the canvas. */
  drawGrid: function() {
    for (let i = 0; i < this.game.numRows; i++) {
      for (let j = 0; j < this.game.numCols; j++) {
        this.setCellColor(i, j, this.fillStyles[this.game.grid[i][j]]);
      }
    }
  },

  /** @method newGrid - Create a new grid of a different size. */
  newGrid: function(numRows, numCols) {
    this.running = false;
    this.game.initializeGrid(numRows, numCols);
    this.cellWidth = this.canvas.width / numCols;
    this.cellHeight = this.canvas.height / numRows;
    this.updateCounters();
  },

  /** @method randomizeGrid - Randomize the values of the grid cells. */
  randomizeGrid: function() {
    this.game.randomizeGrid(this.seedDensity);
    this.updateCounters();
  },

  /** @method run - Iteratively update the grid and canvas. */
  run: async function() {
    this.drawGrid();
    while (this.running) {
      await sleep(this.delay);
      this.game.updateGrid();
      this.drawGrid();
      this.updateCounters();
    }
  },

  /** @method setCellColor - Change the color of a cell to the specified color. */
  setCellColor: function(row, col, fillStyle) {
    this.context.fillStyle = fillStyle;
    this.context.fillRect(col * this.cellWidth, row * this.cellHeight,
                          this.cellWidth, this.cellHeight);
  },

  /** @method toggleCell - Invert the value (0 -> 1 or 1 -> 0) of a cell. */
  toggleCell: function(row, col) {
    let newValue = 1 - this.game.grid[row][col];
    this.game.grid[row][col] = newValue;
    this.setCellColor(row, col, this.fillStyles[newValue]);
  },

  /** @method updateCounters - Update cell and generation counter innerHTML. */
  updateCounters: function() {
      if (this.cellCounter) {
        this.cellCounter.innerHTML = this.game.numLiveCells();
      }

      if (this.generationCounter) {
        this.generationCounter.innerHTML = this.game.generationCount;
      }
  }
}

/**
 * @class GameOfLife
 * Class to implement Conway's Game of Life.
 */

/**
 * @constructor
 * @param {int} numRows - Number of grid rows.
 * @param {int} numCols - Number of grid columns.
 * @param {int} survivalMin - Minimum number of neighborhood cells (cells
 *    surrounding a given cell) required for a cell to survive to the
 *    next generation.
 * @param {int} survivalMax - Maximum number of neighborhood cells for which
 *    a given cell is allowed to survive to the next generation.
 * @param {int} birthVal - Number of live cells that must be in the
 *    neighborhood of a dead cell for it to become a live cell.
 */
function GameOfLife(numRows, numCols, survivalMin=2, survivalMax=3, birthVal=3) {
  /** @member {int} generationCount - Number of elapsed generations. */
  this.generationCount = 0;

  this.initializeGrid(numRows, numCols);
  this.birthVal = birthVal;
  this.survivalMin = survivalMin;
  this.survivalMax = survivalMax;
}

GameOfLife.prototype = {
  constructor: GameOfLife,

  /** @method clearGrid - Fill grid with zeros and reset generation count. */
  clearGrid: function() {
    this.grid = this.getZeroGrid();
    this.generationCount = 0;
  },

  /** @method getZeroGrid - Obtain a zero-filled grid. */
  getZeroGrid: function() {
    return Array.from(Array(this.numRows), () => Array(this.numCols).fill(0));
  },

  /** @method initializeGrid - Create a new grid of a different size. **/
  initializeGrid: function(numRows, numCols) {
    this.numRows = numRows;
    this.numCols = numCols;
    this.grid = this.getZeroGrid();
    this.generationCount = 0;
  },

  /**
   * @method randomizeGrid - Randomize the values of all grid cells.
   * @param {float} seedDensity - The probability (0.01 < p < 1.0) that
   *    any given cell will be live.
   */
  randomizeGrid: function(seedDensity) {
    for (let i = 0; i < this.numRows; i++) {
      for (let j = 0; j < this.numCols; j++) {
        this.grid[i][j] = Math.random() <= seedDensity ? 1 : 0;
      }
    }
    this.generationCount = 0;
  },

  /** @method updateGrid - Execute one iteration of Conway's Game of Life. */
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

  /** @method neighborSum - Return the sum of a cell's neighbors. */
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

  /** @method numLiveCells - Return the number of live cells in the grid. */
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

function clickCanvas(e) {
  let cellX = Math.floor((e.pageX - e.target.offsetLeft) / gc.cellWidth);
  let cellY = Math.floor((e.pageY - e.target.offsetTop) / gc.cellWidth);
  gc.toggleCell(cellY, cellX);
  gc.updateCounters();
}

/** @function toCamelCase - Convert "kebab-case" to "camelCase". */
function toCamelCase(s) {
  const pattern = /(\-[a-z])/g;
  return s.replace(pattern, (match) => match[1].toUpperCase());
}

function sliderMove(e) {
  let slider = e.target;
  let sliderVal = slider.value;
  updateSliderBubble(slider);

  // GameOfLife object has members survivalMin, survivalMax, and birthVal
  // that define its rules. Each slider has an id of the same name but in
  // kebab case ("survival-max", "survival-min", "birth-val"). Convert to
  // camel case to update appropriate rule value.
  gc.game[toCamelCase(slider.id)] = sliderVal;
}

/**
 * @function updateSliderBubble
 * Set the position and text of the value bubble floating above a
 * slider thumb based on the position of the slider thumb.
 */
function updateSliderBubble(slider) {
  let sliderId = slider.id;
  let sliderVal = slider.value;
  let sliderMin = slider.min;
  let sliderRange = slider.max - sliderMin;
  let sliderWidth = slider.offsetWidth;
  let position = sliderVal / sliderRange;

  let thumbWidth = parseInt(
    window.getComputedStyle(slider).getPropertyValue("--thumb-width"));
  let effectiveWidth = sliderWidth - thumbWidth;

  // The bubble corresponding to each slider is an <output> element whose id
  // is the same as its corresponding slider with the word "bubble" appended,
  // e.g., <output id="survival-min-bubble" ...> is the counterpart of
  // <input id="survival-min" ...>.
  let bubble = document.getElementById(sliderId + "-bubble");
  let bubbleWidth = parseInt(window.getComputedStyle(bubble).getPropertyValue(
    "width"));
  let leftOffset = (-(bubbleWidth - thumbWidth) / 2) + (position * effectiveWidth);

  bubble.setAttribute("style", "left: " + leftOffset + "px");
  bubble.innerHTML = sliderVal;
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
  return density != "" && densityVal > 0 && densityVal <= 1;
}

function validateSize() {
  let size = document.getElementById("size").value;
  let sizeVal = Number(size);
  return size != "" && Number.isInteger(sizeVal) && sizeVal >= 2 && sizeVal <= 500;
}

function formSubmit(e) {
  e.preventDefault();

  validateDelay();
  validateDensity();
  validateSize();

  setDelay();
  setDensity();

  // Resizing grid automatically randomizes the grid, so only call setSize()
  // if the new size is different from the current size.
  if (document.getElementById("size").value != gc.game.numRows) {
    setSize();
  }
}

function init() {
  let sliders = document.querySelectorAll(".slider input");
  for (slider of sliders) {
    slider.addEventListener("input", sliderMove);
    updateSliderBubble(slider);
  }

  let pauseButton = document.getElementById("pause");
  pauseButton.addEventListener("click", function(e) {
    if (gc.running) {
      gc.running = false;
      this.innerHTML = "Run";
    } else {
      gc.running = true;
      gc.run();
      this.innerHTML = "Pause";
    }
  });

  let randomizeButton = document.getElementById("randomize");
  randomizeButton.addEventListener("click", function(e) {
    gc.randomizeGrid();
    gc.drawGrid();
  });

  let clearButton = document.getElementById("clear");
  clearButton.addEventListener("click", function(e) { gc.clearGrid() });

  let canvas = document.getElementById("canvas");
  canvas.addEventListener("click", clickCanvas);

  let settingsForm = document.querySelector("form");
  settingsForm.addEventListener("submit", formSubmit);

  let cellCounter = document.getElementById("live-cells");
  let generationCounter = document.getElementById("generation");

  gc = new GameCanvas(canvas, cellCounter, generationCounter);
  gc.randomizeGrid();
  gc.run();
}

init();

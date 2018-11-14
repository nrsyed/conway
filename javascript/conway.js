var canvas, ctx, cell;
var m = 50;
var n = 50;
var numHues = m * n;

function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 800;
  cell = {
    width: canvas.width / n,
    height: canvas.height / m
  };

  document.getElementById("canvas-width").innerHTML = canvas.width;
  document.getElementById("canvas-height").innerHTML = canvas.height;
}

function setCellColor(row, col, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.fillRect(col * cell.width, row * cell.height, cell.width, cell.height);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function drawGrid() {
  let hue;
  let hueSpan = document.getElementById("hue");

  k = 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      hue = 255 - Math.floor(k++ * (255 / (numHues - 1)));
      //hue = (i + j) % 2 == 0 ? 235 : 20;
      hueSpan.innerHTML = hue;
      fillStyle = 'rgb(' + hue + ',' + hue + ',' + hue + ')';
      setCellColor(i, j, fillStyle);
      await sleep(1);
    }
  }
}

init();
drawGrid();

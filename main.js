const iterations = document.getElementById("iterations");
const canvas = document.getElementById("canvas");
const julia = document.getElementById("julia");
const c = document.getElementById("c");

let memory = new WebAssembly.Memory({ initial: 0, maximum: 100 });
let ctx = canvas.getContext("2d");
let wasm, pixels, image;
let totalPages = 0;

function calcpages(width, height) {
  return (((4 * width * height) - 1) >> 16) + 1;
}

function map(value, start1, stop1, start2, stop2) {
  return (value - start1)/(stop1 - start1) * (stop2 - start2) + start2;
}

function resizecanvas(width, height) {
  const pages = calcpages(width, height);
  console.log("Resizing canvas, new number of pages: %i", pages);

  if (pages > totalPages) {
    memory.grow(pages - totalPages);
    totalPages = pages;
  }

  canvas.width = width;
  canvas.height = height;

  pixels = new Uint8ClampedArray(memory.buffer, 0, 4*width*height);
  image = new ImageData(pixels, width, height);
}

canvas.onclick = function(ev) {
  const re = map(ev.layerX, 0, this.width, -2.0, 2.0);
  const im = map(ev.layerY, 0, this.height, -2.0, 2.0);

  c.real.valueAsNumber = re;
  c.imaginary.valueAsNumber = im;

  return draw();
};

function draw() {
  if (julia.checked) {
    wasm.instance.exports.julia(canvas.width, canvas.height, iterations.valueAsNumber, c.real.valueAsNumber, c.imaginary.valueAsNumber);
  } else {
    wasm.instance.exports.mandelbrot(canvas.width, canvas.height, iterations.valueAsNumber);
  }
  ctx.putImageData(image, 0, 0);
}

WebAssembly.instantiateStreaming(fetch('./mandelbrot.wasm'), {
  env: { memory }
}).then(obj => {
  wasm = obj;
  iterations.onchange = draw;
  c.onchange = draw;
  julia.onchange = draw;
  resizecanvas(600, 600);
  draw();
});


var report;
var reportCanvas;
var dataReady = 0;

async function preload() {
  //Initialize report
  report = new Report();
  //Data Modelling and ETL Steps (see data_steps.js)
  await prepare_sales_data();
  //We are ready
  dataReady = 1;
}
function setup() {
  // Setup p5 Canvas with device pixel ratio compensation
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Create canvas at scaled resolution
  const c = createCanvas(width * ratio, height * ratio);
  c.parent("app");

  // Match visual size to logical pixel size
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  // Scale drawing to normal coordinate system
  scale(ratio);

  // Report building steps
  build_dashboard_page();
  build_product_page();
  build_customer_page();
}

//Render Report
function draw() {
  background("white");
  if (dataReady) report.render();
}

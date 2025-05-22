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
  //Setup p5 Canvas
  reportCanvas = select("#app");
  var c = createCanvas(window.innerWidth, window.innerHeight);
  c.parent("app");

  //Report building steps for dashboard page (see dashboard.js inside reports folder)
  build_dashboard_page();
  build_product_page();
  build_customer_page();
}

//Render Report
function draw() {
  background("white");
  if (dataReady) report.render();
}

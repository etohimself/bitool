function build_product_page() {
  //Dashboard Page
  report.addPage("Product Analysis", "page_product");
  //Slicers
  report
    .getPage("page_product")
    .addSlicer("slicer1", 25, 25, 200, 80)
    .addValue("Date", "Dim_Date", "Date")
    .sortBy("Date", "ascending");

  report
    .getPage("page_product")
    .addSlicer("slicer2", 25, 115, 200, 80)
    .addValue("Territory", "Fact_Sales", "TERRITORY")
    .sortBy("Territory", "ascending");

  report
    .getPage("page_product")
    .addSlicer("slicer3", 25, 205, 200, 80)
    .addValue("Country", "Fact_Sales", "COUNTRY")
    .sortBy("Country", "ascending");

  report
    .getPage("page_product")
    .addSlicer("slicer4", 25, 300, 200, 80)
    .addValue("City", "Fact_Sales", "CITY")
    .sortBy("City", "ascending");

  report
    .getPage("page_product")
    .addSlicer("slicer5", 25, 395, 200, 80)
    .addValue("Product Line", "Dim_ProductLine", "PRODUCTLINE")
    .sortBy("Product Line", "ascending");

  report
    .getPage("page_product")
    .addSlicer("slicer6", 25, 490, 200, 80)
    .addValue("Customer", "Dim_Customer", "CUSTOMERNAME")
    .sortBy("Customer", "ascending");

  //Cards
  report
    .getPage("page_product")
    .addCard("card1", "Unique Products", 250, 25, 322, 150)
    .addValue(
      "Unique Products",
      "COUNTDISTINCT(Fact_Sales[PRODUCTCODE])",
      "integer"
    );

  report
    .getPage("page_product")
    .addCard("card2", "Sold Countries", 582, 25, 322, 150)
    .addValue(
      "Sold Countries",
      "COUNTDISTINCT(Fact_Sales[COUNTRY])",
      "integer"
    );

  report
    .getPage("page_product")
    .addCard("card3", "Sold Cities", 914, 25, 322, 150)
    .addValue("Sold Cities", "COUNTDISTINCT(Fact_Sales[CITY])", "integer");

  report
    .getPage("page_product")
    .addCard("card4", "Shipped Order %", 1246, 25, 322, 150)
    .addValue(
      "Dispute Rate %",
      "COUNT(Fact_Sales[Shipped Order Number]) / COUNT(Fact_Sales[ORDERNUMBER])",
      "percentage"
    );

  report
    .getPage("page_product")
    .addCard("card5", "Cancel Rate %", 1578, 25, 322, 150)
    .addValue(
      "Cancel Rate %",
      "COUNT(Fact_Sales[Cancelled Order Number]) / COUNT(Fact_Sales[ORDERNUMBER])",
      "percentage"
    );

  report
    .getPage("page_product")
    .addPieChart("pie1", "Orders By Product", 890, 185, 500, 350)
    .addCategory("Product Code", "Dim_ProductLine", "PRODUCTLINE")
    .addValue("Sold Quantity", "SUM(Fact_Sales[QUANTITYORDERED])");

  report
    .getPage("page_product")
    .addBubbleChart(
      "scatterplot1",
      "Shipping Time vs. Customer Satisfaction",
      1400,
      185,
      500,
      350
    )
    .addYAxis("Shipping Time", "Fact_Sales", "Shipping Time")
    .addXAxis("Customer Satisfaction", "Fact_Sales", "Customer Satisfaction")
    .addValue("Occurance", "COUNT(Fact_Sales[ORDERNUMBER])", "integer");

  report
    .getPage("page_product")
    .addMatrix("table1", 250, 545, 1140, 310)
    .addRow("Product", "Dim_ProductLine", "PRODUCTLINE")
    .addRow("Month Start", "Dim_Date", "Month Start")
    .addValue(
      "Individual Orders",
      "COUNTDISTINCT(Fact_Sales[ORDERNUMBER])",
      "integer"
    )
    .addValue(
      "Fulfilled Orders",
      "COUNTDISTINCT(Fact_Sales[Shipped Order Number])",
      "integer"
    )
    .addValue(
      "Cancelled/Disputed Orders",
      "COUNTDISTINCT(Fact_Sales[Cancelled Order Number]) + COUNTDISTINCT(Fact_Sales[Disputed Order Number])",
      "integer"
    )
    .addValue(
      "Order Fulfillment %",
      "COUNTDISTINCT(Fact_Sales[Shipped Order Number]) / COUNTDISTINCT(Fact_Sales[ORDERNUMBER])",
      "percentage"
    )
    .addValue(
      "Total Products Ordered",
      "SUM(Fact_Sales[QUANTITYORDERED])",
      "integer"
    )
    .addValue("Revenue ($)", "SUM(Fact_Sales[SALES])", "integer")
    .addValue(
      "Average Order Value ($)",
      "AVERAGE(Fact_Sales[Total Order Value])",
      "integer"
    )
    .addValue(
      "Average Product Price ($)",
      "AVERAGE(Fact_Sales[PRICEEACH])",
      "double"
    )
    .addValue(
      "Unique Customers",
      "COUNTDISTINCT(Fact_Sales[CUSTOMERNAME])",
      "integer"
    )
    .addValue(
      "New Customers Acquired",
      "COUNTDISTINCT(Fact_Sales[New Customer])",
      "integer"
    )
    .addValue(
      "Legacy Customers",
      "COUNTDISTINCT(Fact_Sales[Retention Customer])",
      "integer"
    )
    .sortBy("Month Start", "ascending");

  report
    .getPage("page_product")
    .addHorizontalBarChart(
      "hbar1",
      "Most Cancelled/Disputed Products",
      1400,
      545,
      500,
      310
    )
    .addYAxis("Product Line", "Dim_ProductLine", "PRODUCTLINE")
    .addXAxis(
      "Cancelled/Disputed Orders",
      "COUNTDISTINCT(Fact_Sales[Cancelled Order Number])+COUNTDISTINCT(Fact_Sales[Disputed Order Number])"
    )
    .sortBy("Cancelled/Disputed Orders", "descending");

  //Provide custom palette because we will run out of colors with default palette
  report
    .getPage("page_product")
    .addLineChart("lineChart1", "Revenue By Products", 250, 185, 1140, 350, [
      [0, 0, 0], // Black
      [68, 138, 255],
      [21, 101, 192],
      [0, 150, 136],
      [139, 195, 74],
      [255, 193, 7],
      [244, 67, 54],
      [173, 20, 87],
    ])
    .addXAxis("Month Start", "Dim_Date", "Month Start")
    .addYAxis("Classic Cars", "SUM(Fact_Sales[Classic Cars Sales])", "integer")
    .addYAxis("Motorcycles", "SUM(Fact_Sales[Motorcycles Sales])", "integer")
    .addYAxis("Planes", "SUM(Fact_Sales[Planes Sales])", "integer")
    .addYAxis("Ships", "SUM(Fact_Sales[Ships Sales])", "integer")
    .addYAxis("Trains", "SUM(Fact_Sales[Trains Sales])", "integer")
    .addYAxis(
      "Trucks and Buses",
      "SUM(Fact_Sales[Trucks and Buses Sales])",
      "integer"
    )
    .addYAxis("Vintage Cars", "SUM(Fact_Sales[Vintage Cars Sales])", "integer");
}

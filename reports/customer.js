function build_customer_page() {
  //Dashboard Page
  report.addPage("Customer Analysis", "page_customer");
  //Slicers
  report
    .getPage("page_customer")
    .addSlicer("slicer1", 25, 25, 200, 80)
    .addValue("Date", "Dim_Date", "Date")
    .sortBy("Date", "ascending");

  report
    .getPage("page_customer")
    .addSlicer("slicer2", 25, 115, 200, 80)
    .addValue("Territory", "Fact_Sales", "TERRITORY")
    .sortBy("Territory", "ascending");

  report
    .getPage("page_customer")
    .addSlicer("slicer3", 25, 205, 200, 80)
    .addValue("Country", "Fact_Sales", "COUNTRY")
    .sortBy("Country", "ascending");

  report
    .getPage("page_customer")
    .addSlicer("slicer4", 25, 300, 200, 80)
    .addValue("City", "Fact_Sales", "CITY")
    .sortBy("City", "ascending");

  report
    .getPage("page_customer")
    .addSlicer("slicer5", 25, 395, 200, 80)
    .addValue("Product Line", "Dim_ProductLine", "PRODUCTLINE")
    .sortBy("Product Line", "ascending");

  report
    .getPage("page_customer")
    .addSlicer("slicer6", 25, 490, 200, 80)
    .addValue("Customer", "Dim_Customer", "CUSTOMERNAME")
    .sortBy("Customer", "ascending");

  //Cards
  report
    .getPage("page_customer")
    .addCard("card1", "Unique Customers", 250, 25, 322, 150)
    .addValue(
      "Unique Customers",
      "COUNTDISTINCT(Fact_Sales[CUSTOMERNAME])",
      "integer"
    );

  report
    .getPage("page_customer")
    .addCard("card2", "Regions", 582, 25, 322, 150)
    .addValue("Regions", "COUNTDISTINCT(Fact_Sales[TERRITORY])", "integer");

  report
    .getPage("page_customer")
    .addCard("card3", "Countries", 914, 25, 322, 150)
    .addValue("Countries", "COUNTDISTINCT(Fact_Sales[COUNTRY])", "integer");

  report
    .getPage("page_customer")
    .addCard("card4", "Cities", 1246, 25, 322, 150)
    .addValue("Cities", "COUNTDISTINCT(Fact_Sales[CITY])", "integer");

  report
    .getPage("page_customer")
    .addCard("card5", "Customer Retention %", 1578, 25, 322, 150)
    .addValue(
      "Customer Retention %",
      "COUNTDISTINCT(Fact_Sales[Retention Customer]) / COUNTDISTINCT(Fact_Sales[CUSTOMERNAME])",
      "percentage"
    );

  report
    .getPage("page_customer")
    .addHorizontalBarChart(
      "hbar1",
      "Most Valuable Customers",
      250,
      185,
      600,
      610
    )
    .addYAxis("Customer Name", "Dim_Customer", "CUSTOMERNAME")
    .addXAxis("Revenue Generated", "SUM(Fact_Sales[SALES])", "integer")
    .sortBy("Revenue Generated", "descending");

  report
    .getPage("page_customer")
    .addAreaChart(
      "lineChart1",
      "Customer Acqusition Over Months",
      860,
      185,
      1050,
      350
    )
    .addXAxis("Month Start", "Dim_Date", "Month Start")
    .addYAxis("Trains", "COUNTDISTINCT(Fact_Sales[New Customer])", "integer");

  report
    .getPage("page_customer")
    .addPieChart("scatter1", "Revenue By Customer", 860, 545, 520, 250)
    .addCategory("Customer Name", "Dim_Customer", "CUSTOMERNAME")
    .addValue("Revenue Generated", "SUM(Fact_Sales[SALES])", "integer");

  report
    .getPage("page_customer")
    .addHorizontalBarChart(
      "pie1",
      "Most Cancelling Customers",
      1390,
      545,
      520,
      250
    )
    .addYAxis("Customer Name", "Dim_Customer", "CUSTOMERNAME")
    .addXAxis(
      "Cancelled Orders",
      "COUNTDISTINCT(Fact_Sales[Cancelled Order Number]) + COUNTDISTINCT(Fact_Sales[Disputed Order Number])",
      "integer"
    )
    .sortBy("Cancelled Orders", "descending");
}

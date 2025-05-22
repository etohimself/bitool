function build_dashboard_page() {
  //Dashboard Page
  report.addPage("Dashboard", "page_dashboard");
  //Slicers
  report
    .getPage("page_dashboard")
    .addSlicer("slicer1", 25, 25, 200, 80)
    .addValue("Date", "Dim_Date", "Date")
    .sortBy("Date", "ascending");

  report
    .getPage("page_dashboard")
    .addSlicer("slicer2", 25, 115, 200, 80)
    .addValue("Month Start", "Dim_Date", "Month Start")
    .sortBy("Month Start", "ascending");

  report
    .getPage("page_dashboard")
    .addSlicer("slicer2", 25, 205, 200, 80)
    .addValue("Territory", "Fact_Sales", "TERRITORY")
    .sortBy("Territory", "ascending");

  report
    .getPage("page_dashboard")
    .addSlicer("slicer3", 25, 300, 200, 80)
    .addValue("Country", "Fact_Sales", "COUNTRY")
    .sortBy("Country", "ascending");

  report
    .getPage("page_dashboard")
    .addSlicer("slicer4", 25, 395, 200, 80)
    .addValue("City", "Fact_Sales", "CITY")
    .sortBy("City", "ascending");

  report
    .getPage("page_dashboard")
    .addSlicer("slicer5", 25, 490, 200, 80)
    .addValue("Product Line", "Dim_ProductLine", "PRODUCTLINE")
    .sortBy("Product Line", "ascending");

  report
    .getPage("page_dashboard")
    .addSlicer("slicer6", 25, 585, 200, 80)
    .addValue("Customer", "Dim_Customer", "CUSTOMERNAME")
    .sortBy("Customer", "ascending");

  report
    .getPage("page_dashboard")
    .addCard("card1", "Orders", 250, 25, 322, 150)
    .addValue("Orders", "COUNTDISTINCT(Fact_Sales[ORDERNUMBER])", "integer");

  report
    .getPage("page_dashboard")
    .addCard("card2", "Ordered Products", 582, 25, 322, 150)
    .addValue("Ordered Products", "SUM(Fact_Sales[QUANTITYORDERED])", "double");

  report
    .getPage("page_dashboard")
    .addCard("card3", "Average Order Value ($)", 914, 25, 322, 150)
    .addValue(
      "Average Order Value ($)",
      "AVERAGE(Fact_Sales[Total Order Value])",
      "integer"
    );

  report
    .getPage("page_dashboard")
    .addCard("card4", "Revenue ($)", 1246, 25, 322, 150)
    .addValue("Revenue ($)", "SUM(Fact_Sales[SALES])", "integer");

  report
    .getPage("page_dashboard")
    .addCard("card5", "Cancel Rate %", 1578, 25, 322, 150)
    .addValue(
      "Cancel Rate %",
      "COUNT(Fact_Sales[Cancelled Order Number]) / COUNT(Fact_Sales[ORDERNUMBER])",
      "percentage"
    );

  report
    .getPage("page_dashboard")
    .addHorizontalBarChart("hbar1", "Best Selling Product", 250, 185, 500, 350)
    .addYAxis("Product Line", "Dim_ProductLine", "PRODUCTLINE")
    .addXAxis("Sold Quantity", "SUM(Fact_Sales[QUANTITYORDERED])", "integer")
    .sortBy("Sold Quantity", "descending");

  report
    .getPage("page_dashboard")
    .addAreaChart("area1", "Revenue Over Months", 760, 185, 1140, 350)
    .addXAxis("Month Start", "Dim_Date", "Month Start")
    .addYAxis("Revenue", "SUM(Fact_Sales[SALES])", "integer")
    .sortBy("Month Start", "ascending");

  report
    .getPage("page_dashboard")
    .addBarChart("barchart1", "Orders Over Months", 250, 545, 1140, 310)
    .addXAxis("Month Start", "Dim_Date", "Month Start")
    .addYAxis("Revenue", "SUM(Fact_Sales[SALES])", "integer")
    .sortBy("Month Start", "ascending");

  report
    .getPage("page_dashboard")
    .addDonutChart("donut1", "Revenue By Products", 1400, 545, 500, 310)
    .addCategory("Product Line", "Dim_ProductLine", "PRODUCTLINE")
    .addValue("Revenue", "SUM(Fact_Sales[SALES])", "integer");
}

async function prepare_sales_data() {
  //Import data, source:  https://www.kaggle.com/datasets/kyanyoga/sample-sales-data
  await report.importData("./sales_data_sample.csv", "Fact_Sales");

  //Create dimension tables for increased performance
  report.createDimension("Fact_Sales", "PRODUCTLINE", "Dim_ProductLine");
  report.createDimension("Fact_Sales", "CUSTOMERNAME", "Dim_Customer");
  report.createDimension("Fact_Sales", "DEALSIZE", "Dim_DealSize");

  //Create relatiponships (one-to-many in this case)
  report.createRelationship(
    "Dim_ProductLine",
    "key",
    "Fact_Sales",
    "PRODUCTLINE"
  );
  report.createRelationship(
    "Dim_Customer",
    "key",
    "Fact_Sales",
    "CUSTOMERNAME"
  );

  report.createRelationship("Dim_DealSize", "key", "Fact_Sales", "DEALSIZE");

  //Add calcualated column, a proper ISO8601 date column to Fact_Sales
  report.addCalculatedColumn("Fact_Sales", "Date", (columns, row) => {
    let positionOfSpace = columns["ORDERDATE"][row].indexOf(" ");
    let firstSlash = columns["ORDERDATE"][row].indexOf("/");
    let secondSlash = columns["ORDERDATE"][row].indexOf("/", firstSlash + 1);
    let dateWithoutTime = columns["ORDERDATE"][row].slice(0, positionOfSpace);
    let yearPart = dateWithoutTime.slice(-4);
    let dayPart = dateWithoutTime.slice(firstSlash + 1, secondSlash);
    let monthPart = dateWithoutTime.slice(0, firstSlash);
    if (dayPart.length < 2) dayPart = "0" + dayPart;
    if (monthPart.length < 2) monthPart = "0" + monthPart;
    let newISODate = yearPart + "/" + monthPart + "/" + dayPart;
    return newISODate;
  });

  //Create dimension and relationship from newly created column
  //Note : For Date table, I am intentionally not using the Date column as primary key, because my code automatically generates a primary key named "key"
  //This is useful for faster lookups as well as being able to filter by multiple field in the source table

  report.createDimension("Fact_Sales", "Date", "Dim_Date");
  report.createRelationship("Dim_Date", "key", "Fact_Sales", "Date");

  //Add calculated column named Total Order Value
  report.addCalculatedColumn(
    "Fact_Sales",
    "Total Order Value",
    (columns, row) => {
      let currentOrder = columns["ORDERNUMBER"][row];
      let totalRevenue = 0;
      for (let i = 0; i < columns["ORDERNUMBER"].length; i++) {
        if (columns["ORDERNUMBER"][i] == currentOrder) {
          totalRevenue += Number(columns["SALES"][i]);
        }
      }
      return totalRevenue.toFixed(2);
    }
  );

  //Add calculated column for cancelled orders
  report.addCalculatedColumn(
    "Fact_Sales",
    "Cancelled Order Number",
    (columns, row) =>
      columns["STATUS"][row] == "Cancelled" ? columns["ORDERNUMBER"][row] : ""
  );

  //Add calculated column for shipped orders
  report.addCalculatedColumn(
    "Fact_Sales",
    "Shipped Order Number",
    (columns, row) =>
      columns["STATUS"][row] == "Shipped" ? columns["ORDERNUMBER"][row] : ""
  );

  //Add calculated column for disputed orders
  report.addCalculatedColumn(
    "Fact_Sales",
    "Disputed Order Number",
    (columns, row) =>
      columns["STATUS"][row] == "Disputed" ? columns["ORDERNUMBER"][row] : ""
  );

  //Add calculated column for Year Month
  report.addCalculatedColumn(
    "Dim_Date",
    "Month Start",
    (columns, row) => columns["Date"][row].slice(0, 7) + "/01"
  );

  //Add calculated columns each product line
  //Retrieve key value pairs from dimension table
  let productTable = report.model.getTable("Dim_ProductLine").object.data;
  for (let i = 1; i < productTable[0].length; i++) {
    let productName = productTable[0][i];
    let key = productTable[1][i];

    report.addCalculatedColumn(
      "Fact_Sales",
      productName + " Sales",
      (columns, row) =>
        columns["PRODUCTLINE"][row] == key ? columns["SALES"][row] : 0
    );
  }

  //Add calculated column for new customers
  report.addCalculatedColumn("Fact_Sales", "New Customer", (columns, row) => {
    let orderDate = Date.parse(columns["ORDERDATE"][row]);
    let thisCustomer = columns["CUSTOMERNAME"][row];
    if (thisCustomer == "") return "";

    let allOrdersAndCustomers = [columns["ORDERDATE"], columns["CUSTOMERNAME"]];
    let customerOrderedBefore = 0;

    for (let i = 0; i < allOrdersAndCustomers[0].length; i++) {
      if (
        Date.parse(allOrdersAndCustomers[0][i]) < orderDate &&
        allOrdersAndCustomers[1][i] == thisCustomer
      ) {
        customerOrderedBefore = 1;
      }
    }
    return customerOrderedBefore ? "" : thisCustomer;
  });

  //Add calculated column for retention customers
  report.addCalculatedColumn(
    "Fact_Sales",
    "Retention Customer",
    (columns, row) => {
      let orderDate = Date.parse(columns["ORDERDATE"][row]);
      let thisCustomer = columns["CUSTOMERNAME"][row];
      let allOrdersAndCustomers = [
        columns["ORDERDATE"],
        columns["CUSTOMERNAME"],
      ];
      let customerOrderedBefore = 0;

      for (let i = 0; i < allOrdersAndCustomers[0].length; i++) {
        if (
          Date.parse(allOrdersAndCustomers[0][i]) < orderDate &&
          allOrdersAndCustomers[1][i] == thisCustomer
        ) {
          customerOrderedBefore = 1;
        }
      }
      return !customerOrderedBefore ? "" : thisCustomer;
    }
  );

  //Add calculated table consisting of product prices and cancellation rates, correlation analysis
  let newTable = [
    ["PRODUCTCODE"],
    ["PRICEEACH"],
    ["SHIPPED"],
    ["CANCELLED"],
    ["ORDERVALUE"],
  ];
  let productCodes = [
    ...new Set(
      report.model
        .getTable("Fact_Sales")
        .object.selectColumn("PRODUCTCODE")
        .data[0].slice(1)
    ),
  ];

  //Add product code and prices
  for (let i = 0; i < productCodes.length; i++) {
    let price = [
      ...new Set(
        report.model
          .getTable("Fact_Sales")
          .object.filterTable([productCodes[i]], "PRODUCTCODE")
          .selectColumn("PRICEEACH")
          .data[0].slice(1)
      ),
    ][0];

    newTable[0].push(productCodes[i]);
    newTable[1].push(price);
  }

  //Add order values
  for (let i = 0; i < productCodes.length; i++) {
    let price = [
      ...new Set(
        report.model
          .getTable("Fact_Sales")
          .object.filterTable([productCodes[i]], "PRODUCTCODE")
          .selectColumn("SALES")
          .data[0].slice(1)
      ),
    ][0];

    newTable[4].push(price);
  }

  //Add shipped orders
  for (let i = 0; i < productCodes.length; i++) {
    let orders = report.model
      .getTable("Fact_Sales")
      .object.filterTable([productCodes[i]], "PRODUCTCODE")
      .filterTable(["Shipped"], "STATUS")
      .selectColumn("PRODUCTCODE")
      .data[0].slice(1);

    newTable[2].push(orders.length);
  }

  //Add shipped orders
  for (let i = 0; i < productCodes.length; i++) {
    let orders = report.model
      .getTable("Fact_Sales")
      .object.filterTable([productCodes[i]], "PRODUCTCODE")
      .filterTable(["Cancelled", "Disputed"], "STATUS")
      .selectColumn("PRODUCTCODE")
      .data[0].slice(1);

    newTable[3].push(orders.length);
  }

  //Save new table, create relationship
  report.importTable(newTable, "Fact_CancelInfo");
  report.createRelationship(
    "Fact_Sales",
    "PRODUCTCODE",
    "Fact_CancelInfo",
    "PRODUCTCODE"
  );

  report.addCalculatedColumn("Fact_Sales", "Shipping Time", (columns, row) =>
    Math.floor(columns["QUANTITYORDERED"][row] / 10)
  );

  //Add dummy fields for scatterplot
  report.addCalculatedColumn(
    "Fact_Sales",
    "Customer Satisfaction",
    (columns, row) =>
      Number(
        Math.max(
          Math.floor(Math.random() * 70) +
            40 -
            columns["Shipping Time"][row] * 8
        ) / 10,
        0
      ).toFixed(0)
  );
}

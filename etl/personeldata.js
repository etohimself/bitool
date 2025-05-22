function personel_data_etl() {
  //********************************************************* EXTRACT  TRANSFORM  LOAD  (ETL) STEPS ***************************************************** */
  //Add calculated column that is month start
  report.addCalculatedColumn(
    "Fact_Personel",
    "Month Start",
    (table, row) => table["Date"][row].slice(0, 8) + "01"
  );

  //Currently Active Employee's must have no exit date
  report.addCalculatedColumn(
    "Fact_Personel",
    "Currently Active",
    (table, row) =>
      table["Exit Date"][row].length >= 2 ? "" : table["Employee ID"][row]
  );

  //Currently Inctive Employee's must have no exit date
  report.addCalculatedColumn(
    "Fact_Personel",
    "Currently Inactive",
    (table, row) =>
      table["Exit Date"][row].length < 2 ? "" : table["Employee ID"][row]
  );

  //Working at the time, exit date must be empty or later than row's date
  report.addCalculatedColumn(
    "Fact_Personel",
    "Active At The Time",
    (table, row) =>
      table["Exit Date"][row].length < 2 ||
      Date.parse(table["Exit Date"][row]) > Date.parse(table["Date"][row])
        ? table["Employee ID"][row]
        : ""
  );

  //Monthly attrition, return employeeID if employee left that month
  report.addCalculatedColumn("Fact_Personel", "Left This Month", (table, row) =>
    table["Date"][row].slice(0, 8) + "01" ==
    table["Exit Date"][row].slice(0, 8) + "01"
      ? table["Employee ID"][row]
      : ""
  );

  //Tenure at the time of leaving
  report.addCalculatedColumn("Fact_Personel", "Tenurity At Exit", (table, row) =>
    table["Exit Date"][row].length >= 2
      ? Date.parse(table["Date"][row]) - Date.parse(table["Hire Date"][row]) >
        date_days(90)
        ? "Tenure"
        : "New Hire"
      : ""
  );

  //Hired this month, return employeeID if employee left that month
  report.addCalculatedColumn(
    "Fact_Personel",
    "Hired This Month",
    (table, row) =>
      table["Date"][row].slice(0, 8) + "01" ==
      table["Hire Date"][row].slice(0, 8) + "01"
        ? table["Employee ID"][row]
        : ""
  );

  //Tenured Employees, Working For 90+ Days
  report.addCalculatedColumn(
    "Fact_Personel",
    "Tenured Employee",
    (table, row) =>
      table["Active At The Time"][row].length >= 2 &&
      Date.parse(table["Date"][row]) - Date.parse(table["Hire Date"][row]) >
        date_days(90)
        ? table["Employee ID"][row]
        : ""
  );

  //Untenured Employees, Working For 90+ Days
  report.addCalculatedColumn(
    "Fact_Personel",
    "Untenured Employee",
    (table, row) =>
      table["Active At The Time"][row].length >= 2 &&
      Date.parse(table["Date"][row]) - Date.parse(table["Hire Date"][row]) <=
        date_days(90)
        ? table["Employee ID"][row]
        : ""
  );

  //Currently Tenure Employees
  report.addCalculatedColumn(
    "Fact_Personel",
    "Currently Tenure",
    (table, row) =>
      table["Exit Date"][row].length < 2 &&
      Date.parse(table["Date"][row]) - Date.parse(table["Hire Date"][row]) >
        date_days(90) //milliseconds
        ? table["Employee ID"][row]
        : ""
  );

  //Monthly Tenure attrition
  report.addCalculatedColumn(
    "Fact_Personel",
    "Monthly Tenure Attrition",
    (table, row) =>
      table["Date"][row].slice(0, 8) + "01" ==
        table["Exit Date"][row].slice(0, 8) + "01" &&
      Date.parse(table["Exit Date"][row]) -
        Date.parse(table["Hire Date"][row]) >=
        date_days(90)
        ? table["Employee ID"][row]
        : ""
  );

  //Monthly New Hire attrition
  report.addCalculatedColumn(
    "Fact_Personel",
    "Monthly Newhire Attrition",
    (table, row) =>
      table["Date"][row].slice(0, 8) + "01" ==
        table["Exit Date"][row].slice(0, 8) + "01" &&
      Date.parse(table["Exit Date"][row]) -
        Date.parse(table["Hire Date"][row]) <
        date_days(90)
        ? table["Employee ID"][row]
        : ""
  );
}

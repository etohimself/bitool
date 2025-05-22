function Model(parent) {
  this.parent = parent;
  this.tables = [];
  this.relationships = [];
  this.bufferTables = [];
  let performanceTimer = 0;

  this.addTable = function (tableID, tableInstance) {
    this.tables.push({ tableID: tableID, object: tableInstance });
    return this.tables[this.tables.length - 1];
  };

  this.getTable = function (tableID) {
    let foundTable = this.tables.filter((x) => x.tableID == tableID);
    return foundTable.length ? foundTable[0] : null;
  };

  this.getBufferTable = function (tableID) {
    let foundTable = this.bufferTables.filter((x) => x.tableID == tableID)[0];
    return foundTable || null;
  };

  this.addRelationship = function (from, primarykey, to, foreignkey) {
    this.relationships.push({ from, primarykey, to, foreignkey });
  };

  this.loadBuffer = function () {
    this.bufferTables = this.tables.map((x) => {
      return { tableID: x.tableID, object: x.object.copy() };
    });
  };

  this.applyFilters = function (tableID, valueArr, field) {
    //Return if there is no table in the buffer
    if (!this.bufferTables.length) return;

    //Apply the filter to the target table
    this.bufferTables = this.bufferTables.map((x) =>
      x.tableID == tableID
        ? { tableID: x.tableID, object: x.object.filterTable(valueArr, field) }
        : x
    );

    //Propogate with depth first search algorithm
    let visited = [];
    let stack = [];

    visited.push(tableID);
    stack.push(tableID);

    while (stack.length > 0) {
      let lastTableInStack = stack[stack.length - 1];

      let availableRelations = this.relationships.filter(
        (rel) => rel.from == lastTableInStack && !visited.includes(rel.to)
      );

      if (availableRelations.length) {
        let source = lastTableInStack;
        let target = availableRelations[0].to;
        let primaryKey = availableRelations[0].primarykey;
        let foreignKey = availableRelations[0].foreignkey;
        //Retrieve primary key values, these will match with the foreignKey values in target table
        let primaryKeyValues = [
          ...new Set(
            this.getBufferTable(source)
              .object.selectColumn(primaryKey)
              .data[0].slice(1)
          ),
        ];

        //Apply filter by array to target table
        this.bufferTables = this.bufferTables.map((x) =>
          x.tableID == target
            ? {
                tableID: x.tableID,
                object: x.object.filterTable(primaryKeyValues, foreignKey),
              }
            : x
        );

        //We are done
        visited.push(target);
        stack.push(target);
      } else {
        //No more relationships available, propagation step ended
        stack.pop();
      }
    }
  };

  this.aggregate = function (desiredColumn, aggrMethod) {
    let result = 0;
    let columnData = desiredColumn.filter((x) => x != ""); //Eliminate blanks by default
    if (aggrMethod == "SUM") {
      for (k = 0; k < columnData.length; k++) {
        result += Number(columnData[k]);
      }
    } else if (aggrMethod == "AVERAGE") {
      if (!columnData.length) {
        result = 0;
      } else {
        for (k = 0; k < columnData.length; k++) {
          result += Number(columnData[k]);
        }
        result = (result / columnData.length).toFixed(2);
      }
    } else if (aggrMethod == "COUNT") {
      result = columnData.length;
    } else if (aggrMethod == "FIRST") {
      result = columnData[0];
    } else if (aggrMethod == "LAST") {
      result = columnData[columnData.length - 1];
    } else if (aggrMethod == "MAX") {
      result = Math.max(...columnData.map((x) => Number(x)));
    } else if (aggrMethod == "MIN") {
      result = Math.min(...columnData.map((x) => Number(x)));
    } else if (aggrMethod == "COUNTDISTINCT") {
      result = [...new Set(columnData)].length;
    }
    return result;
  };

  this.sortResponse = function (arr, header, order) {
    let rawArr = JSON.parse(JSON.stringify(arr)); //deep copy
    //Find the column to sort  by header name
    let colIndex;
    for (let i = 0; i < rawArr.length; i++) {
      if (rawArr[i][0] == header) {
        colIndex = i;
      }
    }

    //Transpose data from rows to columns
    let transposedArray = [];
    for (let i = 0; i < rawArr[0].length; i++) {
      let rowArr = [];
      for (let j = 0; j < rawArr.length; j++) {
        rowArr.push(rawArr[j][i]);
      }
      transposedArray.push(rowArr);
    }
    //Split body and headers
    let headerArr = transposedArray[0];
    let bodyArr = transposedArray.slice(1);
    let firstNonBlank = null;
    for (let i = 1; i < rawArr[colIndex].length; i++) {
      if (rawArr[colIndex][i] != null) {
        firstNonBlank = rawArr[colIndex][i];
        break;
      }
    }

    //If data type is Date
    if (isDate(firstNonBlank)) {
      //Sort dates
      bodyArr.sort((a, b) =>
        order == "descending"
          ? Date.parse(b[colIndex]) - Date.parse(a[colIndex])
          : Date.parse(a[colIndex]) - Date.parse(b[colIndex])
      );
    }
    //If data type is Number
    else if (isNumber(firstNonBlank)) {
      //Sort numbers
      bodyArr.sort((a, b) =>
        order == "descending"
          ? b[colIndex] - a[colIndex]
          : a[colIndex] - b[colIndex]
      );
    }
    //If data type is String
    else {
      bodyArr.sort(); //sorts a to z by default
      if (order == "descending") bodyArr.reverse();
    }

    //Merge headers and body
    let mergedArr = [headerArr, ...bodyArr];
    let finalFormat = [];

    //Transpose into row format again
    for (let col = 0; col < mergedArr[0].length; col++) {
      let bufferCol = [];
      for (let row = 0; row < mergedArr.length; row++) {
        bufferCol.push(mergedArr[row][col]);
      }
      finalFormat.push(bufferCol);
    }
    //Return sorted array
    return finalFormat;
  };

  this.sortValues = function (arr, order) {
    let rawArr = JSON.parse(JSON.stringify(arr)); //deep copy
    //If data type is Date
    if (isDate(rawArr[1]) || isNumber(rawArr[1])) {
      rawArr.sort((a, b) =>
        order == "descending"
          ? Date.parse(b) - Date.parse(a)
          : Date.parse(a) - Date.parse(b)
      );
    } else {
      //Sort strings
      rawArr.sort(); //sorts a to z by default
      if (order == "descending") rawArr.reverse();
    }
    return rawArr;
  };

  this.evaluateMeasure = function (field) {
    let calculatedExpression = field.expression;
    let functionsToEvaluate = [
      "SUM",
      "AVERAGE",
      "COUNTDISTINCT",
      "COUNT",
      "MIN",
      "MAX",
      "FIRST",
      "LAST",
    ];
    let calculationSteps = 0;

    for (let i = 0; i < functionsToEvaluate.length; i++) {
      while (
        this.evalFormula(
          String(calculatedExpression),
          functionsToEvaluate[i]
        ) != calculatedExpression
      ) {
        calculationSteps++;
        let oldExp = calculatedExpression;
        calculatedExpression = this.evalFormula(
          String(calculatedExpression),
          functionsToEvaluate[i]
        );
        /* Uncomment to see expression evaluation steps
        console.log(
          `[${calculationSteps}] ${oldExp} ===> ${calculatedExpression}`
        ); */
      }
    }

    let nonMathCharacters = calculatedExpression.match(
      /[^1-9+0+\(+\)+\*+\/+\++\-+\s]/
    );

    if (nonMathCharacters) {
      //Cannot evaluate, non matchmatical characters exist

      return calculatedExpression;
    } else {
      //This might be evaluated
      let evaluatedValue;
      let errorFound = 0;
      try {
        evaluatedValue = eval(calculatedExpression);
      } catch (e) {
        console.error(
          "ERROR : There is a problem with your field expression. Please check sytnax, table and field names."
        );
        errorFound = 1;
      }
      return !errorFound ? evaluatedValue : null;
    }
  };

  this.evalFormula = function (expression, aggrFunction) {
    //aggFunction = SUM, AVERAGE, MIN, MAX, FIRST, LAST, COUNT, DISTINCTCOUNT
    let functionStartStr = aggrFunction + "(";
    let functionEndStr = ")";

    //Try to find the start of function
    let startFound = expression.indexOf(functionStartStr);
    if (startFound < 0) return expression; //function doesn't exist, return expression unchanged

    //Try to find the end of function AFTER the start keywords
    let endFoundAfterStart = expression
      .slice(startFound + functionStartStr.length)
      .indexOf(functionEndStr);
    if (endFoundAfterStart < 0) return expression; //function doesn't exist, return expression unchanged
    if (endFoundAfterStart < 1) return expression; //if function parameter is empty, return expression unchanged

    //Find the absolute position of the end string
    let endFound = startFound + functionStartStr.length + endFoundAfterStart;
    //Extract the string between which are function parameters
    let stringBetween = expression.slice(
      startFound + functionStartStr.length,
      endFound
    );

    //Extract table name and field name from function parameter
    let fieldStart = "[";
    let fieldEnd = "]";
    //Try to find the start of field
    let fieldStartFound = stringBetween.indexOf(fieldStart);
    if (fieldStartFound < 0) return expression; //If field start is not found, return expression unchanged
    if (fieldStartFound < 1) return expression; //If table name is missing, return unchanged (writing extra line so its easy to understand)

    //Try to find the end of field AFTER the start character
    let fieldEndFoundAfterStart = stringBetween
      .slice(fieldStartFound + fieldStart.length)
      .indexOf(fieldEnd);
    if (fieldEndFoundAfterStart < 0) return expression; //If field end is not found, return expression unchanged
    if (fieldEndFoundAfterStart < 1) return expression; //If field name is empty, return expression unchanged

    //Find the absolute position of end character
    let fieldEndFound =
      fieldStartFound + fieldStart.length + fieldEndFoundAfterStart;

    //Extract the table name and the field names
    let tableName = stringBetween.slice(0, fieldStartFound);
    let fieldName = stringBetween.slice(
      fieldStartFound + fieldStart.length,
      fieldEndFound
    );

    //Now we can aggregate
    let targetTable = this.getBufferTable(tableName);
    if (targetTable == null) return expression; //No such table, return expression unchanged
    let targetColumn = targetTable.object.selectColumn(fieldName);
    if (targetColumn == null) return expression; //No such column, return expression unchanged

    //Calculate a single value
    let dataBody = targetColumn.data[0].slice(1);
    let aggregatedValue = this.aggregate(dataBody, aggrFunction);

    //Replace the original expression with new value and return
    return (
      expression.slice(0, startFound) +
      String(aggregatedValue) +
      expression.slice(endFound + 1)
    );
  };

  this.query = function (
    uniqueID,
    rowField,
    columnField,
    valueFields,
    filterContext,
    sortAlias,
    sortOrder
  ) {
    performanceTimer = 0;

    let distinctRows = [];
    let distinctColumns = [];
    let valueColumns = [];

    this.loadBuffer();

    for (let k = 0; k < filterContext.length; k++) {
      this.applyFilters(
        filterContext[k].tableID,
        filterContext[k].values,
        filterContext[k].fieldName
      );
    }

    //Process queries that consist of row and value(s)
    if (!columnField && rowField && valueFields) {
      //Get distinct row values
      distinctRows = [
        ...new Set(
          this.getBufferTable(rowField.tableID)
            .object.selectColumn(rowField.fieldName)
            .data[0].slice(1)
        ),
      ];

      //Each value represents a column in the final format, therefore loop through values
      for (let i = 0; i < valueFields.length; i++) {
        //Prepare empty columns for each value
        valueColumns.push([]);

        //For each distinct value in the rows
        for (let j = 0; j < distinctRows.length; j++) {
          //Load the buffer from original tables and apply filters from the page
          this.loadBuffer();

          //Apply filter context (filters from the page)
          for (let k = 0; k < filterContext.length; k++) {
            this.applyFilters(
              filterContext[k].tableID,
              filterContext[k].values,
              filterContext[k].fieldName
            );
          }

          //Apply row context
          this.applyFilters(
            rowField.tableID,
            [distinctRows[j]],
            rowField.fieldName
          );

          //Evaluate expression and push to valueColumns
          valueColumns[i].push(this.evaluateMeasure(valueFields[i]));
        }
      }

      //Prepare response before sorting
      let response = [];
      response.push([rowField.alias, ...distinctRows]);
      for (let i = 0; i < valueFields.length; i++) {
        response.push([valueFields[i].alias, ...valueColumns[i]]);
      }

      //Sort response before sending to visual
      let containsAlias = 0;
      for (let i = 0; i < response.length; i++) {
        if (response[i][0] == sortAlias) {
          containsAlias = 1;
        }
      }
      if (containsAlias) {
        response = this.sortResponse(response, sortAlias, sortOrder);
      }

      //Send response to the visual
      return response;
    }
    //Process queries with row, column and single value
    else if (columnField && rowField && valueFields) {
      //Get distinct row values
      distinctRows = [
        ...new Set(
          this.getBufferTable(rowField.tableID)
            .object.selectColumn(rowField.fieldName)
            .data[0].slice(1)
        ),
      ];
      //Get distinct column values
      distinctColumns = [
        ...new Set(
          this.getBufferTable(columnField.tableID)
            .object.selectColumn(columnField.fieldName)
            .data[0].slice(1)
        ),
      ];
      //Sort columns if requested here, before calculating the value for each column and row
      if (sortAlias == columnField.alias) {
        distinctColumns = this.sortValues(distinctColumns, sortOrder);
      }
      //For each distinct row value
      for (let i = 0; i < distinctColumns.length; i++) {
        //Add empty columns for values
        valueColumns.push([]);
        //For each column
        for (let j = 0; j < distinctRows.length; j++) {
          //Refresh the buffer from original tables and filters from the page
          this.loadBuffer();
          for (let m = 0; m < filterContext.length; m++) {
            this.applyFilters(
              filterContext[m].tableID,
              filterContext[m].values,
              filterContext[m].fieldName
            );
          }
          //Apply column context
          this.applyFilters(
            columnField.tableID,
            [distinctColumns[i]],
            columnField.fieldName
          );
          //Apply row context
          this.applyFilters(
            rowField.tableID,
            [distinctRows[j]],
            rowField.fieldName
          );

          //Evaluate expression and push to valueColumns
          valueColumns[i].push(this.evaluateMeasure(valueFields[0]));
        }
      }
      //Prepare response before sorting
      let response = [];
      response.push([rowField.alias, ...distinctRows]);
      for (let i = 0; i < distinctColumns.length; i++) {
        response.push([distinctColumns[i], ...valueColumns[i]]);
      }
      //Sort by rows if requested
      if (sortAlias == rowField.alias) {
        response = this.sortResponse(response, sortAlias, sortOrder);
      }

      return response;
    }
    //Process only value requests
    else if (!rowField && !columnField && valueFields) {
      this.loadBuffer();
      //Apply filter context (filters from the page)
      for (let k = 0; k < filterContext.length; k++) {
        this.applyFilters(
          filterContext[k].tableID,
          filterContext[k].values,
          filterContext[k].fieldName
        );
      }

      return this.evaluateMeasure(valueFields[0]);
    }
  };
}

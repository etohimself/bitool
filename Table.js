function Table(dataArray, transposeArray) {
  //Store a deep copy of the passed array
  this.data = [...dataArray.map((x) => [...x])];

  //Select column method returns a new Table object with single column
  this.selectColumn = function (columnName) {
    let foundCol = this.data.filter((col) => col[0] == columnName);
    if (foundCol.length) return new Table([foundCol[0]], 0);
    return null;
  };

  //Filter table method returns a new Table object containing only the provided values in target field
  //After performance analysis, filterTable method seems to be the bottleneck. Converting the lookup array to a set and
  //using .has() method for faster lookup has increased performance by 6x

  this.filterTable = function (valueArr, fieldName) {
    //Find target column's index
    let colIndex = null;
    for (let col = 0; col < this.data.length; col++) {
      if (this.data[col][0] == fieldName) {
        colIndex = col;
        break;
      }
    }

    let valueSet = new Set(valueArr); //performance fix (6x performance increase!!!!)

    //Create an empty table with same number of columns
    let filteredTable = [];
    for (let col = 0; col < this.data.length; col++) {
      filteredTable.push([]);
    }
    //Push headers and the matching rows to new table array
    for (let col = 0; col < this.data.length; col++) {
      for (let row = 0; row < this.data[0].length; row++) {
        if (row == 0) {
          //Push headers without filtering
          filteredTable[col].push(this.data[col][row]);
        } else {
          //Push current value if the value at filtered column's current row is included in valueArr
          if (valueSet.has(this.data[colIndex][row])) {
            filteredTable[col].push(this.data[col][row]);
          }
        }
      }
    }
    return new Table(
      filteredTable.map((x) => [...x]), //Return a deep copy
      0
    );
  };

  //Copy method returns a new Table with same data
  this.copy = function () {
    return new Table(
      this.data.map((x) => x.slice()),
      0
    );
  };

  //Detect Date's and convert to ISO8601 Date Format
  if (this.data.length >= 2 && transposeArray) {
    //Skip if table is empty
    for (let col = 0; col < this.data[0].length; col++) {
      //Find the first non blank value
      let firstNonBlank = null;
      for (let j = 1; j < this.data.length; j++) {
        if (this.data[j][col] != "") firstNonBlank = this.data[j][col];
      }

      //This column is not date, continue to next column
      if (!isDate(firstNonBlank)) continue;

      //Try splitting by common delimiters
      let splitters = [".", "-", "/"];
      for (let sp = 0; sp < splitters.length; sp++) {
        //Split by delimiter, push to array
        let splitArr = [];
        for (let row = 1; row < this.data.length; row++) {
          splitArr.push(this.data[row][col].split(splitters[sp]));
        }

        //Check if all rows have 3 parts, this will not be true for all delimiters
        let all3Parts = 1;
        for (let i = 0; i < splitArr.length; i++) {
          if (splitArr[i].length != 3 && splitArr[i][0] != "") all3Parts = 0;
        }
        if (!all3Parts) continue; //skip to next delimiter

        //Try to detect year column by length
        let yearIndex = null;
        //Check if one part is always 4 length (year)
        for (let i = 0; i < 3; i++) {
          //Each part
          let allRow4Length = 1;
          for (let j = 0; j < splitArr.length; j++) {
            //Each row
            if (splitArr[j][0] != "") {
              //skip if empty
              if (splitArr[j][i].length != 4) {
                allRow4Length = 0;
              }
            }
          }
          if (allRow4Length) {
            //We found the year part
            yearIndex = i;
            break;
          }
        }

        if (!yearIndex) continue; //Skip to next delimiter

        //Try to detect day column by values exceeding 12 as months cannot
        let dayIndex = null;
        for (let i = 0; i < 3; i++) {
          //for each column
          for (let j = 0; j < splitArr.length; j++) {
            //each row
            if (i != yearIndex) {
              //skip year column, test day and month
              if (Number(splitArr[j][i] > 12)) {
                //If there is a value larger than 12, must be day
                dayIndex = i;
              }
            }
          }
        }

        //If day column cannot be found, pick the last remaining column
        //Warn the user as we might be mixing day and month columns, there is no way to tell
        if (dayIndex == null) {
          dayIndex = [0, 1, 2].filter((x) => x != yearIndex)[1];
          console.error(
            "WARNING : Your date column in ambigious. Make sure the order is yyyy mm dd format."
          );
        }

        //Remaining column must be month column
        let monthIndex = [0, 1, 2].filter(
          (x) => x != yearIndex && x != dayIndex
        )[0];

        //Reorganize year month and day into ISO8601 format
        let isoDates = [];
        for (let i = 0; i < splitArr.length; i++) {
          if (splitArr[i][0] == "") {
            //Skip blanks
            isoDates.push("");
          } else {
            //for each row
            let yearStr = splitArr[i][yearIndex];
            let monthStr =
              (splitArr[i][monthIndex].length < 2 ? "0" : "") +
              splitArr[i][monthIndex];
            let dayStr =
              (splitArr[i][dayIndex].length < 2 ? "0" : "") +
              splitArr[i][dayIndex];

            let dateString = `${yearStr}-${monthStr}-${dayStr}`;
            isoDates.push(dateString);
          }
        }

        //Replace values in the current column with ISO8601s
        for (let row = 1; row < this.data.length; row++) {
          this.data[row][col] = isoDates[row - 1];
        }
      }
    }

    //Finally transpose
    let transposedArray = [];
    for (let col = 0; col < this.data[0].length; col++) {
      let colArr = [];
      for (let row = 0; row < this.data.length; row++) {
        colArr.push(this.data[row][col]);
      }
      transposedArray.push(colArr);
    }
    this.data = transposedArray.map((x) => [...x]); //deep copy
  }
}

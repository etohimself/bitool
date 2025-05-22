function Matrix(
  uniqueID,
  coordX,
  coordY,
  visualWidth,
  visualHeight,
  parent,
  colorPalette,
  bgColor
) {
  //Public variables
  this.uniqueID = uniqueID;
  this.coordX = coordX;
  this.coordY = coordY;
  this.visualWidth = visualWidth;
  this.visualHeight = visualHeight;
  this.parent = parent;
  this.framed = true;
  this.priority = false;
  this.colorPalette = colorPalette;

  //Private variables
  let myCanvas = null;
  let myData = [];
  let highlightRows = 1;
  let visualPadding = 1;
  let valueTextSize = 11;
  let cellPadding = 5;
  let visualBgColor = bgColor;
  let headerFill = colorPalette[1];
  let headerColor = "white";
  let valueFill = "white";
  let valueColor = "black";
  let columnFill = colorPalette[2];
  let columnColor = "white";
  let cellGap = 2;
  let columnWidths = [];
  let rowHeights = null;
  let yOffset = 0;
  let xOffset = 0;
  let actualWidth = null;
  let actualHeight = null;
  let visualBorderColor = "lightgray";
  let visualBorderWidth = 1;
  let horizontal_barLength = null;
  let vertical_barPosition = 0;
  let horizontal_barPosition = 0;
  let vertical_barLength = null;
  let scrollbarWidth = 10;
  let scrollBarBackground = (233, 233, 233);
  let scrollBarFill = (200, 200, 200);
  let scrollBarActive = (150, 150, 150);
  let lastMouseX = null;
  let lastMouseY = null;
  let fetchRequired = 1;
  let rowField = null;
  let columnField = null;
  let valueFields = [];
  let lastCanvasHeight;
  let lastCanvasWidth;
  let sortAlias = "";
  let sortOrder = "";

  //Public function to add row and value fields to the visual
  this.addValue = function (alias = "Dimension", expression, format) {
    valueFields.push({
      alias,
      expression,
      format,
    });
    fetchRequired = 1;

    return this; //return this instance
  };

  this.addRow = function (alias = "Row Values", tableID, fieldName) {
    rowField = { alias, tableID, fieldName };
    fetchRequired = 1;
    return this;
  };

  this.addColumn = function (alias = "Colum Values", tableID, fieldName) {
    columnField = { alias, tableID, fieldName };
    fetchRequired = 1;
    return this;
  };

  this.sortBy = function (rowOrFieldAlias, ascendingOrDescending) {
    sortAlias = rowOrFieldAlias;
    sortOrder = ascendingOrDescending;
    fetchRequired = 1;
  };

  //Private function to set vertical scroll position
  this.setScrollY = function (newValue) {
    yOffset = -constrain(
      newValue,
      0,
      actualHeight - this.visualHeight + scrollbarWidth
    );
    vertical_barPosition = (-yOffset * this.visualHeight) / actualHeight;
  };

  //Private function to set horizontal scroll position
  this.setScrollX = function (newValue) {
    xOffset = -constrain(
      newValue,
      0,
      actualWidth - this.visualWidth + scrollbarWidth
    );
    horizontal_barPosition = (-xOffset * this.visualWidth) / actualWidth;
  };

  //Private function to calculate column widths and store in local array variable
  this.getColumnWidth = function (colIndex) {
    let longestString = "";
    for (let i = 0; i < myData[colIndex].length; i++) {
      if (String(myData[colIndex][i]).length > longestString.length) {
        longestString = myData[colIndex][i];
      }
    }
    textSize(valueTextSize);
    return 2 * cellPadding + textWidth(longestString);
  };

  this.fetch = function () {
    if (!fetchRequired) return;
    //Create buffered graphics
    if (
      !myCanvas ||
      this.visualWidth != lastCanvasWidth ||
      this.visualHeight != lastCanvasHeight
    ) {
      lastCanvasWidth = this.visualWidth;
      lastCanvasHeight = this.visualHeight;
      myCanvas = createGraphics(this.visualWidth, this.visualHeight);
    }

    if (!rowField || !valueFields.length) return;

    //Display loading text..
    myCanvas.background(visualBgColor);
    myCanvas.text(
      "Loading..",
      xOffset + visualPadding,
      yOffset + visualPadding + valueTextSize
    );

    //Query the parent page to fetch data, pass this visual's fields
    myData = this.parent.query(
      uniqueID,
      rowField,
      columnField,
      valueFields,
      [], //remove filters
      sortAlias,
      sortOrder
    );

    //Format values
    if (columnField) {
      for (let i = 1; i < myData.length; i++) {
        for (let j = 1; j < myData[i].length; j++) {
          myData[i][j] = formatValue(myData[i][j], valueFields[0].format);
        }
      }
    } else {
      for (let i = 1; i < myData.length; i++) {
        for (let j = 1; j < myData[i].length; j++) {
          myData[i][j] = formatValue(myData[i][j], valueFields[i - 1].format);
        }
      }
    }

    //Calculate column widths
    columnWidths = [];
    for (let i = 0; i < myData.length; i++) {
      columnWidths.push(this.getColumnWidth(i));
    }

    //Calculate row heights
    rowHeights = 2 * cellPadding + valueTextSize;

    //Calculate actual table width (might be larger than visible area)
    let buffer = 0;
    for (let i = 0; i < columnWidths.length; i++) {
      buffer += columnWidths[i] + cellGap;
    }
    actualWidth = 2 * visualPadding + buffer;

    //Calculate actual table height (might be larger than visible area)
    actualHeight =
      2 * visualPadding + myData[0].length * (rowHeights + cellGap);

    //Calculate scrollbar lengths
    horizontal_barLength =
      ((this.visualWidth - scrollbarWidth) / actualWidth) *
      (this.visualWidth - scrollbarWidth);
    vertical_barLength =
      ((this.visualHeight - scrollbarWidth) / actualHeight) *
      (this.visualHeight - scrollbarWidth);

    //Reset scrolls
    this.setScrollX(0);
    this.setScrollY(0);

    fetchRequired = 0;
  };

  this.drawHorizontalScrollBar = function () {
    if (fetchRequired) return;
    if (this.visualWidth - scrollbarWidth >= actualWidth) return;

    //Draw horizontal scrollbar
    myCanvas.fill(scrollBarBackground);
    myCanvas.rect(
      0,
      this.visualHeight - scrollbarWidth,
      this.visualWidth,
      scrollbarWidth
    );

    myCanvas.stroke(this.hScrollBarPressed ? scrollBarActive : scrollBarFill);
    myCanvas.fill(this.hScrollBarPressed ? scrollBarActive : scrollBarFill);
    myCanvas.rect(
      horizontal_barPosition,
      this.visualHeight - scrollbarWidth * 0.8,
      horizontal_barLength,
      scrollbarWidth * 0.6
    );
  };

  this.drawVerticalScrollBar = function () {
    if (fetchRequired) return;
    if (this.visualHeight - scrollbarWidth >= actualHeight) return;

    //Draw vertical scrollbar
    myCanvas.noStroke();
    myCanvas.fill(scrollBarBackground);
    myCanvas.rect(
      this.visualWidth - scrollbarWidth,
      0,
      scrollbarWidth,
      this.visualHeight
    );

    myCanvas.stroke(this.vScrollBarPressed ? scrollBarActive : scrollBarFill);
    myCanvas.fill(this.vScrollBarPressed ? scrollBarActive : scrollBarFill);
    myCanvas.rect(
      this.visualWidth - scrollbarWidth * 0.8,
      vertical_barPosition,
      scrollbarWidth * 0.6,
      vertical_barLength
    );
  };

  this.mouseEvents = function () {
    if (fetchRequired) return;
    if (
      parent.visuals.filter((x) => x.priority && x.uniqueID != this.uniqueID)
        .length
    )
      return; //Some other visual has priority over mouse actions, return

    if (mouseIsPressed) {
      //Check mouse for scroll events
      let visualX = mouseX - this.coordX;
      let visualY = mouseY - this.coordY;

      //Check if mouse is pressed on horizontal scrollbar
      if (
        this.visualWidth - scrollbarWidth < actualWidth &&
        !(
          visualX < horizontal_barPosition ||
          visualX > horizontal_barPosition + horizontal_barLength
        ) &&
        !(
          visualY < this.visualHeight - scrollbarWidth ||
          visualY > this.visualHeight
        ) &&
        !this.hScrollBarPressed &&
        !this.vScrollBarPressed
      ) {
        this.hScrollBarPressed = 1;
      }

      //Check if mouse is pressed on vertical scrollbar
      if (
        this.visualHeight - scrollbarWidth < actualHeight &&
        !(
          visualY < vertical_barPosition ||
          visualY > vertical_barPosition + vertical_barLength
        ) &&
        !(
          visualX < this.visualWidth - scrollbarWidth ||
          visualX > this.visualWidth
        ) &&
        !this.hScrollBarPressed &&
        !this.vScrollBarPressed
      ) {
        this.vScrollBarPressed = 1;
      }
    } else {
      this.vScrollBarPressed = 0;
      this.hScrollBarPressed = 0;
    }

    //Check if mouse moved
    if (lastMouseX != mouseX) {
      //Handle dragging horizontal scroll bar
      if (this.hScrollBarPressed) {
        let diff = mouseX - lastMouseX;
        if (diff > 0) {
          this.setScrollX(
            -xOffset +
              (diff * (actualWidth - this.visualWidth + scrollbarWidth)) / //(diff * outside area / visual area)
                (this.visualWidth - horizontal_barLength)
          );
        } else if (diff < 0) {
          this.setScrollX(
            -xOffset +
              (diff * (actualWidth - this.visualWidth + scrollbarWidth)) /
                (this.visualWidth - horizontal_barLength)
          );
        }
      }
      lastMouseX = mouseX;
    }

    //Check if mouse moved
    if (lastMouseY != mouseY) {
      //Handle dragging vertical scroll bar
      if (this.vScrollBarPressed) {
        let diff = mouseY - lastMouseY;
        if (diff > 0) {
          this.setScrollY(
            -yOffset +
              (diff * (actualHeight - this.visualHeight + scrollbarWidth)) /
                (this.visualHeight - vertical_barLength)
          );
        } else if (diff < 0) {
          this.setScrollY(
            -yOffset +
              (diff * (actualHeight - this.visualHeight + scrollbarWidth)) /
                (this.visualHeight - vertical_barLength)
          );
        }
      }
      lastMouseY = mouseY;
    }
  };

  this.draw = function () {
    //Create buffered graphics
    if (
      !myCanvas ||
      this.visualWidth != lastCanvasWidth ||
      this.visualHeight != lastCanvasHeight
    ) {
      lastCanvasWidth = this.visualWidth;
      lastCanvasHeight = this.visualHeight;
      myCanvas = createGraphics(this.visualWidth, this.visualHeight);
    }

    //Styles
    myCanvas.textSize(valueTextSize);
    myCanvas.noStroke();
    //Draw Table Area
    myCanvas.fill(visualBgColor);
    myCanvas.rect(0, 0, this.visualWidth, this.visualHeight);

    //If no data fetched yet
    if (!rowField || !valueFields.length) {
      myCanvas.textSize(valueTextSize * 1.5);
      myCanvas.fill("black");
      myCanvas.text(
        "Fields Required",
        xOffset +
          (this.visualWidth - myCanvas.textWidth("Fields Required")) / 2,
        yOffset + this.visualHeight / 2
      );
    }

    //Draw columns and rows
    for (
      //For each column
      let currentColumn = 0;
      currentColumn < myData.length;
      currentColumn++
    ) {
      for (
        //For each row in that column
        let currentRow = 0;
        currentRow < myData[currentColumn].length;
        currentRow++
      ) {
        //Calculate position of the current cell
        let cellX = visualPadding + xOffset;
        let cellY = visualPadding + yOffset;

        //Shift the current cell according to previous columns
        for (let i = 0; i < currentColumn; i++) {
          cellX += columnWidths[i] + cellGap;
        }

        //Shift the current cell according to previous rows
        for (let i = 0; i < currentRow; i++) {
          cellY += rowHeights + cellGap;
        }

        //Use different colors for headers vs. values
        myCanvas.fill(
          currentRow == 0
            ? headerFill
            : currentColumn == 0 && highlightRows
            ? columnFill
            : valueFill
        );
        myCanvas.rect(cellX, cellY, columnWidths[currentColumn], rowHeights);

        myCanvas.fill(
          currentRow == 0
            ? headerColor
            : currentColumn == 0 && highlightRows
            ? columnColor
            : valueColor
        );

        let valueTxt = myData[currentColumn][currentRow];
        if (currentColumn > 0 && currentRow > 0) {
          if (columnField) {
            if (
              valueFields[0].format == "integer" ||
              valueFields[0].format == "double"
            ) {
              valueTxt = Number(valueTxt).toLocaleString("en-US");
            }
          } else {
            if (
              valueFields[currentColumn - 1].format == "integer" ||
              valueFields[currentColumn - 1].format == "double"
            ) {
              valueTxt = Number(valueTxt).toLocaleString("en-US");
            }
          }
        }

        myCanvas.text(
          valueTxt,
          cellX + cellPadding,
          cellY + cellPadding + valueTextSize
        );
      }
    }

    //Draw table border
    myCanvas.noFill();
    myCanvas.stroke(visualBorderColor);
    myCanvas.strokeWeight(visualBorderWidth);
    myCanvas.rect(
      0,
      0,
      this.visualWidth - visualBorderWidth,
      this.visualHeight - visualBorderWidth
    );

    this.drawHorizontalScrollBar();
    this.drawVerticalScrollBar();
  };

  this.mouseWheel = function (event) {
    //A visual's mouseWheel method is only triggered by the page if mouse is over that visual
    //console.log(event.delta);
    this.setScrollY(-yOffset + event.delta);
  };

  this.refresh = function () {
    fetchRequired = 1;
  };

  //Render function called in loop
  this.render = function () {
    this.fetch();
    this.draw();
    this.mouseEvents();
    return myCanvas;
  };
}

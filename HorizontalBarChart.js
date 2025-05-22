function HorizontalBarChart(
  uniqueID,
  title,
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
  this.title = title;
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
  let titleSize = 18;
  let gapAfterTitle = 20;
  let myData = [];
  let minBarHeight = 30;
  let maxBarHeight = 50;
  let barGap = 5;
  let labelGap = 5;
  let visualPadding = 30;
  let labelSize = 11;
  let visualBgColor = bgColor;
  let yOffset = 0;
  let actualHeight = null;
  let viewableHeight = null;
  let actualWidth = null;
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
  let barBounds = [];

  //let columnField = null;  not available for now
  let valueFields = [];
  let lastCanvasHeight;
  let lastCanvasWidth;
  let sortAlias = "";
  let sortOrder = "";
  let yValues;
  let xValues;
  let chartAreaLeft;
  let chartAreaTop;
  let chartAreaRight;
  let chartAreaBottom;
  let chartAreaWidth;
  let chartAreaHeight;
  let breakYAxis;

  let longestYAxisValue;
  let maxYAxisValueLength;
  let longestXAxisValue;
  let maxXAxisValueLength;

  let xMax;
  let xMin;
  let barAreaTop;
  let barAreaLeft;
  let barAreaWidth;
  let xAxisAreaHeight;
  let barHeight;
  let yLabelsBetween;
  let remainingGap;

  //Public function to add row and value fields to the visual
  this.addXAxis = function (alias = "Dimension", expression, format) {
    valueFields.push({
      alias,
      expression,
      format,
    });
    fetchRequired = 1;

    return this; //return this instance
  };

  this.addYAxis = function (alias = "Field", tableID, fieldName) {
    rowField = { alias, tableID, fieldName };
    fetchRequired = 1;
    return this;
  };

  /*  Not Available for Now
  this.addColumn = function (alias = "Field", tableID, fieldName) {
    columnField = { alias, tableID, fieldName };
    fetchRequired = 1;
    return this;
  };
  */

  this.sortBy = function (rowOrFieldAlias, ascendingOrDescending) {
    sortAlias = rowOrFieldAlias;
    sortOrder = ascendingOrDescending;
    fetchRequired = 1;
  };

  //Private function to set vertical scroll position
  this.setScrollY = function (newValue) {
    yOffset = -constrain(newValue, 0, actualHeight - viewableHeight);
    vertical_barPosition =
      (-yOffset * (this.visualHeight - vertical_barLength)) /
      (actualHeight - viewableHeight); //(-yOffset * viewableHeight) / actualHeight;
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

    //Query the parent page to fetch data, pass this visual's fields
    myData = this.parent.query(
      uniqueID,
      rowField,
      null, //no column field allowed for bar chart, at least for midterms
      valueFields,
      [], //remove filters
      sortAlias,
      sortOrder
    );

    //Format values
    for (let i = 0; i < valueFields.length; i++) {
      for (let j = 1; j < myData[0].length; j++) {
        myData[i + 1][j] = formatValue(myData[i + 1][j], valueFields[i].format);
      }
    }


    fetchRequired = 0;
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

    //Draw table area
    myCanvas.noStroke();
    myCanvas.fill(visualBgColor);
    myCanvas.rect(0, 0, this.visualWidth, this.visualHeight);

    //If no data fetched yet
    if (!rowField || !valueFields.length) {
      myCanvas.textStyle("normal");
      myCanvas.textSize(labelSize * 1.5);
      myCanvas.fill(colorPalette[0]);
      myCanvas.text(
        "Fields Required",
        (this.visualWidth - myCanvas.textWidth("Fields Required")) / 2,
        yOffset + this.visualHeight / 2
      );
      return;
    }

    //Calculate important positions and sizes
    yValues = myData[0].slice(1);
    xValues = myData[1].slice(1);
    chartAreaLeft = visualPadding;
    chartAreaTop = visualPadding + titleSize + gapAfterTitle;
    chartAreaRight = this.visualWidth - visualPadding - scrollbarWidth;
    chartAreaBottom = this.visualHeight - visualPadding;
    chartAreaWidth = chartAreaRight - chartAreaLeft;
    chartAreaHeight = chartAreaBottom - chartAreaTop;
    breakYAxis = 0;

    myCanvas.textSize(labelSize);
    longestYAxisValue = [...yValues].sort((a, b) => b.length - a.length)[0];
    maxYAxisValueLength = myCanvas.textWidth(longestYAxisValue);
    longestXAxisValue = [...xValues].sort((a, b) => b.length - a.length)[0];
    maxXAxisValueLength = myCanvas.textWidth(Math.round(longestXAxisValue));
    if (maxYAxisValueLength + labelSize * 2 > chartAreaWidth / 3) {
      maxYAxisValueLength = chartAreaWidth / 3 - labelSize * 2;
      breakYAxis = 1;
    }
    xMax = Math.max(...xValues);
    xMin = Math.min(...xValues);
    barAreaTop = chartAreaTop;
    barAreaLeft = chartAreaLeft + maxYAxisValueLength + labelSize * 2;
    barAreaWidth = chartAreaWidth - maxYAxisValueLength - labelSize * 2;
    xAxisAreaHeight = maxXAxisValueLength + labelSize * 2;
    barHeight = Math.min(
      Math.max(minBarHeight, chartAreaHeight / yValues.length - barGap),
      maxBarHeight
    );
    yLabelsBetween = Math.floor(barAreaWidth / (2 * labelSize));
    remainingGap = barAreaWidth - yLabelsBetween * 2 * labelSize + labelSize;

    actualHeight = (yValues.length - 1) * (barHeight + barGap);
    viewableHeight = chartAreaHeight - visualPadding - xAxisAreaHeight;
    vertical_barLength = (this.visualHeight * viewableHeight) / actualHeight;

    myCanvas.fill(visualBgColor);
    myCanvas.rect(chartAreaLeft, chartAreaTop, chartAreaWidth, chartAreaHeight);

    //Draw x axis values
    myCanvas.noStroke();

    //Draw bars
    barBounds = [];
    for (let i = 0; i < yValues.length; i++) {
      let currentValue = xValues[i];
      let currentBarLength = map(currentValue, 0, xMax, 0, barAreaWidth);
      let textLength = myCanvas.textWidth(currentValue);
      let drawInside =
        barAreaWidth - 100 < currentBarLength + labelSize + textLength / 2
          ? 1
          : 0;

      let currentBarColor =
        this.colorPalette[
          Math.round(
            map(xValues[i], xMin - 1, xMax, 0, this.colorPalette.length - 1) //minus 1 prevents NaN when boundaries are equal
          )
        ];

      //Bar shadow
      myCanvas.fill([170, 170, 170]);
      myCanvas.rect(
        barAreaLeft + 1.5,
        yOffset + barAreaTop + i * (barHeight + barGap) + 1.5,
        currentBarLength,
        barHeight
      );

      //Bar rectangle
      myCanvas.fill(currentBarColor);
      myCanvas.rect(
        barAreaLeft,
        yOffset + barAreaTop + i * (barHeight + barGap),
        currentBarLength,
        barHeight
      );

      //Bar value
      myCanvas.fill(
        drawInside
          ? isLightcolor(currentBarColor)
            ? "black"
            : "white"
          : this.colorPalette[0]
      );

      let valueTxt = currentValue;
      if (
        valueFields[0].format == "integer" ||
        valueFields[0].format == "double"
      ) {
        valueTxt = Number(valueTxt).toLocaleString("en-US");
      }

      myCanvas.text(
        valueTxt,
        barAreaLeft +
          currentBarLength +
          labelSize / 2 -
          (drawInside ? labelSize + textLength : 0),
        yOffset + barAreaTop + i * (barHeight + barGap) + barHeight / 2
      );

      barBounds.push({
        x: barAreaLeft,
        y: yOffset + barAreaTop + i * (barHeight + barGap),
        w: currentBarLength,
        h: barHeight,
        label: yValues[i],
        field: myData[1][0],
        value: xValues[i],
      });
    }

    //Draw y axis line
    myCanvas.stroke(this.colorPalette[0]);
    myCanvas.strokeWeight(1);
    myCanvas.line(
      barAreaLeft - labelSize,
      barAreaTop,
      barAreaLeft - labelSize,
      chartAreaBottom - xAxisAreaHeight
    );

    //Draw x axis line
    myCanvas.strokeWeight(1);
    myCanvas.line(
      barAreaLeft - labelSize,
      chartAreaBottom - xAxisAreaHeight,
      barAreaLeft + barAreaWidth,
      chartAreaBottom - xAxisAreaHeight
    );

    //Draw y axis values, break word if necessary
    myCanvas.fill(this.colorPalette[0]);
    myCanvas.noStroke();
    for (let i = 0; i < yValues.length; i++) {
      if (breakYAxis) {
        let breakAt = Math.floor(maxYAxisValueLength / myCanvas.textWidth("b"));
        let brokeDueToArea = yValues[i].slice(0, breakAt);
        //Break at the first space you see scanning from the end to start
        for (let ch = brokeDueToArea.length - 1; ch >= 0; ch--) {
          if (yValues[i][ch] == " ") {
            breakAt = ch;
            break;
          }
        }

        let secondBreakAt = Math.floor(
          maxYAxisValueLength / myCanvas.textWidth("b")
        );

        //Much more readable this way
        let row1 = yValues[i].slice(0, breakAt);
        let row2 = yValues[i].slice(breakAt, breakAt + secondBreakAt);
        myCanvas.text(
          row1,
          chartAreaLeft,
          yOffset + chartAreaTop + i * (barHeight + barGap) + labelSize
        );
        myCanvas.text(
          row2,
          chartAreaLeft,
          yOffset + chartAreaTop + i * (barHeight + barGap) + labelSize * 2
        );
      } else {
        myCanvas.text(
          yValues[i],
          chartAreaLeft,
          yOffset + chartAreaTop + i * (barHeight + barGap) + labelSize
        );
      }
    }

    //Draw x axis label area
    myCanvas.noStroke();
    myCanvas.fill(visualBgColor);
    myCanvas.rect(
      chartAreaLeft,
      chartAreaBottom - xAxisAreaHeight + 1,
      chartAreaWidth,
      xAxisAreaHeight + visualPadding
    );

    //Min X Label
    myCanvas.fill(this.colorPalette[0]);
    myCanvas.noStroke();
    myCanvas.push();
    myCanvas.translate(
      barAreaLeft - labelSize,
      chartAreaBottom - xAxisAreaHeight + labelSize * 2
    );
    myCanvas.rotate(radians(45));
    myCanvas.text(0, 0, 0);
    myCanvas.pop();

    //Max X Label
    myCanvas.push();
    myCanvas.translate(
      barAreaLeft + barAreaWidth,
      chartAreaBottom - xAxisAreaHeight + labelSize * 2
    );
    myCanvas.rotate(radians(45));
    myCanvas.text(xMax, 0, 0);
    myCanvas.pop();

    //X Labels Between
    for (let i = 0; i < yLabelsBetween; i++) {
      let curX =
        barAreaLeft -
        labelSize +
        labelSize / 2 +
        remainingGap / 2 +
        i * labelSize * 2 +
        labelSize / 2;

      let curValue = Math.round(
        map(curX, barAreaLeft - labelSize, barAreaLeft + barAreaWidth, 0, xMax)
      );

      myCanvas.push();
      myCanvas.translate(
        curX,
        chartAreaBottom - xAxisAreaHeight + labelSize * 2
      );
      myCanvas.rotate(radians(45));
      myCanvas.text(curValue, 0, 0);
      myCanvas.pop();
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

    //Draw title area
    myCanvas.fill(visualBgColor);
    myCanvas.noStroke();
    myCanvas.rect(0, 0, this.visualWidth, chartAreaTop);

    //Draw title
    myCanvas.textStyle("bold");
    myCanvas.textSize(titleSize);
    myCanvas.fill(this.colorPalette[0]);
    myCanvas.noStroke();
    myCanvas.text(
      this.title,
      this.visualWidth / 2 - myCanvas.textWidth(this.title) / 2,
      visualPadding + titleSize
    );

    //Draw vertical scroll bar
    this.drawVerticalScrollBar();
  };

  this.drawVerticalScrollBar = function () {
    if (fetchRequired) return;
    if (viewableHeight >= actualHeight) return;

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

      //Check if mouse is pressed on vertical scrollbar
      if (
        viewableHeight < actualHeight && //vertical bar exists
        !(
          visualY < vertical_barPosition ||
          visualY > vertical_barPosition + vertical_barLength
        ) &&
        !(
          visualX < this.visualWidth - scrollbarWidth ||
          visualX > this.visualWidth
        ) &&
        !this.vScrollBarPressed
      ) {
        this.vScrollBarPressed = 1;
      }
    } else {
      this.vScrollBarPressed = 0;
    }

    //Check if mouse moved
    if (lastMouseY != mouseY) {
      //Handle dragging vertical scroll bar
      if (this.vScrollBarPressed) {
        let diff = mouseY - lastMouseY;
        if (diff > 0) {
          this.setScrollY(-yOffset + (diff * actualHeight) / this.visualHeight);
        } else if (diff < 0) {
          this.setScrollY(-yOffset + (diff * actualHeight) / this.visualHeight);
        }
      }
      lastMouseY = mouseY;
    }
  };

  this.tooltip = function () {
    if (fetchRequired) return;
    if (
      parent.visuals.filter((x) => x.priority && x.uniqueID != this.uniqueID)
        .length
    )
      return; //Some other visual has priority over mouse actions, return
    if (!myData || !myData.length) return;

    let visualX = mouseX - this.coordX;
    let visualY = mouseY - this.coordY;

    for (let i = 0; i < barBounds.length; i++) {
      if (
        !(
          visualX < barBounds[i].x ||
          visualX > barBounds[i].x + barBounds[i].w ||
          visualY < barBounds[i].y ||
          visualY > barBounds[i].y + barBounds[i].h ||
          visualY > chartAreaBottom - xAxisAreaHeight
        )
      ) {
        //User is hovering over a bar

        textSize(labelSize);
        //Calculate rectangle size from text widths
        textStyle("bold");
        let valueLength = textWidth(`${barBounds[i].label} : `);
        let fieldNameLength = textWidth(`${barBounds[i].field}`);
        textStyle("normal");
        valueLength += textWidth(`${barBounds[i].value}`);

        //Shift the tooltip to leftside if it will be hidden due to framed canvas
        let rectX = mouseX + 5;
        let rectY = mouseY + 5;
        let rectW = Math.max(fieldNameLength, valueLength) + 2 * labelSize;
        let rectH = labelSize * 3.5;

        if (rectX + rectW > actualWidth) {
          rectX -= rectW + 10;
        }

        //Highlight the hovered bar
        fill([255, 255, 255, 50]);
        rect(
          this.coordX + barBounds[i].x,
          this.coordY + barBounds[i].y,
          barBounds[i].w,
          barBounds[i].h
        );

        //Draw the tooltip rectangle
        stroke(1);
        fill("white");
        rect(rectX, rectY, rectW, rectH);

        //Draw the field name
        fill(colorPalette[0]);
        textStyle("bold");
        noStroke();
        text(
          `${barBounds[i].field}`,
          rectX + labelSize, //padding is 1 labelsize
          rectY + labelSize * 1.5 //padding is half labelSize plus text's own height
        );

        //Draw the first part of the text (label)
        fill(colorPalette[0]);
        textStyle("bold");
        noStroke();
        text(
          `${barBounds[i].label} : `,
          rectX + labelSize, //padding is 1 labelsize
          rectY + labelSize * 2.5 //padding is half labelSize plus text's own height
        );

        //Draw the second part of the text (value)
        tmpLen = textWidth(`${barBounds[i].label} : `);
        textStyle("normal");
        text(
          `${barBounds[i].value}`,
          rectX + labelSize + tmpLen,
          rectY + labelSize * 2.5
        );
      }
    }
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

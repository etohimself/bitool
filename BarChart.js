function BarChart(
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
  let minBarWidth = 30;
  let maxBarWidth = 200;
  let barGap = 5;
  let labelGap = 5;
  let visualPadding = 10;
  let labelSize = 11;
  let visualBgColor = bgColor;
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
  //let columnField = null;  not available for now
  let valueFields = [];
  let lastCanvasHeight;
  let lastCanvasWidth;
  let sortAlias = "";
  let sortOrder = "";
  let barBounds = [];
  let paddingDueToYLabels;

  //Public function to add row and value fields to the visual
  this.addYAxis = function (alias = "Dimension", expression, format) {
    valueFields.push({
      alias,
      expression,
      format,
    });
    fetchRequired = 1;

    return this; //return this instance
  };

  this.addXAxis = function (alias = "Field", tableID, fieldName) {
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

    //Calculate actual bar graph height (might be larger than visible area)
    let barWidth = Math.min(
      Math.max(
        minBarWidth,
        (this.visualWidth - 2 * visualPadding) / myData[0].slice(1).length -
          barGap
      ),
      maxBarWidth
    );

    actualWidth =
      visualPadding * 2 +
      myData[0].slice(1).length * (barWidth + barGap) +
      visualHeight * 0.15; //due to 45 degree labels

    actualHeight = this.visualHeight;

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

  this.tooltip = function () {
    if (fetchRequired) return;
    if (
      parent.visuals.filter((x) => x.priority && x.uniqueID != this.uniqueID)
        .length
    )
      return; //Some other visual has priority over mouse actions, return
    //Check if mouse is over bars
    for (let i = 0; i < barBounds.length; i++) {
      if (
        !(
          mouseX - this.coordX < barBounds[i].x ||
          mouseX - this.coordX > barBounds[i].x + barBounds[i].w ||
          mouseY - this.coordY < barBounds[i].y ||
          mouseY - this.coordY > barBounds[i].y + barBounds[i].h ||
          mouseX < this.coordX + visualPadding + paddingDueToYLabels ||
          mouseX > this.coordX + this.visualWidth - visualPadding ||
          this.mouseY < this.coordY + visualPadding ||
          this.mouseY > this.coordY + this.visualHeight - visualPadding
        )
      ) {
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

        if (rectX + rectW > this.coordX + this.visualWidth) {
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
      myCanvas.textSize(labelSize * 1.5);
      myCanvas.fill(colorPalette[0]);
      myCanvas.text(
        "Fields Required",
        xOffset +
          (this.visualWidth - myCanvas.textWidth("Fields Required")) / 2,
        yOffset + this.visualHeight / 2
      );
      return;
    }

    //Draw the bar chart here, we have data
    //Calculate the length of dimension labels, if they exceed 1/3's of the visual's drawable area height,
    //Then we will break each label into two rows. We will draw them vertically regardless. If the labels are shorter than 1/3rds,
    //Then labels can take up less space and drawable area will become larger

    myCanvas.textSize(labelSize);
    myCanvas.textStyle("normal");

    barBounds = [];
    let drawableAreaHeight = 0;
    let breakWord = 0;
    let xValues = [...new Set(myData[0].slice(1))];
    let maxLabelHeight = Math.max(...xValues.map((x) => myCanvas.textWidth(x)));
    let barWidth = Math.min(
      Math.max(
        minBarWidth,
        (this.visualWidth - 2 * visualPadding) / xValues.length - barGap
      ),
      maxBarWidth
    );

    if (
      maxLabelHeight >
      (this.visualHeight - 2 * visualPadding - titleSize - gapAfterTitle) * 0.33
    ) {
      //If label lengths are larger than 1/3rds of the visual area, we must wrap lebels
      drawableAreaHeight =
        (this.visualHeight - 2 * visualPadding - titleSize - gapAfterTitle) *
        0.67;
      breakWord = 1;
    } else {
      //If x axis labels are not too long, bar area can be larger
      drawableAreaHeight =
        this.visualHeight -
        2 * visualPadding -
        titleSize -
        gapAfterTitle -
        labelGap -
        labelGap -
        maxLabelHeight;
    }

    let yValues = myData[1].slice(1);
    let yMax = Math.max(...yValues.map((x) => Number(x)));
    let yMin = Math.min(...yValues.map((x) => Number(x)));
    let maxYValueLength = Math.max(
      ...yValues.map((y) => myCanvas.textWidth(y))
    );

    //Calculate padding due to y labels, calculate y labels
    paddingDueToYLabels = maxYValueLength + labelGap + labelGap;
    let numberOfYLabelsBetween = Math.floor(
      (drawableAreaHeight - 2 * labelSize) / (5 * labelSize)
    );

    //Draw bars
    //If there are few values and bars to fill the visual width, calculate padding from sides
    let paddingDueToFewColumns = 0;
    if (
      xValues.length * (barWidth + barGap) <
      this.visualWidth - 2 * visualPadding
    ) {
      paddingDueToFewColumns =
        (this.visualWidth -
          2 * visualPadding -
          xValues.length * (barWidth + barGap)) /
        2;
    }

    for (let i = 0; i < yValues.length; i++) {
      let currentBarX =
        xOffset +
        visualPadding +
        paddingDueToYLabels +
        (barWidth + barGap) * i +
        paddingDueToFewColumns;

      let currentBarY =
        yOffset +
        visualPadding +
        titleSize +
        gapAfterTitle +
        ((yMax - yValues[i]) / yMax) * drawableAreaHeight;

      let currentBarHeight = (yValues[i] / yMax) * drawableAreaHeight;
      //let currentBarColor = this.colorPalette[0];

      let currentBarColor =
        this.colorPalette[
          Math.round(
            map(yValues[i], yMin - 1, yMax, 0, this.colorPalette.length - 1) //minus 1 prevents NaN when boundaries are equal
          )
        ];

      //Bar shadow
      myCanvas.fill([170, 170, 170]);
      myCanvas.rect(currentBarX + 1.5, currentBarY, barWidth, currentBarHeight);

      //Bar rectangle
      myCanvas.fill(currentBarColor);
      myCanvas.rect(currentBarX, currentBarY, barWidth, currentBarHeight);

      //Save the bar positions, label and value so we can display them in tooltip in mouseEvents() function
      barBounds.push({
        x: currentBarX,
        y: currentBarY,
        w: barWidth,
        h: currentBarHeight,
        label: xValues[i],
        field: myData[1][0],
        value: yValues[i],
      });

      let drawInside =
        visualPadding + ((yMax - yValues[i]) / yMax) * drawableAreaHeight <
        labelSize * 1.5
          ? 1
          : 0;

      myCanvas.fill(
        drawInside
          ? isLightcolor(currentBarColor)
            ? colorPalette[0]
            : "white"
          : colorPalette[0]
      );

      let valueTxt = yValues[i];
      if (
        valueFields[0].format == "integer" ||
        valueFields[0].format == "double"
      ) {
        valueTxt = Number(valueTxt).toLocaleString("en-US");
      }

      myCanvas.text(
        valueTxt,
        xOffset +
          visualPadding +
          paddingDueToYLabels +
          (barWidth + barGap) * i +
          paddingDueToFewColumns +
          (barWidth - myCanvas.textWidth(`${yValues[i]}`)) / 2,
        yOffset +
          visualPadding +
          titleSize +
          gapAfterTitle +
          ((yMax - yValues[i]) / yMax) * drawableAreaHeight +
          (drawInside ? labelSize * 1.5 : -labelSize * 0.5)
      );
    }

    let labelAreaHeight = drawableAreaHeight / 2 - 2 * labelGap;
    //Draw labels
    for (let i = 0; i < xValues.length; i++) {
      myCanvas.fill(colorPalette[0]);

      myCanvas.push();
      myCanvas.translate(
        xOffset +
          visualPadding +
          paddingDueToYLabels +
          (barWidth + barGap) * i +
          barWidth / 2 +
          paddingDueToFewColumns,
        yOffset +
          visualPadding +
          titleSize +
          gapAfterTitle +
          drawableAreaHeight +
          labelGap +
          labelGap +
          labelSize
      );
      //Draw x alis line
      myCanvas.stroke(colorPalette[0]);
      myCanvas.line(
        -(barWidth + barGap) / 2,
        -labelGap - labelSize,
        (barWidth + barGap) / 2,
        -labelGap - labelSize
      );
      myCanvas.noStroke();

      myCanvas.rotate(Math.PI / 4);

      //Break the text when it doesn't fit the 1/3rds of the visual which is label area
      if (breakWord) {
        let breakAt = Math.floor(
          labelAreaHeight / (myCanvas.textWidth("b") * 0.7)
        );
        let brokeDueToArea = xValues[i].slice(0, breakAt);
        //Break at the first space you see scanning from the end to start
        for (let ch = brokeDueToArea.length - 1; ch >= 0; ch--) {
          if (xValues[i][ch] == " ") {
            breakAt = ch;
            break;
          }
        }

        let secondBreakAt = Math.floor(
          labelAreaHeight / (myCanvas.textWidth("b") * 0.7)
        );

        //Much more readable this way
        let row1 = xValues[i].slice(0, breakAt);
        let row2 = xValues[i].slice(breakAt, breakAt + secondBreakAt);
        myCanvas.text(row1, 0, 0);
        myCanvas.text(row2, 0, labelSize);
      } else {
        myCanvas.text(xValues[i], 0, 0);
      }
      myCanvas.pop();
    }

    //Draw y axis and labels
    myCanvas.fill(visualBgColor);
    //Fill the background of y axis labels for readability
    myCanvas.rect(
      paddingDueToFewColumns,
      yOffset,
      visualPadding + maxYValueLength + labelGap,
      visualHeight
    );

    myCanvas.fill(colorPalette[0]);
    myCanvas.stroke(colorPalette[0]);
    myCanvas.line(
      visualPadding + paddingDueToFewColumns + maxYValueLength + labelGap,
      yOffset + visualPadding + titleSize + gapAfterTitle,
      visualPadding + paddingDueToFewColumns + maxYValueLength + labelGap,
      yOffset +
        visualPadding +
        titleSize +
        gapAfterTitle +
        drawableAreaHeight +
        labelGap
    );

    //Prepare y axis labels
    let yAxisValues = [];
    yAxisValues.push(yMax);
    let minMaxDiff = yMax - yMin;
    let labelIncr = Math.floor(minMaxDiff / numberOfYLabelsBetween);

    for (let i = 0; i < numberOfYLabelsBetween; i++) {
      yAxisValues.push(Math.floor(yMax - labelIncr * (i + 1)));
    }
    yAxisValues.push(0);

    myCanvas.noStroke();
    for (let i = 0; i < yAxisValues.length; i++) {
      myCanvas.text(
        yAxisValues[i],
        visualPadding + paddingDueToFewColumns,
        yOffset +
          visualPadding +
          titleSize +
          gapAfterTitle +
          labelSize +
          i * 4 * labelSize
      );
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

    //Draw title
    myCanvas.textStyle("bold");
    myCanvas.textSize(titleSize);
    myCanvas.fill(colorPalette[0]);
    myCanvas.noStroke();
    myCanvas.text(
      this.title,
      this.visualWidth / 2 - myCanvas.textWidth(this.title) / 2,
      visualPadding + titleSize
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

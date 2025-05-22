function LineChart(
  uniqueID,
  title,
  coordX,
  coordY,
  visualWidth,
  visualHeight,
  areaChart,
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
  this.areaChart = areaChart;
  this.parent = parent;
  this.framed = true;
  this.priority = false;

  //Private variables
  let myCanvas = null;
  let titleSize = 18;
  let gapAfterTitle = 20;
  let dotSize = 5;
  let lineWeight = 1;
  let myData = [];
  this.colorPalette = colorPalette;
  let areaOpacity = 50; //0-255
  let minDotGap = 50;
  let maxDotGap = 200;
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
  let valueFields = [];
  let lastCanvasHeight;
  let lastCanvasWidth;
  let sortAlias = "";
  let sortOrder = "";
  let myDots = [];
  let paddingDueToYLabels = 0;

  //Public function to add row and value fields to the visual
  this.addYAxis = function (alias = "X Values", expression, format) {
    valueFields.push({
      alias,
      expression,
      format,
    });
    fetchRequired = 1;

    return this; //return this instance
  };

  this.addXAxis = function (alias = "Y Values", tableID, fieldName) {
    rowField = { alias, tableID, fieldName };
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

    //Increase the dotSize to lineWeight if smaller
    dotSize = Math.max(dotSize, lineWeight);

    //Query the parent page to fetch data, pass this visual's fields
    myData = this.parent.query(
      uniqueID,
      rowField,
      null, //no column field allowed for line chart
      valueFields,
      [], //remove filters
      sortAlias,
      sortOrder
    );

    console.log(myData);
    //Format values
    for (let i = 1; i < myData.length; i++) {
      for (let j = 1; j < myData[i].length; j++) {
        myData[i][j] = formatValue(myData[i][j], valueFields[i - 1].format);
      }
    }

    //Calculate actual bar graph width & height (might be larger than visible area)
    let dotGap = Math.min(
      Math.max(
        minDotGap,
        (this.visualWidth - 2 * visualPadding) / myData[0].slice(1).length
      ),
      maxDotGap
    );

    actualWidth =
      visualPadding * 2 +
      myData[0].slice(1).length * dotGap +
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
    if (
      //If outside of visual, return
      mouseX < this.coordX + visualPadding + paddingDueToYLabels ||
      mouseX > this.coordX + this.visualWidth - visualPadding ||
      mouseY < this.coordY + visualPadding ||
      mouseY > this.coordY + this.visualHeight - visualPadding
    )
      return;

    let dotsInRange = [];

    //Check if mouse is over bars
    for (let i = 0; i < myDots.length; i++) {
      for (let j = 0; j < myDots[i].length; j++) {
        let distToCurrentDot = dist(
          mouseX,
          mouseY,
          this.coordX + myDots[i][j].x,
          this.coordY + myDots[i][j].y
        );

        if (distToCurrentDot < dotSize * 5) {
          //User is hovering over one of the dots
          myDots[i][j].dist = distToCurrentDot;
          dotsInRange.push(myDots[i][j]);
        }
      }
    }

    if (dotsInRange.length) {
      dotsInRange.sort((a, b) => a.dist - b.dist);

      //Draw circle around the current dot
      noFill();
      stroke(colorPalette[0]);
      strokeWeight(1);
      ellipse(
        this.coordX + dotsInRange[0].x,
        this.coordY + dotsInRange[0].y,
        dotSize
      );

      //Draw highlight dashed lines
      push();
      drawingContext.setLineDash([10, 10]);
      noFill();
      stroke(colorPalette[0]);
      strokeWeight(1);
      //Draw extra
      line(
        this.coordX + dotsInRange[0].x - dotsInRange[0].distToX,
        this.coordY + dotsInRange[0].y,
        this.coordX + dotsInRange[0].x,
        this.coordY + dotsInRange[0].y
      );
      line(
        this.coordX + dotsInRange[0].x,
        this.coordY + dotsInRange[0].y - dotsInRange[0].distToY,
        this.coordX + dotsInRange[0].x,
        this.coordY + dotsInRange[0].y
      );
      pop();

      //Decide if the field name or the category name is longer
      let largerLabel =
        dotsInRange[0].label.length > dotsInRange[0].label2.length
          ? dotsInRange[0].label
          : dotsInRange[0].label2;

      textSize(labelSize);
      textStyle("bold");
      let tmpLen = textWidth(`${largerLabel} : `);
      textStyle("normal");
      tmpLen += textWidth(`${dotsInRange[0].value}`);

      let rectX = mouseX + 5; //mouseX - this.coordX + 5;
      let rectY = mouseY + 5; //mouseY - this.coordY + 5;
      let rectW = tmpLen + 2 * labelSize;
      let rectH = labelSize * 3.5;

      //Shift the tooltip to leftside if it will be hidden due to framed canvas
      if (rectX + rectW > coordX + this.visualWidth) {
        rectX -= rectW + 10;
      }

      //Draw the tooltip rectangle
      stroke(1);
      fill("white");
      rect(rectX, rectY, rectW, rectH);

      //Draw the third part of the text (fielName)
      fill(dotsInRange[0].color);
      textStyle("bold");
      noStroke();
      text(
        `${dotsInRange[0].label2}`,
        rectX + labelSize, //padding is 1 labelsize
        rectY + labelSize * 1.5 //padding is half labelSize plus text's own height
      );

      //Draw the first part of the text (label)
      fill(colorPalette[0]);
      textStyle("bold");
      noStroke();
      text(
        `${dotsInRange[0].label} : `,
        rectX + labelSize, //padding is 1 labelsize
        rectY + labelSize * 2.5 //padding is half labelSize plus text's own height
      );

      //Draw the second part of the text (value)
      tmpLen = textWidth(`${dotsInRange[0].label} : `);
      textStyle("normal");
      text(
        `${dotsInRange[0].value}`,
        rectX + labelSize + tmpLen,
        rectY + labelSize * 2.5
      );
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

    //Calculate the height of the line chart area (visualHeight minus X Label Area)
    let xValues = [...new Set(myData[0].slice(1))];
    let maxLabelHeight = Math.max(...xValues.map((x) => myCanvas.textWidth(x)));
    let dotGap = Math.min(
      Math.max(
        minDotGap,
        (this.visualWidth - 2 * visualPadding) / xValues.length
      ),
      maxDotGap
    );

    //Calculate if x labels fit in 1/3rds of the height or do we need to break them
    //If x labels are not tall, then we can have larger area to draw the line chart
    let breakWord = 0;
    let drawableAreaHeight = 0;

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

    //Find min and max values amongs all field values
    let yColumns = myData.slice(1);
    let allYValues = [];
    for (let i = 0; i < yColumns.length; i++) {
      for (let j = 1; j < yColumns[i].length; j++) {
        allYValues.push(yColumns[i][j]);
      }
    }
    let yMax = Math.max(...allYValues.map((x) => Number(x)));
    let yMin = Math.min(...allYValues.map((x) => Number(x)));
    let maxYValueLength = Math.max(
      ...allYValues.map((y) => myCanvas.textWidth(y))
    );

    //Calculate padding due to y labels, calculate y labels
    myCanvas.textSize(labelSize);
    myCanvas.textStyle("normal");
    paddingDueToYLabels = maxYValueLength + labelGap + labelGap;
    let numberOfYLabelsBetween = Math.floor(
      (drawableAreaHeight - 2 * labelSize) / (5 * labelSize)
    );

    //If there are few values and bars to fill the visual width, calculate padding from sides
    let paddingDueToFewColumns = 0;
    if (xValues.length * dotGap < this.visualWidth - 2 * visualPadding) {
      paddingDueToFewColumns =
        (this.visualWidth - 2 * visualPadding - xValues.length * dotGap) / 2;
    }

    //Clear myDots (used for drawing tooltip later)
    myDots = [];

    //Now we are ready to draw the dots for each field
    drawnXLabels = 0;
    for (let curField = 1; curField < myData.length; curField++) {
      //If all values are zero, do not draw this line
      let hasValue = 0;
      for (let z = 0; z < myData[curField].length; z++) {
        if (myData[curField][z] > 0) hasValue = 1;
      }

      myDots.push([]);
      if (!hasValue) continue;

      //add an empty array for each field, they will hold dots for each field

      /// ################################### DO NOT FORGET, IT ONLY SHOWS FIRST FIELD NOW
      //Get the current field's returned values
      let yValues = myData[curField].slice(1);
      let areaColor = [
        ...colorPalette[curField - (1 % colorPalette.length)],
        areaOpacity,
      ]; //each color will represent a field
      let lineColor = areaColor.slice(0, -1);

      let lastDot = {};

      for (let i = 0; i < yValues.length; i++) {
        //For each data point in current field

        //Calculate current dot's x position
        let currentDotX =
          xOffset +
          visualPadding +
          paddingDueToYLabels +
          paddingDueToFewColumns +
          dotGap / 4 + //gap before the first dot
          i * dotGap; //gap from previous dots

        //Calculate current dot's y position
        let currentDotY =
          yOffset +
          visualPadding +
          titleSize +
          gapAfterTitle +
          ((yMax - yValues[i]) / yMax) * drawableAreaHeight;

        //Draw the dots
        myCanvas.fill(lineColor);
        myCanvas.ellipse(currentDotX, currentDotY, dotSize, dotSize);

        if (lastDot) {
          //Draw the line from previous dot
          myCanvas.fill(lineColor);
          myCanvas.stroke(lineColor);
          myCanvas.strokeWeight(lineWeight);
          myCanvas.line(lastDot.x, lastDot.y, currentDotX, currentDotY);
          myCanvas.strokeWeight(1);
          myCanvas.noStroke();
        }

        //Draw the area if this is an area chart rather than line chart
        if (this.areaChart) {
          myCanvas.fill(areaColor);
          myCanvas.beginShape();
          myCanvas.vertex(lastDot.x, lastDot.y);
          myCanvas.vertex(currentDotX, currentDotY);
          myCanvas.vertex(
            currentDotX,
            yOffset +
              titleSize +
              gapAfterTitle +
              currentDotY +
              (drawableAreaHeight - currentDotY + visualPadding)
          );
          myCanvas.vertex(
            lastDot.x,
            yOffset +
              titleSize +
              gapAfterTitle +
              currentDotY +
              (drawableAreaHeight - currentDotY + visualPadding)
          );
          myCanvas.endShape();
        }

        //Save this dot's coords and values to myDots so we can use them to draw tooltip in mouseEvents()
        myDots[curField - 1].push({
          x: currentDotX,
          y: currentDotY,
          label: xValues[i],
          label2: myData[curField][0],
          color: lineColor,
          value: yValues[i],
          distToX:
            currentDotX -
            paddingDueToFewColumns -
            visualPadding -
            maxYValueLength -
            labelSize / 2,
          distToY:
            currentDotY -
            (visualPadding +
              titleSize +
              gapAfterTitle +
              drawableAreaHeight +
              labelGap),
        });

        //Save this dot as last dot
        lastDot = { x: currentDotX, y: currentDotY };
      }

      //Iterate through y values for this field again, draw the labels, otherwise some labels stay under the area
      for (let i = 0; i < yValues.length; i++) {
        //Decide if the label becomes invisible due to upper frame
        let drawDown = myDots[curField - 1][i].y < labelSize * 1.7;

        //If we will need to draw the label under the dot, and if the chart is an area chart, we might want to use lighter/darker label color
        myCanvas.fill(lineColor);

        //Draw each y value
        let valueTxt = yValues[i];
        if (
          valueFields[curField - 1].format == "integer" ||
          valueFields[curField - 1].format == "double"
        ) {
          valueTxt = Number(valueTxt).toLocaleString("en-US");
        }

        myCanvas.text(
          valueTxt,
          myDots[curField - 1][i].x - myCanvas.textWidth(`${yValues[i]}`) / 2,
          myDots[curField - 1][i].y +
            (drawDown ? labelSize * 1.7 : -labelSize * 0.7)
        );
      }

      if (!drawnXLabels) {
        //Draw x labels
        let labelAreaHeight = drawableAreaHeight / 2 - 2 * labelGap;

        //Iterate through x values
        for (let i = 0; i < xValues.length; i++) {
          myCanvas.fill(colorPalette[0]);
          myCanvas.push();
          myCanvas.translate(
            xOffset +
              visualPadding +
              paddingDueToYLabels +
              paddingDueToFewColumns +
              dotGap / 4 + //padding due to first dot
              dotGap * i,
            yOffset +
              visualPadding +
              titleSize +
              gapAfterTitle +
              drawableAreaHeight +
              labelGap +
              labelGap +
              labelSize
          );

          //Draw a line to left and right for each dot, building the x axis line part by part
          myCanvas.stroke(colorPalette[0]);
          myCanvas.line(
            i > 0 ? -dotGap / 2 : -dotGap / 3.5, //If first dot, only draw dotGap/3.5 to the left
            -labelGap - labelSize,
            i < xValues.length - 1 ? dotGap / 2 : 0, //If last dot, do not draw a line to right
            -labelGap - labelSize
          );
          myCanvas.noStroke();
          myCanvas.rotate(Math.PI / 4);

          //Draw texts
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
          drawnXLabels = 1;
        }
      }
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

function Scatterplot(
  uniqueID,
  title,
  coordX,
  coordY,
  visualWidth,
  visualHeight,
  isBubbleChart,
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
  this.isBubbleChart = isBubbleChart;
  this.parent = parent;
  this.colorPalette = colorPalette;
  this.priority = false;

  //Private variables
  let titleSize = 18;
  let gapAfterTitle = 20;
  let visualBgColor = bgColor;
  let visualBorderColor = "lightgray";
  let dotColor = this.colorPalette[Math.floor(this.colorPalette.length / 3)];
  let bubbleOpacity = 150; //opacity
  let myData = [];
  let visualPadding = 30;
  let dotSize = 5;
  let maxBubbleSize = 40;
  let labelSize = 12;
  let visualBorderWidth = 1;
  let fetchRequired = 1;
  let rowField = null;
  let columnField = null;
  let valueField = null;
  let myDots = [];

  //Public function to add row and value fields to the visual
  this.addValue = function (alias = "Values", expression, format) {
    valueField = {
      alias,
      expression,
      format,
    };
    fetchRequired = 1;

    return this; //return this instance
  };

  this.addXAxis = function (alias = "X Axis", tableID, fieldName) {
    rowField = { alias, tableID, fieldName };
    fetchRequired = 1;
    return this;
  };

  this.addYAxis = function (alias = "Y Axis", tableID, fieldName) {
    columnField = { alias, tableID, fieldName };
    fetchRequired = 1;
    return this;
  };

  this.fetch = function () {
    if (!fetchRequired) return;
    if (!rowField || !valueField) return;

    //Query the parent page to fetch data, pass this visual's fields
    myData = this.parent.query(
      uniqueID,
      rowField,
      columnField,
      [valueField],
      [], //remove filters
      rowField.alias, //Let the model handle sorting by rows, which is harder
      "ascending" //We can sort the columns ourselves easiy (due to our table object being in column formast)
    );

    if (
      (!isNumber(myData[0][1]) && !isDate(myData[0][1])) ||
      (!isNumber(myData[1][0]) && !isDate(myData[1][0]))
    ) {
      //Error, x or y dimension values are not continous
      myData = [[]];
      console.error(
        "Scatter plot only allows continous data in x and y axies (numbers or dates only)."
      );
    } else {
      //Sort the columns
      let columnsOnly = myData.slice(1);
      if (isNumber(columnsOnly[0][0])) {
        columnsOnly.sort((a, b) => a[0] - b[0]);
      } else if (isDate(columnsOnly[0][0])) {
        columnsOnly.sort((a, b) => Date.parse(a[0]) - Date.parse(b[0]));
      }
      //Save sorted version
      myData = [myData[0], ...columnsOnly];
    }
    fetchRequired = 0;
  };

  this.mouseEvents = function () {
    if (fetchRequired) return;
    if (
      parent.visuals.filter((x) => x.priority && x.uniqueID != this.uniqueID)
        .length
    )
      return;

    //Check if mouse is hovering over any of our dots
    let dotsInRange = [];
    for (let i = 0; i < myDots.length; i++) {
      let distToDot = dist(mouseX, mouseY, myDots[i].posX, myDots[i].posY);
      if (distToDot < myDots[i].size / 2) {
        myDots.dist = distToDot;
        dotsInRange.push(myDots[i]);
      }
    }

    if (dotsInRange.length) {
      //Sort the dots closes to most distant
      dotsInRange.sort((a, b) => a.dist - b.dist);

      //Calculate tooltip rectangle size
      textStyle("bold");
      let row1Label = `${rowField.alias} :  `;
      let row2Label = `${columnField.alias} :  `;
      let row3Label = `${valueField.alias} :  `;
      textStyle("normal");
      let row1Value = `${dotsInRange[0].x}`;
      let row2Value = `${dotsInRange[0].y}`;
      let row3Value = `${dotsInRange[0].value}`;

      let rectX = mouseX + 5;
      let rectY = mouseY + 5;
      let rectPadding = labelSize;
      let rectW =
        Math.max(
          textWidth(row1Label + row1Value),
          textWidth(row2Label + row2Value),
          textWidth(row3Label + row3Value)
        ) +
        2 * rectPadding;
      let rectH = labelSize * 3.5 + 2 * rectPadding;

      //Shift the tooltip left if necessary
      if (rectX + rectW > this.coordX + this.visualWidth) {
        rectX -= rectW + 10;
      }

      //Draw stroke around the current dot
      noFill();
      stroke(colorPalette[0]);
      strokeWeight(1);
      ellipse(dotsInRange[0].posX, dotsInRange[0].posY, dotsInRange[0].size);

      push();
      drawingContext.setLineDash([10, 10]);
      noFill();
      stroke(colorPalette[0]);
      strokeWeight(1);
      //Draw extra
      line(
        dotsInRange[0].posX - dotsInRange[0].distToX,
        dotsInRange[0].posY,
        dotsInRange[0].posX,
        dotsInRange[0].posY
      );
      line(
        dotsInRange[0].posX,
        dotsInRange[0].posY - dotsInRange[0].distToY,
        dotsInRange[0].posX,
        dotsInRange[0].posY
      );
      pop();

      //Draw tooltip rect
      strokeWeight(2);
      stroke(colorPalette[0]);
      fill("white");
      rect(rectX, rectY, rectW, rectH);

      //Draw info labels
      textSize(labelSize);
      textStyle("bold");
      noStroke();
      fill(colorPalette[0]);
      text(row1Label, rectX + rectPadding, rectY + rectPadding + labelSize);
      text(
        row2Label,
        rectX + rectPadding,
        rectY + rectPadding + labelSize * 2.25
      );
      fill(dotColor);
      text(
        row3Label,
        rectX + rectPadding,
        rectY + rectPadding + labelSize * 3.5
      );

      //Draw info values
      textStyle("normal");
      fill(colorPalette[0]);
      text(
        row1Value,
        rectX + rectPadding + textWidth(row1Label),
        rectY + rectPadding + labelSize
      );
      text(
        row2Value,
        rectX + rectPadding + textWidth(row2Label),
        rectY + rectPadding + labelSize * 2.25
      );
      fill(dotColor);
      text(
        row3Value,
        rectX + rectPadding + textWidth(row3Label),
        rectY + rectPadding + labelSize * 3.5
      );
    }
  };

  this.draw = function () {
    //Draw table background and border
    fill(visualBgColor);
    stroke(visualBorderColor);
    strokeWeight(visualBorderWidth);
    rect(
      this.coordX,
      this.coordY,
      this.visualWidth - visualBorderWidth,
      this.visualHeight - visualBorderWidth
    );

    //If no data fetched yet
    if (!rowField || !columnField || !valueField) {
      textSize(labelSize * 1.5);
      fill(colorPalette[0]);
      text(
        "Fields Required",
        this.coordX + (this.visualWidth - textWidth("Fields Required")) / 2,
        this.coordY + this.visualHeight / 2
      );
      return;
    }

    //Calculate min max values for axis values
    textSize(labelSize);
    let xValues = myData[0].slice(1).map((x) => Number(x).toFixed(1));
    let yValues = myData
      .slice(1)
      .map((x) => x[0])
      .map((x) => Number(x).toFixed(1)); //We are rounding values
    let maxLabelSizeX = Math.max(...xValues.map((x) => textWidth(x)));
    maxLabelSizeX = Math.sqrt((maxLabelSizeX * maxLabelSizeX) / 2); //due to 45 degree angle
    let maxLabelSizeY = Math.max(...yValues.map((y) => textWidth(y)));

    //Calculate axis line lengths, will be useful for positioning dots and value labels
    let xAxisLength =
      this.visualWidth -
      2 * visualPadding -
      labelSize -
      labelSize -
      maxLabelSizeY -
      labelSize / 4;

    let yAxisLength =
      this.visualHeight -
      2 * visualPadding -
      titleSize -
      gapAfterTitle -
      labelSize -
      labelSize -
      maxLabelSizeX -
      labelSize / 4;

    //Draw x axis title
    fill(colorPalette[0]);
    noStroke();
    textStyle("bold");
    text(
      rowField.alias,
      this.coordX +
        this.visualWidth -
        visualPadding -
        xAxisLength / 2 -
        textWidth(rowField.alias) / 2,
      this.coordY + this.visualHeight - visualPadding
    );

    //Draw y axis title
    push();
    translate(
      this.coordX + visualPadding + labelSize,
      this.coordY +
        visualPadding +
        titleSize +
        gapAfterTitle +
        yAxisLength / 2 +
        textWidth(columnField.alias) / 2
    );
    rotate(-radians(90));
    text(columnField.alias, 0, 0);
    pop();

    //Draw x axis line
    stroke(colorPalette[0]);
    strokeWeight(1.5);
    line(
      this.coordX + this.visualWidth - visualPadding - xAxisLength,
      this.coordY + visualPadding + titleSize + gapAfterTitle + yAxisLength,
      this.coordX + this.visualWidth - visualPadding,
      this.coordY + visualPadding + titleSize + gapAfterTitle + yAxisLength
    );

    //Draw y axis line
    line(
      this.coordX + this.visualWidth - visualPadding - xAxisLength,
      this.coordY + visualPadding + titleSize + gapAfterTitle,
      this.coordX + this.visualWidth - visualPadding - xAxisLength,
      this.coordY + visualPadding + yAxisLength + titleSize + gapAfterTitle
    );

    //Draw y axis values
    noStroke();
    let yLabelsBetween = Math.floor(
      (yAxisLength - labelSize) / (2 * labelSize)
    );
    let yMin = Math.min(...yValues);
    let yMax = Math.max(...yValues);

    let leftPadding =
      this.coordX +
      this.visualWidth -
      visualPadding -
      xAxisLength -
      maxLabelSizeY -
      labelSize;

    let yLineTop = this.coordY + visualPadding + titleSize + gapAfterTitle;
    let yLineBottom =
      this.coordY + visualPadding + titleSize + gapAfterTitle + yAxisLength;
    //For each axis, we always draw the minimum and maximum values at the edges. Those min and max labels take up half label size each.
    //We calculate how many more labels would fit in between assuming there will be 1 labelSize in both size.
    //The space between won't be equally divided and there will be remaining space. We distribute that space to both sizes.
    //This way, we always come up with accurate and good looking y value labels. (This simple thing took  me hours, now I know why most software engineers are bald)
    let remainingGap =
      yAxisLength - labelSize - yLabelsBetween * 2 * labelSize + labelSize;

    //Draw min max labels
    textStyle("normal");
    text(yMax, leftPadding, yLineTop + labelSize / 2);
    text(yMin, leftPadding, yLineBottom + labelSize / 2);

    //Draw labels between
    for (let i = 0; i < yLabelsBetween; i++) {
      textStyle("normal");
      fill(colorPalette[0]);
      let curY =
        yLineTop +
        labelSize / 2 +
        remainingGap / 2 +
        i * 2 * labelSize +
        labelSize / 2;

      text(
        Number(map(curY, yLineTop, yLineBottom, yMax, yMin)).toFixed(1),
        leftPadding,
        curY + labelSize / 2
      );
    }

    //Draw x axis values
    //For each axis, we always draw the minimum and maximum values at the edges. Those min and max labels take up half label size each.
    //We calculate how many more labels would fit in between assuming there will be 1 labelSize in both size.
    //The space between won't be equally divided and there will be remaining space. We distribute that space to both sizes.
    //This way, we always come up with accurate and good looking y value labels. (This simple thing took  me hours, now I know why most software engineers are bald)

    let xMin = Math.min(...xValues);
    let xMax = Math.max(...xValues);
    let topPadding =
      this.coordY +
      visualPadding +
      titleSize +
      gapAfterTitle +
      yAxisLength +
      labelSize / 4;
    let xLineRight = this.coordX + this.visualWidth - visualPadding;
    let xLineLeft = leftPadding + maxLabelSizeY + labelSize / 3;
    let xLabelsBetween = Math.floor(
      (xAxisLength - labelSize) / (2 * labelSize)
    );

    remainingGap =
      xAxisLength - labelSize - xLabelsBetween * 2 * labelSize + labelSize;

    //Draw x min
    textStyle("normal");
    fill(colorPalette[0]);
    push();
    translate(
      xLineLeft - labelSize / 2,
      topPadding + labelSize / 4 + labelSize
    );
    rotate(radians(45));
    text(xMin, 0, 0);
    pop();

    //Draw x max
    push();
    translate(
      xLineRight - labelSize / 2,
      topPadding + labelSize / 4 + labelSize
    );
    rotate(radians(45));
    text(xMax, 0, 0);
    pop();

    //Draw x values in between
    for (let i = 0; i < xLabelsBetween; i++) {
      let curX =
        xLineLeft +
        labelSize / 2 +
        remainingGap / 2 +
        i * labelSize * 2 +
        labelSize / 2;

      push();
      textStyle("normal");
      fill(colorPalette[0]);
      translate(curX, topPadding + labelSize / 4 + labelSize);
      rotate(radians(45));
      text(
        Number(map(curX, xLineLeft, xLineRight, xMin, xMax)).toFixed(1),
        0,
        0
      );
      pop();
    }

    //Draw each dot

    let allValues = [];
    for (let i = 0; i < xValues.length; i++) {
      for (let j = 0; j < yValues.length; j++) {
        allValues.push(myData[j + 1][i + 1]);
      }
    }

    let maxValue = Math.max(...allValues);
    let minValue = Math.min(...allValues);

    myDots = [];
    for (let i = 0; i < xValues.length; i++) {
      for (let j = 0; j < yValues.length; j++) {
        let currentX = xValues[i];
        let currentY = yValues[j];
        let currentValue = myData[j + 1][i + 1];

        let xStart =
          this.coordX + this.visualWidth - visualPadding - xAxisLength;

        let yStart =
          this.coordY + visualPadding + titleSize + gapAfterTitle + yAxisLength;
        let posX = xStart + map(currentX, xMin, xMax, 0, xAxisLength);
        let posY = yStart - map(currentY, yMin, yMax, 0, yAxisLength);

        if (currentValue > 0) {
          if (this.isBubbleChart) {
            //Bubble chart
            let currentBubbleSize = map(
              currentValue,
              minValue,
              maxValue,
              dotSize,
              maxBubbleSize
            );

            noStroke();
            fill([...dotColor, bubbleOpacity]);
            ellipse(posX, posY, currentBubbleSize);
            //Save the dots so we can display tooltip later
            myDots.push({
              posX: posX,
              posY: posY,
              size: currentBubbleSize,
              x: currentX,
              y: currentY,
              label: valueField.alias,
              value: Number(currentValue).toFixed(2),
              distToX: posX - xStart,
              distToY: posY - yStart,
            });
          } else {
            //Dot Chart
            noStroke();
            fill(dotColor);
            ellipse(posX, posY, dotSize);
            //Save the dots so we can display tooltip later
            myDots.push({
              posX: posX,
              posY: posY,
              size: dotSize,
              x: currentX,
              y: currentY,
              label: valueField.alias,
              value: Number(currentValue).toFixed(2),
              distToX: posX - xStart,
              distToY: posY - yStart,
            });
          }
        }
      }
    }

    //Draw title
    textStyle("bold");
    textSize(titleSize);
    fill(colorPalette[0]);
    noStroke();
    text(
      this.title,
      this.coordX + this.visualWidth / 2 - textWidth(this.title) / 2,
      this.coordY + visualPadding + titleSize
    );
  };

  this.refresh = function () {
    fetchRequired = 1;
  };

  //Render function called in loop
  this.render = function () {
    this.fetch();
    this.draw();
    this.mouseEvents();
  };
}

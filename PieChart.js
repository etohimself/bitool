function PieChart(
  uniqueID,
  title,
  coordX,
  coordY,
  visualWidth,
  visualHeight,
  isDonutChart,
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
  this.isDonutChart = isDonutChart;
  this.parent = parent;
  this.priority = false;

  //Private variables
  let myData = [];
  let visualPadding = 15;
  let gap = 20;
  let titleSize = 18;
  let labelSize = 11;
  let visualBgColor = bgColor;
  let titleColor = colorPalette[0];
  let visualBorderColor = "lightgray";
  let visualBorderWidth = 1;
  this.colorPalette = colorPalette;

  let hoveringOver = null;
  let fetchRequired = 1;
  let rowField = null;
  let valueField = null;
  let sortAlias = "";
  let sortOrder = "";

  //Public function to add row and value fields to the visual
  this.addValue = function (alias = "Values", expression, format) {
    valueField = {
      expression,
      format,
    };
    fetchRequired = 1;

    return this; //return this instance
  };

  this.addCategory = function (alias = "Category", tableID, fieldName) {
    rowField = { alias, tableID, fieldName };
    fetchRequired = 1;
    return this;
  };

  this.sortBy = function (rowOrFieldAlias, ascendingOrDescending) {
    sortAlias = rowOrFieldAlias;
    sortOrder = ascendingOrDescending;
    fetchRequired = 1;
  };

  this.fetch = function () {
    if (!fetchRequired) return;
    if (!rowField || !valueField) return;

    //Query the parent page to fetch data, pass this visual's fields
    myData = this.parent.query(
      uniqueID,
      rowField,
      null, //no column field for pie chart
      [valueField],
      [], //remove filters
      sortAlias,
      sortOrder
    );

    fetchRequired = 0;
  };

  this.mouseEvents = function () {
    if (fetchRequired) return;
    if (
      parent.visuals.filter((x) => x.priority && x.uniqueID != this.uniqueID)
        .length
    )
      return; //Some other visual has priority over mouse actions, return

    //Check if mouse is hovering over the pie chart
    //Calculate the center of the pie considering title, gaps and padding
    let pieSize = visualHeight - 2 * visualPadding - titleSize - 2 * gap;
    let originX = this.coordX + this.visualWidth / 2;
    let originY =
      this.coordY +
      visualPadding +
      titleSize +
      gap +
      (visualHeight - 2 * visualPadding - titleSize - gap) / 2;

    if (dist(mouseX, mouseY, originX, originY) <= pieSize / 2) {
      //Mouse is over the pie, lets store the angle to be used later in draw
      let hoverAngle = Math.atan2(mouseY - originY, mouseX - originX);
      hoverAngle = hoverAngle < 0 ? hoverAngle + 2 * Math.PI : hoverAngle;
      hoveringOver = hoverAngle;
    } else {
      hoveringOver = null;
    }
  };

  this.draw = function () {
    //Draw table border and background
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
    if (!rowField || !valueField) {
      textSize(labelSize * 1.5);
      textStyle("normal");
      fill("black");
      text(
        "Fields Required",
        this.coordX + (this.visualWidth - textWidth("Fields Required")) / 2,
        this.coordY + this.visualHeight / 2
      );
      return;
    }

    //Draw PieChart Title
    textSize(titleSize);
    fill(titleColor);
    noStroke();
    textStyle("bold");
    text(
      title,
      this.coordX + (this.visualWidth - textWidth(this.title)) / 2,
      this.coordY + titleSize + visualPadding
    );

    //Extract Dimensions, Their Values and Total Sum
    let distinctRows = myData[0].slice(1);
    let rowValues = myData[1].slice(1);
    let sumTotal = rowValues.reduce(
      (prev, cur) => Number(prev) + Number(cur),
      0
    );

    //Calculate Angles and Percentages
    let angles = rowValues.map((x) => Math.max(x / sumTotal) * Math.PI * 2);
    let percents = rowValues.map((x) => ((x / sumTotal) * 100).toFixed(1));

    //Start drawing from angle 0
    let startAngle = 0;
    textStyle("normal");

    //For each pie chart value
    for (let i = 0; i < rowValues.length; i++) {
      //Pick a color from the  palette
      fill(colorPalette[i % colorPalette.length]);

      //Calculate the center of the pie considering title, gaps and padding
      let originX = this.coordX + this.visualWidth / 2;
      let originY =
        this.coordY +
        visualPadding +
        titleSize +
        gap +
        (visualHeight - 2 * visualPadding - titleSize - gap) / 2;

      //Calculate pie size considering gaps, title and padding
      let pieSize = visualHeight - 2 * visualPadding - titleSize - 2 * gap;

      //Draw a pie arc)
      arc(
        originX,
        originY,
        pieSize,
        pieSize,
        startAngle,
        startAngle + angles[i] + (angles[i] == 0 ? 0.0001 : 0) //Bug fix
      );
      //Increment angle
      startAngle += angles[i];
    }

    //Save pie center and size for donut chart later
    let donutCenterX;
    let donutCenterY;
    let donutSize;

    //Pie is  complete, now draw percentage and category labels
    startAngle = 0;
    for (let i = 0; i < rowValues.length; i++) {
      let originX = this.coordX + this.visualWidth / 2;
      let originY =
        this.coordY +
        visualPadding +
        titleSize +
        gap +
        (visualHeight - 2 * visualPadding - titleSize - gap) / 2;

      //Calculate pie size, label text rows and positions
      let pieSize = visualHeight - 2 * visualPadding - titleSize - gap;
      let labelX =
        originX +
        (pieSize / (this.isDonutChart ? 3 : 3.5)) *
          Math.cos((startAngle * 2 + angles[i]) / 2);
      let labelY =
        originY +
        (pieSize / (this.isDonutChart ? 3 : 3.5)) *
          Math.sin((startAngle * 2 + angles[i]) / 2);

      textSize(labelSize);
      //Draw if there is enough space for the percentage part in the pie area
      if ((angles[i] * pieSize) / 2.5 > textWidth(`%${percents[i]}`)) {
        fill(
          isLightcolor(colorPalette[i % colorPalette.length])
            ? "black"
            : "white"
        );
        text(
          `${percents[i]}%`,
          labelX - textWidth(`%${percents[i]}`) / 2,
          labelY + labelSize / 2
        );
      }
      startAngle += angles[i];

      //Instead of calculating again, let's save these values
      donutCenterX = originX;
      donutCenterY = originY;
      donutSize = pieSize;
    }

    //If donut chart, draw a circle in the middle with visual's bg color
    if (this.isDonutChart) {
      fill(visualBgColor);
      noStroke();
      ellipse(donutCenterX, donutCenterY, donutSize / 2);
    }

    //Draw Tooltip
    startAngle = 0;
    if (hoveringOver != null) {
      for (let i = 0; i < distinctRows.length; i++) {
        if (
          hoveringOver > startAngle &&
          hoveringOver < startAngle + angles[i]
        ) {
          stroke(1);
          fill("white");
          rect(
            mouseX + 5,
            mouseY + 5,
            textWidth(`${distinctRows[i]}:  ${percents[i]}%`) + 2 * labelSize,
            labelSize * 2.5
          );
          fill("black");
          noStroke();
          textStyle("bold");
          text(
            `${distinctRows[i]}:  `,
            mouseX + labelSize,
            mouseY + labelSize * 2
          );
          let labelNameWidth = textWidth(`${distinctRows[i]}:  `);

          textStyle("normal");
          text(
            `${percents[i]}%`,
            mouseX + labelSize + labelNameWidth,
            mouseY + labelSize * 2
          );
        }
        startAngle += angles[i];
      }
    }
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

function Page(title, uniqueID, parent, colorPalette, bgColor) {
  this.title = title;
  this.uniqueID = uniqueID;
  this.visuals = [];
  this.parent = parent;
  this.filterContext = []; //filters on this page
  this.colorPalette = colorPalette;
  this.bgColor = bgColor;
  this.addMatrix = function (
    uniqueID,
    coordX,
    coordY,
    visualWidth,
    visualHeight,
    customPalette = null
  ) {
    this.visuals.push(
      new Matrix(
        uniqueID,
        coordX,
        coordY,
        visualWidth,
        visualHeight,
        this,
        customPalette || this.colorPalette,
        this.bgColor
      )
    );
    return this.visuals[this.visuals.length - 1];
  };

  this.addSlicer = function (
    uniqueID,
    coordX,
    coordY,
    visualWidth,
    visualHeight,
    customPalette = null
  ) {
    this.visuals.push(
      new Slicer(
        uniqueID,
        coordX,
        coordY,
        visualWidth,
        visualHeight,
        this,
        customPalette || this.colorPalette,
        this.bgColor
      )
    );
    return this.visuals[this.visuals.length - 1];
  };

  this.addPieChart = function (
    uniqueID,
    title,
    coordX,
    coordY,
    visualWidth,
    visualHeight,
    customPalette = null
  ) {
    this.visuals.push(
      new PieChart(
        uniqueID,
        title,
        coordX,
        coordY,
        visualWidth,
        visualHeight,
        0,
        this,
        customPalette || this.colorPalette,
        this.bgColor
      )
    );
    return this.visuals[this.visuals.length - 1];
  };

  this.addDonutChart = function (
    uniqueID,
    title,
    coordX,
    coordY,
    visualWidth,
    visualHeight,
    customPalette = null
  ) {
    this.visuals.push(
      new PieChart(
        uniqueID,
        title,
        coordX,
        coordY,
        visualWidth,
        visualHeight,
        1, //is donut chart
        this,
        customPalette || this.colorPalette,
        this.bgColor
      )
    );
    return this.visuals[this.visuals.length - 1];
  };

  this.addBarChart = function (
    uniqueID,
    title,
    coordX,
    coordY,
    visualWidth,
    visualHeight,
    customPalette = null
  ) {
    this.visuals.push(
      new BarChart(
        uniqueID,
        title,
        coordX,
        coordY,
        visualWidth,
        visualHeight,
        this,
        customPalette || this.colorPalette,
        this.bgColor
      )
    );
    return this.visuals[this.visuals.length - 1];
  };

  this.addHorizontalBarChart = function (
    uniqueID,
    title,
    coordX,
    coordY,
    visualWidth,
    visualHeight,
    customPalette = null
  ) {
    this.visuals.push(
      new HorizontalBarChart(
        uniqueID,
        title,
        coordX,
        coordY,
        visualWidth,
        visualHeight,
        this,
        customPalette || this.colorPalette,
        this.bgColor
      )
    );
    return this.visuals[this.visuals.length - 1];
  };

  this.addLineChart = function (
    uniqueID,
    title,
    coordX,
    coordY,
    visualWidth,
    visualHeight,
    customPalette = null
  ) {
    this.visuals.push(
      new LineChart(
        uniqueID,
        title,
        coordX,
        coordY,
        visualWidth,
        visualHeight,
        0,
        this,
        customPalette || this.colorPalette,
        this.bgColor
      )
    );
    return this.visuals[this.visuals.length - 1];
  };

  this.addScatterPlot = function (
    uniqueID,
    title,
    coordX,
    coordY,
    visualWidth,
    visualHeight,
    customPalette = null
  ) {
    this.visuals.push(
      new Scatterplot(
        uniqueID,
        title,
        coordX,
        coordY,
        visualWidth,
        visualHeight,
        0, //is bubble chart
        this,
        customPalette || this.colorPalette,
        this.bgColor
      )
    );
    return this.visuals[this.visuals.length - 1];
  };

  this.addBubbleChart = function (
    uniqueID,
    title,
    coordX,
    coordY,
    visualWidth,
    visualHeight,
    customPalette = null
  ) {
    this.visuals.push(
      new Scatterplot(
        uniqueID,
        title,
        coordX,
        coordY,
        visualWidth,
        visualHeight,
        1, //is bubble chart
        this,
        customPalette || this.colorPalette,
        this.bgColor
      )
    );
    return this.visuals[this.visuals.length - 1];
  };

  this.addAreaChart = function (
    uniqueID,
    title,
    coordX,
    coordY,
    visualWidth,
    visualHeight,
    customPalette = null
  ) {
    this.visuals.push(
      new LineChart(
        uniqueID,
        title,
        coordX,
        coordY,
        visualWidth,
        visualHeight,
        1,
        this,
        customPalette || this.colorPalette,
        this.bgColor
      )
    );
    return this.visuals[this.visuals.length - 1];
  };

  this.addCard = function (
    uniqueID,
    title,
    coordX,
    coordY,
    visualWidth,
    visualHeight,
    customPalette = null
  ) {
    this.visuals.push(
      new Card(
        uniqueID,
        title,
        coordX,
        coordY,
        visualWidth,
        visualHeight,
        this,
        customPalette || this.colorPalette,
        this.bgColor
      )
    );
    return this.visuals[this.visuals.length - 1];
  };

  this.removeVisual = function (uniqueID) {
    this.visuals = this.visuals.filter((x) => x.uniqueID != uniqueID);
  };

  this.removeVisual = function (uniqueID) {
    this.visuals = this.visuals.filter((x) => x.uniqueID != uniqueID);
  };

  this.query = function (
    uniqueID,
    rowField,
    columnField,
    valueFields,
    removeFilters,
    sortAlias,
    sortOrder
  ) {
    //Exclude removeFilters from filterContext before sendings
    let refinedContext = [];

    if (this.filterContext.length) {
      this.filterContext.forEach((eachFilter) => {
        let excluded = 0;
        if (removeFilters && removeFilters.length) {
          removeFilters.forEach((eachRemoved) => {
            if (
              eachRemoved.tableID == eachFilter.tableID &&
              eachRemoved.fieldName == eachFilter.fieldName
            ) {
              excluded = 1;
            }
          });
        }
        if (!excluded) {
          refinedContext.push(eachFilter);
        }
      });
    }
    return parent.model.query(
      uniqueID,
      rowField,
      columnField,
      valueFields,
      refinedContext,
      sortAlias,
      sortOrder
    );
  };

  this.addFilterContext = function (newFilter) {
    this.filterContext = this.filterContext.filter(
      (ef) => ef.uniqueID != newFilter.uniqueID
    ); //remove if exist

    this.filterContext.push(newFilter);
    this.visuals.forEach((ev) => {
      ev.refresh();
    });
  };

  this.removeFilterContext = function (uniqueID) {
    this.filterContext = this.filterContext.filter(
      (ef) => ef.uniqueID != uniqueID
    ); //remove if exist
    this.visuals.forEach((ev) => {
      ev.refresh();
    });
  };

  this.render = function () {
    //Draw visual with priority the last
    this.visuals = this.visuals.sort((a, b) => a.priority - b.priority);

    //Render each visual on this page
    for (let i = 0; i < this.visuals.length; i++) {
      //Check if visual is valid
      if (
        this.visuals[i].hasOwnProperty("render") &&
        this.visuals[i].hasOwnProperty("coordX") &&
        this.visuals[i].hasOwnProperty("coordY") &&
        this.visuals[i].hasOwnProperty("visualWidth") &&
        this.visuals[i].hasOwnProperty("visualHeight") &&
        this.visuals[i].hasOwnProperty("render")
      ) {
        if (
          //Check if visual is framed
          this.visuals[i].hasOwnProperty("framed") &&
          this.visuals[i].framed == 1
        ) {
          image(
            this.visuals[i].render(),
            this.visuals[i].coordX,
            this.visuals[i].coordY,
            this.visuals[i].visualWidth,
            this.visuals[i].visualHeight
          );
          if (this.visuals[i].hasOwnProperty("tooltip"))
            this.visuals[i].tooltip();
        } else {
          //Draw normal visuals
          this.visuals[i].render();
        }
      } else {
        //Error with  visual
        console.log("Invalid Visual");
      }
    }
  };

  this.mouseWheel = function (event) {
    for (let i = 0; i < this.visuals.length; i++) {
      //If user is wheeling over a visual
      if (
        this.visuals[i].framed &&
        !(
          mouseX < this.visuals[i].coordX ||
          mouseX > this.visuals[i].coordX + this.visuals[i].visualWidth
        ) &&
        !(
          mouseY < this.visuals[i].coordY ||
          mouseY > this.visuals[i].coordY + this.visuals[i].visualHeight
        ) &&
        this.visuals[i].hasOwnProperty("mouseWheel")
      ) {
        this.visuals[i].mouseWheel(event);
      } else if (this.visuals[i].hasOwnProperty("isSlicer")) {
        //Slicers are exception due to dynamic size when uncollapsing
        this.visuals[i].mouseWheel(event);
      }
    }
  };
}

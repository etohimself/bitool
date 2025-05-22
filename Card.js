function Card(
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
  this.priority = false;
  this.colorPalette = colorPalette;

  //Private variables
  let titleSize = 18;
  let valueSize = 32;
  let gapSize = 10;
  let myData = [];
  let visualPadding = 15;
  let visualBgColor = bgColor;
  let visualBorderColor = "lightgray";
  let visualBorderWidth = 1;
  let fetchRequired = 1;
  let valueField = null;
  let sortAlias = "";
  let sortOrder = "";

  //Public function to add row and value fields to the visual
  this.addValue = function (alias = "Field Name", expression, format) {
    valueField = {
      alias,
      expression,
      format,
    };
    fetchRequired = 1;
    return this; //return this instance
  };

  this.fetch = function () {
    if (!fetchRequired) return;
    if (!valueField) return;

    //Query the parent page to fetch data, pass this visual's fields
    myData = this.parent.query(
      uniqueID,
      null, //no row field
      null, //no column field
      [valueField],
      [], //remove filters
      null, //no sort
      null //no sort
    );

    myData = formatValue(myData, valueField.format);
    fetchRequired = 0;
  };

  this.mouseEvents = function () {
    //No mouse events for the card
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
    if (!valueField) {
      textSize(titleSize);
      fill(this.colorPalette[0]);
      text(
        "Field Required",
        this.coordX + (this.visualWidth - textWidth("Fields Required")) / 2,
        this.coordY + this.visualHeight / 2
      );
      return;
    }

    let drawableArea = this.visualHeight - 2 * visualPadding;
    let totalTextHeight = titleSize + valueSize;
    let remainingSpace = drawableArea - totalTextHeight - gapSize;

    //Draw Title
    textStyle("normal");
    noStroke();
    fill(this.colorPalette[0]);
    textSize(titleSize);
    text(
      this.title,
      this.coordX + this.visualWidth / 2 - textWidth(this.title) / 2,
      this.coordY + titleSize + visualPadding + remainingSpace / 2
    );
    textStyle("bold");

    //Format before displaying if number
    let valueTxt = myData;
    if (valueField.format == "integer" || valueField.format == "double") {
      valueTxt = Number(valueTxt).toLocaleString("en-US");
    }
    textSize(valueSize);
    text(
      valueTxt,
      this.coordX + this.visualWidth / 2 - textWidth(myData) / 2,
      this.coordY +
        titleSize +
        visualPadding +
        remainingSpace / 2 +
        valueSize +
        gapSize
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

function Report() {
  this.model = new Model(this);
  this.pages = [];
  this.currentPage = 0;
  this.colorPalette = [
    [33, 62, 94],   // Darkest Blue
    [49, 84, 128],  // Dark Blue
    [58, 106, 160], // Medium Dark Blue
    [78, 121, 171], // Medium Blue
    [98, 143, 191], // Medium Light Blue
    [122, 168, 211],// Light Blue
    [148, 194, 230],// Lighter Blue
    [174, 213, 239],// Very Light Blue
    [198, 229, 248],// Lightest Blue
    [224, 243, 255] // Almost White Blue
  ];

  //Try the dark mode as well ;)
  //this.visualBackground = [25, 25, 25];
  //this.pageBackground = [25, 25, 25];

  this.visualBackground = [235, 235, 235];
  this.pageBackground = "white";

  let navButtonPadding = 15;
  let navButtonFontSize = 14;
  let lastMousePressed = 0;
  let buttons = [];

  pixelDensity(1);
  window.mouseWheel = (event) => {
    this.mouseWheel(event);
    return false;
  };

  this.addPage = function (title, uniqueID) {
    this.pages.push(
      new Page(title, uniqueID, this, this.colorPalette, this.visualBackground)
    );
    return this.pages[this.pages.length - 1];
  };

  this.removePage = function (uniqueID) {
    this.pages = this.pages.filter((x) => x.uniqueID != uniqueID);
    return this.pages;
  };

  this.getPage = function (uniqueID) {
    let foundPage = this.pages.filter((x) => x.uniqueID == uniqueID);
    return (foundPage && foundPage[0]) || null;
  };

  this.drawNavigation = function () {
    //Draw bottom navigation bar
    let rectH = navButtonFontSize + 2 * navButtonPadding;
    let rectY = height - rectH;

    textSize(navButtonFontSize);
    fill("lightgray");
    noStroke();
    rect(0, height - rectH, width, rectH);

    buttons = [];
    for (let i = 0; i < this.pages.length; i++) {
      let rectX = 0;
      for (let j = 0; j < i; j++) {
        rectX += buttons[j].w;
      }
      textStyle("bold");
      let rectW = navButtonFontSize * 2 + textWidth(this.pages[i].title);
      buttons.push({
        x: rectX,
        y: rectY,
        w: rectW,
        h: rectH,
        text: this.pages[i].title,
      });
    }

    for (let i = 0; i < buttons.length; i++) {
      fill("white");
      strokeWeight(1);
      stroke("lightgray");
      rect(buttons[i].x, buttons[i].y, buttons[i].w, buttons[i].h);
      noStroke();
      fill("black");

      if (this.currentPage == i) {
        textStyle("bold");
        strokeWeight(navButtonFontSize);
        strokeCap(SQUARE);
        stroke(this.colorPalette[2]);
        line(
          buttons[i].x,
          buttons[i].y + buttons[i].h,
          buttons[i].x + buttons[i].w,
          buttons[i].y + buttons[i].h
        );
      } else {
        textStyle("normal");
      }
      noStroke();
      text(
        buttons[i].text,
        buttons[i].x + navButtonPadding,
        buttons[i].y + navButtonPadding + navButtonFontSize
      );
      textStyle("normal");
    }
  };

  this.importData = async function (dataSource, tableID) {
    return new Promise((resolve, reject) => {
      loadTable(
        dataSource,
        "csv",
        "header",
        function (cbd) {
          //Add headers to p5Data array before converting to our custom Table object
          let headers = cbd.columns;
          let myTable = new Table([headers, ...cbd.getArray()], 1);
          //Instruct the model to add it as a new table
          this.model.addTable(tableID, myTable);
          resolve();
        }.bind(this)
      );
    });
  };

  this.importTable = function (dataArray, tableID) {
    this.model.addTable(tableID, new Table(dataArray, 0));
  };

  this.createRelationship = function (from, primarykey, to, foreignkey) {
    this.model.addRelationship(from, primarykey, to, foreignkey);
  };

  this.createDimension = function (tableID, fieldName, newTableID) {
    let foundTable = this.model.getTable(tableID);
    if (!foundTable) return;

    let foundColumn = foundTable.object.selectColumn(fieldName);
    if (!foundColumn) return;
    if (!foundColumn.hasOwnProperty("data")) return;
    if (!foundColumn.data.length) return;
    let foundArray = foundColumn.data[0];

    //Construct new table
    let newTableData = [[], []];
    newTableData[0].push(foundArray[0]); //push original header;
    newTableData[1].push("key"); //push original header;

    //Get unique values
    let uniqueValues = [...new Set(foundArray.slice(1))];
    for (let i = 0; i < uniqueValues.length; i++) {
      newTableData[0].push(uniqueValues[i]);
      newTableData[1].push(i);
    }

    //Create new dimension table
    this.importTable(newTableData, newTableID);

    //Write index on original values
    let colIndex = null;
    for (let i = 0; i < foundTable.object.data.length; i++) {
      if (foundTable.object.data[i][0] == fieldName) {
        colIndex = i;
      }
    }
    for (let i = 1; i < foundTable.object.data[colIndex].length; i++) {
      foundTable.object.data[colIndex][i] = uniqueValues.indexOf(
        foundTable.object.data[colIndex][i]
      );
    }

    //Done!
  };

  this.addCalculatedColumn = function (tableID, header, iterator) {
    //If there is no such table in model, return
    let foundTable = this.model.getTable(tableID);
    if (!foundTable) return;
    //Extract columns so we can loop through them
    let columns = foundTable.object.data;

    //Provide the user with an object that has headers as key and column values as values
    let dataProvided = {};
    foundTable.object.copy().data.map((eachCol) => {
      dataProvided[eachCol[0]] = [...eachCol.slice(1)];
    });

    //Add the new header
    columns.push([header]);

    //Iterate through the data and add returned value from iterator as value for each row
    for (let i = 1; i < columns[0].length; i++) {
      columns[columns.length - 1].push(String(iterator(dataProvided, i - 1)));
    }
  };

  this.mouseWheel = function (event) {
    this.pages[this.currentPage].mouseWheel(event);
  };

  this.mouseEvents = function (event) {
    if (mouseIsPressed != lastMousePressed) {
      lastMousePressed = mouseIsPressed;
      //Click detected

      for (let i = 0; i < buttons.length; i++) {
        if (
          !(
            mouseX < buttons[i].x ||
            mouseX > buttons[i].x + buttons[i].w ||
            mouseY < buttons[i].y ||
            mouseY > buttons[i].y + buttons[i].h
          )
        ) {
          //User has clicked on a navigation button
          this.currentPage = i;
        }
      }
    }
  };

  this.render = function () {
    background(this.pageBackground);
    if (!this.pages.length) return;
    this.pages[this.currentPage].render();
    this.drawNavigation();
    this.mouseEvents();
  };
}

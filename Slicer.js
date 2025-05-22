function Slicer(
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
  this.framed = false;
  this.priority = false;
  this.multiselection = true;
  this.colorPalette = colorPalette;
  this.isSlicer = 1;

  //Private variables
  let rowField = null;
  let columnField = null;
  let myData = [];
  let backgroundFill = bgColor;
  let borderColor = "gray";
  let borderWidth = 1;
  let borderRadius = 3;
  let visualPadding = 10;
  let labelSize = 13;
  let visualTitle = "Slicer";
  let listGap = 5;
  let itemPadding = 6;
  let titleColor = this.colorPalette[0];
  let valueColor = this.colorPalette[1];
  let titleCentered = 1;
  let collapsed = 1;
  let items = [];
  let selected = [];
  let lastMousePressed = false;
  let fetchRequired = 1;
  let sortAlias;
  let sortOrder;
  let listCanvas = null;
  let scrollY = 0;
  let dropdownX;
  let dropdownY;
  let dropdownW;
  let dropdownH;
  let currentX;
  let currentY;
  let currentW;
  let currentH;
  let itemHeight;
  let itemWidth;

  this.refresh = function () {
    fetchRequired = 1;
  };

  this.fetch = function () {
    if (!fetchRequired) return;
    if (!rowField) return;

    //Query the model to get available values
    myData = this.parent.query(
      this.uniqueID,
      rowField,
      columnField,
      [], //value fields
      [rowField], //remove filters
      sortAlias,
      sortOrder
    )[0];

    items = [...myData.slice(1)];
    selected = selected.filter((x) => items.includes(x)); //Remove selected items that are no longer available
    visualTitle = myData[0];
    fetchRequired = 0;
  };

  this.sendFilters = function () {
    //Send our filter context first
    if (!selected.length) {
      this.parent.removeFilterContext(uniqueID);
    } else {
      let payload = {
        uniqueID,
        tableID: rowField.tableID,
        values: [...selected],
        fieldName: rowField.fieldName,
      };
      this.parent.addFilterContext(payload);
    }
  };

  this.setScrollY = function (newValue) {
    let actualHeight = items.length * itemHeight;
    if (actualHeight < itemHeight * 10) return;

    scrollY = constrain(newValue, -(actualHeight - itemHeight * 10), 0);
    //vertical_barPosition = (-yOffset * this.visualHeight) / actualHeight;
  };

  this.draw = function () {
    //Draw visual frame
    fill(backgroundFill);
    strokeWeight(borderWidth);
    stroke(borderColor);
    rect(
      this.coordX,
      this.coordY,
      this.visualWidth,
      this.visualHeight,
      borderRadius
    );

    //Draw title
    noStroke();
    fill(titleColor);
    textSize(labelSize);
    textStyle("bold");
    text(
      visualTitle,
      titleCentered
        ? this.coordX + (this.visualWidth - textWidth(visualTitle)) / 2
        : this.coordX + visualPadding,
      this.coordY + visualPadding + labelSize
    );

    //Calculate important positions and sizes
    itemWidth = this.visualWidth - visualPadding * 2;
    itemHeight = labelSize + itemPadding * 2;
    currentX = this.coordX + visualPadding;
    currentY = this.coordY + visualPadding + labelSize * 2;
    currentW = itemWidth;
    currentH = itemHeight;
    dropdownX = this.coordX + visualPadding;
    dropdownY = this.coordY + visualPadding + labelSize * 4 + listGap;
    dropdownW = itemWidth;
    dropdownH = itemHeight * 10;
    eraseButtonX = this.coordX + this.visualWidth - visualPadding - labelSize;
    eraseButtonY = this.coordY + visualPadding + labelSize;

    //Draw current item box
    fill("this.colorPalette[this.colorPalette.length-1]");
    stroke(200, 200, 200);
    strokeWeight(1);
    rect(currentX, currentY, currentW, currentH);

    //Calculate currently selected text
    let txt = "";
    if (!myData.length) {
      txt = "Row Required";
    } else {
      if (!selected.length) {
        txt = "(All)";
      } else if (selected.length == 1) {
        txt = selected[0];
      } else {
        txt = `(${selected.length} Selected)`;
      }
    }

    let txtToDraw = "";
    for (let j = 0; j < txt.length; j++) {
      txtToDraw = `${txtToDraw}${txt[j]}`;
      if (textWidth(txtToDraw) > itemWidth) {
        txtToDraw = txtToDraw.slice(0, txtToDraw.length - 1);
      }
    }

    //Draw selected text
    noStroke();
    fill(valueColor);
    textStyle("normal");
    text(txtToDraw, currentX + itemPadding, currentY + itemPadding + labelSize);

    //Draw list of items when uncollapsed
    if (!collapsed) {
      if (items.length) {
        if (!listCanvas) {
          listCanvas = createGraphics(dropdownW, dropdownH);
        }

        //Draw empty list background
        listCanvas.fill(backgroundFill);
        listCanvas.rect(0, 0, listCanvas.width - 1, listCanvas.height - 1);

        for (let i = 0; i < items.length; i++) {
          listCanvas.fill(
            selected.includes(items[i])
              ? "lightgreen"
              : "this.colorPalette[this.colorPalette.length-1]"
          );
          listCanvas.strokeWeight(0.5);
          listCanvas.stroke("black");
          listCanvas.rect(0, scrollY + i * itemHeight, itemWidth, itemHeight);

          //Hide the overflowing item text
          let txtToDraw = items[i];
          for (let j = 0; j < items[i].length; j++) {
            if (textWidth(txtToDraw) > itemWidth) {
              txtToDraw = txtToDraw.slice(0, txtToDraw.length - 1);
            }
          }

          listCanvas.noStroke();
          listCanvas.fill(valueColor);
          listCanvas.textStyle("normal");
          listCanvas.text(
            txtToDraw,
            itemPadding,
            scrollY + itemPadding + i * itemHeight + labelSize
          );
        }

        //Draw list borders
        listCanvas.noFill();
        listCanvas.strokeWeight(1);
        listCanvas.stroke("gray");
        listCanvas.rect(0, 0, listCanvas.width - 1, listCanvas.height - 1);

        image(listCanvas, dropdownX, dropdownY, dropdownW, dropdownH);
      }
    }

    //Draw Erase Button
    fill("black");
    textStyle("normal");
    text("🗑️", eraseButtonX, eraseButtonY);
  };

  this.addValue = function (alias = "Field", tableID, fieldName) {
    rowField = { alias, tableID, fieldName };
    fetchRequired = 1;
    return this;
  };

  this.sortBy = function (rowOrFieldAlias, ascendingOrDescending) {
    sortAlias = rowOrFieldAlias;
    sortOrder = ascendingOrDescending;
    fetchRequired = 1;
  };

  this.mouseWheel = function (event) {
    this.setScrollY(scrollY - event.delta);
  };

  this.mouseEvents = function () {
    if (!myData.length) return;
    if (fetchRequired) return;
    if (
      parent.visuals.filter((x) => x.priority && x.uniqueID != this.uniqueID)
        .length
    )
      return; //Some other visual has priority over mouse actions, return

    //Check if mouse is over the list items
    if (mouseIsPressed != lastMousePressed) {
      lastMousePressed = mouseIsPressed;
      if (mouseIsPressed) {
        //Click event
        if (
          !(mouseX < currentX || mouseX > currentX + currentW) &&
          !(mouseY < currentY || mouseY > currentY + currentH)
        ) {
          //Clicked on selection box
          if (collapsed) {
            collapsed = 0;
            scrollY = 0;
            this.priority = true;
          } else {
            collapsed = 1;
            setTimeout(() => {
              this.priority = false;
            }, 250);
          }
        } else if (!collapsed) {
          if (
            !(
              mouseX < dropdownX ||
              mouseX > dropdownX + dropdownW ||
              mouseY < dropdownY ||
              mouseY > dropdownY + dropdownH
            )
          ) {
            //Clicked inside dropdown list while its open
            //Must have selected an item
            let relativeY = mouseY - dropdownY - scrollY;
            let clickedIndex = Math.floor(relativeY / itemHeight);
            if (clickedIndex < items.length) {
              let clickedItem = items[clickedIndex];
              if (this.multiselection) {
                if (selected.includes(clickedItem)) {
                  selected = selected.filter((it) => it != clickedItem); //Unselect
                  this.sendFilters();
                } else {
                  selected.push(clickedItem); //Select
                  this.sendFilters();
                }
              } else {
                //Single selection
                if (selected.includes(clickedItem)) {
                  selected = []; //Unselect
                  this.sendFilters();
                } else {
                  selected = [clickedItem]; //Select
                  this.sendFilters();
                }
              }
              fetchRequired = 1;
            } else {
              //Clicked elsewhere
              collapsed = 1; //Collapse
              setTimeout(() => {
                this.priority = false;
              }, 250);
            }
          } else {
            //Clicked elsewhere
            collapsed = 1; //Collapse
            setTimeout(() => {
              this.priority = false;
            }, 250);
          }
        } else if (
          //Erase button
          !(
            mouseX <
              this.coordX + this.visualWidth - visualPadding - labelSize ||
            mouseX > this.coordX + this.visualWidth - visualPadding ||
            mouseY < this.coordY + visualPadding ||
            mouseY > this.coordY + visualPadding + labelSize
          )
        ) {
          //Erase selected items
          selected = [];
          this.sendFilters();
        }
      }
    }

    //Handle erase button
  };

  this.render = function () {
    this.fetch();
    this.draw();
    this.mouseEvents();
  };
}

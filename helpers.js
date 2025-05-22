function isNumber(value) {
  if (value == null) return false;
  if (typeof value == "number") return true;
  if (!value.length) return false;
  let integer = parseFloat(value.replace(",", "."));
  return !isNaN(integer) && isFinite(integer);
}

function isDate(value) {
  if (typeof value != "string") return false;
  if (value.length > 10) return false;

  let splitters = [",", ".", "/", "-"];

  for (let i = 0; i < splitters.length; i++) {
    let splitDate = value.split(splitters[i]);
    if (splitDate.length == 3) {
      //Three parts
      for (let j = 0; j < 3; j++) {
        if (splitDate[j].length == 4) {
          return true;
        }
      }
    }
  }
  return false;
}

function isLightcolor([r, g, b, a]) {
  // Calculate luminance, source to formula : https://en.wikipedia.org/wiki/Relative_luminance
  let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (a != undefined) luminance *= 2 - a / 255;
  return luminance > 128;
}

function formatValue(rawValue, format) {
  switch (format) {
    case "integer":
      rawValue = Number(rawValue).toFixed(0);
      break;
    case "double":
      rawValue = Number(rawValue).toFixed(2);
      break;
    case "percentage":
      rawValue = (Number(rawValue) * 100).toFixed(2) + "%";
      break;
    default:
      rawValue = String(rawValue);
  }
  return rawValue;
}

function date_days(rawDays) {
  return rawDays * 24 * 60 * 60 * 1000;
}

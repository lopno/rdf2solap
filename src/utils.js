const turf = require("@turf/turf");

const pathOr = require("ramda").pathOr;

const getLevelMemberAttributes = val =>
  val.substring(val.indexOf("(") + 1, val.indexOf(")"));

const generatePolygonPoints = polyString => {
  const points = polyString
    .split(",")
    .map(positionString =>
      positionString
        .split(" ")
        .map(coord => parseFloat(coord.replace(/\(/g, "").replace(/\)/g, "")))
    );
  const valid =
    points[0][0] === points[points.length - 1][0] &&
    points[0][1] === points[points.length - 1][1];
  if (!valid) {
    console.log(polyString);
  }
  return points;
};

const getSpatialValues = value => {
  const locationString = getLevelMemberAttributes(value);
  if (value.startsWith("POINT")) {
    return turf.point(locationString.split(" "));
  }
  if (value.startsWith("LINE")) {
    return null; // TODO: turf.lineString(values)
  }
  if (value.startsWith("POLYGON")) {
    const points = generatePolygonPoints(locationString);
    return turf.polygon([points]);
  }
  if (value.startsWith("MULTIPOLYGON")) {
    const polyStrings = locationString.split("),(");
    const polygons = polyStrings.map(generatePolygonPoints);
    return turf.multiPolygon([polygons]);
  }
  return null;
};

const equals = (childLevelSpatialValues, parentLevelSpatialValues) =>
  // all child level values are equal to all parent level values
  childLevelSpatialValues.every(childLevelSpatialValue =>
    parentLevelSpatialValues.every(parentLevelSpatialValue =>
      turf.booleanEqual(childLevelSpatialValue, parentLevelSpatialValue)
    )
  );

const intersects = (childLevelSpatialValues, parentLevelSpatialValues) =>
  // all child level points are on a parent level line
  childLevelSpatialValues.every(childLevelSpatialValue =>
    parentLevelSpatialValues.some(parentLevelSpatialValue =>
      turf.booleanPointOnLine(childLevelSpatialValue, parentLevelSpatialValue)
    )
  );

const crosses = (childLevelSpatialValues, parentLevelSpatialValues) =>
  // some child level values crosses some parent level value
  childLevelSpatialValues.some(childLevelSpatialValue =>
    parentLevelSpatialValues.some(parentLevelSpatialValue =>
      turf.booleanCrosses(childLevelSpatialValue, parentLevelSpatialValue)
    )
  );

const overlaps = (childLevelSpatialValues, parentLevelSpatialValues) =>
  // some child level values overlap some parent level value
  childLevelSpatialValues.some(childLevelSpatialValue =>
    parentLevelSpatialValues.some(parentLevelSpatialValue =>
      turf.booleanOverlap(childLevelSpatialValue, parentLevelSpatialValue)
    )
  );


// Nuref: new within function (without bounding box) to re-check test cases farmStatesParishes.test.js and  farmStatesParishesExpensive.test.js)
const pointWithin = (childLevelSpatialValues, parentLevelSpatialValues) =>
    // some child level values overlap some parent level value
    childLevelSpatialValues.every(childLevelSpatialValue =>
        parentLevelSpatialValues.some(parentLevelSpatialValue =>
            turf.booleanPointInPolygon(childLevelSpatialValue, parentLevelSpatialValue)
        )
    );



const within = (childLevelSpatialValues, parentLevelSpatialValues) => {
  const parentLevelMultipolygonBoundingBox = turf.bboxPolygon(
    turf.bbox(
      turf.multiPolygon([
        parentLevelSpatialValues.map(parentLevelSpatialValue =>
          pathOr([], [0], turf.getCoords(parentLevelSpatialValue))
        )
      ])
    )
  );

  // all child level values are within the parent level polygon (simplified with bounding box to support multipolygons)
  return childLevelSpatialValues.every(childLevelSpatialValue => {
    return turf.booleanWithin(
      childLevelSpatialValue,
      parentLevelMultipolygonBoundingBox
    );
  });
};

const relateSpatialValues = (
  childLevelSpatialValues,
  parentLevelSpatialValues
) => {
  const childLevelGeoType = pathOr(
    null,
    [0, "geometry", "type"],
    childLevelSpatialValues
  );
  const parentLevelGeoType = pathOr(
    null,
    [0, "geometry", "type"],
    parentLevelSpatialValues
  );

  if (childLevelGeoType === "Point" && parentLevelGeoType === "Point") {
    if (equals(childLevelSpatialValues, parentLevelSpatialValues)) {
      return "http://w3id.org/qb4solap#equals";
    }
  } else if (
    childLevelGeoType === "Point" &&
    parentLevelGeoType === "LineString"
  ) {
    if (intersects(childLevelSpatialValues, parentLevelSpatialValues)) {
      return "http://w3id.org/qb4solap#intersects";
    }
  } else if (
    childLevelGeoType === "Point" &&
    parentLevelGeoType === "Polygon"
  ) {
    //if (within(childLevelSpatialValues, parentLevelSpatialValues)) {
    //  return "http://w3id.org/qb4solap#within";
    //}
    // Nuref: commented above three lines to use pointWithin boolean function for point-polygon cases in farmStatesParishes.test.js and  farmStatesParishesExpensive.test.js
    if (pointWithin(childLevelSpatialValues, parentLevelSpatialValues)) {
      return "http://w3id.org/qb4solap#within";
    }
  } else if (
    childLevelGeoType === "LineString" &&
    parentLevelGeoType === "LineString"
  ) {
    if (crosses(childLevelSpatialValues, parentLevelSpatialValues)) {
      return "http://w3id.org/qb4solap#intersects";
    }
    if (overlaps(childLevelSpatialValues, parentLevelSpatialValues)) {
      return "http://w3id.org/qb4solap#overlaps";
    }
  } else if (
    childLevelGeoType === "LineString" &&
    parentLevelGeoType === "Polygon"
  ) {
    if (within(childLevelSpatialValues, parentLevelSpatialValues)) {
      return "http://w3id.org/qb4solap#within";
    }
    if (crosses(childLevelSpatialValues, parentLevelSpatialValues)) {
      return "http://w3id.org/qb4solap#overlaps";
    }
  } else if (
    childLevelGeoType === "Polygon" &&
    parentLevelGeoType === "Polygon"
  ) {
    const isWithin = within(childLevelSpatialValues, parentLevelSpatialValues);
    const isOverlaps = overlaps(
      childLevelSpatialValues,
      parentLevelSpatialValues
    );
    if (isWithin) {
      return "http://w3id.org/qb4solap#within";
    }
    if (isOverlaps) {
      return "http://w3id.org/qb4solap#overlaps";
    }
  }
  return null;
};

module.exports = {
  getSpatialValues,
  relateSpatialValues
};

const turf = require("@turf/turf");

const groupBy = require("ramda").groupBy;
const pathOr = require("ramda").pathOr;

// const fetch = require("node-fetch");
// const { promisify } = require("util");
// const fs = require("fs");
// const n3 = require("n3");
//
// const readFileAsync = promisify(fs.readFile);
// const writeFileAsync = promisify(fs.writeFile);
//
// fetch(
//   "http://lod.cs.aau.dk:8890/sparql?default-graph-uri=http%3A%2F%2Fqb4solap.org%2Fcubes%2Finstances%2Fgeofarm%23&query=SELECT+*+WHERE+%7B%3Fs+%3Fp+%3Fo+%7D&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on"
// )
//   .then(res => {
//     console.log(res);
//     return res.text();
//   })
//   .then(textRes => {
//     return writeFileAsync("../dataOld/parishes.json", textRes);
//   })
//   .then(writeRes => {
//     console.log(writeRes);
//   })
//   .catch(err => {
//     console.log(err);
//   });

// const parser = new n3.Parser();
//

//
// readFileAsync("../dataOld/farms.ttl", "utf8")
//   .then((dataOld) => {
//     const parsedData = parser.parse(dataOld);
//     return parsedData
//   })
//   .then((parsed) => {
//     for(let i = 0; i < 50; i++) {
//       console.log(parsed[i]);
//     }
//     console.log('hello');
//     // DO MAGIC HERE;
//   })
//   .catch(error => {
//     console.log(error);
// });

// fs.readFile("./dataOld/drainageareas.ttl", "utf8", (err, dataOld) => {
//   if (err) {
//     console.log(err);
//     return;
//   }
//   console.log(typeof dataOld);
//   parser.parse(dataOld, (err, quad, prefixes) => {
//     console.log(err);
//     console.log(quad);
//     console.log(prefixes);
//   });
// });

// console.log(parser);

// const testString = `
// @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
// @prefix virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> .
// @prefix skos: <http://www.w3.org/2004/02/skos/core#> .
// @prefix qb: <http://purl.org/linked-data/cube#>.
// @prefix qb4o: <http://purl.org/qb4solap/cubes#> .
// @prefix qb4so: <http://w3id.org/qb4solap#> .
// @prefix geo: <http://www.opengis.net/ont/geosparql#> .
// @prefix wgs: <http://www.w3.org/2003/01/geo/wgs84_pos#> .
// @prefix gfs: <http://qb4solap.org/cubes/schemas/geofarm#> .
// @prefix gfsi: <http://qb4solap.org/cubes/instances/geofarm#> .
// gfsi:water_9 a gfs:drainageArea ;
// 	 qb4o:memberOf gfs:drainageArea ;
// 	 gfs:waterId 9 ;
// 	 gfs:waterName "Københavns Havn"  ;
// 	 gfs:growthStatus "Increased" ;
// 	 gfs:growthPeriod "2007-2016" ;
// 	 gfs:waterArea "75790353.406739995"^^xsd:double ;
// 	 gfs:waterPerimeter "93905.605540000004"^^xsd:double ;
// 	 gfs:polygonPartArea "46337810.126460001"^^xsd:double ;
// 	 gfs:polygonPartPerimeter "43678.947569999997"^^xsd:double ;
// 	 gfs:waterGeometry "POLYGON ((12.4542245634982 55.7066208904265,12.468531668544 55.751440364002,12.5330246067079 55.7543127103339,12.556914937705 55.7190228969764,12.5396190111815 55.6912625425021,12.5574016253508 55.6834018370696,12.5942600898575 55.7076479550657,12.6006340743673 55.6905990335797,12.5104858435136 55.6497991827601,12.4931868997302 55.6723718947955,12.5298383470324 55.699304150128,12.4900681346104 55.7021774584859,12.475772579047 55.7179765866383,12.4542245634982 55.7066208904265))"^^virtrdf:Geometry .
// `;
//
// const quads = [];
//
// // return parser.parse(testString, (err, quad, prefixes) => {
// //   if (err) {
// //     console.log(err);
// //     return;
// //   }
// //   quads.push(quad);
// // });
//
// // quads.map(console.log);
//
// const result = parser.parse(testString);
//
// console.log(result);

const drainageAreasJson = require("../data/drainages.json");
const parishesJson = require("../data/parishes.json");

const parishToWaterMapping = require("../data/parishToWaterRelations.json");

const groupPolygonsById = jsonData => {
    // Map into id and value
    const mappedDrainageAreas = jsonData.results.bindings.map(binding => ({
        id: binding.s.value,
        value: binding.o.value
    }));

    // Filter out values that are not polygons
    const filteredDrainageAreas = mappedDrainageAreas.filter(
        area =>
            area.value.startsWith("POLYGON") || area.value.startsWith("MULTIPOLYGON")
    );

    const groupById = groupBy(drainageArea => drainageArea.id);

    return groupById(filteredDrainageAreas);
};

const mapRelations = jsonData => {
    return jsonData.results.bindings.map(binding => ({
        parishId: binding.s.value,
        drainageAreaId: binding.o.value
    }));
};

const getLocationString = str =>
    str.substring(str.indexOf("(") + 1, str.indexOf(")")); // TODO: lastIndexOf

const getLevelMemberAttributes = val =>
    val.substring (val.indexOf("(") +1, val.indexOf(")"));

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

const generatePoints = polyString => {
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
    if (value.startsWith("POLYGON")) {
        const polygons = generatePolygonPoints(locationString);
        return turf.polygon([polygons]);
    }
    if (value.startsWith("LINE")) {
        const lines = locationString;
        return turf.lineString([lines]);
    }
    if (value.startsWith("POINT")){
        const points = locationString;
        return turf.point([points]);
    }
    return null;
};






const getGeoRelations = relations =>
    relations.map(relation => {
        try {
            const childLevels = pathOr([], [relation.parishId], groupedParishes).map(
                parish => getSpatialValues(parish.value)
            );
            const parentLevels = pathOr(
                [],
                [relation.drainageAreaId],
                groupedDrainageAreas
            ).map(parish => getSpatialValues(parish.value));

            // There exists some parish polygon that overlaps with a parish polygon
            const overlaps = childLevels.some(parish =>
                parentLevels.some(drainageArea => {
                    return turf.booleanOverlap(parish, drainageArea);
                })
            );

            // There exists some drainage area polygon for which all the drainage area polygons are within
            const within = parentLevels.some(drainageArea => {
                childLevels.every(parish => {
                    return turf.booleanWithin(parish, drainageArea);
                });
            });

            return { ...relation, overlaps, within };
        } catch (e) {
            console.log(
                "error",
                e.message,
                "parishId: ",
                relation.parishId,
                ", drainageAreaId: ",
                relation.drainageAreaId
            );
            return { ...relation, error: e.message };
        }
    });

const groupedparentLevels = groupPolygonsById(drainageAreasJson);
const groupedchildLevels = groupPolygonsById(parishesJson);

const parishToDrainageAreaRelations = mapRelations(parishToWaterMapping);

const mappedRelations = getGeoRelations(parishToDrainageAreaRelations);

console.log("relations", parishToDrainageAreaRelations.length);
console.log(
    "overlapping",
    mappedRelations.filter(relation => relation.overlaps === true).length
);
console.log(
    "within",
    mappedRelations.filter(relation => relation.within === true).length
);
console.log("error", mappedRelations.filter(relation => relation.error).length);
console.log("ok");

module.exports = {
    getSpatialValues
};

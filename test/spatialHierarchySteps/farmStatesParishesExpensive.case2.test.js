//Algorithm 6 (1st hierarchy (to base level))
// This 2nd test case is created to find (expensive) relations between farmstates & parishes  with the second within function pointWithin implemented with BooleanPointInPolygon turf.js function
const parishesAreaJson = require("../../data2019/parishes.json");
const farmStatesJson = require("../../data2019/farmstates.json");

const spatialHierarchySteps = require("../../src/spatialHierarchySteps");

describe("detectSpatialHierarchyStepsExpensive, farm states and parishes", () => {
  let topologicalRelations;

  const groupedParentLevelMembers = spatialHierarchySteps.groupSpatialAttributeValuesByLevelMemberId(
    parishesAreaJson,
    ["POLYGON"]
  );
  const groupedChildLevelMembers = spatialHierarchySteps.groupSpatialAttributeValuesByLevelMemberId(
    farmStatesJson,
    ["POINT"]
  );

  topologicalRelations = spatialHierarchySteps.detectSpatialHierarchyStepsExpensive(
    groupedParentLevelMembers,
    groupedChildLevelMembers
  );

  it("should have 40039 child level members", () => {
    expect(Object.values(groupedChildLevelMembers).length).toBe(40039);
  });

  it("should have 2181 parent level members", () => {
    expect(Object.values(groupedParentLevelMembers).length).toBe(2181);
  });

  it("should find 0 overlapping relations", () => {
    const overlapping = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value === "http://w3id.org/qb4solap#overlaps"
    ).length;
    expect(overlapping).toBe(0);
  });

  it("should find 39998 within (PointInPolygon) relations", () => {
    const withinRelations = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value === "http://w3id.org/qb4solap#within"
    ).length;
    expect(withinRelations).toBe(39998);
  });

  it("should find 39998 with some relation", () => {
    const someRelation = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value !== "http://www.w3.org/2004/02/skos/core#broader"
    ).length;
    expect(someRelation).toBe(39998);
  });
});

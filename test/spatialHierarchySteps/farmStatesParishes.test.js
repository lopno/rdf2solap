//Algorithm 5
const parishesJson = require("../../data2019/parishes.json");
const farmStatesJson = require("../../data2019/farmstates");

const farmStateParishRelationJson = require("../../data2019/farmstateParishRelations");

const spatialHierarchySteps = require("../../src/spatialHierarchySteps");

describe("detectSpatialHierarchySteps, farmsStates and parishes", () => {
  let farmStatesParishesTopologicalRelations;

  const groupedParentLevelMembers = spatialHierarchySteps.groupSpatialAttributeValuesByLevelMemberId(
    parishesJson,
    ["POLYGON"]
  );
  const groupedChildLevelMembers = spatialHierarchySteps.groupSpatialAttributeValuesByLevelMemberId(
    farmStatesJson,
    ["POINT"]
  );

  farmStatesParishesTopologicalRelations = spatialHierarchySteps.detectSpatialHierarchySteps(
    groupedParentLevelMembers,
    groupedChildLevelMembers,
    farmStateParishRelationJson
  );

  it("should have 40039 child level members", () => {
    expect(Object.values(groupedChildLevelMembers).length).toBe(40039);
  });

  it("should have 2181 parent level members", () => {
    expect(Object.values(groupedParentLevelMembers).length).toBe(2181);
  });

  it("should have 40039 mapped bindings", () => {
    expect(farmStateParishRelationJson.results.bindings.length).toBe(40039);
  });

  it("should find 0 overlapping relations", () => {
    const overlapping = farmStatesParishesTopologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value === "http://w3id.org/qb4solap#overlaps"
    ).length;
    expect(overlapping).toBe(0);
  });

  it("should find 39334 within (without bounding box but with PointInPolygon) relations", () => {
    const withinRelations = farmStatesParishesTopologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value === "http://w3id.org/qb4solap#within"
    ).length;
    expect(withinRelations).toBe(39334);
  });

  it("should find 39334 with some relation", () => {
    const someRelation = farmStatesParishesTopologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value !== "http://www.w3.org/2004/02/skos/core#broader"
    ).length;
    expect(someRelation).toBe(39334);
  });
});

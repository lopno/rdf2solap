const drainageAreaJson = require("../../data2019/drainages.json");
const parishesJson = require("../../data2019/parishes.json");

const spatialHierarchySteps = require("../../src/spatialHierarchySteps");

describe("detectSpatialHierarchyStepsExpensive", () => {
  let topologicalRelations;

  const groupedParentLevelMembers = spatialHierarchySteps.groupSpatialAttributeValuesByLevelMemberId(
    drainageAreaJson,
    ["POLYGON"]
  );
  const groupedChildLevelMembers = spatialHierarchySteps.groupSpatialAttributeValuesByLevelMemberId(
    parishesJson,
    ["POLYGON"]
  );

  topologicalRelations = spatialHierarchySteps.detectSpatialHierarchyStepsExpensive(
    groupedParentLevelMembers,
    groupedChildLevelMembers
  );

  it("should have 10000 child level members", () => {
    expect(Object.values(groupedChildLevelMembers).length).toBe(1741);
  });

  it("should have 1741 parent level members", () => {
    expect(Object.values(groupedParentLevelMembers).length).toBe(135);
  });

  it("should find 236 overlapping relations", () => {
    const overlapping = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value === "http://w3id.org/qb4solap#overlaps"
    ).length;
    expect(overlapping).toBe(542);
  });

  it("should find 1555 within bounding box relations", () => {
    const withinRelations = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value === "http://w3id.org/qb4solap#within"
    ).length;
    expect(withinRelations).toBe(2747);
  });

  it("should find 1791 with some relation", () => {
    const someRelation = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value !== "http://www.w3.org/2004/02/skos/core#broader"
    ).length;
    expect(someRelation).toBe(3289);
  });
});

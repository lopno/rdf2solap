//Algorithm 4
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

  it("should have 2181 child level members", () => {
    expect(Object.values(groupedChildLevelMembers).length).toBe(2181);
  });

  it("should have 135 parent level members", () => {
    expect(Object.values(groupedParentLevelMembers).length).toBe(135);
  });

  it("should find 1088 overlapping relations", () => {
    const overlapping = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value === "http://w3id.org/qb4solap#overlaps"
    ).length;
    expect(overlapping).toBe(1088);
  });

  it("should find 3392 within bounding box relations", () => {
    const withinRelations = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value === "http://w3id.org/qb4solap#within"
    ).length;
    expect(withinRelations).toBe(3392);
  });

  it("should find 4480 with some relation", () => {
    const someRelation = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value !== "http://www.w3.org/2004/02/skos/core#broader"
    ).length;
    expect(someRelation).toBe(4480);
  });
});

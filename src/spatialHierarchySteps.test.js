const parentLevelMembersJson = require("../data2019/drainages.json");
const childLevelMembersJson = require("../data2019/parishes.json");
const explicitRelations = require("../data2019/parishToWaterRelations.json");

const spatialHierarchySteps = require("./spatialHierarchySteps");

describe("detectSpatialHierarchySteps", () => {
  let topologicalRelations;

  beforeAll(() => {
    const groupedParentLevelMembers = spatialHierarchySteps.groupSpatialAttributeValuesByLevelMemberId(
      parentLevelMembersJson
    );
    const groupedChildLevelMembers = spatialHierarchySteps.groupSpatialAttributeValuesByLevelMemberId(
      childLevelMembersJson
    );

    topologicalRelations = spatialHierarchySteps.detectSpatialHierarchySteps(
      groupedParentLevelMembers,
      groupedChildLevelMembers,
      explicitRelations
    );
  });

  it("should have 3700 mapped bindings", () => {
    expect(explicitRelations.results.bindings.length).toBe(3700);
  });

  it("should find 236 overlapping relations", () => {
    const overlapping = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value === "http://w3id.org/qb4solap#overlaps"
    ).length;
    expect(overlapping).toBe(236);
  });

  it("should find 1555 within bounding box relations", () => {
    const withinRelations = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value === "http://w3id.org/qb4solap#within"
    ).length;
    expect(withinRelations).toBe(1555);
  });

  it("should find 1791 with some relation", () => {
    const someRelation = topologicalRelations.results.bindings.filter(
      relation =>
        relation.p &&
        relation.p.value &&
        relation.p.value !== "http://www.w3.org/2004/02/skos/core#broader"
    ).length;
    expect(someRelation).toBe(1791);
  });
});

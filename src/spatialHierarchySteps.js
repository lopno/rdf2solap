
const pathOr = require("ramda").pathOr;
const groupBy = require("ramda").groupBy;
const flatten = require("ramda").flatten;

const utils = require("./utils");

const groupSpatialAttributeValuesByLevelMemberId = jsonData => {
  // Map into id and value
  const mappedLevelMembers = jsonData.results.bindings.map(binding => ({
    id: binding.s.value,
    value: binding.o.value
  }));

  // Filter out values that are not points, lines, or polygons
  const filteredLevelMembers = mappedLevelMembers.filter(levelMember =>
    // levelMember.value.startsWith("POINT") ||
    // levelMember.value.startsWith("LINE") ||
    levelMember.value.startsWith("POLYGON")
  );

  const groupById = groupBy(parentLevel => parentLevel.id);

  return groupById(filteredLevelMembers);
};

const detectSpatialHierarchySteps = (
  parentLevelMembers,
  childLevelMembers,
  explicitRelations
) => {
  const spatialHierarchySteps = explicitRelations.results.bindings.map(
    binding => {
      const childLevelMemberId = binding.s.value;
      const parentLevelMemberId = binding.o.value;

      const childLevelSpatialValues = pathOr(
        [],
        [childLevelMemberId],
        childLevelMembers
      ).map(childLevelMember => utils.getSpatialValues(childLevelMember.value));
      const parentLevelSpatialValues = pathOr(
        [],
        [parentLevelMemberId],
        parentLevelMembers
      ).map(parentLevelMember =>
        utils.getSpatialValues(parentLevelMember.value)
      );

      const topoRel = utils.relateSpatialValues(
        childLevelSpatialValues,
        parentLevelSpatialValues
      );

      return {
        ...binding,
        p: {
          type: "uri",
          value: topoRel || "http://www.w3.org/2004/02/skos/core#broader"
        }
      };
    }
  );

  return {
    ...explicitRelations,
    results: {
      ...explicitRelations.results,
      bindings: spatialHierarchySteps
    }
  };
};

// s: child (e.g. parish)
// o: parent (e.g. drainageArea)
// p: relation
const detectSpatialHierarchyStepsExpensive = (
  parentLevelMembers,
  childLevelMembers
) => {
  const parentLevelMembersArray = Object.values(parentLevelMembers);
  const childLevelMembersArray = Object.values(childLevelMembers);

  const bindings = parentLevelMembersArray.map(parentLevelMember => {
    const parentLevelSpatialValues = parentLevelMember.map(member =>
      utils.getSpatialValues(member.value)
    );

    const relationsArray = childLevelMembersArray.map(childLevelMember => {
      const childLevelSpatialValues = childLevelMember.map(member =>
        utils.getSpatialValues(member.value)
      );

      const relation = utils.relateSpatialValues(
        childLevelSpatialValues,
        parentLevelSpatialValues
      );

      return relation
        ? {
            s: { type: "uri", value: childLevelMember.value },
            o: { type: "uri", value: parentLevelMember.value },
            p: { type: "uri", value: relation }
          }
        : null;
    });

    return relationsArray.filter(relation => relation);
  });

  const resultBindings = flatten(bindings);

  return {
    head: { link: [], vars: ["s", "o", "p"] },
    results: { distinct: false, ordered: true, bindings: resultBindings }
  };
};
module.exports = {
  groupSpatialAttributeValuesByLevelMemberId,
  detectSpatialHierarchySteps,
  detectSpatialHierarchyStepsExpensive
};

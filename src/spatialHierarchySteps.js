const pathOr = require("ramda").pathOr;
const groupBy = require("ramda").groupBy;

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
          value: topoRel
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

module.exports = {
  groupSpatialAttributeValuesByLevelMemberId,
  detectSpatialHierarchySteps
};

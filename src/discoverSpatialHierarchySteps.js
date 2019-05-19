// const schemaJson = require("../data2019/schema");

const discoverSpatialHierarchySteps = schema =>
  schema.results.bindings
    .filter(
      binding =>
        binding.p.value === "http://purl.org/qb4olap/cubes#hasHierarchy"
    )
    .map(hierarchyBinding =>
      schema.results.bindings.filter(
        binding =>
          hierarchyBinding.o.value === binding.s.value &&
          binding.p.value === "http://purl.org/qb4olap/cubes#hasLevel"
      )
    );

// const inDimension = schema.results.bindings.filter(
//   binding => binding.p.value === "http://purl.org/qb4olap/cubes#inDimension"
// );

module.exports = {
  wrapper: discoverSpatialHierarchySteps
};

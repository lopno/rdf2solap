const groupBy = require("ramda").groupBy;

const countDistinctIds = jsonData => {
  // Map into id and value
  const mappedLevelMembers = jsonData.results.bindings.map(binding => ({
    id: binding.s.value,
    value: binding.o.value
  }));

  const groupById = groupBy(parentLevel => parentLevel.id);

  const group = groupById(mappedLevelMembers);

  return Object.values(group).length;
};

module.exports = {
  countDistinctIds
};

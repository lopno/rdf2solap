const drainageAreasJson = require("../data2019/drainages");
const farmStatesJson = require("../data2019/farmstates");
const parishesJson = require("../data2019/parishes");

const dataUtils = require("../src/data");

describe("Data", () => {
  it("drainages.json", () => {
    const drainagesIdsCount = dataUtils.countDistinctIds(drainageAreasJson);

    expect(drainagesIdsCount).toBe(135);
  });

  it("farmstates.json", () => {
    const farmStatesIdsCount = dataUtils.countDistinctIds(farmStatesJson);

    expect(farmStatesIdsCount).toBe(10000);
  });

  it("parishes.json", () => {
    const parishesIdsCount = dataUtils.countDistinctIds(parishesJson);

    expect(parishesIdsCount).toBe(2687);
  });
});

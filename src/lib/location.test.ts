import { describe, expect, it } from "vitest";
import {
  calculateCentroid,
  haversineDistance,
  recommendStations,
  SEOUL_STATIONS,
} from "./location";

function station(name: string) {
  const found = SEOUL_STATIONS.find((item) => item.name === name);
  if (!found) throw new Error(`missing station ${name}`);
  return found;
}

function namesOf(results: ReturnType<typeof recommendStations>) {
  return results.map((item) => item.name);
}

describe("recommendStations", () => {
  it("does not recommend the origin stations for Myeongdong + Euljiro 3-ga", () => {
    const results = recommendStations([
      station("명동역"),
      station("을지로3가역"),
    ]);

    expect(namesOf(results)).not.toContain("명동역");
    expect(namesOf(results)).not.toContain("을지로3가역");
    expect(results.length).toBe(3);
  });

  it("picks a station near the midpoint, not either origin", () => {
    const myeongdong = station("명동역");
    const euljiro = station("을지로3가역");
    const midpoint = calculateCentroid([myeongdong, euljiro]);
    const [best] = recommendStations([myeongdong, euljiro]);

    expect(
      haversineDistance(best, midpoint),
    ).toBeLessThan(haversineDistance(best, myeongdong));
    expect(
      haversineDistance(best, midpoint),
    ).toBeLessThan(haversineDistance(best, euljiro) + 0.05);
  });

  it("does not recommend Gangnam or Hongdae when those are the origins", () => {
    const results = recommendStations([
      station("강남역"),
      station("홍대입구역"),
    ]);

    expect(namesOf(results)).not.toContain("강남역");
    expect(namesOf(results)).not.toContain("홍대입구역");
    expect(results[0].avgDistance).toBeGreaterThan(3);
    expect(results[0].avgDistance).toBeLessThan(8);
  });

  it("keeps max travel from getting much worse than the average", () => {
    const results = recommendStations([
      station("신림역"),
      station("노원역"),
    ]);
    const [best] = results;

    expect(best.maxDistance - best.avgDistance).toBeLessThan(2);
    expect(namesOf(results)).not.toContain("신림역");
    expect(namesOf(results)).not.toContain("노원역");
  });
});

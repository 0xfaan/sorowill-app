import { truncateAddress } from "./freighter";

describe("truncateAddress", () => {
  it("returns short input unmodified (defensive no-op branch)", () => {
    expect(truncateAddress("GABC")).toBe("GABC");
    expect(truncateAddress("123456789012")).toBe("123456789012");
  });

  it("truncates a real 56-character Stellar address", () => {
    const address =
      "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ2345";
    expect(address).toHaveLength(56);
    expect(truncateAddress(address)).toBe("GABCDEF...Z2345");
  });
});

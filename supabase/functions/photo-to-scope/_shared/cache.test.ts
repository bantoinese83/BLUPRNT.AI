import { assertEquals } from "std/assert";
import { cityFromZipUniversal } from "./estimate.ts";
import { mockFetch } from "../../_shared/test-utils.ts";

Deno.test("cityFromZipUniversal - implements in-memory caching", async () => {
  let fetchCount = 0;
  const zip = "90210";
  const expectedCity = "Beverly Hills, CA area";

  const unmock = mockFetch({
    "api.zippopotam.us/us/": (req: Request) => {
      fetchCount++;
      const zipMatch = req.url.match(/\/us\/(\d{5})$/);
      const z = zipMatch ? zipMatch[1] : "00000";
      return {
        "post code": z,
        "places": [{ "place name": "City " + z, "state abbreviation": "ST" }],
      };
    },
  });

  try {
    // First call - should trigger fetch
    const city1 = await cityFromZipUniversal(zip);
    assertEquals(city1, "City 90210, ST area");
    assertEquals(fetchCount, 1);

    // Second call - should use cache (no fetch)
    const city2 = await cityFromZipUniversal(zip);
    assertEquals(city2, "City 90210, ST area");
    assertEquals(fetchCount, 1);

    // Different ZIP - should trigger fetch
    const zip2 = "10001";
    const city3 = await cityFromZipUniversal(zip2);
    assertEquals(city3, "City 10001, ST area");
    assertEquals(fetchCount, 2);

  } finally {
    unmock();
  }
});

function assertExists(v: any) {
  if (v == null) throw new Error("Expected value to exist");
}

/**
 * Map a free-text location to an Adzuna country code.
 * Adzuna requires a country in the URL path; default is "us" with
 * city/region passed as the `where` parameter.
 */

const COUNTRY_HINTS = [
  { code: "in", hints: ["india", "bengaluru", "bangalore", "mumbai", "delhi", "hyderabad", "chennai", "pune", "kolkata", "gurgaon", "gurugram", "noida", "guwahati", "assam"] },
  { code: "gb", hints: ["uk", "united kingdom", "london", "manchester", "birmingham", "edinburgh", "glasgow", "leeds", "bristol"] },
  { code: "us", hints: ["usa", "united states", "new york", "san francisco", "seattle", "austin", "boston", "chicago", "los angeles", "denver", "atlanta", "remote us"] },
  { code: "ca", hints: ["canada", "toronto", "vancouver", "montreal", "ottawa", "calgary"] },
  { code: "au", hints: ["australia", "sydney", "melbourne", "brisbane", "perth"] },
  { code: "de", hints: ["germany", "berlin", "munich", "hamburg", "frankfurt"] },
  { code: "fr", hints: ["france", "paris", "lyon", "toulouse"] },
  { code: "nl", hints: ["netherlands", "amsterdam", "rotterdam", "the hague"] },
  { code: "sg", hints: ["singapore"] },
  { code: "ae", hints: ["uae", "united arab emirates", "dubai", "abu dhabi"] },
  { code: "nz", hints: ["new zealand", "auckland", "wellington"] },
  { code: "za", hints: ["south africa", "johannesburg", "cape town"] },
  { code: "br", hints: ["brazil", "sao paulo", "são paulo", "rio de janeiro"] },
  { code: "it", hints: ["italy", "milan", "rome"] },
  { code: "es", hints: ["spain", "madrid", "barcelona"] },
  { code: "pl", hints: ["poland", "warsaw", "krakow"] },
  { code: "mx", hints: ["mexico", "mexico city", "guadalajara"] },
  { code: "at", hints: ["austria", "vienna"] },
  { code: "ch", hints: ["switzerland", "zurich", "geneva"] }
];

export function detectCountry(location) {
  const loc = (location || "").toLowerCase();
  if (!loc) return "us";
  for (const { code, hints } of COUNTRY_HINTS) {
    if (hints.some((h) => loc.includes(h))) return code;
  }
  return "us";
}

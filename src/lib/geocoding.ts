/**
 * Geocoding utility for converting addresses to coordinates
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
}

/**
 * Normalize German umlauts for search fallback
 * ä -> ae, ö -> oe, ü -> ue, ß -> ss
 */
function normalizeGerman(text: string): string {
  return text
    .replace(/ä/g, 'ae')
    .replace(/Ä/g, 'Ae')
    .replace(/ö/g, 'oe')
    .replace(/Ö/g, 'Oe')
    .replace(/ü/g, 'ue')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss');
}

/**
 * Extract street name without house number
 * "Hörder Phönixseeallee 152" -> "Hörder Phönixseeallee"
 */
function extractStreetName(address: string): string {
  // Remove house number and any trailing characters
  return address.replace(/\s+\d+.*$/, '').trim();
}

/**
 * Geocode an address to coordinates using Nominatim API
 * @param address - The street address (e.g., "Hörder Phönixseeallee 152")
 * @param postalCode - Postal code
 * @param city - City name
 * @returns GeocodingResult or null if not found
 */
export async function geocodeAddress(
  address: string,
  postalCode: string,
  city: string
): Promise<GeocodingResult | null> {
  try {
    const streetOnly = extractStreetName(address);
    const normalizedAddress = normalizeGerman(address);
    const normalizedStreet = normalizeGerman(streetOnly);
    const normalizedCity = normalizeGerman(city);
    
    // Strategy 1: Full address with normalized umlauts
    let searchQuery = `${normalizedAddress}, ${postalCode} ${normalizedCity}`.trim();
    let result = await searchNominatim(searchQuery);
    if (result) return result;

    // Strategy 2: Street name only (without house number) + city - normalized
    if (normalizedStreet !== normalizedAddress) {
      searchQuery = `${normalizedStreet}, ${normalizedCity}`.trim();
      result = await searchNominatim(searchQuery);
      if (result) return result;
    }

    // Strategy 3: Street name + postal code - normalized
    searchQuery = `${normalizedStreet}, ${postalCode}`.trim();
    result = await searchNominatim(searchQuery);
    if (result) return result;

    // Strategy 4: Original address with umlauts
    searchQuery = `${address}, ${postalCode} ${city}`.trim();
    result = await searchNominatim(searchQuery);
    if (result) return result;

    // Strategy 5: Street only with original umlauts + city
    searchQuery = `${streetOnly}, ${city}`.trim();
    result = await searchNominatim(searchQuery);
    if (result) return result;

    // Strategy 6: Postal code + city (city center)
    searchQuery = `${postalCode} ${city}`.trim();
    result = await searchNominatim(searchQuery);
    if (result) return result;

    // Strategy 7: Just city
    result = await searchNominatim(city);
    if (result) return result;

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Search Nominatim API with a query string
 */
async function searchNominatim(query: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `format=json&` +
      `limit=1&` +
      `addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'de',
          'User-Agent': 'Bucki-PropertyManagement/1.0',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a Google Street View URL from coordinates
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Google Street View URL
 */
export function getStreetViewUrl(lat: number, lon: number): string {
  // This URL format directly opens Street View at the specified coordinates
  // 3a = street view layer
  // 75y = field of view (75 degrees)
  // 90t = heading (90 degrees = facing east)
  return `https://www.google.com/maps/@${lat},${lon},3a,75y,90t/data=!3m7!1e1!1e0!5m2!1e1!1e0`;
}

/**
 * Generate a Google Maps URL (regular map view) from coordinates
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Google Maps URL
 */
export function getMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

/**
 * Get coordinates from address and return Street View URL
 * This is a convenience function that combines geocoding with Street View URL generation
 * @param address - The street address
 * @param postalCode - Postal code
 * @param city - City name
 * @returns Promise resolving to Street View URL or null if geocoding fails
 */
export async function getStreetViewUrlFromAddress(
  address: string,
  postalCode: string,
  city: string
): Promise<string | null> {
  const result = await geocodeAddress(address, postalCode, city);
  if (result) {
    return getStreetViewUrl(result.lat, result.lon);
  }
  return null;
}

// Cache for geocoding results to reduce API calls
const geocodingCache = new Map<string, GeocodingResult>();

/**
 * Clear the geocoding cache (useful when addresses are updated)
 */
export function clearGeocodingCache(): void {
  geocodingCache.clear();
}

/**
 * Geocode with caching to reduce API calls
 */
export async function geocodeAddressCached(
  address: string,
  postalCode: string,
  city: string
): Promise<GeocodingResult | null> {
  const cacheKey = `${address}, ${postalCode} ${city}`.toLowerCase();
  
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey) || null;
  }
  
  const result = await geocodeAddress(address, postalCode, city);
  
  if (result) {
    geocodingCache.set(cacheKey, result);
  }
  
  return result;
}

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
 * Manual coordinates for known addresses that Nominatim can't find
 * (e.g., new streets in recent developments)
 */
const MANUAL_COORDINATES: Record<string, { lat: number; lon: number }> = {
  // Dülmener Straße 19, Datteln (prop-3 in seedData)
  'dülmener straße 19, 45711 datteln': { lat: 51.6647, lon: 7.3915 },
  'dülmener str. 19, 45711 datteln': { lat: 51.6647, lon: 7.3915 },
  'dülmener strasse 19, 45711 datteln': { lat: 51.6647, lon: 7.3915 },
  'duelmener strasse 19, 45711 datteln': { lat: 51.6647, lon: 7.3915 },
  'duelmener straße 19, 45711 datteln': { lat: 51.6647, lon: 7.3915 },
  // Hörder Phönixseeallee 152, Dortmund (prop-6 in seedData)
  // Koordinaten von Nominatim für "Hörder Phoenixseeallee"
  'hörder phönixseeallee 152, 44145 dortmund': { lat: 51.4869, lon: 7.5118 },
  'hörder phönixseeallee 152, 44263 dortmund': { lat: 51.4869, lon: 7.5118 },
  'phönixseeallee 152, 44145 dortmund': { lat: 51.4869, lon: 7.5118 },
  'phönixseeallee 152, 44263 dortmund': { lat: 51.4869, lon: 7.5118 },
  'hoerder phönixseeallee 152, 44145 dortmund': { lat: 51.4869, lon: 7.5118 },
  'hörder phoenixseeallee 152, 44145 dortmund': { lat: 51.4869, lon: 7.5118 },
  'hoerder phoenixseeallee 152, 44145 dortmund': { lat: 51.4869, lon: 7.5118 },
  'phoenixseeallee 152, 44145 dortmund': { lat: 51.4869, lon: 7.5118 },
  'phönixseeallee, dortmund': { lat: 51.4869, lon: 7.5118 },
  'phoenixseeallee, dortmund': { lat: 51.4869, lon: 7.5118 },
};

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
 * Geocode an address to coordinates using Nominatim API
 * @param address - The street address
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
    // Check manual coordinates first
    const fullAddress = `${address}, ${postalCode} ${city}`.toLowerCase().trim();
    const manualResult = MANUAL_COORDINATES[fullAddress];
    if (manualResult) {
      return {
        lat: manualResult.lat,
        lon: manualResult.lon,
        displayName: `${address}, ${postalCode} ${city} (manual)`,
      };
    }

    // Strategy 1: Exact address search
    let searchQuery = `${address}, ${postalCode} ${city}`.trim();
    let result = await searchNominatim(searchQuery);
    if (result) return result;

    // Strategy 2: Normalized umlauts (ä->ae, ö->oe, ü->ue)
    const normalizedAddress = normalizeGerman(address);
    const normalizedCity = normalizeGerman(city);
    if (normalizedAddress !== address || normalizedCity !== city) {
      searchQuery = `${normalizedAddress}, ${postalCode} ${normalizedCity}`.trim();
      result = await searchNominatim(searchQuery);
      if (result) return result;
    }

    // Strategy 3: Just street name + city (without house number)
    const streetOnly = address.replace(/\d+.*$/, '').trim();
    if (streetOnly !== address) {
      searchQuery = `${streetOnly}, ${postalCode} ${city}`.trim();
      result = await searchNominatim(searchQuery);
      if (result) return result;
    }

    // Strategy 4: Postal code + city center
    searchQuery = `${postalCode} ${city}`.trim();
    result = await searchNominatim(searchQuery);
    if (result) return result;

    // Strategy 5: Just city
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

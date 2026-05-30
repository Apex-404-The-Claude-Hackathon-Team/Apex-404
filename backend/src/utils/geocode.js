const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
// Nominatim policy: identify your app in User-Agent and max 1 req/s
const UA = 'Apex404-CitizenReports/1.0';

/**
 * Resolves coordinates to a structured address via Nominatim.
 * Returns null on failure so callers can fall back gracefully.
 */
const reverseGeocode = async (lat, lng) => {
  const url = `${NOMINATIM}?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;
  const data = await res.json();

  const a = data.address ?? {};
  return {
    address: a.road
      ? [a.house_number, a.road].filter(Boolean).join(' ')
      : (data.display_name ?? null),
    city:    a.city || a.town || a.village || a.county || null,
    region:  a.state || a.region || null,
    country: a.country || null,
  };
};

module.exports = { reverseGeocode };

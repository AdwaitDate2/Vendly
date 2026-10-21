// Plain data shared by checkout (browser) and the server.

export const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'],
  ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'],
  ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'],
  ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['PR', 'Puerto Rico'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'],
  ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

export const COUNTRIES = [
  ['US', 'United States'], ['CA', 'Canada'], ['GB', 'United Kingdom'], ['AU', 'Australia'], ['NZ', 'New Zealand'], ['IE', 'Ireland'],
  ['FR', 'France'], ['DE', 'Germany'], ['IT', 'Italy'], ['ES', 'Spain'], ['NL', 'Netherlands'], ['CH', 'Switzerland'], ['AE', 'United Arab Emirates'],
  ['IN', 'India'], ['SG', 'Singapore'], ['HK', 'Hong Kong'], ['JP', 'Japan'],
];

export const COUNTRY_PREFERENCE_COOKIE = 'byshreen_country';

/** Return a saved country only when the current shipping configuration allows it. */
export function validatedCountryPreference(value, countries, fallback = '') {
  const allowedCodes = (countries || []).map(([code]) => String(code).toUpperCase());
  const requestedCode = String(value || '').trim().toUpperCase();
  if (allowedCodes.includes(requestedCode)) return requestedCode;

  const fallbackCode = String(fallback || '').trim().toUpperCase();
  if (allowedCodes.includes(fallbackCode)) return fallbackCode;
  return allowedCodes[0] || '';
}

/** Keep the visitor's selected destination available to checkout on later pages. */
export function persistCountryPreference(value) {
  if (typeof document === 'undefined') return;
  const countryCode = String(value || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) return;
  const secureAttribute = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COUNTRY_PREFERENCE_COOKIE}=${encodeURIComponent(countryCode)}; Path=/; Max-Age=31536000; SameSite=Lax${secureAttribute}`;
}

export function countryFlagEmoji(value) {
  const countryCode = String(value || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) return '';
  return String.fromCodePoint(...Array.from(countryCode, (letter) => letter.charCodeAt(0) + 127397));
}

export function countryName(code) {
  return COUNTRIES.find(([value]) => value === code)?.[1] || code;
}

/** Countries the shipping rates cover. A rate with no countries ships everywhere in the list above. */
export function shippableCountries(rates) {
  const active = rates.filter((rate) => rate.active);
  if (active.some((rate) => !rate.countries.length)) return COUNTRIES;
  const codes = new Set(active.flatMap((rate) => rate.countries));
  return [...COUNTRIES.filter(([code]) => codes.has(code)), ...[...codes].filter((code) => !COUNTRIES.some(([value]) => value === code)).map((code) => [code, code])];
}

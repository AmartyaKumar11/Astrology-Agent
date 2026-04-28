export const SIGN_HINDI_MAP = {
  Aries: 'Mesh',
  Taurus: 'Vrishabh',
  Gemini: 'Mithun',
  Cancer: 'Karka',
  Leo: 'Simha',
  Virgo: 'Kanya',
  Libra: 'Tula',
  Scorpio: 'Vrischik',
  Sagittarius: 'Dhanu',
  Capricorn: 'Makara',
  Aquarius: 'Kumbha',
  Pisces: 'Meena',
};

export function formatSignHindiEnglish(sign) {
  const hindi = SIGN_HINDI_MAP[sign];
  return hindi ? `${hindi} (${sign})` : sign;
}

export const PLANET_DISPLAY_MAP = {
  Sun: 'सूर्य (Surya)',
  Moon: 'चंद्र (Chandra)',
  Mercury: 'बुध (Budh)',
  Venus: 'शुक्र (Shukra)',
  Earth: 'पृथ्वी (Prithvi)',
  Mars: 'मंगल (Mangal)',
  Jupiter: 'बृहस्पति (Brihaspati)',
  Saturn: 'शनि (Shani)',
  Uranus: 'अरुण (Arun)',
  Neptune: 'वरुण (Varun)',
  Rahu: 'राहु (Rahu)',
  Ketu: 'केतु (Ketu)',
};

export function formatPlanetHindiEnglish(planet) {
  const mapped = PLANET_DISPLAY_MAP[planet];
  return mapped ? `${planet} - ${mapped}` : planet;
}


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

export const SIGN_SYMBOL_MAP = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

export function formatSignHindiEnglish(sign) {
  const hindi = SIGN_HINDI_MAP[sign];
  const symbol = SIGN_SYMBOL_MAP[sign];
  if (hindi && symbol) return `${hindi} (${sign} ${symbol})`;
  if (hindi) return `${hindi} (${sign})`;
  return symbol ? `${sign} ${symbol}` : sign;
}

export function ensureSignHasSymbol(value) {
  if (!value) return value;
  const text = String(value);
  for (const [sign, symbol] of Object.entries(SIGN_SYMBOL_MAP)) {
    if (text.includes(sign) && !text.includes(symbol)) {
      return text.replace(sign, `${sign} ${symbol}`);
    }
  }
  return text;
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


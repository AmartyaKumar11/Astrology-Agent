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


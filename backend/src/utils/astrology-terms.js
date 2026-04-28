const HINDI_TERMS = {
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
  Sun: 'Surya',
  Moon: 'Chandra',
  Mars: 'Mangal',
  Mercury: 'Budh',
  Jupiter: 'Guru',
  Venus: 'Shukra',
  Saturn: 'Shani',
  Rahu: 'Rahu',
  Ketu: 'Ketu',
};

function getHindiName(englishName) {
  return HINDI_TERMS[englishName] || englishName;
}

function formatHindiEnglish(englishName) {
  const hindi = getHindiName(englishName);
  if (hindi === englishName) return englishName;
  return `${hindi} (${englishName})`;
}

module.exports = { getHindiName, formatHindiEnglish };


// Google Sheets Integration Helper Functions

/**
 * Parse CSV text into array of objects
 * @param {string} csvText - Raw CSV text
 * @returns {Array} Array of row objects
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());

  // Parse rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Convert CSV row to preset format
 * @param {Object} row - CSV row object
 * @param {string} addedBy - Optional username who added this (for community submissions)
 * @returns {Object} Preset object
 */
function csvRowToPreset(row, addedBy = null) {
  // Handle both old and new CSV formats
  const presetName = row['Preset Name'] || row['name'];
  const manufacturer = row['Manufacturer'] || row['manufacturer'];

  // Try new format first (with multimeter perspective columns)
  const northPositive = row['North Coil: RED lead (+)'] || row['north.positive'];
  const northNegative = row['North Coil: BLACK lead (−)'] || row['north.negative'];
  const northPoleType = row['North Pole Type'] || row['north.poleType'] || 'Slug';

  const southPositive = row['South Coil: RED lead (+)'] || row['south.positive'];
  const southNegative = row['South Coil: BLACK lead (−)'] || row['south.negative'];
  const southPoleType = row['South Pole Type'] || row['south.poleType'] || 'Screw';

  // Create display name with "Added by" tag if community-submitted
  const displayName = addedBy ? `${presetName} (Added by ${addedBy})` : presetName;

  return {
    name: displayName,
    manufacturer: manufacturer,
    north: {
      positive: northPositive || '',
      negative: northNegative || '',
      poleType: northPoleType
    },
    south: {
      positive: southPositive || '',
      negative: southNegative || '',
      poleType: southPoleType
    },
    isUserSubmitted: !!addedBy
  };
}

/**
 * Fetch and parse CSV from URL
 * @param {string} url - CSV URL
 * @returns {Promise<Array>} Array of preset objects
 */
async function loadPresetsFromCSV(url, isUserSubmissions = false) {
  if (!url) return [];

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch CSV from ${url}: ${response.statusText}`);
      return [];
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // Convert rows to presets
    const presets = rows.map(row => {
      // For user submissions, get the username from the first column
      const addedBy = isUserSubmissions ? row['Username'] || row['Your username (displayed as "Added by [username]")'] : null;
      return csvRowToPreset(row, addedBy);
    }).filter(preset => preset.name && preset.manufacturer); // Filter out invalid entries

    return presets;
  } catch (error) {
    console.error('Error loading presets from CSV:', error);
    return [];
  }
}

/**
 * Generate pre-filled Google Form URL
 * @param {string} templateUrl - Google Form pre-filled template URL
 * @param {Object} pickupData - Pickup data to pre-fill
 * @returns {string} Pre-filled form URL
 */
function generatePrefilledFormURL(templateUrl, pickupData) {
  if (!templateUrl) return '';

  // Google Forms uses entry IDs in the URL
  // The template URL should look like:
  // https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.123=USERNAME&entry.456=MANUFACTURER...

  // We'll do simple string replacement for the placeholders
  let url = templateUrl;

  const replacements = {
    'USERNAME': pickupData.username || '',
    'MANUFACTURER': pickupData.manufacturer || '',
    'MODEL': pickupData.model || '',
    'NORTH_RED': pickupData.northRed || '',
    'NORTH_BLACK': pickupData.northBlack || '',
    'NORTH_POLE': pickupData.northPole || '',
    'SOUTH_RED': pickupData.southRed || '',
    'SOUTH_BLACK': pickupData.southBlack || '',
    'SOUTH_POLE': pickupData.southPole || '',
    'NOTES': pickupData.notes || ''
  };

  // Replace each placeholder
  Object.keys(replacements).forEach(key => {
    url = url.replace(key, encodeURIComponent(replacements[key]));
  });

  return url;
}

// Export for use in component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseCSV,
    csvRowToPreset,
    loadPresetsFromCSV,
    generatePrefilledFormURL
  };
}

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

  // Try new format first (with analog meter perspective columns)
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
      let addedBy = isUserSubmissions ? row['Username'] || row['Your username (displayed as "Added by [username]")'] : null;

      // Skip tag for official/curated entries
      if (addedBy === 'Official' || addedBy === 'Curated' || addedBy === '') {
        addedBy = null;
      }

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
 *
 * Template URL should be created by:
 * 1. Text fields: Use placeholders USERNAME, MANUFACTURER, MODEL, NOTES
 * 2. Dropdowns (colors): Select "Black" for ALL wire color fields
 * 3. Multiple choice (poles): Select "Slug" for ALL pole type fields
 *
 * This function will replace them in the correct order with actual values
 */
function generatePrefilledFormURL(templateUrl, pickupData) {
  if (!templateUrl) return '';

  // Parse URL to get parameters
  const url = new URL(templateUrl);
  const params = new URLSearchParams(url.search);

  // Track which "Black" and "Slug" we're replacing (in order)
  let blackIndex = 0;
  let slugIndex = 0;

  // Order of Black replacements: North RED, North BLACK, South RED, South BLACK
  const blackReplacements = [
    pickupData.northRed,
    pickupData.northBlack,
    pickupData.southRed,
    pickupData.southBlack
  ];

  // Order of Slug replacements: North Pole, South Pole
  const slugReplacements = [
    pickupData.northPole,
    pickupData.southPole
  ];

  // Replace parameters
  const newParams = new URLSearchParams();

  for (const [key, value] of params.entries()) {
    let newValue = value;

    // Replace text placeholders
    if (value === 'USERNAME') {
      newValue = pickupData.username || '';
    } else if (value === 'MANUFACTURER') {
      newValue = pickupData.manufacturer || '';
    } else if (value === 'MODEL') {
      newValue = pickupData.model || '';
    } else if (value === 'NOTES') {
      newValue = pickupData.notes || '';
    }
    // Replace dropdown values (Black = wire colors)
    else if (value === 'Black' && blackIndex < blackReplacements.length) {
      newValue = blackReplacements[blackIndex] || 'Black';
      blackIndex++;
    }
    // Replace multiple choice values (Slug = pole types)
    else if (value === 'Slug' && slugIndex < slugReplacements.length) {
      newValue = slugReplacements[slugIndex] || 'Slug';
      slugIndex++;
    }

    newParams.append(key, newValue);
  }

  // Rebuild URL
  url.search = newParams.toString();
  return url.toString();
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

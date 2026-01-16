# Pickup Database - Edit & Validation Guide

This folder contains an editable spreadsheet of all humbucker pickup wire color codes.

## Files

- **`pickup_database_detailed.csv`** - The main detailed database (plain CSV)
- **`pickup_database_formatted.xlsx`** - Beautifully formatted Excel file with color coding
- **`generate_formatted_database.py`** - Script to create formatted Excel from CSV
- **`validate_pickup_database.py`** - Validation script to check for errors
- **`pickup_presets_generated.js`** - Auto-generated JavaScript (created by validation script)

## How to Edit the Database

### Step 1: Download and Edit

**Option A: Use the Formatted Excel File (Recommended)**
1. Download `pickup_database_formatted.xlsx`
2. Open in Excel or LibreOffice
3. You'll see:
   - 🎨 **Color-coded wire colors** (Black cells with white text, Red cells with red background, etc.)
   - 🔵 **STANDARD Ground/Hot** columns with blue background
   - 🟡 **PHASE REVERSED Ground/Hot** columns with yellow background
   - 🟢 **Ground wires** in green text
   - 🔴 **Hot wires** in red text
   - **Thick borders** around important columns

**Option B: Use the Plain CSV (For mass editing)**
1. Download `pickup_database_detailed.csv`
2. Open in Excel, Google Sheets, LibreOffice, or any text editor
3. No colors, but easier for bulk find/replace

**Make your changes:**
- Fix incorrect wire colors
- Add new pickup manufacturers
- Update pole types (Slug/Screw)
- Add notes

### Step 2: Understand the Columns

The database now shows **analog meter testing perspective** - which wire connects to which analog meter lead:

| Column | Description | Example (Seymour Duncan) |
|--------|-------------|---------|
| **Preset Name** | Pickup model/name | `Seymour Duncan` |
| **Manufacturer** | Company name | `Seymour Duncan` |
| **North Coil: RED lead (+)** | Wire that connects to RED (+) analog meter lead on north coil | `Green` ← This is ground |
| **North Coil: BLACK lead (−)** | Wire that connects to BLACK (−) analog meter lead on north coil | `Red` ← Series wire |
| **North Pole Type** | Slug or Screw | `Slug` |
| **South Coil: RED lead (+)** | Wire that connects to RED (+) analog meter lead on south coil | `White` ← Series wire |
| **South Coil: BLACK lead (−)** | Wire that connects to BLACK (−) analog meter lead on south coil | `Black` ← This is hot |
| **South Pole Type** | Slug or Screw | `Screw` |
| **Series Wire 1 (North Finish)** | North coil's series wire (BLACK lead side) | `Red` |
| **Series Wire 2 (South Start)** | South coil's series wire (RED lead side) | `White` |
| **STANDARD Ground Wire** | Ground wire in standard wiring (= North RED lead) | `Green` |
| **STANDARD Hot Wire** | Hot wire in standard wiring (= South BLACK lead) | `Black` |
| **PHASE REVERSED Ground Wire** | Ground when phase reversed (hot/ground swap) | `Black` ← Was hot |
| **PHASE REVERSED Hot Wire** | Hot when phase reversed (hot/ground swap) | `Green` ← Was ground |
| **Notes** | Any additional info | `Standard 4-conductor pattern` |

**Important:** When phase is reversed, the coil polarities and series connections stay the same - ONLY the hot and ground wires swap!

### Step 3: Wire Color Logic

**Standard Wiring:**
```
North Coil:  GND [Positive]---coil---[Negative] series
                                                    |
South Coil:        series [Positive]---coil---[Negative] HOT
```

- **Ground Wire** = North Coil Positive (left side of north coil)
- **Hot Wire** = South Coil Negative (right side of south coil)
- **Series Connection** = North Negative + South Positive (middle wires)

**Phase Reversed Wiring:**
When you reverse the phase, Ground and Hot swap:
- **Phase Reversed Ground** = Standard Hot Wire
- **Phase Reversed Hot** = Standard Ground Wire

### Step 4: Validate Your Changes

After editing, upload the CSV back and run:

```bash
python3 validate_pickup_database.py validate
```

This checks for:
- ✅ Valid wire colors
- ✅ Valid pole types (Slug/Screw)
- ✅ Ground wire = North Positive
- ✅ Hot wire = South Negative
- ✅ Phase reversal swaps are correct
- ✅ Series connection matches North Negative + South Positive

### Step 5: Generate JavaScript

If validation passes, generate the JavaScript preset array:

```bash
python3 validate_pickup_database.py generate
```

This creates `pickup_presets_generated.js` which can be copied into the main app.

### Step 6: Regenerate the Formatted Excel (Optional)

If you edited the plain CSV and want to see it with colors again:

```bash
python3 generate_formatted_database.py
```

This recreates `pickup_database_formatted.xlsx` with all the color coding and formatting.

### Step 7: Update the App

Copy the contents of `pickup_presets_generated.js` and replace the `presetDatabase` array in `humbucker_analyzer_component.js` (around line 103).

## Valid Wire Colors

- Black
- White
- Red
- Green
- Yellow
- Blue
- Orange
- Purple
- Brown
- Gray
- Bare/Shield

## Common Issues Found in the App

If you find bugs in the pickup summaries, check these:

1. **Wrong Ground/Hot wire** - Check that Standard Ground = North Positive and Standard Hot = South Negative
2. **Phase reversal not working** - Verify that Phase Reversed wires are swapped (Ground becomes Hot, Hot becomes Ground)
3. **Series connection wrong** - Make sure Series = North Negative + South Positive
4. **Inconsistent with manufacturer specs** - Verify against official pickup documentation

## Example: Seymour Duncan

```csv
Preset Name: Seymour Duncan
Manufacturer: Seymour Duncan
North Coil Positive: Green    ← This is GROUND (left side)
North Coil Negative: Red      ← This connects to series
North Pole Type: Slug
South Coil Positive: White    ← This connects to series
South Coil Negative: Black    ← This is HOT (right side)
South Pole Type: Screw
Standard Ground Wire: Green   ← Same as North Positive
Standard Hot Wire: Black      ← Same as South Negative
Phase Reversed Ground: Black  ← Swapped (was Hot)
Phase Reversed Hot: Green     ← Swapped (was Ground)
Series Connection: Red+White  ← North Negative + South Positive
```

## Need Help?

If you find an error in the database or aren't sure about a wire color, just upload your edited CSV and I'll validate it for you!

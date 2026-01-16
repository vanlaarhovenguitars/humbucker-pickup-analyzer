# Pickup Database - Edit & Validation Guide

This folder contains an editable spreadsheet of all humbucker pickup wire color codes.

## Files

- **`pickup_database.csv`** - The main database (editable in Excel, Google Sheets, or any text editor)
- **`validate_pickup_database.py`** - Validation script to check for errors
- **`pickup_presets_generated.js`** - Auto-generated JavaScript (created by validation script)

## How to Edit the Database

### Step 1: Download and Edit

1. Download `pickup_database.csv`
2. Open in Excel, Google Sheets, LibreOffice, or any CSV editor
3. Make your changes:
   - Fix incorrect wire colors
   - Add new pickup manufacturers
   - Update pole types (Slug/Screw)
   - Add notes

### Step 2: Understand the Columns

| Column | Description | Example |
|--------|-------------|---------|
| **Preset Name** | Pickup model/name | `Seymour Duncan` |
| **Manufacturer** | Company name | `Seymour Duncan` |
| **North Coil Positive (Start)** | North coil start wire (ground side) | `Green` |
| **North Coil Negative (Finish)** | North coil finish wire (series side) | `Red` |
| **North Pole Type** | Slug or Screw | `Slug` |
| **South Coil Positive (Start)** | South coil start wire (series side) | `White` |
| **South Coil Negative (Finish)** | South coil finish wire (hot side) | `Black` |
| **South Pole Type** | Slug or Screw | `Screw` |
| **Standard Ground Wire** | Ground wire (= North Positive) | `Green` |
| **Standard Hot Wire** | Hot wire (= South Negative) | `Black` |
| **Phase Reversed Ground Wire** | Ground when reversed (= South Negative) | `Black` |
| **Phase Reversed Hot Wire** | Hot when reversed (= North Positive) | `Green` |
| **Series Connection Wires** | Which wires join the coils | `Red+White` |
| **Notes** | Any additional info | `Standard 4-conductor pattern` |

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

### Step 6: Update the App

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

#!/usr/bin/env python3
"""
Pickup Database Validator
Validates the pickup_database.csv file for consistency and correctness
"""

import csv
import sys
from collections import defaultdict

# Valid wire colors
VALID_COLORS = {
    'Black', 'White', 'Red', 'Green', 'Yellow', 'Blue',
    'Orange', 'Purple', 'Brown', 'Gray', 'Bare/Shield', ''
}

def validate_csv(filename='pickup_database.csv'):
    """Validate the pickup database CSV file"""
    errors = []
    warnings = []
    pickups = []

    print(f"🔍 Validating {filename}...")
    print()

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            for row_num, row in enumerate(reader, start=2):  # start at 2 (header is row 1)
                preset_name = row['Preset Name']
                manufacturer = row['Manufacturer']

                # Validate wire colors
                for field in ['North Coil Positive (Start)', 'North Coil Negative (Finish)',
                             'South Coil Positive (Start)', 'South Coil Negative (Finish)',
                             'Standard Ground Wire', 'Standard Hot Wire',
                             'Phase Reversed Ground Wire', 'Phase Reversed Hot Wire']:
                    color = row[field]
                    if color not in VALID_COLORS:
                        errors.append(f"Row {row_num} ({preset_name}): Invalid color '{color}' in {field}")

                # Validate pole types
                for field in ['North Pole Type', 'South Pole Type']:
                    pole = row[field]
                    if pole not in ['Slug', 'Screw', '']:
                        errors.append(f"Row {row_num} ({preset_name}): Invalid pole type '{pole}' in {field}")

                # Check that Standard Ground = North Coil Positive
                if row['Standard Ground Wire'] != row['North Coil Positive (Start)']:
                    errors.append(
                        f"Row {row_num} ({preset_name}): Standard Ground Wire ('{row['Standard Ground Wire']}') "
                        f"should match North Coil Positive ('{row['North Coil Positive (Start)']}'))"
                    )

                # Check that Standard Hot = South Coil Negative
                if row['Standard Hot Wire'] != row['South Coil Negative (Finish)']:
                    errors.append(
                        f"Row {row_num} ({preset_name}): Standard Hot Wire ('{row['Standard Hot Wire']}') "
                        f"should match South Coil Negative ('{row['South Coil Negative (Finish)']}'))"
                    )

                # Check that Phase Reversed wires are swapped
                if row['Phase Reversed Ground Wire'] != row['Standard Hot Wire']:
                    errors.append(
                        f"Row {row_num} ({preset_name}): Phase Reversed Ground Wire ('{row['Phase Reversed Ground Wire']}') "
                        f"should equal Standard Hot Wire ('{row['Standard Hot Wire']}'))"
                    )

                if row['Phase Reversed Hot Wire'] != row['Standard Ground Wire']:
                    errors.append(
                        f"Row {row_num} ({preset_name}): Phase Reversed Hot Wire ('{row['Phase Reversed Hot Wire']}') "
                        f"should equal Standard Ground Wire ('{row['Standard Ground Wire']}'))"
                    )

                # Validate series connection format (should be "color1+color2")
                series = row['Series Connection Wires']
                if series and '+' in series:
                    parts = series.split('+')
                    if len(parts) == 2:
                        # Check that series wires match North Negative + South Positive
                        expected_series = f"{row['North Coil Negative (Finish)']}+{row['South Coil Positive (Start)']}"
                        if series != expected_series:
                            errors.append(
                                f"Row {row_num} ({preset_name}): Series Connection ('{series}') "
                                f"should be '{expected_series}'"
                            )

                pickups.append(row)

    except FileNotFoundError:
        print(f"❌ Error: File '{filename}' not found!")
        return False
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

    # Print results
    print(f"✅ Validated {len(pickups)} pickup presets")
    print()

    if errors:
        print(f"❌ Found {len(errors)} errors:")
        for error in errors:
            print(f"  • {error}")
        print()

    if warnings:
        print(f"⚠️  Found {len(warnings)} warnings:")
        for warning in warnings:
            print(f"  • {warning}")
        print()

    if not errors and not warnings:
        print("✨ All validations passed! Database is clean.")
        return True
    elif not errors:
        print("✅ No errors found (only warnings)")
        return True
    else:
        print(f"❌ Validation failed with {len(errors)} errors")
        return False


def generate_javascript(csv_filename='pickup_database.csv', output_filename='pickup_presets_generated.js'):
    """Generate JavaScript preset array from CSV"""
    print(f"📝 Generating JavaScript from {csv_filename}...")

    try:
        with open(csv_filename, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            js_lines = ["const presetDatabase = ["]
            js_lines.append("  { name: '-- Select a Preset --', manufacturer: '', north: { positive: '', negative: '', poleType: '' }, south: { positive: '', negative: '', poleType: '' } },")
            js_lines.append("  { name: 'Custom/Unknown Pickup', manufacturer: 'Custom', north: { positive: '', negative: '', poleType: '' }, south: { positive: '', negative: '', poleType: '' } },")

            for row in reader:
                preset_name = row['Preset Name']
                manufacturer = row['Manufacturer']
                north_pos = row['North Coil Positive (Start)']
                north_neg = row['North Coil Negative (Finish)']
                north_pole = row['North Pole Type']
                south_pos = row['South Coil Positive (Start)']
                south_neg = row['South Coil Negative (Finish)']
                south_pole = row['South Pole Type']

                js_line = f"  {{ name: '{preset_name}', manufacturer: '{manufacturer}', north: {{ positive: '{north_pos}', negative: '{north_neg}', poleType: '{north_pole}' }}, south: {{ positive: '{south_pos}', negative: '{south_neg}', poleType: '{south_pole}' }} }},"
                js_lines.append(js_line)

            js_lines.append("];")

        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write('\n'.join(js_lines))

        print(f"✅ Generated {output_filename}")
        return True

    except Exception as e:
        print(f"❌ Error generating JavaScript: {e}")
        return False


def print_usage():
    """Print usage instructions"""
    print("""
Pickup Database Validator & Generator

Usage:
  python3 validate_pickup_database.py validate    # Validate the CSV
  python3 validate_pickup_database.py generate    # Generate JavaScript from CSV
  python3 validate_pickup_database.py both        # Do both validation and generation

After editing pickup_database.csv:
  1. Run: python3 validate_pickup_database.py validate
  2. Fix any errors shown
  3. Run: python3 validate_pickup_database.py generate
  4. Copy the generated JavaScript back into humbucker_analyzer_component.js
""")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == 'validate':
        success = validate_csv()
        sys.exit(0 if success else 1)
    elif command == 'generate':
        success = generate_javascript()
        sys.exit(0 if success else 1)
    elif command == 'both':
        success1 = validate_csv()
        print()
        success2 = generate_javascript()
        sys.exit(0 if (success1 and success2) else 1)
    else:
        print(f"Unknown command: {command}")
        print_usage()
        sys.exit(1)

#!/usr/bin/env python3
"""
Convert detailed pickup database to Google Form response format
"""

import csv
from datetime import datetime

def convert_to_form_format(input_file='pickup_database_detailed.csv', output_file='pickup_database_for_google_form.csv'):
    """Convert detailed CSV to Google Form response format"""

    print(f"📊 Converting {input_file} to Google Form format...")

    # Google Form response columns (matches the form we're creating)
    form_columns = [
        'Timestamp',
        'Your username (displayed as "Added by [username]")',
        'Manufacturer/Brand name',
        'Pickup model or name (optional)',
        'North Coil: RED lead (+) wire color',
        'North Coil: BLACK lead (−) wire color',
        'North Coil Pole Type',
        'South Coil: RED lead (+) wire color',
        'South Coil: BLACK lead (−) wire color',
        'South Coil Pole Type',
        'Additional notes (optional)'
    ]

    rows = []

    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Map from detailed CSV to form format
            form_row = {
                'Timestamp': datetime.now().strftime('%m/%d/%Y %H:%M:%S'),  # Current timestamp
                'Your username (displayed as "Added by [username]")': 'Official',  # Mark as official/curated
                'Manufacturer/Brand name': row['Manufacturer'],
                'Pickup model or name (optional)': row['Preset Name'],
                'North Coil: RED lead (+) wire color': row['North Coil: RED lead (+)'],
                'North Coil: BLACK lead (−) wire color': row['North Coil: BLACK lead (−)'],
                'North Coil Pole Type': row['North Pole Type'],
                'South Coil: RED lead (+) wire color': row['South Coil: RED lead (+)'],
                'South Coil: BLACK lead (−) wire color': row['South Coil: BLACK lead (−)'],
                'South Coil Pole Type': row['South Pole Type'],
                'Additional notes (optional)': row['Notes']
            }

            rows.append(form_row)

    # Write to output file
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=form_columns)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ Created {output_file} with {len(rows)} pickups")
    print(f"\n📋 Next steps:")
    print(f"   1. Open your new Google Sheet (the one created by the form)")
    print(f"   2. Go to File → Import")
    print(f"   3. Upload {output_file}")
    print(f"   4. Import location: 'Replace current sheet' OR 'Append to current sheet'")
    print(f"   5. Separator type: Comma")
    print(f"   6. Click 'Import data'")
    print(f"\n🎉 Your database will be populated!")

if __name__ == '__main__':
    convert_to_form_format()

# Google Form Setup Instructions

## Step 1: Create the Google Form

1. Go to https://forms.google.com
2. Click **"Blank Form"** or **"+ New"**
3. Title: **"Humbucker Pickup Community Database Submission"**
4. Description: **"Share your pickup wire color information with the community. Your submission will be added to the public database and tagged with your username."**

## Step 2: Add Form Fields (in this exact order)

### Field 1: Username
- **Type:** Short answer
- **Question:** Your username (displayed as "Added by [username]")
- **Required:** Yes

### Field 2: Manufacturer/Brand
- **Type:** Short answer
- **Question:** Manufacturer/Brand name
- **Description:** e.g., "Seymour Duncan", "DiMarzio", "Custom Brand"
- **Required:** Yes

### Field 3: Pickup Model/Name
- **Type:** Short answer
- **Question:** Pickup model or name (optional)
- **Description:** e.g., "JB", "Super Distortion", "Custom Bridge"
- **Required:** No

### Field 4: North Coil - RED lead (+)
- **Type:** Dropdown
- **Question:** North Coil: RED lead (+) wire color
- **Options:** Black, White, Red, Green, Yellow, Blue, Orange, Purple, Brown, Gray, Bare/Shield
- **Required:** Yes

### Field 5: North Coil - BLACK lead (−)
- **Type:** Dropdown
- **Question:** North Coil: BLACK lead (−) wire color
- **Options:** Black, White, Red, Green, Yellow, Blue, Orange, Purple, Brown, Gray, Bare/Shield
- **Required:** Yes

### Field 6: North Pole Type
- **Type:** Multiple choice
- **Question:** North Coil Pole Type
- **Options:** Slug, Screw
- **Required:** Yes

### Field 7: South Coil - RED lead (+)
- **Type:** Dropdown
- **Question:** South Coil: RED lead (+) wire color
- **Options:** Black, White, Red, Green, Yellow, Blue, Orange, Purple, Brown, Gray, Bare/Shield
- **Required:** Yes

### Field 8: South Coil - BLACK lead (−)
- **Type:** Dropdown
- **Question:** South Coil: BLACK lead (−) wire color
- **Options:** Black, White, Red, Green, Yellow, Blue, Orange, Purple, Brown, Gray, Bare/Shield
- **Required:** Yes

### Field 9: South Pole Type
- **Type:** Multiple choice
- **Question:** South Coil Pole Type
- **Options:** Slug, Screw
- **Required:** Yes

### Field 10: Additional Notes
- **Type:** Paragraph
- **Question:** Additional notes (optional)
- **Description:** Any additional information about this pickup
- **Required:** No

## Step 3: Get the Pre-filled Form URL Template

1. Click the **three dots menu** (⋮) in the top right
2. Select **"Get pre-filled link"**
3. Fill out the form with **these EXACT values**:

   **Text fields (use placeholders):**
   - Username: `USERNAME`
   - Manufacturer: `MANUFACTURER`
   - Model: `MODEL`
   - Notes: `NOTES`

   **Dropdown fields (use "Black" for ALL wire colors):**
   - North Coil: RED lead (+): Select **Black**
   - North Coil: BLACK lead (−): Select **Black**
   - South Coil: RED lead (+): Select **Black**
   - South Coil: BLACK lead (−): Select **Black**

   **Multiple choice (use "Slug" for ALL pole types):**
   - North Coil Pole Type: Select **Slug**
   - South Coil Pole Type: Select **Slug**

4. Click **"Get link"** at the bottom
5. Click **"Copy link"**
6. **Save this URL** - you'll need to give it to me

**Why Black and Slug?** The app will automatically replace these values in order with the actual wire colors and pole types from the custom pickup. This is how Google Forms dropdowns work with pre-filled links.

The URL will look like:
```
https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.123456=USERNAME&entry.234567=MANUFACTURER...
```

## Step 4: Link Form to Google Sheets

1. In the form, click the **"Responses"** tab
2. Click the green **Google Sheets icon** (Create Spreadsheet)
3. Select **"Create a new spreadsheet"** or **"Select existing spreadsheet"**
   - If creating new: Name it "Pickup Community Submissions"
   - If using existing: Add a new sheet tab called "User Submissions"
4. Click **"Create"** or **"Select"**

## Step 5: Publish the Responses Sheet

1. Open the responses spreadsheet
2. Go to **File → Share → Publish to web**
3. Select the **"User Submissions"** sheet (or whatever tab has the responses)
4. Format: **Comma-separated values (.csv)**
5. Check **"Automatically republish when changes are made"**
6. Click **"Publish"**
7. **Copy the CSV URL** - you'll need to give this to me too

## Step 6: Give Me These URLs

Once you have:
1. **Pre-filled form template URL** (from Step 3)
2. **Published CSV URL** for user submissions (from Step 5)

Paste them here and I'll integrate them into the app!

---

## What Happens Next

Once integrated:
- Users create custom pickups in the wizard
- They click "Share with Community"
- Form opens with all their wire colors pre-filled
- They just add username and submit
- Submission goes to your Google Sheet
- App loads it automatically
- Shows as "Brand (Added by username)" in the dropdown

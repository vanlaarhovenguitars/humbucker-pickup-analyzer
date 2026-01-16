// Humbucker Analyzer Configuration
// Update these URLs to connect to your Google Sheets

const CONFIG = {
  // Main curated database CSV URL
  // This is your published Google Sheet with verified pickup data
  // NOTE: Currently using single-sheet approach - all pickups (official + community) are in USER_SUBMISSIONS_URL
  CURATED_DATABASE_URL: '',

  // User submissions CSV URL (from Google Form responses)
  // Using single-sheet approach: contains both official pickups (username="Official") and community submissions
  USER_SUBMISSIONS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5g7dXtFeRqh6sqTn91tfRA6a1BB2ZKgd7Lh7tL10UuAJDOYMJB9wlZjmUWHQPJ2vC5tqmsnydNV4F/pub?gid=579757411&single=true&output=csv',

  // Pre-filled Google Form URL template
  // Get this by creating a pre-filled link in your Google Form
  // The app will replace placeholders like USERNAME, MANUFACTURER, etc.
  GOOGLE_FORM_TEMPLATE_URL: '',

  // Feature flags
  ENABLE_GOOGLE_SHEETS: true,  // Set to false to use hardcoded database only
  ENABLE_USER_SUBMISSIONS: true,  // TRUE: Load from Google Sheets (includes both official and community pickups)
  ENABLE_SHARE_BUTTON: true,  // TRUE: Show "Share with Community" button (needs GOOGLE_FORM_TEMPLATE_URL)
};

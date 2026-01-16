// Humbucker Analyzer Configuration
// Update these URLs to connect to your Google Sheets

const CONFIG = {
  // Main curated database CSV URL
  // This is your published Google Sheet with verified pickup data
  CURATED_DATABASE_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTUNZLn910r8v1stV7K_ibcBoQwshA7j_Vol96cLlL1uhJJXIUdzoE6wfJRv8AzAA/pub?gid=551643659&single=true&output=csv',

  // User submissions CSV URL (from Google Form responses)
  // Leave empty until you set up the Google Form
  USER_SUBMISSIONS_URL: '',

  // Pre-filled Google Form URL template
  // Get this by creating a pre-filled link in your Google Form
  // The app will replace placeholders like USERNAME, MANUFACTURER, etc.
  GOOGLE_FORM_TEMPLATE_URL: '',

  // Feature flags
  ENABLE_GOOGLE_SHEETS: true,  // Set to false to use hardcoded database only
  ENABLE_USER_SUBMISSIONS: false,  // Set to true once form is set up
  ENABLE_SHARE_BUTTON: false,  // Set to true once form template URL is configured
};

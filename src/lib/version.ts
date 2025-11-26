// Application version
// Update this with each release
export const APP_VERSION = '1.001';

// Version history (most recent first)
export const VERSION_HISTORY = [
  {
    version: '1.001',
    date: '2024-11-24',
    changes: [
      'Added Apicurio Registry support for bfs.online group (Informix schemas: loc1, loc, stcode)',
      'Implemented artifact grouping in Data Capture Specification creation dialog',
      'Added version 1.0.0 support for Apicurio artifacts',
      'Improved CORS error handling with graceful fallback to local templates',
      'Enhanced nested schema structure support (TxnType + Txn.properties)',
      'Removed default placeholders from Data Capture Specification form fields',
      'Fixed Allowed Filters extraction for nested Informix schemas',
      'Added application version display in user profile'
    ]
  }
];

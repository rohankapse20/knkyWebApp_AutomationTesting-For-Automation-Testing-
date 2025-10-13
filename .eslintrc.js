module.exports = {
  plugins: ['import'],
  rules: {
    'import/no-unresolved': 'error',
    'import/no-named-as-default-member': 'warn',
    'import/no-duplicates': 'warn',
    'import/no-named-as-default': 'warn',
    'import/no-case-sensitive': 'error' // This one enforces casing
  }
};

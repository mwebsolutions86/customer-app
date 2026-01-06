// Configuration ESLint simplifiée pour Universal Eats
module.exports = {
  extends: [
    '@expo',
  ],
  rules: {
    // Désactiver temporairement certaines règles strictes
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};

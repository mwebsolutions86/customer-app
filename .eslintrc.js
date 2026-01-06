// Classic ESLint config for the customer app
module.exports = {
  root: true,
  extends: ['@expo'],
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};

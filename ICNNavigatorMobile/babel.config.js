module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'react-native-worklets/plugin',
    ...(process.env.JEST ? ['istanbul'] : []), // coverage only in tests
  ],
};
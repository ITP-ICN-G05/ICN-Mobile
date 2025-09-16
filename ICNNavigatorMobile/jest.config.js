module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/setup/jest-polyfills.js'],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest-setup.ts',
    '@testing-library/jest-native/extend-expect',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native' +
      '|@react-native' +
      '|react-clone-referenced-element' +
      '|@react-navigation' +
      '|@expo' +
      '|expo(nent)?' +
      '|expo-modules-core' +
      '|@unimodules' +
      '|react-native-reanimated' +
      ')/)',
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/tests/mocks/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage',
  // Optional thresholds – keep modest to start
  coverageThreshold: { global: { lines: 60, statements: 60, branches: 50, functions: 60 } },
};
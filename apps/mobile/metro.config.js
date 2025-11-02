const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('sha256')) {
  config.resolver.assetExts.push('sha256');
}

module.exports = config;


const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Include .onnx and .ort model files in Metro asset extensions
config.resolver.assetExts.push('onnx', 'ort');

module.exports = config;

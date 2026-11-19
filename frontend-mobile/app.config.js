const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

function withCleartextTraffic(config) {
  return withAndroidManifest(config, (modConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(modConfig.modResults);
    application.$['android:usesCleartextTraffic'] = 'true';
    return modConfig;
  });
}

module.exports = ({ config }) => {
  return withCleartextTraffic({
    ...config,
    android: {
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
    },
  });
};

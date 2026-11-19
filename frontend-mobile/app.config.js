const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

function withPreviewApiNetworkSecurity(config) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (process.env.EAS_BUILD_PROFILE !== 'preview' || !apiUrl) {
    return config;
  }

  const { protocol, hostname } = new URL(apiUrl);
  if (protocol !== 'http:') {
    return config;
  }

  const resourceName = 'preview_api_network_security';
  config = withAndroidManifest(config, (modConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(modConfig.modResults);
    application.$['android:networkSecurityConfig'] = `@xml/${resourceName}`;
    return modConfig;
  });

  return withDangerousMod(config, ['android', async (modConfig) => {
    const resourceDir = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
    const domain = hostname.replaceAll('&', '&amp;');
    await mkdir(resourceDir, { recursive: true });
    await writeFile(path.join(resourceDir, `${resourceName}.xml`), `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain>${domain}</domain>
  </domain-config>
</network-security-config>
`);
    return modConfig;
  }]);
}

module.exports = ({ config }) => {
  return withPreviewApiNetworkSecurity({
    ...config,
    android: {
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
    },
  });
};

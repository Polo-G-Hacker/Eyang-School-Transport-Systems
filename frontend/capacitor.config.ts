import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.saintjean.ests',
  appName: 'Eyang Transport',
  webDir: 'www',
  server: { androidScheme: 'https' },
  plugins: {
    Geolocation: { permissions: ['location'] }
  }
};

export default config;

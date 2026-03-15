import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tindapos.app',
  appName: 'TindaPOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cencorse.app',
  appName: 'CEN Corse',
  webDir: 'out',
  // Important: PAS de config 'server' = charge les fichiers depuis le bundle local
  // Avec server.hostname, ça charge depuis une URL (barre bleue du navigateur)
  // PAS de server config - on utilise les fichiers locaux bundle dans l'APK
  // server config = charger depuis une URL (mode développement uniquement)
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#1e3a8a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false
    },
    StatusBar: {
      backgroundColor: "#1e3a8a",
      style: "dark",
      overlaysWebView: false
    }
  }
};

export default config;


// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = {
  appId: "cr.fincaapp.app",
  appName: "FincaApp",
  webDir: "out",
  server: {
    androidScheme: "https",
    // Para desarrollo: apunta al servidor local en la red WiFi.
    // Cambia esta IP por la IP de tu computadora en la red local.
    // Comenta esta línea para producción (cargará los archivos de /out).
    url: "http://10.89.115.46:3000",
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#16a34a",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;

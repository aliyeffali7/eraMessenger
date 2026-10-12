// app.json stays the static base (still readable by tools that expect plain
// JSON). This wrapper only exists to swap in the Firebase config file at
// build time: google-services.json is gitignored (it's a secret, shared
// out-of-band), so EAS Build can't see it in the uploaded project archive.
// It's instead stored as a secret "file" env var (GOOGLE_SERVICES_JSON) on
// EAS, which resolves to a local temp file path at build time. Locally
// (no EXPO env var set) this falls back to the real file on disk, so
// `npx expo start` / `expo prebuild` are unaffected.
//
// A google-services.json placed in this folder wins over the EAS secret, so
// switching Firebase projects only needs the new file copied in here.
const fs = require("fs");
const path = require("path");
const baseConfig = require("./app.json").expo;
const localGoogleServices = path.join(__dirname, "google-services.json");

module.exports = {
  expo: {
    ...baseConfig,
    android: {
      ...baseConfig.android,
      googleServicesFile: fs.existsSync(localGoogleServices)
        ? baseConfig.android.googleServicesFile
        : process.env.GOOGLE_SERVICES_JSON || baseConfig.android.googleServicesFile,
    },
  },
};

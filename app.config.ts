import { ExpoConfig, ConfigContext } from 'expo/config';
import fs from 'fs';
import path from 'path';
// Avoid importing project TypeScript helpers here because Expo reads this
// config with Node and importing .ts files can fail at startup.

// Interface pour typer la configuration de la marque
interface BrandConfig {
  name: string;
  slug?: string;
  scheme?: string;
  storeId: string | null;
  primaryColor: string;
}

// On lit la variable d'environnement
let BRAND_SLUG = process.env.APP_VARIANT || 'default';

// If the specified brand folder doesn't exist, pick the first available brand folder
const brandsDir = path.join(__dirname, 'brands');
if (!fs.existsSync(path.join(brandsDir, BRAND_SLUG))) {
  try {
    const entries = fs.readdirSync(brandsDir, { withFileTypes: true });
    const firstFolder = entries.find(e => e.isDirectory())?.name;
    if (firstFolder) BRAND_SLUG = firstFolder;
  } catch (e) {
    // ignore, we'll fallback to defaults below
  }
}

// On construit le chemin du fichier config
const brandConfigPath = path.join(__dirname, 'brands', BRAND_SLUG, 'config.json');

// CORRECTION ICI : Utilisation de readFileSync avec typage approprié
let brandConfig: BrandConfig;
try {
  if (fs.existsSync(brandConfigPath)) {
    const rawData = fs.readFileSync(brandConfigPath, 'utf-8');
    brandConfig = JSON.parse(rawData) as BrandConfig;
  } else {
    brandConfig = { name: "Momo Délice", storeId: null, primaryColor: "#000000" };
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn("Erreur lecture config:", e);
  brandConfig = { name: "Momo Délice", storeId: '73b158dd-4ff1-4294-9279-0f5d98f95480', primaryColor: "#50e6f8" };
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: brandConfig.name,
  slug: brandConfig.slug || 'universal-eats',
  scheme: brandConfig.scheme || 'universaleats',
  icon: `./brands/${BRAND_SLUG}/icon.png`,
  splash: {
    image: `./brands/${BRAND_SLUG}/splash.png`,
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    bundleIdentifier: `com.tonagence.${BRAND_SLUG.replace(/-/g, '')}`,
    buildNumber: "1.0.0"
  },
  android: {
    package: `com.tonagence.${BRAND_SLUG.replace(/-/g, '_')}`,
    adaptiveIcon: {
      foregroundImage: `./brands/${BRAND_SLUG}/icon.png`,
      backgroundColor: "#ffffff"
    }
  },
  extra: {
    storeId: brandConfig.storeId,
    primaryColor: brandConfig.primaryColor,
    eas: {
      projectId: "ton-project-id-expo" // À configurer plus tard
    }
  }
});
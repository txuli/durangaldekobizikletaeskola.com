const API_URL =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_API_URL_DEVELOPMENT
    : process.env.NEXT_PUBLIC_API_URL_PRODUCTION;

// Canonical public origin of the site. Used to build absolute URLs for
// metadata (canonical/hreflang links, Open Graph, sitemap, robots).
const SITE_URL = "https://durangaldekobizikletaeskola.com";

const SITE_NAME = "Durangaldeko Bizikleta Eskola";

export { API_URL, SITE_URL, SITE_NAME };
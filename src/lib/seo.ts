import { routing } from "@/i18n/routing";
import { SITE_NAME, SITE_URL } from "@/lib/config";

/**
 * Resolves a site-relative path to an absolute URL under SITE_URL.
 * `absoluteUrl()` (no args) returns the site root.
 */
export function absoluteUrl(path: string = "") {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Builds the `alternates` block (canonical + hreflang) for a page that
 * lives at `pathname` (locale-agnostic, e.g. "/eskola", or "" for home)
 * under the given `locale`. Every locale variant is listed so search
 * engines can tell translations apart instead of treating them as
 * duplicate content, plus an `x-default` pointing at the default locale.
 */
export function buildAlternates(locale: string, pathname: string = "") {
  const clean = pathname === "/" ? "" : pathname;
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = absoluteUrl(`/${loc}${clean}`);
  }
  languages["x-default"] = absoluteUrl(`/${routing.defaultLocale}${clean}`);

  return {
    canonical: absoluteUrl(`/${locale}${clean}`),
    languages,
  };
}

/**
 * Open Graph/Twitter titles are never passed through the layout's
 * `title.template` (that mechanic only applies to the <title> tag), so
 * pages that want the brand name in social previews need to append it
 * themselves — this keeps that consistent.
 */
export function withBrand(title: string) {
  return `${title} | ${SITE_NAME}`;
}

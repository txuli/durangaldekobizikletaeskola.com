import { absoluteUrl } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/config";

/**
 * JSON-LD structured data (schema.org) describing the school as a
 * physical sports venue. Powers Google's local-business rich results
 * (map pack, knowledge panel) — nothing here is user-visible.
 */
export default function LocalBusinessSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteUrl("/media/logo.png"),
    logo: absoluteUrl("/media/logo.png"),
    email: "durangaldekobizikletaeskola@gmail.com",
    telephone: "+34699780190",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Murueta Torre Auzunea, 5D",
      addressLocality: "Durango",
      addressRegion: "Bizkaia",
      postalCode: "48200",
      addressCountry: "ES",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.173116,
      longitude: -2.634083,
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=100014739280844",
      "https://www.instagram.com/durangaldeko_bzkeskola/",
      "https://x.com/scduranguesa",
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

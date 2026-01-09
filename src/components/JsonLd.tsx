const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://weichieh.photography";

interface WebsiteJsonLdProps {
  name?: string;
  description?: string;
}

export function WebsiteJsonLd({
  name = "WeiChieh Photography",
  description = "一張圖片一個故事 - Photography by WeiChieh"
}: WebsiteJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    description,
    url: BASE_URL,
    inLanguage: "zh-TW",
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface PersonJsonLdProps {
  name?: string;
  jobTitle?: string;
  description?: string;
  image?: string;
}

export function PersonJsonLd({
  name = "WeiChieh",
  jobTitle = "Photographer",
  description = "一張圖片一個故事 - Photography by WeiChieh",
  image,
}: PersonJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle,
    description,
    url: BASE_URL,
    ...(image && { image }),
    sameAs: [
      // Add social media links here if available
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface PhotoJsonLdProps {
  title: string;
  description: string;
  image: string;
  url: string;
  datePublished: string;
  location?: string;
  camera?: string;
  author?: string;
}

export function PhotoJsonLd({
  title,
  description,
  image,
  url,
  datePublished,
  location,
  camera,
  author = "WeiChieh",
}: PhotoJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: title,
    description,
    contentUrl: image,
    url,
    datePublished,
    author: {
      "@type": "Person",
      name: author,
    },
    ...(location && {
      contentLocation: {
        "@type": "Place",
        name: location,
      },
    }),
    ...(camera && {
      exifData: {
        "@type": "PropertyValue",
        name: "camera",
        value: camera,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface ArticleJsonLdProps {
  title: string;
  description: string;
  image: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  category?: string;
}

export function ArticleJsonLd({
  title,
  description,
  image,
  url,
  datePublished,
  dateModified,
  author = "WeiChieh",
  category,
}: ArticleJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image,
    url,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: author,
      url: BASE_URL,
    },
    publisher: {
      "@type": "Person",
      name: "WeiChieh",
      url: BASE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(category && { articleSection: category }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

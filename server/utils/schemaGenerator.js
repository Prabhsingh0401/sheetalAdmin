const DEFAULT_WEBSITE_URL = "https://studiobysheetal.com";
const DEFAULT_WEBSITE_NAME = "Studio By Sheetal";
const DEFAULT_SEARCH_PATH = "/product-list?search={search_term_string}";

const normalizeUrl = (value, fallback = DEFAULT_WEBSITE_URL) => {
  const url = String(value || fallback).trim();
  return url.replace(/\/+$/, "");
};

const firstDefined = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      !(typeof value === "string" && value.trim() === ""),
  );

const stripHtml = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const resolveProductUrl = (product, websiteUrl) => {
  if (product?.canonicalUrl) return product.canonicalUrl;
  const categorySlug = product?.category?.slug || product?.categorySlug;
  if (categorySlug && product?.slug) {
    return `${websiteUrl}/${encodeURIComponent(categorySlug)}/${encodeURIComponent(product.slug)}`;
  }
  if (product?.slug) {
    return `${websiteUrl}/product/${encodeURIComponent(product.slug)}`;
  }
  return websiteUrl;
};

const resolveCategoryUrl = (category, websiteUrl) =>
  category?.canonicalUrl ||
  (category?.slug
    ? `${websiteUrl}/${encodeURIComponent(category.slug)}`
    : websiteUrl);

const resolvePageUrl = (page, websiteUrl) =>
  page?.canonicalUrl ||
  (page?.slug ? `${websiteUrl}/${encodeURIComponent(page.slug)}` : websiteUrl);

const resolveProductOffers = (product, productUrl) => {
  const pricePoints = [];
  let offerCount = 0;

  for (const variant of product?.variants || []) {
    for (const size of variant?.sizes || []) {
      const price =
        Number(size?.discountPrice) > 0
          ? Number(size.discountPrice)
          : Number(size?.price);

      if (Number.isFinite(price) && price >= 0) {
        pricePoints.push(price);
        offerCount += 1;
      }
    }
  }

  const lowPrice = pricePoints.length ? Math.min(...pricePoints) : 0;
  const highPrice = pricePoints.length ? Math.max(...pricePoints) : lowPrice;

  return {
    "@type": "AggregateOffer",
    url: productUrl,
    priceCurrency: "INR",
    lowPrice,
    highPrice,
    offerCount: offerCount || 1,
    availability:
      Number(product?.stock) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
  };
};

export const buildProductSchema = (product, settings = {}) => {
  if (!product) return null;

  const websiteUrl = normalizeUrl(settings.websiteUrl);
  const productUrl = resolveProductUrl(product, websiteUrl);
  const image = [
    product?.ogImage,
    product?.mainImage?.url,
    ...(product?.images || []).map((item) => item?.url).filter(Boolean),
  ].filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: firstDefined(product?.metaTitle, product?.name),
    image,
    description: firstDefined(
      stripHtml(product?.metaDescription),
      stripHtml(product?.shortDescription),
      stripHtml(product?.description),
    ),
    sku: product?.sku,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: firstDefined(
        product?.brandInfo,
        settings?.organizationName,
        DEFAULT_WEBSITE_NAME,
      ),
    },
    offers: resolveProductOffers(product, productUrl),
  };

  if (Number(product?.totalReviews) > 0 && Number(product?.averageRating) > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.averageRating),
      reviewCount: Number(product.totalReviews),
    };
  }

  return schema;
};

export const buildCategorySchema = (category, products = [], settings = {}) => {
  if (!category) return null;

  const websiteUrl = normalizeUrl(settings.websiteUrl);
  const categoryUrl = resolveCategoryUrl(category, websiteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: firstDefined(category?.metaTitle, category?.name),
    url: categoryUrl,
    description: firstDefined(
      stripHtml(category?.metaDescription),
      stripHtml(category?.description),
    ),
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: products?.length || 0,
      itemListElement: (products || []).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: resolveProductUrl(product, websiteUrl),
        name: product?.name,
      })),
    },
  };
};

export const buildPageSchema = (page, settings = {}) => {
  if (!page) return null;

  const websiteUrl = normalizeUrl(settings.websiteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: firstDefined(page?.metaTitle, page?.title),
    description: firstDefined(
      stripHtml(page?.metaDescription),
      stripHtml(page?.content),
    ),
    url: resolvePageUrl(page, websiteUrl),
  };
};

export const buildOrganizationSchema = (settings = {}) => {
  const websiteUrl = normalizeUrl(settings.websiteUrl);
  const sameAs = (settings?.socialMediaLinks || [])
    .map((item) => item?.url?.trim())
    .filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: firstDefined(settings?.organizationName, DEFAULT_WEBSITE_NAME),
    description: stripHtml(settings?.organizationDescription || ""),
    url: websiteUrl,
  };

  if (settings?.logo) schema.logo = settings.logo;

  if (settings?.contactPhone || settings?.contactEmail) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
    };
    if (settings?.contactPhone) {
      schema.contactPoint.telephone = settings.contactPhone;
    }
    if (settings?.contactEmail) {
      schema.contactPoint.email = settings.contactEmail;
    }
  }

  if (sameAs.length) schema.sameAs = sameAs;

  return schema;
};

export const buildWebsiteSchema = (settings = {}) => {
  const websiteUrl = normalizeUrl(settings.websiteUrl);
  const searchTarget = `${websiteUrl}${settings?.searchPath || DEFAULT_SEARCH_PATH}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: firstDefined(settings?.websiteName, DEFAULT_WEBSITE_NAME),
    url: websiteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: searchTarget,
      },
      "query-input": "required name=search_term_string",
    },
  };
};

export const buildGlobalSchema = (settings = {}) => [
  buildOrganizationSchema(settings),
  buildWebsiteSchema(settings),
].filter(Boolean);

export const buildHomepageSchema = (homepage = {}, settings = {}) => {
  const websiteUrl = normalizeUrl(settings.websiteUrl);
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: firstDefined(
      homepage?.metaTitle,
      settings?.websiteName,
      DEFAULT_WEBSITE_NAME,
    ),
    description: firstDefined(
      stripHtml(homepage?.metaDescription),
      stripHtml(settings?.organizationDescription),
    ),
    url: homepage?.canonicalUrl || websiteUrl,
  };

  return [webPageSchema, ...buildGlobalSchema(settings)];
};

export const generateProductSchema = (product, settings) =>
  JSON.stringify(buildProductSchema(product, settings), null, 2);

export const generateCategorySchema = (category, products, settings) =>
  JSON.stringify(buildCategorySchema(category, products, settings), null, 2);

export const generatePageSchema = (page, settings) =>
  JSON.stringify(buildPageSchema(page, settings), null, 2);

export const generateHomepageSchema = (homepage, settings) =>
  JSON.stringify(buildHomepageSchema(homepage, settings), null, 2);

export const generateGlobalSchema = (settings) =>
  JSON.stringify(buildGlobalSchema(settings), null, 2);

export const buildFaqSchema = (faqPage, settings = {}) => {
  if (!faqPage || !faqPage.faqs) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (faqPage.faqs || [])
      .filter((faq) => faq.isActive)
      .map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: stripHtml(faq.answer),
        },
      })),
  };
};

export const generateFaqSchema = (faqPage, settings) =>
  JSON.stringify(buildFaqSchema(faqPage, settings), null, 2);

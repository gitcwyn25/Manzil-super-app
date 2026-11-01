# Manzil public SEO launch

Canonical site: https://manzilgroup.uz

The audit on 2 November 2026 confirmed that the apex domain, all three homepages, and Sunnatilla Tursunov's founder profile are publicly accessible with HTTP 200. Their HTML allows indexing and includes canonical URLs and language alternatives. The founder profile is already live with the confirmed UWED and TSUE education details.

Public accessibility does not establish Google index status. That must be inspected in the site's verified Google Search Console property.

## Website improvements

- Localized homepage titles and descriptions identify Manzil's cafes, restaurants, car services, and local businesses in Tashkent.
- The sitemap includes documentation and public company pages in Uzbek, Russian, and English, alongside the founder profile and existing catalogue routes.
- Sitemap generation no longer claims that every page changed whenever the sitemap refreshed. Add `lastModified` only when a source provides a genuine content-modification timestamp.
- Documentation pages have a single primary heading; repeated source titles are removed from the body, and remaining body headings start at h2.
- Organization structured data identifies Manzil Group as an alternate name for Manzil.
- Google HTML-tag verification can be configured without changing source code again.

## Complete Google Search Console verification

1. Open https://search.google.com/search-console/welcome using the Google account that should own the property.
2. Add a **URL-prefix** property for `https://manzilgroup.uz/`.
3. Choose **HTML tag** and copy its `content` value. For example, from `<meta name="google-site-verification" content="YOUR_VALUE" />`, use only `YOUR_VALUE`.
4. Set `GOOGLE_SITE_VERIFICATION` to that value in the `manzil-web` deployment's production environment, then redeploy. The value is a public verification token, not an API password.
5. Check the live homepage source for the exact Google verification meta tag, then click **Verify** in Search Console. Keep the value configured after verification.
6. Submit `https://manzilgroup.uz/sitemap.xml` in the Sitemaps section.
7. Inspect the three homepage URLs and the founder profile URL, then request indexing where needed. Monitor indexing, impressions, clicks, and name/brand queries over the following weeks.

A DNS-verified Domain property is also possible, but its verification record must come from Google and be added through the domain's DNS provider.

## Repair the www address

The audit found that `www.manzilgroup.uz` resolves in DNS, but its HTTPS certificate does not cover that hostname. The apex `manzilgroup.uz` certificate works.

In the existing Vercel **manzil-web** project:

1. Inspect the `www.manzilgroup.uz` domain mapping and certificate status.
2. Complete any Vercel-requested domain validation or DNS correction and ensure a valid certificate is issued for `www`.
3. Redirect `www.manzilgroup.uz` permanently to `manzilgroup.uz`, preserving paths and query strings.
4. Verify `https://www.manzilgroup.uz/en` completes TLS successfully and redirects to `https://manzilgroup.uz/en`.

Do not use the legacy Vercel project named **web**, whose configured `apps/business` root is absent from the repository. The consumer app is `apps/web` in **manzil-web**.

The saved Vercel CLI login was expired during the audit. An active Vercel connection is required to finish domain configuration and production deployment. No domain settings or access controls were changed during the audit.

## References

- [Google Search technical requirements](https://developers.google.com/search/docs/essentials/technical)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google Search Console ownership verification](https://support.google.com/webmasters/answer/9008080)

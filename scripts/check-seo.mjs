import assert from "node:assert";
import fs from "node:fs";

async function main() {
  const baseUrl = "http://localhost:3001";

  // 1. Check robots.txt
  const robotsRes = await fetch(`${baseUrl}/robots.txt`);
  assert.strictEqual(robotsRes.status, 200, "robots.txt must return 200");
  const robotsText = await robotsRes.text();
  assert(robotsText.includes("GPTBot"), "robots.txt must allow GPTBot");
  assert(robotsText.includes("sitemap.xml"), "robots.txt must point to sitemap");

  // 2. Check sitemap.xml
  const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
  assert.strictEqual(sitemapRes.status, 200, "sitemap.xml must return 200");
  const sitemapText = await sitemapRes.text();
  assert(sitemapText.includes("<urlset"), "sitemap.xml must contain urlset");
  assert(sitemapText.includes("/prompts/5"), "sitemap.xml must include prompt URLs");
  assert(sitemapText.includes("/tag/portrait"), "sitemap.xml must include tag URLs");

  // 3. Check SSR prompt detail page
  const promptRes = await fetch(`${baseUrl}/prompts/5`);
  assert.strictEqual(promptRes.status, 200, "prompt detail page must return 200");
  const promptHtml = await promptRes.text();
  assert(promptHtml.includes("application/ld+json"), "prompt must contain JSON-LD structured data");
  assert(promptHtml.includes("CreativeWork"), "prompt schema must be CreativeWork");
  assert(promptHtml.includes("Bosch-inspired"), "prompt must contain title");
  assert(promptHtml.includes("Formula Content"), "prompt must contain formula block");

  // 4. Check homepage anchor tags & WebSite schema
  const homeRes = await fetch(`${baseUrl}/`);
  assert.strictEqual(homeRes.status, 200, "home must return 200");
  const homeHtml = await homeRes.text();
  assert(homeHtml.includes('href="/prompts/'), "home must render crawlable prompt links");
  assert(homeHtml.includes("WebSite"), "home must contain WebSite schema");
  assert(homeHtml.includes("SearchAction"), "home must contain Sitelinks SearchAction schema");

  // 5. Check public/llms.txt
  assert(fs.existsSync("public/llms.txt"), "public/llms.txt must exist");
  const llmsText = fs.readFileSync("public/llms.txt", "utf8");
  assert(llmsText.includes("Curated Taxonomy Categories"), "llms.txt must describe taxonomy");
  assert(llmsText.includes("/tag/portrait"), "llms.txt must link to categories");

  // 6. Check Taxonomy Category Page
  const tagRes = await fetch(`${baseUrl}/tag/portrait`);
  assert.strictEqual(tagRes.status, 200, "tag page must return 200");
  const tagHtml = await tagRes.text();
  assert(tagHtml.includes("CollectionPage"), "tag page must include CollectionPage schema");
  assert(tagHtml.includes("ItemList"), "tag page must include ItemList schema");
  assert(tagHtml.includes("Portrait"), "tag page must include tag title");
  assert(tagHtml.includes('href="/prompts/'), "tag page must link to prompts");

  console.log("ALL SEO PHASE 1 & 2 CHECKS PASSED SUCCESSFULLY");
}

main().catch((err) => {
  console.error("Check failed:", err);
  process.exit(1);
});

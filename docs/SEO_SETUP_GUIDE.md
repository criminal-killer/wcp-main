# SEO Setup Guide for Chatevo

This guide helps you set up Google Search Console and domain verification for maximum SEO impact.

## Step 1: Set Up Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add property"
3. Choose "Domain" type
4. Enter your domain: `chatevo-app.vercel.app`
5. You'll receive a DNS verification instruction

## Step 2: Verify Domain Ownership

### Option A: Vercel (Recommended)
1. In Vercel dashboard, go to your project settings
2. Navigate to Domains
3. Add `chatevo-app.vercel.app` if not already added
4. Vercel auto-verifies ownership

### Option B: TXT Record
Add this DNS record at your domain provider:
```
Type: TXT
Name: @ or chatevo
Value: vercel-site-verification=your-verification-code
```

## Step 3: Submit Sitemap

1. In Search Console, go to "Sitemaps"
2. Enter: `https://chatevo-app.vercel.app/sitemap.xml`
3. Click Submit
4. Wait 1-2 days for Google to index

## Step 4: Enable Indexing (if needed)

If some pages are blocked:
1. Go to URL Inspection
2. Enter a page URL
3. Click "Request Indexing"
4. Google will crawl within 24-48 hours

## Step 5: Set Up Google Analytics (Optional)

1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get your Measurement ID (G-XXXXXXXXXX)
3. Add to Vercel Environment Variables:
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

## Verification Checklist

- [ ] Google Search Console property added
- [ ] Domain ownership verified
- [ ] Sitemap submitted
- [ ] Robots.txt accessible at `/robots.txt`
- [ ] Key pages indexed (homepage, sign-up, sign-in)

## Common Issues

### "Sitemap not found" error
- Wait 24-48 hours after deployment
- Verify sitemap URL: `https://chatevo-app.vercel.app/sitemap.xml`

### Pages not indexed
- Check robots.txt allows crawling
- Ensure pages return 200 status
- Submit manually via URL Inspection

### Verification failed
- Wait 24-48 hours for DNS propagation
- Check TXT record is exactly as provided
- Use Vercel automatic verification for faster setup

## Next Steps After Verification

Once verified, monitor in Search Console:
- **Performance**: Track clicks, impressions, position
- **Coverage**: Fix any indexing errors
- **Links**: View who's linking to your site

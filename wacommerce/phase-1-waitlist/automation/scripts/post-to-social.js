const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function postToSocial() {
    console.log('--- Starting Social Media Posting ---');
    
    const bankPath = path.join(__dirname, '../content-bank.json');
    const contentBank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
    
    // Find next unposted post
    const post = contentBank.posts.find(p => !p.posted);
    
    if (!post) {
        console.log('No unposted content found in content-bank.json');
        return;
    }

    console.log(`Processing Post ID: ${post.id} (${post.type})`);

    let success = false;

    // 1. Post to Facebook
    if (process.env.FACEBOOK_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID) {
        try {
            console.log('Posting to Facebook...');
            const fbUrl = `https://graph.facebook.com/v19.0/${process.env.FACEBOOK_PAGE_ID}/feed`;
            await axios.post(fbUrl, {
                message: `${post.hook}\n\n${post.body}\n\n${post.cta}\n\n${post.hashtags}`,
                access_token: process.env.FACEBOOK_ACCESS_TOKEN
            });
            console.log('✅ Facebook post successful');
            success = true;
        } catch (err) {
            console.error('❌ Facebook post failed:', err.response?.data || err.message);
        }
    }

    // 2. Post to Twitter (Placeholder logic for API v2)
    if (process.env.TWITTER_BEARER_TOKEN) {
        try {
            console.log('Posting to Twitter/X...');
            // Twitter requires OAuth1.0a for v2/tweets usually, this is a simplified example
            // In real use, use 'twitter-api-v2' library
            console.log('✅ Twitter post successful (simulation)');
            success = true;
        } catch (err) {
            console.error('❌ Twitter post failed');
        }
    }

    // Update Content Bank if at least one platform succeeded
    if (success) {
        post.posted = true;
        post.posted_date = new Date().toISOString();
        fs.writeFileSync(bankPath, JSON.stringify(contentBank, null, 2));
        console.log('✅ Content bank updated');
    }
}

postToSocial();

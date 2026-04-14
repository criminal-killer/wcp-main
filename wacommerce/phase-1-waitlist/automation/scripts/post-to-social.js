const { createClient } = require('@libsql/client');
const axios = require('axios');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function postToSocial() {
  console.log('Fetching scheduled posts from Turso...');
  
  const now = Date.now();
  
  // Fetch posts: status APPROVED, scheduledAt <= now
  const result = await client.execute({
    sql: "SELECT * FROM marketing_posts WHERE status = 'APPROVED' AND (scheduledAt <= ? OR scheduledAt IS NULL)",
    args: [now]
  });

  const posts = result.rows;

  if (posts.length === 0) {
    console.log('No approved posts scheduled for this window.');
    return;
  }

  for (const post of posts) {
    try {
      console.log(`Posting to ${post.platform}...`);
      
      // Simulate/Execute Social Media API (Facebook/IG/X)
      // Reference from previous post-to-social logic
      if (post.platform === 'fb') {
        const response = await axios.post(
          `https://graph.facebook.com/v19.0/${process.env.FACEBOOK_PAGE_ID}/feed`,
          {
            message: post.content,
            access_token: process.env.FACEBOOK_ACCESS_TOKEN,
            link: process.env.WAITLIST_URL,
          }
        );
        console.log(`Facebook post successful: ${response.data.id}`);
      }

      // Update status to POSTED
      await client.execute({
        sql: "UPDATE marketing_posts SET status = 'POSTED' WHERE id = ?",
        args: [post.id]
      });

    } catch (error) {
      console.error(`Error posting to ${post.platform}:`, error.message);
    }
  }
}

postToSocial();

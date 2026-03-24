const fs = require('fs');
const path = require('path');
const axios = require('axios');

const KEYWORDS = ['READY', 'SELL', 'STORE', 'YES', 'ME', 'INTERESTED', 'HOW', 'LINK', 'INFO'];
const REPEAT_FILE = path.join(__dirname, 'dont-repeat.json');

async function commentBot() {
    console.log('--- Starting Comment Bot ---');
    
    if (!fs.existsSync(REPEAT_FILE)) fs.writeFileSync(REPEAT_FILE, '[]');
    const replied = JSON.parse(fs.readFileSync(REPEAT_FILE, 'utf8'));

    if (!process.env.FACEBOOK_ACCESS_TOKEN || !process.env.FACEBOOK_PAGE_ID) {
        console.error('Missing Facebook credentials');
        return;
    }

    try {
        const postsUrl = `https://graph.facebook.com/v19.0/${process.env.FACEBOOK_PAGE_ID}/feed?fields=comments{message,from,id}`;
        const response = await axios.get(postsUrl, { params: { access_token: process.env.FACEBOOK_ACCESS_TOKEN } });
        
        const feed = response.data.data;
        for (const post of feed) {
            if (post.comments) {
                for (const comment of post.comments.data) {
                    if (replied.includes(comment.id)) continue;

                    const msg = comment.message.toUpperCase();
                    const matched = KEYWORDS.some(k => msg.includes(k));

                    if (matched) {
                        console.log(`Match found in comment: ${comment.id}`);
                        
                        // Reply publicly
                        const replyUrl = `https://graph.facebook.com/v19.0/${comment.id}/comments`;
                        await axios.post(replyUrl, {
                            message: "Thanks for your interest! 🙏 Check your DMs — sending you the link now!",
                            access_token: process.env.FACEBOOK_ACCESS_TOKEN
                        });

                        // Note: DMing usually requires persistent login/special permissions or Page Messaging API
                        console.log(`✅ Replied to comment ${comment.id}`);
                        replied.push(comment.id);
                    }
                }
            }
        }
        
        fs.writeFileSync(REPEAT_FILE, JSON.stringify(replied, null, 2));
        console.log('✅ dont-repeat.json updated');

    } catch (err) {
        console.error('❌ Comment bot error:', err.response?.data || err.message);
    }
}

commentBot();

const { createClient } = require('@libsql/client');
const nodemailer = require('nodemailer');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function sendEmails() {
    console.log('--- Starting Cold Email Outreach via Turso ---');
    
    // Fetch up to 80 'APPROVED' leads that haven't been 'SENT' yet
    const result = await client.execute({
        sql: "SELECT * FROM leads WHERE status = 'APPROVED' LIMIT 80",
        args: []
    });

    const toEmail = result.rows;

    if (toEmail.length === 0) {
        console.log('No approved leads found in Turso.');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    for (const biz of toEmail) {
        console.log(`Sending email to: ${biz.business_name} (${biz.email})`);
        
        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'Alfred from Sella'}" <${process.env.FROM_EMAIL}>`,
            to: biz.email,
            subject: `Quick question about ${biz.business_name}'s WhatsApp`,
            text: `Hi ${biz.business_name} team,\n\nI noticed your business and wanted to ask — do you get a lot of "how much?" messages on WhatsApp?\n\nI'm building Sella — a tool that turns WhatsApp into a full store. Your customers browse products, pick sizes, and pay via M-Pesa, all without leaving the chat.\n\nWe're launching soon. Want free early access?\n→ ${process.env.WAITLIST_URL || 'https://sella-app.vercel.app'}\n\nNo pressure at all!\n— Alfred, Founder @ Sella`
        };

        try {
            await transporter.sendMail(mailOptions); // This is now LIVE!
            console.log(`✅ Email sent to ${biz.business_name}`);
            
            // Mark as SENT in Turso
            await client.execute({
                sql: "UPDATE leads SET status = 'SENT' WHERE id = ?",
                args: [biz.id]
            });
            
        } catch (err) {
            console.error(`❌ Failed for ${biz.business_name}:`, err.message);
        }

        // Rate limiting to not block SMTP provider
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('✅ Outreach batch complete.');
}

sendEmails();

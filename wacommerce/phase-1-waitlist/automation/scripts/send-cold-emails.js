const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const STORE_FILE = path.join(__dirname, 'scraped-businesses.json');
const WAITLIST_URL = process.env.WAITLIST_URL || 'https://sella.io';

async function sendEmails() {
    console.log('--- Starting Cold Email Outreach ---');
    
    if (!fs.existsSync(STORE_FILE)) {
        console.log('No businesses to email.');
        return;
    }

    const businesses = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    const toEmail = businesses.filter(b => !b.emailed && b.phone).slice(0, 20); // Limit to 20/run

    if (toEmail.length === 0) {
        console.log('No new leads with contact info found.');
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
        console.log(`Sending email to: ${biz.name}`);
        
        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'Alfred from Sella'}" <${process.env.FROM_EMAIL}>`,
            to: biz.name, // In a real scenario, you'd find their email. Phone is extracted here.
            subject: `Quick question about ${biz.name}'s WhatsApp`,
            text: `Hi ${biz.name} team,\n\nI noticed your business in ${biz.city} and wanted to ask — do you get a lot of "how much?" messages on WhatsApp?\n\nI'm building Sella — a tool that turns WhatsApp into a full store. Your customers browse products, pick sizes, and pay via M-Pesa, all without leaving the chat.\n\nWe're launching soon. Want free early access?\n→ ${WAITLIST_URL}\n\nNo pressure at all!\n— Alfred, Founder @ Sella`
        };

        try {
            // await transporter.sendMail(mailOptions); // Uncomment in production
            console.log(`✅ Email (simulated) sent to ${biz.name}`);
            biz.emailed = true;
            biz.emailed_date = new Date().toISOString();
        } catch (err) {
            console.error(`❌ Failed for ${biz.name}:`, err.message);
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 5000));
    }

    fs.writeFileSync(STORE_FILE, JSON.stringify(businesses, null, 2));
    console.log('✅ scraped-businesses.json updated');
}

sendEmails();

'use server'

import { db } from "@/lib/db"
import { affiliates, affiliate_payouts, audit_logs } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { Resend } from 'resend'

async function sendApprovalEmail(affiliateEmail: string, inviteUrl: string) {
  const resendApiKey = process.env.RESEND_API_KEY
  const resendFrom = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const merchantAppUrl = process.env.MERCHANT_APP_URL || 'https://app.chatevo.io'
  
  if (!resendApiKey) {
    console.error("[Affiliates] RESEND_API_KEY is not set. Skipping approval email.")
    return
  }

  try {
    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from: resendFrom,
      to: affiliateEmail,
      subject: 'Your Chatevo Affiliate Application was Approved',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Congratulations!</h2>
          <p>Your Chatevo affiliate application has been approved.</p>
          <p>To get started, please create your account or sign in to access your dashboard:</p>
          <ul>
            <li><strong>Create account:</strong> <a href="${merchantAppUrl}/sign-up?redirect_url=/affiliates/dashboard">${merchantAppUrl}/sign-up</a></li>
            <li><strong>Sign in:</strong> <a href="${merchantAppUrl}/sign-in?redirect_url=/affiliates/dashboard">${merchantAppUrl}/sign-in</a></li>
          </ul>
          <p>Backup direct invite link: <a href="${inviteUrl}">${inviteUrl}</a></p>
          <p>If you need help, contact us at <a href="mailto:mazaoedu@gmail.com?subject=Affiliate%20Help">mazaoedu@gmail.com</a>.</p>
        </div>
      `
    })
  } catch (error) {
    console.error("[Affiliates] Failed to send approval email:", error)
  }
}

export async function approveAndInviteAffiliate(id: string) {
  const admin = await currentUser()
  if (!admin) return { error: "Unauthorized" }

  try {
    const affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.id, id)
    })

    if (!affiliate) return { success: false, error: "Affiliate not found" }

    await db.update(affiliates)
      .set({ status: 'approved' })
      .where(eq(affiliates.id, id))

    const client = typeof clerkClient === 'function' ? await (clerkClient as any)() : clerkClient
    const redirectUrl = `${process.env.MERCHANT_APP_URL || 'https://app.chatevo.io'}/affiliates/invite`

    const invitation = await client.invitations.createInvitation({
      emailAddress: affiliate.email,
      redirectUrl,
      ignoreExisting: true,
    })

    await sendApprovalEmail(affiliate.email, invitation.url)

    await db.insert(audit_logs).values({
      admin_id: admin.id,
      admin_name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      action: "APPROVE_AND_INVITE_AFFILIATE",
      target_type: "affiliate",
      target_id: id,
      details: `Approved affiliate and sent invite (${invitation.id}) to ${affiliate.email}. Link: ${invitation.url}`,
    })

    return { success: true, url: invitation.url }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function resendAffiliateInvite(id: string) {
  const admin = await currentUser()
  if (!admin) return { error: "Unauthorized" }

  try {
    const affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.id, id)
    })

    if (!affiliate) return { success: false, error: "Affiliate not found" }
    if (affiliate.status !== 'approved') return { success: false, error: "Affiliate must be approved first" }

    const client = typeof clerkClient === 'function' ? await (clerkClient as any)() : clerkClient
    const redirectUrl = `${process.env.MERCHANT_APP_URL || 'https://app.chatevo.io'}/affiliates/invite`

    const invitation = await client.invitations.createInvitation({
      emailAddress: affiliate.email,
      redirectUrl,
      ignoreExisting: true,
    })

    await sendApprovalEmail(affiliate.email, invitation.url)

    await db.insert(audit_logs).values({
      admin_id: admin.id,
      admin_name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      action: "RESEND_AFFILIATE_INVITE",
      target_type: "affiliate",
      target_id: id,
      details: `Resent Clerk invite (${invitation.id}) to ${affiliate.email}. Link: ${invitation.url}`,
    })

    return { success: true, url: invitation.url }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function rejectAffiliate(id: string) {
  const admin = await currentUser()
  if (!admin) return { error: "Unauthorized" }

  try {
    await db.update(affiliates)
      .set({ status: 'rejected' })
      .where(eq(affiliates.id, id))

    await db.insert(audit_logs).values({
      admin_id: admin.id,
      admin_name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      action: "REJECT_AFFILIATE",
      target_type: "affiliate",
      target_id: id,
      details: "Rejected affiliate account",
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function processPayout(id: string, amount: number) {
  const admin = await currentUser()
  if (!admin) return { error: "Unauthorized" }

  try {
    // 1. Fetch current balance to ensure valid
    const affiliate = await db.query.affiliates.findFirst({
      where: (aff, { eq }) => eq(aff.id, id)
    })
    
    const balance = affiliate?.balance ?? 0
    if (!affiliate || balance < amount) {
      return { success: false, error: "Insufficient balance or invalid affiliate" }
    }

    // 2. Reduce their balance
    await db.update(affiliates)
      .set({ balance: sql`${affiliates.balance} - ${amount}` })
      .where(eq(affiliates.id, id))

    // 3. Insert Payout Record
    await db.insert(affiliate_payouts).values({
      affiliate_id: id,
      amount: amount,
      status: 'paid', // Immediately marking as paid for now
      notes: "Admin manual payout processed",
      processed_at: new Date().toISOString()
    })

    // 4. Log Audit
    await db.insert(audit_logs).values({
      admin_id: admin.id,
      admin_name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      action: "PROCESS_PAYOUT",
      target_type: "affiliate",
      target_id: id,
      details: `Paid $${amount} to affiliate`,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// Mark a payout request as paid. Deducts the amount from affiliate balance.
export async function markPayoutPaid(payoutId: string) {
  const admin = await currentUser()
  if (!admin) return { error: "Unauthorized" }

  try {
    const payout = await db.query.affiliate_payouts.findFirst({
      where: (p, { eq }) => eq(p.id, payoutId)
    })
    if (!payout) return { success: false, error: "Payout request not found." }
    if (payout.status !== 'pending') return { success: false, error: "This payout is not in pending state." }

    // Deduct from affiliate balance
    await db.update(affiliates)
      .set({ balance: sql`MAX(0, ${affiliates.balance} - ${payout.amount})` })
      .where(eq(affiliates.id, payout.affiliate_id))

    // Mark payout as paid
    await db.update(affiliate_payouts)
      .set({ status: 'paid', processed_at: new Date().toISOString() })
      .where(eq(affiliate_payouts.id, payoutId))

    await db.insert(audit_logs).values({
      admin_id: admin.id,
      admin_name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      action: "MARK_PAYOUT_PAID",
      target_type: "affiliate_payout",
      target_id: payoutId,
      details: `Marked payout of $${payout.amount} as paid`,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// Reject a pending payout request (does NOT deduct balance).
export async function rejectPayout(payoutId: string) {
  const admin = await currentUser()
  if (!admin) return { error: "Unauthorized" }

  try {
    const payout = await db.query.affiliate_payouts.findFirst({
      where: (p, { eq }) => eq(p.id, payoutId)
    })
    if (!payout) return { success: false, error: "Payout request not found." }

    await db.update(affiliate_payouts)
      .set({ status: 'rejected', processed_at: new Date().toISOString() })
      .where(eq(affiliate_payouts.id, payoutId))

    await db.insert(audit_logs).values({
      admin_id: admin.id,
      admin_name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      action: "REJECT_PAYOUT",
      target_type: "affiliate_payout",
      target_id: payoutId,
      details: `Rejected payout request of $${payout.amount}`,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

'use server'

import { db } from "@/lib/db"
import { affiliates, affiliate_payouts } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"

export async function createAffiliateAccount(data: {
  clerk_id: string
  name: string
  username: string
  email: string
  phone: string
  payment_details: string
  referred_by_code?: string
}) {
  try {
    const baseCode = data.name.split(' ')[0].toUpperCase() + Math.floor(1000 + Math.random() * 9000);
    
    let referredById = null;
    if (data.referred_by_code) {
      const referrer = await db.query.affiliates.findFirst({
        where: (aff, { eq }) => eq(aff.referral_code, data.referred_by_code!)
      });
      if (referrer) {
        referredById = referrer.id;
        // Increment total referred for the Tier 1
        await db.update(affiliates)
          .set({ total_referred: sql`${affiliates.total_referred} + 1` })
          .where(eq(affiliates.id, referrer.id))
        
        // If the referrer themselves was referred by someone (Tier 2 grandparent)
        if (referrer.referred_by_id) {
          await db.update(affiliates)
            .set({ total_network: sql`${affiliates.total_network} + 1` })
            .where(eq(affiliates.id, referrer.referred_by_id))
        }
      }
    }

    await db.insert(affiliates).values({
      clerk_id: data.clerk_id,
      name: data.name,
      username: data.username,
      email: data.email,
      phone: data.phone,
      referral_code: baseCode,
      status: 'pending', 
      payment_details: data.payment_details,
      terms_accepted: 1,
      referred_by_id: referredById,
    })

    return { success: true }
  } catch (err: any) {
    console.error("Failed to create affiliate account", err)
    return { success: false, error: err.message }
  }
}

// Logic to process a withdrawal and trigger multi-tier bonuses
export async function approveWithdrawalCallback(payoutId: string) {
  try {
    const payout = await db.query.affiliate_payouts.findFirst({
      where: (p, { eq }) => eq(p.id, payoutId)
    })
    if (!payout || payout.status === 'paid') return { success: false }

    // Mark as paid
    await db.update(affiliate_payouts)
      .set({ status: 'paid', processed_at: new Date().toISOString() })
      .where(eq(affiliate_payouts.id, payoutId))

    const currentAffiliate = await db.query.affiliates.findFirst({
      where: (aff, { eq }) => eq(aff.id, payout.affiliate_id)
    })

    if (!currentAffiliate) return { success: true }

    // Multi-tier bonuses trigger on successful withdrawal
    const baseAmount = payout.amount

    if (currentAffiliate.referred_by_id) {
      // Tier 1 - gets 5%
      const tier1Bonus = baseAmount * 0.05
      await db.update(affiliates)
        .set({ 
          balance: sql`${affiliates.balance} + ${tier1Bonus}`,
          total_earned: sql`${affiliates.total_earned} + ${tier1Bonus}`
        })
        .where(eq(affiliates.id, currentAffiliate.referred_by_id))

      const parentAffiliate = await db.query.affiliates.findFirst({
        where: (aff, { eq }) => eq(aff.id, currentAffiliate.referred_by_id!)
      })

      // Tier 2 (Grandparent) - gets 2%
      if (parentAffiliate?.referred_by_id) {
        const tier2Bonus = baseAmount * 0.02
        await db.update(affiliates)
          .set({ 
            balance: sql`${affiliates.balance} + ${tier2Bonus}`,
            total_earned: sql`${affiliates.total_earned} + ${tier2Bonus}`
          })
          .where(eq(affiliates.id, parentAffiliate.referred_by_id))
      }
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false }
  }
}

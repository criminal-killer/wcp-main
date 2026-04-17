import { Metadata } from 'next'
import ReferralsDashboard from './referrals-client'

export const metadata: Metadata = {
  title: 'Referral Program | Chatevo Dashboard',
  description: 'Refer businesses to Chatevo and earn 30% commission on month 1, 10% on months 2-7.'
}

export default function ReferralsPage() {
  return <ReferralsDashboard />
}

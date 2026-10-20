import { Metadata } from 'next';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | SoroWill',
  description: 'Privacy Policy for SoroWill - trustless on-chain inheritance on Stellar',
};

export default function PrivacyPage() {
  return (
    <div className="space-y-8 pb-16">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-will-light">Privacy Policy</h1>
        <p className="text-sm text-will-light/60">Last updated: September 2026</p>
      </section>

      <section className="prose prose-invert max-w-none space-y-6 text-will-light/80">
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <p className="font-semibold text-will-light">
            SoroWill is a non-custodial protocol. We collect minimal data and do not store personal information.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">1. What Data We Collect</h2>
          <p>
            SoroWill collects and processes only the following data:
          </p>
          <ul className="list-inside space-y-2 pl-4">
            <li>• <strong>Wallet Addresses:</strong> Public Stellar wallet addresses are visible on-chain and used to authenticate users.</li>
            <li>• <strong>Will Configuration:</strong> Contract addresses, beneficiary account configurations, and percentage splits are stored immutably on Soroban (public blockchain).</li>
            <li>• <strong>Check-in Activity:</strong> Timestamps of check-in transactions are recorded on-chain.</li>
            <li>• <strong>Reminder subscriptions (Optional):</strong> If you enable check-in reminders, we store your email address, will ID, and owner address in our server-side KV/Redis store to schedule delivery.</li>
            <li>• <strong>Application analytics:</strong> We do not currently run an analytics service or use analytics cookies.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">2. What Data We Do NOT Collect</h2>
          <ul className="list-inside space-y-2 pl-4">
            <li>• Real names, phone numbers, or other profile information</li>
            <li>• Beneficiary personal details (you provide only their Stellar addresses)</li>
            <li>• Private keys or seed phrases</li>
            <li>• Transaction amounts or asset balances (these live on-chain only)</li>
            <li>• IP addresses or device fingerprints (except in standard server logs for security purposes)</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">3. Data Retention</h2>
          <p>
            On-chain data (contracts, configurations, check-ins) persists indefinitely on Soroban as part of the immutable ledger. Reminder subscriptions are retained in KV/Redis until you unsubscribe or the associated reminder is no longer needed; server logs are retained for a limited period (typically 30 days) for debugging and security purposes, then deleted.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">4. Third-Party Services</h2>
          <p>
            SoroWill integrates with:
          </p>
          <ul className="list-inside space-y-2 pl-4">
            <li>• <strong>Stellar RPC Providers:</strong> Your wallet interactions are sent to Soroban RPC nodes (managed by Stellar Foundation or third parties) to sign and broadcast transactions.</li>
            <li>• <strong>Wallet Providers:</strong> If you use a browser wallet (Freighter, etc.), that provider&apos;s privacy policy governs key management.</li>
            <li>• <strong>Resend:</strong> Reminder emails are delivered through Resend, which processes the recipient email and message to send the notification.</li>
          </ul>
          <p className="mt-4">
            You can unsubscribe using the link in any reminder email; this removes the reminder subscription. We recommend reviewing the privacy policies of these third parties.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">5. Your Rights</h2>
          <p>
            Since we collect minimal personal data, there is little to request or delete beyond on-chain records (which we cannot modify due to Soroban&apos;s immutability). If you wish to know what analytics or logs we hold, contact us.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">6. Security</h2>
          <p>
            We maintain reasonable security measures for server infrastructure. However, as a non-custodial protocol, the security of your assets depends primarily on the smart contract code and your wallet security—not on SoroWill servers.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">7. Changes to This Policy</h2>
          <p>
            We may update this privacy policy periodically. Continued use of SoroWill constitutes acceptance of any updates.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">8. Contact</h2>
          <p>
            For privacy questions, please reach out via our GitHub or community channels. As a decentralized project, there is no centralized privacy officer, but the community and maintainers will respond to reasonable inquiries.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-semibold text-will-light">Key Principle:</p>
          <p className="mt-2 text-sm">
             Since SoroWill is non-custodial and most data lives on-chain, user privacy is protected by the transparent, immutable nature of the blockchain itself. We do not need to &quot;protect&quot; data we do not control.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { Metadata } from 'next';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Use | SoroWill',
  description: 'Terms of Use for SoroWill - trustless on-chain inheritance on Stellar',
};

export default function TermsPage() {
  return (
    <div className="space-y-8 pb-16">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-will-light">Terms of Use</h1>
        <p className="text-sm text-will-light/60">Last updated: September 2026</p>
      </section>

      <section className="prose prose-invert max-w-none space-y-6 text-will-light/80">
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="mb-4 rounded-lg border-l-4 border-will-purple bg-will-purple/10 p-4">
            <p className="text-sm font-semibold text-will-purple">⚠️ Important Disclaimer</p>
            <p className="mt-2 text-sm">
              SoroWill is not legal advice, does not constitute a formal will in any jurisdiction, and does not replace legal wills or trusts required by your local laws. Please consult a qualified attorney to ensure your inheritance planning complies with applicable legal requirements.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">1. Overview</h2>
          <p>
            SoroWill (&quot;the Protocol&quot;) is a non-custodial, smart contract-based inheritance application running on Stellar&apos;s Soroban network. Users deploy contracts to hold and distribute assets according to self-defined rules and beneficiary allocations. These terms govern your use of the SoroWill application.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">2. Non-Custodial Nature</h2>
          <p>
            SoroWill is non-custodial. We do not hold, control, or have access to your funds or private keys. You retain full control of your assets and the smart contracts you deploy. The Protocol is immutable once deployed on Soroban; we cannot reverse transactions, modify contracts, or freeze assets.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">3. Data Collection and Privacy</h2>
          <p>
            We collect minimal data needed to operate the application:
          </p>
          <ul className="list-inside space-y-2 pl-4">
            <li>• Wallet addresses (public blockchain data)</li>
            <li>• Will configuration details (stored on-chain)</li>
            <li>• Check-in activity (recorded on-chain)</li>
            <li>• Optional reminder email, will ID, and owner address when you enable check-in reminders; these are stored server-side in KV/Redis and delivered through Resend</li>
          </ul>
          <p className="mt-4">
            We do not collect private keys. Optional reminder data is stored only to deliver and manage reminders; unsubscribe links remove that subscription. No analytics service is currently enabled.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">4. User Responsibilities</h2>
          <p>
            As a non-custodial protocol, you are responsible for:
          </p>
          <ul className="list-inside space-y-2 pl-4">
            <li>• Securely managing your private keys and recovery phrases</li>
            <li>• Ensuring check-in deadlines and verifying beneficiary configurations</li>
            <li>• Understanding the risks of smart contract interactions</li>
            <li>• Verifying contract addresses before signing transactions</li>
            <li>• Complying with applicable laws in your jurisdiction regarding inheritance and asset transfer</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">5. No Liability</h2>
          <p>
            SoroWill is provided &quot;as-is&quot; without warranties. To the fullest extent permitted by law, SoroWill and its contributors are not liable for:
          </p>
          <ul className="list-inside space-y-2 pl-4">
            <li>• Loss or theft of funds due to user error or security breaches</li>
            <li>• Smart contract bugs or exploits</li>
            <li>• Network outages or Soroban unavailability</li>
            <li>• Missed check-ins or inheritance timing disputes</li>
            <li>• Legal disputes regarding asset ownership or inheritance rights</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">6. Open Source and Community</h2>
          <p>
            SoroWill is open source. Smart contracts and application code are publicly auditable. Users and developers are encouraged to review, fork, and contribute to the Protocol under the MIT License.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">7. Modifications to Terms</h2>
          <p>
            We reserve the right to modify these terms. Continued use of SoroWill constitutes acceptance of updated terms.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-will-light">8. Governing Law</h2>
          <p>
            These terms are governed by applicable laws in the jurisdictions where users reside, with the understanding that SoroWill is a decentralized protocol without a centralized entity responsible for legal compliance in all jurisdictions.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

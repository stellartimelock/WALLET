import {
  DocBoldLead,
  DocBullet,
  DocHeading,
  DocIntro,
  DocParagraph,
  DocSection,
  DocUpdated,
  LegalDocumentScreen,
} from "./_document";

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      testID="legal-privacy-screen"
      backTestID="legal-privacy-back"
    >
      <DocHeading>Stellar TimeLock — Privacy Policy</DocHeading>
      <DocUpdated>Last updated: September 28, 2026</DocUpdated>
      <DocIntro>
        StellarTimeLock, LLC ("we," "our," or "us") operates the Stellar
        TimeLock mobile application for Android (the "App"). This page informs
        you of our policies regarding the collection, use, and disclosure of
        personal data when you use our App.
      </DocIntro>

      <DocSection title="Information We Don't Collect">
        <DocParagraph>
          We do not collect, store, or transmit personal information for
          advertising or profiling. The App is designed so wallet secrets stay
          on your device. Specifically:
        </DocParagraph>
        <DocBullet>
          We do not collect names, email addresses, or phone numbers as a
          condition of using the wallet
        </DocBullet>
        <DocBullet>
          We do not collect device identifiers or advertising IDs for tracking
        </DocBullet>
        <DocBullet>We do not collect location data</DocBullet>
        <DocBullet>
          We do not use cookies or tracking technologies in the App for analytics
        </DocBullet>
        <DocBullet>
          We do not have access to your private keys, seed phrases, or wallet
          contents
        </DocBullet>
        <DocBullet>
          We do not operate cloud storage of your wallet secrets
        </DocBullet>
      </DocSection>

      <DocSection title="What Stays On Your Device">
        <DocParagraph>
          All wallet data — including your seed phrase, private keys, contacts,
          vault configurations, and local transaction history — is stored locally
          on your device under Android Keystore / SecureStore device protection,
          with optional biometric unlock where available. You control this data
          at all times. Android builds use allowBackup=&quot;false&quot; to avoid
          accidental cloud copies of sensitive material.
        </DocParagraph>
      </DocSection>

      <DocSection title="Third-Party Services">
        <DocParagraph>
          The App interacts with the following third-party services:
        </DocParagraph>
        <DocBoldLead
          lead="Stellar/Soroban RPC: "
          body="When you interact with vaults or the Stellar network, transactions are broadcast through RPC endpoints. These services may see your device's IP address and transaction data as necessary for network operation. We do not control these services."
        />
        <DocBoldLead
          lead="Optional swap partners: "
          body="When you use the optional swap feature, exchange requests are sent to third-party partner APIs. Their privacy policies govern how they handle that data."
        />
      </DocSection>

      <DocSection title="Data Security">
        <DocParagraph>
          Your wallet data is protected by encryption derived from your Stellar
          secret key / device-protected key material. We cannot recover your
          data, reset your wallet, or access your funds.
        </DocParagraph>
      </DocSection>

      <DocSection title="Children's Privacy">
        <DocParagraph>
          The App is not intended for use by anyone under the age of 18.
        </DocParagraph>
      </DocSection>

      <DocSection title="Changes to This Policy">
        <DocParagraph>
          We may update this Privacy Policy from time to time. Changes will be
          posted within the App and on the product site where applicable.
        </DocParagraph>
      </DocSection>

      <DocSection title="Contact">
        <DocParagraph>
          For questions about this Privacy Policy, contact us at:
          StellarTimeLock@gmail.com
        </DocParagraph>
      </DocSection>
    </LegalDocumentScreen>
  );
}

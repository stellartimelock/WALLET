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
      <DocHeading>StellarTimeLock Vault — Privacy Policy</DocHeading>
      <DocUpdated>Last updated: August 4, 2026</DocUpdated>
      <DocIntro>
        StellarTimeLock, LLC ("we," "our," or "us") operates the StellarTimeLock
        Vault mobile application (the "App"). This page informs you of our
        policies regarding the collection, use, and disclosure of personal data
        when you use our App.
      </DocIntro>

      <DocSection title="Information We Don't Collect">
        <DocParagraph>
          We do not collect, store, or transmit any personal information. The App
          operates entirely on your device. Specifically:
        </DocParagraph>
        <DocBullet>We do not collect names, email addresses, or phone numbers</DocBullet>
        <DocBullet>We do not collect device identifiers or advertising IDs</DocBullet>
        <DocBullet>We do not collect location data</DocBullet>
        <DocBullet>We do not use cookies or tracking technologies</DocBullet>
        <DocBullet>
          We do not have access to your private keys, seed phrases, or wallet
          contents
        </DocBullet>
        <DocBullet>
          We do not operate any backend servers, databases, or cloud storage
        </DocBullet>
      </DocSection>

      <DocSection title="What Stays On Your Device">
        <DocParagraph>
          All wallet data — including your seed phrase, private keys, contacts,
          vault configurations, and transaction history — is stored locally on
          your device. You control this data at all times.
        </DocParagraph>
      </DocSection>

      <DocSection title="Third-Party Services">
        <DocParagraph>
          The App interacts with the following third-party services:
        </DocParagraph>
        <DocBoldLead
          lead="Stellar/Soroban RPC (Ankr): "
          body="When you interact with vaults or the Stellar network, transactions are broadcast through RPC endpoints. These services may see your device's IP address and transaction data as necessary for network operation. We do not control these services."
        />
        <DocBoldLead
          lead="SimpleSwap: "
          body="When you use the swap feature, your exchange requests are sent to SimpleSwap's API. Their privacy policy governs how they handle that data."
        />
      </DocSection>

      <DocSection title="Data Security">
        <DocParagraph>
          Your wallet data is protected by encryption derived from your Stellar
          secret key. We cannot recover your data, reset your wallet, or access
          your funds.
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
          posted within the App.
        </DocParagraph>
      </DocSection>

      <DocSection title="Contact">
        <DocParagraph>
          For questions about this Privacy Policy, contact us at: [contact email
          to be added]
        </DocParagraph>
      </DocSection>

      <DocSection title="Governing Law">
        <DocParagraph>
          This Privacy Policy is governed by the laws of the State of Ohio,
          United States.
        </DocParagraph>
      </DocSection>
    </LegalDocumentScreen>
  );
}

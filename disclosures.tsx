import {
  DocBullet,
  DocHeading,
  DocIntro,
  DocParagraph,
  DocSection,
  DocUpdated,
  LegalDocumentScreen,
} from "./_document";

export default function LegalDisclosuresScreen() {
  return (
    <LegalDocumentScreen
      title="Legal & Disclosures"
      testID="legal-disclosures-screen"
      backTestID="legal-disclosures-back"
    >
      <DocHeading>Stellar TimeLock — Legal & Disclosures</DocHeading>
      <DocUpdated>Last updated: September 28, 2026</DocUpdated>
      <DocIntro>StellarTimeLock, LLC</DocIntro>

      <DocSection title="Open Source & Proprietary Components">
        <DocParagraph>
          The App uses third-party open source software including but not limited
          to:
        </DocParagraph>
        <DocBullet>
          Stellar SDK and Soroban RPC client libraries
        </DocBullet>
        <DocBullet>React Native and Expo framework</DocBullet>
        <DocBullet>
          Various cryptographic libraries for encryption and key derivation
        </DocBullet>
        <DocParagraph>
          Source code excerpts for security review are available within the App
          under Settings → Audit Our Security Code. Related security
          modules/excerpts and documentation may be published in the public
          WALLET repository under Apache 2.0 where indicated. The full Android
          app backend and complete vault contract source remain proprietary by
          design. On-chain contract IDs are visible on Stellar explorers.
        </DocParagraph>
      </DocSection>

      <DocSection title="Intellectual Property">
        <DocParagraph>
          "Stellar TimeLock" and associated branding are the property of
          StellarTimeLock, LLC. The App's source code, design, and user
          interface are protected by copyright except for third-party components
          and published reference materials under their respective licenses.
        </DocParagraph>
      </DocSection>

      <DocSection title="Regulatory Disclaimer">
        <DocParagraph>
          The App is a self-custody tool for interacting with the Stellar
          network. It does not:
        </DocParagraph>
        <DocBullet>Hold, transmit, or control user funds</DocBullet>
        <DocBullet>Provide money transmission or payment services</DocBullet>
        <DocBullet>
          Function as a financial institution, exchange, or broker
        </DocBullet>
        <DocBullet>
          Issue, redeem, or manage any financial product
        </DocBullet>
        <DocParagraph>
          Users are responsible for determining whether their use of the App
          complies with applicable laws and regulations in their jurisdiction.
        </DocParagraph>
      </DocSection>

      <DocSection title="Network Disclosures">
        <DocBullet>
          Transaction fees on the Stellar network are determined by network
          conditions
        </DocBullet>
        <DocBullet>
          Vault operations require Soroban smart contract interactions which
          consume network resources
        </DocBullet>
        <DocBullet>
          The App uses public RPC endpoints; availability may vary
        </DocBullet>
      </DocSection>

      <DocSection title="Third-party swaps">
        <DocParagraph>
          Optional swap features use third-party liquidity partners. Those
          services are outside our custody model. Affiliate fee details, if any,
          are TBD and will be disclosed when finalized — they are not asserted
          here.
        </DocParagraph>
      </DocSection>

      <DocSection title="Contact">
        <DocParagraph>
          Legal inquiries: StellarTimeLock@gmail.com
        </DocParagraph>
      </DocSection>
    </LegalDocumentScreen>
  );
}

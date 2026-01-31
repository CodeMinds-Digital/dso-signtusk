/**
 * Simple bulk send complete email without React hooks.
 */
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "../components";

export type BulkSendCompleteEmailSimpleProps = {
  userName: string;
  templateName: string;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  errors: string[];
  assetBaseUrl: string;
  translations: {
    previewText: string;
    greeting: string;
    message: string;
    summaryTitle: string;
    totalLabel: string;
    successLabel: string;
    failedLabel: string;
    errorsTitle: string;
    footer: string;
  };
  branding?: {
    brandingEnabled: boolean;
    brandingLogo?: string;
    brandingCompanyDetails?: string;
  };
};

export const BulkSendCompleteEmailSimple = ({
  userName,
  templateName,
  totalProcessed,
  successCount,
  failedCount,
  errors,
  assetBaseUrl = "http://localhost:3002",
  translations,
  branding,
}: BulkSendCompleteEmailSimpleProps) => {
  const getAssetUrl = (path: string) => new URL(path, assetBaseUrl).toString();

  return (
    <Html>
      <Head />
      <Preview>{translations.previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            {branding?.brandingEnabled && branding.brandingLogo ? (
              <Img
                src={branding.brandingLogo}
                alt="Branding Logo"
                style={logoStyle}
              />
            ) : (
              <Img
                src={getAssetUrl("/static/logo.png")}
                alt="Logo"
                style={logoStyle}
              />
            )}
            <Text style={greetingStyle}>{translations.greeting}</Text>
            <Text style={messageStyle}>{translations.message}</Text>
            <Text style={summaryTitleStyle}>{translations.summaryTitle}</Text>
            <Section style={summaryBoxStyle}>
              <Text style={summaryItemStyle}>
                • {translations.totalLabel}: {totalProcessed}
              </Text>
              <Text style={summaryItemStyle}>
                • {translations.successLabel}: {successCount}
              </Text>
              <Text style={summaryItemStyle}>
                • {translations.failedLabel}: {failedCount}
              </Text>
            </Section>
            {failedCount > 0 && (
              <>
                <Text style={errorsTitleStyle}>{translations.errorsTitle}</Text>
                <Section style={errorsBoxStyle}>
                  {errors.map((error, index) => (
                    <Text key={index} style={errorItemStyle}>
                      • {error}
                    </Text>
                  ))}
                </Section>
              </>
            )}
            <Text style={footerTextStyle}>{translations.footer}</Text>
          </Section>
        </Container>
        <Container style={footerContainerStyle}>
          <Text style={footerStyle}>
            {branding?.brandingCompanyDetails ||
              "Signtusk\n2261 Market Street, #5211, San Francisco, CA 94114, USA"}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: "0 auto",
};
const containerStyle: React.CSSProperties = {
  maxWidth: "580px",
  margin: "32px auto 8px auto",
  padding: "16px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
};
const sectionStyle: React.CSSProperties = { padding: "16px" };
const logoStyle: React.CSSProperties = { height: "24px", marginBottom: "16px" };
const greetingStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#0f172a",
  marginBottom: "8px",
};
const messageStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#64748b",
  margin: "8px 0 24px 0",
};
const summaryTitleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#0f172a",
  marginTop: "16px",
  marginBottom: "8px",
};
const summaryBoxStyle: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px",
  margin: "8px 0",
};
const summaryItemStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#0f172a",
  margin: "4px 0",
};
const errorsTitleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#991b1b",
  marginTop: "24px",
  marginBottom: "8px",
};
const errorsBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "16px",
  margin: "8px 0",
};
const errorItemStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#991b1b",
  margin: "4px 0",
};
const footerTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#94a3b8",
  marginTop: "32px",
};
const footerContainerStyle: React.CSSProperties = {
  maxWidth: "580px",
  margin: "0 auto",
};
const footerStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#94a3b8",
  textAlign: "center" as const,
  margin: "32px 0",
  whiteSpace: "pre-line" as const,
};

export default BulkSendCompleteEmailSimple;

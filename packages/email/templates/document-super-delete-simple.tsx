/**
 * Simple document super delete email template without React hooks.
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

export type DocumentSuperDeleteEmailSimpleProps = {
  documentName: string;
  reason: string;
  assetBaseUrl: string;
  translations: {
    previewText: string;
    title: string;
    message: string;
    reasonLabel: string;
    footer: string;
  };
  branding?: {
    brandingEnabled: boolean;
    brandingLogo?: string;
    brandingCompanyDetails?: string;
  };
};

export const DocumentSuperDeleteEmailSimple = ({
  documentName,
  reason,
  assetBaseUrl = "http://localhost:3002",
  translations,
  branding,
}: DocumentSuperDeleteEmailSimpleProps) => {
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
            <Img
              src={getAssetUrl("/static/document.png")}
              alt="Document"
              style={documentImageStyle}
            />
            <Text style={titleStyle}>{translations.title}</Text>
            <Text style={messageStyle}>{translations.message}</Text>
            <Section style={documentNameBoxStyle}>
              <Text style={documentNameStyle}>{documentName}</Text>
            </Section>
            <Text style={reasonLabelStyle}>{translations.reasonLabel}</Text>
            <Section style={reasonBoxStyle}>
              <Text style={reasonStyle}>{reason}</Text>
            </Section>
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
const sectionStyle: React.CSSProperties = { textAlign: "center" as const };
const logoStyle: React.CSSProperties = { height: "24px", marginBottom: "16px" };
const documentImageStyle: React.CSSProperties = {
  height: "168px",
  margin: "24px auto",
};
const titleStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: "8px",
  textAlign: "center" as const,
};
const messageStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#94a3b8",
  margin: "4px 0 24px 0",
  textAlign: "center" as const,
};
const documentNameBoxStyle: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "16px auto",
  maxWidth: "400px",
};
const documentNameStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#64748b",
  textAlign: "center" as const,
  margin: "0",
};
const reasonLabelStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#0f172a",
  marginTop: "24px",
  textAlign: "center" as const,
};
const reasonBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "8px auto 24px auto",
  maxWidth: "400px",
};
const reasonStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#991b1b",
  textAlign: "center" as const,
  margin: "0",
};
const footerTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#94a3b8",
  textAlign: "center" as const,
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

export default DocumentSuperDeleteEmailSimple;

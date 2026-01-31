/**
 * Simple document self-signed email template without React hooks.
 * Uses inline styles and pre-translated strings passed as props.
 */
import { Body } from "@react-email/body";
import { Button } from "@react-email/button";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Html } from "@react-email/html";
import { Img } from "@react-email/img";
import { Preview } from "@react-email/preview";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";

export type DocumentSelfSignedEmailSimpleProps = {
  documentName: string;
  documentLink: string;
  assetBaseUrl: string;
  translations: {
    previewText: string;
    title: string;
    message: string;
    downloadButton: string;
    footer: string;
  };
  branding?: {
    brandingEnabled: boolean;
    brandingLogo?: string;
    brandingCompanyDetails?: string;
  };
};

export const DocumentSelfSignedEmailSimple = ({
  documentName,
  documentLink,
  assetBaseUrl = "http://localhost:3002",
  translations,
  branding,
}: DocumentSelfSignedEmailSimpleProps) => {
  const getAssetUrl = (path: string) => {
    return new URL(path, assetBaseUrl).toString();
  };

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

            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={documentLink}>
                {translations.downloadButton}
              </Button>
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

const sectionStyle: React.CSSProperties = {
  textAlign: "center" as const,
};

const logoStyle: React.CSSProperties = {
  height: "24px",
  marginBottom: "16px",
};

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

const buttonContainerStyle: React.CSSProperties = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "24px",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#7AC455",
  color: "#000000",
  padding: "12px 24px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  display: "inline-block",
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

export default DocumentSelfSignedEmailSimple;

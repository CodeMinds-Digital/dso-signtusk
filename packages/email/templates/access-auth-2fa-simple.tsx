/**
 * Simple 2FA authentication email template without React hooks.
 * Uses inline styles and pre-translated strings passed as props.
 */
import { Body } from "@react-email/body";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Html } from "@react-email/html";
import { Img } from "@react-email/img";
import { Preview } from "@react-email/preview";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";

export type AccessAuth2FAEmailSimpleProps = {
  documentTitle: string;
  code: string;
  userEmail: string;
  userName: string;
  expiresInMinutes: number;
  assetBaseUrl: string;
  translations: {
    previewText: string;
    title: string;
    message: string;
    codeLabel: string;
    expiryNote: string;
    footer: string;
  };
  branding?: {
    brandingEnabled: boolean;
    brandingLogo?: string;
    brandingCompanyDetails?: string;
  };
};

export const AccessAuth2FAEmailSimple = ({
  documentTitle,
  code,
  userEmail,
  userName,
  expiresInMinutes,
  assetBaseUrl = "http://localhost:3002",
  translations,
  branding,
}: AccessAuth2FAEmailSimpleProps) => {
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

            <Section style={codeContainerStyle}>
              <Text style={codeLabelStyle}>{translations.codeLabel}</Text>
              <Text style={codeStyle}>{code}</Text>
            </Section>

            <Text style={expiryStyle}>{translations.expiryNote}</Text>

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
  margin: "4px 0",
  textAlign: "center" as const,
};

const codeContainerStyle: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px auto",
  maxWidth: "400px",
};

const codeLabelStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#64748b",
  marginBottom: "8px",
  textAlign: "center" as const,
};

const codeStyle: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#0f172a",
  letterSpacing: "8px",
  textAlign: "center" as const,
  margin: "0",
};

const expiryStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#94a3b8",
  fontStyle: "italic",
  textAlign: "center" as const,
  marginTop: "16px",
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

export default AccessAuth2FAEmailSimple;

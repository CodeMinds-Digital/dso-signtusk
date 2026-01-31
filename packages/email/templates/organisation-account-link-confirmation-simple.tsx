/**
 * Simple organisation account link confirmation email without React hooks.
 */
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "../components";

export type OrganisationAccountLinkConfirmationSimpleProps = {
  type: "create" | "link";
  confirmationLink: string;
  organisationName: string;
  assetBaseUrl: string;
  translations: {
    previewText: string;
    title: string;
    message: string;
    reviewButton: string;
    expiryNote: string;
    footer: string;
  };
  branding?: {
    brandingEnabled: boolean;
    brandingLogo?: string;
    brandingCompanyDetails?: string;
  };
};

export const OrganisationAccountLinkConfirmationSimple = ({
  type,
  confirmationLink,
  organisationName,
  assetBaseUrl = "http://localhost:3002",
  translations,
  branding,
}: OrganisationAccountLinkConfirmationSimpleProps) => {
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
              src={getAssetUrl("/static/building-2.png")}
              alt="Organisation"
              style={iconStyle}
            />
            <Text style={titleStyle}>{translations.title}</Text>
            <Text style={messageStyle}>{translations.message}</Text>
            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={confirmationLink}>
                {translations.reviewButton}
              </Button>
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
const sectionStyle: React.CSSProperties = { textAlign: "center" as const };
const logoStyle: React.CSSProperties = { height: "24px", marginBottom: "16px" };
const iconStyle: React.CSSProperties = {
  height: "48px",
  width: "48px",
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
const expiryStyle: React.CSSProperties = {
  fontSize: "12px",
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

export default OrganisationAccountLinkConfirmationSimple;

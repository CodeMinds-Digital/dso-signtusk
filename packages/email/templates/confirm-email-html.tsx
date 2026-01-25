/**
 * Pure HTML confirmation email template without Tailwind or any Suspense-using components.
 *
 * This template uses inline styles to avoid React version conflicts and Suspense issues
 * with @react-email/render in serverless environments.
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

export type ConfirmEmailHtmlProps = {
  confirmationLink: string;
  assetBaseUrl: string;
  translations?: {
    previewText?: string;
    welcomeTitle?: string;
    confirmInstructions?: string;
    confirmButton?: string;
    linkExpiry?: string;
  };
};

const defaultTranslations = {
  previewText: "Please confirm your email address",
  welcomeTitle: "Welcome to Signtusk!",
  confirmInstructions:
    "Before you get started, please confirm your email address by clicking the button below:",
  confirmButton: "Confirm email",
  linkExpiry: "(link expires in 1 hour)",
};

export const ConfirmEmailHtmlTemplate = ({
  confirmationLink,
  assetBaseUrl = "http://localhost:3002",
  translations = {},
}: ConfirmEmailHtmlProps) => {
  const t = { ...defaultTranslations, ...translations };

  const getAssetUrl = (path: string) => {
    return new URL(path, assetBaseUrl).toString();
  };

  return (
    <Html>
      <Head />
      <Preview>{t.previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            <Img
              src={getAssetUrl("/static/logo.png")}
              alt="Logo"
              style={logoStyle}
            />

            <Img
              src={getAssetUrl("/static/document.png")}
              alt="Document"
              style={documentImageStyle}
            />

            <Text style={titleStyle}>{t.welcomeTitle}</Text>

            <Text style={instructionsStyle}>{t.confirmInstructions}</Text>

            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={confirmationLink}>
                {t.confirmButton}
              </Button>
            </Section>

            <Text style={linkTextStyle}>
              You can also copy and paste this link into your browser:{" "}
              {confirmationLink} {t.linkExpiry}
            </Text>
          </Section>
        </Container>

        <Container style={footerContainerStyle}>
          <Text style={footerStyle}>
            Signtusk
            <br />
            2261 Market Street, #5211, San Francisco, CA 94114, USA
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Inline styles to avoid Tailwind/Suspense issues
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
  marginBottom: "0",
  maxWidth: "80%",
  margin: "0 auto",
  textAlign: "center" as const,
};

const instructionsStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#94a3b8",
  margin: "4px 0",
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

const linkTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#94a3b8",
  fontStyle: "italic",
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
};

export default ConfirmEmailHtmlTemplate;

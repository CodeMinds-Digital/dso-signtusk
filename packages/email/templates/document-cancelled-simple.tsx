/**
 * Simple document cancelled email template without React hooks or Tailwind.
 * Uses inline styles and accepts translations as props.
 */
import { Body } from "@react-email/body";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Html } from "@react-email/html";
import { Img } from "@react-email/img";
import { Preview } from "@react-email/preview";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";

export type DocumentCancelledEmailSimpleProps = {
  documentName: string;
  inviterName?: string;
  inviterEmail?: string;
  cancellationReason?: string;
  assetBaseUrl: string;
  translations: {
    previewText: string;
    title: string;
    message: string;
    reasonLabel: string;
    reason: string;
    footer: string;
  };
  branding?: {
    brandingEnabled: boolean;
    brandingLogo?: string;
    brandingCompanyDetails?: string;
  };
};

export const DocumentCancelledEmailSimple = ({
  assetBaseUrl,
  translations,
  branding,
}: DocumentCancelledEmailSimpleProps) => {
  const getAssetUrl = (path: string) => {
    return new URL(path, assetBaseUrl).toString();
  };

  return (
    <Html>
      <Head />
      <Preview>{translations.previewText}</Preview>
      <Body style={styles.body}>
        <Section style={styles.bgSection}>
          <Container style={styles.container}>
            <Section style={styles.section}>
              {branding?.brandingEnabled && branding.brandingLogo ? (
                <Img
                  src={branding.brandingLogo}
                  alt="Logo"
                  style={styles.logo}
                />
              ) : (
                <Img
                  src={getAssetUrl("/static/logo.png")}
                  alt="Signtusk Logo"
                  style={styles.logo}
                />
              )}

              <Img
                src={getAssetUrl("/static/document.png")}
                alt="Document"
                style={styles.documentImage}
              />

              <Text style={styles.title}>{translations.title}</Text>

              <Text style={styles.message}>{translations.message}</Text>

              <Section style={styles.reasonSection}>
                <Text style={styles.reasonLabel}>
                  {translations.reasonLabel}
                </Text>
                <Text style={styles.reason}>{translations.reason}</Text>
              </Section>

              <Text style={styles.footer}>{translations.footer}</Text>
            </Section>
          </Container>

          <Container style={styles.footerContainer}>
            <Text style={styles.footerText}>
              {branding?.brandingCompanyDetails || "Signtusk"}
              <br />
              2261 Market Street, #5211, San Francisco, CA 94114, USA
            </Text>
          </Container>
        </Section>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    margin: "0 auto",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  bgSection: {
    backgroundColor: "#ffffff",
  },
  container: {
    maxWidth: "580px",
    margin: "32px auto 8px auto",
    padding: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
  },
  section: {
    textAlign: "center" as const,
  },
  logo: {
    height: "24px",
    marginBottom: "16px",
  },
  documentImage: {
    height: "168px",
    margin: "24px auto",
  },
  title: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 auto",
    maxWidth: "80%",
    textAlign: "center" as const,
  },
  message: {
    fontSize: "16px",
    color: "#64748b",
    margin: "16px 0",
    textAlign: "center" as const,
  },
  reasonSection: {
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "8px",
    margin: "24px 0",
  },
  reasonLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 8px 0",
  },
  reason: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
    fontStyle: "italic" as const,
  },
  footer: {
    fontSize: "14px",
    color: "#94a3b8",
    fontStyle: "italic" as const,
    textAlign: "center" as const,
    marginTop: "32px",
  },
  footerContainer: {
    maxWidth: "580px",
    margin: "0 auto",
  },
  footerText: {
    fontSize: "14px",
    color: "#94a3b8",
    textAlign: "center" as const,
    margin: "32px 0",
  },
};

export default DocumentCancelledEmailSimple;

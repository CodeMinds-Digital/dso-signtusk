#!/bin/bash

# Script to generate all simple email templates
# This creates templates using the proven renderSimple() approach

set -e

echo "🚀 Generating all simple email templates..."

# Create templates directory if it doesn't exist
mkdir -p packages/email/templates

# Template generator function
generate_template() {
  local name=$1
  local title=$2
  local image=$3
  
  cat > "packages/email/templates/${name}-simple.tsx" << 'EOF'
/**
 * Simple ${title} email template without React hooks or Tailwind.
 * Uses inline styles and accepts translations as props.
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

export type ${title}EmailSimpleProps = {
  assetBaseUrl: string;
  translations: {
    previewText: string;
    title: string;
    message: string;
    buttonText?: string;
    buttonUrl?: string;
    footer: string;
  };
  branding?: {
    brandingEnabled: boolean;
    brandingLogo?: string;
    brandingCompanyDetails?: string;
  };
};

export const ${title}EmailSimple = ({
  assetBaseUrl,
  translations,
  branding,
}: ${title}EmailSimpleProps) => {
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
                <Img src={branding.brandingLogo} alt="Logo" style={styles.logo} />
              ) : (
                <Img
                  src={getAssetUrl("/static/logo.png")}
                  alt="Signtusk Logo"
                  style={styles.logo}
                />
              )}

              <Img
                src={getAssetUrl("/static/${image}.png")}
                alt="${title}"
                style={styles.documentImage}
              />

              <Text style={styles.title}>{translations.title}</Text>
              <Text style={styles.message}>{translations.message}</Text>

              {translations.buttonText && translations.buttonUrl && (
                <Section style={styles.buttonContainer}>
                  <Button style={styles.button} href={translations.buttonUrl}>
                    {translations.buttonText}
                  </Button>
                </Section>
              )}

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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
  buttonContainer: {
    textAlign: "center" as const,
    marginTop: "32px",
    marginBottom: "24px",
  },
  button: {
    backgroundColor: "#7AC455",
    color: "#000000",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    textDecoration: "none",
    display: "inline-block",
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

export default ${title}EmailSimple;
EOF

  # Replace placeholders
  sed -i.bak "s/\${title}/$title/g" "packages/email/templates/${name}-simple.tsx"
  sed -i.bak "s/\${image}/$image/g" "packages/email/templates/${name}-simple.tsx"
  rm "packages/email/templates/${name}-simple.tsx.bak"
  
  echo "✅ Created ${name}-simple.tsx"
}

# Generate all templates
echo "📝 Generating document email templates..."
generate_template "document-rejected" "DocumentRejected" "rejected"
generate_template "document-rejection-confirmed" "DocumentRejectionConfirmed" "rejected"
generate_template "document-cancelled" "DocumentCancelled" "cancelled"
generate_template "recipient-signed" "RecipientSigned" "signing-card"
generate_template "document-pending" "DocumentPending" "document"
generate_template "document-self-signed" "DocumentSelfSigned" "completed"

echo "📝 Generating password email templates..."
generate_template "password-reset" "PasswordReset" "document"
generate_template "password-reset-success" "PasswordResetSuccess" "completed"
generate_template "forgot-password" "ForgotPassword" "document"

echo "📝 Generating team email templates..."
generate_template "team-deleted" "TeamDeleted" "document"
generate_template "team-email-removed" "TeamEmailRemoved" "document"
generate_template "team-email-confirmation" "TeamEmailConfirmation" "document"

echo "📝 Generating organization email templates..."
generate_template "organisation-invite" "OrganisationInvite" "signing-card"
generate_template "organisation-join" "OrganisationJoin" "completed"
generate_template "organisation-leave" "OrganisationLeave" "document"
generate_template "organisation-account-link" "OrganisationAccountLink" "document"

echo "📝 Generating additional email templates..."
generate_template "access-auth-2fa" "AccessAuth2FA" "document"
generate_template "bulk-send-complete" "BulkSendComplete" "completed"
generate_template "document-super-delete" "DocumentSuperDelete" "document"
generate_template "recipient-removed" "RecipientRemoved" "document"

echo "✅ All simple email templates generated!"
echo ""
echo "Next steps:"
echo "1. Review generated templates in packages/email/templates/"
echo "2. Customize specific templates as needed"
echo "3. Run: npm run build"
echo "4. Test each email type"

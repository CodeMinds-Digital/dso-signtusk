/**
 * Simple confirmation email template without lingui hooks.
 *
 * This template accepts pre-translated strings as props to avoid
 * React version conflicts with @react-email/render in serverless environments.
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
import { TemplateDocumentImage } from "../template-components/template-document-image";
import { TemplateFooterSimple } from "../template-components/template-footer-simple";

export type ConfirmEmailSimpleProps = {
  confirmationLink: string;
  assetBaseUrl: string;
  // Pre-translated strings
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

export const ConfirmEmailSimpleTemplate = ({
  confirmationLink,
  assetBaseUrl = "http://localhost:3002",
  translations = {},
}: ConfirmEmailSimpleProps) => {
  const t = { ...defaultTranslations, ...translations };

  const getAssetUrl = (path: string) => {
    return new URL(path, assetBaseUrl).toString();
  };

  return (
    <Html>
      <Head />
      <Preview>{t.previewText}</Preview>
      <Body className="mx-auto my-auto bg-white font-sans">
        <Section>
          <Container className="mx-auto mb-2 mt-8 max-w-xl rounded-lg border border-solid border-slate-200 p-4 backdrop-blur-sm">
            <Section>
              <Img
                src={getAssetUrl("/static/logo.png")}
                alt="Logo"
                className="mb-4 h-6"
              />

              <TemplateDocumentImage
                className="mt-6"
                assetBaseUrl={assetBaseUrl}
              />

              <Section className="flex-row items-center justify-center">
                <Text className="text-primary mx-auto mb-0 max-w-[80%] text-center text-lg font-semibold">
                  {t.welcomeTitle}
                </Text>

                <Text className="my-1 text-center text-base text-slate-400">
                  {t.confirmInstructions}
                </Text>

                <Section className="mb-6 mt-8 text-center">
                  <Button
                    className="bg-documenso-500 inline-flex items-center justify-center rounded-lg px-6 py-3 text-center text-sm font-medium text-black no-underline"
                    href={confirmationLink}
                  >
                    {t.confirmButton}
                  </Button>
                  <Text className="mt-8 text-center text-sm italic text-slate-400">
                    You can also copy and paste this link into your browser:{" "}
                    {confirmationLink} {t.linkExpiry}
                  </Text>
                </Section>
              </Section>
            </Section>
          </Container>
          <div className="mx-auto mt-12 max-w-xl" />

          <Container className="mx-auto max-w-xl">
            <TemplateFooterSimple isDocument={false} />
          </Container>
        </Section>
      </Body>
    </Html>
  );
};

export default ConfirmEmailSimpleTemplate;

/**
 * Simple footer template without lingui hooks.
 * Used for serverless environments where React version conflicts occur.
 */
import { Section, Text } from "../components";

export type TemplateFooterSimpleProps = {
  isDocument?: boolean;
  companyName?: string;
  companyAddress?: string;
};

export const TemplateFooterSimple = ({
  isDocument = true,
  companyName = "Signtusk",
  companyAddress = "2261 Market Street, #5211, San Francisco, CA 94114, USA",
}: TemplateFooterSimpleProps) => {
  return (
    <Section>
      <Text className="my-8 text-sm text-slate-400">
        {companyName}
        <br />
        {companyAddress}
      </Text>
    </Section>
  );
};

export default TemplateFooterSimple;

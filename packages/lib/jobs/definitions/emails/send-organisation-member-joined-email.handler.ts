import { createElement } from "react";

import { msg } from "@lingui/core/macro";

import { mailer } from "@signtusk/email/mailer";
import { renderSimple } from "@signtusk/email/render-simple";
import OrganisationMemberJoinedEmailSimple from "@signtusk/email/templates/organisation-member-joined-simple";
import { prisma } from "@signtusk/prisma";

import { getI18nInstance } from "../../../client-only/providers/i18n-server";
import { NEXT_PUBLIC_WEBAPP_URL } from "../../../constants/app";
import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from "../../../constants/organisations";
import { getEmailContext } from "../../../server-only/email/get-email-context";
import { getOrganisationMemberJoinedTranslations } from "../../../utils/get-email-translations";
import type { JobRunIO } from "../../client/_internal/job";
import type { TSendOrganisationMemberJoinedEmailJobDefinition } from "./send-organisation-member-joined-email";

export const run = async ({
  payload,
  io,
}: {
  payload: TSendOrganisationMemberJoinedEmailJobDefinition;
  io: JobRunIO;
}) => {
  const organisation = await prisma.organisation.findFirstOrThrow({
    where: {
      id: payload.organisationId,
    },
    include: {
      members: {
        where: {
          organisationGroupMembers: {
            some: {
              group: {
                organisationRole: {
                  in: ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP[
                    "MANAGE_ORGANISATION"
                  ],
                },
              },
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const invitedMember = await prisma.organisationMember.findFirstOrThrow({
    where: {
      userId: payload.memberUserId,
      organisationId: payload.organisationId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  const { branding, emailLanguage, senderEmail } = await getEmailContext({
    emailType: "INTERNAL",
    source: {
      type: "organisation",
      organisationId: organisation.id,
    },
  });

  for (const member of organisation.members) {
    if (member.id === invitedMember.id) {
      continue;
    }

    await io.runTask(
      `send-organisation-member-joined-email--${invitedMember.id}_${member.id}`,
      async () => {
        const translations = await getOrganisationMemberJoinedTranslations(
          emailLanguage,
          {
            memberName: invitedMember.user.name || "",
            memberEmail: invitedMember.user.email,
            organisationName: organisation.name,
          }
        );

        const emailContent = createElement(
          OrganisationMemberJoinedEmailSimple,
          {
            assetBaseUrl: NEXT_PUBLIC_WEBAPP_URL(),
            baseUrl: NEXT_PUBLIC_WEBAPP_URL(),
            memberName: invitedMember.user.name || "",
            memberEmail: invitedMember.user.email,
            organisationName: organisation.name,
            organisationUrl: organisation.url,
            translations,
            branding: branding
              ? {
                  brandingEnabled: true,
                  brandingLogo: branding.logo || undefined,
                  brandingCompanyDetails: branding.companyDetails || undefined,
                }
              : undefined,
          }
        );

        const [html, text] = await Promise.all([
          renderSimple(emailContent),
          renderSimple(emailContent, { plainText: true }),
        ]);

        const i18n = await getI18nInstance(emailLanguage);

        await mailer.sendMail({
          to: member.user.email,
          from: senderEmail,
          subject: i18n._(msg`A new member has joined your organisation`),
          html,
          text,
        });
      }
    );
  }
};

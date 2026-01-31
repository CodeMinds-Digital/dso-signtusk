import { createElement } from "react";

import { msg } from "@lingui/core/macro";
import { OrganisationGroupType, type Team } from "@prisma/client";
import { uniqueBy } from "remeda";

import { mailer } from "@signtusk/email/mailer";
import { renderSimple } from "@signtusk/email/render-simple";
import { TeamDeletedEmailSimple } from "@signtusk/email/templates/team-deleted-simple";
import { NEXT_PUBLIC_WEBAPP_URL } from "@signtusk/lib/constants/app";
import { AppError, AppErrorCode } from "@signtusk/lib/errors/app-error";
import { prisma } from "@signtusk/prisma";

import { getI18nInstance } from "../../client-only/providers/i18n-server";
import { TEAM_MEMBER_ROLE_PERMISSIONS_MAP } from "../../constants/teams";
import { jobs } from "../../jobs/client";
import { getTeamDeletedTranslations } from "../../utils/get-email-translations";
import { buildTeamWhereQuery } from "../../utils/teams";
import { getEmailContext } from "../email/get-email-context";

export type DeleteTeamOptions = {
  userId: number;
  teamId: number;
};

export const deleteTeam = async ({ userId, teamId }: DeleteTeamOptions) => {
  const team = await prisma.team.findFirst({
    where: buildTeamWhereQuery({
      teamId,
      userId,
      roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP["DELETE_TEAM"],
    }),
    include: {
      organisation: {
        select: {
          organisationGlobalSettings: true,
        },
      },
      teamGroups: {
        include: {
          organisationGroup: {
            include: {
              organisationGroupMembers: {
                include: {
                  organisationMember: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!team) {
    throw new AppError(AppErrorCode.UNAUTHORIZED, {
      message: "You are not authorized to delete this team",
    });
  }

  const membersToNotify = uniqueBy(
    team.teamGroups.flatMap((group) =>
      group.organisationGroup.organisationGroupMembers.map((member) => ({
        id: member.organisationMember.user.id,
        name: member.organisationMember.user.name || "",
        email: member.organisationMember.user.email,
      }))
    ),
    (member) => member.id
  );

  await prisma.$transaction(
    async (tx) => {
      await tx.team.delete({
        where: {
          id: teamId,
        },
      });

      // Purge all internal organisation groups that have no teams.
      await tx.organisationGroup.deleteMany({
        where: {
          type: OrganisationGroupType.INTERNAL_TEAM,
          teamGroups: {
            none: {},
          },
        },
      });

      await jobs.triggerJob({
        name: "send.team-deleted.email",
        payload: {
          team: {
            name: team.name,
            url: team.url,
          },
          members: membersToNotify,
          organisationId: team.organisationId,
        },
      });
    },
    { timeout: 30_000 }
  );
};

type SendTeamDeleteEmailOptions = {
  email: string;
  team: Pick<Team, "url" | "name">;
  organisationId: string;
};

export const sendTeamDeleteEmail = async ({
  email,
  team,
  organisationId,
}: SendTeamDeleteEmailOptions) => {
  const { branding, emailLanguage, senderEmail } = await getEmailContext({
    emailType: "INTERNAL",
    source: {
      type: "organisation",
      organisationId,
    },
  });

  // Get translations for the email
  const translations = await getTeamDeletedTranslations(
    emailLanguage as import("../../constants/i18n").SupportedLanguageCodes,
    {
      teamName: team.name,
    }
  );

  const template = createElement(TeamDeletedEmailSimple, {
    assetBaseUrl: NEXT_PUBLIC_WEBAPP_URL(),
    baseUrl: NEXT_PUBLIC_WEBAPP_URL(),
    teamUrl: team.url,
    teamName: team.name,
    translations,
    branding: branding
      ? {
          brandingEnabled: branding.brandingEnabled,
          brandingLogo: branding.brandingLogo || undefined,
          brandingCompanyDetails: branding.brandingCompanyDetails || undefined,
        }
      : undefined,
  });

  const [html, text] = await Promise.all([
    renderSimple(template),
    renderSimple(template, { plainText: true }),
  ]);

  const i18n = await getI18nInstance(emailLanguage);

  await mailer.sendMail({
    to: email,
    from: senderEmail,
    subject: i18n._(msg`Team "${team.name}" has been deleted on Signtusk`),
    html,
    text,
  });
};

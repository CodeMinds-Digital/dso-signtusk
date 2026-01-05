import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from "@signtusk/lib/constants/organisations";
import { AppError, AppErrorCode } from "@signtusk/lib/errors/app-error";
import { buildOrganisationWhereQuery } from "@signtusk/lib/utils/organisations";
import { prisma } from "@signtusk/prisma";

import { authenticatedProcedure } from "../trpc";
import {
  ZGetOrganisationEmailDomainRequestSchema,
  ZGetOrganisationEmailDomainResponseSchema,
} from "./get-organisation-email-domain.types";

export const getOrganisationEmailDomainRoute = authenticatedProcedure
  .input(ZGetOrganisationEmailDomainRequestSchema)
  .output(ZGetOrganisationEmailDomainResponseSchema)
  .query(async ({ input, ctx }) => {
    const { emailDomainId } = input;

    ctx.logger.info({
      input: {
        emailDomainId,
      },
    });

    return await getOrganisationEmailDomain({
      userId: ctx.user.id,
      emailDomainId,
    });
  });

type GetOrganisationEmailDomainOptions = {
  userId: number;
  emailDomainId: string;
};

export const getOrganisationEmailDomain = async ({
  userId,
  emailDomainId,
}: GetOrganisationEmailDomainOptions) => {
  const emailDomain = await prisma.emailDomain.findFirst({
    where: {
      id: emailDomainId,
      organisation: buildOrganisationWhereQuery({
        organisationId: undefined,
        userId,
        roles: ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP["MANAGE_ORGANISATION"],
      }),
    },
    select: {
      id: true,
      status: true,
      organisationId: true,
      domain: true,
      selector: true,
      publicKey: true,
      createdAt: true,
      updatedAt: true,
      emails: true,
    },
  });

  if (!emailDomain) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: "Email domain not found",
    });
  }

  return emailDomain;
};

import { GetEmailIdentityCommand } from "@aws-sdk/client-sesv2";
import { EmailDomainStatus } from "@signtusk/lib/constants/prisma-enums";

import { AppError, AppErrorCode } from "@signtusk/lib/errors/app-error";
import { prisma } from "@signtusk/prisma";

import { getSesClient } from "./create-email-domain";

export const verifyEmailDomain = async (emailDomainId: string) => {
  const emailDomain = await prisma.emailDomain.findUnique({
    where: {
      id: emailDomainId,
    },
  });

  if (!emailDomain) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: "Email domain not found",
    });
  }

  const sesClient = getSesClient();

  const response = await sesClient.send(
    new GetEmailIdentityCommand({
      EmailIdentity: emailDomain.domain,
    })
  );

  const isVerified = response.VerificationStatus === "SUCCESS";

  const updatedEmailDomain = await prisma.emailDomain.update({
    where: {
      id: emailDomainId,
    },
    data: {
      status: isVerified ? EmailDomainStatus.ACTIVE : EmailDomainStatus.PENDING,
    },
  });

  return {
    emailDomain: updatedEmailDomain,
    isVerified,
  };
};

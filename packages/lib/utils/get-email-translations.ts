/**
 * Helper to get pre-translated strings for email templates.
 * This avoids using React hooks in email rendering.
 */
import { msg } from "@lingui/core/macro";
import { getI18nInstance } from "../client-only/providers/i18n-server";
import type { SupportedLanguageCodes } from "../constants/i18n";
import type { RecipientRole } from "../constants/prisma-enums";
import { RECIPIENT_ROLES_DESCRIPTION } from "../constants/recipient-roles";

export const getDocumentInviteTranslations = async (
  lang: SupportedLanguageCodes = "en",
  recipientRole: RecipientRole,
  data: {
    recipientName: string;
    inviterName: string;
    documentName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  const roleDescription = RECIPIENT_ROLES_DESCRIPTION[recipientRole];
  const actionVerb = i18n._(roleDescription.actionVerb);

  return {
    previewText: i18n._(
      msg`${data.inviterName} has invited you to ${actionVerb} ${data.documentName}`
    ),
    greeting: i18n._(msg`Hi ${data.recipientName},`),
    inviteMessage: i18n._(
      msg`${data.inviterName} has invited you to ${actionVerb} "${data.documentName}"`
    ),
    actionVerb,
    buttonText: i18n._(roleDescription.actioned),
    footer: i18n._(msg`This link will expire in 7 days`),
  };
};

export const getDocumentCompletedTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    documentName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(msg`${data.documentName} has been completed`),
    title: i18n._(msg`Document Completed`),
    message: i18n._(
      msg`"${data.documentName}" has been signed by all recipients and is now complete.`
    ),
    downloadButton: i18n._(msg`Download Document`),
    footer: i18n._(
      msg`You can download the completed document using the button above.`
    ),
  };
};

export const getDocumentRejectedTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    recipientName: string;
    documentName: string;
    reason?: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(
      msg`${data.recipientName} has rejected ${data.documentName}`
    ),
    title: i18n._(msg`Document Rejected`),
    message: i18n._(
      msg`${data.recipientName} has rejected "${data.documentName}"`
    ),
    reasonLabel: i18n._(msg`Reason:`),
    reason: data.reason || i18n._(msg`No reason provided`),
    footer: i18n._(msg`The document signing process has been stopped.`),
  };
};

export const getDocumentRejectionConfirmedTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    recipientName: string;
    documentName: string;
    documentOwnerName: string;
    reason?: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(
      msg`Your rejection of ${data.documentName} has been confirmed`
    ),
    title: i18n._(msg`Rejection Confirmed`),
    greeting: i18n._(msg`Hi ${data.recipientName},`),
    message: i18n._(
      msg`Your rejection of "${data.documentName}" from ${data.documentOwnerName} has been confirmed.`
    ),
    reasonLabel: i18n._(msg`Your reason:`),
    reason: data.reason || i18n._(msg`No reason provided`),
    footer: i18n._(
      msg`The document owner has been notified of your rejection.`
    ),
  };
};

export const getDocumentCancelledTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    documentName: string;
    inviterName?: string;
    cancellationReason?: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(msg`${data.documentName} has been cancelled`),
    title: i18n._(msg`Document Cancelled`),
    message: i18n._(
      msg`The document "${data.documentName}" has been cancelled${data.inviterName ? ` by ${data.inviterName}` : ""}.`
    ),
    reasonLabel: i18n._(msg`Reason:`),
    reason: data.cancellationReason || i18n._(msg`No reason provided`),
    footer: i18n._(msg`No further action is required from you.`),
  };
};

export const getRecipientSignedTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    recipientName: string;
    documentName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(
      msg`${data.recipientName} has signed ${data.documentName}`
    ),
    title: i18n._(msg`Document Signed`),
    message: i18n._(
      msg`${data.recipientName} has signed "${data.documentName}".`
    ),
    footer: i18n._(msg`You will be notified when all recipients have signed.`),
  };
};

export const getPasswordResetTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    userName?: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(msg`Reset your password`),
    greeting: data.userName
      ? i18n._(msg`Hi ${data.userName},`)
      : i18n._(msg`Hi,`),
    title: i18n._(msg`Reset Your Password`),
    message: i18n._(
      msg`You requested to reset your password. Click the button below to set a new password.`
    ),
    buttonText: i18n._(msg`Reset Password`),
    footer: i18n._(
      msg`This link will expire in 1 hour. If you didn't request this, please ignore this email.`
    ),
  };
};

export const getPasswordResetSuccessTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    userName?: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(msg`Your password has been reset`),
    greeting: data.userName
      ? i18n._(msg`Hi ${data.userName},`)
      : i18n._(msg`Hi,`),
    title: i18n._(msg`Password Reset Successful`),
    message: i18n._(
      msg`Your password has been successfully reset. You can now log in with your new password.`
    ),
    footer: i18n._(
      msg`If you didn't make this change, please contact support immediately.`
    ),
  };
};

export const getTeamDeletedTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    teamName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(msg`Team ${data.teamName} has been deleted`),
    title: i18n._(msg`Team Deleted`),
    message: i18n._(
      msg`The team "${data.teamName}" has been deleted. You no longer have access to this team's documents and resources.`
    ),
    footer: i18n._(
      msg`If you have any questions, please contact the team owner.`
    ),
  };
};

export const getOrganisationMemberJoinedTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    memberName: string;
    memberEmail: string;
    organisationName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(
      msg`${data.memberName} has joined ${data.organisationName}`
    ),
    title: i18n._(msg`New Member Joined`),
    message: i18n._(
      msg`${data.memberName} (${data.memberEmail}) has joined your organisation "${data.organisationName}".`
    ),
    footer: i18n._(msg`You can manage organisation members in your settings.`),
  };
};

export const getOrganisationMemberLeftTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    memberName: string;
    memberEmail: string;
    organisationName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(
      msg`${data.memberName} has left ${data.organisationName}`
    ),
    title: i18n._(msg`Member Left`),
    message: i18n._(
      msg`${data.memberName} (${data.memberEmail}) has left your organisation "${data.organisationName}".`
    ),
    footer: i18n._(msg`You can manage organisation members in your settings.`),
  };
};

export const getForgotPasswordTranslations = async (
  lang: SupportedLanguageCodes = "en"
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(msg`Reset your password`),
    title: i18n._(msg`Forgot Password?`),
    message: i18n._(
      msg`Click the button below to reset your password. This link will expire in 1 hour.`
    ),
    buttonText: i18n._(msg`Reset Password`),
    footer: i18n._(msg`If you didn't request this, please ignore this email.`),
  };
};

export const getOrganisationInviteTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    organisationName: string;
    inviterName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(
      msg`You've been invited to join ${data.organisationName}`
    ),
    title: i18n._(msg`Organisation Invitation`),
    message: i18n._(
      msg`${data.inviterName} has invited you to join "${data.organisationName}" on Signtusk.`
    ),
    buttonText: i18n._(msg`Accept Invitation`),
    footer: i18n._(msg`This invitation will expire in 7 days.`),
  };
};

export const getConfirmTeamEmailTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    teamName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(msg`Confirm your team email address`),
    title: i18n._(msg`Confirm Team Email`),
    message: i18n._(
      msg`Please confirm this email address for your team "${data.teamName}".`
    ),
    buttonText: i18n._(msg`Confirm Email`),
    footer: i18n._(msg`This link will expire in 1 hour.`),
  };
};

export const getAccessAuth2FATranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    code: string;
    documentTitle: string;
    expiresInMinutes: number;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(msg`Your verification code is ${data.code}`),
    title: i18n._(msg`Verification Code`),
    message: i18n._(
      msg`Use the following code to access "${data.documentTitle}"`
    ),
    codeLabel: i18n._(msg`Your verification code:`),
    expiryNote: i18n._(
      msg`This code will expire in ${data.expiresInMinutes} minutes`
    ),
    footer: i18n._(
      msg`If you didn't request this code, please ignore this email.`
    ),
  };
};

export const getTeamEmailRemovedTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    teamEmail: string;
    teamName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(
      msg`Team email removed for ${data.teamName} on Signtusk`
    ),
    title: i18n._(msg`Team Email Removed`),
    message: i18n._(
      msg`The team email ${data.teamEmail} has been removed from the following team.`
    ),
    footer: i18n._(msg`No further action is required from you.`),
  };
};

export const getDocumentPendingTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    documentName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(msg`Pending Document`),
    title: i18n._(msg`Document Pending`),
    message: i18n._(
      msg`The document "${data.documentName}" is pending and waiting for action.`
    ),
    footer: i18n._(msg`You will be notified when the document status changes.`),
  };
};

export const getDocumentSelfSignedTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    documentName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(msg`Completed Document`),
    title: i18n._(msg`Document Self-Signed`),
    message: i18n._(msg`You have successfully signed "${data.documentName}".`),
    downloadButton: i18n._(msg`Download Document`),
    footer: i18n._(
      msg`You can download the completed document using the button above.`
    ),
  };
};

export const getDocumentSuperDeleteTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    documentName: string;
    reason: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(
      msg`An admin has deleted your document "${data.documentName}".`
    ),
    title: i18n._(msg`Document Deleted`),
    message: i18n._(
      msg`An administrator has deleted your document "${data.documentName}".`
    ),
    reasonLabel: i18n._(msg`Reason:`),
    footer: i18n._(msg`If you have any questions, please contact support.`),
  };
};

export const getDocumentCreatedFromDirectTemplateTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    recipientName: string;
    documentName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(msg`Document created from direct template`),
    title: i18n._(msg`Document Created`),
    message: i18n._(
      msg`${data.recipientName} has created a document using one of your direct links.`
    ),
    viewButton: i18n._(msg`View Document`),
    footer: i18n._(
      msg`You can view the document details using the button above.`
    ),
  };
};

export const getRecipientRemovedFromDocumentTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    inviterName: string;
    documentName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(
      msg`${data.inviterName} has removed you from the document ${data.documentName}.`
    ),
    title: i18n._(msg`Removed from Document`),
    message: i18n._(
      msg`${data.inviterName} has removed you from the document "${data.documentName}".`
    ),
    footer: i18n._(msg`No further action is required from you.`),
  };
};

export const getBulkSendCompleteTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    userName: string;
    templateName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  return {
    previewText: i18n._(
      msg`Bulk send operation complete for template "${data.templateName}"`
    ),
    greeting: i18n._(msg`Hi ${data.userName},`),
    message: i18n._(
      msg`Your bulk send operation for template "${data.templateName}" has completed.`
    ),
    summaryTitle: i18n._(msg`Summary:`),
    totalLabel: i18n._(msg`Total rows processed`),
    successLabel: i18n._(msg`Successfully created`),
    failedLabel: i18n._(msg`Failed`),
    errorsTitle: i18n._(msg`The following errors occurred:`),
    footer: i18n._(
      msg`You can view the created documents in your dashboard under the "Documents created from template" section.`
    ),
  };
};

export const getOrganisationAccountLinkConfirmationTranslations = async (
  lang: SupportedLanguageCodes = "en",
  data: {
    type: "create" | "link";
    organisationName: string;
  }
) => {
  const i18n = await getI18nInstance(lang);
  i18n.activate(lang);

  const isCreate = data.type === "create";

  return {
    previewText: isCreate
      ? i18n._(msg`A request has been made to create an account for you`)
      : i18n._(msg`A request has been made to link your Signtusk account`),
    title: isCreate
      ? i18n._(msg`Account creation request`)
      : i18n._(msg`Link your Signtusk account`),
    message: isCreate
      ? i18n._(
          msg`${data.organisationName} has requested to create an account on your behalf.`
        )
      : i18n._(
          msg`${data.organisationName} has requested to link your current Signtusk account to their organisation.`
        ),
    reviewButton: i18n._(msg`Review request`),
    expiryNote: i18n._(msg`Link expires in 30 minutes.`),
    footer: i18n._(
      msg`If you didn't expect this request, please ignore this email.`
    ),
  };
};

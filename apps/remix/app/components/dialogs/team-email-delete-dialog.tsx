import { useState } from "react";

import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useRevalidator } from "react-router";

import { formatAvatarUrl } from "@signtusk/lib/utils/avatars";
import { extractInitials } from "@signtusk/lib/utils/recipient-formatter";
import { trpc } from "@signtusk/trpc/react";
import { Alert } from "@signtusk/ui/primitives/alert";
import { AvatarWithText } from "@signtusk/ui/primitives/avatar";
import { Button } from "@signtusk/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@signtusk/ui/primitives/dialog";
import { useToast } from "@signtusk/ui/primitives/use-toast";

// Browser-safe type for team with email info
type TeamWithEmail = {
  id: number;
  avatarImageId: string | null;
  teamEmail: {
    name: string;
    email: string;
  } | null;
  emailVerification: {
    expiresAt: Date;
    name: string;
    email: string;
  } | null;
};

export type TeamEmailDeleteDialogProps = {
  trigger?: React.ReactNode;
  teamName: string;
  team: TeamWithEmail;
};

export const TeamEmailDeleteDialog = ({
  trigger,
  teamName,
  team,
}: TeamEmailDeleteDialogProps) => {
  const [open, setOpen] = useState(false);

  const { _ } = useLingui();
  const { toast } = useToast();
  const { revalidate } = useRevalidator();

  const { mutateAsync: deleteTeamEmail, isPending: isDeletingTeamEmail } =
    trpc.team.email.delete.useMutation({
      onSuccess: () => {
        toast({
          title: _(msg`Success`),
          description: _(msg`Team email has been removed`),
          duration: 5000,
        });
      },
      onError: () => {
        toast({
          title: _(msg`Something went wrong`),
          description: _(
            msg`Unable to remove team email at this time. Please try again.`
          ),
          variant: "destructive",
          duration: 10000,
        });
      },
    });

  const {
    mutateAsync: deleteTeamEmailVerification,
    isPending: isDeletingTeamEmailVerification,
  } = trpc.team.email.verification.delete.useMutation({
    onSuccess: () => {
      toast({
        title: _(msg`Success`),
        description: _(msg`Email verification has been removed`),
        duration: 5000,
      });
    },
    onError: () => {
      toast({
        title: _(msg`Something went wrong`),
        description: _(
          msg`Unable to remove email verification at this time. Please try again.`
        ),
        variant: "destructive",
        duration: 10000,
      });
    },
  });

  const onRemove = async () => {
    if (team.teamEmail) {
      await deleteTeamEmail({ teamId: team.id });
    }

    if (team.emailVerification) {
      await deleteTeamEmailVerification({ teamId: team.id });
    }

    await revalidate();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="destructive">
            <Trans>Remove team email</Trans>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent position="center">
        <DialogHeader>
          <DialogTitle>
            <Trans>Are you sure?</Trans>
          </DialogTitle>

          <DialogDescription className="mt-4">
            <Trans>
              You are about to delete the following team email from{" "}
              <span className="font-semibold">{teamName}</span>.
            </Trans>
          </DialogDescription>
        </DialogHeader>

        <Alert variant="neutral" padding="tight">
          <AvatarWithText
            avatarClass="h-12 w-12"
            avatarSrc={formatAvatarUrl(team.avatarImageId)}
            avatarFallback={extractInitials(
              (team.teamEmail?.name || team.emailVerification?.name) ?? ""
            )}
            primaryText={
              <span className="text-foreground/80 text-sm font-semibold">
                {team.teamEmail?.name || team.emailVerification?.name}
              </span>
            }
            secondaryText={
              <span className="text-sm">
                {team.teamEmail?.email || team.emailVerification?.email}
              </span>
            }
          />
        </Alert>

        <fieldset
          disabled={isDeletingTeamEmail || isDeletingTeamEmailVerification}
        >
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              <Trans>Cancel</Trans>
            </Button>

            <Button
              type="submit"
              variant="destructive"
              loading={isDeletingTeamEmail || isDeletingTeamEmailVerification}
              onClick={async () => onRemove()}
            >
              <Trans>Remove</Trans>
            </Button>
          </DialogFooter>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
};

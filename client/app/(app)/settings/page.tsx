"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RiCloudLine, RiContrast2Line, RiLockLine, RiUserLine } from "@remixicon/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ThemeSelector } from "@/components/ui/mode-toggle";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/layout/error-state";
import { AiFeaturesCard } from "@/components/settings/ai-features-card";
import { useCurrentUser } from "@/hooks/use-auth";
import { useStorageUsage } from "@/hooks/use-library";
import { useChangePassword, useUpdateProfile } from "@/hooks/use-user";
import { formatBytes } from "@/lib/format";
import {
  passwordSchema,
  profileSchema,
  type PasswordFormValues,
  type ProfileFormValues,
} from "@/lib/validations/auth";

// The backend doesn't report a storage quota, so we display Google Photos'
// standard free-tier allowance purely as a visual reference point.
const DISPLAY_QUOTA_BYTES = 15 * 1024 ** 3;

export default function SettingsPage() {
  const { data: user } = useCurrentUser();
  const {
    data: storage,
    isLoading: storageLoading,
    isError: storageFailed,
    error: storageError,
    refetch: refetchStorage,
    isRefetching: storageRefetching,
  } = useStorageUsage();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: user ? { displayName: user.displayName } : undefined,
    resetOptions: { keepDirtyValues: true },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function onProfileSubmit(values: ProfileFormValues) {
    updateProfile.mutate(
      { displayName: values.displayName },
      { onSuccess: () => profileForm.reset(values) },
    );
  }

  function onPasswordSubmit(values: PasswordFormValues) {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => passwordForm.reset() },
    );
  }

  const storagePercent = storage
    ? Math.min(100, (storage.libraryUsedBytes / DISPLAY_QUOTA_BYTES) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account, storage and AI features</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiUserLine className="size-4" />
              Profile
            </CardTitle>
            <CardDescription>Update your display name</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" type="email" value={user?.email ?? ""} disabled readOnly />
                </Field>

                <Field data-invalid={!!profileForm.formState.errors.displayName}>
                  <FieldLabel htmlFor="displayName">Display name</FieldLabel>
                  <Input
                    id="displayName"
                    autoComplete="name"
                    aria-invalid={!!profileForm.formState.errors.displayName}
                    {...profileForm.register("displayName")}
                  />
                  <FieldError errors={[profileForm.formState.errors.displayName]} />
                </Field>
              </FieldGroup>

              {updateProfile.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {updateProfile.error instanceof Error
                      ? updateProfile.error.message
                      : "Failed to update profile"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateProfile.isPending || !profileForm.formState.isDirty}
                >
                  {updateProfile.isPending && <Spinner />}
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiContrast2Line className="size-4" />
              Appearance
            </CardTitle>
            <CardDescription>Choose light, dark, or match your device&apos;s setting</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSelector />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiCloudLine className="size-4" />
              Storage
            </CardTitle>
            <CardDescription>Your library usage</CardDescription>
          </CardHeader>
          <CardContent>
            {storageFailed && !storage ? (
              <ErrorState inline error={storageError} onRetry={() => refetchStorage()} retrying={storageRefetching} />
            ) : storageLoading || !storage ? (
              <Spinner className="size-4 text-muted-foreground" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatBytes(storage.libraryUsedBytes)} of {formatBytes(DISPLAY_QUOTA_BYTES)} used
                  </span>
                  <span className="text-muted-foreground">
                    {storage.libraryPhotoCount} item{storage.libraryPhotoCount === 1 ? "" : "s"}
                  </span>
                </div>
                <Progress value={storagePercent} />
              </div>
            )}
          </CardContent>
        </Card>

        <AiFeaturesCard />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiLockLine className="size-4" />
              Password
            </CardTitle>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FieldGroup>
                <Field data-invalid={!!passwordForm.formState.errors.currentPassword}>
                  <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!passwordForm.formState.errors.currentPassword}
                    {...passwordForm.register("currentPassword")}
                  />
                  <FieldError errors={[passwordForm.formState.errors.currentPassword]} />
                </Field>

                <Field data-invalid={!!passwordForm.formState.errors.newPassword}>
                  <FieldLabel htmlFor="newPassword">New password</FieldLabel>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!passwordForm.formState.errors.newPassword}
                    {...passwordForm.register("newPassword")}
                  />
                  <FieldError errors={[passwordForm.formState.errors.newPassword]} />
                </Field>

                <Field data-invalid={!!passwordForm.formState.errors.confirmPassword}>
                  <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                    {...passwordForm.register("confirmPassword")}
                  />
                  <FieldError errors={[passwordForm.formState.errors.confirmPassword]} />
                </Field>
              </FieldGroup>

              {changePassword.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {changePassword.error instanceof Error
                      ? changePassword.error.message
                      : "Failed to update password"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending && <Spinner />}
                  Update password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

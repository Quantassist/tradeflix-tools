"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { useSession, client } from "@/lib/auth-client";
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
    const t = useTranslations('settings');
    const { data: session, isPending: isSessionLoading } = useSession();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPending, startTransition] = useTransition();

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        startTransition(async () => {
            try {
                await client.changePassword(
                    {
                        currentPassword,
                        newPassword,
                    },
                    {
                        onSuccess: () => {
                            toast.success("Password changed successfully");
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                        },
                        onError: (ctx) => {
                            toast.error(ctx.error.message || "Failed to change password");
                        },
                    }
                );
            } catch {
                toast.error("Failed to change password");
            }
        });
    };

    if (isSessionLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">
                    {t('subtitle')}
                </p>
            </div>

            {/* Password Change */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('changePassword')}</CardTitle>
                    <CardDescription>
                        {t('changePasswordDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="current-password">{t('currentPassword')}</Label>
                            <PasswordInput
                                id="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="new-password">{t('newPassword')}</Label>
                            <PasswordInput
                                id="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">{t('confirmNewPassword')}</Label>
                            <PasswordInput
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                            />
                        </div>

                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('changePassword')}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Session Info */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('activeSession')}</CardTitle>
                    <CardDescription>
                        {t('activeSessionDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('sessionId')}</span>
                        <span className="text-sm font-mono truncate max-w-[200px]">
                            {session?.session?.id}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('expiresAt')}</span>
                        <span className="text-sm">
                            {session?.session?.expiresAt
                                ? new Date(session.session.expiresAt).toLocaleDateString()
                                : "N/A"}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
                    <CardDescription>
                        {t('dangerZoneDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{t('deleteAccount')}</p>
                            <p className="text-sm text-muted-foreground">
                                {t('deleteAccountDescription')}
                            </p>
                        </div>
                        <Button variant="destructive" disabled>
                            {t('deleteAccount')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

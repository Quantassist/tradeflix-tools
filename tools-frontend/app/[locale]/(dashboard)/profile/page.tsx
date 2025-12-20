"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, client } from "@/lib/auth-client";
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
    const t = useTranslations('profile');
    const { data: session, isPending: isSessionLoading } = useSession();
    const [name, setName] = useState(session?.user?.name || "");
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Update name when session loads
    if (session?.user?.name && name === "") {
        setName(session.user.name);
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setImagePreview((preview) => {
                if (preview) {
                    URL.revokeObjectURL(preview);
                }
                return URL.createObjectURL(file);
            });
        }
    };

    const convertImageToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            try {
                const updateData: { name?: string; image?: string } = {};

                if (name !== session?.user?.name) {
                    updateData.name = name;
                }

                if (image) {
                    updateData.image = await convertImageToBase64(image);
                }

                if (Object.keys(updateData).length === 0) {
                    toast.info("No changes to save");
                    return;
                }

                await client.updateUser(updateData, {
                    onSuccess: () => {
                        toast.success("Profile updated successfully");
                        setImage(null);
                        setImagePreview(null);
                    },
                    onError: (ctx) => {
                        toast.error(ctx.error.message || "Failed to update profile");
                    },
                });
            } catch {
                toast.error("Failed to update profile");
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

    const userInitials = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U";

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">
                    {t('subtitle')}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('personalInfo')}</CardTitle>
                    <CardDescription>
                        {t('personalInfoDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={imagePreview || session?.user?.image || undefined} />
                                    <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                                </Avatar>
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                                >
                                    <Camera className="h-4 w-4" />
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>
                            <div>
                                <p className="font-medium">{session?.user?.name}</p>
                                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('fullName')}</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('enterName')}
                            />
                        </div>

                        {/* Email (read-only) */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('email')}</Label>
                            <Input
                                id="email"
                                value={session?.user?.email || ""}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('emailCannotChange')}
                            </p>
                        </div>

                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('saveChanges')}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('accountInfo')}</CardTitle>
                    <CardDescription>
                        {t('accountInfoDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('accountId')}</span>
                        <span className="text-sm font-mono">{session?.user?.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('role')}</span>
                        <span className="text-sm capitalize">{session?.user?.role || "user"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('emailVerified')}</span>
                        <span className="text-sm">{session?.user?.emailVerified ? "Yes" : "No"}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

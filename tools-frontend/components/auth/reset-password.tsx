"use client";

import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPassword } from "@/lib/auth-client";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsSubmitting(true);
        setError("");

        const token = searchParams.get("token");
        if (!token) {
            setError("Invalid or missing reset token");
            setIsSubmitting(false);
            return;
        }

        const res = await resetPassword({
            newPassword: password,
            token,
        });

        if (res.error) {
            toast.error(res.error.message);
            setError(res.error.message || "An error occurred");
        } else {
            toast.success("Password reset successfully");
            router.push("/sign-in");
        }

        setIsSubmitting(false);
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Reset password</CardTitle>
                <CardDescription>
                    Enter new password and confirm it to reset your password
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="password">New password</Label>
                            <PasswordInput
                                id="password"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setPassword(e.target.value)
                                }
                                autoComplete="new-password"
                                placeholder="Password"
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="confirm-password">Confirm password</Label>
                            <PasswordInput
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setConfirmPassword(e.target.value)
                                }
                                autoComplete="new-password"
                                placeholder="Confirm Password"
                            />
                        </div>
                    </div>
                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Resetting..." : "Reset password"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

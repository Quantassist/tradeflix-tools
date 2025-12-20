import { Suspense } from "react";
import ResetPassword from "@/components/auth/reset-password";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPassword />
        </Suspense>
    );
}

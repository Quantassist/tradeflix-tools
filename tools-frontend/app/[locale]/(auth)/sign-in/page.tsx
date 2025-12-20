"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SignIn from "@/components/auth/sign-in";
import SignUp from "@/components/auth/sign-up";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AuthTabs() {
    const searchParams = useSearchParams();
    const tab = searchParams.get("tab");
    const defaultTab = tab === "sign-up" ? "sign-up" : "sign-in";

    return (
        <div className="w-full">
            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                    <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="sign-in">
                    <SignIn />
                </TabsContent>
                <TabsContent value="sign-up">
                    <SignUp />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthTabs />
        </Suspense>
    );
}

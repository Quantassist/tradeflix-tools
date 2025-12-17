# Better Auth Setup Guide for Next.js

A comprehensive guide to setting up [Better Auth](https://www.better-auth.com/) in a Next.js application with Prisma, PostgreSQL, and Google OAuth.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Variables](#environment-variables)
4. [Database Setup with Prisma](#database-setup-with-prisma)
5. [Server-Side Auth Configuration](#server-side-auth-configuration)
6. [Client-Side Auth Configuration](#client-side-auth-configuration)
7. [API Route Handler](#api-route-handler)
8. [Auth Components](#auth-components)
9. [Route Protection](#route-protection)
10. [Google OAuth Setup](#google-oauth-setup)
11. [Gotchas & Edge Cases](#gotchas--edge-cases)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ or Bun
- Next.js 14+ (App Router)
- PostgreSQL database (e.g., Supabase, Neon, local)
- Google Cloud Console account (for OAuth)

---

## Installation

```bash
# Core packages
bun add better-auth @better-fetch/fetch

# Prisma adapter
bun add @prisma/client prisma @prisma/adapter-pg pg

# UI dependencies (optional but recommended)
bun add sonner lucide-react
```

---

## Environment Variables

Create a `.env` file in your project root:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Public URL for client-side
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database URLs
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/database"
```

### Important Notes on Environment Variables

- `BETTER_AUTH_SECRET`: Must be at least 32 characters. Generate with: `openssl rand -base64 32`
- `BETTER_AUTH_URL`: Must match your app's URL exactly (no trailing slash)
- `NEXT_PUBLIC_APP_URL`: Same as `BETTER_AUTH_URL`, but accessible on client-side

---

## Database Setup with Prisma

### 1. Create Prisma Config (`prisma.config.ts`)

```typescript
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"), // Use direct URL for migrations
  },
});
```

### 2. Create Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
  schemas  = ["betterauth"]  // Use separate schema for auth tables
}

// Better Auth Models - All tables in 'betterauth' schema

model User {
  id            String    @id
  name          String
  email         String
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  role          String?   @default("user")
  banned        Boolean?  @default(false)
  banReason     String?
  banExpires    DateTime?
  sessions      Session[]
  accounts      Account[]

  @@unique([email])
  @@map("user")
  @@schema("betterauth")
}

model Session {
  id             String   @id
  expiresAt      DateTime
  token          String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  ipAddress      String?
  userAgent      String?
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  impersonatedBy String?

  @@unique([token])
  @@index([userId])
  @@map("session")
  @@schema("betterauth")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
  @@map("account")
  @@schema("betterauth")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verification")
  @@schema("betterauth")
}
```

### 3. Generate Prisma Client & Push Schema

```bash
# Generate Prisma client
bunx prisma generate

# Push schema to database (creates tables)
bunx prisma db push
```

---

## Server-Side Auth Configuration

Create `lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Setup Prisma with pg adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  appName: "Your App Name",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      // Implement email sending (Resend, SendGrid, etc.)
      console.log(`Password reset link for ${user.email}: ${url}`);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

---

## Client-Side Auth Configuration

Create `lib/auth-client.ts`:

```typescript
"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { toast } from "sonner";

export const client = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [adminClient()],
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
      }
    },
  },
});

// Export commonly used functions
export const { signUp, signIn, signOut, useSession, resetPassword } = client;
```

### Auth Utilities (`lib/auth-utils.ts`)

```typescript
import type { ReadonlyURLSearchParams } from "next/navigation";

const allowedCallbackSet: ReadonlySet<string> = new Set(["/", "/dashboard"]);

export const getCallbackURL = (
  queryParams: ReadonlyURLSearchParams
): string => {
  const callbackUrl = queryParams.get("callbackUrl");
  if (callbackUrl) {
    if (allowedCallbackSet.has(callbackUrl)) {
      return callbackUrl;
    }
    return "/dashboard";
  }
  return "/dashboard";
};
```

---

## API Route Handler

Create `app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

---

## Auth Components

### Sign In Component (`components/auth/sign-in.tsx`)

```tsx
"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { getCallbackURL } from "@/lib/auth-utils";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleEmailSignIn = () => {
    startTransition(async () => {
      await signIn.email(
        { email, password },
        {
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
          onSuccess: () => {
            toast.success("Signed in successfully");
            router.push(getCallbackURL(searchParams));
          },
        }
      );
    });
  };

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      await signIn.social({
        provider: "google",
        callbackURL: getCallbackURL(searchParams),
      });
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to sign in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button onClick={handleEmailSignIn} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        <Button variant="outline" onClick={handleGoogleSignIn} disabled={loading} className="w-full">
          Continue with Google
        </Button>
        <p className="text-center text-sm">
          <Link href="/forget-password" className="underline">
            Forgot password?
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

### Sign Up Component (`components/auth/sign-up.tsx`)

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { getCallbackURL } from "@/lib/auth-utils";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    startTransition(async () => {
      await signUp.email(
        { email, password, name },
        {
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
          onSuccess: () => {
            toast.success("Account created successfully");
            router.push(getCallbackURL(searchParams));
          },
        }
      );
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## Route Protection

### Option 1: Middleware (Next.js 15+)

Create `middleware.ts` in project root:

```typescript
import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "@/lib/auth";

const protectedRoutes = ["/dashboard", "/profile", "/settings"];
const authRoutes = ["/sign-in", "/sign-up", "/forget-password"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Get session
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !session) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users from auth routes
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)"],
};
```

### Option 2: Client-Side Protection (Hook)

```tsx
"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useRequireAuth() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  return { session, isPending };
}
```

---

## Google OAuth Setup

### 1. Create OAuth Credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-production-domain.com/api/auth/callback/google
   ```
7. Copy Client ID and Client Secret to `.env`

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Fill in app name, support email, developer contact
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if in testing mode

---

## Gotchas & Edge Cases

### 1. Redirect URI Mismatch (Error 400)

**Problem:** Google OAuth fails with `redirect_uri_mismatch`

**Solution:** The redirect URI must exactly match what's in Google Cloud Console:
```
{BETTER_AUTH_URL}/api/auth/callback/google
```
- No trailing slashes
- Must match protocol (http vs https)
- Must match port number

### 2. Session Not Persisting

**Problem:** User gets logged out on page refresh

**Causes & Solutions:**
- Ensure `BETTER_AUTH_URL` matches your actual URL
- Check that cookies are being set (same-site issues)
- Verify database connection is stable

### 3. useSearchParams Requires Suspense

**Problem:** Build error about `useSearchParams` needing Suspense

**Solution:** Wrap components using `useSearchParams` in Suspense:
```tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignIn />
    </Suspense>
  );
}
```

### 4. Prisma Client Not Generated

**Problem:** Import errors for Prisma client

**Solution:** 
```bash
bunx prisma generate
```

### 5. Database Schema Not Found

**Problem:** Tables don't exist in database

**Solution:**
```bash
bunx prisma db push
```

### 6. CORS Issues with Social Providers

**Problem:** OAuth popup blocked or CORS errors

**Solution:** Ensure `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` are identical and correct.

### 7. Password Reset Email Not Sending

**Problem:** Password reset doesn't send email

**Solution:** Implement the `sendResetPassword` function in auth config:
```typescript
emailAndPassword: {
  enabled: true,
  async sendResetPassword({ user, url }) {
    // Use Resend, SendGrid, or other email provider
    await resend.emails.send({
      from: "noreply@yourdomain.com",
      to: user.email,
      subject: "Reset your password",
      html: `<a href="${url}">Reset Password</a>`,
    });
  },
},
```

### 8. TypeScript Errors with Session Type

**Problem:** Type errors when accessing session properties

**Solution:** Export and use proper types:
```typescript
// In lib/auth.ts
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

// Usage
import type { Session } from "@/lib/auth";
```

### 9. Middleware Deprecation Warning (Next.js 16+)

**Problem:** Warning about middleware being deprecated

**Note:** Next.js 16 deprecates middleware in favor of "proxy". The middleware still works but may need migration in future versions.

### 10. Multiple Apps on Same Domain

**Problem:** Session conflicts between apps on same domain

**Solution:** Use different cookie names or paths:
```typescript
export const auth = betterAuth({
  // ...
  advanced: {
    cookiePrefix: "myapp_", // Unique prefix per app
  },
});
```

### 11. Rate Limiting

**Problem:** Too many requests error (429)

**Solution:** Better Auth has built-in rate limiting. Handle it gracefully:
```typescript
fetchOptions: {
  onError(e) {
    if (e.error.status === 429) {
      toast.error("Too many requests. Please try again later.");
    }
  },
},
```

### 12. Image Upload for Profile

**Problem:** Profile image not saving

**Solution:** Convert to base64 before sending:
```typescript
const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Usage
const imageBase64 = await convertImageToBase64(file);
await client.updateUser({ image: imageBase64 });
```

---

## Troubleshooting

### Debug Mode

Enable debug logging:
```typescript
export const auth = betterAuth({
  // ...
  logger: {
    level: "debug",
  },
});
```

### Check Session Endpoint

Test the session endpoint directly:
```
GET /api/auth/get-session
```

### Verify Database Connection

```bash
bunx prisma studio
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `redirect_uri_mismatch` | OAuth redirect URI not configured | Add URI to Google Console |
| `Invalid credentials` | Wrong email/password | Check credentials |
| `User already exists` | Email already registered | Use sign-in instead |
| `Session not found` | Expired or invalid session | Re-authenticate |
| `Rate limit exceeded` | Too many requests | Wait and retry |

---

## File Structure Reference

```
your-nextjs-app/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   ├── sign-up/
│   │   │   └── page.tsx
│   │   ├── forget-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   └── (dashboard)/
│       ├── dashboard/
│       │   └── page.tsx
│       ├── profile/
│       │   └── page.tsx
│       └── layout.tsx
├── components/
│   └── auth/
│       ├── sign-in.tsx
│       ├── sign-up.tsx
│       └── forget-password.tsx
├── lib/
│   ├── auth.ts
│   ├── auth-client.ts
│   ├── auth-utils.ts
│   └── generated/
│       └── prisma/
├── prisma/
│   └── schema.prisma
├── middleware.ts
├── prisma.config.ts
└── .env
```

---

## Quick Start Checklist

- [ ] Install dependencies
- [ ] Create `.env` with all required variables
- [ ] Set up Prisma schema with auth models
- [ ] Run `prisma generate` and `prisma db push`
- [ ] Create `lib/auth.ts` (server config)
- [ ] Create `lib/auth-client.ts` (client config)
- [ ] Create API route handler
- [ ] Create auth components (sign-in, sign-up)
- [ ] Set up route protection (middleware or hooks)
- [ ] Configure Google OAuth in Cloud Console
- [ ] Test sign-up, sign-in, and sign-out flows
- [ ] Test Google OAuth flow
- [ ] Test password reset flow

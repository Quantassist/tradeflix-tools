"use client";

import { Bell, LogOut, Settings, User, Menu, Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "./sidebar-context";

// Map routes to page titles and descriptions
const pageInfo: Record<string, { title: string; description: string }> = {
  "/dashboard": { title: "Dashboard", description: "Overview & Analytics" },
  "/backtest": { title: "Backtest Engine", description: "Strategy Testing" },
  "/pivot": { title: "Pivot Calculator", description: "Technical Levels" },
  "/arbitrage": { title: "Arbitrage Heatmap", description: "Price Differentials" },
  "/seasonal": { title: "Seasonal Trends", description: "Pattern Analysis" },
  "/correlation": { title: "Correlation Matrix", description: "Asset Relationships" },
  "/cot": { title: "COT Report", description: "Market Positioning" },
  "/settings": { title: "Settings", description: "Preferences" },
  "/profile": { title: "Profile", description: "Account Details" },
};

export function Header() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toggle } = useSidebar();

  // Get current page info
  const currentPage = pageInfo[pathname] || { title: "Dashboard", description: "Overview" };

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully");
          router.push("/sign-in");
        },
      },
    });
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 lg:px-6">
      {/* Left Section - Menu & Page Title */}
      <div className="flex items-center gap-4">
        {/* Hamburger Menu - Mobile Only */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={toggle}
        >
          <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </Button>

        {/* Page Title with Breadcrumb Style */}
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">
                {currentPage.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {currentPage.description}
            </p>
          </div>
        </div>
      </div>

      {/* Center Section - Search (Hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search tools, features..."
            className="w-full pl-10 h-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-500">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Section - Actions & User */}
      <div className="flex items-center gap-1 lg:gap-2">
        {isPending ? (
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : session?.user ? (
          <>
            {/* Search - Mobile Only */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Search className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
            </Button>

            {/* Settings */}
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </Button>
            </Link>

            {/* Divider */}
            <div className="hidden lg:block h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 px-2 lg:px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 gap-2"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-slate-100 dark:ring-slate-800">
                    <AvatarImage src={session.user.image || undefined} />
                    <AvatarFallback className="bg-linear-to-br from-amber-400 to-orange-500 text-white font-semibold text-sm">
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {session.user.name?.split(" ")[0] || "User"}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Premium
                    </span>
                  </div>
                  <ChevronRight className="hidden lg:block h-4 w-4 text-slate-400 rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl">
                <DropdownMenuLabel className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-700">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback className="bg-linear-to-br from-amber-400 to-orange-500 text-white font-semibold">
                        {session.user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/profile" className="flex items-center gap-3 p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Profile</p>
                      <p className="text-xs text-slate-500">View your profile</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/settings" className="flex items-center gap-3 p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Settings</p>
                      <p className="text-xs text-slate-500">Manage preferences</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-lg cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                >
                  <div className="flex items-center gap-3 p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sign out</p>
                      <p className="text-xs opacity-70">End your session</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : null}
      </div>
    </header>
  );
}

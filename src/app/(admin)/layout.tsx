"use client";
import { signOut } from "next-auth/react";
import { Shield, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Admin navbar */}
      <header className="h-14 bg-red-700 text-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">FincaApp — Panel Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost" className="text-white hover:bg-red-600 text-xs">
            <Link href="/dashboard"><Home className="w-3.5 h-3.5 mr-1" /> Ir a mi finca</Link>
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-red-600 text-xs"
            onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="w-3.5 h-3.5 mr-1" /> Salir
          </Button>
        </div>
      </header>
      <main className="p-6 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}

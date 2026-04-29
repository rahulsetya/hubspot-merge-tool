"use client";

import { StoreProvider } from "@/lib/store";
import { Nav } from "./Nav";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <div className="min-h-screen flex">
        <Nav />
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </StoreProvider>
  );
}

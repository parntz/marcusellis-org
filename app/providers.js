"use client";

import { SessionProvider } from "next-auth/react";
import { DbSaveToastHost } from "../components/db-save-toast-host";

export function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
      <DbSaveToastHost />
    </SessionProvider>
  );
}

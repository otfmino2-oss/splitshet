import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import AIChatProvider from "@/components/AIChatProvider";

export const metadata: Metadata = {
  title: "SplitSheet - Track Leads & Revenue",
  description: "Simple CRM for freelancers and agencies to manage leads and track revenue.",
  keywords: ["CRM", "sales", "leads", "revenue", "deals"],
  authors: [{ name: "SplitSheet" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="cryptomus" content="02b49358" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23A855F7'/><path d='M30 70V35l20 20 20-20v35' stroke='white' stroke-width='8' fill='none'/></svg>" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0A0A0F] text-[#E4E4E7] antialiased" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <AuthProvider>
          <AIChatProvider>
            <main className="flex-1 w-full">
              {children}
            </main>
          </AIChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

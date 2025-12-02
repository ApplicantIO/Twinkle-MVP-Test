import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { MiniplayerProvider } from "@/contexts/MiniplayerContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { CentralizedVideoPlayer } from "@/components/CentralizedVideoPlayer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Twinkle",
  description: "Video sharing platform for creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SidebarProvider>
            <MiniplayerProvider>
              <Header />
              <Sidebar />
              <MainContent>
                {children}
              </MainContent>
              <CentralizedVideoPlayer />
            </MiniplayerProvider>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

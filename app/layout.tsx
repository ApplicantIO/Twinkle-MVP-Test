import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { MiniplayerProvider } from "@/contexts/MiniplayerContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { PurchaseProvider } from "@/contexts/PurchaseContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { CentralizedVideoPlayer } from "@/components/CentralizedVideoPlayer";
import { ShareModal } from "@/components/modals/ShareModal";
import { ReportModal } from "@/components/modals/ReportModal";
import { PurchaseFlowModal } from "@/components/modals/PurchaseFlowModal";
import { ClearHistoryModal } from "@/components/history/ClearHistoryModal";
import { PauseHistoryModal } from "@/components/history/PauseHistoryModal";
import { CreatorAboutModal } from "@/components/modals/CreatorAboutModal";
import { AuthModalWrapper } from "@/components/AuthModalWrapper";

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
      <body className="font-sans">
        <AuthProvider>
          <SubscriptionProvider>
          <PurchaseProvider>
            <SidebarProvider>
              <MiniplayerProvider>
                <ModalProvider>
            <Header />
            <Sidebar />
              <MainContent>
          {children}
              </MainContent>
                  <BottomNavbar />
                  <CentralizedVideoPlayer />
                  <ShareModal />
                  <ReportModal />
                  <PurchaseFlowModal />
                  <AuthModalWrapper />
                  <ClearHistoryModal />
                  <PauseHistoryModal />
                  <CreatorAboutModal />
                </ModalProvider>
              </MiniplayerProvider>
            </SidebarProvider>
          </PurchaseProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

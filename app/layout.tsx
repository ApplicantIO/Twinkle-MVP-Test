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
import { organizationSchema, websiteSchema } from "@/lib/seo/schemas";
import { SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Twinkle — Kontent yaratuvchilar uchun monetizatsiya platformasi",
    template: "%s | Twinkle",
  },

  description:
    "Twinkle — O'zbekiston va Markaziy Osiyo kontent yaratuvchilari uchun video platforma. Obuna, donat va reklama orqali daromad ishlang. Blogerlar, streamerlar va podkasterlar uchun.",

  keywords: [
    "twinkle",
    "twinkle uz",
    "kontent yaratuvchilar uchun platforma",
    "kreator monetizatsiya platformasi",
    "donat platformasi",
    "creator monetization platform",
    "donation platform for creators",
    "платформа для монетизации контента",
    "донат платформа",
    "Uzbek YouTuber monetizatsiya",
    "streamerlar uchun donat",
    "kreator iqtisodiyoti",
    "video platforma o'zbekiston",
    "Central Asia creator economy",
    "obuna orqali pul ishlash",
    "blogerlik bilan pul topish",
  ],

  authors: [{ name: "Twinkle", url: SITE_URL }],
  creator: "Twinkle",
  publisher: "Twinkle",
  applicationName: "Twinkle",
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },

  alternates: {
    canonical: SITE_URL,
    languages: {
      "uz-UZ": SITE_URL,
      "ru-RU": `${SITE_URL}/ru`,
      "en-US": `${SITE_URL}/en`,
      "x-default": SITE_URL,
    },
  },

  openGraph: {
    type: "website",
    locale: "uz_UZ",
    alternateLocale: ["ru_RU", "en_US"],
    url: SITE_URL,
    siteName: "Twinkle",
    title: "Twinkle — Kontent yaratuvchilar uchun monetizatsiya platformasi",
    description:
      "O'zbekiston va Markaziy Osiyo kontent yaratuvchilari uchun video platforma. Obuna, donat va reklama orqali daromad ishlang.",
    images: [
      {
        url: `${SITE_URL}/og/default-og.png`,
        width: 1200,
        height: 630,
        alt: "Twinkle — Creator Monetization Platform",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Twinkle — Creator Monetization Platform",
    description:
      "O'zbekiston kreatorlari uchun daromad platformasi. Obuna, donat, reklama.",
    images: [`${SITE_URL}/og/default-og.png`],
    creator: "@twinkleuz",
    site: "@twinkleuz",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  verification: {
    // Google Search Console → Settings → Ownership verification → HTML tag
    google: "GOOGLE_VERIFICATION_CODE",
    // Yandex Webmaster → Add site → Meta tag
    yandex: "YANDEX_VERIFICATION_CODE",
    other: {
      // Bing Webmaster Tools → Verify → Meta tag
      "msvalidate.01": "BING_VERIFICATION_CODE",
    },
  },

  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
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


"use client";

import type { Metadata } from "next";
import * as React from "react";
import { MainLayout } from "@/components/main-layout";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/hooks/use-language";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { PT_Sans, Cairo } from 'next/font/google';
import { Onboarding } from "@/components/onboarding";
import { SplashScreen } from "@/components/splash-screen";
import { AnimatePresence, motion } from "framer-motion";

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-pt-sans',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-cairo',
});

function AppContent({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
     <AnimatePresence mode="wait">
      {isLoading ? (
        <SplashScreen key="splash" />
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <MainLayout>{children}</MainLayout>
          <Toaster />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [initialCheck, setInitialCheck] = React.useState(true);
  
  React.useEffect(() => {
    setIsClient(true);
    const hasOnboarded = localStorage.getItem('onboardingComplete');
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
    setInitialCheck(false);
  }, []);

  const handleOnboardingComplete = (name: string, educationLevel: string) => {
    localStorage.setItem('userName', name);
    localStorage.setItem('educationLevel', educationLevel);
    localStorage.setItem('onboardingComplete', 'true');
    setShowOnboarding(false);
  };
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
          <title>عبود</title>
          <meta name="description" content="Your personal academic dashboard." />
      </head>
      <body className={`${ptSans.variable} ${cairo.variable} font-body antialiased bg-background`}>
        <LanguageProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {initialCheck ? (
                null
              ) : showOnboarding ? (
                <Onboarding onComplete={handleOnboardingComplete} />
              ) : (
                <AppContent>{children}</AppContent>
              )}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

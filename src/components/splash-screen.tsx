
"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Icons } from "./icons";
import { useLanguage } from "@/hooks/use-language";

export function SplashScreen() {
    const { t } = useLanguage();
    
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-4">
        <Icons.logo className="h-24 w-24 text-primary" />
        <h1 className="text-5xl font-bold font-headline">{t('app_title')}</h1>
      </div>
      <div className="absolute bottom-16 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t('splash.loading')}</span>
      </div>
    </motion.div>
  );
}

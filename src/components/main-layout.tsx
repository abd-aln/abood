
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Book,
  Calendar,
  Home,
  List,
  Settings,
  Trash2,
  Moon,
  Sun,
  Languages,
  Pen,
  FileText,
  Menu,
  Clock,
  GraduationCap,
  School,
} from "lucide-react";
import { useTheme } from "next-themes";
import { formatDistanceToNow } from "date-fns";
import { ar, fr } from "date-fns/locale";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { Icons } from "./icons";
import { useLanguage } from "@/hooks/use-language";
import { CustomizeProfileForm } from "./customize-profile-form";
import { cn } from "@/lib/utils";
import type { Task, Exam, AppNotification } from "@/lib/types";
import { Badge } from "./ui/badge";


const navItems = [
  { href: "/", icon: Home, label: "nav.dashboard" },
  { href: "/calendar", icon: Calendar, label: "nav.calendar" },
  { href: "/works", icon: List, label: "nav.works" },
  { href: "/subjects", icon: Book, label: "nav.subjects" },
  { href: "/notes", icon: FileText, label: "nav.notes" },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const [name, setName] = React.useState("Student");
  const [educationLevel, setEducationLevel] = React.useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);

  React.useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setName(storedName);
    } else {
      setName("Student");
    }
    
    const storedEducationLevel = localStorage.getItem("educationLevel");
    if (storedEducationLevel) {
      setEducationLevel(storedEducationLevel);
    }

    const checkUpcomingWorks = () => {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const newNotifications: AppNotification[] = [];

      // Check tasks
      const tasks: Task[] = JSON.parse(localStorage.getItem('tasks') || '[]').map((t: any) => ({...t, dueDate: new Date(t.dueDate)}));
      tasks.forEach(task => {
        if (task.dueDate > now && task.dueDate <= in24Hours) {
          newNotifications.push({
            id: `notif-task-${task.id}`,
            title: `مهمة قادمة: ${t(task.title)}`,
            description: `تستحق خلال 24 ساعة.`,
            date: task.dueDate.toISOString(),
            href: '/works',
          });
        }
      });
      
      // Check exams
      const exams: Exam[] = JSON.parse(localStorage.getItem('exams') || '[]').map((e: any) => ({...e, date: new Date(e.date)}));
      exams.forEach(exam => {
        if (exam.date > now && exam.date <= in24Hours) {
           newNotifications.push({
            id: `notif-exam-${exam.id}`,
            title: `امتحان قادم: ${t(exam.topic)}`,
            description: `خلال 24 ساعة.`,
            date: exam.date.toISOString(),
            href: '/works',
          });
        }
      });
      
      setNotifications(newNotifications.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
    
    checkUpcomingWorks();

    const handleStorageChange = () => {
        const storedName = localStorage.getItem("userName");
        if (storedName) {
            setName(storedName);
        }
        const storedEducationLevel = localStorage.getItem("educationLevel");
        if (storedEducationLevel) {
          setEducationLevel(storedEducationLevel);
        }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [t]);

  const handleProfileFormSubmit = (data: { name: string; educationLevel: string }) => {
    setName(data.name);
    setEducationLevel(data.educationLevel);
    localStorage.setItem("userName", data.name);
    localStorage.setItem("educationLevel", data.educationLevel);
    setIsProfileDialogOpen(false);
  };
  
  const handleDeleteAllData = () => {
    localStorage.clear();
    setIsAlertOpen(false);
    window.location.reload();
  }
  
  const ActiveIcon = React.useMemo(() => {
    const activeItem = navItems.find(item => item.href === pathname);
    return activeItem ? activeItem.icon : Icons.logo;
  }, [pathname]);


  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden flex-col gap-1 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 lg:gap-6">
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <ActiveIcon className="h-6 w-6 text-primary" />
            <span className="sr-only">{t('app_title')}</span>
          </Link>
          {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-2 transition-colors hover:text-foreground",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="underline"
                    className="absolute bottom-0 left-0 h-[2px] w-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                {t(item.label)}
              </Link>
            )})
          }
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side={language === 'ar' ? 'right' : 'left'}>
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <ActiveIcon className="h-6 w-6 text-primary" />
                <span className="sr-only">{t('app_title')}</span>
              </Link>
              {navItems.map(item => (
                 <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "transition-colors hover:text-foreground",
                      pathname === item.href ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {t(item.label)}
                  </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-2 md:ml-auto md:gap-4 justify-end">
           <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
             <span>{t('user_menu.welcome')}, {name}</span>
             {educationLevel === 'university' && <GraduationCap className="h-4 w-4" />}
             {educationLevel === 'school' && <School className="h-4 w-4" />}
           </div>
           <Button variant="ghost" size="icon" onClick={() => setIsProfileDialogOpen(true)}>
            <Pen className="h-5 w-5" />
            <span className="sr-only">{t('user_menu.customize')}</span>
          </Button>
          <NotificationMenu notifications={notifications} />
          <SettingsMenu 
            onDeleteRequest={() => setIsAlertOpen(true)}
          />
        </div>
      </header>
       <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>{children}</main>
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{t('user_menu.customize')}</DialogTitle>
                    <DialogDescription>{t('customize_form.description')}</DialogDescription>
                </DialogHeader>
                <CustomizeProfileForm 
                  onSubmit={handleProfileFormSubmit} 
                  currentName={name}
                  currentEducationLevel={educationLevel || ''}
                />
            </DialogContent>
        </Dialog>
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('user_menu.delete_all_confirm_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('user_menu.delete_all_confirm_message')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllData} className="bg-destructive hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

function NotificationMenu({ notifications }: { notifications: AppNotification[] }) {
  const { t, language } = useLanguage();
  const hasNotifications = notifications.length > 0;

  const getTimeAgo = (date: string) => {
    const locale = language === 'ar' ? ar : (language === 'fr' ? fr : undefined);
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
          <span className="sr-only">{t('notifications')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasNotifications ? (
          notifications.map(notification => (
            <DropdownMenuItem key={notification.id} asChild>
              <Link href={notification.href} className="flex flex-col items-start gap-1">
                <p className="font-semibold">{notification.title}</p>
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <p>{notification.description}</p>
                    <p>{getTimeAgo(notification.date)}</p>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        ) : (
          <p className="p-4 text-center text-sm text-muted-foreground">
            لا توجد إشعارات جديدة.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SettingsMenu({ onDeleteRequest }: { onDeleteRequest: () => void}) {
    const { t, setLanguage } = useLanguage();
    const { setTheme } = useTheme();

    const handleLanguageChange = (lang: 'en' | 'ar' | 'fr') => {
        setLanguage(lang);
    };
    
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">{t('user_menu.settings')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel>{t('user_menu.settings')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Languages className="mr-2 h-4 w-4" />
                    <span>{t('user_menu.language')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleLanguageChange('en')}>English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLanguageChange('ar')}>العربية</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLanguageChange('fr')}>Français</DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuSub>
             <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span>{t('user_menu.theme')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>{t('user_menu.light')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>{t('user_menu.dark')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>{t('user_menu.system')}</DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
           <DropdownMenuItem onClick={onDeleteRequest} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
             <span>{t('user_menu.delete_all')}</span>
           </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

    

    

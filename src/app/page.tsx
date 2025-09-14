
"use client";

import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  PlusCircle,
  CalendarPlus,
  ClipboardPlus,
  Trash2,
  Clock,
  Expand,
  Download,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addDays, format, isSameDay, isWithinInterval, getDay, startOfDay } from "date-fns";
import { useLanguage } from "@/hooks/use-language";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TaskForm } from "@/components/task-form";
import { ExamForm } from "@/components/exam-form";
import { HolidayForm } from "@/components/holiday-form";
import { Task, Exam, Holiday, Subject, ClassSession, WorkStatus } from "@/lib/types";
import { ClassSessionForm } from "@/components/class-session-form";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import * as htmlToImage from 'html-to-image';


export default function DashboardPage() {
  const { t } = useLanguage();
  const [isClient, setIsClient] = React.useState(false);
  const [today, setToday] = React.useState(new Date());
  
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);
  const [classSessions, setClassSessions] = React.useState<ClassSession[]>([]);

  const [lectureCounts, setLectureCounts] = React.useState<Record<string, number>>({});
  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [isExamDialogOpen, setIsExamDialogOpen] = React.useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = React.useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = React.useState(false);
  const [isFullScheduleDialogOpen, setIsFullScheduleDialogOpen] = React.useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ sessionId: string; dayIndex: number } | null>(null);

  const longPressTimeoutRef = React.useRef<NodeJS.Timeout>();
  const scheduleTableRef = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    setIsClient(true);
    setToday(new Date());
    
    const savedSubjects = localStorage.getItem('subjects');
    if (savedSubjects) {
      try {
        setSubjects(JSON.parse(savedSubjects));
      } catch (e) {
        setSubjects([]);
      }
    } else {
      setSubjects([]);
    }

    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        setTasks(parsed.map((t: Task) => ({...t, dueDate: new Date(t.dueDate)})));
      } catch(e) {
        setTasks([]);
      }
    } else {
      setTasks([]);
    }

    const savedExams = localStorage.getItem('exams');
    if(savedExams) {
        try {
          const parsed = JSON.parse(savedExams);
          setExams(parsed.map((e: Exam) => ({...e, date: new Date(e.date)})));
        } catch(e) {
          setExams([]);
        }
    } else {
        setExams([]);
    }
    
    const savedHolidays = localStorage.getItem('holidays');
    if(savedHolidays) {
        try {
          const parsed = JSON.parse(savedHolidays);
          setHolidays(parsed.map((h: Holiday) => ({...h, date: new Date(h.date)})));
        } catch (e) {
          setHolidays([]);
        }
    } else {
        setHolidays([]);
    }

    const savedClassSessions = localStorage.getItem('classSessions');
    if(savedClassSessions) {
      try {
        setClassSessions(JSON.parse(savedClassSessions));
      } catch(e) {
        setClassSessions([]);
      }
    } else {
      setClassSessions([]);
    }

  }, []);
  
  React.useEffect(() => {
    if (isClient) localStorage.setItem('subjects', JSON.stringify(subjects));
  }, [subjects, isClient]);

  React.useEffect(() => {
    if (isClient) localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks, isClient]);

  React.useEffect(() => {
    if (isClient) localStorage.setItem('exams', JSON.stringify(exams));
  }, [exams, isClient]);

  React.useEffect(() => {
    if (isClient) localStorage.setItem('holidays', JSON.stringify(holidays));
  }, [holidays, isClient]);

  React.useEffect(() => {
    if (isClient) localStorage.setItem('classSessions', JSON.stringify(classSessions));
  }, [classSessions, isClient]);

  React.useEffect(() => {
      const counts: Record<string, number> = {};
      subjects.forEach(subject => {
          counts[subject.id] = classSessions.filter(cs => cs.subjectId === subject.id).reduce((acc, cs) => acc + cs.days.length, 0);
      });
      setLectureCounts(counts);
  }, [subjects, classSessions]);


  const handleTaskFormSubmit = (data: Task) => {
    setTasks(prev => [...prev, { ...data, id: `task-${Date.now()}` }]);
    setIsTaskDialogOpen(false);
  };
  
  const handleExamFormSubmit = (data: Exam) => {
    setExams(prev => [...prev, { ...data, id: `exam-${Date.now()}` }]);
    setIsExamDialogOpen(false);
  };

  const handleHolidayFormSubmit = (data: Omit<Holiday, 'id'>) => {
    setHolidays(prev => [...prev, { ...data, id: `holiday-${Date.now()}`, status: 'pending' }]);
    setIsHolidayDialogOpen(false);
  };

  const handleClassSessionFormSubmit = (data: Omit<ClassSession, 'id'>) => {
    setClassSessions(prev => [...prev, { ...data, id: `cs-${Date.now()}` }]);
    setIsScheduleDialogOpen(false);
  };
  
  const handleDeleteClassSession = () => {
    if (!deleteTarget) return;
    const { sessionId, dayIndex } = deleteTarget;

    setClassSessions(prev => {
        const session = prev.find(cs => cs.id === sessionId);
        if (!session) return prev;

        if (session.days.length === 1 && session.days[0] === dayIndex) {
            return prev.filter(cs => cs.id !== sessionId);
        }

        return prev.map(cs => {
            if (cs.id === sessionId) {
                return { ...cs, days: cs.days.filter(d => d !== dayIndex) };
            }
            return cs;
        });
    });

    setIsDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };
  
  const handleMouseDown = (sessionId: string, dayIndex: number) => {
    longPressTimeoutRef.current = setTimeout(() => {
      setDeleteTarget({ sessionId, dayIndex });
      setIsDeleteConfirmOpen(true);
    }, 500); 
  };

  const handleMouseUpOrLeave = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  const handleDownloadSchedule = () => {
    if (scheduleTableRef.current === null) {
      return;
    }

    htmlToImage.toPng(scheduleTableRef.current, { cacheBust: true, backgroundColor: '#ffffff' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'my-schedule.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.log(err);
      });
  };


  const nextWeek = addDays(today, 7);
  const startOfToday = startOfDay(today);

    const todaysSubjects = React.useMemo(() => {
        const dayIndex = getDay(today);
        return classSessions
            .filter(cs => cs.days.includes(dayIndex))
            .map(cs => {
                const subject = subjects.find(s => s.id === cs.subjectId);
                return { ...cs, subject };
            })
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [classSessions, subjects, today]);

  const upcomingTasks = tasks.filter((task) =>
    isWithinInterval(task.dueDate, { start: startOfToday, end: nextWeek })
  );
  const upcomingExams = exams.filter((exam) =>
    isWithinInterval(exam.date, { start: startOfToday, end: nextWeek })
  );
  const upcomingHolidays = holidays.filter((holiday) =>
    isWithinInterval(holiday.date, { start: startOfToday, end: nextWeek })
  );

  const allWeekDays = [
    t('schedule.sunday'),
    t('schedule.monday'),
    t('schedule.tuesday'),
    t('schedule.wednesday'),
    t('schedule.thursday'),
    t('schedule.friday'),
    t('schedule.saturday')
  ];

  const scheduleDays = React.useMemo(() => {
    const activeDays = new Set<number>();
    classSessions.forEach(session => {
        session.days.forEach(day => activeDays.add(day));
    });
    const sortedActiveDays = Array.from(activeDays).sort((a,b) => a - b);
    return sortedActiveDays.map(dayIndex => ({
      index: dayIndex,
      name: allWeekDays[dayIndex]
    }));
  }, [classSessions, t]);

  const scheduleTimes = Array.from(new Set(classSessions.map(cs => cs.time))).sort();

  const getStatusClass = (status: WorkStatus) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-500 line-through';
      case 'absent': return 'text-red-600 dark:text-red-500 line-through';
      case 'postponed': return 'text-orange-600 dark:text-orange-500';
      default: return '';
    }
  }

  const renderScheduleTable = (ref?: React.Ref<HTMLDivElement>) => (
    <div className="border rounded-lg overflow-x-auto" ref={ref}>
      <Table className="min-w-full w-max">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[100px] text-center font-semibold border-l">{t('schedule.time')}</TableHead>
            {scheduleDays.map(day => <TableHead key={day.index} className="text-center font-semibold border-l last:border-l-0 min-w-[120px]">{day.name}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {scheduleTimes.map(time => (
            <TableRow key={time} className="border-t">
              <TableCell className="font-mono text-center border-l">{time}</TableCell>
              {scheduleDays.map(day => {
                const session = classSessions.find(cs => cs.time === time && cs.days.includes(day.index));
                const subject = session ? subjects.find(s => s.id === session.subjectId) : null;
                return (
                  <TableCell 
                    key={day.index} 
                    className="p-2 text-center h-20 border-l last:border-l-0 group relative cursor-pointer"
                    onMouseDown={() => session && handleMouseDown(session.id, day.index)}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    onTouchStart={() => session && handleMouseDown(session.id, day.index)}
                    onTouchEnd={handleMouseUpOrLeave}
                  >
                    {session && subject && (
                      <div className="flex flex-col items-center justify-center text-sm p-2 rounded-md h-full" style={{backgroundColor: `${subject.color}20`}}>
                        <div className="flex items-center gap-2 font-semibold" style={{color: subject.color}}>
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }}></span>
                          <span>{t(subject.name)}</span>
                        </div>
                         {session.location && <span className="text-xs text-muted-foreground mt-1">{session.location}</span>}
                         {session.duration && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{session.duration} {t('minutes')}</span>
                          </div>
                         )}
                      </div>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );


  if (!isClient) {
      return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.today_schedule.title')}
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {todaysSubjects.length > 0 ? (
              <ul className="space-y-2">
                {todaysSubjects.map((session) => (
                  <li key={session.id} className="flex items-center gap-4">
                    <span className="font-mono text-sm text-muted-foreground">
                      {session.time}
                    </span>
                    {session.subject && (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: session.subject.color }}
                        ></span>
                        <p className="font-medium">{t(session.subject.name)}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.today_schedule.no_classes')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.upcoming_tasks.title')}
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter((t) => !t.completed).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.upcoming_tasks.tasks_remaining')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.upcoming_exams.title')}
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                exams.filter((e) => isWithinInterval(e.date, { start: startOfToday, end: nextWeek }))
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.upcoming_exams.exams_this_week')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('important_events.title')}
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsHolidayDialogOpen(true)}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {holidays.length > 0 ? (
              <ul className="space-y-2">
                {holidays.slice(0, 2).map((holiday) => (
                  <li key={holiday.id} className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{t(holiday.name)}:</span>
                    <span className="text-muted-foreground">{format(holiday.date, "MMM d")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t('important_events.no_events')}</p>
            )}
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('schedule.title')}</CardTitle>
                <CardDescription>{t('schedule.description')}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 <Button onClick={() => setIsFullScheduleDialogOpen(true)} size="icon" variant="outline">
                    <Expand className="h-4 w-4" />
                 </Button>
                 <Button onClick={() => setIsScheduleDialogOpen(true)} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('schedule.add_session')}
                 </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {classSessions.length > 0 ? (
              renderScheduleTable()
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>{t('schedule.no_sessions')}</p>
                <Button variant="link" onClick={() => setIsScheduleDialogOpen(true)}>{t('schedule.add_session_now')}</Button>
              </div>
            )}
          </CardContent>
        </Card>


      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.weekly_overview.title')}</CardTitle>
              <CardDescription>
                {t('dashboard.weekly_overview.description')}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('add_new')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsTaskDialogOpen(true)}>
                  <ClipboardPlus className="mr-2 h-4 w-4" />
                  <span>{t('add_task')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsExamDialogOpen(true)}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  <span>{t('add_exam')}</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => setIsHolidayDialogOpen(true)}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  <span>{t('add_event')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tasks">{t('dashboard.weekly_overview.tasks')}</TabsTrigger>
                <TabsTrigger value="exams">{t('dashboard.weekly_overview.exams')}</TabsTrigger>
                <TabsTrigger value="holidays">{t('dashboard.weekly_overview.holidays')}</TabsTrigger>
              </TabsList>
              <TabsContent value="tasks">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.weekly_overview.task_header')}</TableHead>
                      <TableHead>{t('dashboard.weekly_overview.subject_header')}</TableHead>
                      <TableHead className="text-right">{t('dashboard.weekly_overview.due_date_header')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingTasks.length > 0 ? (
                      upcomingTasks.map((task) => (
                        <TableRow key={task.id} className={cn(getStatusClass(task.status))}>
                          <TableCell className="font-medium">
                            {t(task.title)}
                          </TableCell>
                          <TableCell>
                            {
                              t(subjects.find((s) => s.id === task.subjectId)
                                ?.name || '')
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {isSameDay(task.dueDate, today)
                              ? t('today')
                              : format(task.dueDate, "eee, MMM d")}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-muted-foreground"
                        >
                          {t('dashboard.weekly_overview.no_tasks')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="exams">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.weekly_overview.topic_header')}</TableHead>
                      <TableHead>{t('dashboard.weekly_overview.subject_header')}</TableHead>
                      <TableHead className="text-right">{t('dashboard.weekly_overview.date_header')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingExams.length > 0 ? (
                      upcomingExams.map((exam) => (
                        <TableRow key={exam.id} className={cn(getStatusClass(exam.status))}>
                          <TableCell className="font-medium">
                            {t(exam.topic)}
                          </TableCell>
                          <TableCell>
                            {
                               t(subjects.find((s) => s.id === exam.subjectId)
                                ?.name || '')
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                                <span>
                                {isSameDay(exam.date, today)
                                ? t('today')
                                : format(exam.date, "eee, MMM d")}
                                </span>
                                {exam.time && <span className="text-xs text-muted-foreground">{exam.time}</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-muted-foreground"
                        >
                          {t('dashboard.weekly_overview.no_exams')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="holidays">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.weekly_overview.event_header')}</TableHead>
                      <TableHead className="text-right">{t('dashboard.weekly_overview.date_header')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingHolidays.length > 0 ? (
                      upcomingHolidays.map((holiday) => (
                        <TableRow key={holiday.id} className={cn(getStatusClass(holiday.status))}>
                          <TableCell className="font-medium">
                            {t(holiday.name)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                                <span>
                                {isSameDay(holiday.date, today)
                                ? t('today')
                                : format(holiday.date, "eee, MMM d")}
                                </span>
                                {holiday.time && <span className="text-xs text-muted-foreground">{holiday.time}</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground"
                        >
                          {t('dashboard.weekly_overview.no_holidays')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>{t('dashboard.my_subjects.title')}</CardTitle>
              <CardDescription>
                {t('dashboard.my_subjects.description')}
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/subjects">
                {t('view_all')}
                <BookOpen className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  ></span>
                  <div className="flex flex-col">
                    <span className="font-medium">{t(subject.name)}</span>
                    <span className="text-sm text-muted-foreground">
                      {t(subject.teacher)}
                    </span>
                  </div>
                </div>
                <Badge variant="outline">
                  {lectureCounts[subject.id] || 0} {t('lectures')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('add_task')}</DialogTitle>
            <DialogDescription>{t('add_task_description')}</DialogDescription>
          </DialogHeader>
          <TaskForm onSubmit={handleTaskFormSubmit} subjects={subjects} />
        </DialogContent>
      </Dialog>
      <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('add_exam')}</DialogTitle>
            <DialogDescription>{t('add_exam_description')}</DialogDescription>
          </DialogHeader>
          <ExamForm onSubmit={handleExamFormSubmit} subjects={subjects} />
        </DialogContent>
      </Dialog>
      <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('add_event')}</DialogTitle>
            <DialogDescription>{t('add_event_description')}</DialogDescription>
          </DialogHeader>
          <HolidayForm onSubmit={handleHolidayFormSubmit} />
        </DialogContent>
      </Dialog>
       <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('schedule.dialog_title')}</DialogTitle>
            <DialogDescription>{t('schedule.dialog_description')}</DialogDescription>
          </DialogHeader>
          <ClassSessionForm onSubmit={handleClassSessionFormSubmit} subjects={subjects} />
        </DialogContent>
      </Dialog>
       <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('user_menu.delete_all_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد أنك تريد حذف هذه الحصة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClassSession} className="bg-destructive hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isFullScheduleDialogOpen} onOpenChange={setIsFullScheduleDialogOpen}>
        <DialogContent className="max-w-4xl" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="flex-row items-center justify-between">
            <div>
              <DialogTitle>{t('schedule.title')}</DialogTitle>
              <DialogDescription>{t('schedule.description')}</DialogDescription>
            </div>
            <Button onClick={handleDownloadSchedule} size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t('download_schedule')}
            </Button>
          </DialogHeader>
          {classSessions.length > 0 ? (
            <div className="mt-4">{renderScheduleTable(scheduleTableRef)}</div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>{t('schedule.no_sessions')}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

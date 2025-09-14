
"use client"

import { useLanguage } from "@/hooks/use-language";
import { Exam, Holiday, Subject, Task, WorkStatus } from "@/lib/types";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TaskForm } from "@/components/task-form";
import { ExamForm } from "@/components/exam-form";
import { HolidayForm } from "@/components/holiday-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format, isSameDay } from "date-fns";
import { PlusCircle, ClipboardPlus, CalendarPlus, MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";


export default function WorksPage() {
  const { t } = useLanguage();
  const [isClient, setIsClient] = React.useState(false);
  const [today, setToday] = React.useState(new Date());

  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);
  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [isExamDialogOpen, setIsExamDialogOpen] = React.useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = React.useState(false);
  
  const [isPostponeDialogOpen, setIsPostponeDialogOpen] = React.useState(false);
  const [postponeTarget, setPostponeTarget] = React.useState<{type: 'task' | 'exam' | 'holiday', id: string} | null>(null);
  const [newDate, setNewDate] = React.useState<Date | undefined>(new Date());
  
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
        } catch(e) {
            setHolidays([]);
        }
    } else {
        setHolidays([]);
    }
  }, []);

  React.useEffect(() => {
    if (isClient) localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks, isClient]);

  React.useEffect(() => {
    if (isClient) localStorage.setItem('exams', JSON.stringify(exams));
  }, [exams, isClient]);

  React.useEffect(() => {
    if (isClient) localStorage.setItem('holidays', JSON.stringify(holidays));
  }, [holidays, isClient]);

  const handleTaskFormSubmit = (data: Omit<Task, 'id' | 'completed' | 'status'>) => {
    setTasks(prev => [...prev, { ...data, id: `task-${Date.now()}`, completed: false, status: 'pending' }]);
    setIsTaskDialogOpen(false);
  };
  
  const handleExamFormSubmit = (data: Omit<Exam, 'id' | 'status'>) => {
    setExams(prev => [...prev, { ...data, id: `exam-${Date.now()}`, status: 'pending' }]);
    setIsExamDialogOpen(false);
  };

  const handleHolidayFormSubmit = (data: Omit<Holiday, 'id' | 'status'>) => {
    setHolidays(prev => [...prev, { ...data, id: `holiday-${Date.now()}`, status: 'pending' }]);
    setIsHolidayDialogOpen(false);
  };
  
  const sortedTasks = React.useMemo(() => [...tasks].sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime()), [tasks]);
  const sortedExams = React.useMemo(() => [...exams].sort((a,b) => a.date.getTime() - b.date.getTime()), [exams]);
  const sortedHolidays = React.useMemo(() => [...holidays].sort((a,b) => a.date.getTime() - b.date.getTime()), [holidays]);

  const updateStatus = (type: 'task' | 'exam' | 'holiday', id: string, status: WorkStatus) => {
    if (type === 'task') {
      setTasks(tasks.map(item => item.id === id ? { ...item, status, completed: status === 'completed' } : item));
    } else if (type === 'exam') {
      setExams(exams.map(item => item.id === id ? { ...item, status } : item));
    } else if (type === 'holiday') {
      setHolidays(holidays.map(item => item.id === id ? { ...item, status } : item));
    }
  };

  const handleDelete = (type: 'task' | 'exam' | 'holiday', id: string) => {
    if (type === 'task') {
      setTasks(tasks.filter(item => item.id !== id));
    } else if (type === 'exam') {
      setExams(exams.filter(item => item.id !== id));
    } else if (type === 'holiday') {
      setHolidays(holidays.filter(item => item.id !== id));
    }
  };

  const openPostponeDialog = (type: 'task' | 'exam' | 'holiday', id: string) => {
    setPostponeTarget({ type, id });
    setNewDate(new Date());
    setIsPostponeDialogOpen(true);
  };

  const handlePostponeSubmit = () => {
    if (postponeTarget && newDate) {
      if (postponeTarget.type === 'task') {
        setTasks(tasks.map(item => item.id === postponeTarget.id ? { ...item, status: 'postponed', dueDate: newDate } : item));
      } else if (postponeTarget.type === 'exam') {
        setExams(exams.map(item => item.id === postponeTarget.id ? { ...item, status: 'postponed', date: newDate } : item));
      } else if (postponeTarget.type === 'holiday') {
        setHolidays(holidays.map(item => item.id === postponeTarget.id ? { ...item, status: 'postponed', date: newDate } : item));
      }
      setIsPostponeDialogOpen(false);
      setPostponeTarget(null);
    }
  };

  const getStatusClass = (status: WorkStatus) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-500 line-through';
      case 'absent': return 'text-red-600 dark:text-red-500 line-through';
      case 'postponed': return 'text-orange-600 dark:text-orange-500';
      default: return '';
    }
  }

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">{t('nav.works')}</h1>
            <p className="text-muted-foreground">
              {t('works_page.description')}
            </p>
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
        </div>

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
                    <TableHead>{t('dashboard.weekly_overview.due_date_header')}</TableHead>
                    <TableHead className="text-right"></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {sortedTasks.length > 0 ? (
                    sortedTasks.map((task) => (
                    <TableRow key={task.id} className={cn(getStatusClass(task.status), task.status !== 'pending' && 'font-semibold')}>
                        <TableCell className="font-medium">
                        {t(task.title)}
                        </TableCell>
                        <TableCell>
                        {
                            t(subjects.find((s) => s.id === task.subjectId)
                            ?.name || '')
                        }
                        </TableCell>
                        <TableCell>
                        {isSameDay(task.dueDate, today)
                            ? t('today')
                            : format(task.dueDate, "eee, MMM d")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => updateStatus('task', task.id, 'completed')}>تم</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPostponeDialog('task', task.id)}>تأجيل</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus('task', task.id, 'absent')}>غياب</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete('task', task.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{t('delete')}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell
                        colSpan={4}
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
                    <TableHead>{t('dashboard.weekly_overview.date_header')}</TableHead>
                    <TableHead className="text-right"></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {sortedExams.length > 0 ? (
                    sortedExams.map((exam) => (
                     <TableRow key={exam.id} className={cn(getStatusClass(exam.status), exam.status !== 'pending' && 'font-semibold')}>
                        <TableCell className="font-medium">
                        {t(exam.topic)}
                        </TableCell>
                        <TableCell>
                        {
                            t(subjects.find((s) => s.id === exam.subjectId)
                            ?.name || '')
                        }
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>
                              {isSameDay(exam.date, today)
                                  ? t('today')
                                  : format(exam.date, "eee, MMM d")}
                            </span>
                            {exam.time && <span className="text-xs text-muted-foreground">{exam.time}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                               <DropdownMenuItem onClick={() => updateStatus('exam', exam.id, 'completed')}>تم</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPostponeDialog('exam', exam.id)}>تأجيل</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus('exam', exam.id, 'absent')}>غياب</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete('exam', exam.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{t('delete')}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell
                        colSpan={4}
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
                    <TableHead>{t('dashboard.weekly_overview.date_header')}</TableHead>
                    <TableHead className="text-right"></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {sortedHolidays.length > 0 ? (
                    sortedHolidays.map((holiday) => (
                      <TableRow key={holiday.id} className={cn(getStatusClass(holiday.status), holiday.status !== 'pending' && 'font-semibold')}>
                        <TableCell className="font-medium">
                        {t(holiday.name)}
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col">
                            <span>
                              {isSameDay(holiday.date, today)
                                  ? t('today')
                                  : format(holiday.date, "eee, MMM d")}
                            </span>
                            {holiday.time && <span className="text-xs text-muted-foreground">{holiday.time}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => updateStatus('holiday', holiday.id, 'completed')}>تم</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPostponeDialog('holiday', holiday.id)}>تأجيل</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus('holiday', holiday.id, 'absent')}>غياب</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete('holiday', holiday.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{t('delete')}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell
                        colSpan={3}
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
       <Dialog open={isPostponeDialogOpen} onOpenChange={setIsPostponeDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>تأجيل</DialogTitle>
            <DialogDescription>اختر التاريخ الجديد.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={newDate}
              onSelect={setNewDate}
              initialFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostponeDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handlePostponeSubmit}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

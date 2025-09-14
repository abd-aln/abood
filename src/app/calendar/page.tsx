
"use client"

import { useLanguage } from "@/hooks/use-language";
import { CalendarEvent, Exam, Holiday, Subject, Task } from "@/lib/types";
import React from "react";
import { CalendarView } from "@/components/calendar-view";


export default function CalendarPage() {
  const { t } = useLanguage();
  const [isClient, setIsClient] = React.useState(false);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);

  React.useEffect(() => {
    setIsClient(true);
    
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
        } catch (e) {
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
        } catch (e) {
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
  }, []);

  const allEvents = React.useMemo(() => {
    const mappedTasks = tasks.map((task) => ({
      ...task,
      date: task.dueDate,
      title: t(task.title),
      type: "task" as const,
      subject: {
        ...subjects.find((s) => s.id === task.subjectId)!,
        name: t(subjects.find((s) => s.id === task.subjectId)?.name || ''),
      }
    }));
    const mappedExams = exams.map((exam) => ({
      ...exam,
      topic: t(exam.topic),
      type: "exam" as const,
      subject: {
        ...subjects.find((s) => s.id === exam.subjectId)!,
        name: t(subjects.find((s) => s.id === exam.subjectId)?.name || ''),
      }
    }));
    const mappedHolidays = holidays.map((holiday) => ({ ...holiday, name: t(holiday.name), type: "holiday" as const }));

    const combined: CalendarEvent[] = [...mappedTasks, ...mappedExams, ...mappedHolidays];
    return combined.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [t, tasks, exams, holidays, subjects]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-10rem)]">
       <div>
          <h1 className="font-headline text-2xl font-bold">{t('nav.calendar')}</h1>
          <p className="text-muted-foreground">
            {t('calendar_page.description')}
          </p>
        </div>
      <div className="flex-grow">
        <CalendarView events={allEvents} />
      </div>
    </div>
  );
}

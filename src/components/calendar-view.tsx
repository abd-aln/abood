
"use client";

import * as React from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useLanguage } from "@/hooks/use-language";

interface CalendarViewProps {
  events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const { t } = useLanguage();
  const [currentMonthStr, setCurrentMonthStr] = React.useState(
    format(new Date(), "MMMM yyyy")
  );
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const months = React.useMemo(() => {
    const start = subMonths(new Date(), 6);
    const end = addMonths(new Date(), 6);
    return Array.from({ length: 13 }, (_, i) => addMonths(start, i));
  }, []);

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
    setCurrentMonthStr(format(date, "MMMM yyyy"));
  };

  const handleSelect = React.useCallback(
    (api: CarouselApi) => {
      if (!api) return;
      const newMonth = months[api.selectedScrollSnap()];
      handleMonthChange(newMonth);
    },
    [months]
  );

  React.useEffect(() => {
    if (!api) return;
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api, handleSelect]);

  const slideToMonth = (month: Date) => {
    const index = months.findIndex((m) => isSameMonth(m, month));
    if (api && index !== -1) {
      api.scrollTo(index);
    }
  };

  const nextMonth = () => {
    slideToMonth(addMonths(currentDate, 1));
  };

  const prevMonth = () => {
    slideToMonth(subMonths(currentDate, 1));
  };
  
  if (!hydrated) {
    return null;
  }

  const weekDays = [
    t('schedule.sunday'),
    t('schedule.monday'),
    t('schedule.tuesday'),
    t('schedule.wednesday'),
    t('schedule.thursday'),
    t('schedule.friday'),
    t('schedule.saturday')
  ]

  return (
    <div className="flex h-full flex-col bg-card border rounded-lg shadow-sm">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-headline text-lg font-semibold">{currentMonthStr}</h2>
        <div className="flex items-center gap-2">
           <Button variant="ghost" onClick={() => slideToMonth(new Date())}>{t('today')}</Button>
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground border-b">
        {weekDays.map((day) => (
          <div key={day} className="py-2 border-l first:border-l-0">{day}</div>
        ))}
      </div>

      <Carousel
        setApi={setApi}
        opts={{
          startIndex: 6,
          align: "start",
        }}
        className="flex-1"
      >
        <CarouselContent>
          {months.map((month) => (
            <CarouselItem key={format(month, "yyyy-MM")}>
              <CalendarGrid month={month} events={events} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

function CalendarGrid({ month, events }: { month: Date; events: CalendarEvent[] }) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="grid h-full grid-cols-7 grid-rows-6">
      {days.map((day, index) => (
        <DayCell 
          key={day.toString()} 
          day={day} 
          monthStart={monthStart} 
          events={events}
          isLastInRow={(index + 1) % 7 === 0}
        />
      ))}
    </div>
  );
}

function DayCell({ day, monthStart, events, isLastInRow }: { day: Date; monthStart: Date; events: CalendarEvent[]; isLastInRow: boolean }) {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const eventsOnDay = events.filter((event) => isSameDay(event.date, day));

  return (
    <div className={cn(
      "relative flex flex-col border-t p-1.5",
      isLastInRow ? "" : "border-r"
    )}>
      <time
        dateTime={format(day, "yyyy-MM-dd")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
          !isSameMonth(day, monthStart) && "text-muted-foreground/50",
          isClient && isToday(day) && "bg-primary text-primary-foreground",
        )}
      >
        {format(day, "d")}
      </time>
      <div className="mt-1 flex flex-col gap-1 overflow-y-auto">
        {eventsOnDay.slice(0, 3).map((event) => (
          <EventBadge key={event.id} event={event} />
        ))}
        {eventsOnDay.length > 3 && (
            <div className="text-xs text-muted-foreground px-1.5">
                + {eventsOnDay.length - 3} more
            </div>
        )}
      </div>
    </div>
  );
}

function EventBadge({ event }: { event: CalendarEvent }) {
    const getEventStyle = () => {
        let colorClass = '';
        let title = '';
        let time: string | undefined = undefined;

        if (event.type === 'task') {
            colorClass = `bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-800/60`;
            title = event.title;
        } else if (event.type === 'exam') {
            colorClass = `bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800/60`;
            title = event.topic;
            time = event.time;
        } else if (event.type === 'holiday') {
            colorClass = `bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800/60`;
            title = event.name;
            time = event.time;
        }
        return { colorClass, title, time };
    }
    const { colorClass, title, time } = getEventStyle();

  return (
    <div className={cn('truncate rounded-md border px-1.5 py-0.5 text-xs font-medium flex justify-between items-center', colorClass)}>
      <span className="truncate">{title}</span>
      {time && <span className="text-xs font-mono ml-1">{time}</span>}
    </div>
  );
}


"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { Holiday } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";

const holidaySchema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters."),
  date: z.date({ required_error: "A date is required." }),
  time: z.string().optional(),
});

interface HolidayFormProps {
  onSubmit: (data: Omit<Holiday, 'id' | 'status'>) => void;
}

export function HolidayForm({ onSubmit }: HolidayFormProps) {
  const { t } = useLanguage();
  const form = useForm<z.infer<typeof holidaySchema>>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      name: "",
      time: "",
    },
  });

  function handleFormSubmit(values: z.infer<typeof holidaySchema>) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('holiday_form.name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('holiday_form.name_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('holiday_form.date_label')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{t('pick_a_date')}</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('exam_form.time_label')} <span className="text-muted-foreground">{t('optional')}</span></FormLabel>
                <div className="relative">
                  <FormControl>
                     <Input
                      type="time"
                      className="pl-9 [&:not(:focus)::-webkit-calendar-picker-indicator]:opacity-0"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full">
          {t('create_event')}
        </Button>
      </form>
    </Form>
  );
}

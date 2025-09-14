
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Subject, ClassSession } from "@/lib/types";
import { useLanguage } from "@/hooks/use-language";

const classSessionSchema = z.object({
  subjectId: z.string({ required_error: "Please select a subject." }),
  days: z.array(z.number()).refine((value) => value.some((item) => item !== undefined), {
    message: "You have to select at least one day.",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time in HH:mm format."),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute.").optional(),
  location: z.string().optional(),
});


interface ClassSessionFormProps {
  onSubmit: (data: Omit<ClassSession, 'id'>) => void;
  subjects: Subject[];
}

export function ClassSessionForm({ onSubmit, subjects }: ClassSessionFormProps) {
  const { t } = useLanguage();
  
  const daysOfWeek = [
    { id: 0, label: t('schedule.sunday') },
    { id: 1, label: t('schedule.monday') },
    { id: 2, label: t('schedule.tuesday') },
    { id: 3, label: t('schedule.wednesday') },
    { id: 4, label: t('schedule.thursday') },
    { id: 5, label: t('schedule.friday') },
    { id: 6, label: t('schedule.saturday') },
  ];

  const form = useForm<z.infer<typeof classSessionSchema>>({
    resolver: zodResolver(classSessionSchema),
    defaultValues: {
      days: [],
      time: "",
      duration: undefined,
      location: "",
    },
  });

  function handleFormSubmit(values: z.infer<typeof classSessionSchema>) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="subjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('schedule.form_subject')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('schedule.form_select_subject')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {t(subject.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="days"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">{t('schedule.form_lecture_days')}</FormLabel>
                <FormDescription>
                  {t('schedule.form_lecture_days_desc')}
                </FormDescription>
              </div>
              <div className="flex flex-wrap gap-4">
                {daysOfWeek.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="days"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('schedule.form_lecture_time')}</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('schedule.form_lecture_duration')} <span className="text-muted-foreground">{t('optional')}</span></FormLabel>
                <FormControl>
                    <Input type="number" placeholder="60" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

         <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subject_form.location_label')} <span className="text-muted-foreground">{t('optional')}</span></FormLabel>
              <FormControl>
                <Input placeholder={t('subject_form.location_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button type="submit" className="w-full">
          {t('schedule.add_session')}
        </Button>
      </form>
    </Form>
  );
}

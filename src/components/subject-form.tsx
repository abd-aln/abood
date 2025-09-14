
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Subject } from "@/lib/types";
import { Circle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useLanguage } from "@/hooks/use-language";

const subjectSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters."),
  teacher: z.string().min(2, "Teacher name must be at least 2 characters."),
  color: z.string().min(1, "Please select a color."),
});

const colorOptions = [
  "#8E44AD", "#27AE60", "#E67E22", "#3498DB", 
  "#F1C40F", "#E74C3C", "#1ABC9C", "#9B59B6"
];

interface SubjectFormProps {
  onSubmit: (data: Subject) => void;
  subject?: Subject | null;
}

export function SubjectForm({ onSubmit, subject }: SubjectFormProps) {
  const { t } = useLanguage();
  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: subject?.name || "",
      teacher: subject?.teacher || "",
      color: subject?.color || colorOptions[0],
    },
  });

  function handleFormSubmit(values: z.infer<typeof subjectSchema>) {
    onSubmit({
      id: subject?.id || "",
      ...values,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subject_form.name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('subject_form.name_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teacher"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subject_form.teacher_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('subject_form.teacher_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{t('subject_form.color_label')}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-2"
                >
                  {colorOptions.map((color) => (
                    <FormItem key={color} className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={color} id={color} className="peer sr-only" />
                      </FormControl>
                      <FormLabel htmlFor={color} className="cursor-pointer rounded-full p-0.5 border-2 border-transparent peer-data-[state=checked]:border-primary">
                        <Circle className="h-6 w-6" fill={color} style={{color: color}} />
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {subject ? t('save_changes') : t('create_subject')}
        </Button>
      </form>
    </Form>
  );
}

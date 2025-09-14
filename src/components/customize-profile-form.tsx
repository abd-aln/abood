
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
import { useLanguage } from "@/hooks/use-language";
import { useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { GraduationCap, School } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  educationLevel: z.enum(["university", "school"], {
    required_error: "Please select an education level.",
  }),
});

interface CustomizeProfileFormProps {
  onSubmit: (data: z.infer<typeof profileSchema>) => void;
  currentName: string;
  currentEducationLevel: string;
}

export function CustomizeProfileForm({ onSubmit, currentName, currentEducationLevel }: CustomizeProfileFormProps) {
  const { t } = useLanguage();
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentName || "",
      educationLevel: (currentEducationLevel as "university" | "school") || undefined,
    },
  });

  useEffect(() => {
    form.reset({ name: currentName, educationLevel: (currentEducationLevel as "university" | "school") });
  }, [currentName, currentEducationLevel, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('customize_form.name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('customize_form.name_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="educationLevel"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{t('onboarding.education_level')}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-4"
                >
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="university" id="university" className="peer sr-only" />
                    </FormControl>
                    <FormLabel htmlFor="university" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        <GraduationCap className="mb-2 h-6 w-6" />
                        {t('onboarding.university_student')}
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="school" id="school" className="peer sr-only" />
                    </FormControl>
                    <FormLabel htmlFor="school" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        <School className="mb-2 h-6 w-6" />
                        {t('onboarding.school_student')}
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {t('save_changes')}
        </Button>
      </form>
    </Form>
  );
}

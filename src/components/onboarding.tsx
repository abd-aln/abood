
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { GraduationCap, School } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input }from "@/components/ui/input";
import { useLanguage } from "@/hooks/use-language";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Icons } from "./icons";


const onboardingSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن يكون حرفين على الأقل." }),
  educationLevel: z.enum(["university", "school"], {
    required_error: "الرجاء اختيار المرحلة الدراسية.",
  }),
});

interface OnboardingProps {
  onComplete: (name: string, educationLevel: string) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useLanguage();
  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
    },
  });

  function handleFormSubmit(values: z.infer<typeof onboardingSchema>) {
    onComplete(values.name, values.educationLevel);
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
        <motion.div 
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex flex-col items-center justify-center text-center mb-8">
                <Icons.logo className="h-16 w-16 text-primary mb-4" />
                <h1 className="text-4xl font-bold font-headline">{t('app_title')}</h1>
                <p className="text-muted-foreground mt-2">{t('onboarding.welcome_message')}</p>
            </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('customize_form.name_label')}</FormLabel>
                    <FormControl>
                    <Input placeholder={t('customize_form.name_placeholder')} {...field} className="text-center" />
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
                {t('onboarding.start_button')}
            </Button>
            </form>
        </Form>
      </motion.div>
    </div>
  );
}

    
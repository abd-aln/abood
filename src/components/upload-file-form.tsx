
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
import { useState } from "react";

const uploadFileSchema = z.object({
  name: z.string().min(2, "File name must be at least 2 characters."),
  file: z.any().refine((files) => files?.length === 1, "File is required."),
});

interface UploadFileFormProps {
  onSubmit: (data: { name: string; url: string }) => void;
}

export function UploadFileForm({ onSubmit }: UploadFileFormProps) {
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const form = useForm<z.infer<typeof uploadFileSchema>>({
    resolver: zodResolver(uploadFileSchema),
    defaultValues: {
      name: "",
    },
  });

  const fileRef = form.register("file");

  function handleFormSubmit(values: z.infer<typeof uploadFileSchema>) {
    const file = values.file[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        onSubmit({ name: values.name, url });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('upload_file_form.name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('upload_file_form.name_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('upload_file_form.file_label')}</FormLabel>
              <FormControl>
                <Input type="file" accept="application/pdf" {...fileRef} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading ? "Uploading..." : t('upload_file_form.upload_button')}
        </Button>
      </form>
    </Form>
  );
}

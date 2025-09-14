
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { MoreVertical, PlusCircle, Upload, Link as LinkIcon, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Subject, NoteContent } from "@/lib/types";
import { SubjectForm } from "@/components/subject-form";
import { UploadFileForm } from "@/components/upload-file-form";
import { useLanguage } from "@/hooks/use-language";

const PdfAnnotator = dynamic(() => import('@/components/pdf-annotator').then(mod => mod.PdfAnnotator), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});


export default function SubjectsPage() {
  const { t } = useLanguage();
  const [isClient, setIsClient] = React.useState(false);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);

  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = React.useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = React.useState(false);
  
  const [activeFile, setActiveFile] = React.useState<{subjectId: string; file: Subject['files'][0]} | null>(null);

  const [editingSubject, setEditingSubject] = React.useState<Subject | null>(
    null
  );
  const [uploadTargetSubject, setUploadTargetSubject] = React.useState<Subject | null>(null);

  React.useEffect(() => {
    setIsClient(true);
    const savedSubjects = localStorage.getItem('subjects');
    if (savedSubjects) {
      setSubjects(JSON.parse(savedSubjects));
    }
  }, []);

  React.useEffect(() => {
    if (isClient) {
      localStorage.setItem('subjects', JSON.stringify(subjects));
    }
  }, [subjects, isClient]);

  const handleAddSubject = () => {
    setEditingSubject(null);
    setIsSubjectDialogOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setIsSubjectDialogOpen(true);
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };
  
  const handleOpenUploadDialog = (subject: Subject) => {
    setUploadTargetSubject(subject);
    setIsUploadDialogOpen(true);
  }
  
  const handleViewPdf = (subjectId: string, file: Subject['files'][0]) => {
    setActiveFile({subjectId, file});
    setIsPdfViewerOpen(true);
  };

  const handleSubjectFormSubmit = (data: Subject) => {
    if (editingSubject) {
      setSubjects(
        subjects.map((s) => (s.id === editingSubject.id ? { ...s, ...data } : s))
      );
    } else {
      setSubjects(prev => [...prev, { ...data, id: `subj-${Date.now()}`, files: [] }]);
    }
    setIsSubjectDialogOpen(false);
  };

  const handleFileUploadSubmit = (data: { name: string; url: string; }) => {
    if (uploadTargetSubject) {
      const newFile = { ...data, id: `file-${Date.now()}` };
      setSubjects(subjects.map(s => 
        s.id === uploadTargetSubject.id 
          ? { ...s, files: [...(s.files || []), newFile] } 
          : s
      ));
    }
    setIsUploadDialogOpen(false);
    setUploadTargetSubject(null);
  };
  
  const handleDeleteFile = (subjectId: string, fileId: string) => {
    setSubjects(subjects.map(s => 
      s.id === subjectId 
        ? { ...s, files: s.files?.filter(f => f.id !== fileId) }
        : s
    ));
  };

  const handleSaveAnnotations = (fileId: string, annotations: NoteContent[]) => {
      if(activeFile) {
        setSubjects(subjects.map(s => {
            if (s.id === activeFile.subjectId) {
                return {
                    ...s,
                    files: (s.files || []).map(f => 
                        f.id === fileId ? {...f, annotations} : f
                    )
                }
            }
            return s;
        }));
      }
  }

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">{t('subjects_page.title')}</h1>
          <p className="text-muted-foreground">
            {t('subjects_page.description')}
          </p>
        </div>
        <Button onClick={handleAddSubject}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('subjects_page.add_subject')}
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <Card key={subject.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <span
                    className="mt-1 h-3 w-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  ></span>
                  {t(subject.name)}
                </CardTitle>
                <CardDescription>{t(subject.teacher)}</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditSubject(subject)}>
                    {t('edit')}
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => handleOpenUploadDialog(subject)}>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>{t('subjects_page.upload_pdf')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    {t('delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              {subject.files && subject.files.length > 0 && (
                 <div className="space-y-2">
                    {subject.files.map(file => (
                        <div key={file.id} className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewPdf(subject.id, file)} className="w-full justify-start">
                              <LinkIcon className="mr-2 h-4 w-4" />
                              {file.name}
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteFile(subject.id, file.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                 </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? t('subjects_page.edit_subject_title') : t('subjects_page.add_subject_title')}
            </DialogTitle>
            <DialogDescription>
              {editingSubject
                ? t('subjects_page.edit_subject_description')
                : t('subjects_page.add_subject_description')}
            </DialogDescription>
          </DialogHeader>
          <SubjectForm
            onSubmit={handleSubjectFormSubmit}
            subject={editingSubject}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('subjects_page.upload_pdf_title')}</DialogTitle>
            <DialogDescription>{t('subjects_page.upload_pdf_description')}</DialogDescription>
          </DialogHeader>
          <UploadFileForm onSubmit={handleFileUploadSubmit} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPdfViewerOpen} onOpenChange={(open) => {
          if (!open) setActiveFile(null);
          setIsPdfViewerOpen(open);
      }}>
        <DialogContent className="max-w-7xl h-[95vh] p-0 flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="sr-only">
            <DialogTitle>{activeFile?.file.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {activeFile?.file.url && (
                <PdfAnnotator 
                    file={activeFile.file} 
                    onSave={handleSaveAnnotations}
                />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

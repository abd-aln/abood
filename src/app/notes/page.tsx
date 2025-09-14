
"use client";

import * as React from "react";
import { PlusCircle, Trash2, Loader2, ArrowLeft, Pen, Eraser, Undo, Circle, Minus, Plus, Image as ImageIcon, MousePointer2, Type, Highlighter, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Note, NoteContent, NoteType, Subject, NoteText, NoteObject } from "@/lib/types";
import { useLanguage } from "@/hooks/use-language";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import dynamic from "next/dynamic";
import type { CanvasHandle } from "@/components/drawing-canvas";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { debounce } from 'lodash';
import { formatDistanceToNow } from "date-fns";
import { ar, fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const DrawingCanvas = dynamic(
  () => import('@/components/drawing-canvas').then(mod => mod.DrawingCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
);

function TextToolbar({ selectedObject, onUpdate }: { selectedObject: NoteText | null, onUpdate: (props: Partial<NoteText>) => void }) {
    const { t } = useLanguage();

    const handleColorChange = (color: string) => {
        onUpdate({ color });
    }

    const handleFontSizeChange = (size: number) => {
        onUpdate({ fontSize: size });
    }

    const colorPalette = ["#000000", "#D50000", "#2962FF", "#00BFA5", "#FFC400", "#AA00FF", "#FFFFFF"];

    if (!selectedObject) return null;

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" title={t('note_editor.color')}>
                        <Circle className="h-6 w-6" style={{ color: selectedObject?.color === '#FFFFFF' ? '#999' : selectedObject?.color, fill: selectedObject?.color }} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="flex gap-2 p-2">
                    {colorPalette.map(c => (
                        <Button key={c} variant="outline" size="icon" className={`h-8 w-8 ${c === selectedObject.color ? 'ring-2 ring-primary' : ''}`} onClick={() => handleColorChange(c)}>
                           <Circle style={{ color: c === '#FFFFFF' ? '#999' : c, fill: c }} className="h-6 w-6" />
                        </Button>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-28" title={t('note_editor.stroke_width')}>
                  <Type className="h-4 w-4" />
                  <div className="relative w-full h-1 mx-2 rounded-full bg-muted">
                    <div
                      className="absolute h-1 rounded-full bg-primary"
                      style={{ width: `${((selectedObject.fontSize || 16) / 100) * 100}%` }}
                    ></div>
                  </div>
                  <Type className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="p-4 w-56"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full h-16 flex items-center justify-center bg-muted rounded-md">
                    <span style={{ fontSize: `${selectedObject.fontSize}px`}}>Aa</span>
                  </div>
                  <Slider
                    value={[selectedObject.fontSize || 16]}
                    onValueChange={(val) => handleFontSizeChange(val[0])}
                    min={8}
                    max={100}
                    step={1}
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function NoteEditor({ note: initialNote, onUpdate, onClose, subjectName }: { note: Note, onUpdate: (note: Note) => void, onClose: () => void, subjectName?: string }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [note, setNote] = React.useState<Note>(initialNote);
  const [penColor, setPenColor] = React.useState('#000000');
  const [penWidth, setPenWidth] = React.useState(5);
  const [highlighterWidth, setHighlighterWidth] = React.useState(15);
  const [tool, setTool] = React.useState<'pen' | 'highlighter' | 'eraser' | 'pointer' | 'text'>('pointer');
  const [isImageSelected, setIsImageSelected] = React.useState(false);
  const [selectedTextObject, setSelectedTextObject] = React.useState<NoteText | null>(null);

  const canvasRef = React.useRef<CanvasHandle>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPenColor(theme === 'dark' ? '#FFFFFF' : '#000000');
  }, [theme]);
  
  const debouncedOnUpdate = React.useCallback(debounce(onUpdate, 1000), [onUpdate]);

  const handleContentChange = React.useCallback((updatedContent: NoteContent) => {
    const thumbnail = canvasRef.current?.getThumbnail() || note.preview || '';
    const updatedNote = { ...note, content: updatedContent, date: new Date().toISOString(), preview: thumbnail };
    setNote(updatedNote);
    debouncedOnUpdate(updatedNote);
  }, [note, debouncedOnUpdate]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    const updatedNote = { ...note, title: newTitle };
    setNote(updatedNote);
    debouncedOnUpdate(updatedNote);
  };

  const handleObjectSelect = React.useCallback((object: NoteObject | null) => {
      if (object && 'text' in object) {
          if (JSON.stringify(object) !== JSON.stringify(selectedTextObject)) {
              setSelectedTextObject(object);
          }
      } else {
          setSelectedTextObject(null);
      }
  }, [selectedTextObject]);


  const handleUpdateSelectedObject = (props: Partial<NoteObject>) => {
      canvasRef.current?.updateSelectedObject(props);
      if ('fontSize' in props && props.fontSize) {
          setSelectedTextObject(prev => prev ? {...prev, fontSize: props.fontSize} : null);
      }
      if ('color' in props && props.color) {
           setSelectedTextObject(prev => prev ? {...prev, color: props.color} : null);
      }
  }


  const handleUndo = () => {
    canvasRef.current?.undo();
  };
  
  const handleDeleteObject = () => {
    canvasRef.current?.deleteSelectedObject();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        canvasRef.current?.addImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };
  
  const handleAddText = () => {
      canvasRef.current?.addText();
  }

  const colorPalette = ["#000000", "#D50000", "#2962FF", "#00BFA5", "#FFC400", "#AA00FF", "#FFFFFF"];


  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col h-screen">
       <header className="flex items-center justify-between p-2 border-b shrink-0">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <Input
                  value={note.title}
                  onChange={handleTitleChange}
                  placeholder={t('note_editor.title_placeholder')}
                  className="text-lg font-bold border-0 shadow-none focus-visible:ring-0 w-auto p-1 h-auto"
              />
              {subjectName && <span className="text-xs text-muted-foreground px-1">{subjectName}</span>}
            </div>
        </div>

        <div className="flex items-center gap-2">
            {selectedTextObject ? (
              <TextToolbar selectedObject={selectedTextObject} onUpdate={handleUpdateSelectedObject} />
            ) : (
            <>
              <Button variant={tool === 'pointer' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('pointer')} title="Selector">
                  <MousePointer2 className="h-5 w-5" />
              </Button>
              <Button variant={tool === 'pen' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('pen')} title={t('note_editor.pen')}>
                  <Pen className="h-5 w-5" />
              </Button>
               <Button variant={tool === 'highlighter' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('highlighter')} title="Highlighter">
                  <Highlighter className="h-5 w-5" />
              </Button>
              <Button variant={tool === 'eraser' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('eraser')} title={t('note_editor.eraser')}>
                  <Eraser className="h-5 w-5" />
              </Button>
               <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title={t('note_editor.add_image')}>
                <ImageIcon className="h-5 w-5" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />
            </>
            )}

            {(isImageSelected || selectedTextObject) && tool === 'pointer' && (
                <Button variant="destructive" size="icon" onClick={handleDeleteObject} title={t('delete')}>
                    <Trash2 className="h-5 w-5" />
                </Button>
            )}

            {!selectedTextObject && (
              <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" title={t('note_editor.color')} disabled={tool === 'pointer' || tool === 'eraser'}>
                            <Circle className="h-6 w-6" style={{ color: penColor === '#FFFFFF' ? '#999' : penColor, fill: tool === 'highlighter' ? `${penColor}80` : penColor }} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="flex gap-2 p-2">
                        {colorPalette.map(c => (
                            <Button key={c} variant="outline" size="icon" className={`h-8 w-8 ${c === penColor ? 'ring-2 ring-primary' : ''}`} onClick={() => setPenColor(c)}>
                               <Circle style={{ color: c === '#FFFFFF' ? '#999' : c, fill: tool === 'highlighter' ? `${c}80` : c }} className="h-6 w-6" />
                            </Button>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-28" title={t('note_editor.stroke_width')} disabled={tool === 'pointer' || tool === 'text'}>
                      <Minus className="h-4 w-4" />
                      <div className="relative w-full h-1 mx-2 rounded-full bg-muted">
                        <div
                          className="absolute h-1 rounded-full bg-primary"
                          style={{ width: `${((tool === 'pen' ? penWidth : highlighterWidth) / (tool === 'pen' ? 50 : 30)) * 100}%` }}
                        ></div>
                      </div>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className="p-4 w-56"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-full h-16 flex items-center justify-center bg-muted rounded-md">
                        <div
                          className="rounded-full"
                          style={{ 
                              width: tool === 'pen' ? penWidth : highlighterWidth, 
                              height: tool === 'pen' ? penWidth : highlighterWidth,
                              backgroundColor: tool === 'highlighter' ? `${penColor}80` : (theme === 'dark' ? 'white' : 'black'),
                           }}
                        ></div>
                      </div>
                      <Slider
                        value={[tool === 'pen' ? penWidth : highlighterWidth]}
                        onValueChange={(val) => tool === 'pen' ? setPenWidth(val[0]) : setHighlighterWidth(val[0])}
                        min={tool === 'pen' ? 1 : 10}
                        max={tool === 'pen' ? 50 : 30}
                        step={1}
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
        </div>
      </header>

      <main className="flex-1 w-full h-full overflow-hidden">
        <DrawingCanvas
          ref={canvasRef}
          initialContent={note.content}
          onContentChange={handleContentChange}
          penColor={penColor}
          penWidth={tool === 'pen' ? penWidth : highlighterWidth}
          tool={tool}
          onImageSelect={setIsImageSelected}
          onTextObjectSelect={handleObjectSelect}
          noteType={note.type}
        />
      </main>
    </div>
  );
}

const newNoteSchema = z.object({
  title: z.string().min(1, "Title is required."),
  type: z.enum(["blank", "lined"], { required_error: "Please select a page type." }),
  subjectId: z.string().optional(),
});

function NewNoteDialog({ open, onOpenChange, onSubmit, subjects }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (data: z.infer<typeof newNoteSchema>) => void, subjects: Subject[] }) {
  const { t } = useLanguage();
  const form = useForm<z.infer<typeof newNoteSchema>>({
    resolver: zodResolver(newNoteSchema),
    defaultValues: {
      title: "",
      type: "blank",
      subjectId: undefined,
    },
  });

  const handleSubmit = (values: z.infer<typeof newNoteSchema>) => {
    onSubmit(values);
    form.reset({ title: "", type: "blank", subjectId: undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('notes_page.new_note_dialog_title')}</DialogTitle>
          <DialogDescription>{t('notes_page.new_note_dialog_desc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('note_form.title_label')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('notes_page.untitled')}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('task_form.subject_label')} <span className="text-muted-foreground">{t('optional')}</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('task_form.subject_placeholder')} />
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
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('notes_page.page_type')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem value="blank" id="blank" className="peer sr-only" />
                        </FormControl>
                        <FormLabel htmlFor="blank" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                          {t('notes_page.blank_note')}
                        </FormLabel>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem value="lined" id="lined" className="peer sr-only" />
                        </FormControl>
                        <FormLabel htmlFor="lined" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                          {t('notes_page.lined_note')}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{t('create_note')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function NotesPage() {
  const { t, language } = useLanguage();
  const [isClient, setIsClient] = React.useState(false);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null);
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = React.useState(false);
  const [filterSubject, setFilterSubject] = React.useState<string>("all");

  React.useEffect(() => {
    setIsClient(true);
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      try {
        const parsedNotes: Note[] = JSON.parse(savedNotes);
        const sortedNotes = parsedNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNotes(sortedNotes);
      } catch (e) {
        setNotes([]);
      }
    } else {
      setNotes([]);
    }
    
    const savedSubjects = localStorage.getItem('subjects');
    if (savedSubjects) {
      setSubjects(JSON.parse(savedSubjects));
    }

  }, []);

  const handleAddNote = (data: z.infer<typeof newNoteSchema>) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: data.title || t('notes_page.untitled'),
      content: { lines: [], images: [], texts: [] },
      date: new Date().toISOString(),
      type: data.type as NoteType,
      subjectId: data.subjectId
    };
    const updatedNotes = [newNote, ...notes];
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
    setSelectedNote(newNote);
    setIsNewNoteDialogOpen(false);
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter((n) => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
  };

  const handleNoteUpdate = (updatedNote: Note) => {
      const allNotes: Note[] = JSON.parse(localStorage.getItem('notes') || '[]');
      const noteIndex = allNotes.findIndex(n => n.id === updatedNote.id);
      
      if (noteIndex > -1) {
        allNotes[noteIndex] = updatedNote;
      } else {
        allNotes.push(updatedNote);
      }
      localStorage.setItem('notes', JSON.stringify(allNotes));
      
      const sorted = allNotes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotes(sorted);
      if (selectedNote?.id === updatedNote.id) {
        setSelectedNote(updatedNote);
      }
  }

  const getTimeAgo = (date: string) => {
    const locale = language === 'ar' ? ar : (language === 'fr' ? fr : undefined);
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale });
  };
  
  const filteredNotes = React.useMemo(() => {
    if (filterSubject === "all") {
      return notes;
    }
    return notes.filter(note => note.subjectId === filterSubject);
  }, [notes, filterSubject]);


  if (!isClient) {
    return null;
  }
  
  if (selectedNote) {
      const subjectName = subjects.find(s => s.id === selectedNote.subjectId)?.name;
      return <NoteEditor 
                note={selectedNote} 
                onUpdate={handleNoteUpdate}
                onClose={() => setSelectedNote(null)}
                subjectName={subjectName ? t(subjectName) : undefined}
             />
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl font-bold">{t('nav.notes')}</h1>
            <p className="text-muted-foreground">{t('notes_page.description')}</p>
          </div>
          <div className="flex items-center gap-2">
             <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder={t('notes_page.filter_by_subject')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('notes_page.all_subjects')}</SelectItem>
                    {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                            {t(subject.name)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={() => setIsNewNoteDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('notes_page.add_note')}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
              const subject = subjects.find(s => s.id === note.subjectId);
              const noteTypeTranslation = note.type === 'lined' ? t('notes_page.lined_note') : t('notes_page.blank_note');
              return (
              <Card 
                key={note.id} 
                className="flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors" 
                onClick={() => handleSelectNote(note)}
              >
                <div className="flex flex-col flex-grow">
                  <CardHeader className="flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="truncate text-lg">{note.title}</CardTitle>
                      <CardDescription>
                        {getTimeAgo(note.date)}
                      </CardDescription>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id);}}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                </div>
                {(subject || note.type) && (
                  <CardFooter className="flex items-center gap-2">
                    {subject && (
                      <Badge style={{ backgroundColor: `${subject.color}20`, color: subject.color }}>
                        {t(subject.name)}
                      </Badge>
                    )}
                    <Badge variant="outline">{noteTypeTranslation}</Badge>
                  </CardFooter>
                )}
              </Card>
            )})
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-16">
              <p>{t('notes_page.no_notes')}</p>
            </div>
          )}
        </div>
      </div>
      <NewNoteDialog 
        open={isNewNoteDialogOpen} 
        onOpenChange={setIsNewNoteDialogOpen}
        onSubmit={handleAddNote}
        subjects={subjects}
      />
    </>
  );
}

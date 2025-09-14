
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFPageProxy } from 'pdfjs-dist';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Loader2, Pen, Highlighter, MousePointer2, Eraser, Circle, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrawingCanvas, CanvasHandle } from '@/components/drawing-canvas';
import type { NoteContent, Subject } from '@/lib/types';
import { useTheme } from 'next-themes';
import { debounce } from 'lodash';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from './ui/dropdown-menu';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { useInView } from 'react-intersection-observer';
import { Separator } from './ui/separator';


pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfAnnotatorProps {
  file: Subject['files'][0];
  onSave: (fileId: string, annotations: NoteContent[]) => void;
}

type Tool = 'pen' | 'highlighter' | 'eraser' | 'pointer';

function PageRenderer({ pageNumber, scale, annotations, onAnnotationChange, tool, penColor, penWidth }) {
    const { ref, inView } = useInView({
        threshold: 0,
        triggerOnce: true,
    });
    const canvasRef = useRef<CanvasHandle>(null);

    return (
        <div ref={ref} className="relative mx-auto my-4 shadow-lg" data-page-number={pageNumber}>
            {inView ? (
                <>
                    <Page
                        key={`page_${pageNumber}`}
                        pageNumber={pageNumber}
                        renderAnnotationLayer={false}
                        renderTextLayer={true}
                        scale={scale}
                    />
                    <div className={cn(
                      "absolute inset-0 z-10",
                       tool === 'pointer' && 'pointer-events-none'
                    )}>
                        <DrawingCanvas
                            ref={canvasRef}
                            initialContent={annotations || { lines: [], images: [], texts: [] }}
                            onContentChange={onAnnotationChange}
                            tool={tool}
                            penColor={penColor}
                            penWidth={penWidth}
                            onImageSelect={() => {}}
                            onTextObjectSelect={() => {}}
                            noteType="blank"
                            isPdf={true}
                        />
                    </div>
                </>
            ) : (
                <div style={{ width: 595 * scale, height: 842 * scale }} className="flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-md">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    )
}


export function PdfAnnotator({ file, onSave }: PdfAnnotatorProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageScale, setPageScale] = useState(1.0);
  const [annotations, setAnnotations] = useState<NoteContent[]>([]);
  const [visiblePage, setVisiblePage] = useState(1);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [tool, setTool] = useState<Tool>('pointer');
  const [penColor, setPenColor] = useState('#D50000');
  const [penWidth, setPenWidth] = useState(3);
  const [highlighterWidth, setHighlighterWidth] = useState(15);
  
  const debouncedOnSave = useCallback(debounce(onSave, 2000), [onSave]);

  useEffect(() => {
    setAnnotations(file.annotations || []);
  }, [file.annotations]);


  const handleAnnotationChange = useCallback((pageIndex: number, newContent: NoteContent) => {
    setAnnotations(prev => {
      const newAnnotations = [...prev];
      newAnnotations[pageIndex] = newContent;
      debouncedOnSave(file.id, newAnnotations);
      return newAnnotations;
    });
  }, [debouncedOnSave, file.id]);
  
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setAnnotations(prev => {
        if (prev.length === numPages) return prev;
        const newAnnotations = new Array(numPages).fill(null).map((_, i) => prev[i] || { lines: [], images: [], texts: [] });
        return newAnnotations;
    });
    
    if(scrollContainerRef.current) {
        const containerWidth = scrollContainerRef.current.clientWidth;
        setPageScale(containerWidth * 0.95 / 595);
    }

  }, []);

  useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const handleScroll = debounce(() => {
          const pageElements = Array.from(container.querySelectorAll('[data-page-number]'));
          let mostVisiblePage = 1;
          let maxVisibility = 0;

          for (const el of pageElements) {
              const rect = el.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              
              const visibleHeight = Math.max(0, Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top));
              const visibility = visibleHeight / rect.height;

              if(visibility > maxVisibility) {
                  maxVisibility = visibility;
                  mostVisiblePage = parseInt(el.getAttribute('data-page-number') || '1', 10);
              }
          }
          setVisiblePage(mostVisiblePage);
      }, 100);

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);

  }, [numPages]);


  const colorPalette = ["#D50000", "#FFC400", "#00BFA5", "#2962FF", "#AA00FF", "#000000"];

  return (
    <div className="flex flex-col h-full w-full items-center bg-muted/30">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 p-2 border rounded-xl bg-card sticky top-2 z-20 shrink-0 my-2 shadow-lg w-auto">
            <div className="flex items-center gap-2">
                <Button variant={tool === 'pointer' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('pointer')} title="Selector">
                    <MousePointer2 className="h-5 w-5" />
                </Button>
                <Button variant={tool === 'pen' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('pen')} title="Pen">
                    <Pen className="h-5 w-5" />
                </Button>
                <Button variant={tool === 'highlighter' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('highlighter')} title="Highlighter">
                    <Highlighter className="h-5 w-5" />
                </Button>
                <Button variant={tool === 'eraser' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('eraser')} title="Eraser">
                    <Eraser className="h-5 w-5" />
                </Button>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {(tool === 'pen' || tool === 'highlighter') && (
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="Color">
                                <Circle className="h-6 w-6" style={{ color: penColor, fill: tool === 'highlighter' ? `${penColor}80` : penColor }} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="flex gap-2 p-2">
                            {colorPalette.map(c => (
                                <Button key={c} variant="outline" size="icon" className={`h-8 w-8 ${c === penColor ? 'ring-2 ring-primary' : ''}`} onClick={() => setPenColor(c)}>
                                    <Circle style={{ fill: tool === 'highlighter' ? `${c}80` : c, color: c}} className="h-6 w-6" />
                                </Button>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-28" title={tool === 'pen' ? "Pen Width" : "Highlighter Size"}>
                            <Minus className="h-4 w-4" />
                            <div className="relative w-full h-1 mx-2 rounded-full bg-muted">
                            <div 
                                className="absolute h-1 rounded-full bg-primary" 
                                style={{ 
                                    width: `${((tool === 'pen' ? penWidth : highlighterWidth) / (tool === 'pen' ? 10 : 30)) * 100}%`,
                                    opacity: tool === 'highlighter' ? 0.5 : 1
                                }}>
                            </div>
                            </div>
                            <Plus className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} className="p-4 w-56">
                        <Slider 
                            value={[tool === 'pen' ? penWidth : highlighterWidth]} 
                            onValueChange={(val) => tool === 'pen' ? setPenWidth(val[0]) : setHighlighterWidth(val[0])} 
                            min={tool === 'pen' ? 1 : 10} 
                            max={tool === 'pen' ? 10 : 30} 
                            step={tool === 'pen' ? 0.5 : 1} 
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
             
             <Separator orientation="vertical" className="h-8" />

            {numPages && (
              <div className="text-sm font-medium text-muted-foreground px-2 w-20 text-center">
                {visiblePage} / {numPages}
              </div>
            )}
        </div>

        <div 
            ref={scrollContainerRef} 
            className="flex-1 w-full flex-col overflow-y-auto"
        >
          <Document
            file={file.url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
                <div className="flex justify-center items-center h-full p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">{t('Loading PDF...')}</p>
                </div>
            }
            error={
                <div className="text-destructive p-8">
                {t('Failed to load PDF file. Please check the file URL.')}
                </div>
            }
          >
             {numPages && Array.from(new Array(numPages), (el, index) => (
                <PageRenderer
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    scale={pageScale}
                    annotations={annotations[index]}
                    onAnnotationChange={(content) => handleAnnotationChange(index, content)}
                    tool={tool}
                    penColor={penColor}
                    penWidth={tool === 'pen' ? penWidth : highlighterWidth}
                />
            ))}
          </Document>
        </div>
    </div>
  );
}

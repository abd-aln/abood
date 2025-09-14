
"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import type { NoteContent, NoteLine, NoteImage, NoteText, NoteObject, NoteType } from '@/lib/types';
import { useTheme } from 'next-themes';
import { debounce } from 'lodash';
import { cn } from '@/lib/utils';


// --- Types and Constants ---
type Tool = 'pen' | 'highlighter' | 'eraser' | 'pointer' | 'text';
interface DrawingCanvasProps {
  initialContent: NoteContent;
  onContentChange: (content: NoteContent) => void;
  tool: Tool;
  penColor: string;
  penWidth: number;
  onImageSelect: (isSelected: boolean) => void;
  onTextObjectSelect: (object: NoteObject | null) => void;
  noteType: NoteType;
  isPdf?: boolean;
}

export type CanvasHandle = {
  addImage: (src: string) => void;
  addText: (initialText?: string) => void;
  undo: () => void;
  getThumbnail: () => string;
  deleteSelectedObject: () => void;
  updateSelectedObject: (props: Partial<NoteObject>) => void;
};

type Action = 'none' | 'drawing' | 'moving' | 'resizing' | 'editing';
type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 'ml' | 'mr';
const HANDLE_SIZE = 8;
const MIN_TEXT_WIDTH = 50;
const MIN_TEXT_HEIGHT = 20;

// --- Main Component ---
export const DrawingCanvas = forwardRef<CanvasHandle, DrawingCanvasProps>(
  ({ initialContent, onContentChange, penColor, penWidth, tool, onImageSelect, onTextObjectSelect, noteType, isPdf = false }, ref) => {
    const { theme } = useTheme();

    // --- Refs for Canvases and State ---
    const containerRef = useRef<HTMLDivElement>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const objectCanvasRef = useRef<HTMLCanvasElement>(null);
    const interactionCanvasRef = useRef<HTMLCanvasElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);

    // --- Component State ---
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isEditingText, setIsEditingText] = useState(false);
    
    // --- Refs for internal state management ---
    const contentRef = useRef<NoteContent>({ lines: [], images: [], texts: [] });
    const imageElementsRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const isDirty = useRef(false);
    const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
    const showDeleteIconFor = useRef<string | null>(null);
    const interactionState = useRef<Partial<NoteObject> | null>(null);

    // Interaction state refs
    const actionRef = useRef<Action>('none');
    const selectedObjectId = useRef<string | null>(null);
    const activeResizeHandle = useRef<ResizeHandle | null>(null);
    const startPos = useRef({ x: 0, y: 0 });
    const objectStartPos = useRef<Partial<NoteObject>>({});
    
    const debouncedOnContentChange = useCallback(debounce(onContentChange, 500), [onContentChange]);


    // --- Helper Functions ---
    const getEventCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      let touch: Touch | undefined = undefined;
      
      if ('touches' in e && e.touches.length > 0) {
        touch = e.touches[0];
      } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        touch = e.changedTouches[0];
      }
    
      const clientX = touch ? touch.clientX : (e as MouseEvent).clientX;
      const clientY = touch ? touch.clientY : (e as MouseEvent).clientY;
    
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const triggerContentChange = () => {
      if (!isDirty.current) return;
      const newContent = JSON.parse(JSON.stringify(contentRef.current));
      debouncedOnContentChange(newContent);
      isDirty.current = false;
    };

    const getObjectById = (id: string | null): NoteObject | undefined => {
      if (!id) return undefined;
      return [...(contentRef.current.images || []), ...(contentRef.current.texts || [])].find(obj => obj.id === id);
    };

    const deselectAll = () => {
      if (isEditingText && textInputRef.current) {
        textInputRef.current.blur();
      }
      if (selectedObjectId.current) {
        selectedObjectId.current = null;
        onImageSelect(false);
        onTextObjectSelect(null);
        redrawAll();
      }
    };
    
    // --- Canvas Drawing Functions ---
    const drawLine = (ctx: CanvasRenderingContext2D, line: NoteLine) => {
        if (!line || !line.points || line.points.length < 2) return;
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if(line.tool === 'highlighter') {
            ctx.globalCompositeOperation = 'multiply';
        } else if (line.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = "rgba(0,0,0,1)";
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }
        
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        for (let i = 1; i < line.points.length; i++) {
            ctx.lineTo(line.points[i].x, line.points[i].y);
        }
        ctx.stroke();
    };

    const redrawDrawingCanvas = () => {
      const canvas = drawingCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      contentRef.current.lines.forEach(line => drawLine(ctx, line));
    }
    
    const redrawObjectCanvas = (hideSelected = false) => {
        const canvas = objectCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const drawObject = (obj: NoteObject) => {
          if (hideSelected && obj.id === selectedObjectId.current) {
              return;
          }
          if ('src' in obj) { // It's an image
            const imgEl = imageElementsRef.current.get(obj.id);
            if(imgEl) {
                ctx.drawImage(imgEl, obj.x, obj.y, obj.width, obj.height);
            }
          } else if('text' in obj) { // It's a text object
             drawText(ctx, obj as NoteText);
          }
        }
        
        const allObjects = [...(contentRef.current.images || []), ...(contentRef.current.texts || [])];
        allObjects.forEach(drawObject);
    };

    const redrawInteractionCanvas = () => {
        const canvas = interactionCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if ((actionRef.current === 'moving' || actionRef.current === 'resizing') && interactionState.current) {
            drawObjectOnInteractionCanvas(ctx, interactionState.current);
            drawSelectionHandles(ctx, interactionState.current);
        } else if (selectedObjectId.current) {
            const object = getObjectById(selectedObjectId.current);
            if (object) {
                drawSelectionHandles(ctx, object);
            }
        }

        if (showDeleteIconFor.current) {
          const object = getObjectById(showDeleteIconFor.current);
          if (object) {
            drawDeleteIcon(ctx, object);
          }
        }
    }

    const drawObjectOnInteractionCanvas = (ctx: CanvasRenderingContext2D, object: Partial<NoteObject>) => {
        if ('src' in object && object.id) { // is image
            const imageEl = imageElementsRef.current.get(object.id);
            if(imageEl && object.x !== undefined && object.y !== undefined && object.width !== undefined && object.height !== undefined) {
                ctx.drawImage(imageEl, object.x, object.y, object.width, object.height);
            }
        } else if ('text' in object) { // is text
            drawText(ctx, object as NoteText);
        }
    }

    const drawText = (ctx: CanvasRenderingContext2D, textObject: NoteText) => {
      ctx.font = `${textObject.fontSize}px sans-serif`;
      ctx.fillStyle = textObject.color;
      ctx.textBaseline = 'top';

      const lines = textObject.text.split('\n');
      lines.forEach((line, index) => {
        ctx.fillText(line, textObject.x, textObject.y + index * textObject.fontSize * 1.2);
      });
    }

    const redrawBackgroundCanvas = () => {
      if (isPdf) return;
      const canvas = backgroundCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      // Clear and set background color
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = theme === 'dark' ? '#1f2937' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);


      if (noteType === 'lined') {
        ctx.strokeStyle = theme === 'dark' ? '#374151' : '#e5e7eb';
        ctx.lineWidth = 1;
        const lineHeight = 30; // Adjust as needed
        for (let y = lineHeight; y < canvas.height; y += lineHeight) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }
    };
    
    const drawSelectionHandles = (ctx: CanvasRenderingContext2D, object: Partial<NoteObject>) => {
      if(object.x === undefined || object.y === undefined || object.width === undefined || object.height === undefined) return;
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 1;
      ctx.strokeRect(object.x, object.y, object.width, object.height);

      ctx.fillStyle = '#007bff';
      const handles = getResizeHandles(object as NoteObject);
      Object.values(handles).forEach(handle => {
          ctx.fillRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      });
    };

    const drawDeleteIcon = (ctx: CanvasRenderingContext2D, object: NoteObject) => {
      const iconSize = 24;
      const padding = 10;
      const x = object.x + object.width / 2 - iconSize / 2;
      const y = object.y + object.height + padding;

      // background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(x - padding/2, y - padding/2, iconSize + padding, iconSize + padding, 8);
      ctx.fill();

      // Trash icon
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;

      // Can
      ctx.strokeRect(x + 4, y + 6, 16, 16);
      // Lid
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 6);
      ctx.lineTo(x + 22, y + 6);
      ctx.stroke();
      // Handle
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 3);
      ctx.lineTo(x + 14, y + 3);
      ctx.stroke();
      // Lines
      ctx.beginPath();
      ctx.moveTo(x + 9, y + 10);
      ctx.lineTo(x + 9, y + 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 15, y + 10);
      ctx.lineTo(x + 15, y + 18);
      ctx.stroke();
    };
    
    const redrawAll = () => {
        requestAnimationFrame(() => {
            redrawBackgroundCanvas();
            redrawDrawingCanvas();
            redrawObjectCanvas();
            redrawInteractionCanvas();
        });
    }

    const loadAndDrawAllImages = () => {
      const allObjects = [...(contentRef.current.images || []), ...(contentRef.current.texts || [])];
      const imagePromises = allObjects.filter(o => 'src' in o).map((imgData: NoteImage) => {
        return new Promise<void>(resolve => {
          if (imageElementsRef.current.has(imgData.id)) {
            return resolve();
          }
          const img = new Image();
          img.src = imgData.src;
          img.onload = () => {
            imageElementsRef.current.set(imgData.id, img);
            resolve();
          };
          img.onerror = () => resolve(); // continue even if one image fails
        });
      });
    
      Promise.all(imagePromises).then(() => {
        redrawAll();
      });
    };
    
    const startLongPressTimer = (e: React.MouseEvent | React.TouchEvent, object: NoteObject) => {
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
      longPressTimeout.current = setTimeout(() => {
        showDeleteIconFor.current = object.id;
        redrawInteractionCanvas();
        longPressTimeout.current = null;
      }, 500);
    };

    const clearLongPressTimer = () => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
    };
    
    const hideDeleteIcon = () => {
      if (showDeleteIconFor.current) {
        showDeleteIconFor.current = null;
        redrawInteractionCanvas();
      }
    };

    // --- Event Handlers ---
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const pos = getEventCoords(e, interactionCanvasRef.current!);
      startPos.current = pos;
      
      const wasEditing = isEditingText;
      
      if (isEditingText && textInputRef.current) {
        const textRect = textInputRef.current.getBoundingClientRect();
        const canvasRect = interactionCanvasRef.current!.getBoundingClientRect();
        if (
          pos.x < textRect.left - canvasRect.left ||
          pos.x > textRect.right - canvasRect.left ||
          pos.y < textRect.top - canvasRect.top ||
          pos.y > textRect.bottom - canvasRect.top
        ) {
          textInputRef.current.blur();
        }
      }

      const { clickedObject, handle, clickedDeleteIcon } = findClickTarget(pos);

      if(clickedDeleteIcon && showDeleteIconFor.current) {
        const idToDelete = showDeleteIconFor.current;
        contentRef.current.images = (contentRef.current.images || []).filter(img => img.id !== idToDelete);
        contentRef.current.texts = (contentRef.current.texts || []).filter(txt => txt.id !== idToDelete);
        isDirty.current = true;
        hideDeleteIcon();
        triggerContentChange();
        redrawAll();
        return;
      }

      hideDeleteIcon();

      if (tool === 'pointer' && !wasEditing) {
          if (clickedObject) {
              selectObject(clickedObject, handle);
              startLongPressTimer(e, clickedObject);
          } else {
              deselectAll();
          }
      } else if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
        actionRef.current = 'drawing';
        const newLine: NoteLine = {
          tool,
          color: tool === 'pen' || tool === 'highlighter' ? penColor : '#000000', // Eraser color doesn't matter
          strokeWidth: penWidth,
          points: [pos],
        };
        contentRef.current.lines.push(newLine);
      }
    };

    const selectObject = (object: NoteObject, handle: ResizeHandle | null = null) => {
      actionRef.current = handle ? 'resizing' : 'moving';
      activeResizeHandle.current = handle;
      selectedObjectId.current = object.id;
      objectStartPos.current = { ...object };
      
      interactionState.current = { ...object };

      onImageSelect('src' in object);
      onTextObjectSelect('text' in object ? object as NoteText : null);

      redrawObjectCanvas(true); // Hide the object on main canvas
      redrawInteractionCanvas();
    }

    const handleDoubleClick = (e: React.MouseEvent) => {
      const pos = getEventCoords(e, interactionCanvasRef.current!);
      const { clickedObject } = findClickTarget(pos);

      if (tool === 'pointer' && clickedObject && 'text' in clickedObject) {
        selectedObjectId.current = clickedObject.id;
        setIsEditingText(true);
      }
    }


    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
      clearLongPressTimer();
      if (actionRef.current === 'none' && !showDeleteIconFor.current) return;
      e.preventDefault();

      const pos = getEventCoords(e, interactionCanvasRef.current!);
      
      if (showDeleteIconFor.current && actionRef.current !== 'moving') {
        const { clickedDeleteIcon } = findClickTarget(pos);
        interactionCanvasRef.current!.style.cursor = clickedDeleteIcon ? 'pointer' : 'default';
        return;
      }

      if (actionRef.current === 'none' && tool === 'pointer') {
          const { handle, clickedObject } = findClickTarget(pos);
          const cursorForObject = clickedObject ? (handle ? getCursorForHandle(handle) : 'move') : 'default';
          interactionCanvasRef.current!.style.cursor = cursorForObject;
          return;
      }
      
      if (actionRef.current !== 'none') hideDeleteIcon();

      const iCtx = interactionCanvasRef.current?.getContext('2d');
      if (!iCtx) return;

      requestAnimationFrame(() => {
        if (actionRef.current === 'drawing') {
            const currentLine = contentRef.current.lines[contentRef.current.lines.length - 1];
            if(currentLine) {
                currentLine.points.push(pos);
                redrawDrawingCanvas();
            }

        } else if ((actionRef.current === 'moving' || actionRef.current === 'resizing') && selectedObjectId.current) {
            const dx = pos.x - startPos.current.x;
            const dy = pos.y - startPos.current.y;
            let newRect: Partial<NoteObject> = {};
            
            if (actionRef.current === 'moving') {
              newRect = { ...objectStartPos.current, x: objectStartPos.current.x! + dx, y: objectStartPos.current.y! + dy };
            } else if (actionRef.current === 'resizing' && activeResizeHandle.current) {
               newRect = resizeObject(objectStartPos.current as NoteObject, startPos.current, pos, activeResizeHandle.current);
            }
            
            interactionState.current = newRect;

            if ('text' in newRect) {
               const textObject = getObjectById(selectedObjectId.current) as NoteText;
               if(textObject) {
                    const newFontSize = calculateFontSize(textObject.text, newRect.width!, newRect.height!);
                    (newRect as NoteText).fontSize = newFontSize;
                    const updatedTextObject = { ...textObject, ...newRect };
                    onTextObjectSelect(updatedTextObject);
                    if(textInputRef.current) textInputRef.current.style.fontSize = `${newFontSize}px`;
               }
            }
            redrawInteractionCanvas();
        }
      });
    };

    const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
        clearLongPressTimer();
        const iCtx = interactionCanvasRef.current?.getContext('2d');
        if (!iCtx) return;

        if (actionRef.current === 'drawing') {
            const currentLine = contentRef.current.lines[contentRef.current.lines.length - 1];
            if (currentLine && currentLine.points.length > 1) {
                isDirty.current = true;
            } else if (currentLine) {
                contentRef.current.lines.pop();
            }
        } else if ((actionRef.current === 'moving' || actionRef.current === 'resizing') && selectedObjectId.current && interactionState.current) {
            const object = getObjectById(selectedObjectId.current);
            if (object) {
                Object.assign(object, interactionState.current);
                 if ('text' in object) {
                    const newFontSize = calculateFontSize(object.text, object.width, object.height);
                    object.fontSize = newFontSize;
                    onTextObjectSelect(object as NoteText);
                 }
                isDirty.current = true;
            }
        }
        
        actionRef.current = 'none';
        activeResizeHandle.current = null;
        interactionState.current = null;
        redrawAll(); 
        triggerContentChange();
    };

    const handleTextInputBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      const objectId = selectedObjectId.current;
      setIsEditingText(false);
      selectedObjectId.current = null; // deselect after editing

      if(objectId) {
          const textObject = getObjectById(objectId) as NoteText;
          if (textObject) {
              if (text.trim() === '') {
                  // If text is empty, delete the object
                  contentRef.current.texts = (contentRef.current.texts || []).filter(t => t.id !== objectId);
              } else {
                  textObject.text = text;
                  // Recalculate width/height if needed (optional)
                  const { width, height } = measureText(text, textObject.fontSize);
                  textObject.width = width + 20; // add some padding
                  textObject.height = height + 10;
              }
              isDirty.current = true;
              triggerContentChange();
          }
      }
      redrawAll();
    }


    // --- Geometry and Hit-testing ---
    const getResizeHandles = (object: NoteObject) => {
        const handles: { [key in ResizeHandle]: { x: number, y: number } } = {
            tl: { x: object.x, y: object.y },
            tr: { x: object.x + object.width, y: object.y },
            bl: { x: object.x, y: object.y + object.height },
            br: { x: object.x + object.width, y: object.y + object.height },
            ml: { x: object.x, y: object.y + object.height / 2},
            mr: { x: object.x + object.width, y: object.y + object.height / 2},
        };

        if ('src' in object) { // Image
            return handles;
        }
        // Text object only has horizontal resize handles
        delete (handles as any).tl;
        delete (handles as any).tr;
        delete (handles as any).bl;
        delete (handles as any).br;
        return handles;
    };

    const findClickTarget = (pos: {x: number, y: number}) => {
        let clickedObject: NoteObject | null = null;
        let handle: ResizeHandle | null = null;

        // Check for delete icon click first
        if (showDeleteIconFor.current) {
          const object = getObjectById(showDeleteIconFor.current);
          if (object) {
            const iconSize = 24;
            const padding = 10;
            const iconX = object.x + object.width / 2 - iconSize / 2;
            const iconY = object.y + object.height + padding;
            if (pos.x >= iconX - padding/2 && pos.x <= iconX + iconSize + padding/2 &&
                pos.y >= iconY - padding/2 && pos.y <= iconY + iconSize + padding/2) {
                  return { clickedObject: null, handle: null, clickedDeleteIcon: true };
            }
          }
        }
    
        // Check for resize handle clicks on the currently selected object
        const selectedObj = getObjectById(selectedObjectId.current);
        if (selectedObj && tool === 'pointer') {
            const handles = getResizeHandles(selectedObj);
            for (const [h, hPos] of Object.entries(handles) as [ResizeHandle, {x:number, y:number}][]) {
                if (pos.x >= hPos.x - HANDLE_SIZE && pos.x <= hPos.x + HANDLE_SIZE &&
                    pos.y >= hPos.y - HANDLE_SIZE && pos.y <= hPos.y + HANDLE_SIZE) {
                    return { clickedObject: selectedObj, handle: h, clickedDeleteIcon: false };
                }
            }
        }
        
        // Check for object clicks (images and texts)
        const allObjects = [...(contentRef.current.images || []), ...(contentRef.current.texts || [])];
        for (let i = allObjects.length - 1; i >= 0; i--) {
            const obj = allObjects[i];
            if (pos.x >= obj.x && pos.x <= obj.x + obj.width &&
                pos.y >= obj.y && pos.y <= obj.y + obj.height) {
                clickedObject = obj;
                return { clickedObject, handle: null, clickedDeleteIcon: false };
            }
        }
    
        return { clickedObject: null, handle: null, clickedDeleteIcon: false };
    };

    const getCursorForHandle = (handle: ResizeHandle | null) => {
        if (!handle) return 'move';
        if (handle === 'tl' || handle === 'br') return 'nwse-resize';
        if (handle === 'tr' || handle === 'bl') return 'nesw-resize';
        if (handle === 'ml' || handle === 'mr') return 'ew-resize';
        return 'default';
    };

    const resizeObject = (startRect: NoteObject, startDrag: {x:number, y:number}, currentDrag: {x:number, y:number}, handle: ResizeHandle): Partial<NoteObject> => {
        const dx = currentDrag.x - startDrag.x;
        const dy = currentDrag.y - startDrag.y;
        let { x, y, width, height } = startRect;

        if (handle.includes('l')) { width -= dx; x += dx; }
        if (handle.includes('r')) { width += dx; }

        if ('src' in startRect) { // Image resizing
          if (handle.includes('t')) { height -= dy; y += dy; }
          if (handle.includes('b')) { height += dy; }
        }

        const minWidth = 'text' in startRect ? MIN_TEXT_WIDTH : 20;
        const minHeight = 'text' in startRect ? MIN_TEXT_HEIGHT : 20;
        
        return { x, y, width: Math.max(width, minWidth), height: Math.max(height, minHeight) };
    };

    const measureText = (text: string, fontSize: number) => {
        const ctx = interactionCanvasRef.current?.getContext('2d');
        if (!ctx) return { width: 0, height: 0 };
        ctx.font = `${fontSize}px sans-serif`;
        const lines = text.split('\n');
        const width = Math.max(...lines.map(line => ctx.measureText(line).width));
        const height = lines.length * fontSize * 1.2;
        return { width, height };
    }

    const calculateFontSize = (text: string, newWidth: number, currentHeight: number): number => {
      // This is a simplified logic. A more robust solution would involve iteration.
      if (!text) return 16;
      const avgCharWidth = 0.6; // Heuristic
      const lines = text.split('\n');
      const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b, '');
      const fontSizeFromWidth = (newWidth / (longestLine.length || 1)) / avgCharWidth;
      
      const lineHeight = 1.2;
      const fontSizeFromHeight = currentHeight / ((lines.length || 1) * lineHeight);

      return Math.min(fontSizeFromWidth, fontSizeFromHeight);
    };

    
    // --- Effects and Imperative Handle ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const canvases = [backgroundCanvasRef.current, drawingCanvasRef.current, objectCanvasRef.current, interactionCanvasRef.current];

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
                
                canvases.forEach(canvas => {
                    if (canvas) {
                        canvas.width = width;
                        canvas.height = height;
                        canvas.style.width = `${width}px`;
                        canvas.style.height = `${height}px`;
                    }
                });
                
                loadAndDrawAllImages();
            }
        });

        resizeObserver.observe(container);

        const interactionCanvas = interactionCanvasRef.current;
        const handleLeave = (e: Event) => {
          handleMouseUp(e as unknown as React.MouseEvent);
          clearLongPressTimer();
          hideDeleteIcon();
        }

        if (interactionCanvas) {
          interactionCanvas.addEventListener('mouseleave', handleLeave);
        }


        return () => {
          resizeObserver.disconnect();
          if (interactionCanvas) {
            interactionCanvas.removeEventListener('mouseleave', handleLeave);
          }
        }
    }, [isPdf]); 
    
    useEffect(() => {
        contentRef.current = JSON.parse(JSON.stringify(initialContent)) || { lines: [], images: [], texts: [] }; // Deep copy
        if (!contentRef.current.texts) contentRef.current.texts = [];
        if (!contentRef.current.images) contentRef.current.images = [];
        if (!contentRef.current.lines) contentRef.current.lines = [];

        imageElementsRef.current.clear();
        loadAndDrawAllImages();
    }, [initialContent]);

    useEffect(() => {
        if (tool !== 'pointer') {
            deselectAll();
        }
        redrawAll();
        const cursor = tool === 'pointer' ? 'default' : (tool === 'text' ? 'text' : 'crosshair');
        if (interactionCanvasRef.current) {
          interactionCanvasRef.current.style.cursor = cursor;
        }
    }, [tool, onImageSelect]);

    useEffect(() => {
      redrawBackgroundCanvas();
    }, [theme, noteType, dimensions]); // Redraw background if theme or type changes

    useEffect(() => {
      if (isEditingText && selectedObjectId.current && textInputRef.current) {
        const textObject = getObjectById(selectedObjectId.current) as NoteText;
        if (textObject) {
          const input = textInputRef.current;
          input.value = textObject.text;
          input.style.left = `${textObject.x}px`;
          input.style.top = `${textObject.y}px`;
          input.style.width = `${textObject.width}px`;
          input.style.height = `${textObject.height}px`;
          input.style.fontSize = `${textObject.fontSize}px`;
          input.style.color = textObject.color;
          input.style.lineHeight = '1.2';
          input.style.fontFamily = 'sans-serif';
          input.focus();
        }
      }
    }, [isEditingText]);


    useImperativeHandle(ref, () => ({
      undo: () => {
        if (contentRef.current.lines.length > 0) {
          contentRef.current.lines.pop();
          isDirty.current = true;
          redrawDrawingCanvas();
          triggerContentChange();
        }
      },
      deleteSelectedObject: () => {
        if(selectedObjectId.current) {
            const id = selectedObjectId.current;
            contentRef.current.images = (contentRef.current.images || []).filter(img => img.id !== id);
            contentRef.current.texts = (contentRef.current.texts || []).filter(txt => txt.id !== id);
            selectedObjectId.current = null;
            isDirty.current = true;
            redrawAll();
            triggerContentChange();
            onImageSelect(false);
            onTextObjectSelect(null);
        }
      },
      addImage: (src: string) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const canvasWidth = objectCanvasRef.current?.width || 500;
            const scale = Math.min(1, ((canvasWidth) / 2) / img.width);
            const newImage: NoteImage = {
                id: `img-${Date.now()}`,
                src,
                x: 20,
                y: 20,
                width: img.width * scale,
                height: img.height * scale,
            };
            if(!contentRef.current.images) contentRef.current.images = [];
            contentRef.current.images.push(newImage);
            imageElementsRef.current.set(newImage.id, img);
            isDirty.current = true;
            redrawObjectCanvas();
            triggerContentChange();
        }
      },
      addText: (initialText = "نص جديد") => {
        const fontSize = 24;
        const color = theme === 'dark' ? '#FFFFFF' : '#000000';
        const { width, height } = measureText(initialText, fontSize);
        
        const newText: NoteText = {
          id: `txt-${Date.now()}`,
          text: initialText,
          x: 50,
          y: 50,
          width: width + 20, // padding
          height: height + 10, // padding
          fontSize: fontSize,
          color: color,
        };
        if(!contentRef.current.texts) contentRef.current.texts = [];
        contentRef.current.texts.push(newText);
        isDirty.current = true;
        redrawObjectCanvas();
        triggerContentChange();
        
        // Directly enter editing mode
        selectedObjectId.current = newText.id;
        setIsEditingText(true);
      },
      updateSelectedObject: (props: Partial<NoteObject>) => {
        if (!selectedObjectId.current) return;
        const object = getObjectById(selectedObjectId.current);
        if (object) {
          Object.assign(object, props);
          isDirty.current = true;
          redrawAll();
          triggerContentChange();
        }
      },
      getThumbnail: () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = dimensions.width;
        tempCanvas.height = dimensions.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return '';

        // Draw background
        tempCtx.fillStyle = theme === 'dark' ? '#1f2937' : '#ffffff'; 
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw lines if applicable
        if (backgroundCanvasRef.current) {
           tempCtx.drawImage(backgroundCanvasRef.current, 0, 0);
        }

        // Draw objects and drawings
        if(objectCanvasRef.current) {
            tempCtx.drawImage(objectCanvasRef.current, 0, 0);
        }
        if(drawingCanvasRef.current) {
            tempCtx.drawImage(drawingCanvasRef.current, 0, 0);
        }

        return tempCanvas.toDataURL('image/jpeg', 0.2);
      }
    }));
    
    return (
      <div 
        ref={containerRef} 
        className="w-full h-full relative touch-none overflow-hidden"
      >
        <canvas ref={backgroundCanvasRef} className="absolute inset-0 pointer-events-none" style={{zIndex:0}}/>
        <canvas ref={drawingCanvasRef} className="absolute inset-0 pointer-events-none" style={{zIndex:1}}/>
        <canvas ref={objectCanvasRef} className="absolute inset-0 pointer-events-none" style={{zIndex:2}}/>
        <canvas
          ref={interactionCanvasRef}
          className="absolute inset-0"
          style={{zIndex:3}}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
        {isEditingText && (
          <textarea
            ref={textInputRef}
            onBlur={handleTextInputBlur}
            className="absolute z-10 p-1 border border-blue-500 bg-transparent resize-none overflow-hidden focus:outline-none"
            style={{ zIndex: 4 }}
          />
        )}
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

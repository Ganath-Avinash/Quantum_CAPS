import React, { useState, useEffect, useRef } from 'react';
import { useAiTutorApi } from '../hooks/useAiTutorApi';
import type { CircuitContext } from '../hooks/useAiTutorApi';
import { QuantumMarkdownRenderer } from './QuantumMarkdownRenderer';
import { SchrodingerCat } from './SchrodingerCat';
import { FaPaperPlane, FaTimes, FaMagic, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CircuitCopilotSidebarProps {
  circuitContext: CircuitContext;
  isOpen: boolean;
  onClose: () => void;
  onApplyCode: (code: string) => void;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
  isCatInCopilot?: boolean;
  copilotWidth: number;
  setCopilotWidth: (width: number) => void;
}

export const CircuitCopilotSidebar: React.FC<CircuitCopilotSidebarProps> = ({ 
  circuitContext, 
  isOpen, 
  onClose, 
  onApplyCode, 
  anchorRef,
  isCatInCopilot,
  copilotWidth,
  setCopilotWidth
}) => {
  const isMobile = useIsMobile();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const rightEdgeRef = useRef<number>(0);

  const { askAi, explainCircuit, optimizeCircuit, detectMistakes, loading } = useAiTutorApi();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      // Width = distance from the cursor to the panel's own right edge,
      // captured once at drag-start (see onMouseDown below). Previously this
      // assumed the panel's right edge always sits at window.innerWidth,
      // which only holds if nothing (the app's own left nav sidebar, a
      // scrollbar, a centered/max-width layout container) ever offsets it —
      // any such offset made the computed width wrong by that whole amount,
      // which is what dragged the panel sharply to the left instead of
      // tracking the cursor.
      const newWidth = rightEdgeRef.current - e.clientX;
      // Constrain width
      if (newWidth > 300 && newWidth < 800) {
        setCopilotWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.cursor = 'default';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging, setCopilotWidth]);

  useEffect(() => {
    if (messages.length === 0) {
      if (circuitContext.gateCount === 0) {
        setMessages([{ role: 'assistant', content: "Start building your circuit and I can explain gates, suggest structures, and help you debug it." }]);
      } else {
        setMessages([{ role: 'assistant', content: "I can see your current circuit. What would you like to understand or improve?" }]);
      }
    }
  }, [circuitContext.gateCount, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    
    try {
      const res = await askAi(userMsg, circuitContext);
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I ran into an error connecting to my brain." }]);
    }
  };
  
  const handleAction = async (action: 'explain' | 'optimize' | 'mistakes') => {
    const actionText = action === 'explain' ? 'Explain Circuit' : action === 'optimize' ? 'Optimize Circuit' : 'Find Mistakes';
    setMessages(prev => [...prev, { role: 'user', content: actionText }]);
    try {
      let result;
      if (action === 'explain') result = await explainCircuit(circuitContext);
      else if (action === 'optimize') result = (await optimizeCircuit(circuitContext)).join('\n\n');
      else result = (await detectMistakes(circuitContext)).join('\n\n');
      
      setMessages(prev => [...prev, { role: 'assistant', content: result }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I failed to process the ${action} request.` }]);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent global playground shortcuts when typing in AI chat
    e.stopPropagation();
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  // renderMarkdown is handled by QuantumMarkdownRenderer
  const SidebarContent = (
    <div className="flex flex-col h-full bg-qp-card border-l border-qp-border text-qp-text overflow-hidden shadow-2xl z-20 relative">
      {/* Resize Handle */}
      <div
        ref={dragRef}
        onMouseDown={(e) => {
          const panel = e.currentTarget.parentElement;
          rightEdgeRef.current = panel ? panel.getBoundingClientRect().right : window.innerWidth;
          setIsDragging(true);
        }}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-zinc-400/40 z-50 transition-colors"
      />
      
      <div className="bg-zinc-50/90 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 font-medium text-sm text-zinc-900 dark:text-zinc-100 relative">
            <div ref={anchorRef} className="w-7 h-7 shrink-0 relative flex items-center justify-center">
              {isCatInCopilot && (
                <div className="absolute inset-0 pointer-events-none z-50 scale-95 flex items-center justify-center -top-2">
                  <SchrodingerCat state="thinking" />
                </div>
              )}
            </div>
            <span>Circuit Copilot</span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
            {circuitContext.qubits} qubits • {circuitContext.cbits} cbits • {circuitContext.gateCount} gates
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 p-1.5 rounded-lg transition-colors">
          <FaTimes className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/40 dark:bg-zinc-950/40 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div className="flex gap-2 overflow-x-auto pb-1 whitespace-nowrap mb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <button onClick={() => handleAction('explain')} className="text-xs bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 transition-colors font-medium shadow-sm">
            <FaInfoCircle className="text-zinc-600 dark:text-zinc-400 w-3 h-3" /> Explain
          </button>
          <button onClick={() => handleAction('optimize')} className="text-xs bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 transition-colors font-medium shadow-sm">
            <FaMagic className="text-zinc-600 dark:text-zinc-400 w-3 h-3" /> Optimize
          </button>
          <button onClick={() => handleAction('mistakes')} className="text-xs bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 transition-colors font-medium shadow-sm">
            <FaExclamationTriangle className="text-zinc-600 dark:text-zinc-400 w-3 h-3" /> Find Mistakes
          </button>
        </div>

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={cn(
              "max-w-[90%] p-3.5 rounded-2xl text-sm leading-relaxed",
              m.role === 'user' 
                ? "bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-br-sm shadow-sm" 
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-bl-sm text-zinc-900 dark:text-zinc-100 shadow-sm"
            )}>
              <div className="max-w-full overflow-hidden">
                <QuantumMarkdownRenderer content={m.content} onApplyCode={onApplyCode} />
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3 flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 shrink-0">
        <input 
          ref={inputRef}
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Ask about your circuit..." 
          className="flex-1 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-zinc-500 dark:focus:border-zinc-400 transition-colors text-sm placeholder:text-zinc-400"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || loading}
          className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 disabled:opacity-40 p-2.5 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <FaPaperPlane className="w-3 h-3" />
        </button>
      </form>
    </div>
  );

  if (!isOpen) return null;

  if (!isMobile) {
    return (
      <motion.div 
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: copilotWidth, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "h-full shrink-0 overflow-hidden relative",
          isDragging ? "pointer-events-none select-none" : ""
        )}
      >
        <div style={{ width: `${copilotWidth}px` }} className="h-full pointer-events-auto">
          {SidebarContent}
        </div>
      </motion.div>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l border-qp-border bg-qp-bg">
        {SidebarContent}
      </SheetContent>
    </Sheet>
  );
};

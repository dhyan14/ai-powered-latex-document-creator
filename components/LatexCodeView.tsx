
import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { OutputFormatType } from '../types';
import FormatToggle from './FormatToggle';

interface LatexCodeViewProps {
  latexCode: string; // Canonical, complete code
  onLatexCodeChange: (newCode: string) => void;
  onSelectionChange: (selectedText: string, start: number, end: number) => void;
  selectionStart: number | null; // Passed from App
  selectionEnd: number | null;   // Passed from App
  outputFormat: OutputFormatType;
  onFormatChange: (format: OutputFormatType) => void;
  isLoading: boolean;
}

// Consistent text styling for both textarea and the highlight div
const sharedTextStyles: CSSProperties = {
  fontFamily: "Menlo, Monaco, 'Courier New', monospace",
  fontSize: '0.875rem', // 14px, text-sm
  lineHeight: '1.25rem', // 20px
  padding: '1rem', // 16px, p-4
  whiteSpace: 'pre-wrap', // Handles newlines and wraps text
  wordWrap: 'break-word', // Ensure long words break
  boxSizing: 'border-box',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
};


const LatexCodeView: React.FC<LatexCodeViewProps> = ({ 
  latexCode, 
  onLatexCodeChange, 
  onSelectionChange,
  selectionStart,
  selectionEnd,
  outputFormat,
  onFormatChange,
  isLoading
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null); // For the custom highlight layer

  // displayedCode is what the user sees and interacts with in the textarea.
  // It's updated by user input or by the latexCode prop.
  const [displayedCode, setDisplayedCode] = useState<string>(latexCode);

  // State for textarea focus
  const [isTextareaFocused, setIsTextareaFocused] = useState<boolean>(false);

  // Effect to update displayedCode when the latexCode prop changes (e.g., from AI)
  useEffect(() => {
    // If the external latexCode prop changes and it's different from what's displayed,
    // update displayedCode. This handles updates from AI.
    // If latexCode prop changes as an echo of user input, displayedCode would already match.
    if (latexCode !== displayedCode) {
      setDisplayedCode(latexCode);
    }
  }, [latexCode]); // Only re-run if latexCode prop changes


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(latexCode); // Copy the canonical code
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy LaTeX code: ', err);
      alert('Failed to copy code. Please try manually.');
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = event.target.value;
    setDisplayedCode(newCode); // Update what's shown in the textarea immediately
    onLatexCodeChange(newCode); // Notify parent of the change
  };

  const handleSelect = (event: React.SyntheticEvent<HTMLTextAreaElement, Event>) => {
    const textarea = event.currentTarget;
    const currentSelectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    onSelectionChange(currentSelectedText, textarea.selectionStart, textarea.selectionEnd);
  };

  const handleFocus = () => setIsTextareaFocused(true);
  const handleBlur = () => setIsTextareaFocused(false);

  const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = event.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  };
  
  const showCustomHighlight = 
    !isTextareaFocused && 
    selectionStart !== null && 
    selectionEnd !== null && 
    selectionStart !== selectionEnd;

  // Effect to synchronize scroll position of highlight layer
  useEffect(() => {
    let timerId: number | undefined;
    let animationFrameId: number | undefined;

    if (showCustomHighlight && textareaRef.current && highlightRef.current) {
      // Use setTimeout to push to next event loop cycle, then rAF for paint timing
      timerId = window.setTimeout(() => {
        animationFrameId = window.requestAnimationFrame(() => {
          if (highlightRef.current && textareaRef.current) {
              highlightRef.current.scrollTop = textareaRef.current.scrollTop;
              highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
          }
        });
      }, 0);
    }

    return () => {
      if (timerId !== undefined) window.clearTimeout(timerId);
      if (animationFrameId !== undefined) window.cancelAnimationFrame(animationFrameId);
    };
  }, [showCustomHighlight, latexCode]); // Dependencies: re-sync if highlight appears or content changes


  const renderContentForHighlightLayer = () => {
    if (!showCustomHighlight || selectionStart === null || selectionEnd === null) return null;

    const sStart = selectionStart; 
    const sEnd = selectionEnd;

    // Use latexCode (canonical) for rendering highlight, as displayedCode might be momentarily different
    // if an AI update is very rapid. However, given the new useEffect, they should be in sync quickly.
    const codeToHighlight = latexCode; 

    const before = codeToHighlight.substring(0, sStart);
    const selected = codeToHighlight.substring(sStart, sEnd);
    const after = codeToHighlight.substring(sEnd);
    
    const renderPart = (text: string) => text;

    return (
      <>
        {renderPart(before)}
        <span style={{ 
            backgroundColor: 'rgba(96, 165, 250, 0.4)', 
            borderRadius: '3px', 
            }}>
          {renderPart(selected)}
        </span>
        {renderPart(after)}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 rounded-t-lg flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-slate-700">LaTeX Code (Editable)</h2>
        <div className="flex items-center space-x-4">
          <FormatToggle 
            currentFormat={outputFormat}
            onFormatChange={onFormatChange}
            isLoading={isLoading}
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
              ${copied 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
              }`}
            aria-label={copied ? "LaTeX code copied to clipboard" : "Copy LaTeX code to clipboard"}
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </div>

      <div 
        className="relative flex-grow bg-slate-900 rounded-b-lg" 
        style={{ minHeight: '300px' }} 
      >
        {showCustomHighlight && (
          <div
            ref={highlightRef}
            className="absolute inset-0 pointer-events-none overflow-auto" 
            style={{
              ...sharedTextStyles,
              color: 'transparent', 
              zIndex: 0, 
            }}
            aria-hidden="true"
          >
            {renderContentForHighlightLayer()}
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          value={displayedCode} 
          onChange={handleInputChange}
          onSelect={handleSelect}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onScroll={handleScroll} 
          className="text-slate-100 w-full h-full outline-none absolute inset-0 z-10"
          style={{
            ...sharedTextStyles,
            backgroundColor: 'transparent', 
            resize: 'none', 
            overflow: 'auto', 
          }}
          aria-label="Editable LaTeX code"
          spellCheck="false"
          role="textbox"
          aria-multiline="true"
        />
      </div>
    </div>
  );
};

export default LatexCodeView;

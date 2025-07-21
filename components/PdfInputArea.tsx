import React, { useRef, useCallback } from 'react';
import { ActiveActionType } from '../types';
import { useVoiceRecognition } from './useVoiceRecognition';
import MicrophoneButton from './MicrophoneButton';

interface PdfInputAreaProps {
  selectedPdfFileName: string | null;
  onPdfFileSelected: (file: File) => void;
  onClearPdf: () => void;
  pdfPrompt: string;
  setPdfPrompt: React.Dispatch<React.SetStateAction<string>>;
  onGenerateFromPdf: () => void;
  isLoading: boolean;
  activeActionType: ActiveActionType;
}

const PdfInputArea: React.FC<PdfInputAreaProps> = ({
  selectedPdfFileName,
  onPdfFileSelected,
  onClearPdf,
  pdfPrompt,
  setPdfPrompt,
  onGenerateFromPdf,
  isLoading,
  activeActionType,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAreaClick = () => {
    if (!selectedPdfFileName && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onPdfFileSelected(event.target.files[0]);
      event.target.value = ''; // Reset file input
    }
  };

  const handleTranscriptUpdate = useCallback((transcript: string) => {
    setPdfPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript).trim());
  }, [setPdfPrompt]);

  const { isListening, startListening, stopListening, browserSupported } = useVoiceRecognition(handleTranscriptUpdate);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const isButtonDisabled = isLoading || !selectedPdfFileName;
  const isGeneratingPdf = isLoading && activeActionType === 'generatePdf';

  const loadingSpinner = (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div>
      {!selectedPdfFileName ? (
        <div
          onClick={handleAreaClick}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0] && e.dataTransfer.files[0].type === 'application/pdf') {
              onPdfFileSelected(e.dataTransfer.files[0]);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md cursor-pointer hover:border-orange-500 transition-colors"
          aria-label="PDF dropzone"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAreaClick();}}
        >
          <div className="space-y-1 text-center">
            {/* Simple PDF Icon */}
            <svg className="mx-auto h-12 w-12 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm text-slate-600">
              <span className="font-medium text-orange-600 hover:text-orange-500">Click to upload PDF</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">Only .pdf files accepted</p>
          </div>
        </div>
      ) : (
        <div className="mt-2 relative p-3 border border-slate-300 rounded-md bg-slate-50">
          <p className="text-sm text-slate-700 truncate">
            Selected: <span className="font-medium">{selectedPdfFileName}</span>
          </p>
          <button
            onClick={onClearPdf}
            disabled={isLoading}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:bg-slate-300 transition-colors shadow"
            aria-label="Remove PDF file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="application/pdf"
        aria-hidden="true"
      />

      <div className="mt-4">
        <label htmlFor="pdfPrompt" className="block text-sm font-medium text-slate-700 mb-1">
          PDF-specific prompt (optional)
        </label>
        <div className="relative">
          <textarea
            id="pdfPrompt"
            value={pdfPrompt}
            onChange={(e) => setPdfPrompt(e.target.value)}
            placeholder="e.g., Summarize Chapter 1.&#10;Create a slide with key points from page 5.&#10;Extract all headings into a list."
            className="w-full h-40 p-3 pr-14 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-150 ease-in-out resize-y text-slate-700 placeholder-slate-400"
            disabled={isLoading}
            aria-label="Prompt for PDF content utilization"
          />
          {browserSupported && (
            <div className="absolute top-2.5 right-2.5">
              <MicrophoneButton
                isListening={isListening}
                onToggle={handleMicToggle}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onGenerateFromPdf}
        disabled={isButtonDisabled}
        className={`
          mt-6 w-full sm:w-auto flex items-center justify-center px-8 py-3 
          text-base font-medium rounded-md text-white 
          transition duration-150 ease-in-out transform hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
          ${isButtonDisabled
            ? 'bg-slate-400 cursor-not-allowed'
            : 'bg-orange-600 hover:bg-orange-700 shadow-md hover:shadow-lg'
          }
        `}
        aria-live="polite"
      >
        {isGeneratingPdf ? (
          <>{loadingSpinner} Generating...</>
        ) : (
          'Generate from PDF'
        )}
      </button>
       <p className="mt-3 text-xs text-slate-500">
        If no prompt is provided, the AI will attempt to summarize or extract key information from the PDF.
      </p>
    </div>
  );
};

export default PdfInputArea;
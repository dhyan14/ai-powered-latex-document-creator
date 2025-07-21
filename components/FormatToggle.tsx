
import React from 'react';
import { OutputFormatType } from '../types';

interface FormatToggleProps {
  currentFormat: OutputFormatType;
  onFormatChange: (format: OutputFormatType) => void;
  isLoading: boolean;
}

const FormatToggle: React.FC<FormatToggleProps> = ({ currentFormat, onFormatChange, isLoading }) => {
  const isBeamer = currentFormat === 'beamer';
  
  const baseButtonStyles = "relative z-10 flex-1 px-4 py-1.5 text-sm font-semibold transition-colors duration-300 ease-in-out focus:outline-none rounded-full";
  const selectedText = "text-slate-800";
  const unselectedText = "text-slate-500 hover:text-slate-700";

  return (
    <div className="flex items-center space-x-2">
       <span id="format-label" className="text-sm font-medium text-slate-600">Format:</span>
      <div 
        className="relative flex w-40 items-center rounded-full bg-slate-200 p-1"
        role="radiogroup"
        aria-labelledby="format-label"
      >
        <div
          className="absolute top-0 my-1 h-8 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out"
          style={{
            width: 'calc(50% - 4px)',
            left: isBeamer ? '4px' : 'calc(50% + 2px)',
          }}
          aria-hidden="true"
        />
        <button
          onClick={() => onFormatChange('beamer')}
          disabled={isLoading || isBeamer}
          className={`${baseButtonStyles} ${isBeamer ? selectedText : unselectedText} ${isLoading ? 'cursor-not-allowed' : ''}`}
          role="radio"
          aria-checked={isBeamer}
        >
          Beamer
        </button>
        <button
          onClick={() => onFormatChange('note')}
          disabled={isLoading || !isBeamer}
          className={`${baseButtonStyles} ${!isBeamer ? selectedText : unselectedText} ${isLoading ? 'cursor-not-allowed' : ''}`}
          role="radio"
          aria-checked={!isBeamer}
        >
          Note
        </button>
      </div>
    </div>
  );
};

export default FormatToggle;

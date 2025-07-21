
import React from 'react';

interface MicrophoneButtonProps {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ isListening, onToggle, disabled }) => {
  const buttonClasses = `
    p-2 rounded-full transition-all duration-200 ease-in-out transform
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${isListening 
      ? 'bg-red-600 text-white shadow-lg scale-110 focus:ring-red-500' 
      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:ring-blue-500'
    }
    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
  `;

  const title = isListening ? "Stop recording" : "Start voice typing";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={buttonClasses}
      title={title}
      aria-label={title}
      aria-pressed={isListening}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isListening && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="relative w-5 h-5">
          <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
          <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.75 6.75 0 1 1-13.5 0v-1.5A.75.75 0 0 1 6 10.5Z" />
        </svg>
      </div>
    </button>
  );
};

export default MicrophoneButton;

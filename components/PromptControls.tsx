import React from 'react';
import { ActiveActionType } from '../types'; // Import centralized type
import { useVoiceRecognition } from './useVoiceRecognition';
import MicrophoneButton from './MicrophoneButton';

interface PromptControlsProps {
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  onUpdate: () => void;
  onModifySelected: () => void;
  isLoading: boolean;
  isTextSelected: boolean;
  activeActionType: ActiveActionType;
}

const PromptControls: React.FC<PromptControlsProps> = ({ 
  prompt, 
  setPrompt, 
  onUpdate, 
  onModifySelected,
  isLoading,
  isTextSelected,
  activeActionType
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && prompt.trim()) {
        if (!isTextSelected) {
          onUpdate();
        }
      }
    }
  };

  const handleTranscriptUpdate = React.useCallback((transcript: string) => {
    setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript).trim());
  }, [setPrompt]);

  const { isListening, startListening, stopListening, browserSupported } = useVoiceRecognition(handleTranscriptUpdate);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const commonButtonStyles = "w-full sm:w-auto flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const loadingSpinner = (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  let modifyButtonTitle = "";
  if (isLoading) {
    modifyButtonTitle = "Processing your request...";
  } else if (!isTextSelected && !prompt.trim()) {
    modifyButtonTitle = "Select text in the editor and enter a modification prompt to enable this.";
  } else if (!isTextSelected) {
    modifyButtonTitle = "Select text in the editor to enable this option.";
  } else if (!prompt.trim()) {
    modifyButtonTitle = "Enter a prompt describing how to modify the selected text.";
  }


  return (
    <div>
      <div className="relative">
        <textarea
          id="userPrompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe document-wide changes, or select text in the editor and describe how to modify it here..."
          className="w-full h-40 p-3 pr-14 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out resize-y text-slate-700 placeholder-slate-400"
          disabled={isLoading}
          aria-label="User prompt for LaTeX modifications"
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
      <div className="mt-6 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <button
          onClick={onUpdate}
          disabled={isLoading || !prompt.trim()}
          className={`
            ${commonButtonStyles}
            focus:ring-blue-500
            ${isLoading || !prompt.trim()
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
            }
          `}
          aria-live="polite"
          title={!prompt.trim() ? "Enter a prompt to describe changes for the whole presentation." : "Update the entire presentation based on your prompt."}
        >
          {isLoading && activeActionType === 'update' ? ( <>{loadingSpinner} Updating...</> ) : ( 'Update Presentation' )}
        </button>
        <button
          onClick={onModifySelected}
          disabled={isLoading || !prompt.trim() || !isTextSelected}
          className={`
            ${commonButtonStyles}
            focus:ring-purple-500
            ${isLoading || !prompt.trim() || !isTextSelected
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg'
            }
          `}
          aria-live="polite"
          title={modifyButtonTitle}
        >
          {isLoading && activeActionType === 'modify' ? ( <>{loadingSpinner} Modifying...</> ) : ( 'Modify Selected Code' )}
        </button>
      </div>
       <p className="mt-4 text-xs text-slate-500">
        Tip: Select text in the editor on the left to enable "Modify Selected Code". Enter key in prompt defaults to "Update Presentation" if no text is selected. Use Shift+Enter for new line.
      </p>
    </div>
  );
};

export default PromptControls;
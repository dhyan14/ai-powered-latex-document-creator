import React, { useRef, useCallback } from 'react';
import { ActiveActionType } from '../types';
import { useVoiceRecognition } from './useVoiceRecognition';
import MicrophoneButton from './MicrophoneButton';

interface ImageInputAreaProps {
  pastedImage: string | null; // base64 data URL
  onImageFileSelected: (file: File) => void;
  onClearImage: () => void;
  imagePrompt: string;
  setImagePrompt: React.Dispatch<React.SetStateAction<string>>;
  onGenerateFromImage: () => void;
  isLoading: boolean;
  activeActionType: ActiveActionType;
}

const ImageInputArea: React.FC<ImageInputAreaProps> = ({
  pastedImage,
  onImageFileSelected,
  onClearImage,
  imagePrompt,
  setImagePrompt,
  onGenerateFromImage,
  isLoading,
  activeActionType,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAreaClick = () => {
    if (!pastedImage && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageFileSelected(event.target.files[0]);
      event.target.value = ''; // Reset file input
    }
  };

  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (isLoading) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          onImageFileSelected(file);
          event.preventDefault();
          return;
        }
      }
    }
  }, [onImageFileSelected, isLoading]);

  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const handleTranscriptUpdate = useCallback((transcript: string) => {
    setImagePrompt((prev) => (prev ? `${prev} ${transcript}` : transcript).trim());
  }, [setImagePrompt]);

  const { isListening, startListening, stopListening, browserSupported } = useVoiceRecognition(handleTranscriptUpdate);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const isButtonDisabled = isLoading || !pastedImage;
  const isGeneratingImage = isLoading && activeActionType === 'generateImage';

  const loadingSpinner = (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div>
      {!pastedImage ? (
        <div
          onClick={handleAreaClick}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              onImageFileSelected(e.dataTransfer.files[0]);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors"
          aria-label="Image dropzone"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAreaClick();}}
        >
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-slate-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">Or paste image anywhere (Ctrl+V)</p>
            <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      ) : (
        <div className="mt-2 relative">
          <img src={pastedImage} alt="Pasted preview" className="rounded-md max-h-60 w-auto mx-auto shadow-md" />
          <button
            onClick={onClearImage}
            disabled={isLoading}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 disabled:bg-slate-300 transition-colors shadow-lg"
            aria-label="Remove image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        accept="image/*"
        aria-hidden="true"
      />

      <div className="mt-4">
        <label htmlFor="imagePrompt" className="block text-sm font-medium text-slate-700 mb-1">
          Image-specific prompt (optional)
        </label>
        <div className="relative">
          <textarea
            id="imagePrompt"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="e.g., Describe this diagram.&#10;Create a slide explaining this chart.&#10;What are the key elements in this photo?"
            className="w-full h-40 p-3 pr-14 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-150 ease-in-out resize-y text-slate-700 placeholder-slate-400"
            disabled={isLoading}
            aria-label="Prompt for image modification"
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
        onClick={onGenerateFromImage}
        disabled={isButtonDisabled}
        className={`
          mt-6 w-full sm:w-auto flex items-center justify-center px-8 py-3 
          text-base font-medium rounded-md text-white 
          transition duration-150 ease-in-out transform hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
          ${isButtonDisabled
            ? 'bg-slate-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
          }
        `}
        aria-live="polite"
      >
        {isGeneratingImage ? (
          <>{loadingSpinner} Generating...</>
        ) : (
          'Generate Frame from Image'
        )}
      </button>
       <p className="mt-3 text-xs text-slate-500">
        If no prompt is provided, the AI will attempt to describe the image and create a suitable frame.
      </p>
    </div>
  );
};

export default ImageInputArea;
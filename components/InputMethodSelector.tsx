import React from 'react';
import { InputMethodType } from '../types';

interface InputMethodSelectorProps {
  selectedMethod: InputMethodType;
  onMethodChange: (method: InputMethodType) => void;
  isLoading: boolean;
}

const inputMethodOptions: { id: InputMethodType; label: string; ringColor: string; }[] = [
  { id: 'prompt', label: 'General Prompt', ringColor: 'focus-visible:ring-blue-500' },
  { id: 'image', label: 'From Image', ringColor: 'focus-visible:ring-green-500' },
  { id: 'pdf', label: 'From PDF', ringColor: 'focus-visible:ring-orange-500' },
];

const InputMethodSelector: React.FC<InputMethodSelectorProps> = ({ selectedMethod, onMethodChange, isLoading }) => {
  const commonButtonStyles = "flex-1 text-center px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100";

  return (
    <div>
      <label id="input-method-label" className="block text-lg font-semibold text-slate-700 mb-4">
        Input Method
      </label>
      <div 
        className="w-full bg-slate-100 p-1 rounded-xl flex items-center space-x-1"
        role="tablist"
        aria-labelledby="input-method-label"
      >
        {inputMethodOptions.map(({ id, label, ringColor }) => {
          const isSelected = selectedMethod === id;
          return (
            <button
              key={id}
              onClick={() => onMethodChange(id)}
              disabled={isLoading}
              className={`
                ${commonButtonStyles} 
                ${ringColor}
                ${isSelected ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900'}
                ${isLoading ? 'cursor-not-allowed opacity-60' : ''}
              `}
              role="tab"
              aria-selected={isSelected}
            >
              {label}
            </button>
          );
        })}
      </div>
      {/* Redundant help text removed as part of component merging. */}
    </div>
  );
};

export default InputMethodSelector;

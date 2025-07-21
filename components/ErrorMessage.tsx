
import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  const isApiKeyError = message.includes("API_KEY_MISSING");

  return (
    <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-md" role="alert">
      <div className="flex">
        <div className="py-1">
          <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M10 0a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-5h2V7h-2v6zm0 4h2v-2h-2v2z"/>
          </svg>
        </div>
        <div>
          <p className="font-bold">Error</p>
          <p className="text-sm">{message}</p>
          {isApiKeyError && (
            <p className="text-sm mt-1">
              Please ensure the <code className="bg-red-100 px-1 rounded">API_KEY</code> environment variable is correctly set up in your hosting environment. This app cannot function without it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;

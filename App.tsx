
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import PromptControls from './components/PromptControls';
import LatexCodeView from './components/LatexCodeView';
import ErrorMessage from './components/ErrorMessage';
import ImageInputArea from './components/ImageInputArea';
import PdfInputArea from './components/PdfInputArea';
import InputMethodSelector from './components/InputMethodSelector';
import { updateLatexDocument, rewriteSelectedLatex, generateLatexFromImageAndPrompt, generateLatexFromPdfAndPrompt, convertLatexFormat } from './services/geminiService';
import { compileLatexToPdf } from './services/latexCompilationService';
import { ActiveActionType, InputMethodType, OutputFormatType } from './types';

const initialLatexCode = `\\documentclass[aspectratio=169]{beamer}

\\definecolor{MyCyan}{RGB}{15, 130, 148}
\\definecolor{MyGreen}{rgb}{.125,.5,.25}
\\definecolor{MyRed}{RGB}{156, 3, 17}

\\usepackage{amsmath, amssymb}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{fancyhdr}
\\usepackage{hyperref}
\\usepackage{amsthm}
\\usepackage{tcolorbox}
\\usepackage{xcolor}
\\usepackage{gensymb}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.17}
\\usepackage{multicol}
\\usepackage{array}

\\setbeamertemplate{theorems}[numbered]
\\theoremstyle{definition}
\\newtheorem{exercise}{Exercise}
\\newtheorem{prob}{Problem}
\\newtheorem{exmp}{Example}
\\theoremstyle{remark}
\\newtheorem*{remark}{Remark}
\\newcommand{\\cosec}{\\text{cosec}}

\\title{My Presentation}
\\author{AI Assistant}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

% Add content below based on user prompts

\\end{document}`;

const App: React.FC = () => {
  const [latexCode, setLatexCode] = useState<string>(initialLatexCode);
  const [outputFormat, setOutputFormat] = useState<OutputFormatType>('beamer');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); // For Gemini operations
  const [error, setError] = useState<string | null>(null); // For Gemini errors
  const [activeActionType, setActiveActionType] = useState<ActiveActionType>(null);
  const [selectedInputMethod, setSelectedInputMethod] = useState<InputMethodType>('prompt');


  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>('');

  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [pdfMimeType, setPdfMimeType] = useState<string | null>(null);
  const [pdfPrompt, setPdfPrompt] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);

  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileError, setCompileError] = useState<string | null>(null);

  const clearErrors = () => {
    setError(null);
    setCompileError(null);
  };

  const handleLatexCodeChange = (newCode: string) => {
    setLatexCode(newCode);
  };

  const handleSelectionChange = useCallback((text: string, start: number, end: number) => {
    setSelectedText(text);
    setSelectionStart(start);
    setSelectionEnd(end);
  }, []);
  
  const clearSelection = () => {
    setSelectedText(null);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const clearImageState = useCallback(() => {
    setPastedImage(null);
    setImageMimeType(null);
    setImagePrompt('');
  }, []);

  const clearPdfState = useCallback(() => {
    setSelectedPdf(null);
    setPdfMimeType(null);
    setPdfPrompt('');
    setPdfFileName(null);
  }, []);

  const handleImageFileSelected = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type. Please select an image.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPastedImage(reader.result as string);
      setImageMimeType(file.type);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
      console.error('FileReader error');
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePdfFileSelected = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Invalid file type. Please select a PDF file.');
      return;
    }
    setError(null);
    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedPdf(reader.result as string);
      setPdfMimeType(file.type);
    };
    reader.onerror = () => {
      setError('Failed to read PDF file.');
      console.error('FileReader error for PDF');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFormatChange = useCallback(async (newFormat: OutputFormatType) => {
    if (newFormat === outputFormat || isLoading || isCompiling) return;

    setActiveActionType('convert');
    setIsLoading(true);
    clearErrors();
    clearSelection();

    try {
      const convertedCode = await convertLatexFormat(latexCode, newFormat);
      setLatexCode(convertedCode);
      setOutputFormat(newFormat);
    } catch (err: any) {
      if (err.message && err.message.startsWith('API_KEY_MISSING:')) {
        setError(err.message);
      } else {
        setError(`Failed to convert format: ${err.message || 'Unknown error'}`);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setActiveActionType(null);
    }
  }, [latexCode, outputFormat, isLoading, isCompiling]);

  const handleUpdatePresentation = useCallback(async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a prompt to update the presentation.');
      return;
    }

    setActiveActionType('update');
    setIsLoading(true);
    clearErrors();
    clearSelection(); 

    try {
      const updatedLatexCode = await updateLatexDocument(latexCode, userPrompt, outputFormat);
      setLatexCode(updatedLatexCode);
      setUserPrompt(''); 
    } catch (err: any) {
      if (err.message && err.message.startsWith('API_KEY_MISSING:')) {
        setError(err.message);
      } else {
        setError(`Failed to update presentation: ${err.message || 'Unknown error'}`);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setActiveActionType(null);
    }
  }, [userPrompt, latexCode, outputFormat]);

  const handleModifySelectedCode = useCallback(async () => {
    if (!selectedText || selectionStart === null || selectionEnd === null) {
      setError('No text selected to modify.');
      return;
    }
    if (!userPrompt.trim()) {
      setError('Please enter a prompt describing how to modify the selected text.');
      return;
    }
    
    setActiveActionType('modify');
    setIsLoading(true);
    clearErrors();

    try {
      const rewrittenSnippet = await rewriteSelectedLatex(selectedText, latexCode, userPrompt);
      
      const prefix = latexCode.substring(0, selectionStart);
      const suffix = latexCode.substring(selectionEnd);
      const updatedLatexCode = `${prefix}${rewrittenSnippet}${suffix}`;
      
      setLatexCode(updatedLatexCode);
      setUserPrompt('');
      clearSelection(); 
    } catch (err: any) {
       if (err.message && err.message.startsWith('API_KEY_MISSING:')) {
        setError(err.message);
      } else {
        setError(`Failed to modify selected code: ${err.message || 'Unknown error'}`);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setActiveActionType(null);
    }
  }, [userPrompt, latexCode, selectedText, selectionStart, selectionEnd]);

  const handleGenerateFrameFromImage = useCallback(async () => {
    if (!pastedImage || !imageMimeType) {
      setError('Please provide an image.');
      return;
    }

    setActiveActionType('generateImage');
    setIsLoading(true);
    clearErrors();
    clearSelection();

    try {
      const base64Data = pastedImage.split(',')[1];
      if (!base64Data) {
        throw new Error("Invalid image data format.");
      }

      const imageData = { data: base64Data, mimeType: imageMimeType };
      const updatedLatexCode = await generateLatexFromImageAndPrompt(latexCode, imageData, imagePrompt, outputFormat);
      setLatexCode(updatedLatexCode);
      clearImageState();
    } catch (err: any) {
      if (err.message && err.message.startsWith('API_KEY_MISSING:')) {
        setError(err.message);
      } else {
        setError(`Failed to generate from image: ${err.message || 'Unknown error'}`);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setActiveActionType(null);
    }
  }, [pastedImage, imageMimeType, imagePrompt, latexCode, clearImageState, outputFormat]);

  const handleGenerateFromPdf = useCallback(async () => {
    if (!selectedPdf || !pdfMimeType) {
      setError('Please select a PDF file.');
      return;
    }

    setActiveActionType('generatePdf');
    setIsLoading(true);
    clearErrors();
    clearSelection();

    try {
      const base64Data = selectedPdf.split(',')[1];
      if (!base64Data) {
        throw new Error("Invalid PDF data format.");
      }

      const pdfData = { data: base64Data, mimeType: pdfMimeType };
      const updatedLatexCode = await generateLatexFromPdfAndPrompt(latexCode, pdfData, pdfPrompt, outputFormat);
      setLatexCode(updatedLatexCode);
      clearPdfState();
    } catch (err: any) {
      if (err.message && err.message.startsWith('API_KEY_MISSING:')) {
        setError(err.message);
      } else {
        setError(`Failed to generate from PDF: ${err.message || 'Unknown error'}`);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setActiveActionType(null);
    }
  }, [selectedPdf, pdfMimeType, pdfPrompt, latexCode, clearPdfState, outputFormat]);

  const handleCompileAndDownload = useCallback(async () => {
    if (isLoading || isCompiling) return;
    
    setIsCompiling(true);
    clearErrors();

    try {
      const pdfBlob = await compileLatexToPdf(latexCode);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      setCompileError(err.message || 'An unknown error occurred during PDF compilation.');
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  }, [latexCode, isLoading, isCompiling]);


  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col selection:bg-blue-200">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row w-full max-w-7xl mx-auto p-4 space-y-4 md:space-y-0 md:space-x-4">
        {/* Left Pane: LaTeX Code View */}
        <div className="md:w-1/2 w-full flex flex-col bg-white shadow-xl rounded-lg">
          <LatexCodeView 
            latexCode={latexCode} 
            onLatexCodeChange={handleLatexCodeChange}
            onSelectionChange={handleSelectionChange}
            selectionStart={selectionStart}
            selectionEnd={selectionEnd}
            outputFormat={outputFormat}
            onFormatChange={handleFormatChange}
            isLoading={isLoading}
            isCompiling={isCompiling}
            onCompileAndDownload={handleCompileAndDownload}
          />
        </div>

        {/* Right Pane: Controls */}
        <div className="md:w-1/2 w-full space-y-6 flex flex-col md:sticky md:top-4 md:self-start md:max-h-[calc(100vh-2rem)] md:overflow-y-auto pb-4 custom-scrollbar">
          {/* Merged Input Controls Container */}
          <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8 space-y-6">
              <InputMethodSelector
                selectedMethod={selectedInputMethod}
                onMethodChange={setSelectedInputMethod}
                isLoading={isLoading || isCompiling}
              />

              <hr className="border-slate-200" />
              
              {selectedInputMethod === 'prompt' && (
                <PromptControls
                  prompt={userPrompt}
                  setPrompt={setUserPrompt}
                  onUpdate={handleUpdatePresentation}
                  onModifySelected={handleModifySelectedCode}
                  isLoading={isLoading || isCompiling}
                  isTextSelected={!!selectedText && selectedText.length > 0}
                  activeActionType={activeActionType}
                />
              )}
              {selectedInputMethod === 'image' && (
                <ImageInputArea
                  pastedImage={pastedImage}
                  onImageFileSelected={handleImageFileSelected}
                  onClearImage={clearImageState}
                  imagePrompt={imagePrompt}
                  setImagePrompt={setImagePrompt}
                  onGenerateFromImage={handleGenerateFrameFromImage}
                  isLoading={isLoading || isCompiling}
                  activeActionType={activeActionType}
                />
              )}
              {selectedInputMethod === 'pdf' && (
                <PdfInputArea
                  selectedPdfFileName={pdfFileName}
                  onPdfFileSelected={handlePdfFileSelected}
                  onClearPdf={clearPdfState}
                  pdfPrompt={pdfPrompt}
                  setPdfPrompt={setPdfPrompt}
                  onGenerateFromPdf={handleGenerateFromPdf}
                  isLoading={isLoading || isCompiling}
                  activeActionType={activeActionType}
                />
              )}
          </div>
          
          {error && <ErrorMessage message={error} />}
          {compileError && <ErrorMessage message={compileError} />}
        </div>
      </main>
      <footer className="w-full max-w-7xl mx-auto text-center py-6">
        <p className="text-sm text-slate-500">
          Powered by Gemini API. Ensure your API key is configured. PDF compilation by an external service.
        </p>
      </footer>
    </div>
  );
};

export default App;


import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { OutputFormatType } from '../types';

// Access API_KEY at the time of use
const ensureApiKey = () => {
  const currentApiKey = process.env.API_KEY; 
  if (!currentApiKey) {
    const errorMessage = "API_KEY_MISSING: The Gemini API key is not configured. Please ensure the API_KEY environment variable is set up.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return new GoogleGenAI({ apiKey: currentApiKey });
};

const cleanLatexResponse = (rawText: string | undefined): string => {
    if (!rawText || rawText.trim() === '') {
        console.warn("Received empty or undefined response from AI model.");
        throw new Error("Received empty response from AI model. Please try a different prompt or check model output.");
    }
    
    let finalLatexCode = rawText.trim();
    // Regex to remove common markdown code fences (latex, tex, or no language specified)
    const fenceRegex = /^```(?:latex|tex)?\s*\n?(.*?)\n?\s*```$/s;
    const match = finalLatexCode.match(fenceRegex);
    if (match && match[1]) {
      finalLatexCode = match[1].trim();
    }
    return finalLatexCode;
};

const handleApiError = (error: any): never => {
    console.error("Error calling Gemini API:", error);
    if (error.message && error.message.startsWith('API_KEY_MISSING:')) {
        throw error; 
    }
    if (error.message && error.message.includes('API key not valid')) {
        throw new Error("Invalid API Key. Please check your API_KEY environment variable.");
    }
    if (error.message && error.message.toLowerCase().includes('quota')) {
        throw new Error("API Quota Exceeded. Please check your Gemini API usage and limits.");
    }
    if (error.message && (error.message.toLowerCase().includes('model_error') || error.message.toLowerCase().includes('candidate error') || error.message.toLowerCase().includes('safety settings') || error.message.toLowerCase().includes('blocked') )) {
        throw new Error("The AI model encountered an issue processing your request (e.g. safety settings, content policy, model error). Please try a different prompt or modify your content.");
    }
    throw new Error(`AI generation failed: ${error.message || 'Unknown error during API call'}`);
}

export const convertLatexFormat = async (currentLatexCode: string, targetFormat: OutputFormatType): Promise<string> => {
  const ai = ensureApiKey();
  const sourceFormat = targetFormat === 'beamer' ? 'article' : 'beamer';

  const systemPromptInstruction = `You are an expert in academic writing and presentation, specializing in converting between LaTeX Beamer presentations and LaTeX Article-style lecture notes.
Your task is to transform a given LaTeX document from a source format to a target format, not just by changing commands, but by thoughtfully adapting the content and structure for the new medium.
The source format is '${sourceFormat}' and the target format is '${targetFormat}'.
You will be given the full LaTeX code.

**General Rules:**
- Your output MUST be ONLY the raw, complete, and compilable LaTeX code for the new format.
- Do not include any explanatory text or markdown formatting (like \`\`\`latex ... \`\`\`).
- Return the entire document from \`\\documentclass\` to \`\\end{document}\`.
- Preserve the core content and technical information (like mathematical equations) accurately.

**Conversion from 'beamer' to 'article' (Lecture Notes):**
Your goal is to create a readable, self-contained document that feels like comprehensive lecture notes, not just a transcript of slides.
- **Document Class:** Change \`\\documentclass[...]{beamer}\` to \`\\documentclass{article}\`.
- **Preamble:** Remove Beamer-specific packages and commands (e.g., \\usetheme, \\setbeamertemplate, \\logo). Retain essential packages (amsmath, graphicx, etc.).
- **Title:** Convert the title page frame (\`\\begin{frame}\\titlepage\\end{frame}\`) to a standard \`\\maketitle\` command right after \`\\begin{document}\`.
- **Structure and Content Adaptation:**
    - Convert each \`\\begin{frame}\` into a logical \`\\section{}\` or \`\\subsection{}\`. Use the \`\\frametitle\` for the section heading.
    - **Crucially, expand on the bullet points.** Transform concise slide points (\`\\itemize\`) into full, explanatory sentences and paragraphs. Add transitional phrases to ensure a smooth narrative flow. For example, a bullet point like "Faster processing" could become a sentence like "One of the key advantages of this method is its significantly faster processing time compared to previous approaches."
    - Combine closely related frames into a single, cohesive section if it improves readability.
    - Reformat content to be more text-heavy and descriptive. What was a two-column layout on a slide might become a single paragraph followed by an example.

**Conversion from 'article' to 'beamer' (Presentation):**
Your goal is to create a dynamic, visually clear presentation that highlights key information, not just a copy-paste of the article text onto slides.
- **Document Class:** Change \`\\documentclass[...]{article}\` to \`\\documentclass[aspectratio=169]{beamer}\`.
- **Preamble:** Add a standard, clean Beamer preamble. You can use the one from the application's initial code as a reference.
- **Title:** Convert the \`\\maketitle\` command into a title page frame: \`\\begin{frame}\\titlepage\\end{frame}\`.
- **Structure and Content Adaptation:**
    - **Summarize and Condense:** Break down long paragraphs and sections into key, digestible points. Use \`\\itemize\` or \`\\enumerate\` to present lists. Do not put walls of text on a single slide.
    - **Split Content:** A single long \`\\section{}\` from the article might need to be split into multiple, focused \`\\begin{frame}\`s. Each frame should have a clear purpose and a descriptive \`\\frametitle\`. For example, one section discussing a concept's definition, advantages, and disadvantages could become three separate frames.
    - **Visualize:** Where appropriate, use Beamer's \`columns\` environment to structure content visually on a slide.
    - **Focus on Keywords:** The text on the slides should be concise, focusing on keywords and core concepts that a presenter would expand upon verbally.`;

  const userPromptContent = `Convert the following LaTeX code from ${sourceFormat} to ${targetFormat}:\n\n${currentLatexCode}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: userPromptContent,
      config: {
        systemInstruction: systemPromptInstruction,
      }
    });
    return cleanLatexResponse(response.text);
  } catch (error) {
    handleApiError(error);
  }
};

export const updateLatexDocument = async (currentLatexCode: string, userInstruction: string, outputFormat: OutputFormatType): Promise<string> => {
  const ai = ensureApiKey();

  const formatDescription = outputFormat === 'beamer' ? 'LaTeX Beamer presentation' : 'LaTeX article-style note document';
  const structureElement = outputFormat === 'beamer' ? '\\begin{frame} ... \\end{frame}, with frame titles using \\frametitle{}' : '\\section{}, \\subsection{}';
  const documentClass = outputFormat === 'beamer' ? '\\documentclass{beamer}' : '\\documentclass{article}';

  const systemPromptInstruction = `You are an expert LaTeX editor for ${formatDescription}s.
You will be given an existing LaTeX code and a user instruction.
Your task is to modify the given LaTeX code based on the user's instruction and return the COMPLETE, updated, and compilable LaTeX code.
PRESERVE THE EXISTING PREAMBLE AND DOCUMENT STRUCTURE UNLESS THE USER SPECIFICALLY ASKS TO CHANGE IT.
Ensure all necessary document structure elements (like ${structureElement}) are correctly maintained for a compilable document.
The output MUST be ONLY the raw LaTeX code. Do not include any explanatory text, markdown formatting (like \`\`\`latex ... \`\`\`).
The final code must start with \`${documentClass}\` (or similar, e.g., with options) and end with \`\\end{document}\`.
If the user asks for something that requires a package not currently in the preamble (e.g., specific table formatting), add the necessary package to the preamble if it's a common one.
Critically, ensure you return the *entire document content*. Do not return only the changed snippet; the complete, runnable LaTeX document is required.`;

  const userPromptContent = `Existing LaTeX Code:\n${currentLatexCode}\n\nUser instruction for modification:\n${userInstruction}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: userPromptContent,
      config: {
        systemInstruction: systemPromptInstruction,
      }
    });
    return cleanLatexResponse(response.text);
  } catch (error) {
    handleApiError(error);
  }
};

export const rewriteSelectedLatex = async (selectedSnippet: string, fullLatexContext: string, userInstruction: string): Promise<string> => {
  const ai = ensureApiKey();

  const systemPromptInstruction = `You are an expert LaTeX editor.
You will be given a snippet of selected LaTeX code, the full LaTeX document context it came from, and a user instruction on how to modify ONLY that snippet.
Your task is to rewrite ONLY the provided 'Selected LaTeX snippet' based on the 'User instruction for the snippet'.
The output MUST be ONLY the modified LaTeX snippet. Do NOT return the full document. Do NOT include any explanatory text or markdown formatting (like \`\`\`latex ... \`\`\` marks).
Ensure the rewritten snippet is valid LaTeX and makes sense in the context of the original document, but ONLY return the rewritten snippet itself.
For example, if the selected snippet is "\\textbf{Hello}" and the instruction is "make it italic", you should return "\\textit{Hello}".
If the instruction is to "delete this", return an empty string or appropriate LaTeX comment if deletion is complex.
If the instruction is to "replace this with a table of X and Y", create only the LaTeX for that table.`;
  
  const userPromptContent = `Full LaTeX Document Context:\n${fullLatexContext}\n\nSelected LaTeX snippet to modify:\n${selectedSnippet}\n\nUser instruction for the snippet:\n${userInstruction}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: userPromptContent,
      config: {
        systemInstruction: systemPromptInstruction,
      }
    });
    return cleanLatexResponse(response.text);
  } catch (error) {
    handleApiError(error);
  }
};

interface FileData { // Renamed from ImageData to be more generic
  data: string; // base64 encoded string
  mimeType: string;
}

export const generateLatexFromImageAndPrompt = async (currentLatexCode: string, imageData: FileData, imageInstruction: string, outputFormat: OutputFormatType): Promise<string> => {
  const ai = ensureApiKey();
  
  const formatDescription = outputFormat === 'beamer' ? 'LaTeX Beamer presentation' : 'LaTeX article-style note document';
  const integrationInstruction = outputFormat === 'beamer'
    ? 'Integrate this new content seamlessly into the existing LaTeX Beamer code. Usually, this means adding a new \\begin{frame} ... \\end{frame} block before the final \\end{document} command.'
    : 'Integrate this new content seamlessly into the existing LaTeX article. Usually, this means adding a new \\section{...} or \\subsection{...} block before the final \\end{document} command.';
  const titleInstruction = 'Create a relevant title for the frame or section.';
  const newContentDescription = outputFormat === 'beamer' ? 'a new frame' : 'a new section';


  const systemPromptForImage = `You are an expert ${formatDescription} creator, specializing in integrating visual information.
You will be given:
1. An existing LaTeX code for a ${formatDescription}.
2. An image.
3. An optional user prompt related to the image.

Your task is to:
1. Analyze the image.
2. Consider the user's optional prompt for guidance (e.g., "Describe this diagram," "Create a slide explaining this chart"). If the prompt is empty, use your best judgment to create relevant content.
3. Generate new LaTeX content (typically ${newContentDescription}) based on the image and the prompt.
4. ${integrationInstruction}
5. Return the COMPLETE, updated, and compilable LaTeX code.

PRESERVE THE EXISTING PREAMBLE AND DOCUMENT STRUCTURE.
When including an image, use a placeholder like "\\includegraphics[width=0.8\\textwidth]{placeholder_image.png}". ${titleInstruction}
The output MUST be ONLY the raw LaTeX code. Do not include any explanatory text or markdown formatting.
Critically, ensure you return the *entire document content*, from \`\\documentclass\` to \`\\end{document}\`.`;

  const imagePart = {
    inlineData: {
      mimeType: imageData.mimeType,
      data: imageData.data,
    },
  };

  const textPromptForImage = `Current LaTeX Code:\n${currentLatexCode}\n\nUser instruction for image (optional):\n${imageInstruction || `No specific instruction. Analyze the image and generate a relevant ${newContentDescription} based on it, integrating it into the current LaTeX code.`}`;
  const textPart = { text: textPromptForImage };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: [textPart, imagePart] }, // Text part provides context before image
      config: {
        systemInstruction: systemPromptForImage,
      },
    });
    return cleanLatexResponse(response.text);
  } catch (error) {
    handleApiError(error);
  }
};

export const generateLatexFromPdfAndPrompt = async (currentLatexCode: string, pdfData: FileData, pdfInstruction: string, outputFormat: OutputFormatType): Promise<string> => {
  const ai = ensureApiKey();

  const formatDescription = outputFormat === 'beamer' ? 'LaTeX Beamer presentation' : 'LaTeX article-style note document';
  const integrationInstruction = outputFormat === 'beamer'
    ? 'This usually means adding new \\begin{frame} ... \\end{frame} blocks before the final \\end{document} command.'
    : 'This usually means adding new \\section{...} or \\subsection{...} blocks before the final \\end{document} command.';
  const newContentDescription = outputFormat === 'beamer' ? 'new frames' : 'new sections';

  const systemPromptForPdf = `You are an expert ${formatDescription} creator, specializing in incorporating content from PDF documents.
You will be given:
1. An existing LaTeX code for a ${formatDescription}.
2. A PDF document.
3. An optional user prompt related to the PDF content.

Your task is to:
1. Analyze the content of the PDF document.
2. Consider the user's prompt for guidance (e.g., "Summarize chapter 2 into a new slide," "Create three ${newContentDescription} covering the main topics"). If the prompt is empty, summarize or extract key information from the PDF.
3. Generate new LaTeX content (e.g., ${newContentDescription}, bullet points, summaries) based on the PDF and the prompt.
4. Integrate this new content seamlessly into the existing LaTeX code. ${integrationInstruction}
5. Return the COMPLETE, updated, and compilable LaTeX code.

PRESERVE THE EXISTING PREAMBLE AND DOCUMENT STRUCTURE. Frame/section titles should be relevant.
The output MUST be ONLY the raw LaTeX code. Do not include any explanatory text or markdown formatting.
If the PDF contains images you cannot translate, describe them or extract related text.
Critically, ensure you return the *entire document content*, from \`\\documentclass\` to \`\\end{document}\`.`;

  const pdfFilePart = {
    inlineData: {
      mimeType: pdfData.mimeType, // Should be 'application/pdf'
      data: pdfData.data,
    },
  };

  const textPromptForPdf = `Current LaTeX Code:\n${currentLatexCode}\n\nUser instruction for PDF (optional):\n${pdfInstruction || `No specific instruction. Analyze the PDF and generate relevant ${newContentDescription} based on its content, integrating it into the current LaTeX code.`}`;
  const textPart = { text: textPromptForPdf };
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME, // Ensure this model supports PDF input with inlineData
      contents: { parts: [textPart, pdfFilePart] }, // Order might matter; context first.
      config: {
        systemInstruction: systemPromptForPdf,
      },
    });
    return cleanLatexResponse(response.text);
  } catch (error) {
    handleApiError(error);
  }
};

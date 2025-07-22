
/**
 * Compiles LaTeX code to a PDF using the public texlive.net API.
 * This version uses FormData to send the request, which is often more
 * compatible with CGI scripts than URL-encoded data.
 * @param latexCode The full string of LaTeX code.
 * @returns A promise that resolves to a PDF blob.
 * @throws An error with compilation logs if the compilation fails.
 */
export const compileLatexToPdf = async (latexCode: string): Promise<Blob> => {
  const apiEndpoint = 'https://texlive.net/cgi-bin/latexcgi';

  // Use FormData to construct the request body.
  // This sends data as 'multipart/form-data', which is robust for file-like content.
  const formData = new FormData();
  formData.append('filecontents', latexCode);
  formData.append('engine', 'pdflatex');
  formData.append('return_type', 'pdf');

  let response;
  try {
    response = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData, // The browser will set the 'Content-Type' header automatically.
    });
  } catch (error: any) {
    console.error('Network error during PDF compilation request:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Network Error: Could not connect to the PDF compilation service. Please check your internet connection or the service status.'
      );
    }
    throw new Error(
      `An unexpected network error occurred while contacting the compilation service: ${error.message}`
    );
  }

  // The texlive.net service returns 200 OK even on compilation failure,
  // but with a different Content-Type (e.g., text/html for logs).
  if (!response.ok) {
     const errorBody = await response.text().catch(() => 'Could not read error body.');
     throw new Error(
      `The compilation service returned a server error: ${response.status} ${response.statusText}. Response: ${errorBody}`
    );
  }

  const contentType = response.headers.get('content-type');
  const blob = await response.blob();

  if (contentType && contentType.includes('application/pdf')) {
    // Success! We have a PDF.
    return blob;
  } else {
    // Failure. The blob is likely an HTML page with the compilation log.
    const logHtml = await blob.text();
    
    // Try to extract a more user-friendly error from the HTML's <pre> tag.
    const preMatch = logHtml.match(/<pre>([\s\S]*?)<\/pre>/);
    let logText = preMatch && preMatch[1] 
      ? preMatch[1] 
      : 'Could not extract a specific log. The full response is likely an HTML error page from the service.';
    
    // Sanitize HTML entities from the extracted log for better readability
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = logText;
    const sanitizedLog = tempDiv.textContent || tempDiv.innerText || logText;

    console.error("LaTeX Compilation Failed. Log:", sanitizedLog);
    throw new Error(`LaTeX Compilation Failed. Log:\n\n${sanitizedLog.trim()}`);
  }
};

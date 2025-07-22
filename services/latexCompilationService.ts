
/**
 * Compiles LaTeX code to a PDF using the public texlive.net API.
 * @param latexCode The full string of LaTeX code.
 * @returns A promise that resolves to a PDF blob.
 * @throws An error with compilation logs if the compilation fails.
 */
export const compileLatexToPdf = async (latexCode: string): Promise<Blob> => {
  // Using texlive.net's public CGI script, which supports CORS.
  // This is more robust than using a generic CORS proxy.
  const apiEndpoint = 'https://texlive.net/cgi-bin/latexcgi';

  const params = new URLSearchParams();
  params.append('filecontents', latexCode);
  params.append('engine', 'pdflatex');
  params.append('return_type', 'pdf');

  let response;
  try {
    response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
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

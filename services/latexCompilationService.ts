
/**
 * Compiles LaTeX code to a PDF using a public API, routed through a CORS proxy.
 * @param latexCode The full string of LaTeX code.
 * @returns A promise that resolves to a PDF blob.
 * @throws An error with compilation logs if the compilation fails.
 */
export const compileLatexToPdf = async (latexCode: string): Promise<Blob> => {
  // Switched to latexonline.cc, a more stable public compilation service.
  // The previous service (rtex.probablya.dev) was returning internal server errors.
  // This service directly returns a PDF on success or a log file on failure.
  const corsProxyPrefix = 'https://api.allorigins.win/raw?url=';
  const latexOnlineEndpoint = 'https://latexonline.cc/compile';
  const apiEndpoint = `${corsProxyPrefix}${encodeURIComponent(latexOnlineEndpoint)}`;

  const formData = new FormData();
  formData.append('text', latexCode);
  formData.append('command', 'pdflatex'); // Use pdflatex compiler

  let response;
  try {
    response = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData, // The browser will automatically set the Content-Type to multipart/form-data
    });
  } catch (error: any) {
    console.error('Network error during PDF compilation request via proxy:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Network Error: Could not connect to the PDF compilation service. This could be due to your internet connection, a network block, or the proxy/compilation service being temporarily down.'
      );
    }
    throw new Error(
      `An unexpected error occurred while contacting the compilation service: ${error.message}`
    );
  }

  // latexonline.cc returns 200 OK for both success (PDF) and failure (log file).
  // We need to inspect the Content-Type header to determine the outcome.
  if (!response.ok) {
     const errorBody = await response.text().catch(() => 'Could not read error body.');
     throw new Error(
      `The compilation service or proxy returned an error: ${response.status} ${response.statusText}. Response: ${errorBody}`
    );
  }

  const contentType = response.headers.get('content-type');
  const blob = await response.blob();

  if (contentType && contentType.includes('application/pdf')) {
    // Success! We have a PDF.
    return blob;
  } else if (contentType && (contentType.includes('text/plain') || contentType.includes('text/html'))) {
    // Failure. The blob is likely a log file.
    const logText = await blob.text();
    
    // Check if the content is an error from the proxy itself
    if (logText.toLowerCase().includes("allorigins") || logText.toLowerCase().includes("proxy")) {
      console.error("Proxy error response:", logText);
      throw new Error("The CORS proxy returned an error page instead of a compilation result. The compilation service may be unavailable or blocked.");
    }
    
    // Assume it's a LaTeX compilation log
    throw new Error(`LaTeX Compilation Failed. Log:\n\n${logText}`);
  } else {
    // Unexpected response type. Could be a proxy error page with a different content type.
     const fallbackText = await blob.text().catch(() => "Could not read response body.");
     console.error(`Unexpected response from compilation service. Content-Type: ${contentType || 'N/A'}. Body:`, fallbackText);
    throw new Error(
      `Unexpected response from compilation service. It may be down or have changed its output format. (Content-Type: ${contentType || 'N/A'})`
    );
  }
};

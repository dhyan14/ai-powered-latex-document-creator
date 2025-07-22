
/**
 * Compiles LaTeX code to a PDF using a public API, routed through a CORS proxy.
 * @param latexCode The full string of LaTeX code.
 * @returns A promise that resolves to a PDF blob.
 * @throws An error with compilation logs if the compilation fails.
 */
export const compileLatexToPdf = async (latexCode: string): Promise<Blob> => {
  // Switched to a different CORS proxy to improve reliability, as public proxies can be unstable or blocked.
  // This proxy requires URL encoding of the target URL.
  const corsProxyPrefix = 'https://api.allorigins.win/raw?url=';
  const rtexEndpoint = 'https://rtex.probablya.dev/api/v2/tex';
  const apiEndpoint = `${corsProxyPrefix}${encodeURIComponent(rtexEndpoint)}`;
  
  let compileResponse;

  try {
    // First API call to submit the code for compilation
    compileResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: latexCode,
        format: 'pdf',
      }),
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

  if (!compileResponse.ok) {
    const errorBody = await compileResponse.text().catch(() => 'Could not read error body.');
    // The proxy may return specific statuses for upstream issues.
    if (compileResponse.status >= 500) {
       throw new Error(
        `The PDF compilation service or the CORS proxy appears to be down. (Proxy reported status: ${compileResponse.status} ${compileResponse.statusText})`
      );
    }
    throw new Error(
      `The compilation service returned an error: ${compileResponse.status} ${compileResponse.statusText}. Response: ${errorBody}`
    );
  }

  const result = await compileResponse.json().catch(async () => {
    // If parsing fails, it might be an error page from the proxy.
    const textResponse = await compileResponse.text().catch(() => '');
    console.error('Failed to parse JSON response from compilation service. Raw response:', textResponse);
    throw new Error('Failed to parse response from compilation service. The proxy may have returned a non-JSON error page.');
  });


  if (result.status === 'error') {
    let errorLog = 'No log available.';
    if (result.log) {
      try {
        // The log is Base64 encoded.
        errorLog = atob(result.log);
      } catch (e) {
        console.error('Failed to decode Base64 log:', e);
        errorLog = 'Could not decode the error log.';
      }
    }
    // The log will be displayed as plain text, so newlines are important.
    throw new Error(`LaTeX Compilation Failed. Log:\n\n${errorLog}`);
  }

  if (result.status !== 'success' || !result.filename) {
    throw new Error('Compilation service returned an unexpected response.');
  }

  // Second API call to download the resulting PDF, also through the proxy
  const rtexPdfUrl = `https://rtex.probablya.dev/api/v2/l/${result.filename}`;
  const pdfUrl = `${corsProxyPrefix}${encodeURIComponent(rtexPdfUrl)}`;
  let pdfResponse;

  try {
    pdfResponse = await fetch(pdfUrl);
  } catch (error: any) {
    console.error('Network error during PDF download request via proxy:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Network Error: Could not download the compiled PDF. The proxy may be down or your connection blocked.'
      );
    }
    throw new Error(
      `An unexpected error occurred while downloading the PDF: ${error.message}`
    );
  }

  if (!pdfResponse.ok) {
    throw new Error(
      `Failed to download the compiled PDF. Status: ${pdfResponse.status} ${pdfResponse.statusText}`
    );
  }

  const pdfBlob = await pdfResponse.blob();
  if (pdfBlob.type !== 'application/pdf') {
     // The proxy might return an HTML error page with a 200 OK, so check content type.
    const textContent = await pdfBlob.text().catch(()=>"");
    if(textContent.toLowerCase().includes("proxy") || textContent.toLowerCase().includes("error")) { // Generic check for proxy error page
        throw new Error("The CORS proxy returned an error page instead of a PDF. The compiled file may have expired or the proxy failed.");
    }
    throw new Error(`Downloaded file is not a PDF (was ${pdfBlob.type}). The proxy service may have failed or returned an error page.`);
  }
  
  return pdfBlob;
};
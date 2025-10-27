// Download Test Utility
// Add this to browser console to test download functionality

const testDownload = async (url, filename) => {
  console.log('=== TESTING DOWNLOAD ===');
  console.log('URL:', url);
  console.log('Filename:', filename);
  
  try {
    // Method 1: Fetch + Blob
    console.log('Testing Method 1: Fetch + Blob');
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('Blob created:', blob.size, 'bytes, type:', blob.type);
    
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'test-file';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(blobUrl);
    console.log('Method 1: SUCCESS');
    
  } catch (error) {
    console.error('Method 1 failed:', error);
    
    // Method 2: Direct anchor
    console.log('Testing Method 2: Direct Anchor');
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'test-file';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Method 2: SUCCESS');
    } catch (error2) {
      console.error('Method 2 failed:', error2);
      console.log('Opening in new tab as fallback');
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
};

// Test with different URLs
console.log('Available test functions:');
console.log('testDownload("https://via.placeholder.com/150x150.png", "test-image.png")');
console.log('testDownload("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "test.pdf")');

// Export for use
window.testDownload = testDownload;

// Network utility for handling connectivity issues
export const networkUtils = {
  // Check if we're in a browser environment
  isBrowser: () => typeof window !== 'undefined',
  
  // Check network connectivity with fallback
  async checkConnectivity() {
    if (!this.isBrowser()) return false;
    
    try {
      // Try multiple endpoints for better reliability
      const endpoints = [
        'https://api.github.com/zen',
        'https://httpbin.org/status/200',
        'https://jsonplaceholder.typicode.com/posts/1'
      ];
      
      const promises = endpoints.map(url => 
        fetch(url, { 
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }).then(response => response.ok)
      );
      
      // If any endpoint responds successfully, we have connectivity
      const results = await Promise.allSettled(promises);
      return results.some(result => result.status === 'fulfilled' && result.value === true);
    } catch (error) {
      console.warn('Connectivity check failed:', error);
      return navigator.onLine; // Fallback to browser's online status
    }
  },
  
  // Wait for network to be available
  async waitForNetwork(maxWaitTime = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      if (await this.checkConnectivity()) {
        return true;
      }
      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return false;
  },
  
  // Retry function with exponential backoff
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

export default networkUtils;
export async function checkServiceHealth(url) {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        status: 'online',
        responseTime,
        message: `HTTP ${response.status}`
      };
    } else {
      return {
        status: 'degraded',
        responseTime,
        message: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      return {
        status: 'timeout',
        responseTime: 10000,
        message: 'Timeout después de 10s'
      };
    }
    
    return {
      status: 'offline',
      responseTime,
      message: error.message
    };
  }
}

import { exec } from 'child_process';
import { promisify } from 'util';
import dns from 'dns';
import tls from 'tls';
import net from 'net';
import process from 'process';

const execAsync = promisify(exec);

// Check HTTP/HTTPS endpoint
export async function checkHttp(url) {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseGuard/1.0'
      }
    });
    
    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        status: 'online',
        responseTime,
        message: `HTTP ${response.status} - OK`,
        statusCode: response.status
      };
    } else if (response.status >= 500) {
      return {
        status: 'offline',
        responseTime,
        message: `HTTP ${response.status} - Server Error`,
        statusCode: response.status
      };
    } else {
      return {
        status: 'degraded',
        responseTime,
        message: `HTTP ${response.status} - ${response.statusText}`,
        statusCode: response.status
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      return {
        status: 'timeout',
        responseTime: 30000,
        message: 'Timeout - No response in 30s',
        statusCode: null
      };
    }
    
    return {
      status: 'offline',
      responseTime,
      message: `Error: ${error.message}`,
      statusCode: null
    };
  }
}

// Check Ping (ICMP)
export async function checkPing(host) {
  const startTime = Date.now();

  try {
    // Use system ping command
    const platform = process.platform;
    const pingCmd = platform === 'win32'
      ? `ping -n 1 -w 5000 ${host}`
      : `ping -c 1 -W 5 ${host}`;

    console.log(`[Ping] Executing: ${pingCmd}`);

    // eslint-disable-next-line no-unused-vars
    const { stdout, _stderr } = await execAsync(pingCmd);
    const responseTime = Date.now() - startTime;

    console.log(`[Ping] stdout for ${host}:`, stdout);

    // Parse ping output to extract time (handle both time= and time< formats)
    const timeMatch = stdout.match(/time[=<>]([\d.]+)\s*ms/i);
    const pingTime = timeMatch ? parseFloat(timeMatch[1]) : responseTime;

    // Check for successful ping indicators
    const hasSuccessIndicator = stdout.includes('TTL') ||
                                stdout.includes('ttl') ||
                                stdout.includes('bytes from') ||
                                stdout.includes('Reply from') ||
                                stdout.includes('icmp_seq') ||
                                stdout.includes('1 packets received') ||
                                stdout.includes('1 received') ||
                                stdout.includes('0% packet loss');

    console.log(`[Ping] ${host} - Success indicators found:`, hasSuccessIndicator);

    if (hasSuccessIndicator) {
      return {
        status: 'online',
        responseTime: Math.round(pingTime),
        message: `Ping successful - ${Math.round(pingTime)}ms`,
        statusCode: null
      };
    }

    return {
      status: 'offline',
      responseTime: pingTime,
      message: 'Ping failed - Host unreachable',
      statusCode: null
    };
  } catch (error) {
    console.error(`[Ping Error] ${host}:`, error.message);
    return {
      status: 'offline',
      responseTime: Date.now() - startTime,
      message: `Ping failed: ${error.message}`,
      statusCode: null
    };
  }
}

// Check DNS resolution
export async function checkDNS(hostname) {
  const startTime = Date.now();
  
  try {
    // Try multiple DNS record types
    let addresses = [];
    
    try {
      // Try A records first
      addresses = await dns.promises.resolve4(hostname);
    } catch {
      // If A fails, try AAAA (IPv6)
      try {
        addresses = await dns.promises.resolve6(hostname);
      } catch {
        // If both fail, try general resolve
        addresses = await dns.promises.resolve(hostname);
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    if (addresses && addresses.length > 0) {
      return {
        status: 'online',
        responseTime,
        message: `DNS resolved - ${addresses.slice(0, 3).join(', ')}${addresses.length > 3 ? '...' : ''}`,
        statusCode: null,
        data: { addresses }
      };
    }
    
    return {
      status: 'offline',
      responseTime,
      message: 'DNS resolution failed - No addresses found',
      statusCode: null
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[DNS Error] ${hostname}:`, error.message);
    
    return {
      status: 'offline',
      responseTime,
      message: `DNS error: ${error.message}`,
      statusCode: null
    };
  }
}

// Check TCP Port
export async function checkTCP(host, port) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 10000;
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      const responseTime = Date.now() - startTime;
      socket.destroy();
      resolve({
        status: 'online',
        responseTime,
        message: `TCP port ${port} is open`,
        statusCode: null
      });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({
        status: 'offline',
        responseTime: timeout,
        message: `TCP port ${port} connection timeout`,
        statusCode: null
      });
    });
    
    socket.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        status: 'offline',
        responseTime,
        message: `TCP error: ${error.message}`,
        statusCode: null
      });
    });
    
    socket.connect(port, host);
  });
}

// Check SSL Certificate
export async function checkSSL(hostname, port = 443) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const options = {
      host: hostname,
      port: port,
      method: 'GET',
      rejectUnauthorized: false // Allow self-signed certs but we still get cert info
    };
    
    const timeout = setTimeout(() => {
      resolve({
        status: 'offline',
        responseTime: 10000,
        message: 'SSL check timeout',
        statusCode: null
      });
    }, 10000);
    
    try {
      const socket = tls.connect(options, () => {
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;
        
        const cert = socket.getPeerCertificate();
        socket.end();
        
        if (!cert || Object.keys(cert).length === 0) {
          resolve({
            status: 'offline',
            responseTime,
            message: 'No SSL certificate found',
            statusCode: null
          });
          return;
        }
        
        // eslint-disable-next-line no-unused-vars
        const _validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
        
        let status = 'online';
        let message = `SSL valid - expires in ${daysUntilExpiry} days`;
        
        if (daysUntilExpiry < 0) {
          status = 'offline';
          message = `SSL expired ${Math.abs(daysUntilExpiry)} days ago`;
        } else if (daysUntilExpiry < 7) {
          status = 'degraded';
          message = `SSL expires in ${daysUntilExpiry} days - renewal needed`;
        } else if (daysUntilExpiry < 30) {
          status = 'degraded';
          message = `SSL expires in ${daysUntilExpiry} days`;
        }
        
        resolve({
          status,
          responseTime,
          message,
          statusCode: null,
          data: {
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysUntilExpiry,
            fingerprint: cert.fingerprint
          }
        });
      });
      
      socket.on('error', (error) => {
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;
        resolve({
          status: 'offline',
          responseTime,
          message: `SSL error: ${error.message}`,
          statusCode: null
        });
      });
    } catch (error) {
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;
      resolve({
        status: 'offline',
        responseTime,
        message: `SSL check failed: ${error.message}`,
        statusCode: null
      });
    }
  });
}

// Main check function that routes to specific check type
export async function checkService(service) {
  switch (service.type) {
    case 'HTTP':
    case 'HTTPS':
      return await checkHttp(service.url);
    
    case 'PING':
      return await checkPing(service.host || service.url);
    
    case 'DNS':
      return await checkDNS(service.host || service.url);
    
    case 'TCP':
      return await checkTCP(service.host || service.url, service.port || 80);
    
    case 'SSL':
      return await checkSSL(service.host || service.url, service.port || 443);
    
    default:
      return await checkHttp(service.url);
  }
}

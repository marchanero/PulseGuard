/**
 * Setup para tests de API
 * Configuración específica para entorno Node.js
 */

// Polyfill para TextEncoder/TextDecoder (necesario para supertest en Node < 18)
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Limpiar después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Timeout global para tests de API
jest.setTimeout(10000);

/**
 * Setup para tests de API en Node.js
 * Este archivo configura el entorno para tests que requieren TextEncoder/TextDecoder
 */
import { TextEncoder, TextDecoder } from 'util';

// Polyfill para TextEncoder/TextDecoder en Node.js (necesario para @noble/hashes)
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

// También asignar a global para compatibilidad con módulos que no usan globalThis
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

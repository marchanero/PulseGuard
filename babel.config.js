/**
 * Configuración de Babel para Jest
 * Necesario para transformar JSX y ES6+ en tests
 */
export default {
  presets: [
    // Preset para transformar ES6+
    ['@babel/preset-env', { targets: { node: 'current' } }],
    // Preset para transformar JSX de React
    ['@babel/preset-react', { runtime: 'automatic' }]
  ]
};
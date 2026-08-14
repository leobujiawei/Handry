const { defineConfig } = require('vite') as typeof import('vite')
const react = require('@vitejs/plugin-react').default as typeof import('@vitejs/plugin-react').default
export default defineConfig({ plugins: [react()], base: './' })

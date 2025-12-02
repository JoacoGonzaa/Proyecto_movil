// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Paleta extraída de tu CSS web
        ticket: {
          primary: '#0056FF',   // Azul vivo principal
          secondary: '#0040C1', // Azul más oscuro
          accent: '#00E0A4',    // Verde agua 
          bg: '#f2f5fa',        // Fondo gris claro frío
          card: '#ffffff',      // Blanco de tarjetas
          line: '#cdd7e5',      // Bordes suaves
          muted: '#475569',     // Texto gris oscuro
          ink: '#0a0f1a',       // Texto principal casi negro
        }
      },
        // sombras
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'hover': '0 10px 15px -3px rgba(0, 86, 255, 0.1), 0 4px 6px -2px rgba(0, 86, 255, 0.05)', // Sombra azulada
      }
    },
  },
  plugins: [],
}
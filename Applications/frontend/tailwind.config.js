import daisyui from 'daisyui';
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  plugins: [typography, daisyui],
  daisyui: {
    themes: ['light', 'dark', 'cupcake'],
  },
};

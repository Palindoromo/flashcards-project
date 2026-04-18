import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/*
  Vite config is minimal for this project.
  The react() plugin does two things:
    1. Transforms JSX syntax into regular JS that browsers understand.
    2. Enables React Fast Refresh — components re-render instantly
       on save without losing their current state.
*/
export default defineConfig({
  plugins: [react()],
});

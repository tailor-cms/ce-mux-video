import { defineConfig } from 'vite';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import vue from '@vitejs/plugin-vue';

import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('mux'),
        },
      },
    }),
    libInjectCss(),
  ],
  build: {
    // In order to avoid edit runtime issues
    // due to package missing (if dist is deleted for short time)
    emptyOutDir: false,
    minify: false,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: 'Edit',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rolldownOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
      },
    },
  },
});

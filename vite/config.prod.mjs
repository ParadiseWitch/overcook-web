import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

const phasermsg = () => {
  return {
    name: 'phasermsg',
    buildStart() {
      process.stdout.write(`Building for production...\n`);
    },
    buildEnd() {
      const line = "---------------------------------------------------------";
      const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
      process.stdout.write(`${line}\n${msg}\n${line}\n\n`);
      process.stdout.write(`✨ Done ✨\n`);
    }
  }
}

export default defineConfig({
  base: '/overcook-web/',
  logLevel: 'warning',
  plugins: [
    vue(),
    phasermsg()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, '..', 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          vue: ['vue']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2
      },
      mangle: true,
      format: {
        comments: false
      }
    }
  },
  server: {
    port: 8080
  }
});

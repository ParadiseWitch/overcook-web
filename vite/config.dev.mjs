import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
    base: './',
    plugins: [
        vue()
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
    },
    server: {
        port: 8080
    }
});

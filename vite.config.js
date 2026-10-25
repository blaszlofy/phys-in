import { defineConfig } from 'vite';
import { resolve } from 'path';
import { glob } from 'glob';

export default defineConfig({
    base: '/',
    build: {
        rollupOptions: {
            input: Object.fromEntries(
                glob.sync('**/*.html', { ignore: ['node_modules/**', 'dist/**'] }).map(file => [
                    file.replace(/\\/g, '/').replace(/\.html$/, ''),
                    resolve(__dirname, file)
                ])
            )
        }
    }
});
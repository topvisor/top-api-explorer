import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const isPagesBuild = process.env.GITHUB_ACTIONS === 'true' && repository.length > 0;

export default defineConfig({
  base: isPagesBuild ? `/${repository}/` : '/',
  plugins: [vue()],
});

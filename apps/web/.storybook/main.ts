import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [],
  framework: '@storybook/react-vite',
  viteFinal: async (config) => {
    const mocksDir = path.resolve(__dirname, 'mocks');

    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': path.resolve(__dirname, '../src'),
          // Mock Next.js modules
          'next/link': path.resolve(mocksDir, 'next-link.tsx'),
          'next/image': path.resolve(mocksDir, 'next-image.tsx'),
          'next/navigation': path.resolve(mocksDir, 'next-navigation.tsx'),
        },
      },
    };
  },
};

export default config;


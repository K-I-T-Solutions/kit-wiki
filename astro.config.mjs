// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [
      starlight({
		  logo:{
			light: './src/assets/KIT_IT_GREY_NO_BACKGROUND.png',
			dark: './src/assets/KIT_IT_WHITE_NO_BACKGROUND.png',
		  },
          title: 'K.I.T. Wiki',
          social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/commanderphu/kit-wiki' },
		  { icon: 'discord', label: 'Discord', href: 'https://discord.gg/wPe98Kru3C' }
		  ],
		  editLink: {
			baseUrl: '',}, // Add your edit link base URL here
          sidebar: [
              {
                  label: 'Guides',
                  items: [
                      // Each item here is one entry in the navigation menu.
                      { label: 'Example Guide', slug: 'guides/example' },
                  ],
              },
              {
                  label: 'Reference',
                  autogenerate: { directory: 'reference' },
              },
              {
                  label: 'Test',
                  items: [
                      { label: 'Test Page', slug: 'test' },
                  ],
              }
              
          ],
		customCss: ['./src/styles/global.css'],
      }),
	],

  vite: {
    plugins: [tailwindcss()],
  },
});
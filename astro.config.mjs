// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site:'https://wiki.kit-solutions.de',
	integrations: [
      starlight({
		logo:{
			light: './src/assets/KIT_IT_GREY_NO_BACKGROUND.png',
			dark: './src/assets/KIT_IT_WHITE_NO_BACKGROUND.png',
		  },
          title: 'K.I.T. Wiki',
          social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/K-I-T-Solutions/kit-wiki' },
		  { icon: 'discord', label: 'Discord', href: 'https://discord.gg/wPe98Kru3C' },
		  { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/106834062/' },
		  { icon: 'seti:html', label: 'K.I.T. Solutions', href: 'https://kit-it-koblenz.de/'},
		  ],
		  editLink: {
			baseUrl: 'https://github.com/K-I-T-Solutions/kit-wiki/edit/master/',}, // Add your edit link base URL here
        sidebar: [
        {
          label: 'Start',
          items: [
            { label: 'Willkommen', link: '/docs/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Erste Schritte', link: '/guides/' },
            { label: 'How-Tos', link: '/guides/how-tos/' },
          ],
        },
        {
          label: 'Tools & Links',
          items: [
            { label: 'Übersicht', link: '/tools/' },
            { label: 'Interne Links', link: '/tools/internal/' },
            { label: 'Externe Links', link: '/tools/external/' },
          ],
        },
        {
          label: 'Services',
          items: [
            { label: 'Unsere Services', link: '/services/' },
            { label: 'Setup & Infrastruktur', link: '/services/setup/' },
          ],
        },
        {
          label: 'Support',
          items: [
            { label: 'Kontakt & Ticket', link: '/support/' },
            { label: 'Troubleshooting', link: '/troubleshooting/' },
          ],
        },
      ],
	  lastUpdated: true,
	  customCss: ['./src/styles/global.css'],
      }),
	],

  vite: {
    plugins: [tailwindcss()],
  },
});
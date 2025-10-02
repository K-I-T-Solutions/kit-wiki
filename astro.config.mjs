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
        { label: 'Start', items: [{ label: 'Übersicht', link: '/docs/' }] },

        {
          label: 'Onboarding',
          items: [
            { label: 'Kurz & knackig', link: '/onboarding/' },
            { label: 'Zugänge & Sicherheit', link: '/onboarding/access/' },
            { label: 'Zero Trust (später)', link: '/onboarding/zero-trust/' }, // Platzhalter
          ],
        },

        {
          label: 'Tools',
          items: [
            { label: 'Dashboard', link: '/tools/' },
            { label: 'Webmail', link: '/tools/webmail/' },
            { label: 'E-Mail-Setup', link: '/tools/mail-setup/' },
            { label: 'Discord', link: '/tools/discord/' },
            { label: 'Workmate (bald)', link: '/tools/workmate/' },
          ],
        },

        {
          label: 'Nerdy Things',
          items: [
            { label: 'CLI & Snippets', link: '/nerdy/cli/' },
            { label: 'SSH & Keys', link: '/nerdy/ssh/' },
          ],
        },

        {
          label: 'Cheatsheets',
          items: [
            { label: 'Abkürzungen & Terms (A–Z)', link: '/cheatsheets/abkuerzungen/' },
          ],
        },

        { label: 'Troubleshooting', items: [{ label: 'Häufige Probleme', link: '/troubleshooting/faq' }] },
      ],
	  lastUpdated: true,
	  customCss: ['./src/styles/global.css'],
      }),
	],

  vite: {
    plugins: [tailwindcss()],
  },
});
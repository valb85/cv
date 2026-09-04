const ICONS: Record<string, { label: string; path: string }> = {
  social_linkedin: {
    label: 'LinkedIn',
    path: 'M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8h4.56v14H.22V8zm7.4 0h4.37v1.92h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 6.99V22h-4.56v-6.55c0-1.56-.03-3.57-2.18-3.57-2.18 0-2.51 1.7-2.51 3.46V22H7.62V8z',
  },
  social_facebook: {
    label: 'Facebook',
    path: 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z',
  },
  social_github: {
    label: 'GitHub',
    path: 'M12 .3a12 12 0 00-3.79 23.4c.6.1.82-.26.82-.58l-.01-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.64 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.21.7.82.58A12 12 0 0012 .3z',
  },
};

export const SocialLinks = ({ settings }: { settings: Record<string, string> }) => {
  const links = Object.entries(ICONS)
    .filter(([key]) => settings[key]?.trim())
    .map(([key, icon]) => ({ href: settings[key], ...icon }));

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="social">
      {links.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={link.path} />
          </svg>
        </a>
      ))}
    </div>
  );
};

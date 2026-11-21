/**
 * Staff and manager portals.
 *
 * `data-portal` turns on the portal colour set in globals.css (dark by
 * default). The inline script applies a light/dark choice saved on this
 * device before the page paints, so there is no flash of the wrong theme.
 * The switch itself is `ThemeToggle` in each screen's header.
 */
const applySavedTheme = `try{var t=localStorage.getItem("tt-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <div data-portal="" className="bg-background text-foreground min-h-screen">
      <script dangerouslySetInnerHTML={{ __html: applySavedTheme }} />
      {children}
    </div>
  );
}

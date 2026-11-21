/**
 * Client portals (staff and manager) use the dark colour set.
 * The `.dark` class switches every shared component to the landing page's
 * "ink" values in globals.css. A per-business theme setting can choose this
 * class later.
 */
export default function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <div className="dark bg-background text-foreground min-h-screen">
      {children}
    </div>
  );
}

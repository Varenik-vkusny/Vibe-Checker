import { PropsWithChildren } from 'react';

export default function ProModeLayout({ children }: PropsWithChildren) {
  // This layout ensures the pro-mode page is part of the dashboard group,
  // inheriting common layouts like the header.
  return (
    <>
      {children}
    </>
  );
}
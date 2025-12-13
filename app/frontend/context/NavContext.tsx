'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavContextType {
  isNavHidden: boolean;
  setNavHidden: (hidden: boolean) => void;
}

const NavContext = createContext<NavContextType>({
  isNavHidden: false,
  setNavHidden: () => {},
});

export const NavProvider = ({ children }: { children: ReactNode }) => {
  const [isNavHidden, setNavHidden] = useState(false);

  return (
    <NavContext.Provider value={{ isNavHidden, setNavHidden }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = () => useContext(NavContext);
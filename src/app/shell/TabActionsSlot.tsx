import {createContext, useContext, type ReactNode} from 'react';
import {createPortal} from 'react-dom';

/** DOM node on the right of the notebook tabs row; null until mounted or on phones. */
export const TabActionsContext = createContext<HTMLElement | null>(null);

/** Renders `children` in the notebook tabs row (right side). Renders nothing when no slot exists. */
export function TabActions({children}: {children: ReactNode}) {
  const target = useContext(TabActionsContext);
  return target ? createPortal(children, target) : null;
}

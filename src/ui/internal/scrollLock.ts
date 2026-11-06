let locks = 0;
let previous = '';

/** Reference-counted body scroll lock. Returns the unlock function. */
export function lockBodyScroll(): () => void {
  if (locks === 0) {
    previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) document.body.style.overflow = previous;
  };
}

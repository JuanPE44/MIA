import {useId, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {Icon} from '../../ui/Icon';
import {FAQ} from './helpModel';

/** Editorial FAQ: numbered mono items, rule separators, animated height. */
export function FaqAccordion() {
  const baseId = useId();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <ol className="border-t border-rule">
      {FAQ.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <li key={item.q} className="border-b border-rule">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-11 w-full cursor-pointer items-baseline gap-3 py-3 text-left"
              >
                <span aria-hidden className="font-mono text-caption tabular-nums text-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 font-display text-label text-strong">{item.q}</span>
                <Icon
                  name="chevron-down"
                  className={`size-5 shrink-0 self-center text-muted transition-transform duration-[150ms] ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduced ? false : {height: 0, opacity: 0}}
                  animate={{height: 'auto', opacity: 1}}
                  exit={reduced ? {opacity: 0, transition: {duration: 0}} : {height: 0, opacity: 0}}
                  transition={{duration: reduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1]}}
                  className="overflow-hidden"
                >
                  <p className="pb-4 pl-9 text-small text-default">{item.a}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}

import {motion, useReducedMotion} from 'motion/react';
import {AppMark, Highlight, InkUnderline, Reveal, RevealItem} from '../../ui';
import {Icon} from '../../ui/Icon';
import type {IconName} from '../../ui/Icon/icons';

const BENEFITS: Array<{icon: IconName; title: string; text: string}> = [
  {icon: 'document', title: 'Organiza tus fuentes', text: 'PDF, apuntes, enlaces y audio en un solo cuaderno.'},
  {icon: 'chat', title: 'Chatea con citas', text: 'Cada respuesta señala de qué fuente sale.'},
  {icon: 'shield-check', title: 'Estudia en serio', text: 'Recuerdo activo y modo blindado contra distracciones.'},
];

/** Mini product vignette: a sentence being highlighted and underlined, with a flashcard that flips on a loop. */
function Vignette() {
  const reduced = useReducedMotion();
  return (
    <div aria-hidden className="mt-2 flex w-full max-w-md select-none flex-col gap-4">
      <div className="rounded-card border border-ink bg-surface p-5 shadow-offset">
        <p className="font-mono text-caption uppercase tracking-widest text-muted">Ries · Lean Startup</p>
        <p className="mt-3 font-display text-h3 leading-8 text-strong">
          Un MVP es la versión que te permite <Highlight trigger="mount" delay={0.9}>aprender más</Highlight> con{' '}
          <span className="relative inline-block">
            menos esfuerzo
            <span className="absolute -bottom-1.5 left-0 block w-full">
              <InkUnderline className="text-primary-text" delay={1.7} />
            </span>
          </span>
          .
        </p>
        <motion.span
          className="mt-4 inline-flex items-center gap-1.5 rounded-pill border border-primary-tint-border bg-primary-tint px-2.5 py-0.5 font-mono text-caption text-primary-on-tint"
          initial={reduced ? false : {opacity: 0, y: 6}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 2.3, duration: 0.4}}
        >
          <Icon name="document" className="size-3.5" /> Fuente 1 · cap. 3
        </motion.span>
      </div>

      <div className="h-24 w-full max-w-xs self-end [perspective:800px]">
        <motion.div
          className="relative size-full [transform-style:preserve-3d]"
          animate={reduced ? undefined : {rotateY: [0, 0, 180, 180, 0]}}
          transition={{duration: 8, times: [0, 0.35, 0.45, 0.85, 0.95], repeat: Infinity, ease: 'easeInOut', delay: 3}}
        >
          <div className="absolute inset-0 flex flex-col justify-between rounded-card border border-ink bg-primary-tint p-3 shadow-offset [backface-visibility:hidden]">
            <span className="font-mono text-caption uppercase tracking-widest text-primary-on-tint">Tarjeta</span>
            <span className="text-label text-strong">¿Qué es un pivote?</span>
          </div>
          <div className="absolute inset-0 flex flex-col justify-between rounded-card border border-ink bg-highlight p-3 text-highlight-ink shadow-offset [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="font-mono text-caption uppercase tracking-widest">Respuesta</span>
            <span className="text-label">Cambiar de rumbo para probar una nueva hipótesis.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** Left panel of the auth screen (lg and up): brand, value proposition and the animated vignette. */
export function AuthShowcase() {
  return (
    <aside className="relative hidden flex-col justify-center overflow-hidden border-r border-rule bg-subtle px-12 py-16 lg:flex xl:px-20">
      <Reveal className="mx-auto flex w-full max-w-lg flex-col gap-8" stagger={0.12}>
        <RevealItem>
          <div className="flex items-center gap-3">
            <AppMark size={44} />
            <p className="font-display text-display text-strong">
              <Highlight trigger="mount" delay={0.4}>MIA</Highlight>
            </p>
          </div>
          <p className="mt-4 font-display text-h2 text-default">Tu copiloto de estudio: de tus apuntes a lo que realmente recuerdas.</p>
        </RevealItem>

        <RevealItem>
          <ul className="flex flex-col gap-4">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex items-start gap-3">
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-control border border-rule bg-surface text-primary-text">
                  <Icon name={b.icon} weight="duotone" className="size-5" />
                </span>
                <div>
                  <p className="text-body-strong text-strong">{b.title}</p>
                  <p className="text-small text-muted">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </RevealItem>

        <RevealItem>
          <Vignette />
        </RevealItem>
      </Reveal>
    </aside>
  );
}

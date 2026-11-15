import type {ReactNode, Ref} from 'react';
import {cx} from '../internal/cx';

export interface PageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Single content container for every shell screen: `w-full max-w-content`,
 * left-aligned (never `mx-auto`). The horizontal gutter lives on `<main>` in
 * App.tsx, so the left edge is identical on every screen. Inner text blocks
 * may use `max-w-reading` / `max-w-narrow`, always left-aligned.
 */
export function Page({children, className}: PageProps) {
  return <div className={cx('w-full min-w-0 max-w-content', className)}>{children}</div>;
}

export interface PageHeaderProps {
  /** Title content (plain text or a `Highlight` fragment). */
  title: ReactNode;
  /** Mono metadata line under the title. */
  meta?: ReactNode;
  /** Slot aligned with the title (buttons, menus). */
  actions?: ReactNode;
  /** Ref/tabIndex hooks for focus management on the h1. */
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
}

/** Editorial page header: Fraunces h1, optional mono meta line and actions slot. */
export function PageHeader({title, meta, actions, headingRef, className}: PageHeaderProps) {
  return (
    <header className={cx('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="font-display text-display text-strong outline-none">
          {title}
        </h1>
        {meta ? <p className="mt-2 font-mono text-small text-muted">{meta}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

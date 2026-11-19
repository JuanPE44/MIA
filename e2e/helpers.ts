import { expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

export const NB = 'nb-lean-startup';
export const ROUTES: Array<{ name: string; url: string }> = [
  { name: 'explorer', url: '/cuadernos' },
  { name: 'progreso', url: '/progreso' },
  { name: 'ayuda', url: '/ayuda' },
  { name: 'perfil', url: '/cuenta/perfil' },
  { name: 'preferencias', url: '/cuenta/preferencias' },
  { name: 'planes', url: '/planes' },
  { name: 'chat', url: `/cuadernos/${NB}/chat` },
  { name: 'fuentes', url: `/cuadernos/${NB}/fuentes` },
  { name: 'materiales', url: `/cuadernos/${NB}/materiales` },
  { name: 'estudiar-sesion', url: `/cuadernos/${NB}/estudiar` },
  { name: 'estudiar-repaso', url: `/cuadernos/${NB}/estudiar/repaso` },
  { name: 'estudiar-tarjetas', url: `/cuadernos/${NB}/estudiar/tarjetas` },
  { name: '404', url: '/no-existe-esta-ruta' },
];

const OUT = 'test-results/findings';

export type Finding = { id: string; severity: string; where: string; detail: string; shot?: string };

export function record(f: Finding) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.appendFileSync(path.join(OUT, 'findings.jsonl'), JSON.stringify(f) + '\n');
}

export async function shot(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  const p = `${OUT}/${name.replace(/[^a-z0-9-_]/gi, '_')}.png`;
  await page.screenshot({ path: p, fullPage: false }).catch(() => {});
  return p;
}

export async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => {
    try { localStorage.setItem('mia_theme_mode', t); } catch {}
    try { localStorage.setItem('mia_onboarding_done', '1'); } catch {}
  }, theme);
}

export function attachCollectors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text().slice(0, 300)}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 300)}`));
  page.on('response', (r) => {
    const s = r.status();
    if (s >= 400 && !r.url().includes('/favicon')) errors.push(`HTTP ${s} ${r.request().method()} ${r.url().slice(0, 160)}`);
  });
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (!/\.(png|jpg|svg)$/.test(u) && r.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`requestfailed ${u.slice(0, 160)} ${r.failure()?.errorText}`);
  });
  return errors;
}

export async function axeScan(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return r.violations.map((v) => ({
    id: v.id,
    impact: v.impact ?? 'n/a',
    n: v.nodes.length,
    sample: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' <' + n.html.slice(0, 110).replace(/\s+/g, ' ') + '> :: ' + (n.failureSummary ?? '').split('\n')[1]?.trim()).join(' | '),
  }));
}

/** Runs in page: DOM heuristics. */
export async function domAudit(page: Page, phone: boolean) {
  return page.evaluate((phone) => {
    const sel = (el: Element) => {
      const e = el as HTMLElement;
      let s = e.tagName.toLowerCase();
      if (e.id) s += '#' + e.id;
      const c = typeof e.className === 'string' ? e.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
      if (c) s += '.' + c;
      const t = (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30);
      return s + (t ? ` "${t}"` : '');
    };
    const visible = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0;
    };
    const out: Record<string, string[]> = { overflow: [], smallTargets: [], imgNoAlt: [], unnamedButtons: [], clipped: [], noH1: [], noLang: [] };
    const vw = window.innerWidth;
    if (document.documentElement.scrollWidth > vw) {
      out.overflow.push(`scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (visible(el) && (r.right > vw + 1 || r.left < -1)) {
          // ignore elements inside an overflow-hidden/auto ancestor
          let p = el.parentElement, clippedByAncestor = false;
          while (p && p !== document.body) {
            const o = getComputedStyle(p);
            if (/(hidden|auto|scroll|clip)/.test(o.overflowX) && p.getBoundingClientRect().right <= vw + 1) { clippedByAncestor = true; break; }
            p = p.parentElement;
          }
          if (!clippedByAncestor && out.overflow.length < 8) out.overflow.push(sel(el) + ` right=${Math.round(r.right)}`);
        }
      }
    }
    if (phone) {
      for (const el of Array.from(document.querySelectorAll('a[href],button,input,select,textarea,[role=button],[role=tab],[role=checkbox],[role=switch]'))) {
        if (!visible(el)) continue;
        const r = (el as HTMLElement).getBoundingClientRect();
        if ((r.width < 24 || r.height < 24) && !(el as HTMLInputElement).disabled && out.smallTargets.length < 15)
          out.smallTargets.push(`${sel(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    for (const img of Array.from(document.querySelectorAll('img'))) {
      if (visible(img) && !img.hasAttribute('alt') && img.getAttribute('role') !== 'presentation') out.imgNoAlt.push(sel(img));
    }
    for (const b of Array.from(document.querySelectorAll('button,[role=button],a[href]'))) {
      if (!visible(b) || b.closest('[aria-hidden=true]') || b.getAttribute('aria-labelledby')) continue;
      const name = ((b as HTMLElement).innerText || '').trim() || b.getAttribute('aria-label') || b.getAttribute('title') || b.getAttribute('aria-labelledby') || b.querySelector('img[alt]:not([alt=""])')?.getAttribute('alt');
      if (!name && out.unnamedButtons.length < 10) out.unnamedButtons.push(sel(b));
    }
    for (const el of Array.from(document.querySelectorAll('h1,h2,h3,h4,p,span,a,button,label,li,td,th'))) {
      const e = el as HTMLElement;
      if (!visible(e) || !e.innerText?.trim() || e.closest('.sr-only,[class*="sr-only"]')) continue;
      { const rr = e.getBoundingClientRect(); if (rr.width <= 1 || rr.height <= 1) continue; }
      if (e.children.length > 0 && e.tagName !== 'BUTTON' && e.tagName !== 'A') continue;
      const cs = getComputedStyle(e);
      const clipsX = /(hidden|clip)/.test(cs.overflowX) && cs.textOverflow !== 'ellipsis' && e.scrollWidth > e.clientWidth + 2;
      const clipsY = /(hidden|clip)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 3 && !cs.webkitLineClamp?.toString().match(/^\d/) && cs.display !== 'inline';
      if ((clipsX || clipsY) && out.clipped.length < 10) out.clipped.push(`${sel(e)} sw=${e.scrollWidth}/${e.clientWidth} sh=${e.scrollHeight}/${e.clientHeight}`);
    }
    if (document.querySelectorAll('h1').length !== 1) out.noH1.push(`h1 count = ${document.querySelectorAll('h1').length}`);
    if (!document.documentElement.lang) out.noLang.push('html lang missing');
    return out;
  }, phone);
}

export async function waitSettled(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
  // dismiss onboarding/welcome if shown
  const skip = page.getByRole('button', { name: /^(Omitir|Saltar|Ahora no|Cerrar)/ }).first();
  if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
}

export function softReport(testInfo: TestInfo, label: string, findings: string[]) {
  for (const f of findings) record({ id: label, severity: '', where: testInfo.project.name, detail: f });
  expect.soft(findings, label).toEqual([]);
}

/** Run a journey step; on failure record a finding + screenshot and continue. */
export async function step(page: Page, testInfo: TestInfo, label: string, fn: () => Promise<void>, severity = 'P1') {
  try {
    await fn();
  } catch (e) {
    const msg = String((e as Error).message).split('\n').slice(0, 3).join(' ').slice(0, 300);
    const sp = await shot(page, `${testInfo.title}_${label}_${testInfo.project.name}`);
    record({ id: 'journey', severity, where: `${testInfo.title} | ${testInfo.project.name}`, detail: `${label}: ${msg}`, shot: sp });
    expect.soft(false, `${label}: ${msg}`).toBe(true);
  }
}

export async function openMenuAndPick(page: Page, name: RegExp | string) {
  await page.getByRole('button', { name: /^Cuenta/ }).first().click();
  await page.getByRole('menuitem', { name }).click();
}

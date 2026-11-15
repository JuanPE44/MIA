import {useState} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {useTheme, type ThemeMode} from '../../app/providers/ThemeProvider';
import {Button, ConfirmDialog, SegmentedControl, useToast} from '../../ui';
import {Icon} from '../../ui/Icon';

const THEME_OPTIONS = [
  {value: 'light' as const, label: 'Claro', icon: <Icon name="theme-light" className="size-4" />},
  {value: 'dark' as const, label: 'Oscuro', icon: <Icon name="theme-dark" className="size-4" />},
  {value: 'system' as const, label: 'Sistema', icon: <Icon name="theme-system" className="size-4" />},
];

/** Preferencias tab: theme and example-data reset (UX-15: separated from the profile). */
export function PreferencesPanel() {
  const {handleResetDemoData} = useAppState();
  const {mode, setMode} = useTheme();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-8">
      <section aria-labelledby="pref-theme" className="space-y-3">
        <h2 id="pref-theme" className="text-h2 text-strong">
          Tema
        </h2>
        <SegmentedControl<ThemeMode>
          aria-labelledby="pref-theme"
          value={mode}
          onValueChange={setMode}
          options={THEME_OPTIONS}
        />
      </section>

      <section aria-labelledby="pref-data" className="space-y-3">
        <h2 id="pref-data" className="text-h2 text-strong">
          Datos
        </h2>
        <p className="text-body text-default">Tus datos se guardan solo en este navegador.</p>
        <Button variant="danger-ghost" onClick={() => setConfirming(true)}>
          Restablecer datos de ejemplo
        </Button>
      </section>

      <ConfirmDialog
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          handleResetDemoData();
          setConfirming(false);
          toast.show({message: 'Datos de ejemplo restablecidos.', variant: 'success'});
        }}
        title="¿Restablecer los datos de ejemplo?"
        description="Se reemplazan tus cuadernos, carpetas, progreso y perfil por los datos de ejemplo. Esta acción no se puede deshacer."
        confirmLabel="Restablecer"
      />
    </div>
  );
}

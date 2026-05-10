'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { defaultPrefs, readPrefs, writePrefs, type AccountPrefs } from './account-prefs';

type Seed = { email: string; defaultDisplayName: string; defaultTimezone: string };

function useLocalPrefs(seed: Seed) {
  const [prefs, setPrefs] = useState<AccountPrefs>(() =>
    defaultPrefs({
      displayName: seed.defaultDisplayName,
      timezone: seed.defaultTimezone,
    }),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage once on mount. Necessary external sync —
    // can't run during render without breaking SSR parity.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(
      readPrefs({
        displayName: seed.defaultDisplayName,
        timezone: seed.defaultTimezone,
      }),
    );
    setHydrated(true);
  }, [seed.defaultDisplayName, seed.defaultTimezone]);

  function update<K extends keyof AccountPrefs>(key: K, value: AccountPrefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function save(label: string, fields: (keyof AccountPrefs)[]) {
    writePrefs(prefs);
    toast.success(`${label} saved`, {
      description: `${fields.length} field${fields.length === 1 ? '' : 's'} updated locally.`,
    });
  }

  return { prefs, update, save, hydrated };
}

export function ProfileForm({ seed }: { seed: Seed }) {
  const { prefs, update, save, hydrated } = useLocalPrefs(seed);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Display name">
          <Input
            value={prefs.displayName}
            onChange={(e) => update('displayName', e.target.value)}
            placeholder="how you sign your work"
          />
        </Field>
        <Field
          label="Email"
          hint="Single-tenant install — change via .env then re-seed."
        >
          <Input value={seed.email} readOnly className="opacity-70" />
        </Field>
        <Field label="Timezone">
          <Input
            value={prefs.timezone}
            onChange={(e) => update('timezone', e.target.value)}
            placeholder="Europe/Warsaw"
          />
        </Field>
        <Field label="Language">
          <Input value={prefs.language} onChange={(e) => update('language', e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => save('Profile', ['displayName', 'timezone', 'language'])}
          disabled={!hydrated}
        >
          <Save className="size-3.5" />
          Save profile
        </Button>
      </div>
    </div>
  );
}

export function StudioForm({ seed }: { seed: Seed }) {
  const { prefs, update, save, hydrated } = useLocalPrefs(seed);

  return (
    <div className="space-y-4">
      <Field label="Default banner format" hint="Used when creating a new generation.">
        <select
          value={prefs.defaultFormat}
          onChange={(e) => update('defaultFormat', e.target.value)}
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none"
        >
          <option value="square_1080">Square — 1080×1080 (IG / FB)</option>
          <option value="story_1080_1920">Story — 1080×1920 (9:16)</option>
          <option value="landscape_1200_628">Landscape — 1200×628 (LinkedIn)</option>
          <option value="portrait_1200_1500">Portrait — 1200×1500 (Pinterest)</option>
        </select>
      </Field>

      <ToggleRow
        label="Auto-promote first AI version"
        description="Mark first successful generation as a template automatically."
        checked={prefs.autoPromoteFirstVersion}
        onChange={(v) => update('autoPromoteFirstVersion', v)}
      />
      <ToggleRow
        label="Auto-detect brand on URL add"
        description="Whenever a Knowledge base URL becomes ready, run brand extraction."
        checked={prefs.autoDetectBrandOnUrl}
        onChange={(v) => update('autoDetectBrandOnUrl', v)}
      />

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() =>
            save('Studio defaults', [
              'defaultFormat',
              'autoPromoteFirstVersion',
              'autoDetectBrandOnUrl',
            ])
          }
          disabled={!hydrated}
        >
          <Save className="size-3.5" />
          Save defaults
        </Button>
      </div>
    </div>
  );
}

export function NotificationsForm({ seed }: { seed: Seed }) {
  const { prefs, update, save, hydrated } = useLocalPrefs(seed);

  return (
    <div className="space-y-4">
      <ToggleRow
        label="Generation finished"
        description="When a banner finishes generating or rendering."
        checked={prefs.notifyGenerationDone}
        onChange={(v) => update('notifyGenerationDone', v)}
      />
      <ToggleRow
        label="Brand auto-detect ready"
        description="When AI finishes extracting brand from a URL."
        checked={prefs.notifyBrandDetect}
        onChange={(v) => update('notifyBrandDetect', v)}
      />
      <ToggleRow
        label="Daily cost summary"
        description="A short morning brief with yesterday's AI spend."
        checked={prefs.notifyDailyCost}
        onChange={(v) => update('notifyDailyCost', v)}
      />
      <ToggleRow
        label="Email me a copy"
        description="Mirror in-app notifications to email."
        checked={prefs.notifyEmail}
        onChange={(v) => update('notifyEmail', v)}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() =>
            save('Notification preferences', [
              'notifyGenerationDone',
              'notifyBrandDetect',
              'notifyDailyCost',
              'notifyEmail',
            ])
          }
          disabled={!hydrated}
        >
          <Save className="size-3.5" />
          Save preferences
        </Button>
      </div>
    </div>
  );
}

export function ApiForm({ seed }: { seed: Seed }) {
  const { prefs, update, save, hydrated } = useLocalPrefs(seed);

  return (
    <div className="space-y-4">
      <Field
        label="GOOGLE_API_KEY"
        hint="Loaded from .env on the server. Editable here only locally as a label."
      >
        <Input value="••••••••••••••••" readOnly className="font-mono opacity-70" />
      </Field>
      <Field label="Default model">
        <Input
          value={prefs.defaultModel}
          onChange={(e) => update('defaultModel', e.target.value)}
        />
      </Field>
      <Field label="Image model">
        <Input value={prefs.imageModel} onChange={(e) => update('imageModel', e.target.value)} />
      </Field>
      <ToggleRow
        label="Stream HTML to the editor"
        description="Show partial AI output live as it’s being written."
        checked={prefs.streamHtml}
        onChange={(v) => update('streamHtml', v)}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => save('AI preferences', ['defaultModel', 'imageModel', 'streamHtml'])}
          disabled={!hydrated}
        >
          <Save className="size-3.5" />
          Save AI prefs
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 p-3">
      <div>
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

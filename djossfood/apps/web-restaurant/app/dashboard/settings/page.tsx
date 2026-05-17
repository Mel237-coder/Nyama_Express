import { SettingsForm } from '@/components/settings/settings-form';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Parametres du restaurant</h2>
      <SettingsForm />
    </div>
  );
}
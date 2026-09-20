import { ProfileSettingsClient } from "./profile-settings-client";

export default function ProfileSettingsPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-8">
      <ProfileSettingsClient />
    </div>
  );
}

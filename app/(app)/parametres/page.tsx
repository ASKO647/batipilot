"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Tab = "entreprise" | "profil" | "notifications" | "securite";

type CompanySettings = {
  company_name: string;
  legal_name: string;
  siret: string;
  vat_number: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  postal_code: string;
};

type NotificationsSettings = {
  email_notifications: boolean;
  new_client_notification: boolean;
  devis_notification: boolean;
  chantier_notification: boolean;
  rendez_vous_notification: boolean;
  relance_notification: boolean;
  automation_notification: boolean;
};

const defaultCompanySettings: CompanySettings = {
  company_name: "",
  legal_name: "",
  siret: "",
  vat_number: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  postal_code: "",
};

const defaultNotifications: NotificationsSettings = {
  email_notifications: true,
  new_client_notification: true,
  devis_notification: true,
  chantier_notification: true,
  rendez_vous_notification: true,
  relance_notification: true,
  automation_notification: true,
};

export default function ParametresPage() {
  const [tab, setTab] = useState<Tab>("entreprise");

  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [company, setCompany] =
    useState<CompanySettings>(defaultCompanySettings);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [notifications, setNotifications] =
    useState<NotificationsSettings>(defaultNotifications);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  function showSuccess(text: string) {
    setError("");
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  function showError(text: string) {
    setMessage("");
    setError(text);
  }

  async function loadSettings() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      showError("Impossible de récupérer votre compte.");
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setUserEmail(user.email || "");

    setFirstName(user.user_metadata?.first_name || "");
    setLastName(user.user_metadata?.last_name || "");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      showError("Impossible de récupérer votre organisation.");
      setLoading(false);
      return;
    }

    const orgId = profile.organization_id;

    setOrganizationId(orgId);

    const [
      organizationResult,
      companySettingsResult,
      notificationsResult,
    ] = await Promise.all([
      supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .maybeSingle(),

      supabase
        .from("organization_settings")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle(),

      supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (
      companySettingsResult.error &&
      companySettingsResult.error.code !== "PGRST116"
    ) {
      console.error(companySettingsResult.error);
    }

    if (
      notificationsResult.error &&
      notificationsResult.error.code !== "PGRST116"
    ) {
      console.error(notificationsResult.error);
    }

    const savedCompany = companySettingsResult.data;

    setCompany({
      company_name:
        savedCompany?.company_name ||
        organizationResult.data?.name ||
        "",
      legal_name: savedCompany?.legal_name || "",
      siret: savedCompany?.siret || "",
      vat_number: savedCompany?.vat_number || "",
      phone: savedCompany?.phone || "",
      email: savedCompany?.email || "",
      website: savedCompany?.website || "",
      address: savedCompany?.address || "",
      city: savedCompany?.city || "",
      postal_code: savedCompany?.postal_code || "",
    });

    if (notificationsResult.data) {
      setNotifications({
        email_notifications:
          notificationsResult.data.email_notifications ?? true,

        new_client_notification:
          notificationsResult.data.new_client_notification ?? true,

        devis_notification:
          notificationsResult.data.devis_notification ?? true,

        chantier_notification:
          notificationsResult.data.chantier_notification ?? true,

        rendez_vous_notification:
          notificationsResult.data.rendez_vous_notification ?? true,

        relance_notification:
          notificationsResult.data.relance_notification ?? true,

        automation_notification:
          notificationsResult.data.automation_notification ?? true,
      });
    }

    setLoading(false);
  }

  async function saveCompany() {
    if (!organizationId) return;

    if (!company.company_name.trim()) {
      showError("Le nom de l’entreprise est obligatoire.");
      return;
    }

    setSavingCompany(true);
    setError("");

    const { error: settingsError } = await supabase
      .from("organization_settings")
      .upsert(
        {
          organization_id: organizationId,
          ...company,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "organization_id",
        }
      );

    if (settingsError) {
      console.error(settingsError);
      showError(settingsError.message);
      setSavingCompany(false);
      return;
    }

    const { error: organizationError } = await supabase
      .from("organizations")
      .update({
        name: company.company_name.trim(),
      })
      .eq("id", organizationId);

    if (organizationError) {
      console.error(organizationError);
      showError(
        "Les informations ont été enregistrées, mais le nom principal de l’organisation n’a pas pu être mis à jour."
      );

      setSavingCompany(false);
      return;
    }

    showSuccess("Informations de l’entreprise enregistrées.");
    setSavingCompany(false);
  }

  async function saveProfile() {
    if (!userId) return;

    setSavingProfile(true);
    setError("");

    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      },
    });

    if (error) {
      console.error(error);
      showError(error.message);
      setSavingProfile(false);
      return;
    }

    showSuccess("Profil utilisateur enregistré.");
    setSavingProfile(false);
  }

  async function saveNotifications() {
    if (!userId || !organizationId) return;

    setSavingNotifications(true);
    setError("");

    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          organization_id: organizationId,
          ...notifications,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      console.error(error);
      showError(error.message);
      setSavingNotifications(false);
      return;
    }

    showSuccess("Préférences de notifications enregistrées.");
    setSavingNotifications(false);
  }

  async function updatePassword() {
    if (!newPassword) {
      showError("Entre un nouveau mot de passe.");
      return;
    }

    if (newPassword.length < 8) {
      showError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);
    setError("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error(error);
      showError(error.message);
      setSavingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");

    showSuccess("Mot de passe modifié avec succès.");
    setSavingPassword(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-600" />

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
              Configuration
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Paramètres
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Configurez votre entreprise, votre profil et vos préférences.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {message && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[240px_1fr]">
        <div className="h-fit rounded-xl border border-slate-200 bg-white p-2">
          <SettingsNav
            active={tab === "entreprise"}
            icon={<Building2 className="h-4 w-4" />}
            label="Entreprise"
            onClick={() => setTab("entreprise")}
          />

          <SettingsNav
            active={tab === "profil"}
            icon={<User className="h-4 w-4" />}
            label="Mon profil"
            onClick={() => setTab("profil")}
          />

          <SettingsNav
            active={tab === "notifications"}
            icon={<Bell className="h-4 w-4" />}
            label="Notifications"
            onClick={() => setTab("notifications")}
          />

          <SettingsNav
            active={tab === "securite"}
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Sécurité"
            onClick={() => setTab("securite")}
          />
        </div>

        <div>
          {tab === "entreprise" && (
            <div className="rounded-xl border border-slate-200 bg-white">
              <SettingsHeader
                title="Informations de l’entreprise"
                description="Ces informations identifieront votre entreprise dans BatiPilot."
                icon={<Building2 className="h-5 w-5" />}
              />

              <div className="p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field
                    label="Nom commercial"
                    value={company.company_name}
                    onChange={(value) =>
                      setCompany({
                        ...company,
                        company_name: value,
                      })
                    }
                    placeholder="Ex : Martin Rénovation"
                  />

                  <Field
                    label="Raison sociale"
                    value={company.legal_name}
                    onChange={(value) =>
                      setCompany({
                        ...company,
                        legal_name: value,
                      })
                    }
                    placeholder="Ex : Martin Rénovation SAS"
                  />

                  <Field
                    label="SIRET"
                    value={company.siret}
                    onChange={(value) =>
                      setCompany({
                        ...company,
                        siret: value,
                      })
                    }
                    placeholder="123 456 789 00012"
                  />

                  <Field
                    label="N° TVA"
                    value={company.vat_number}
                    onChange={(value) =>
                      setCompany({
                        ...company,
                        vat_number: value,
                      })
                    }
                    placeholder="FR00123456789"
                  />

                  <Field
                    label="Téléphone"
                    value={company.phone}
                    onChange={(value) =>
                      setCompany({
                        ...company,
                        phone: value,
                      })
                    }
                    placeholder="06 00 00 00 00"
                  />

                  <Field
                    label="Email professionnel"
                    value={company.email}
                    onChange={(value) =>
                      setCompany({
                        ...company,
                        email: value,
                      })
                    }
                    placeholder="contact@entreprise.fr"
                  />

                  <Field
                    label="Site internet"
                    value={company.website}
                    onChange={(value) =>
                      setCompany({
                        ...company,
                        website: value,
                      })
                    }
                    placeholder="https://..."
                  />

                  <div className="md:col-span-2">
                    <Field
                      label="Adresse"
                      value={company.address}
                      onChange={(value) =>
                        setCompany({
                          ...company,
                          address: value,
                        })
                      }
                      placeholder="12 rue du Bâtiment"
                    />
                  </div>

                  <Field
                    label="Code postal"
                    value={company.postal_code}
                    onChange={(value) =>
                      setCompany({
                        ...company,
                        postal_code: value,
                      })
                    }
                    placeholder="75001"
                  />

                  <Field
                    label="Ville"
                    value={company.city}
                    onChange={(value) =>
                      setCompany({
                        ...company,
                        city: value,
                      })
                    }
                    placeholder="Paris"
                  />
                </div>

                <div className="mt-7 flex justify-end">
                  <SaveButton
                    loading={savingCompany}
                    onClick={saveCompany}
                    label="Enregistrer l’entreprise"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "profil" && (
            <div className="rounded-xl border border-slate-200 bg-white">
              <SettingsHeader
                title="Mon profil"
                description="Gérez les informations associées à votre compte BatiPilot."
                icon={<User className="h-5 w-5" />}
              />

              <div className="p-6">
                <div className="mb-7 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {(firstName?.[0] || userEmail?.[0] || "U").toUpperCase()}
                    {(lastName?.[0] || "").toUpperCase()}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {`${firstName} ${lastName}`.trim() || "Utilisateur"}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {userEmail}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field
                    label="Prénom"
                    value={firstName}
                    onChange={setFirstName}
                    placeholder="Votre prénom"
                  />

                  <Field
                    label="Nom"
                    value={lastName}
                    onChange={setLastName}
                    placeholder="Votre nom"
                  />

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Adresse email
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        value={userEmail}
                        disabled
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-500"
                      />
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      L’adresse email de connexion n’est pas modifiée depuis cet écran.
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex justify-end">
                  <SaveButton
                    loading={savingProfile}
                    onClick={saveProfile}
                    label="Enregistrer le profil"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="rounded-xl border border-slate-200 bg-white">
              <SettingsHeader
                title="Notifications"
                description="Choisissez les événements pour lesquels vous souhaitez recevoir des notifications."
                icon={<Bell className="h-5 w-5" />}
              />

              <div className="p-6">
                <div className="space-y-3">
                  <ToggleRow
                    title="Notifications par email"
                    description="Autoriser BatiPilot à vous envoyer des notifications par email."
                    checked={notifications.email_notifications}
                    onChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email_notifications: checked,
                      })
                    }
                  />

                  <ToggleRow
                    title="Nouveau client ou prospect"
                    description="Être informé lorsqu’un nouveau contact entre dans BatiPilot."
                    checked={notifications.new_client_notification}
                    onChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        new_client_notification: checked,
                      })
                    }
                  />

                  <ToggleRow
                    title="Devis"
                    description="Recevoir les notifications liées aux devis."
                    checked={notifications.devis_notification}
                    onChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        devis_notification: checked,
                      })
                    }
                  />

                  <ToggleRow
                    title="Chantiers"
                    description="Recevoir les alertes et événements liés aux chantiers."
                    checked={notifications.chantier_notification}
                    onChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        chantier_notification: checked,
                      })
                    }
                  />

                  <ToggleRow
                    title="Rendez-vous"
                    description="Recevoir les rappels de rendez-vous."
                    checked={notifications.rendez_vous_notification}
                    onChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        rendez_vous_notification: checked,
                      })
                    }
                  />

                  <ToggleRow
                    title="Relances"
                    description="Être alerté des relances importantes et en retard."
                    checked={notifications.relance_notification}
                    onChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        relance_notification: checked,
                      })
                    }
                  />

                  <ToggleRow
                    title="Automatisations"
                    description="Être informé des actions importantes exécutées automatiquement."
                    checked={notifications.automation_notification}
                    onChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        automation_notification: checked,
                      })
                    }
                  />
                </div>

                <div className="mt-7 flex justify-end">
                  <SaveButton
                    loading={savingNotifications}
                    onClick={saveNotifications}
                    label="Enregistrer les notifications"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "securite" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white">
                <SettingsHeader
                  title="Mot de passe"
                  description="Modifiez le mot de passe de votre compte BatiPilot."
                  icon={<LockKeyhole className="h-5 w-5" />}
                />

                <div className="p-6">
                  <div className="max-w-xl space-y-5">
                    <PasswordField
                      label="Nouveau mot de passe"
                      value={newPassword}
                      onChange={setNewPassword}
                      visible={showPassword}
                      onToggle={() => setShowPassword(!showPassword)}
                    />

                    <PasswordField
                      label="Confirmer le mot de passe"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      visible={showPassword}
                      onToggle={() => setShowPassword(!showPassword)}
                    />

                    <p className="text-xs leading-5 text-slate-500">
                      Utilisez au minimum 8 caractères. Évitez d’utiliser un mot de passe déjà utilisé sur un autre service.
                    </p>

                    <SaveButton
                      loading={savingPassword}
                      onClick={updatePassword}
                      label="Modifier le mot de passe"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      Compte protégé par Supabase Auth
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                      Votre authentification et votre mot de passe sont gérés par le système d’authentification Supabase de BatiPilot.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsNav({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SettingsHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-100 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function SaveButton({
  loading,
  onClick,
  label,
}: {
  loading: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}

      {label}
    </button>
  );
}
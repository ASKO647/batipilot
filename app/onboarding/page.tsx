"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  HardHat,
  Loader2,
  MapPin,
  Settings2,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type FormState = {
  companyName: string;
  legalName: string;
  siret: string;
  vatNumber: string;
  businessType: string;
  companySize: string;
  employeeCount: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  postalCode: string;
  customerTypes: string[];
  services: string[];
  interventionAreas: string;
  defaultVat: string;
  quoteValidityDays: string;
  invoicePaymentDays: string;
  enabledFeatures: string[];
};

const initialForm: FormState = {
  companyName: "",
  legalName: "",
  siret: "",
  vatNumber: "",
  businessType: "",
  companySize: "",
  employeeCount: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  postalCode: "",
  customerTypes: [],
  services: [],
  interventionAreas: "",
  defaultVat: "20",
  quoteValidityDays: "30",
  invoicePaymentDays: "30",
  enabledFeatures: [],
};

const businessTypes = [
  "Entreprise générale du bâtiment",
  "Rénovation",
  "Maçonnerie",
  "Plomberie",
  "Électricité",
  "Chauffage / Climatisation",
  "Menuiserie",
  "Peinture",
  "Couverture / Charpente",
  "Isolation",
  "Carrelage / Sols",
  "Paysage / Extérieurs",
  "Autre",
];

const serviceChoices = [
  "Construction",
  "Rénovation complète",
  "Maçonnerie",
  "Plomberie",
  "Électricité",
  "Chauffage / Climatisation",
  "Menuiserie",
  "Peinture",
  "Couverture / Charpente",
  "Isolation",
  "Carrelage / Sols",
  "Aménagement intérieur",
  "Façade",
  "Terrassement",
  "Entretien / Dépannage",
];

const featureChoices = [
  { value: "devis_factures", label: "Devis & factures", description: "Centraliser le cycle commercial et la facturation." },
  { value: "chantiers", label: "Suivi de chantiers", description: "Piloter l’avancement, les tâches et les documents." },
  { value: "relances", label: "Relances", description: "Ne plus oublier les prospects et devis à relancer." },
  { value: "appels_offres", label: "Appels d’offres", description: "Suivre les opportunités et les échéances." },
  { value: "aides", label: "Dossiers d’aides", description: "Organiser les dossiers et pièces nécessaires." },
  { value: "automatisations", label: "Automatisations", description: "Déclencher automatiquement les actions répétitives." },
  { value: "agents_ia", label: "Agents IA", description: "Assister les équipes sur les opérations quotidiennes." },
  { value: "telephone_ia", label: "Téléphone IA", description: "Préparer la gestion intelligente des appels." },
  { value: "marketing_ia", label: "Marketing IA", description: "Créer et organiser les actions marketing." },
];

const steps = [
  { number: 1, title: "Entreprise", icon: Building2 },
  { number: 2, title: "Coordonnées", icon: UserRound },
  { number: 3, title: "Activité BTP", icon: HardHat },
  { number: 4, title: "Configuration", icon: Settings2 },
  { number: 5, title: "Fonctionnalités", icon: Sparkles },
  { number: 6, title: "Terminé", icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [organizationId, setOrganizationId] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadOnboarding();
  }, []);

  async function loadOnboarding() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/connexion?redirectTo=/onboarding");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id,full_name,phone")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError("Impossible de charger votre profil.");
      setLoading(false);
      return;
    }

    if (!profile?.organization_id) {
      setError(
        "Votre compte n’est rattaché à aucune entreprise. Contactez le support BatiPilot."
      );
      setLoading(false);
      return;
    }

    const orgId = profile.organization_id;
    setOrganizationId(orgId);
    setUserId(user.id);

    const [{ data: organization }, { data: settings, error: settingsError }] =
      await Promise.all([
        supabase
          .from("organizations")
          .select("name,phone,email,address")
          .eq("id", orgId)
          .maybeSingle(),
        supabase
          .from("organization_settings")
          .select("*")
          .eq("organization_id", orgId)
          .maybeSingle(),
      ]);

    if (settingsError) {
      setError("Impossible de charger la configuration de votre entreprise.");
      setLoading(false);
      return;
    }

    if (settings?.onboarding_completed) {
      router.replace("/dashboard");
      return;
    }

    const metadataFirstName =
      user.user_metadata?.first_name || user.user_metadata?.given_name || "";
    const metadataLastName =
      user.user_metadata?.last_name || user.user_metadata?.family_name || "";

    let firstName = metadataFirstName;
    let lastName = metadataLastName;

    if ((!firstName || !lastName) && profile.full_name) {
      const parts = String(profile.full_name).trim().split(/\s+/);
      if (!firstName) firstName = parts.shift() || "";
      if (!lastName) lastName = parts.join(" ");
    }

    setForm({
      companyName: settings?.company_name || organization?.name || "",
      legalName: settings?.legal_name || "",
      siret: settings?.siret || "",
      vatNumber: settings?.vat_number || "",
      businessType: settings?.business_type || "",
      companySize: settings?.company_size || "",
      employeeCount:
        settings?.employee_count === null ||
        settings?.employee_count === undefined
          ? ""
          : String(settings.employee_count),
      firstName,
      lastName,
      phone: profile.phone || settings?.phone || organization?.phone || "",
      email: settings?.email || organization?.email || user.email || "",
      website: settings?.website || "",
      address: settings?.address || organization?.address || "",
      city: settings?.city || "",
      postalCode: settings?.postal_code || "",
      customerTypes: Array.isArray(settings?.customer_types)
        ? settings.customer_types
        : [],
      services: Array.isArray(settings?.services) ? settings.services : [],
      interventionAreas: Array.isArray(settings?.intervention_areas)
        ? settings.intervention_areas.join(", ")
        : "",
      defaultVat:
        settings?.default_vat === null || settings?.default_vat === undefined
          ? "20"
          : String(settings.default_vat),
      quoteValidityDays:
        settings?.quote_validity_days === null ||
        settings?.quote_validity_days === undefined
          ? "30"
          : String(settings.quote_validity_days),
      invoicePaymentDays:
        settings?.invoice_payment_days === null ||
        settings?.invoice_payment_days === undefined
          ? "30"
          : String(settings.invoice_payment_days),
      enabledFeatures: Array.isArray(settings?.enabled_features)
        ? settings.enabled_features
        : [],
    });

    setLoading(false);
  }

  const progress = useMemo(() => Math.round((step / 6) * 100), [step]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function toggleArrayField(
    field: "customerTypes" | "services" | "enabledFeatures",
    value: string
  ) {
    setForm((current) => {
      const values = current[field];
      return {
        ...current,
        [field]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
    setError("");
  }

  function validateCurrentStep() {
    if (step === 1) {
      if (!form.companyName.trim()) return "Renseignez le nom de l’entreprise.";
      if (!form.businessType.trim()) return "Sélectionnez votre activité principale.";
      if (!form.companySize.trim()) return "Sélectionnez la taille de l’entreprise.";
    }

    if (step === 2) {
      if (!form.firstName.trim()) return "Renseignez votre prénom.";
      if (!form.lastName.trim()) return "Renseignez votre nom.";
      if (!form.email.trim()) return "Renseignez votre email professionnel.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        return "L’adresse email n’est pas valide.";
      if (!form.phone.trim()) return "Renseignez votre numéro de téléphone.";
      if (!form.address.trim()) return "Renseignez l’adresse de l’entreprise.";
      if (!form.postalCode.trim()) return "Renseignez le code postal.";
      if (!form.city.trim()) return "Renseignez la ville.";
    }

    if (step === 3) {
      if (form.customerTypes.length === 0)
        return "Sélectionnez au moins un type de clientèle.";
      if (form.services.length === 0)
        return "Sélectionnez au moins un service.";
      if (!form.interventionAreas.trim())
        return "Renseignez au moins une zone d’intervention.";
    }

    if (step === 4) {
      const vat = Number(form.defaultVat);
      const quoteDays = Number(form.quoteValidityDays);
      const paymentDays = Number(form.invoicePaymentDays);

      if (!Number.isFinite(vat) || vat < 0 || vat > 100)
        return "Le taux de TVA doit être compris entre 0 et 100.";
      if (!Number.isInteger(quoteDays) || quoteDays < 1 || quoteDays > 365)
        return "La validité des devis doit être comprise entre 1 et 365 jours.";
      if (!Number.isInteger(paymentDays) || paymentDays < 0 || paymentDays > 365)
        return "Le délai de paiement doit être compris entre 0 et 365 jours.";
    }

    if (step === 5 && form.enabledFeatures.length === 0) {
      return "Sélectionnez au moins une fonctionnalité.";
    }

    return "";
  }

  async function saveProgress() {
    if (!organizationId || !userId) return false;

    setSaving(true);
    setError("");

    const interventionAreas = form.interventionAreas
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

    const settingsPayload = {
      organization_id: organizationId,
      company_name: form.companyName.trim(),
      legal_name: form.legalName.trim() || null,
      siret: form.siret.replace(/\s/g, "") || null,
      vat_number: form.vatNumber.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      postal_code: form.postalCode.trim() || null,
      business_type: form.businessType || null,
      company_size: form.companySize || null,
      employee_count: form.employeeCount.trim()
        ? Number(form.employeeCount)
        : null,
      customer_types: form.customerTypes,
      services: form.services,
      intervention_areas: interventionAreas,
      default_vat: Number(form.defaultVat),
      quote_validity_days: Number(form.quoteValidityDays),
      invoice_payment_days: Number(form.invoicePaymentDays),
      enabled_features: form.enabledFeatures,
      onboarding_completed: false,
      onboarding_completed_at: null,
      updated_at: new Date().toISOString(),
    };

    const { error: settingsError } = await supabase
      .from("organization_settings")
      .upsert(settingsPayload, { onConflict: "organization_id" });

    if (settingsError) {
      console.error(settingsError);
      setError(
        "Impossible d’enregistrer l’onboarding. Vérifiez la configuration Supabase."
      );
      setSaving(false);
      return false;
    }

    const [{ error: profileError }, { error: organizationError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .update({
            full_name: fullName || null,
            phone: form.phone.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId),
        supabase
          .from("organizations")
          .update({
            name: form.companyName.trim(),
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            address: form.address.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", organizationId),
      ]);

    if (profileError || organizationError) {
      console.error(profileError || organizationError);
      setError("Certaines informations n’ont pas pu être enregistrées.");
      setSaving(false);
      return false;
    }

    setSaving(false);
    return true;
  }

  async function nextStep() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    const saved = await saveProgress();
    if (!saved) return;

    setStep((current) => Math.min(6, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previousStep() {
    setError("");
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function completeOnboarding(event?: FormEvent) {
    event?.preventDefault();

    if (!organizationId || !userId) return;

    setSaving(true);
    setError("");

    const saved = await saveProgress();
    if (!saved) {
      setSaving(false);
      return;
    }

    const completedAt = new Date().toISOString();

    const { error: completionError } = await supabase
      .from("organization_settings")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq("organization_id", organizationId);

    if (completionError) {
      console.error(completionError);
      setError("Impossible de finaliser l’onboarding.");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.replace("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <HardHat className="h-6 w-6" />
          </div>
          <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-blue-600" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            Préparation de votre espace BatiPilot...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <div className="flex items-center gap-2.5">
            <img
  src="/image/batipilot-logo.png"
  alt="BatiPilot"
  className="h-10 w-10 rounded-xl object-cover"
/>
            <div>
              <p className="text-base font-bold tracking-tight">BatiPilot</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Configuration
              </p>
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-slate-700">
              Mise en route de votre entreprise
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Étape {step} sur 6
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside>
            <div className="sticky top-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">
                  Bienvenue
                </p>
                <h1 className="mt-2 text-xl font-bold tracking-tight">
                  Configurez BatiPilot
                </h1>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Quelques informations suffisent pour préparer votre espace de travail.
                </p>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-500">Progression</span>
                    <span className="text-blue-600">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3">
                {steps.map((item) => {
                  const Icon = item.icon;
                  const active = step === item.number;
                  const done = step > item.number;

                  return (
                    <div
                      key={item.number}
                      className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 ${
                        active
                          ? "bg-blue-50"
                          : done
                            ? "bg-emerald-50/50"
                            : ""
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          active
                            ? "bg-blue-600 text-white"
                            : done
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {done ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-xs font-bold ${
                            active
                              ? "text-blue-700"
                              : done
                                ? "text-emerald-700"
                                : "text-slate-500"
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Étape {item.number}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <section>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">
                  Étape {step} sur 6
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  {getStepTitle(step)}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {getStepDescription(step)}
                </p>
              </div>

              <div className="p-6 sm:p-8">
                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Nom commercial"
                      required
                      value={form.companyName}
                      onChange={(value) => updateField("companyName", value)}
                      placeholder="Ex. Martin Rénovation"
                    />
                    <Field
                      label="Raison sociale"
                      value={form.legalName}
                      onChange={(value) => updateField("legalName", value)}
                      placeholder="Ex. MARTIN BÂTIMENT SAS"
                    />
                    <Field
                      label="SIRET"
                      value={form.siret}
                      onChange={(value) => updateField("siret", value)}
                      placeholder="14 chiffres"
                      maxLength={18}
                    />
                    <Field
                      label="N° TVA intracommunautaire"
                      value={form.vatNumber}
                      onChange={(value) => updateField("vatNumber", value)}
                      placeholder="Ex. FR12345678901"
                    />

                    <SelectField
                      label="Activité principale"
                      required
                      value={form.businessType}
                      onChange={(value) => updateField("businessType", value)}
                      options={businessTypes}
                      placeholder="Sélectionner une activité"
                    />

                    <SelectField
                      label="Taille de l’entreprise"
                      required
                      value={form.companySize}
                      onChange={(value) => updateField("companySize", value)}
                      options={[
                        "Indépendant",
                        "2 à 5 salariés",
                        "6 à 10 salariés",
                        "11 à 25 salariés",
                        "26 à 50 salariés",
                        "51 salariés et plus",
                      ]}
                      placeholder="Sélectionner une taille"
                    />

                    <Field
                      label="Nombre de salariés"
                      value={form.employeeCount}
                      onChange={(value) => updateField("employeeCount", value)}
                      placeholder="Ex. 8"
                      type="number"
                      min="0"
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Prénom du responsable"
                      required
                      value={form.firstName}
                      onChange={(value) => updateField("firstName", value)}
                      placeholder="Prénom"
                    />
                    <Field
                      label="Nom du responsable"
                      required
                      value={form.lastName}
                      onChange={(value) => updateField("lastName", value)}
                      placeholder="Nom"
                    />
                    <Field
                      label="Téléphone"
                      required
                      value={form.phone}
                      onChange={(value) => updateField("phone", value)}
                      placeholder="06 00 00 00 00"
                      type="tel"
                    />
                    <Field
                      label="Email professionnel"
                      required
                      value={form.email}
                      onChange={(value) => updateField("email", value)}
                      placeholder="contact@entreprise.fr"
                      type="email"
                    />
                    <Field
                      label="Site internet"
                      value={form.website}
                      onChange={(value) => updateField("website", value)}
                      placeholder="https://..."
                      type="url"
                    />
                    <div className="hidden sm:block" />
                    <div className="sm:col-span-2">
                      <Field
                        label="Adresse"
                        required
                        value={form.address}
                        onChange={(value) => updateField("address", value)}
                        placeholder="12 rue du Chantier"
                      />
                    </div>
                    <Field
                      label="Code postal"
                      required
                      value={form.postalCode}
                      onChange={(value) => updateField("postalCode", value)}
                      placeholder="75000"
                    />
                    <Field
                      label="Ville"
                      required
                      value={form.city}
                      onChange={(value) => updateField("city", value)}
                      placeholder="Paris"
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8">
                    <ChoiceSection
                      title="Quels types de clients accompagnez-vous ?"
                      description="Sélectionnez une ou plusieurs réponses."
                      choices={["Particuliers", "Professionnels", "Collectivités"]}
                      selected={form.customerTypes}
                      onToggle={(value) =>
                        toggleArrayField("customerTypes", value)
                      }
                    />

                    <ChoiceSection
                      title="Quels services proposez-vous ?"
                      description="Ces informations permettront de mieux adapter votre espace."
                      choices={serviceChoices}
                      selected={form.services}
                      onToggle={(value) => toggleArrayField("services", value)}
                    />

                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-700">
                        Zones d’intervention <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <textarea
                          value={form.interventionAreas}
                          onChange={(e) =>
                            updateField("interventionAreas", e.target.value)
                          }
                          rows={3}
                          placeholder="Ex. Paris, Hauts-de-Seine, Val-de-Marne"
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400">
                        Séparez plusieurs zones par des virgules.
                      </p>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field
                      label="TVA par défaut (%)"
                      required
                      value={form.defaultVat}
                      onChange={(value) => updateField("defaultVat", value)}
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <Field
                      label="Validité des devis (jours)"
                      required
                      value={form.quoteValidityDays}
                      onChange={(value) =>
                        updateField("quoteValidityDays", value)
                      }
                      type="number"
                      min="1"
                      max="365"
                    />
                    <Field
                      label="Délai de paiement (jours)"
                      required
                      value={form.invoicePaymentDays}
                      onChange={(value) =>
                        updateField("invoicePaymentDays", value)
                      }
                      type="number"
                      min="0"
                      max="365"
                    />

                    <div className="sm:col-span-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                          <Settings2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            Paramètres de gestion
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Ces valeurs seront utilisées comme réglages par défaut
                            dans BatiPilot. Vous pourrez toujours les modifier depuis
                            les paramètres de votre entreprise.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {featureChoices.map((feature) => {
                        const selected = form.enabledFeatures.includes(
                          feature.value
                        );

                        return (
                          <button
                            key={feature.value}
                            type="button"
                            onClick={() =>
                              toggleArrayField(
                                "enabledFeatures",
                                feature.value
                              )
                            }
                            className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition ${
                              selected
                                ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                                selected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {feature.label}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {feature.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="mx-auto max-w-2xl py-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>

                    <h3 className="mt-6 text-2xl font-bold tracking-tight">
                      Votre espace est prêt
                    </h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                      BatiPilot dispose maintenant des informations essentielles
                      pour configurer votre entreprise et votre environnement de travail.
                    </p>

                    <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
                      <SummaryItem
                        label="Entreprise"
                        value={form.companyName || "—"}
                      />
                      <SummaryItem
                        label="Activité"
                        value={form.businessType || "—"}
                      />
                      <SummaryItem
                        label="Responsable"
                        value={`${form.firstName} ${form.lastName}`.trim() || "—"}
                      />
                      <SummaryItem
                        label="Localisation"
                        value={
                          [form.postalCode, form.city].filter(Boolean).join(" ") ||
                          "—"
                        }
                      />
                      <SummaryItem
                        label="Services"
                        value={`${form.services.length} sélectionné(s)`}
                      />
                      <SummaryItem
                        label="Fonctionnalités"
                        value={`${form.enabledFeatures.length} sélectionnée(s)`}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void completeOnboarding()}
                      className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Finalisation...
                        </>
                      ) : (
                        <>
                          Accéder à BatiPilot
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {step < 6 && (
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:px-8">
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={step === 1 || saving}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                  </button>

                  <button
                    type="button"
                    onClick={() => void nextStep()}
                    disabled={saving}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        Continuer
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              Vos informations sont enregistrées dans votre espace sécurisé BatiPilot.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  min,
  max,
  step,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}

function SelectField({
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChoiceSection({
  title,
  description,
  choices,
  selected,
  onToggle,
}: {
  title: string;
  description: string;
  choices: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-sm font-bold text-slate-800">
          {title} <span className="text-red-500">*</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => {
          const active = selected.includes(choice);
          return (
            <button
              key={choice}
              type="button"
              onClick={() => onToggle(choice)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${
                active
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {active && <Check className="h-3.5 w-3.5" />}
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function getStepTitle(step: number) {
  const titles: Record<number, string> = {
    1: "Parlez-nous de votre entreprise",
    2: "Vos coordonnées professionnelles",
    3: "Votre activité dans le bâtiment",
    4: "Vos paramètres de gestion",
    5: "Que voulez-vous piloter avec BatiPilot ?",
    6: "Configuration terminée",
  };

  return titles[step];
}

function getStepDescription(step: number) {
  const descriptions: Record<number, string> = {
    1: "Ces informations permettent d’identifier correctement votre entreprise dans BatiPilot.",
    2: "Elles seront utilisées dans votre espace et dans vos documents professionnels.",
    3: "Indiquez vos métiers, votre clientèle et vos principales zones d’intervention.",
    4: "Définissez les valeurs qui seront proposées par défaut dans vos devis et factures.",
    5: "Sélectionnez les modules les plus importants pour votre entreprise.",
    6: "Vérifiez le résumé puis ouvrez votre espace BatiPilot.",
  };

  return descriptions[step];
}
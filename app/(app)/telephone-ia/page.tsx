"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Phone,
  PhoneCall,
  PhoneIncoming,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  UserRound,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type DayConfig = {
  open: boolean;
  start: string;
  end: string;
};

type OpeningHours = {
  lundi: DayConfig;
  mardi: DayConfig;
  mercredi: DayConfig;
  jeudi: DayConfig;
  vendredi: DayConfig;
  samedi: DayConfig;
  dimanche: DayConfig;
};

type Capabilities = {
  answerCalls: boolean;
  qualifyProspects: boolean;
  proposeAppointments: boolean;
  createFollowUps: boolean;
  identifyProjectType: boolean;
  summarizeConversation: boolean;
};

type QualificationFields = {
  lastName: boolean;
  firstName: boolean;
  phone: boolean;
  email: boolean;
  address: boolean;
  projectType: boolean;
  estimatedBudget: boolean;
  desiredTimeline: boolean;
  needDescription: boolean;
};

type Automations = {
  createProspect: boolean;
  createFollowUp: boolean;
  proposeAppointment: boolean;
  sendSummary: boolean;
  notifyTeam: boolean;
};

type Personality =
  | "Professionnel"
  | "Chaleureux"
  | "Direct"
  | "Premium";

type TelephoneAssistant = {
  id: string;
  organization_id: string;
  name: string;
  company_name: string | null;
  phone_number: string | null;
  language: string;
  personality: Personality;
  instructions: string | null;
  active: boolean;
  opening_hours: OpeningHours;
  capabilities: Capabilities;
  qualification_fields: QualificationFields;
  automations: Automations;
  created_at: string;
  updated_at: string;
};

type PhoneCall = {
  id: string;
  organization_id: string;
  contact_name: string | null;
  phone_number: string | null;
  date: string | null;
  time: string | null;
  duration: number | null;
  status: string;
  summary: string | null;
  identified_need: string | null;
  created_action_ids: string[] | null;
  created_at: string;
};

const defaultOpeningHours: OpeningHours = {
  lundi: { open: true, start: "08:00", end: "18:00" },
  mardi: { open: true, start: "08:00", end: "18:00" },
  mercredi: { open: true, start: "08:00", end: "18:00" },
  jeudi: { open: true, start: "08:00", end: "18:00" },
  vendredi: { open: true, start: "08:00", end: "18:00" },
  samedi: { open: false, start: "09:00", end: "12:00" },
  dimanche: { open: false, start: "09:00", end: "12:00" },
};

const defaultCapabilities: Capabilities = {
  answerCalls: true,
  qualifyProspects: true,
  proposeAppointments: true,
  createFollowUps: true,
  identifyProjectType: true,
  summarizeConversation: true,
};

const defaultQualificationFields: QualificationFields = {
  lastName: true,
  firstName: true,
  phone: true,
  email: true,
  address: true,
  projectType: true,
  estimatedBudget: true,
  desiredTimeline: true,
  needDescription: true,
};

const defaultAutomations: Automations = {
  createProspect: true,
  createFollowUp: true,
  proposeAppointment: true,
  sendSummary: true,
  notifyTeam: true,
};

const days: {
  key: keyof OpeningHours;
  label: string;
}[] = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
];

const capabilitiesList: {
  key: keyof Capabilities;
  title: string;
  description: string;
}[] = [
  {
    key: "answerCalls",
    title: "Répondre aux appels",
    description: "L’assistant peut prendre en charge les appels entrants.",
  },
  {
    key: "qualifyProspects",
    title: "Qualifier les prospects",
    description:
      "Il collecte les informations nécessaires pour qualifier une demande.",
  },
  {
    key: "proposeAppointments",
    title: "Proposer des rendez-vous",
    description:
      "Il peut proposer un rendez-vous adapté au besoin de l’appelant.",
  },
  {
    key: "createFollowUps",
    title: "Préparer des relances",
    description:
      "Il peut préparer une relance lorsqu’un suivi commercial est nécessaire.",
  },
  {
    key: "identifyProjectType",
    title: "Identifier le type de projet",
    description:
      "Il détermine la nature du chantier ou du besoin exprimé.",
  },
  {
    key: "summarizeConversation",
    title: "Résumer la conversation",
    description:
      "Il génère un résumé structuré à la fin de chaque appel.",
  },
];

const qualificationList: {
  key: keyof QualificationFields;
  title: string;
}[] = [
  { key: "lastName", title: "Nom" },
  { key: "firstName", title: "Prénom" },
  { key: "phone", title: "Téléphone" },
  { key: "email", title: "Email" },
  { key: "address", title: "Adresse du projet" },
  { key: "projectType", title: "Type de projet" },
  { key: "estimatedBudget", title: "Budget estimé" },
  { key: "desiredTimeline", title: "Délai souhaité" },
  { key: "needDescription", title: "Description du besoin" },
];

const automationList: {
  key: keyof Automations;
  title: string;
  description: string;
}[] = [
  {
    key: "createProspect",
    title: "Créer le prospect",
    description:
      "Ajoute automatiquement le contact qualifié dans les prospects.",
  },
  {
    key: "createFollowUp",
    title: "Créer une relance",
    description:
      "Prépare une relance lorsqu’une action commerciale est nécessaire.",
  },
  {
    key: "proposeAppointment",
    title: "Proposer un rendez-vous",
    description:
      "Permet à l’assistant d’orienter l’appelant vers un rendez-vous.",
  },
  {
    key: "sendSummary",
    title: "Enregistrer le résumé",
    description:
      "Conserve automatiquement le résumé et le besoin identifié.",
  },
  {
    key: "notifyTeam",
    title: "Notifier l’équipe",
    description:
      "Prévoit une notification lorsqu’un appel nécessite une intervention.",
  },
];

const personalities: {
  value: Personality;
  description: string;
}[] = [
  {
    value: "Professionnel",
    description: "Clair, sérieux et efficace.",
  },
  {
    value: "Chaleureux",
    description: "Accueillant, humain et rassurant.",
  },
  {
    value: "Direct",
    description: "Rapide, concis et orienté résultat.",
  },
  {
    value: "Premium",
    description: "Soigné, élégant et très attentif.",
  },
];

export default function TelephoneIAPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);

  const [name, setName] = useState("Assistant BatiPilot");
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [language, setLanguage] = useState("Français");
  const [personality, setPersonality] =
    useState<Personality>("Professionnel");
  const [instructions, setInstructions] = useState("");
  const [active, setActive] = useState(false);

  const [openingHours, setOpeningHours] =
    useState<OpeningHours>(defaultOpeningHours);

  const [capabilities, setCapabilities] =
    useState<Capabilities>(defaultCapabilities);

  const [qualificationFields, setQualificationFields] =
    useState<QualificationFields>(defaultQualificationFields);

  const [automations, setAutomations] =
    useState<Automations>(defaultAutomations);

  const [calls, setCalls] = useState<PhoneCall[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [callSearch, setCallSearch] = useState("");
  const [callStatus, setCallStatus] = useState("Tous");

  useEffect(() => {
    loadPage();
  }, []);

  async function getOrganizationId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Erreur profil :", error);
      return null;
    }

    return profile?.organization_id || null;
  }

  async function loadPage() {
    setLoading(true);

    const orgId = await getOrganizationId();

    if (!orgId) {
      setLoading(false);
      return;
    }

    setOrganizationId(orgId);

    const [assistantResult, callsResult] = await Promise.all([
      supabase
        .from("telephone_assistants")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),

      supabase
        .from("phone_calls")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }),
    ]);

    if (assistantResult.error) {
      console.error(
        "Erreur chargement assistant :",
        assistantResult.error
      );
    }

    if (assistantResult.data) {
      hydrateAssistant(
        assistantResult.data as TelephoneAssistant
      );
    }

    if (callsResult.error) {
      console.error("Erreur chargement appels :", callsResult.error);
      setCalls([]);
    } else {
      setCalls((callsResult.data || []) as PhoneCall[]);
    }

    setLoading(false);
  }

  function hydrateAssistant(data: TelephoneAssistant) {
    setAssistantId(data.id);
    setName(data.name || "Assistant BatiPilot");
    setCompanyName(data.company_name || "");
    setPhoneNumber(data.phone_number || "");
    setLanguage(data.language || "Français");
    setPersonality(data.personality || "Professionnel");
    setInstructions(data.instructions || "");
    setActive(Boolean(data.active));

    setOpeningHours({
      ...defaultOpeningHours,
      ...(data.opening_hours || {}),
    });

    setCapabilities({
      ...defaultCapabilities,
      ...(data.capabilities || {}),
    });

    setQualificationFields({
      ...defaultQualificationFields,
      ...(data.qualification_fields || {}),
    });

    setAutomations({
      ...defaultAutomations,
      ...(data.automations || {}),
    });
  }

  async function saveAssistant() {
    if (!organizationId) {
      alert("Organisation introuvable.");
      return;
    }

    if (!name.trim()) {
      alert("Le nom de l’assistant est obligatoire.");
      return;
    }

    setSaving(true);
    setSaved(false);

    const payload = {
      organization_id: organizationId,
      name: name.trim(),
      company_name: companyName.trim() || null,
      phone_number: phoneNumber.trim() || null,
      language,
      personality,
      instructions: instructions.trim() || null,
      active,
      opening_hours: openingHours,
      capabilities,
      qualification_fields: qualificationFields,
      automations,
      updated_at: new Date().toISOString(),
    };

    if (assistantId) {
      const { error } = await supabase
        .from("telephone_assistants")
        .update(payload)
        .eq("id", assistantId);

      if (error) {
        console.error(error);
        alert(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("telephone_assistants")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        console.error(error);
        alert(error.message);
        setSaving(false);
        return;
      }

      if (data) {
        hydrateAssistant(data as TelephoneAssistant);
      }
    }

    setSaving(false);
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  async function toggleActive() {
    const nextValue = !active;
    setActive(nextValue);

    if (!assistantId || !organizationId) {
      return;
    }

    const { error } = await supabase
      .from("telephone_assistants")
      .update({
        active: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assistantId)
      .eq("organization_id", organizationId);

    if (error) {
      console.error(error);
      setActive(!nextValue);
      alert(error.message);
    }
  }

  function updateDay(
    day: keyof OpeningHours,
    field: keyof DayConfig,
    value: boolean | string
  ) {
    setOpeningHours((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value,
      },
    }));
  }

  const filteredCalls = useMemo(() => {
    const query = callSearch.trim().toLowerCase();

    return calls.filter((call) => {
      const matchesSearch =
        !query ||
        (call.contact_name || "").toLowerCase().includes(query) ||
        (call.phone_number || "").toLowerCase().includes(query) ||
        (call.identified_need || "").toLowerCase().includes(query);

      const matchesStatus =
        callStatus === "Tous" || call.status === callStatus;

      return matchesSearch && matchesStatus;
    });
  }, [calls, callSearch, callStatus]);

  const today = new Date().toISOString().slice(0, 10);

  const todayCalls = useMemo(
    () => calls.filter((call) => call.date === today).length,
    [calls, today]
  );

  const qualifiedCalls = useMemo(
    () =>
      calls.filter((call) => call.status === "Prospect qualifié")
        .length,
    [calls]
  );

  const missedCalls = useMemo(
    () => calls.filter((call) => call.status === "Manqué").length,
    [calls]
  );

  const averageDuration = useMemo(() => {
    const durations = calls
      .map((call) => call.duration)
      .filter(
        (duration): duration is number =>
          typeof duration === "number" && duration > 0
      );

    if (durations.length === 0) return 0;

    return Math.round(
      durations.reduce((sum, duration) => sum + duration, 0) /
        durations.length
    );
  }, [calls]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">
            Chargement du Téléphone IA...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
              Intelligence artificielle
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Téléphone IA
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Configurez votre assistant téléphonique pour accueillir,
            qualifier et orienter automatiquement vos appels entrants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadPage}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>

          <button
            type="button"
            onClick={toggleActive}
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition ${
              active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {active ? (
              <ToggleRight className="h-5 w-5" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}

            {active ? "Assistant actif" : "Assistant inactif"}
          </button>

          <button
            type="button"
            onClick={saveAssistant}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving
              ? "Enregistrement..."
              : saved
              ? "Enregistré"
              : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Appels aujourd’hui"
          value={todayCalls}
          subtitle="Historique du jour"
          icon={<PhoneIncoming className="h-5 w-5 text-blue-600" />}
        />

        <StatCard
          title="Prospects qualifiés"
          value={qualifiedCalls}
          subtitle="Dans l’historique"
          icon={<Users className="h-5 w-5 text-emerald-600" />}
        />

        <StatCard
          title="Appels manqués"
          value={missedCalls}
          subtitle="À surveiller"
          icon={<Phone className="h-5 w-5 text-rose-600" />}
        />

        <StatCard
          title="Durée moyenne"
          value={
            averageDuration > 0
              ? formatDuration(averageDuration)
              : "—"
          }
          subtitle="Sur les appels enregistrés"
          icon={<Clock3 className="h-5 w-5 text-violet-600" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card
            icon={<Bot className="h-5 w-5 text-blue-600" />}
            title="Identité de l’assistant"
            description="Configurez la manière dont votre assistant se présente."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nom de l’assistant">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="field"
                  placeholder="Assistant BatiPilot"
                />
              </Field>

              <Field label="Entreprise">
                <input
                  value={companyName}
                  onChange={(event) =>
                    setCompanyName(event.target.value)
                  }
                  className="field"
                  placeholder="Ex : Dupont Rénovation"
                />
              </Field>

              <Field label="Numéro de téléphone">
                <input
                  value={phoneNumber}
                  onChange={(event) =>
                    setPhoneNumber(event.target.value)
                  }
                  className="field"
                  placeholder="+33 1 00 00 00 00"
                />
              </Field>

              <Field label="Langue">
                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value)
                  }
                  className="field"
                >
                  <option>Français</option>
                  <option>Anglais</option>
                  <option>Espagnol</option>
                  <option>Allemand</option>
                  <option>Italien</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card
            icon={<WandSparkles className="h-5 w-5 text-violet-600" />}
            title="Personnalité"
            description="Choisissez le ton utilisé pendant les conversations."
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {personalities.map((item) => {
                const selected = personality === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPersonality(item.value)}
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={`text-sm font-bold ${
                            selected
                              ? "text-blue-700"
                              : "text-slate-800"
                          }`}
                        >
                          {item.value}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.description}
                        </p>
                      </div>

                      <SelectionCircle selected={selected} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card
            icon={<Clock3 className="h-5 w-5 text-amber-600" />}
            title="Horaires"
            description="Définissez les plages horaires configurées pour votre accueil téléphonique."
          >
            <div className="space-y-2">
              {days.map((day) => {
                const config = openingHours[day.key];

                return (
                  <div
                    key={day.key}
                    className="grid grid-cols-[110px_80px_1fr] items-center gap-3 rounded-xl border border-slate-100 px-4 py-3"
                  >
                    <p className="text-xs font-bold text-slate-700">
                      {day.label}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        updateDay(
                          day.key,
                          "open",
                          !config.open
                        )
                      }
                      className={`text-left text-xs font-semibold ${
                        config.open
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    >
                      {config.open ? "Ouvert" : "Fermé"}
                    </button>

                    {config.open ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="time"
                          value={config.start}
                          onChange={(event) =>
                            updateDay(
                              day.key,
                              "start",
                              event.target.value
                            )
                          }
                          className="time-field"
                        />

                        <span className="text-xs text-slate-400">
                          à
                        </span>

                        <input
                          type="time"
                          value={config.end}
                          onChange={(event) =>
                            updateDay(
                              day.key,
                              "end",
                              event.target.value
                            )
                          }
                          className="time-field"
                        />
                      </div>
                    ) : (
                      <p className="text-right text-xs text-slate-400">
                        Indisponible
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card
            icon={<Settings2 className="h-5 w-5 text-blue-600" />}
            title="Capacités"
            description="Sélectionnez les missions autorisées pour l’assistant."
          >
            <div className="space-y-2">
              {capabilitiesList.map((item) => (
                <ToggleRow
                  key={item.key}
                  title={item.title}
                  description={item.description}
                  enabled={capabilities[item.key]}
                  onClick={() =>
                    setCapabilities((current) => ({
                      ...current,
                      [item.key]: !current[item.key],
                    }))
                  }
                />
              ))}
            </div>
          </Card>

          <Card
            icon={<UserRound className="h-5 w-5 text-emerald-600" />}
            title="Qualification des prospects"
            description="Choisissez les informations que l’assistant doit chercher à obtenir."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {qualificationList.map((item) => {
                const selected =
                  qualificationFields[item.key];

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setQualificationFields((current) => ({
                        ...current,
                        [item.key]: !current[item.key],
                      }))
                    }
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold ${
                        selected
                          ? "text-blue-700"
                          : "text-slate-700"
                      }`}
                    >
                      {item.title}
                    </span>

                    <SelectionSquare selected={selected} />
                  </button>
                );
              })}
            </div>
          </Card>

          <Card
            icon={<Zap className="h-5 w-5 text-amber-600" />}
            title="Automatisations après appel"
            description="Configurez ce que BatiPilot devra pouvoir faire à la suite d’une conversation."
          >
            <div className="space-y-2">
              {automationList.map((item) => (
                <ToggleRow
                  key={item.key}
                  title={item.title}
                  description={item.description}
                  enabled={automations[item.key]}
                  onClick={() =>
                    setAutomations((current) => ({
                      ...current,
                      [item.key]: !current[item.key],
                    }))
                  }
                />
              ))}
            </div>
          </Card>

          <Card
            icon={<Sparkles className="h-5 w-5 text-violet-600" />}
            title="Instructions personnalisées"
            description="Donnez à l’assistant les règles spécifiques de votre entreprise."
          >
            <textarea
              value={instructions}
              onChange={(event) =>
                setInstructions(event.target.value)
              }
              className="field min-h-44 resize-y"
              placeholder="Ex : Présente-toi comme l’assistant de notre entreprise. Demande le type de travaux, la commune, le budget estimé et le délai souhaité. Si le prospect semble qualifié, propose un rendez-vous..."
            />

            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              Cette zone enregistre la configuration de comportement de
              l’assistant. La connexion réelle à un fournisseur de
              téléphonie/voix sera branchée séparément.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  État de l’assistant
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Configuration actuelle
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {active ? "ACTIF" : "INACTIF"}
              </span>
            </div>

            <div className="mt-5 flex h-40 items-center justify-center rounded-xl bg-slate-50">
              <div className="text-center">
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-400"
                  } shadow-sm`}
                >
                  <PhoneCall className="h-7 w-7" />
                </div>

                <p className="mt-3 text-sm font-bold text-slate-800">
                  {name || "Assistant BatiPilot"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {personality} · {language}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <MiniInfo
                label="Entreprise"
                value={companyName || "Non renseignée"}
              />

              <MiniInfo
                label="Numéro"
                value={phoneNumber || "Non attribué"}
              />

              <MiniInfo
                label="Capacités actives"
                value={`${Object.values(capabilities).filter(Boolean).length}/${
                  Object.keys(capabilities).length
                }`}
              />

              <MiniInfo
                label="Automatisations"
                value={`${Object.values(automations).filter(Boolean).length}/${
                  Object.keys(automations).length
                }`}
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  Configuration prête
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Cette page configure et enregistre votre assistant dans
                  BatiPilot. Le branchement à un numéro téléphonique et à
                  une IA vocale sera une intégration distincte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-blue-600" />

              <h2 className="text-sm font-bold text-slate-900">
                Historique des appels
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {calls.length} appel{calls.length > 1 ? "s" : ""} enregistré
              {calls.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={callSearch}
              onChange={(event) =>
                setCallSearch(event.target.value)
              }
              className="field sm:w-64"
              placeholder="Rechercher un appel..."
            />

            <select
              value={callStatus}
              onChange={(event) =>
                setCallStatus(event.target.value)
              }
              className="field sm:w-44"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Traité">Traité</option>
              <option value="Manqué">Manqué</option>
              <option value="À rappeler">À rappeler</option>
              <option value="Prospect qualifié">
                Prospect qualifié
              </option>
            </select>
          </div>
        </div>

        {filteredCalls.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
                <Phone className="h-5 w-5 text-slate-400" />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucun appel trouvé
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Les appels enregistrés apparaîtront ici.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCalls.map((call) => (
              <div
                key={call.id}
                className="grid gap-4 p-5 transition hover:bg-slate-50/60 lg:grid-cols-[1.1fr_0.8fr_0.8fr_1.4fr]"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {call.contact_name || "Contact inconnu"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {call.phone_number || "Numéro inconnu"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    {formatCallDate(call.date)}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {formatCallTime(call.time)}
                    {call.duration
                      ? ` · ${formatDuration(call.duration)}`
                      : ""}
                  </p>
                </div>

                <div>
                  <StatusBadge status={call.status} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    {call.identified_need || "Besoin non renseigné"}
                  </p>

                  {call.summary && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">
                      {call.summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .field {
          width: 100%;
          border-radius: 0.55rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.72rem 0.8rem;
          font-size: 0.75rem;
          color: rgb(15 23 42);
          outline: none;
          transition: border-color 0.15s ease;
        }

        .field:focus {
          border-color: rgb(59 130 246);
        }

        .time-field {
          min-width: 92px;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.55rem 0.65rem;
          font-size: 0.72rem;
          color: rgb(51 65 85);
          outline: none;
        }

        .time-field:focus {
          border-color: rgb(59 130 246);
        }
      `}</style>
    </div>
  );
}

function Card({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </span>

      {children}
    </label>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  onClick,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3.5">
      <div>
        <p className="text-xs font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-4 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="shrink-0"
      >
        {enabled ? (
          <ToggleRight className="h-8 w-8 text-blue-600" />
        ) : (
          <ToggleLeft className="h-8 w-8 text-slate-400" />
        )}
      </button>
    </div>
  );
}

function SelectionCircle({
  selected,
}: {
  selected: boolean;
}) {
  return (
    <div
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        selected
          ? "border-blue-600"
          : "border-slate-300"
      }`}
    >
      {selected && (
        <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
      )}
    </div>
  );
}

function SelectionSquare({
  selected,
}: {
  selected: boolean;
}) {
  return (
    <div
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
        selected
          ? "border-blue-600 bg-blue-600"
          : "border-slate-300 bg-white"
      }`}
    >
      {selected && (
        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-slate-500">{label}</span>

      <span className="max-w-[180px] truncate text-xs font-bold text-slate-700">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let classes = "bg-slate-100 text-slate-600";

  if (status === "Traité") {
    classes = "bg-blue-50 text-blue-700";
  }

  if (status === "Manqué") {
    classes = "bg-rose-50 text-rose-700";
  }

  if (status === "À rappeler") {
    classes = "bg-amber-50 text-amber-700";
  }

  if (status === "Prospect qualifié") {
    classes = "bg-emerald-50 text-emerald-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${classes}`}
    >
      {status}
    </span>
  );
}

function formatCallDate(date: string | null) {
  if (!date) return "Date inconnue";

  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCallTime(time: string | null) {
  if (!time) return "Heure inconnue";

  return time.slice(0, 5);
}

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds}s`;
}
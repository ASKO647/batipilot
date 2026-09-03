"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserRound,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Autonomy =
  | "Suggestions uniquement"
  | "Demander confirmation"
  | "Automatique";

type Agent = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sources: string[] | null;
  allowed_actions: string[] | null;
  instructions: string | null;
  autonomy: Autonomy;
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type AgentForm = {
  name: string;
  description: string;
  icon: string;
  sources: string[];
  allowed_actions: string[];
  instructions: string;
  autonomy: Autonomy;
  active: boolean;
};

const sourceOptions = [
  "Clients",
  "Devis",
  "Chantiers",
  "Relances",
  "Rendez-vous",
  "Dossiers d’aides",
];

const actionOptions = [
  "Créer une relance",
  "Créer un rendez-vous",
  "Créer un prospect",
  "Mettre à jour un statut",
  "Générer une recommandation",
];

const autonomyOptions: {
  value: Autonomy;
  title: string;
  description: string;
}[] = [
  {
    value: "Suggestions uniquement",
    title: "Suggestions uniquement",
    description:
      "L’agent analyse les données mais ne réalise aucune action.",
  },
  {
    value: "Demander confirmation",
    title: "Demander confirmation",
    description:
      "L’agent prépare les actions et demande votre validation.",
  },
  {
    value: "Automatique",
    title: "Automatique",
    description:
      "L’agent peut effectuer les actions autorisées automatiquement.",
  },
];

const iconOptions = [
  "Bot",
  "Sparkles",
  "Commercial",
  "Chantier",
  "Administratif",
];

function emptyForm(): AgentForm {
  return {
    name: "",
    description: "",
    icon: "Bot",
    sources: [],
    allowed_actions: [],
    instructions: "",
    autonomy: "Demander confirmation",
    active: true,
  };
}

export default function AgentsIAPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const [form, setForm] = useState<AgentForm>(emptyForm());

  useEffect(() => {
    loadAgents();
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

    if (error || !profile?.organization_id) {
      console.error("Erreur profil :", error);
      return null;
    }

    return profile.organization_id as string;
  }

  async function loadAgents() {
    setLoading(true);

    const organizationId = await getOrganizationId();

    if (!organizationId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("agents_ia")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement agents IA :", error);
      setAgents([]);
    } else {
      setAgents((data || []) as Agent[]);
    }

    setLoading(false);
  }

  function openCreateModal() {
    setEditingAgent(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEditModal(agent: Agent) {
    setEditingAgent(agent);

    setForm({
      name: agent.name || "",
      description: agent.description || "",
      icon: agent.icon || "Bot",
      sources: agent.sources || [],
      allowed_actions: agent.allowed_actions || [],
      instructions: agent.instructions || "",
      autonomy: agent.autonomy || "Demander confirmation",
      active: agent.active,
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingAgent(null);
    setForm(emptyForm());
  }

  function toggleArrayValue(
    key: "sources" | "allowed_actions",
    value: string
  ) {
    const current = form[key];

    if (current.includes(value)) {
      setForm({
        ...form,
        [key]: current.filter((item) => item !== value),
      });

      return;
    }

    setForm({
      ...form,
      [key]: [...current, value],
    });
  }

  async function saveAgent() {
    if (!form.name.trim()) {
      alert("Le nom de l’agent est obligatoire.");
      return;
    }

    if (!form.description.trim()) {
      alert("Ajoute une courte description de l’agent.");
      return;
    }

    setSaving(true);

    const organizationId = await getOrganizationId();

    if (!organizationId) {
      setSaving(false);
      return;
    }

    const payload = {
      organization_id: organizationId,
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon,
      sources: form.sources,
      allowed_actions: form.allowed_actions,
      instructions: form.instructions.trim() || null,
      autonomy: form.autonomy,
      active: form.active,
      updated_at: new Date().toISOString(),
    };

    if (editingAgent) {
      const { error } = await supabase
        .from("agents_ia")
        .update(payload)
        .eq("id", editingAgent.id);

      if (error) {
        console.error(error);
        alert(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("agents_ia")
        .insert(payload);

      if (error) {
        console.error(error);
        alert(error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    closeModal();
    await loadAgents();
  }

  async function toggleAgent(agent: Agent) {
    const { error } = await supabase
      .from("agents_ia")
      .update({
        active: !agent.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agent.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadAgents();
  }

  async function deleteAgent(agent: Agent) {
    const confirmed = window.confirm(
      `Supprimer définitivement l’agent "${agent.name}" ?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("agents_ia")
      .delete()
      .eq("id", agent.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadAgents();
  }

  const activeCount = useMemo(
    () => agents.filter((agent) => agent.active).length,
    [agents]
  );

  const automaticCount = useMemo(
    () =>
      agents.filter(
        (agent) => agent.autonomy === "Automatique" && agent.active
      ).length,
    [agents]
  );

  const totalActions = useMemo(
    () =>
      agents.reduce(
        (total, agent) => total + (agent.allowed_actions?.length || 0),
        0
      ),
    [agents]
  );

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
              Intelligence artificielle
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Agents IA
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Créez des agents spécialisés capables d&apos;analyser les données
            de votre entreprise et de vous assister dans vos tâches
            quotidiennes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadAgents}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nouvel agent
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Agents"
          value={agents.length}
          description="Agents configurés"
          icon={<Bot className="h-5 w-5 text-blue-600" />}
        />

        <StatCard
          label="Actifs"
          value={activeCount}
          description="Agents actuellement actifs"
          icon={<Check className="h-5 w-5 text-emerald-600" />}
        />

        <StatCard
          label="Automatiques"
          value={automaticCount}
          description="Agents en autonomie complète"
          icon={<Zap className="h-5 w-5 text-amber-600" />}
        />

        <StatCard
          label="Actions autorisées"
          value={totalActions}
          description="Capacités configurées"
          icon={<WandSparkles className="h-5 w-5 text-violet-600" />}
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex min-h-80 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />

              <p className="mt-3 text-sm text-slate-500">
                Chargement des agents...
              </p>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <Bot className="h-7 w-7 text-blue-600" />
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                Créez votre premier agent IA
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Configurez un agent spécialisé pour analyser vos clients,
                devis, chantiers, rendez-vous et autres données BatiPilot.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Créer un agent
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={() => openEditModal(agent)}
                onToggle={() => toggleAgent(agent)}
                onDelete={() => deleteAgent(agent)}
              />
            ))}

            <button
              type="button"
              onClick={openCreateModal}
              className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center transition hover:border-blue-300 hover:bg-blue-50/30"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
                <Plus className="h-5 w-5 text-slate-500" />
              </div>

              <p className="mt-4 text-sm font-bold text-slate-800">
                Ajouter un agent
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Créez un nouvel assistant spécialisé.
              </p>
            </button>
          </div>
        )}
      </div>

      <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Comment fonctionnent les agents IA ?
            </h3>

            <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-600">
              Chaque agent dispose de sources de données, d&apos;instructions
              et d&apos;actions autorisées. Son niveau d&apos;autonomie
              détermine s&apos;il peut uniquement proposer des actions,
              demander votre validation ou les exécuter automatiquement.
            </p>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingAgent ? "Modifier l’agent" : "Créer un agent IA"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Définissez le rôle et les permissions de votre agent.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-7 p-6">
              <section>
                <SectionTitle
                  number="1"
                  title="Informations générales"
                  description="Donnez une identité et une mission claire à l’agent."
                />

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Nom de l’agent *">
                      <input
                        value={form.name}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            name: event.target.value,
                          })
                        }
                        className="input"
                        placeholder="Ex : Assistant commercial"
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Description *">
                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            description: event.target.value,
                          })
                        }
                        className="input min-h-24 resize-none"
                        placeholder="Ex : Qualifie les prospects et prépare les prochaines actions commerciales."
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Icône">
                      <div className="flex flex-wrap gap-2">
                        {iconOptions.map((icon) => {
                          const selected = form.icon === icon;

                          return (
                            <button
                              key={icon}
                              type="button"
                              onClick={() =>
                                setForm({
                                  ...form,
                                  icon,
                                })
                              }
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                selected
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {renderAgentIcon(icon, "h-4 w-4")}
                              {icon}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  </div>
                </div>
              </section>

              <section>
                <SectionTitle
                  number="2"
                  title="Sources de données"
                  description="Choisissez les informations auxquelles l’agent peut accéder."
                />

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {sourceOptions.map((source) => {
                    const selected = form.sources.includes(source);

                    return (
                      <button
                        key={source}
                        type="button"
                        onClick={() => toggleArrayValue("sources", source)}
                        className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition ${
                          selected
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`text-xs font-semibold ${
                            selected ? "text-blue-700" : "text-slate-700"
                          }`}
                        >
                          {source}
                        </span>

                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            selected
                              ? "border-blue-600 bg-blue-600"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <SectionTitle
                  number="3"
                  title="Actions autorisées"
                  description="Déterminez ce que l’agent peut préparer ou exécuter."
                />

                <div className="mt-4 space-y-2">
                  {actionOptions.map((action) => {
                    const selected = form.allowed_actions.includes(action);

                    return (
                      <button
                        key={action}
                        type="button"
                        onClick={() =>
                          toggleArrayValue("allowed_actions", action)
                        }
                        className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${
                          selected
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`text-xs font-semibold ${
                            selected ? "text-blue-700" : "text-slate-700"
                          }`}
                        >
                          {action}
                        </span>

                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            selected
                              ? "border-blue-600 bg-blue-600"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <SectionTitle
                  number="4"
                  title="Instructions"
                  description="Expliquez précisément à l’agent comment il doit travailler."
                />

                <div className="mt-4">
                  <textarea
                    value={form.instructions}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        instructions: event.target.value,
                      })
                    }
                    className="input min-h-36 resize-none"
                    placeholder="Ex : Analyse les prospects entrants. Priorise ceux ayant un projet dans les 3 prochains mois. Prépare une relance lorsque le prospect n’a pas été contacté depuis 48 heures..."
                  />

                  <p className="mt-2 text-[11px] text-slate-400">
                    Plus les instructions sont précises, plus les futures
                    recommandations de l&apos;agent pourront être pertinentes.
                  </p>
                </div>
              </section>

              <section>
                <SectionTitle
                  number="5"
                  title="Niveau d’autonomie"
                  description="Choisissez jusqu’où l’agent peut agir sans intervention humaine."
                />

                <div className="mt-4 space-y-2">
                  {autonomyOptions.map((option) => {
                    const selected = form.autonomy === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            autonomy: option.value,
                          })
                        }
                        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-blue-600"
                              : "border-slate-300"
                          }`}
                        >
                          {selected && (
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>

                        <div>
                          <p
                            className={`text-xs font-bold ${
                              selected ? "text-blue-700" : "text-slate-800"
                            }`}
                          >
                            {option.title}
                          </p>

                          <p className="mt-1 text-[11px] leading-4 text-slate-500">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Activer l&apos;agent
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      L&apos;agent sera disponible dès sa création.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        active: !form.active,
                      })
                    }
                    className="text-blue-600"
                  >
                    {form.active ? (
                      <ToggleRight className="h-8 w-8" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-400" />
                    )}
                  </button>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={saveAgent}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}

                {saving
                  ? "Enregistrement..."
                  : editingAgent
                  ? "Enregistrer"
                  : "Créer l’agent"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.7rem 0.8rem;
          font-size: 0.75rem;
          color: rgb(15 23 42);
          outline: none;
          transition: border-color 0.15s ease;
        }

        .input:focus {
          border-color: rgb(59 130 246);
        }
      `}</style>
    </div>
  );
}

function AgentCard({
  agent,
  onEdit,
  onToggle,
  onDelete,
}: {
  agent: Agent;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {renderAgentIcon(agent.icon || "Bot", "h-5 w-5")}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-bold text-slate-900">
                {agent.name}
              </h2>

              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                  agent.active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {agent.active ? "Actif" : "Inactif"}
              </span>
            </div>

            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {agent.description || "Aucune description"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          title={agent.active ? "Désactiver" : "Activer"}
          className="shrink-0 text-blue-600"
        >
          {agent.active ? (
            <ToggleRight className="h-8 w-8" />
          ) : (
            <ToggleLeft className="h-8 w-8 text-slate-400" />
          )}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Sources
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            {agent.sources?.length || 0}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Actions
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            {agent.allowed_actions?.length || 0}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Autonomie
        </p>

        <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2.5">
          <Zap className="h-3.5 w-3.5 text-blue-600" />

          <span className="text-xs font-semibold text-slate-700">
            {agent.autonomy}
          </span>
        </div>
      </div>

      {agent.sources && agent.sources.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {agent.sources.slice(0, 4).map((source) => (
            <span
              key={source}
              className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500"
            >
              {source}
            </span>
          ))}

          {agent.sources.length > 4 && (
            <span className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
              +{agent.sources.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier
          <ChevronRight className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>

          <p className="mt-1 text-[11px] text-slate-400">{description}</p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5">{icon}</div>
      </div>
    </div>
  );
}

function SectionTitle({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
        {number}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>

        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    </div>
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

function renderAgentIcon(icon: string, className: string) {
  if (icon === "Sparkles") {
    return <Sparkles className={className} />;
  }

  if (icon === "Commercial") {
    return <Users className={className} />;
  }

  if (icon === "Chantier") {
    return <BriefcaseBusiness className={className} />;
  }

  if (icon === "Administratif") {
    return <FileText className={className} />;
  }

  if (icon === "Client") {
    return <UserRound className={className} />;
  }

  return <Bot className={className} />;
}
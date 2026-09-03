"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type TriggerType =
  | "Nouveau client"
  | "Nouveau devis"
  | "Devis envoyé"
  | "Devis accepté"
  | "Devis refusé"
  | "Relance en retard"
  | "Rendez-vous proche"
  | "Chantier créé"
  | "Échéance chantier proche"
  | "Chantier terminé";

type ActionType =
  | "Créer une relance"
  | "Créer un rendez-vous"
  | "Créer un chantier";

type Automation = {
  id: string;
  organization_id: string;
  name: string;
  trigger_type: TriggerType;
  delay_days: number;
  action_type: ActionType;
  active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
};

type Execution = {
  id: string;
  automation_id: string;
  entity_id: string | null;
  entity_label: string | null;
  action_type: string;
  result: "Exécutée" | "Ignorée" | "Erreur";
  created_at: string;
};

type Candidate = {
  id: string;
  label: string;
  clientId?: string | null;
  devisId?: string | null;
  chantierId?: string | null;
};

const triggers: TriggerType[] = [
  "Nouveau client",
  "Nouveau devis",
  "Devis envoyé",
  "Devis accepté",
  "Devis refusé",
  "Relance en retard",
  "Rendez-vous proche",
  "Chantier créé",
  "Échéance chantier proche",
  "Chantier terminé",
];

const actions: ActionType[] = [
  "Créer une relance",
  "Créer un rendez-vous",
  "Créer un chantier",
];

export default function AutomatisationsPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [automations, setAutomations] = useState<Automation[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);

  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [triggerType, setTriggerType] =
    useState<TriggerType>("Devis envoyé");
  const [delayDays, setDelayDays] = useState("3");
  const [actionType, setActionType] =
    useState<ActionType>("Créer une relance");

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

    if (error || !profile?.organization_id) {
      console.error(error);
      return null;
    }

    return profile.organization_id as string;
  }

  async function loadPage() {
    setLoading(true);

    const orgId = await getOrganizationId();

    if (!orgId) {
      setLoading(false);
      return;
    }

    setOrganizationId(orgId);

    const [automationsResult, executionsResult] = await Promise.all([
      supabase
        .from("automation_rules")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }),

      supabase
        .from("automation_executions")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (automationsResult.error) {
      console.error(automationsResult.error);
    }

    if (executionsResult.error) {
      console.error(executionsResult.error);
    }

    setAutomations(
      (automationsResult.data || []) as Automation[]
    );

    setExecutions(
      (executionsResult.data || []) as Execution[]
    );

    setLoading(false);
  }

  function resetForm() {
    setName("");
    setTriggerType("Devis envoyé");
    setDelayDays("3");
    setActionType("Créer une relance");
  }

  async function createAutomation() {
    if (!organizationId) return;

    if (!name.trim()) {
      alert("Donne un nom à l’automatisation.");
      return;
    }

    const delay = Math.max(Number(delayDays) || 0, 0);

    const { error } = await supabase
      .from("automation_rules")
      .insert({
        organization_id: organizationId,
        name: name.trim(),
        trigger_type: triggerType,
        delay_days: delay,
        action_type: actionType,
        active: true,
      });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setModalOpen(false);
    resetForm();
    await loadPage();
  }

  async function toggleAutomation(automation: Automation) {
    const { error } = await supabase
      .from("automation_rules")
      .update({
        active: !automation.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", automation.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPage();
  }

  async function deleteAutomation(automation: Automation) {
    const ok = confirm(
      `Supprimer l’automatisation « ${automation.name} » ?`
    );

    if (!ok) return;

    const { error } = await supabase
      .from("automation_rules")
      .delete()
      .eq("id", automation.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPage();
  }

  async function alreadyExecuted(
    automationId: string,
    entityId: string
  ) {
    const { data } = await supabase
      .from("automation_executions")
      .select("id")
      .eq("automation_id", automationId)
      .eq("entity_id", entityId)
      .eq("result", "Exécutée")
      .limit(1);

    return Boolean(data && data.length > 0);
  }

  async function findCandidates(
    automation: Automation
  ): Promise<Candidate[]> {
    if (!organizationId) return [];

    const now = new Date();
    const delay = automation.delay_days || 0;

    if (automation.trigger_type === "Nouveau client") {
      const since = new Date();
      since.setDate(since.getDate() - Math.max(delay, 1));

      const { data } = await supabase
        .from("clients")
        .select("id,name,company")
        .eq("organization_id", organizationId)
        .gte("created_at", since.toISOString());

      return (data || []).map((item) => ({
        id: item.id,
        label: item.company
          ? `${item.name} · ${item.company}`
          : item.name,
        clientId: item.id,
      }));
    }

    if (
      automation.trigger_type === "Nouveau devis" ||
      automation.trigger_type === "Devis envoyé" ||
      automation.trigger_type === "Devis accepté" ||
      automation.trigger_type === "Devis refusé"
    ) {
      let query = supabase
        .from("devis")
        .select("id,client_id,number,project,status,created_at")
        .eq("organization_id", organizationId);

      if (automation.trigger_type === "Devis envoyé") {
        query = query.eq("status", "Envoyé");
      }

      if (automation.trigger_type === "Devis accepté") {
        query = query.eq("status", "Accepté");
      }

      if (automation.trigger_type === "Devis refusé") {
        query = query.eq("status", "Refusé");
      }

      if (automation.trigger_type === "Nouveau devis") {
        const since = new Date();
        since.setDate(since.getDate() - Math.max(delay, 1));

        query = query.gte("created_at", since.toISOString());
      }

      const { data } = await query;

      return (data || []).map((item) => ({
        id: item.id,
        label: `${item.number}${
          item.project ? ` · ${item.project}` : ""
        }`,
        clientId: item.client_id,
        devisId: item.id,
      }));
    }

    if (automation.trigger_type === "Relance en retard") {
      const { data } = await supabase
        .from("relances")
        .select("id,client_id,devis_id,title,scheduled_at,status")
        .eq("organization_id", organizationId)
        .lt("scheduled_at", now.toISOString())
        .in("status", ["À faire", "En cours"]);

      return (data || []).map((item) => ({
        id: item.id,
        label: item.title,
        clientId: item.client_id,
        devisId: item.devis_id,
      }));
    }

    if (automation.trigger_type === "Rendez-vous proche") {
      const end = new Date();
      end.setDate(
        end.getDate() + Math.max(automation.delay_days, 1)
      );

      const { data } = await supabase
        .from("rendez_vous")
        .select("id,client_id,chantier_id,title,start_at,status")
        .eq("organization_id", organizationId)
        .gte("start_at", now.toISOString())
        .lte("start_at", end.toISOString())
        .neq("status", "Annulé");

      return (data || []).map((item) => ({
        id: item.id,
        label: item.title,
        clientId: item.client_id,
        chantierId: item.chantier_id,
      }));
    }

    if (
      automation.trigger_type === "Chantier créé" ||
      automation.trigger_type === "Échéance chantier proche" ||
      automation.trigger_type === "Chantier terminé"
    ) {
      let query = supabase
        .from("chantiers")
        .select(
          "id,client_id,devis_id,name,status,end_date,created_at"
        )
        .eq("organization_id", organizationId);

      if (automation.trigger_type === "Chantier créé") {
        const since = new Date();
        since.setDate(since.getDate() - Math.max(delay, 1));

        query = query.gte("created_at", since.toISOString());
      }

      if (automation.trigger_type === "Chantier terminé") {
        query = query.eq("status", "Terminé");
      }

      if (
        automation.trigger_type === "Échéance chantier proche"
      ) {
        const today = new Date().toISOString().slice(0, 10);

        const end = new Date();
        end.setDate(
          end.getDate() + Math.max(automation.delay_days, 1)
        );

        query = query
          .gte("end_date", today)
          .lte("end_date", end.toISOString().slice(0, 10))
          .neq("status", "Terminé")
          .neq("status", "Annulé");
      }

      const { data } = await query;

      return (data || []).map((item) => ({
        id: item.id,
        label: item.name,
        clientId: item.client_id,
        devisId: item.devis_id,
        chantierId: item.id,
      }));
    }

    return [];
  }

  async function executeAction(
    automation: Automation,
    candidate: Candidate
  ) {
    if (!organizationId) return false;

    const delay = Math.max(automation.delay_days || 0, 0);

    if (automation.action_type === "Créer une relance") {
      const scheduled = new Date();
      scheduled.setDate(scheduled.getDate() + delay);

      const { error } = await supabase
        .from("relances")
        .insert({
          organization_id: organizationId,
          client_id: candidate.clientId || null,
          devis_id: candidate.devisId || null,

          title: `Automatisation · ${automation.name}`,

          description: `Relance créée automatiquement suite à : ${automation.trigger_type}`,

          channel: "Appel téléphonique",

          scheduled_at: scheduled.toISOString(),

          status: "À faire",

          created_by_ai: false,
        });

      if (error) {
        console.error(error);
        return false;
      }

      return true;
    }

    if (
      automation.action_type === "Créer un rendez-vous"
    ) {
      const start = new Date();
      start.setDate(start.getDate() + Math.max(delay, 1));
      start.setHours(9, 0, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);

      const { error } = await supabase
        .from("rendez_vous")
        .insert({
          organization_id: organizationId,
          client_id: candidate.clientId || null,
          chantier_id: candidate.chantierId || null,

          title: `Suivi automatique · ${candidate.label}`,

          description: `Rendez-vous créé par l’automatisation « ${automation.name} ».`,

          start_at: start.toISOString(),
          end_at: end.toISOString(),

          status: "Prévu",

          created_by_ai: false,
        });

      if (error) {
        console.error(error);
        return false;
      }

      return true;
    }

    if (automation.action_type === "Créer un chantier") {
      if (!candidate.clientId) return false;

      const { data: existing } = await supabase
        .from("chantiers")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("client_id", candidate.clientId)
        .neq("status", "Annulé")
        .limit(1);

      if (existing && existing.length > 0) {
        return false;
      }

      const { error } = await supabase
        .from("chantiers")
        .insert({
          organization_id: organizationId,

          client_id: candidate.clientId,

          devis_id: candidate.devisId || null,

          name: candidate.label
            ? `Chantier · ${candidate.label}`
            : "Nouveau chantier",

          status: "À venir",

          progress: 0,
        });

      if (error) {
        console.error(error);
        return false;
      }

      return true;
    }

    return false;
  }

  async function logExecution(
    automation: Automation,
    candidate: Candidate,
    result: "Exécutée" | "Ignorée" | "Erreur"
  ) {
    if (!organizationId) return;

    await supabase
      .from("automation_executions")
      .insert({
        organization_id: organizationId,
        automation_id: automation.id,

        entity_id: candidate.id,
        entity_label: candidate.label,

        action_type: automation.action_type,

        result,
      });
  }

  async function runAutomation(
    automation: Automation
  ) {
    if (!automation.active) return;

    setRunningId(automation.id);

    try {
      const candidates = await findCandidates(automation);

      let successfulExecutions = 0;

      for (const candidate of candidates) {
        const exists = await alreadyExecuted(
          automation.id,
          candidate.id
        );

        if (exists) continue;

        const success = await executeAction(
          automation,
          candidate
        );

        if (success) {
          successfulExecutions += 1;

          await logExecution(
            automation,
            candidate,
            "Exécutée"
          );
        } else {
          await logExecution(
            automation,
            candidate,
            "Ignorée"
          );
        }
      }

      await supabase
        .from("automation_rules")
        .update({
          execution_count:
            automation.execution_count +
            successfulExecutions,

          last_executed_at: new Date().toISOString(),

          updated_at: new Date().toISOString(),
        })
        .eq("id", automation.id);

      await loadPage();

      if (successfulExecutions === 0) {
        alert(
          "Analyse terminée : aucune nouvelle action à exécuter."
        );
      } else {
        alert(
          `${successfulExecutions} action${
            successfulExecutions > 1 ? "s" : ""
          } exécutée${
            successfulExecutions > 1 ? "s" : ""
          }.`
        );
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue.");
    }

    setRunningId(null);
  }

  async function runAllAutomations() {
    const activeAutomations = automations.filter(
      (automation) => automation.active
    );

    for (const automation of activeAutomations) {
      await runAutomation(automation);
    }
  }

  const activeCount = useMemo(
    () => automations.filter((item) => item.active).length,
    [automations]
  );

  const totalExecutions = useMemo(
    () =>
      automations.reduce(
        (total, item) =>
          total + (item.execution_count || 0),
        0
      ),
    [automations]
  );

  const todayExecutions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return executions.filter(
      (execution) =>
        execution.created_at.slice(0, 10) === today &&
        execution.result === "Exécutée"
    ).length;
  }, [executions]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Chargement des automatisations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-blue-600" />

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
              Intelligence artificielle
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Automatisations
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Automatisez les tâches répétitives de votre
            entreprise à partir des événements de BatiPilot.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadPage}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>

          <button
            type="button"
            onClick={runAllAutomations}
            disabled={Boolean(runningId)}
            className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            Tout exécuter
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle automatisation
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Automatisations"
          value={automations.length}
          icon={<Workflow className="h-5 w-5 text-blue-600" />}
        />

        <StatCard
          title="Actives"
          value={activeCount}
          icon={<Play className="h-5 w-5 text-emerald-600" />}
        />

        <StatCard
          title="Actions exécutées"
          value={totalExecutions}
          icon={
            <CheckCircle2 className="h-5 w-5 text-violet-600" />
          }
        />

        <StatCard
          title="Aujourd’hui"
          value={todayExecutions}
          icon={<Activity className="h-5 w-5 text-amber-600" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_370px]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-sm font-bold text-slate-900">
              Mes automatisations
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Chaque règle surveille les données BatiPilot et
              exécute l’action configurée.
            </p>
          </div>

          {automations.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center p-8 text-center">
              <div>
                <Workflow className="mx-auto h-9 w-9 text-slate-300" />

                <p className="mt-3 text-sm font-bold text-slate-700">
                  Aucune automatisation
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Crée ta première règle automatique.
                </p>

                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white"
                >
                  Créer une automatisation
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {automations.map((automation) => (
                <div key={automation.id} className="p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          automation.active
                            ? "bg-blue-50"
                            : "bg-slate-100"
                        }`}
                      >
                        <Zap
                          className={`h-5 w-5 ${
                            automation.active
                              ? "text-blue-600"
                              : "text-slate-400"
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            {automation.name}
                          </p>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                              automation.active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {automation.active
                              ? "Active"
                              : "En pause"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-md bg-slate-50 px-2 py-1">
                            Quand :{" "}
                            <strong>
                              {automation.trigger_type}
                            </strong>
                          </span>

                          <span>→</span>

                          <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">
                            {automation.action_type}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-400">
                          <span>
                            Délai : {automation.delay_days} jour
                            {automation.delay_days > 1 ? "s" : ""}
                          </span>

                          <span>
                            {automation.execution_count} exécution
                            {automation.execution_count > 1
                              ? "s"
                              : ""}
                          </span>

                          {automation.last_executed_at && (
                            <span>
                              Dernière analyse :{" "}
                              {new Date(
                                automation.last_executed_at
                              ).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          toggleAutomation(automation)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                        title={
                          automation.active
                            ? "Mettre en pause"
                            : "Activer"
                        }
                      >
                        {automation.active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={
                          !automation.active ||
                          runningId === automation.id
                        }
                        onClick={() =>
                          runAutomation(automation)
                        }
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {runningId === automation.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}

                        Exécuter
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteAutomation(automation)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />

                <h2 className="text-sm font-bold text-slate-900">
                  Historique
                </h2>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto p-5">
              {executions.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock3 className="mx-auto h-7 w-7 text-slate-300" />

                  <p className="mt-2 text-xs text-slate-500">
                    Aucune exécution pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {executions.map((execution) => {
                    const automation =
                      automations.find(
                        (item) =>
                          item.id ===
                          execution.automation_id
                      );

                    return (
                      <div
                        key={execution.id}
                        className="border-b border-slate-100 pb-4 last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                              execution.result === "Exécutée"
                                ? "bg-emerald-500"
                                : execution.result === "Erreur"
                                ? "bg-red-500"
                                : "bg-slate-300"
                            }`}
                          />

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700">
                              {automation?.name ||
                                "Automatisation"}
                            </p>

                            <p className="mt-1 truncate text-[11px] text-slate-500">
                              {execution.entity_label ||
                                "Élément BatiPilot"}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              {execution.action_type} ·{" "}
                              {new Date(
                                execution.created_at
                              ).toLocaleString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  Autopilot ou Automatisation ?
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  <strong>Autopilot</strong> décide de la
                  prochaine étape d’un dossier.
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  <strong>Automatisations</strong> applique les
                  règles que vous avez configurées.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Nouvelle automatisation
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Définissez le déclencheur et l’action.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="text-xs font-bold text-slate-700">
                  Nom
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Relance devis automatique"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Quand...
                </label>

                <div className="relative mt-2">
                  <select
                    value={triggerType}
                    onChange={(e) =>
                      setTriggerType(
                        e.target.value as TriggerType
                      )
                    }
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-3 pr-10 text-sm outline-none focus:border-blue-500"
                  >
                    {triggers.map((trigger) => (
                      <option key={trigger}>
                        {trigger}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Délai en jours
                </label>

                <input
                  type="number"
                  min="0"
                  value={delayDays}
                  onChange={(e) =>
                    setDelayDays(e.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500"
                />

                <p className="mt-1.5 text-[11px] text-slate-400">
                  0 = immédiatement. Exemple : 3 pour créer une
                  relance trois jours plus tard.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Alors...
                </label>

                <div className="relative mt-2">
                  <select
                    value={actionType}
                    onChange={(e) =>
                      setActionType(
                        e.target.value as ActionType
                      )
                    }
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-3 pr-10 text-sm outline-none focus:border-blue-500"
                  >
                    {actions.map((action) => (
                      <option key={action}>
                        {action}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                  <p className="text-xs leading-5 text-blue-800">
                    <strong>{triggerType}</strong>
                    {" → "}
                    {delayDays === "0"
                      ? "immédiatement"
                      : `après ${delayDays || "0"} jour${
                          Number(delayDays) > 1 ? "s" : ""
                        }`}
                    {" → "}
                    <strong>{actionType}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={createAutomation}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Créer l’automatisation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
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
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5">
          {icon}
        </div>
      </div>
    </div>
  );
}
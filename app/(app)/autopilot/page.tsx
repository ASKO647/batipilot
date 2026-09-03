"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CirclePause,
  Clock3,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Rocket,
  Settings2,
  Sparkles,
  Target,
  ToggleLeft,
  ToggleRight,
  UserRound,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Client = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  pipeline_stage: string | null;
};

type Devis = {
  id: string;
  client_id: string | null;
  number: string;
  project: string | null;
  status: string;
  created_at: string;
};

type Chantier = {
  id: string;
  client_id: string | null;
  name: string;
  status: string;
  progress: number;
};

type RendezVous = {
  id: string;
  client_id: string | null;
  title: string;
  start_at: string;
  status: string;
};

type Relance = {
  id: string;
  client_id: string | null;
  devis_id: string | null;
  title: string;
  status: string;
  scheduled_at: string;
};

type DossierAide = {
  id: string;
  client_id: string | null;
  chantier_id: string | null;
  title: string | null;
  status: string;
};

type AutopilotAction = {
  id: string;
  organization_id: string;
  client_id: string | null;
  chantier_id: string | null;
  devis_id: string | null;
  stage: string;
  action_type: string;
  title: string;
  description: string | null;
  reason: string | null;
  status: "En attente" | "Validée" | "Ignorée" | "Terminée";
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type WorkflowItem = {
  client: Client;
  stage: string;
  progress: number;
  nextAction: string;
  actionType: string;
  reason: string;
  devisId?: string | null;
  chantierId?: string | null;
};

const stages = [
  "Prospect",
  "Qualification",
  "Rendez-vous",
  "Analyse",
  "Création devis",
  "Envoi devis",
  "Relance",
  "Acceptation",
  "Création chantier",
  "Suivi chantier",
  "Dossier d’aide",
  "Finalisation",
  "Demande d’avis",
  "Clôture",
];

export default function AutopilotPage() {
  const router = useRouter();

  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [relances, setRelances] = useState<Relance[]>([]);
  const [dossiersAides, setDossiersAides] = useState<DossierAide[]>([]);
  const [actions, setActions] = useState<AutopilotAction[]>([]);

  const [active, setActive] = useState(false);
  const [requireHumanValidation, setRequireHumanValidation] = useState(true);

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [generating, setGenerating] = useState(false);

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

    const [
      clientsResult,
      devisResult,
      chantiersResult,
      rendezVousResult,
      relancesResult,
      dossiersResult,
      settingsResult,
      actionsResult,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id,name,company,email,phone,status,pipeline_stage")
        .eq("organization_id", orgId),

      supabase
        .from("devis")
        .select("id,client_id,number,project,status,created_at")
        .eq("organization_id", orgId),

      supabase
        .from("chantiers")
        .select("id,client_id,name,status,progress")
        .eq("organization_id", orgId),

      supabase
        .from("rendez_vous")
        .select("id,client_id,title,start_at,status")
        .eq("organization_id", orgId),

      supabase
        .from("relances")
        .select("id,client_id,devis_id,title,status,scheduled_at")
        .eq("organization_id", orgId),

      supabase
        .from("dossiers_aides")
        .select("id,client_id,chantier_id,title,status")
        .eq("organization_id", orgId),

      supabase
        .from("autopilot_settings")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle(),

      supabase
        .from("autopilot_actions")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }),
    ]);

    setClients((clientsResult.data || []) as Client[]);
    setDevis((devisResult.data || []) as Devis[]);
    setChantiers((chantiersResult.data || []) as Chantier[]);
    setRendezVous((rendezVousResult.data || []) as RendezVous[]);
    setRelances((relancesResult.data || []) as Relance[]);
    setDossiersAides((dossiersResult.data || []) as DossierAide[]);
    setActions((actionsResult.data || []) as AutopilotAction[]);

    if (settingsResult.data) {
      setActive(Boolean(settingsResult.data.active));
      setRequireHumanValidation(
        Boolean(settingsResult.data.require_human_validation)
      );
    }

    setLoading(false);
  }

  function calculateWorkflow(client: Client): WorkflowItem {
    const clientDevis = devis
      .filter((item) => item.client_id === client.id)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

    const latestDevis = clientDevis[0];

    const clientChantier = chantiers.find(
      (chantier) => chantier.client_id === client.id
    );

    const clientRendezVous = rendezVous.find(
      (item) =>
        item.client_id === client.id &&
        item.status !== "Annulé"
    );

    const clientRelance = relances.find(
      (item) =>
        item.client_id === client.id &&
        item.status !== "Terminée" &&
        item.status !== "Annulée"
    );

    const clientDossier = dossiersAides.find(
      (item) =>
        item.client_id === client.id ||
        (clientChantier && item.chantier_id === clientChantier.id)
    );

    if (client.status === "prospect" && !client.phone && !client.email) {
      return buildWorkflow(
        client,
        "Qualification",
        "Compléter les coordonnées du prospect",
        "QUALIFY_PROSPECT",
        "Le prospect ne possède pas encore de coordonnées suffisantes."
      );
    }

    if (!clientRendezVous && !latestDevis) {
      return buildWorkflow(
        client,
        "Rendez-vous",
        "Créer un rendez-vous",
        "CREATE_APPOINTMENT",
        "Aucun rendez-vous n’est planifié pour ce dossier."
      );
    }

    if (!latestDevis) {
      return buildWorkflow(
        client,
        "Création devis",
        "Créer un devis",
        "CREATE_QUOTE",
        "Le besoin a été pris en charge mais aucun devis n’existe encore."
      );
    }

    if (latestDevis.status === "Brouillon") {
      return buildWorkflow(
        client,
        "Envoi devis",
        "Finaliser et envoyer le devis",
        "OPEN_QUOTE",
        `Le devis ${latestDevis.number} est encore en brouillon.`,
        latestDevis.id
      );
    }

    if (latestDevis.status === "Envoyé" && !clientRelance) {
      return buildWorkflow(
        client,
        "Relance",
        "Créer une relance",
        "CREATE_FOLLOW_UP",
        `Le devis ${latestDevis.number} a été envoyé et aucune relance active n’est prévue.`,
        latestDevis.id
      );
    }

    if (latestDevis.status === "Refusé") {
      return buildWorkflow(
        client,
        "Relance",
        "Revoir le dossier commercial",
        "OPEN_CLIENT",
        "Le dernier devis a été refusé.",
        latestDevis.id
      );
    }

    if (latestDevis.status === "Accepté" && !clientChantier) {
      return buildWorkflow(
        client,
        "Création chantier",
        "Créer le chantier",
        "CREATE_SITE",
        "Le devis est accepté mais aucun chantier n’a encore été créé.",
        latestDevis.id
      );
    }

    if (
      clientChantier &&
      clientChantier.status !== "Terminé" &&
      clientChantier.status !== "Annulé"
    ) {
      return buildWorkflow(
        client,
        "Suivi chantier",
        `Suivre le chantier à ${clientChantier.progress}%`,
        "OPEN_SITE",
        "Le chantier est actuellement en cours de réalisation.",
        latestDevis?.id || null,
        clientChantier.id
      );
    }

    if (
      clientChantier?.status === "Terminé" &&
      clientDossier &&
      clientDossier.status !== "Validé" &&
      clientDossier.status !== "Refusé"
    ) {
      return buildWorkflow(
        client,
        "Finalisation",
        "Finaliser le dossier d’aide",
        "OPEN_AID",
        "Le chantier est terminé mais le dossier d’aide n’est pas finalisé.",
        latestDevis?.id || null,
        clientChantier.id
      );
    }

    if (clientChantier?.status === "Terminé") {
      return buildWorkflow(
        client,
        "Demande d’avis",
        "Préparer la demande d’avis client",
        "REQUEST_REVIEW",
        "Le chantier est terminé et le dossier peut passer à la satisfaction client.",
        latestDevis?.id || null,
        clientChantier.id
      );
    }

    return buildWorkflow(
      client,
      "Clôture",
      "Vérifier et clôturer le dossier",
      "OPEN_CLIENT",
      "Aucune action prioritaire n’a été détectée.",
      latestDevis?.id || null,
      clientChantier?.id || null
    );
  }

  function buildWorkflow(
    client: Client,
    stage: string,
    nextAction: string,
    actionType: string,
    reason: string,
    devisId?: string | null,
    chantierId?: string | null
  ): WorkflowItem {
    const index = Math.max(stages.indexOf(stage), 0);

    return {
      client,
      stage,
      progress: Math.round(((index + 1) / stages.length) * 100),
      nextAction,
      actionType,
      reason,
      devisId,
      chantierId,
    };
  }

  const workflows = useMemo(
    () =>
      clients
        .filter((client) => client.status !== "archived")
        .map(calculateWorkflow),
    [clients, devis, chantiers, rendezVous, relances, dossiersAides]
  );

  const waitingActions = useMemo(
    () => actions.filter((action) => action.status === "En attente"),
    [actions]
  );

  const completedActions = useMemo(
    () =>
      actions.filter(
        (action) =>
          action.status === "Validée" ||
          action.status === "Terminée"
      ),
    [actions]
  );

  async function saveSettings(
    nextActive = active,
    nextValidation = requireHumanValidation
  ) {
    if (!organizationId) return;

    setSavingSettings(true);

    const { data: existing } = await supabase
      .from("autopilot_settings")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const payload = {
      organization_id: organizationId,
      active: nextActive,
      require_human_validation: nextValidation,
      updated_at: new Date().toISOString(),
    };

    const result = existing
      ? await supabase
          .from("autopilot_settings")
          .update(payload)
          .eq("id", existing.id)
      : await supabase.from("autopilot_settings").insert(payload);

    if (result.error) {
      console.error(result.error);
      alert(result.error.message);
    }

    setSavingSettings(false);
  }

  async function toggleAutopilot() {
    const next = !active;
    setActive(next);
    await saveSettings(next, requireHumanValidation);
  }

  async function toggleValidation() {
    const next = !requireHumanValidation;
    setRequireHumanValidation(next);
    await saveSettings(active, next);
  }

  async function generateRecommendations() {
    if (!organizationId) return;

    setGenerating(true);

    const pendingClients = new Set(
      actions
        .filter((action) => action.status === "En attente")
        .map((action) => action.client_id)
    );

    const inserts = workflows
      .filter((workflow) => !pendingClients.has(workflow.client.id))
      .filter((workflow) => workflow.stage !== "Clôture")
      .map((workflow) => ({
        organization_id: organizationId,
        client_id: workflow.client.id,
        chantier_id: workflow.chantierId || null,
        devis_id: workflow.devisId || null,
        stage: workflow.stage,
        action_type: workflow.actionType,
        title: workflow.nextAction,
        description: `Dossier de ${workflow.client.name}`,
        reason: workflow.reason,
        status: "En attente",
      }));

    if (inserts.length > 0) {
      const { error } = await supabase
        .from("autopilot_actions")
        .insert(inserts);

      if (error) {
        console.error(error);
        alert(error.message);
        setGenerating(false);
        return;
      }
    }

    await loadPage();
    setGenerating(false);
  }

  async function ignoreAction(action: AutopilotAction) {
    const { error } = await supabase
      .from("autopilot_actions")
      .update({
        status: "Ignorée",
        updated_at: new Date().toISOString(),
      })
      .eq("id", action.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPage();
  }

  async function validateAction(action: AutopilotAction) {
    const { error } = await supabase
      .from("autopilot_actions")
      .update({
        status: "Validée",
        updated_at: new Date().toISOString(),
      })
      .eq("id", action.id);

    if (error) {
      alert(error.message);
      return;
    }

    executeAction(action);
  }

  function executeAction(action: AutopilotAction) {
    if (action.action_type === "CREATE_APPOINTMENT") {
      router.push(`/rendez-vous?clientId=${action.client_id}`);
      return;
    }

    if (action.action_type === "CREATE_QUOTE") {
      router.push(`/devis?clientId=${action.client_id}`);
      return;
    }

    if (action.action_type === "CREATE_SITE") {
      router.push(`/chantiers?clientId=${action.client_id}`);
      return;
    }

    if (action.action_type === "CREATE_FOLLOW_UP") {
      router.push(`/relances`);
      return;
    }

    if (action.action_type === "OPEN_QUOTE") {
      router.push(`/devis`);
      return;
    }

    if (action.action_type === "OPEN_SITE" && action.chantier_id) {
      router.push(`/chantiers/${action.chantier_id}`);
      return;
    }

    if (action.action_type === "OPEN_AID") {
      router.push(`/dossiers-aides`);
      return;
    }

    router.push(`/clients/${action.client_id}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">
            Analyse des dossiers...
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
            Autopilot
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            BatiPilot analyse vos dossiers et détermine automatiquement la
            prochaine action à effectuer, du prospect jusqu’à la clôture du
            chantier.
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
            onClick={toggleAutopilot}
            disabled={savingSettings}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {active ? (
              <ToggleRight className="h-5 w-5" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
            {active ? "Autopilot actif" : "Activer Autopilot"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Dossiers pilotés"
          value={workflows.length}
          icon={<Target className="h-5 w-5 text-blue-600" />}
        />

        <StatCard
          title="Actions en attente"
          value={waitingActions.length}
          icon={<Clock3 className="h-5 w-5 text-amber-600" />}
        />

        <StatCard
          title="Actions validées"
          value={completedActions.length}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        />

        <StatCard
          title="Mode"
          value={requireHumanValidation ? "Validation" : "Auto"}
          icon={<Bot className="h-5 w-5 text-violet-600" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recommandations Autopilot
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Actions détectées à partir des données réelles de BatiPilot.
                </p>
              </div>

              <button
                type="button"
                onClick={generateRecommendations}
                disabled={!active || generating}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <WandSparkles className="h-4 w-4" />
                )}
                Analyser maintenant
              </button>
            </div>

            {!active ? (
              <div className="flex min-h-60 items-center justify-center p-8 text-center">
                <div>
                  <CirclePause className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">
                    Autopilot est désactivé
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Active-le pour analyser les dossiers.
                  </p>
                </div>
              </div>
            ) : waitingActions.length === 0 ? (
              <div className="flex min-h-60 items-center justify-center p-8 text-center">
                <div>
                  <Sparkles className="mx-auto h-8 w-8 text-blue-500" />
                  <p className="mt-3 text-sm font-bold text-slate-700">
                    Aucune recommandation en attente
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Clique sur « Analyser maintenant ».
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {waitingActions.map((action) => {
                  const client = clients.find(
                    (item) => item.id === action.client_id
                  );

                  return (
                    <div key={action.id} className="p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <Zap className="h-5 w-5 text-blue-600" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">
                                {action.title}
                              </p>

                              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                                {action.stage}
                              </span>
                            </div>

                            <p className="mt-1 text-xs font-semibold text-slate-600">
                              {client?.name || "Client"}
                              {client?.company ? ` · ${client.company}` : ""}
                            </p>

                            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                              {action.reason}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => ignoreAction(action)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Ignorer
                          </button>

                          <button
                            type="button"
                            onClick={() => validateAction(action)}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Valider
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-sm font-bold text-slate-900">
                Dossiers en pilotage
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Étape actuelle et prochaine action de chaque dossier.
              </p>
            </div>

            {workflows.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Aucun dossier à analyser.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {workflows.map((workflow) => (
                  <div key={workflow.client.id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-slate-400" />

                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/clients/${workflow.client.id}`)
                            }
                            className="truncate text-sm font-bold text-slate-900 hover:text-blue-600"
                          >
                            {workflow.client.name}
                          </button>

                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                            {workflow.stage}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                          Prochaine action :{" "}
                          <span className="font-semibold text-slate-700">
                            {workflow.nextAction}
                          </span>
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{ width: `${workflow.progress}%` }}
                            />
                          </div>

                          <span className="text-[11px] font-bold text-slate-500">
                            {workflow.progress}%
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/clients/${workflow.client.id}`)
                        }
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600"
                      >
                        Voir dossier
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Paramètres Autopilot
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Autopilot
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Analyse les dossiers actifs.
                  </p>
                </div>

                <button type="button" onClick={toggleAutopilot}>
                  {active ? (
                    <ToggleRight className="h-8 w-8 text-blue-600" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Validation humaine
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500">
                      Demande confirmation avant les actions.
                    </p>
                  </div>

                  <button type="button" onClick={toggleValidation}>
                    {requireHumanValidation ? (
                      <ToggleRight className="h-8 w-8 text-blue-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
                <Rocket className="h-4 w-4 text-blue-600" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  Parcours Autopilot
                </p>

                <div className="mt-3 space-y-2">
                  {stages.map((stage, index) => (
                    <div key={stage} className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <p className="text-[11px] font-medium text-slate-600">
                        {stage}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Activité récente
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              {actions.slice(0, 5).length === 0 ? (
                <p className="text-xs text-slate-400">
                  Aucune activité Autopilot.
                </p>
              ) : (
                actions.slice(0, 5).map((action) => (
                  <div
                    key={action.id}
                    className="border-b border-slate-100 pb-3 last:border-0"
                  >
                    <p className="text-xs font-semibold text-slate-700">
                      {action.title}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {action.status} ·{" "}
                      {new Date(action.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
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
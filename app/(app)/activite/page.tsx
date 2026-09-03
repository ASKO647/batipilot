"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  Sparkles,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ActivityItem = {
  id: string;
  type:
    | "client"
    | "devis"
    | "facture"
    | "chantier"
    | "rendez-vous"
    | "relance"
    | "appel"
    | "automatisation"
    | "agent";

  title: string;
  description: string;
  date: string;
  status?: string | null;
};

type FilterType =
  | "Tous"
  | "Clients"
  | "Devis"
  | "Factures"
  | "Chantiers"
  | "Rendez-vous"
  | "Relances"
  | "Appels"
  | "Automatisations"
  | "Agents IA";

function formatDateTime(rawDate: string) {
  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDateGroup(rawDate: string) {
  const date = new Date(rawDate);
  const today = new Date();

  const todayKey = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  const targetKey = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();

  const diff = Math.round((todayKey - targetKey) / 86400000);

  if (diff === 0) return "Aujourd’hui";
  if (diff === 1) return "Hier";

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function combineDateAndTime(
  date?: string | null,
  time?: string | null,
  fallback?: string | null
) {
  if (date) {
    const safeTime = time || "12:00:00";
    const result = new Date(`${date}T${safeTime}`);

    if (!Number.isNaN(result.getTime())) {
      return result.toISOString();
    }
  }

  return fallback || new Date(0).toISOString();
}

export default function ActivitePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("Tous");

  useEffect(() => {
    loadActivities();
  }, []);

  async function getOrganizationId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data?.organization_id || null;
  }

  async function loadActivities() {
    setLoading(true);
    setError("");

    const organizationId = await getOrganizationId();

    if (!organizationId) {
      setError("Impossible de récupérer votre organisation.");
      setLoading(false);
      return;
    }

    const [
      clientsResult,
      devisResult,
      facturesResult,
      chantiersResult,
      rendezVousResult,
      relancesResult,
      callsResult,
      automationExecutionsResult,
      agentsResult,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id,name,company,status,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("devis")
        .select("id,number,project,status,amount,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("factures")
        .select("id,number,title,status,amount,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("chantiers")
        .select("id,name,status,progress,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("rendez_vous")
        .select("id,title,status,start_at,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("relances")
        .select("id,title,status,channel,scheduled_at,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("phone_calls")
        .select(
          "id,contact_name,phone_number,status,date,time,summary,created_at"
        )
        .eq("organization_id", organizationId),

      supabase
        .from("automation_executions")
        .select(
          "id,entity_label,action_type,result,created_at,automation_id"
        )
        .eq("organization_id", organizationId),

      supabase
        .from("agents_ia")
        .select("id,name,active,autonomy,created_at,updated_at")
        .eq("organization_id", organizationId),
    ]);

    const criticalError =
      clientsResult.error ||
      devisResult.error ||
      facturesResult.error ||
      chantiersResult.error ||
      rendezVousResult.error ||
      relancesResult.error ||
      callsResult.error;

    if (criticalError) {
      console.error(criticalError);
      setError(criticalError.message);
      setLoading(false);
      return;
    }

    const result: ActivityItem[] = [];

    for (const client of clientsResult.data || []) {
      result.push({
        id: `client-${client.id}`,
        type: "client",
        title: client.company || client.name || "Nouveau contact",
        description:
          client.status?.toLowerCase() === "client"
            ? "Client ajouté dans BatiPilot"
            : "Prospect ajouté dans BatiPilot",
        date: client.created_at,
        status: client.status,
      });
    }

    for (const item of devisResult.data || []) {
      result.push({
        id: `devis-${item.id}`,
        type: "devis",
        title: item.number
          ? `Devis ${item.number}`
          : item.project || "Nouveau devis",
        description: item.project
          ? `${item.project} · ${Number(item.amount || 0).toLocaleString(
              "fr-FR"
            )} €`
          : `${Number(item.amount || 0).toLocaleString("fr-FR")} €`,
        date: item.created_at,
        status: item.status,
      });
    }

    for (const item of facturesResult.data || []) {
      result.push({
        id: `facture-${item.id}`,
        type: "facture",
        title: item.number
          ? `Facture ${item.number}`
          : item.title || "Nouvelle facture",
        description: `${Number(item.amount || 0).toLocaleString("fr-FR")} €`,
        date: item.created_at,
        status: item.status,
      });
    }

    for (const item of chantiersResult.data || []) {
      result.push({
        id: `chantier-${item.id}`,
        type: "chantier",
        title: item.name || "Nouveau chantier",
        description: `Chantier créé · Progression ${Number(
          item.progress || 0
        )} %`,
        date: item.created_at,
        status: item.status,
      });
    }

    for (const item of rendezVousResult.data || []) {
      result.push({
        id: `rdv-${item.id}`,
        type: "rendez-vous",
        title: item.title || "Rendez-vous",
        description: "Rendez-vous ajouté à l’agenda",
        date: item.created_at || item.start_at,
        status: item.status,
      });
    }

    for (const item of relancesResult.data || []) {
      result.push({
        id: `relance-${item.id}`,
        type: "relance",
        title: item.title || "Relance",
        description: item.channel
          ? `Relance prévue par ${item.channel}`
          : "Relance commerciale créée",
        date: item.created_at || item.scheduled_at,
        status: item.status,
      });
    }

    for (const item of callsResult.data || []) {
      result.push({
        id: `appel-${item.id}`,
        type: "appel",
        title:
          item.contact_name ||
          item.phone_number ||
          "Appel téléphonique",
        description: item.summary || "Appel enregistré dans BatiPilot",
        date: combineDateAndTime(
          item.date,
          item.time,
          item.created_at
        ),
        status: item.status,
      });
    }

    if (!automationExecutionsResult.error) {
      for (const item of automationExecutionsResult.data || []) {
        result.push({
          id: `automation-${item.id}`,
          type: "automatisation",
          title: item.action_type || "Automatisation exécutée",
          description:
            item.entity_label ||
            "Une action automatique a été exécutée",
          date: item.created_at,
          status: item.result,
        });
      }
    }

    if (!agentsResult.error) {
      for (const item of agentsResult.data || []) {
        result.push({
          id: `agent-${item.id}`,
          type: "agent",
          title: item.name || "Agent IA",
          description: item.active
            ? `Agent IA actif · ${item.autonomy || "Autonomie configurée"}`
            : "Agent IA désactivé",
          date: item.updated_at || item.created_at,
          status: item.active ? "Actif" : "Inactif",
        });
      }
    }

    result.sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setActivities(result);
    setLoading(false);
  }

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activities.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.status?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (filter === "Tous") return true;
      if (filter === "Clients") return item.type === "client";
      if (filter === "Devis") return item.type === "devis";
      if (filter === "Factures") return item.type === "facture";
      if (filter === "Chantiers") return item.type === "chantier";
      if (filter === "Rendez-vous") return item.type === "rendez-vous";
      if (filter === "Relances") return item.type === "relance";
      if (filter === "Appels") return item.type === "appel";
      if (filter === "Automatisations")
        return item.type === "automatisation";
      if (filter === "Agents IA") return item.type === "agent";

      return true;
    });
  }, [activities, search, filter]);

  const groupedActivities = useMemo(() => {
    const result: Record<string, ActivityItem[]> = {};

    for (const item of filteredActivities) {
      const label = getDateGroup(item.date);

      if (!result[label]) {
        result[label] = [];
      }

      result[label].push(item);
    }

    return result;
  }, [filteredActivities]);

  const todayCount = useMemo(() => {
    const today = new Date();

    return activities.filter((item) => {
      const date = new Date(item.date);

      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }).length;
  }, [activities]);

  const automationCount = activities.filter(
    (item) => item.type === "automatisation"
  ).length;

  const commercialCount = activities.filter(
    (item) =>
      item.type === "client" ||
      item.type === "devis" ||
      item.type === "relance" ||
      item.type === "rendez-vous"
  ).length;

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
            <Activity className="h-4 w-4 text-blue-600" />

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
              Pilotage
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Activité
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Retrouvez l’historique global des événements de votre entreprise.
          </p>
        </div>

        <button
          onClick={loadActivities}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Événements"
          value={activities.length}
          icon={<Activity className="h-5 w-5" />}
        />

        <StatCard
          title="Aujourd’hui"
          value={todayCount}
          icon={<Clock3 className="h-5 w-5" />}
        />

        <StatCard
          title="Activité commerciale"
          value={commercialCount}
          icon={<TrendingIcon />}
        />

        <StatCard
          title="Automatisations"
          value={automationCount}
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Journal d’activité
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredActivities.length} événement(s) affiché(s)
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
                />
              </div>

              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as FilterType)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option>Tous</option>
                <option>Clients</option>
                <option>Devis</option>
                <option>Factures</option>
                <option>Chantiers</option>
                <option>Rendez-vous</option>
                <option>Relances</option>
                <option>Appels</option>
                <option>Automatisations</option>
                <option>Agents IA</option>
              </select>
            </div>
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center p-8 text-center">
            <div>
              <Activity className="mx-auto h-9 w-9 text-slate-300" />

              <p className="mt-3 text-sm font-bold text-slate-700">
                Aucune activité
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Aucun événement ne correspond aux filtres sélectionnés.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5">
            {Object.entries(groupedActivities).map(
              ([group, groupActivities]) => (
                <div key={group} className="mb-8 last:mb-0">
                  <div className="mb-3 flex items-center gap-3">
                    <p className="text-xs font-bold capitalize text-slate-500">
                      {group}
                    </p>

                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <div className="space-y-2">
                    {groupActivities.map((item) => (
                      <ActivityRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <div className="flex gap-4 rounded-xl border border-transparent px-3 py-3 transition hover:border-slate-100 hover:bg-slate-50">
      <div className="mt-0.5">
        <ActivityIcon type={item.type} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">
              {item.title}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {item.description}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {item.status && <StatusBadge status={item.status} />}

            <p className="text-[11px] text-slate-400">
              {formatDateTime(item.date)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({
  type,
}: {
  type: ActivityItem["type"];
}) {
  const common =
    "flex h-9 w-9 items-center justify-center rounded-lg";

  if (type === "client") {
    return (
      <div className={`${common} bg-blue-50 text-blue-600`}>
        <UserPlus className="h-4 w-4" />
      </div>
    );
  }

  if (type === "devis") {
    return (
      <div className={`${common} bg-violet-50 text-violet-600`}>
        <FileText className="h-4 w-4" />
      </div>
    );
  }

  if (type === "facture") {
    return (
      <div className={`${common} bg-emerald-50 text-emerald-600`}>
        <WalletCards className="h-4 w-4" />
      </div>
    );
  }

  if (type === "chantier") {
    return (
      <div className={`${common} bg-orange-50 text-orange-600`}>
        <BriefcaseBusiness className="h-4 w-4" />
      </div>
    );
  }

  if (type === "rendez-vous") {
    return (
      <div className={`${common} bg-cyan-50 text-cyan-600`}>
        <CalendarDays className="h-4 w-4" />
      </div>
    );
  }

  if (type === "relance") {
    return (
      <div className={`${common} bg-amber-50 text-amber-600`}>
        <Clock3 className="h-4 w-4" />
      </div>
    );
  }

  if (type === "appel") {
    return (
      <div className={`${common} bg-indigo-50 text-indigo-600`}>
        <Phone className="h-4 w-4" />
      </div>
    );
  }

  if (type === "automatisation") {
    return (
      <div className={`${common} bg-fuchsia-50 text-fuchsia-600`}>
        <Sparkles className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className={`${common} bg-slate-100 text-slate-600`}>
      <Bot className="h-4 w-4" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let classes = "bg-slate-100 text-slate-600";

  if (
    normalized.includes("payée") ||
    normalized.includes("accepté") ||
    normalized.includes("terminé") ||
    normalized.includes("confirmé") ||
    normalized.includes("exécutée") ||
    normalized.includes("actif")
  ) {
    classes = "bg-emerald-50 text-emerald-700";
  }

  if (
    normalized.includes("retard") ||
    normalized.includes("refusé") ||
    normalized.includes("annulé") ||
    normalized.includes("erreur")
  ) {
    classes = "bg-red-50 text-red-600";
  }

  if (
    normalized.includes("envoyé") ||
    normalized.includes("envoyée") ||
    normalized.includes("en cours") ||
    normalized.includes("prévu")
  ) {
    classes = "bg-blue-50 text-blue-600";
  }

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold ${classes}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{title}</p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function TrendingIcon() {
  return <Users className="h-5 w-5" />;
}
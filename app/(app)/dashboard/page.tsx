"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  Phone,
  Receipt,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Client = {
  id: string;
  name: string;
  company: string | null;
  status: string | null;
  pipeline_stage: string | null;
  created_at: string | null;
};

type Devis = {
  id: string;
  number: string;
  project: string;
  amount: number | null;
  status: string;
  created_at: string | null;
  client_id: string | null;
};

type Facture = {
  id: string;
  number: string;
  title: string;
  amount: number | null;
  status: string;
  due_date: string | null;
  created_at: string | null;
  client_id: string | null;
};

type Chantier = {
  id: string;
  name: string;
  status: string;
  progress: number | null;
  budget: number | null;
  end_date: string | null;
  client_id: string | null;
  created_at: string | null;
};

type RendezVous = {
  id: string;
  title: string;
  start_at: string;
  status: string;
  client_id: string | null;
};

type Tache = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  chantier_id: string;
  created_at: string | null;
};

type Relance = {
  id: string;
  title: string;
  channel: string;
  scheduled_at: string;
  status: string;
  client_id: string | null;
};

type PhoneCall = {
  id: string;
  contact_name: string | null;
  phone_number: string | null;
  status: string;
  date: string | null;
  time: string | null;
  created_at: string | null;
};

type DashboardData = {
  clients: Client[];
  devis: Devis[];
  factures: Facture[];
  chantiers: Chantier[];
  rendezVous: RendezVous[];
  taches: Tache[];
  relances: Relance[];
  appels: PhoneCall[];
};

type Activity = {
  id: string;
  title: string;
  description: string;
  date: string;
  href: string;
  type:
    | "client"
    | "devis"
    | "facture"
    | "chantier"
    | "rendez-vous"
    | "tache"
    | "relance"
    | "appel";
};

const initialData: DashboardData = {
  clients: [],
  devis: [],
  factures: [],
  chantiers: [],
  rendezVous: [],
  taches: [],
  relances: [],
  appels: [],
};

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("Votre entreprise");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function getOrganization() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error("Erreur profil :", profileError);
      return null;
    }

    const { data: organization } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", profile.organization_id)
      .single();

    if (organization?.name) {
      setCompanyName(organization.name);
    }

    return profile.organization_id as string;
  }

  async function loadDashboard() {
    setLoading(true);

    const organizationId = await getOrganization();

    if (!organizationId) {
      setLoading(false);
      return;
    }

    const [
      clientsResult,
      devisResult,
      facturesResult,
      chantiersResult,
      rendezVousResult,
      tachesResult,
      relancesResult,
      appelsResult,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, company, status, pipeline_stage, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),

      supabase
        .from("devis")
        .select("id, number, project, amount, status, created_at, client_id")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),

      supabase
        .from("factures")
        .select(
          "id, number, title, amount, status, due_date, created_at, client_id"
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),

      supabase
        .from("chantiers")
        .select(
          "id, name, status, progress, budget, end_date, client_id, created_at"
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),

      supabase
        .from("rendez_vous")
        .select("id, title, start_at, status, client_id")
        .eq("organization_id", organizationId)
        .order("start_at", { ascending: true }),

      supabase
        .from("chantier_taches")
        .select(
          "id, title, status, priority, due_date, chantier_id, created_at"
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),

      supabase
        .from("relances")
        .select("id, title, channel, scheduled_at, status, client_id")
        .eq("organization_id", organizationId)
        .order("scheduled_at", { ascending: true }),

      supabase
        .from("phone_calls")
        .select(
          "id, contact_name, phone_number, status, date, time, created_at"
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
    ]);

    setData({
      clients: (clientsResult.data || []) as Client[],
      devis: (devisResult.data || []) as Devis[],
      factures: (facturesResult.data || []) as Facture[],
      chantiers: (chantiersResult.data || []) as Chantier[],
      rendezVous: (rendezVousResult.data || []) as RendezVous[],
      taches: (tachesResult.data || []) as Tache[],
      relances: (relancesResult.data || []) as Relance[],
      appels: (appelsResult.data || []) as PhoneCall[],
    });

    if (clientsResult.error) {
      console.error("Erreur clients :", clientsResult.error);
    }

    if (devisResult.error) {
      console.error("Erreur devis :", devisResult.error);
    }

    if (facturesResult.error) {
      console.error("Erreur factures :", facturesResult.error);
    }

    if (chantiersResult.error) {
      console.error("Erreur chantiers :", chantiersResult.error);
    }

    if (rendezVousResult.error) {
      console.error("Erreur rendez-vous :", rendezVousResult.error);
    }

    if (tachesResult.error) {
      console.error("Erreur tâches :", tachesResult.error);
    }

    if (relancesResult.error) {
      console.error("Erreur relances :", relancesResult.error);
    }

    if (appelsResult.error) {
      console.error("Erreur appels :", appelsResult.error);
    }

    setLoading(false);
  }

  const stats = useMemo(() => {
    const prospects = data.clients.filter((client) =>
      ["prospect", "qualified"].includes(client.status || "")
    );

    const clients = data.clients.filter(
      (client) => client.status === "client"
    );

    const activeChantiers = data.chantiers.filter(
      (chantier) => chantier.status === "En cours"
    );

    const devisPending = data.devis.filter(
      (devis) => devis.status === "Envoyé"
    );

    const unpaidInvoices = data.factures.filter(
      (facture) =>
        facture.status !== "Payée" &&
        facture.status !== "Annulée"
    );

    const unpaidAmount = unpaidInvoices.reduce(
      (total, facture) => total + Number(facture.amount || 0),
      0
    );

    const acceptedQuotesAmount = data.devis
      .filter((devis) => devis.status === "Accepté")
      .reduce(
        (total, devis) => total + Number(devis.amount || 0),
        0
      );

    return {
      prospects: prospects.length,
      clients: clients.length,
      activeChantiers: activeChantiers.length,
      devisPending: devisPending.length,
      unpaidInvoices: unpaidInvoices.length,
      unpaidAmount,
      acceptedQuotesAmount,
    };
  }, [data]);

  const today = new Date();

  const todayKey = toDateKey(today);

  const todayAppointments = data.rendezVous
    .filter(
      (appointment) =>
        toDateKey(new Date(appointment.start_at)) === todayKey &&
        appointment.status !== "Annulé"
    )
    .sort(
      (a, b) =>
        new Date(a.start_at).getTime() -
        new Date(b.start_at).getTime()
    );

  const upcomingAppointments = data.rendezVous
    .filter(
      (appointment) =>
        new Date(appointment.start_at).getTime() >= Date.now() &&
        appointment.status !== "Annulé"
    )
    .slice(0, 5);

  const overdueTasks = data.taches.filter((task) => {
    if (!task.due_date) return false;

    return (
      task.status !== "Terminée" &&
      task.status !== "Annulée" &&
      new Date(`${task.due_date}T23:59:59`).getTime() < Date.now()
    );
  });

  const urgentTasks = data.taches.filter(
    (task) =>
      task.priority === "Urgente" &&
      task.status !== "Terminée" &&
      task.status !== "Annulée"
  );

  const overdueFollowUps = data.relances.filter(
    (relance) =>
      relance.status !== "Terminée" &&
      relance.status !== "Annulée" &&
      new Date(relance.scheduled_at).getTime() < Date.now()
  );

  const overdueInvoices = data.factures.filter((facture) => {
    if (!facture.due_date) return false;

    return (
      facture.status !== "Payée" &&
      facture.status !== "Annulée" &&
      new Date(`${facture.due_date}T23:59:59`).getTime() < Date.now()
    );
  });

  const recentActivities = useMemo(() => {
    const activities: Activity[] = [];

    data.clients.forEach((client) => {
      if (!client.created_at) return;

      activities.push({
        id: `client-${client.id}`,
        title: client.name,
        description:
          client.status === "client"
            ? "Nouveau client"
            : "Nouveau prospect",
        date: client.created_at,
        href:
          client.status === "client"
            ? `/clients/${client.id}`
            : "/prospects",
        type: "client",
      });
    });

    data.devis.forEach((devis) => {
      if (!devis.created_at) return;

      activities.push({
        id: `devis-${devis.id}`,
        title: devis.project,
        description: `Devis ${devis.number} · ${devis.status}`,
        date: devis.created_at,
        href: "/devis",
        type: "devis",
      });
    });

    data.factures.forEach((facture) => {
      if (!facture.created_at) return;

      activities.push({
        id: `facture-${facture.id}`,
        title: facture.title,
        description: `Facture ${facture.number} · ${facture.status}`,
        date: facture.created_at,
        href: "/factures",
        type: "facture",
      });
    });

    data.chantiers.forEach((chantier) => {
      if (!chantier.created_at) return;

      activities.push({
        id: `chantier-${chantier.id}`,
        title: chantier.name,
        description: `Chantier · ${chantier.status}`,
        date: chantier.created_at,
        href: `/chantiers/${chantier.id}`,
        type: "chantier",
      });
    });

    data.taches.forEach((task) => {
      if (!task.created_at) return;

      activities.push({
        id: `task-${task.id}`,
        title: task.title,
        description: `Tâche · ${task.status}`,
        date: task.created_at,
        href: "/taches",
        type: "tache",
      });
    });

    data.appels.forEach((call) => {
      if (!call.created_at) return;

      activities.push({
        id: `call-${call.id}`,
        title: call.contact_name || call.phone_number || "Appel",
        description: `Appel · ${call.status}`,
        date: call.created_at,
        href: "/appels",
        type: "appel",
      });
    });

    return activities
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 7);
  }, [data]);

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
            Vue d&apos;ensemble
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Bonjour, {companyName}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Voici ce qui se passe dans votre entreprise aujourd&apos;hui.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Actualiser
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Clients"
          value={stats.clients.toString()}
          subtitle={`${stats.prospects} prospect${
            stats.prospects > 1 ? "s" : ""
          }`}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          onClick={() => router.push("/clients")}
        />

        <MetricCard
          title="Chantiers en cours"
          value={stats.activeChantiers.toString()}
          subtitle={`${data.chantiers.length} chantier${
            data.chantiers.length > 1 ? "s" : ""
          } au total`}
          icon={<FolderKanban className="h-5 w-5 text-violet-600" />}
          onClick={() => router.push("/chantiers")}
        />

        <MetricCard
          title="Devis envoyés"
          value={stats.devisPending.toString()}
          subtitle={`${formatMoney(
            stats.acceptedQuotesAmount
          )} acceptés`}
          icon={<FileText className="h-5 w-5 text-amber-600" />}
          onClick={() => router.push("/devis")}
        />

        <MetricCard
          title="À encaisser"
          value={formatMoney(stats.unpaidAmount)}
          subtitle={`${stats.unpaidInvoices} facture${
            stats.unpaidInvoices > 1 ? "s" : ""
          }`}
          icon={<WalletCards className="h-5 w-5 text-emerald-600" />}
          onClick={() => router.push("/factures")}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Aujourd&apos;hui
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Rendez-vous prévus pour la journée
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/agenda")}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Voir l&apos;agenda
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-5">
              {loading ? (
                <LoadingBlock />
              ) : todayAppointments.length === 0 ? (
                <EmptyBlock
                  icon={<CalendarDays className="h-7 w-7" />}
                  title="Aucun rendez-vous aujourd'hui"
                  description="Votre journée est libre pour le moment."
                />
              ) : (
                <div className="space-y-3">
                  {todayAppointments.map((appointment) => {
                    const client = data.clients.find(
                      (item) => item.id === appointment.client_id
                    );

                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => router.push("/rendez-vous")}
                        className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-100 p-4 text-left transition hover:border-slate-200 hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <Clock3 className="h-4 w-4 text-blue-600" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {appointment.title}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {formatTime(appointment.start_at)}
                              {client ? ` · ${client.name}` : ""}
                            </p>
                          </div>
                        </div>

                        <StatusBadge status={appointment.status} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Chantiers actifs
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Suivi de l&apos;avancement de vos opérations
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/chantiers")}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Voir tous
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-5">
              {loading ? (
                <LoadingBlock />
              ) : data.chantiers.filter(
                  (chantier) =>
                    chantier.status === "En cours" ||
                    chantier.status === "À venir"
                ).length === 0 ? (
                <EmptyBlock
                  icon={<FolderKanban className="h-7 w-7" />}
                  title="Aucun chantier actif"
                  description="Les chantiers en cours apparaîtront ici."
                />
              ) : (
                <div className="space-y-3">
                  {data.chantiers
                    .filter(
                      (chantier) =>
                        chantier.status === "En cours" ||
                        chantier.status === "À venir"
                    )
                    .slice(0, 5)
                    .map((chantier) => {
                      const client = data.clients.find(
                        (item) => item.id === chantier.client_id
                      );

                      return (
                        <button
                          key={chantier.id}
                          type="button"
                          onClick={() =>
                            router.push(`/chantiers/${chantier.id}`)
                          }
                          className="w-full rounded-xl border border-slate-100 p-4 text-left transition hover:border-slate-200 hover:bg-slate-50"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {chantier.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {client?.name || "Aucun client associé"}
                              </p>
                            </div>

                            <StatusBadge status={chantier.status} />
                          </div>

                          <div className="mt-4">
                            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                              <span>Avancement</span>
                              <span>{chantier.progress || 0}%</span>
                            </div>

                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, chantier.progress || 0)
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Activité récente
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Dernières actions enregistrées dans BatiPilot
                </p>
              </div>
            </div>

            <div className="p-5">
              {loading ? (
                <LoadingBlock />
              ) : recentActivities.length === 0 ? (
                <EmptyBlock
                  icon={<TrendingUp className="h-7 w-7" />}
                  title="Aucune activité récente"
                  description="Les nouvelles actions apparaîtront ici."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentActivities.map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => router.push(activity.href)}
                      className="flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0"
                    >
                      <ActivityIcon type={activity.type} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {activity.title}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {activity.description}
                        </p>
                      </div>

                      <span className="shrink-0 text-[10px] text-slate-400">
                        {formatRelativeDate(activity.date)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">
                À surveiller
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Les actions qui demandent votre attention
              </p>
            </div>

            <div className="space-y-3 p-5">
              <AlertCard
                title="Tâches en retard"
                value={overdueTasks.length}
                description={
                  overdueTasks.length
                    ? "Des tâches ont dépassé leur échéance."
                    : "Aucune tâche en retard."
                }
                danger={overdueTasks.length > 0}
                onClick={() => router.push("/taches")}
              />

              <AlertCard
                title="Tâches urgentes"
                value={urgentTasks.length}
                description={
                  urgentTasks.length
                    ? "Des tâches urgentes restent à traiter."
                    : "Aucune tâche urgente."
                }
                danger={urgentTasks.length > 0}
                onClick={() => router.push("/taches")}
              />

              <AlertCard
                title="Relances en retard"
                value={overdueFollowUps.length}
                description={
                  overdueFollowUps.length
                    ? "Des relances clients doivent être effectuées."
                    : "Toutes les relances sont à jour."
                }
                danger={overdueFollowUps.length > 0}
                onClick={() => router.push("/relances")}
              />

              <AlertCard
                title="Factures échues"
                value={overdueInvoices.length}
                description={
                  overdueInvoices.length
                    ? "Des factures ont dépassé leur échéance."
                    : "Aucune facture échue."
                }
                danger={overdueInvoices.length > 0}
                onClick={() => router.push("/factures")}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">
                Prochains rendez-vous
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Votre planning à venir
              </p>
            </div>

            <div className="p-5">
              {loading ? (
                <LoadingBlock />
              ) : upcomingAppointments.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">
                  Aucun rendez-vous à venir.
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => router.push("/agenda")}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-50">
                        <span className="text-[9px] font-semibold uppercase text-slate-400">
                          {new Date(appointment.start_at)
                            .toLocaleDateString("fr-FR", {
                              month: "short",
                            })
                            .replace(".", "")}
                        </span>

                        <span className="text-xs font-bold text-slate-800">
                          {new Date(appointment.start_at).getDate()}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {appointment.title}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatTime(appointment.start_at)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">
                Accès rapide
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5">
              <QuickAction
                label="Nouveau client"
                icon={<UserRound className="h-4 w-4" />}
                onClick={() => router.push("/clients")}
              />

              <QuickAction
                label="Nouveau devis"
                icon={<FileText className="h-4 w-4" />}
                onClick={() => router.push("/devis")}
              />

              <QuickAction
                label="Nouveau chantier"
                icon={<BriefcaseBusiness className="h-4 w-4" />}
                onClick={() => router.push("/chantiers")}
              />

              <QuickAction
                label="Rendez-vous"
                icon={<CalendarDays className="h-4 w-4" />}
                onClick={() => router.push("/rendez-vous")}
              />

              <QuickAction
                label="Factures"
                icon={<Receipt className="h-4 w-4" />}
                onClick={() => router.push("/factures")}
              />

              <QuickAction
                label="Tâches"
                icon={<ClipboardList className="h-4 w-4" />}
                onClick={() => router.push("/taches")}
              />
            </div>
          </section>

          <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white p-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  BatiPilot IA
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Les recommandations automatiques pourront être ajoutées ici
                  quand les fonctions IA seront activées.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>

          <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5">{icon}</div>
      </div>
    </button>
  );
}

function AlertCard({
  title,
  value,
  description,
  danger,
  onClick,
}: {
  title: string;
  value: number;
  description: string;
  danger: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-slate-100 p-3.5 text-left transition hover:bg-slate-50"
    >
      <div
        className={`rounded-lg p-2 ${
          danger ? "bg-red-50" : "bg-emerald-50"
        }`}
      >
        {danger ? (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-800">{title}</p>

          <span
            className={`text-xs font-bold ${
              danger ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {value}
          </span>
        </div>

        <p className="mt-1 text-[11px] leading-4 text-slate-500">
          {description}
        </p>
      </div>
    </button>
  );
}

function QuickAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-xl border border-slate-100 p-3 text-left text-slate-600 transition hover:border-blue-100 hover:bg-blue-50/50 hover:text-blue-700"
    >
      {icon}

      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

function ActivityIcon({
  type,
}: {
  type: Activity["type"];
}) {
  if (type === "client") {
    return (
      <div className="rounded-lg bg-blue-50 p-2">
        <UserRound className="h-4 w-4 text-blue-600" />
      </div>
    );
  }

  if (type === "devis") {
    return (
      <div className="rounded-lg bg-amber-50 p-2">
        <FileText className="h-4 w-4 text-amber-600" />
      </div>
    );
  }

  if (type === "facture") {
    return (
      <div className="rounded-lg bg-emerald-50 p-2">
        <Receipt className="h-4 w-4 text-emerald-600" />
      </div>
    );
  }

  if (type === "chantier") {
    return (
      <div className="rounded-lg bg-violet-50 p-2">
        <FolderKanban className="h-4 w-4 text-violet-600" />
      </div>
    );
  }

  if (type === "tache") {
    return (
      <div className="rounded-lg bg-sky-50 p-2">
        <ClipboardList className="h-4 w-4 text-sky-600" />
      </div>
    );
  }

  if (type === "appel") {
    return (
      <div className="rounded-lg bg-orange-50 p-2">
        <Phone className="h-4 w-4 text-orange-600" />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <CalendarDays className="h-4 w-4 text-slate-600" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let style = "bg-slate-50 text-slate-600";

  if (
    status === "En cours" ||
    status === "Confirmé" ||
    status === "Accepté"
  ) {
    style = "bg-blue-50 text-blue-700";
  }

  if (
    status === "Terminé" ||
    status === "Payée" ||
    status === "Validé"
  ) {
    style = "bg-emerald-50 text-emerald-700";
  }

  if (
    status === "Annulé" ||
    status === "Refusé" ||
    status === "Perdu"
  ) {
    style = "bg-red-50 text-red-700";
  }

  if (
    status === "À venir" ||
    status === "Prévu" ||
    status === "Envoyé"
  ) {
    style = "bg-amber-50 text-amber-700";
  }

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${style}`}
    >
      {status}
    </span>
  );
}

function EmptyBlock({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
      <div className="mx-auto flex justify-center text-slate-300">{icon}</div>

      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatRelativeDate(date: string) {
  const target = new Date(date);
  const now = new Date();

  const diff = now.getTime() - target.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "maintenant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours} h`;
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;

  return target.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}
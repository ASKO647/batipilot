"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Client = {
  id: string;
  status: string | null;
  created_at: string | null;
};

type Devis = {
  id: string;
  amount: number | null;
  status: string | null;
  created_at: string | null;
};

type Facture = {
  id: string;
  amount: number | null;
  status: string | null;
  issue_date: string | null;
  created_at: string | null;
};

type Chantier = {
  id: string;
  status: string | null;
  budget: number | null;
  progress: number | null;
  created_at: string | null;
};

type RendezVous = {
  id: string;
  status: string | null;
  start_at: string | null;
};

type Relance = {
  id: string;
  status: string | null;
  scheduled_at: string | null;
};

type MonthStat = {
  key: string;
  label: string;
  devis: number;
  factures: number;
};

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function percent(value: number) {
  if (!Number.isFinite(value)) return "0 %";

  return `${Math.round(value)} %`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function getLastSixMonths(): MonthStat[] {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    month: "short",
  });

  const result: MonthStat[] = [];
  const now = new Date();

  for (let index = 5; index >= 0; index--) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);

    result.push({
      key: monthKey(date),
      label: formatter.format(date).replace(".", ""),
      devis: 0,
      factures: 0,
    });
  }

  return result;
}

export default function StatistiquesPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [relances, setRelances] = useState<Relance[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
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

  async function loadData() {
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
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id,status,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("devis")
        .select("id,amount,status,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("factures")
        .select("id,amount,status,issue_date,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("chantiers")
        .select("id,status,budget,progress,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("rendez_vous")
        .select("id,status,start_at")
        .eq("organization_id", organizationId),

      supabase
        .from("relances")
        .select("id,status,scheduled_at")
        .eq("organization_id", organizationId),
    ]);

    const firstError =
      clientsResult.error ||
      devisResult.error ||
      facturesResult.error ||
      chantiersResult.error ||
      rendezVousResult.error ||
      relancesResult.error;

    if (firstError) {
      console.error(firstError);
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setClients((clientsResult.data || []) as Client[]);
    setDevis((devisResult.data || []) as Devis[]);
    setFactures((facturesResult.data || []) as Facture[]);
    setChantiers((chantiersResult.data || []) as Chantier[]);
    setRendezVous((rendezVousResult.data || []) as RendezVous[]);
    setRelances((relancesResult.data || []) as Relance[]);

    setLoading(false);
  }

  const stats = useMemo(() => {
    const prospects = clients.filter(
      (client) =>
        client.status?.toLowerCase() === "prospect" ||
        client.status?.toLowerCase() === "qualified"
    ).length;

    const vraisClients = clients.filter(
      (client) => client.status?.toLowerCase() === "client"
    ).length;

    const totalDevis = devis.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const devisAcceptes = devis.filter(
      (item) => item.status === "Accepté"
    );

    const montantDevisAcceptes = devisAcceptes.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const tauxAcceptation =
      devis.length > 0 ? (devisAcceptes.length / devis.length) * 100 : 0;

    const facturesPayees = factures.filter(
      (item) => item.status === "Payée"
    );

    const chiffreAffaires = facturesPayees.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const facturesEnAttente = factures.filter(
      (item) =>
        item.status === "Envoyée" ||
        item.status === "En retard"
    );

    const montantEnAttente = facturesEnAttente.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const chantiersEnCours = chantiers.filter(
      (item) => item.status === "En cours"
    );

    const progressionMoyenne =
      chantiersEnCours.length > 0
        ? chantiersEnCours.reduce(
            (sum, item) => sum + Number(item.progress || 0),
            0
          ) / chantiersEnCours.length
        : 0;

    const now = new Date();

    const rendezVousAVenir = rendezVous.filter((item) => {
      if (!item.start_at) return false;

      return (
        new Date(item.start_at) >= now &&
        item.status !== "Annulé" &&
        item.status !== "Terminé"
      );
    }).length;

    const relancesEnRetard = relances.filter((item) => {
      if (!item.scheduled_at) return false;

      return (
        new Date(item.scheduled_at) < now &&
        item.status !== "Terminée" &&
        item.status !== "Annulée"
      );
    }).length;

    return {
      prospects,
      vraisClients,
      totalDevis,
      devisAcceptes: devisAcceptes.length,
      montantDevisAcceptes,
      tauxAcceptation,
      chiffreAffaires,
      montantEnAttente,
      chantiersEnCours: chantiersEnCours.length,
      progressionMoyenne,
      rendezVousAVenir,
      relancesEnRetard,
    };
  }, [clients, devis, factures, chantiers, rendezVous, relances]);

  const monthlyData = useMemo(() => {
    const months = getLastSixMonths();

    devis.forEach((item) => {
      if (!item.created_at) return;

      const date = new Date(item.created_at);
      const key = monthKey(date);
      const month = months.find((entry) => entry.key === key);

      if (month) {
        month.devis += Number(item.amount || 0);
      }
    });

    factures.forEach((item) => {
      if (item.status !== "Payée") return;

      const sourceDate = item.issue_date || item.created_at;

      if (!sourceDate) return;

      const date = new Date(sourceDate);
      const key = monthKey(date);
      const month = months.find((entry) => entry.key === key);

      if (month) {
        month.factures += Number(item.amount || 0);
      }
    });

    return months;
  }, [devis, factures]);

  const devisStatuses = useMemo(() => {
    return [
      {
        label: "Brouillons",
        value: devis.filter((item) => item.status === "Brouillon").length,
      },
      {
        label: "Envoyés",
        value: devis.filter((item) => item.status === "Envoyé").length,
      },
      {
        label: "Acceptés",
        value: devis.filter((item) => item.status === "Accepté").length,
      },
      {
        label: "Refusés",
        value: devis.filter((item) => item.status === "Refusé").length,
      },
    ];
  }, [devis]);

  const chantierStatuses = useMemo(() => {
    return [
      {
        label: "À venir",
        value: chantiers.filter((item) => item.status === "À venir").length,
      },
      {
        label: "En cours",
        value: chantiers.filter((item) => item.status === "En cours").length,
      },
      {
        label: "En attente",
        value: chantiers.filter((item) => item.status === "En attente").length,
      },
      {
        label: "Terminés",
        value: chantiers.filter((item) => item.status === "Terminé").length,
      },
    ];
  }, [chantiers]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
              Pilotage
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Statistiques
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Analysez les performances commerciales, financières et
            opérationnelles de votre entreprise.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
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
          title="Chiffre d'affaires encaissé"
          value={money(stats.chiffreAffaires)}
          subtitle="Factures payées"
          icon={<Banknote className="h-5 w-5" />}
        />

        <StatCard
          title="Devis acceptés"
          value={money(stats.montantDevisAcceptes)}
          subtitle={`${stats.devisAcceptes} devis`}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <StatCard
          title="Taux d'acceptation"
          value={percent(stats.tauxAcceptation)}
          subtitle={`${devis.length} devis au total`}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <StatCard
          title="À encaisser"
          value={money(stats.montantEnAttente)}
          subtitle="Factures envoyées / en retard"
          icon={<WalletCards className="h-5 w-5" />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SmallStat
          title="Clients"
          value={stats.vraisClients}
          icon={<Users className="h-4 w-4" />}
        />

        <SmallStat
          title="Prospects"
          value={stats.prospects}
          icon={<ArrowUpRight className="h-4 w-4" />}
        />

        <SmallStat
          title="Chantiers en cours"
          value={stats.chantiersEnCours}
          icon={<BriefcaseBusiness className="h-4 w-4" />}
        />

        <SmallStat
          title="Rendez-vous à venir"
          value={stats.rendezVousAVenir}
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.5fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Évolution financière
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Montant des devis créés et chiffre d'affaires encaissé sur les 6
              derniers mois.
            </p>
          </div>

          <FinancialChart data={monthlyData} />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">
            Performance commerciale
          </h2>

          <div className="mt-6 space-y-6">
            <ProgressMetric
              label="Acceptation des devis"
              value={stats.tauxAcceptation}
              text={percent(stats.tauxAcceptation)}
            />

            <ProgressMetric
              label="Progression moyenne des chantiers"
              value={stats.progressionMoyenne}
              text={percent(stats.progressionMoyenne)}
            />
          </div>

          <div className="mt-7 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Relances en retard
              </div>

              <span className="text-lg font-bold text-slate-900">
                {stats.relancesEnRetard}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-sm font-bold text-slate-900">
              Répartition des devis
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Nombre de devis par statut.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
            {devisStatuses.map((item) => (
              <div key={item.label} className="bg-white p-5">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-sm font-bold text-slate-900">
              Répartition des chantiers
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              État actuel de vos chantiers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
            {chantierStatuses.map((item) => (
              <div key={item.label} className="bg-white p-5">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<FileText className="h-4 w-4" />}
          label="Volume total des devis"
          value={money(stats.totalDevis)}
        />

        <SummaryCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Factures à encaisser"
          value={money(stats.montantEnAttente)}
        />

        <SummaryCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Progression chantier moyenne"
          value={percent(stats.progressionMoyenne)}
        />
      </div>
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
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SmallStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div>
        <p className="text-xs text-slate-500">{title}</p>
        <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
      </div>

      <div className="rounded-lg bg-slate-50 p-2.5 text-slate-500">
        {icon}
      </div>
    </div>
  );
}

function ProgressMetric({
  label,
  value,
  text,
}: {
  label: string;
  value: number;
  text: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-600">{label}</p>
        <p className="text-xs font-bold text-slate-900">{text}</p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="rounded-lg bg-slate-50 p-3 text-blue-600">{icon}</div>

      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function FinancialChart({ data }: { data: MonthStat[] }) {
  const maximum = Math.max(
    1,
    ...data.flatMap((item) => [item.devis, item.factures])
  );

  return (
    <div className="mt-8">
      <div className="mb-5 flex items-center gap-5 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
          Devis
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          CA encaissé
        </div>
      </div>

      <div className="flex h-64 items-end gap-3 border-b border-slate-200">
        {data.map((item) => {
          const devisHeight =
            item.devis === 0 ? 2 : Math.max(5, (item.devis / maximum) * 100);

          const factureHeight =
            item.factures === 0
              ? 2
              : Math.max(5, (item.factures / maximum) * 100);

          return (
            <div
              key={item.key}
              className="flex h-full min-w-0 flex-1 flex-col justify-end"
            >
              <div className="flex h-[210px] items-end justify-center gap-1.5">
                <div
                  title={`Devis : ${money(item.devis)}`}
                  className="w-full max-w-8 rounded-t-md bg-blue-600 transition-all"
                  style={{ height: `${devisHeight}%` }}
                />

                <div
                  title={`CA encaissé : ${money(item.factures)}`}
                  className="w-full max-w-8 rounded-t-md bg-emerald-500 transition-all"
                  style={{ height: `${factureHeight}%` }}
                />
              </div>

              <p className="mt-3 truncate text-center text-[11px] font-medium capitalize text-slate-400">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
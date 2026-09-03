"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Loader2,
  Printer,
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
  due_date: string | null;
  created_at: string | null;
};

type Chantier = {
  id: string;
  status: string | null;
  progress: number | null;
  budget: number | null;
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
  created_at: string | null;
};

type Organization = {
  name?: string | null;
};

type Period = "30" | "90" | "365" | "all";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getStartDate(period: Period) {
  if (period === "all") return null;

  const date = new Date();
  date.setDate(date.getDate() - Number(period));

  return date;
}

function isInPeriod(
  rawDate: string | null | undefined,
  startDate: Date | null
) {
  if (!rawDate) return false;
  if (!startDate) return true;

  return new Date(rawDate) >= startDate;
}

export default function RapportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState<Period>("30");

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [relances, setRelances] = useState<Relance[]>([]);

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
      organizationResult,
      clientsResult,
      devisResult,
      facturesResult,
      chantiersResult,
      rendezVousResult,
      relancesResult,
    ] = await Promise.all([
      supabase
        .from("organizations")
        .select("name")
        .eq("id", organizationId)
        .maybeSingle(),

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
        .select("id,amount,status,issue_date,due_date,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("chantiers")
        .select("id,status,progress,budget,created_at")
        .eq("organization_id", organizationId),

      supabase
        .from("rendez_vous")
        .select("id,status,start_at")
        .eq("organization_id", organizationId),

      supabase
        .from("relances")
        .select("id,status,scheduled_at,created_at")
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

    setOrganization(organizationResult.data || null);
    setClients((clientsResult.data || []) as Client[]);
    setDevis((devisResult.data || []) as Devis[]);
    setFactures((facturesResult.data || []) as Facture[]);
    setChantiers((chantiersResult.data || []) as Chantier[]);
    setRendezVous((rendezVousResult.data || []) as RendezVous[]);
    setRelances((relancesResult.data || []) as Relance[]);

    setLoading(false);
  }

  const report = useMemo(() => {
    const startDate = getStartDate(period);

    const periodClients = clients.filter((item) =>
      isInPeriod(item.created_at, startDate)
    );

    const periodDevis = devis.filter((item) =>
      isInPeriod(item.created_at, startDate)
    );

    const periodFactures = factures.filter((item) =>
      isInPeriod(item.issue_date || item.created_at, startDate)
    );

    const periodChantiers = chantiers.filter((item) =>
      isInPeriod(item.created_at, startDate)
    );

    const periodRendezVous = rendezVous.filter((item) =>
      isInPeriod(item.start_at, startDate)
    );

    const periodRelances = relances.filter((item) =>
      isInPeriod(item.scheduled_at || item.created_at, startDate)
    );

    const prospects = periodClients.filter((item) => {
      const status = item.status?.toLowerCase();

      return status === "prospect" || status === "qualified";
    }).length;

    const nouveauxClients = periodClients.filter(
      (item) => item.status?.toLowerCase() === "client"
    ).length;

    const devisAcceptes = periodDevis.filter(
      (item) => item.status === "Accepté"
    );

    const devisRefuses = periodDevis.filter(
      (item) => item.status === "Refusé"
    );

    const devisEnvoyes = periodDevis.filter(
      (item) => item.status === "Envoyé"
    );

    const montantDevis = periodDevis.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const montantDevisAcceptes = devisAcceptes.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const tauxAcceptation =
      periodDevis.length > 0
        ? (devisAcceptes.length / periodDevis.length) * 100
        : 0;

    const facturesPayees = periodFactures.filter(
      (item) => item.status === "Payée"
    );

    const facturesEnvoyees = periodFactures.filter(
      (item) => item.status === "Envoyée"
    );

    const facturesEnRetard = periodFactures.filter(
      (item) => item.status === "En retard"
    );

    const chiffreAffaires = facturesPayees.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const montantEnAttente = [
      ...facturesEnvoyees,
      ...facturesEnRetard,
    ].reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const chantiersEnCours = chantiers.filter(
      (item) => item.status === "En cours"
    );

    const chantiersTermines = periodChantiers.filter(
      (item) => item.status === "Terminé"
    );

    const progressionMoyenne =
      chantiersEnCours.length > 0
        ? chantiersEnCours.reduce(
            (sum, item) => sum + Number(item.progress || 0),
            0
          ) / chantiersEnCours.length
        : 0;

    const rendezVousTermines = periodRendezVous.filter(
      (item) => item.status === "Terminé"
    );

    const rendezVousAnnules = periodRendezVous.filter(
      (item) => item.status === "Annulé"
    );

    const relancesTerminees = periodRelances.filter(
      (item) => item.status === "Terminée"
    );

    const now = new Date();

    const relancesEnRetard = relances.filter((item) => {
      if (!item.scheduled_at) return false;

      return (
        new Date(item.scheduled_at) < now &&
        item.status !== "Terminée" &&
        item.status !== "Annulée"
      );
    }).length;

    return {
      startDate,
      periodClients,
      periodDevis,
      periodFactures,
      periodChantiers,
      periodRendezVous,
      periodRelances,

      prospects,
      nouveauxClients,

      devisAcceptes: devisAcceptes.length,
      devisRefuses: devisRefuses.length,
      devisEnvoyes: devisEnvoyes.length,
      montantDevis,
      montantDevisAcceptes,
      tauxAcceptation,

      facturesPayees: facturesPayees.length,
      facturesEnvoyees: facturesEnvoyees.length,
      facturesEnRetard: facturesEnRetard.length,
      chiffreAffaires,
      montantEnAttente,

      chantiersEnCours: chantiersEnCours.length,
      chantiersTermines: chantiersTermines.length,
      progressionMoyenne,

      rendezVousTermines: rendezVousTermines.length,
      rendezVousAnnules: rendezVousAnnules.length,

      relancesTerminees: relancesTerminees.length,
      relancesEnRetard,
    };
  }, [
    period,
    clients,
    devis,
    factures,
    chantiers,
    rendezVous,
    relances,
  ]);

  const periodLabel = useMemo(() => {
    if (period === "30") return "30 derniers jours";
    if (period === "90") return "90 derniers jours";
    if (period === "365") return "12 derniers mois";

    return "Depuis le début";
  }, [period]);

  function printReport() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full px-7 py-7 print:bg-white print:px-0 print:py-0">
      <div className="print:hidden">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />

              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
                Pilotage
              </p>
            </div>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Rapports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Générez un rapport synthétique à partir des données réelles de
              votre entreprise.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>

            <button
              onClick={printReport}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Printer className="h-4 w-4" />
              Imprimer / PDF
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Période du rapport
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Les indicateurs seront recalculés automatiquement.
              </p>
            </div>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm"
            >
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="365">12 derniers mois</option>
              <option value="all">Depuis le début</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      <div
        id="batipilot-report"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 print:mt-0 print:border-0 print:p-0"
      >
        <div className="border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                BatiPilot
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Rapport d’activité
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {organization?.name || "Entreprise"}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-semibold text-slate-500">
                {periodLabel}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Généré le {formatDate(new Date())}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-7">
          <SectionTitle
            icon={<BarChart3 className="h-4 w-4" />}
            title="Vue d’ensemble"
          />

          <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4 print:grid-cols-4">
            <ReportMetric
              label="CA encaissé"
              value={money(report.chiffreAffaires)}
            />

            <ReportMetric
              label="Devis acceptés"
              value={money(report.montantDevisAcceptes)}
            />

            <ReportMetric
              label="Taux d’acceptation"
              value={`${Math.round(report.tauxAcceptation)} %`}
            />

            <ReportMetric
              label="À encaisser"
              value={money(report.montantEnAttente)}
            />
          </div>
        </section>

        <section className="mt-8">
          <SectionTitle
            icon={<Users className="h-4 w-4" />}
            title="Commercial"
          />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2">
            <ReportBlock
              title="Clients et prospects"
              rows={[
                ["Nouveaux clients", report.nouveauxClients],
                ["Nouveaux prospects", report.prospects],
                ["Total créés sur la période", report.periodClients.length],
              ]}
            />

            <ReportBlock
              title="Devis"
              rows={[
                ["Devis créés", report.periodDevis.length],
                ["Devis envoyés", report.devisEnvoyes],
                ["Devis acceptés", report.devisAcceptes],
                ["Devis refusés", report.devisRefuses],
                ["Montant total", money(report.montantDevis)],
              ]}
            />
          </div>
        </section>

        <section className="mt-8">
          <SectionTitle
            icon={<WalletCards className="h-4 w-4" />}
            title="Facturation"
          />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2">
            <ReportBlock
              title="Factures"
              rows={[
                ["Factures créées", report.periodFactures.length],
                ["Factures payées", report.facturesPayees],
                ["Factures envoyées", report.facturesEnvoyees],
                ["Factures en retard", report.facturesEnRetard],
              ]}
            />

            <ReportBlock
              title="Montants"
              rows={[
                ["Chiffre d’affaires encaissé", money(report.chiffreAffaires)],
                ["Montant à encaisser", money(report.montantEnAttente)],
              ]}
            />
          </div>
        </section>

        <section className="mt-8">
          <SectionTitle
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            title="Chantiers"
          />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 print:grid-cols-3">
            <ReportMetric
              label="Chantiers créés"
              value={report.periodChantiers.length}
            />

            <ReportMetric
              label="Chantiers terminés"
              value={report.chantiersTermines}
            />

            <ReportMetric
              label="Progression moyenne"
              value={`${Math.round(report.progressionMoyenne)} %`}
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Chantiers actuellement en cours
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Tous chantiers confondus
                </p>
              </div>

              <p className="text-2xl font-bold text-slate-900">
                {report.chantiersEnCours}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <SectionTitle
            icon={<CalendarDays className="h-4 w-4" />}
            title="Organisation commerciale"
          />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2">
            <ReportBlock
              title="Rendez-vous"
              rows={[
                ["Rendez-vous sur la période", report.periodRendezVous.length],
                ["Rendez-vous terminés", report.rendezVousTermines],
                ["Rendez-vous annulés", report.rendezVousAnnules],
              ]}
            />

            <ReportBlock
              title="Relances"
              rows={[
                ["Relances sur la période", report.periodRelances.length],
                ["Relances terminées", report.relancesTerminees],
                ["Relances actuellement en retard", report.relancesEnRetard],
              ]}
            />
          </div>
        </section>

        <section className="mt-8">
          <SectionTitle
            icon={<TrendingUp className="h-4 w-4" />}
            title="Synthèse"
          />

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 print:bg-white">
            <p className="text-sm leading-6 text-slate-600">
              Sur la période <strong>{periodLabel.toLowerCase()}</strong>,
              l’entreprise a créé{" "}
              <strong>{report.periodDevis.length} devis</strong>, dont{" "}
              <strong>{report.devisAcceptes} acceptés</strong>, pour un montant
              accepté de{" "}
              <strong>{money(report.montantDevisAcceptes)}</strong>.
              Le chiffre d’affaires encaissé sur cette même période est de{" "}
              <strong>{money(report.chiffreAffaires)}</strong>.
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              L’activité chantier compte actuellement{" "}
              <strong>{report.chantiersEnCours} chantier(s) en cours</strong>,
              avec une progression moyenne de{" "}
              <strong>{Math.round(report.progressionMoyenne)} %</strong>.
              {report.relancesEnRetard > 0
                ? ` ${report.relancesEnRetard} relance(s) nécessite(nt) actuellement une attention.`
                : " Aucune relance en retard n’est actuellement détectée."}
            </p>
          </div>
        </section>

        <div className="mt-10 border-t border-slate-200 pt-5">
          <p className="text-center text-[11px] text-slate-400">
            Rapport généré automatiquement par BatiPilot à partir des données
            de l’entreprise.
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-blue-600">{icon}</div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
  );
}

function ReportMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ReportBlock({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string | number]>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <p className="text-sm font-bold text-slate-900">{title}</p>

      <div className="mt-4 divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <p className="text-xs text-slate-500">{label}</p>

            <p className="text-xs font-bold text-slate-800">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
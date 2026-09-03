"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Phone,
  Clock3,
  UserRound,
  FileText,
  RotateCcw,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type PhoneCallRow = {
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

const statuses = [
  "Traité",
  "Manqué",
  "À rappeler",
  "Prospect qualifié",
];

export default function AppelsPage() {
  const [calls, setCalls] = useState<PhoneCallRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    loadCalls();
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

    if (error || !profile) {
      console.error("Erreur profil :", error);
      return null;
    }

    return profile.organization_id as string;
  }

  async function loadCalls() {
    setLoading(true);

    const organizationId = await getOrganizationId();

    if (!organizationId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("phone_calls")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement appels :", error);
      setLoading(false);
      return;
    }

    setCalls((data || []) as PhoneCallRow[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("phone_calls")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadCalls();
  }

  async function deleteCall(id: string) {
    const confirmed = window.confirm(
      "Supprimer définitivement cet appel ?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("phone_calls")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadCalls();
  }

  function formatDate(call: PhoneCallRow) {
    if (call.date) {
      return new Date(call.date).toLocaleDateString("fr-FR");
    }

    return new Date(call.created_at).toLocaleDateString("fr-FR");
  }

  function formatDuration(duration: number | null) {
    if (!duration) return "Durée inconnue";

    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    if (minutes === 0) {
      return `${seconds}s`;
    }

    return `${minutes} min ${seconds}s`;
  }

  function getStatusStyle(status: string) {
    if (status === "Prospect qualifié") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "À rappeler") {
      return "bg-amber-50 text-amber-700";
    }

    if (status === "Manqué") {
      return "bg-red-50 text-red-700";
    }

    return "bg-blue-50 text-blue-700";
  }

  const filteredCalls = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = calls.filter((call) => {
      const matchesSearch =
        !query ||
        call.contact_name?.toLowerCase().includes(query) ||
        call.phone_number?.toLowerCase().includes(query) ||
        call.summary?.toLowerCase().includes(query) ||
        call.identified_need?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "Tous" || call.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortBy === "duration-desc") {
        return Number(b.duration || 0) - Number(a.duration || 0);
      }

      if (sortBy === "duration-asc") {
        return Number(a.duration || 0) - Number(b.duration || 0);
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [calls, search, statusFilter, sortBy]);

  const totalCalls = calls.length;

  const missedCount = calls.filter(
    (call) => call.status === "Manqué"
  ).length;

  const recallCount = calls.filter(
    (call) => call.status === "À rappeler"
  ).length;

  const qualifiedCount = calls.filter(
    (call) => call.status === "Prospect qualifié"
  ).length;

  return (
    <div className="w-full px-7 py-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Appels
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Consultez l&apos;historique des appels et les actions à suivre.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total appels"
          value={totalCalls.toString()}
          icon={<Phone className="h-5 w-5 text-blue-600" />}
        />

        <StatCard
          label="Manqués"
          value={missedCount.toString()}
          icon={<Phone className="h-5 w-5 text-red-600" />}
        />

        <StatCard
          label="À rappeler"
          value={recallCount.toString()}
          icon={<RotateCcw className="h-5 w-5 text-amber-600" />}
        />

        <StatCard
          label="Prospects qualifiés"
          value={qualifiedCount.toString()}
          icon={<UserRound className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Historique des appels
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredCalls.length} résultat
              {filteredCalls.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500 md:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="Tous">Tous les statuts</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="recent">Plus récents</option>
              <option value="oldest">Plus anciens</option>
              <option value="duration-desc">
                Durée décroissante
              </option>
              <option value="duration-asc">
                Durée croissante
              </option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Chargement...
            </p>
          ) : filteredCalls.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center">
              <Phone className="mx-auto h-7 w-7 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucun appel
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Les appels de votre Téléphone IA apparaîtront ici.
              </p>
            </div>
          ) : (
            filteredCalls.map((call) => (
              <div
                key={call.id}
                className="rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50/40"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {call.contact_name || "Contact inconnu"}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusStyle(
                          call.status
                        )}`}
                      >
                        {call.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      {call.phone_number && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {call.phone_number}
                        </span>
                      )}

                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(call)}
                      </span>

                      {call.time && (
                        <span className="flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {call.time}
                        </span>
                      )}

                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDuration(call.duration)}
                      </span>
                    </div>

                    {call.identified_need && (
                      <p className="mt-3 text-xs text-slate-600">
                        <strong className="text-slate-800">
                          Besoin identifié :
                        </strong>{" "}
                        {call.identified_need}
                      </p>
                    )}

                    {call.summary && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          <FileText className="h-3.5 w-3.5" />
                          Résumé
                        </p>

                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {call.summary}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                    <select
                      value={call.status}
                      onChange={(event) =>
                        updateStatus(call.id, event.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => deleteCall(call.id)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
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
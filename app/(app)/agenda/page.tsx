"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  UserRound,
  Building2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Client = {
  id: string;
  name: string;
  company: string | null;
};

type Chantier = {
  id: string;
  name: string;
};

type RendezVous = {
  id: string;
  organization_id: string;
  client_id: string | null;
  chantier_id: string | null;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  address: string | null;
  status: string;
  created_by_ai: boolean | null;
  ai_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const weekDays = [
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
];

export default function AgendaPage() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<RendezVous[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return formatDateKey(now);
  });

  useEffect(() => {
    loadAgenda();
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

  async function loadAgenda() {
    setLoading(true);

    const organizationId = await getOrganizationId();

    if (!organizationId) {
      setLoading(false);
      return;
    }

    const [appointmentsResult, clientsResult, chantiersResult] =
      await Promise.all([
        supabase
          .from("rendez_vous")
          .select("*")
          .eq("organization_id", organizationId)
          .order("start_at", { ascending: true }),

        supabase
          .from("clients")
          .select("id, name, company")
          .eq("organization_id", organizationId)
          .order("name", { ascending: true }),

        supabase
          .from("chantiers")
          .select("id, name")
          .eq("organization_id", organizationId)
          .order("name", { ascending: true }),
      ]);

    if (appointmentsResult.error) {
      console.error(
        "Erreur chargement rendez-vous :",
        appointmentsResult.error
      );
    } else {
      setAppointments(
        (appointmentsResult.data || []) as RendezVous[]
      );
    }

    if (clientsResult.error) {
      console.error(
        "Erreur chargement clients :",
        clientsResult.error
      );
    } else {
      setClients((clientsResult.data || []) as Client[]);
    }

    if (chantiersResult.error) {
      console.error(
        "Erreur chargement chantiers :",
        chantiersResult.error
      );
    } else {
      setChantiers((chantiersResult.data || []) as Chantier[]);
    }

    setLoading(false);
  }

  function getClient(clientId: string | null) {
    if (!clientId) return null;

    return clients.find((client) => client.id === clientId);
  }

  function getChantier(chantierId: string | null) {
    if (!chantierId) return null;

    return chantiers.find((chantier) => chantier.id === chantierId);
  }

  function previousMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  }

  function goToday() {
    const now = new Date();

    setCurrentMonth(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );

    setSelectedDate(formatDateKey(now));
  }

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstWeekDay = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const days: {
      date: Date;
      currentMonth: boolean;
      key: string;
    }[] = [];

    for (let index = firstWeekDay - 1; index >= 0; index--) {
      const date = new Date(year, month, -index);

      days.push({
        date,
        currentMonth: false,
        key: formatDateKey(date),
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);

      days.push({
        date,
        currentMonth: true,
        key: formatDateKey(date),
      });
    }

    let nextDay = 1;

    while (days.length < 42) {
      const date = new Date(year, month + 1, nextDay);

      days.push({
        date,
        currentMonth: false,
        key: formatDateKey(date),
      });

      nextDay++;
    }

    return days;
  }, [currentMonth]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, RendezVous[]> = {};

    appointments.forEach((appointment) => {
      const key = formatDateKey(new Date(appointment.start_at));

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(appointment);
    });

    Object.values(map).forEach((items) => {
      items.sort(
        (a, b) =>
          new Date(a.start_at).getTime() -
          new Date(b.start_at).getTime()
      );
    });

    return map;
  }, [appointments]);

  const selectedAppointments =
    appointmentsByDate[selectedDate] || [];

  const monthAppointments = appointments.filter((appointment) => {
    const date = new Date(appointment.start_at);

    return (
      date.getFullYear() === currentMonth.getFullYear() &&
      date.getMonth() === currentMonth.getMonth()
    );
  });

  const confirmedCount = monthAppointments.filter(
    (appointment) => appointment.status === "Confirmé"
  ).length;

  const plannedCount = monthAppointments.filter(
    (appointment) => appointment.status === "Prévu"
  ).length;

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Agenda
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Visualisez vos rendez-vous et votre planning mensuel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Aujourd&apos;hui
          </button>

          <button
            type="button"
            onClick={() => router.push("/rendez-vous")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <CalendarDays className="h-4 w-4" />
            Gérer les rendez-vous
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Rendez-vous ce mois"
          value={monthAppointments.length.toString()}
        />

        <StatCard
          label="Confirmés"
          value={confirmedCount.toString()}
        />

        <StatCard
          label="Prévus"
          value={plannedCount.toString()}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <button
              type="button"
              onClick={previousMonth}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <h2 className="text-sm font-bold capitalize text-slate-900">
              {currentMonth.toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </h2>

            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
            {weekDays.map((day) => (
              <div
                key={day}
                className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex h-[560px] items-center justify-center">
              <p className="text-sm text-slate-500">
                Chargement...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dayAppointments =
                  appointmentsByDate[day.key] || [];

                const isSelected = selectedDate === day.key;
                const isToday =
                  day.key === formatDateKey(new Date());

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDate(day.key)}
                    className={`min-h-28 border-b border-r border-slate-100 p-2 text-left transition hover:bg-slate-50 ${
                      !day.currentMonth
                        ? "bg-slate-50/30"
                        : "bg-white"
                    } ${
                      isSelected
                        ? "ring-2 ring-inset ring-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                          isToday
                            ? "bg-blue-600 text-white"
                            : day.currentMonth
                            ? "text-slate-700"
                            : "text-slate-300"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>

                      {dayAppointments.length > 0 && (
                        <span className="text-[10px] font-semibold text-slate-400">
                          {dayAppointments.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      {dayAppointments.slice(0, 3).map((appointment) => (
                        <div
                          key={appointment.id}
                          className="truncate rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700"
                        >
                          {formatTime(appointment.start_at)} ·{" "}
                          {appointment.title}
                        </div>
                      ))}

                      {dayAppointments.length > 3 && (
                        <p className="px-1 text-[10px] font-medium text-slate-400">
                          + {dayAppointments.length - 3} autre
                          {dayAppointments.length - 3 > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Journée sélectionnée
            </p>

            <h2 className="mt-1 text-base font-bold capitalize text-slate-900">
              {new Date(
                `${selectedDate}T12:00:00`
              ).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {selectedAppointments.length} rendez-vous
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {selectedAppointments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center">
                <CalendarDays className="mx-auto h-7 w-7 text-slate-300" />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Aucun rendez-vous
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Aucun événement n&apos;est prévu pour cette journée.
                </p>
              </div>
            ) : (
              selectedAppointments.map((appointment) => {
                const client = getClient(appointment.client_id);
                const chantier = getChantier(appointment.chantier_id);

                return (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900">
                          {appointment.title}
                        </h3>

                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusStyle(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push("/rendez-vous")}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 space-y-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-3.5 w-3.5" />

                        <span>
                          {formatTime(appointment.start_at)}

                          {appointment.end_at
                            ? ` → ${formatTime(appointment.end_at)}`
                            : ""}
                        </span>
                      </div>

                      {client && (
                        <div className="flex items-center gap-2">
                          <UserRound className="h-3.5 w-3.5" />

                          <span>
                            {client.name}
                            {client.company
                              ? ` · ${client.company}`
                              : ""}
                          </span>
                        </div>
                      )}

                      {chantier && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5" />

                          <span>{chantier.name}</span>
                        </div>
                      )}

                      {appointment.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                          <span>{appointment.address}</span>
                        </div>
                      )}
                    </div>

                    {appointment.description && (
                      <p className="mt-3 text-xs leading-5 text-slate-600">
                        {appointment.description}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusStyle(status: string) {
  if (status === "Confirmé") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "Terminé") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "Annulé") {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
}
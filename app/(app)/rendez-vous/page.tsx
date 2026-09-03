"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  CalendarDays,
  Clock3,
  UserRound,
  Building2,
  MapPin,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  CalendarClock,
  CalendarCheck2,
  CalendarX2,
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
  client_id: string | null;
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

type FormState = {
  title: string;
  client_id: string;
  chantier_id: string;
  date: string;
  time: string;
  duration: string;
  address: string;
  status: string;
  description: string;
};

const statuses = [
  "Prévu",
  "Confirmé",
  "Terminé",
  "Annulé",
];

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  return new Date(now.getTime() - offset * 60 * 1000)
    .toISOString()
    .split("T")[0];
}

function createEmptyForm(): FormState {
  return {
    title: "",
    client_id: "",
    chantier_id: "",
    date: getToday(),
    time: "10:00",
    duration: "60",
    address: "",
    status: "Prévu",
    description: "",
  };
}

export default function RendezVousPage() {
  const searchParams = useSearchParams();

  const [appointments, setAppointments] = useState<RendezVous[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("upcoming");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<RendezVous | null>(null);

  const [form, setForm] = useState<FormState>(
    createEmptyForm()
  );

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    const clientId = searchParams.get("clientId");

    if (!clientId || loading) return;

    setEditingAppointment(null);

    setForm({
      ...createEmptyForm(),
      client_id: clientId,
    });

    setModalOpen(true);
  }, [searchParams, loading]);

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

  async function loadPage() {
    setLoading(true);

    const organizationId = await getOrganizationId();

    if (!organizationId) {
      setLoading(false);
      return;
    }

    const [
      appointmentsResult,
      clientsResult,
      chantiersResult,
    ] = await Promise.all([
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
        .select("id, name, client_id")
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
      setClients(
        (clientsResult.data || []) as Client[]
      );
    }

    if (chantiersResult.error) {
      console.error(
        "Erreur chargement chantiers :",
        chantiersResult.error
      );
    } else {
      setChantiers(
        (chantiersResult.data || []) as Chantier[]
      );
    }

    setLoading(false);
  }

  function getClient(clientId: string | null) {
    if (!clientId) return null;

    return clients.find(
      (client) => client.id === clientId
    );
  }

  function getChantier(chantierId: string | null) {
    if (!chantierId) return null;

    return chantiers.find(
      (chantier) => chantier.id === chantierId
    );
  }

  function openCreateModal() {
    setEditingAppointment(null);
    setForm(createEmptyForm());
    setModalOpen(true);
  }

  function openEditModal(appointment: RendezVous) {
    const start = new Date(appointment.start_at);

    const localStart = new Date(
      start.getTime() -
        start.getTimezoneOffset() * 60 * 1000
    );

    const date = localStart
      .toISOString()
      .split("T")[0];

    const time = localStart
      .toISOString()
      .slice(11, 16);

    let duration = "60";

    if (appointment.end_at) {
      const end = new Date(appointment.end_at);

      const diff =
        (end.getTime() - start.getTime()) /
        60000;

      if (diff > 0) {
        duration = String(Math.round(diff));
      }
    }

    setEditingAppointment(appointment);

    setForm({
      title: appointment.title || "",
      client_id: appointment.client_id || "",
      chantier_id: appointment.chantier_id || "",
      date,
      time,
      duration,
      address: appointment.address || "",
      status: appointment.status || "Prévu",
      description: appointment.description || "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingAppointment(null);
    setForm(createEmptyForm());
  }

  function handleClientChange(clientId: string) {
    const currentChantier = chantiers.find(
      (chantier) =>
        chantier.id === form.chantier_id
    );

    const keepChantier =
      currentChantier &&
      (!clientId ||
        !currentChantier.client_id ||
        currentChantier.client_id === clientId);

    setForm({
      ...form,
      client_id: clientId,
      chantier_id: keepChantier
        ? form.chantier_id
        : "",
    });
  }

  function handleChantierChange(
    chantierId: string
  ) {
    const chantier = chantiers.find(
      (item) => item.id === chantierId
    );

    setForm({
      ...form,
      chantier_id: chantierId,
      client_id:
        chantier?.client_id || form.client_id,
    });
  }

  async function saveAppointment() {
    if (!form.title.trim()) {
      alert(
        "Le titre du rendez-vous est obligatoire."
      );
      return;
    }

    if (!form.date || !form.time) {
      alert(
        "La date et l'heure sont obligatoires."
      );
      return;
    }

    setSaving(true);

    const organizationId =
      await getOrganizationId();

    if (!organizationId) {
      setSaving(false);
      return;
    }

    const startAt = new Date(
      `${form.date}T${form.time}:00`
    );

    const durationMinutes =
      Number(form.duration) || 60;

    const endAt = new Date(
      startAt.getTime() +
        durationMinutes * 60 * 1000
    );

    const payload = {
      organization_id: organizationId,
      client_id: form.client_id || null,
      chantier_id: form.chantier_id || null,
      title: form.title.trim(),
      description:
        form.description.trim() || null,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      address: form.address.trim() || null,
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    if (editingAppointment) {
      const { error } = await supabase
        .from("rendez_vous")
        .update(payload)
        .eq("id", editingAppointment.id);

      if (error) {
        console.error(error);
        alert(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("rendez_vous")
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
    await loadPage();
  }

  async function updateStatus(
    id: string,
    status: string
  ) {
    const { error } = await supabase
      .from("rendez_vous")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadPage();
  }

  async function deleteAppointment(id: string) {
    const confirmed = window.confirm(
      "Supprimer définitivement ce rendez-vous ?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("rendez_vous")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadPage();
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "fr-FR",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
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

  const filteredAppointments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    const result = appointments.filter(
      (appointment) => {
        const client = getClient(
          appointment.client_id
        );

        const chantier = getChantier(
          appointment.chantier_id
        );

        const matchesSearch =
          !query ||
          appointment.title
            .toLowerCase()
            .includes(query) ||
          appointment.description
            ?.toLowerCase()
            .includes(query) ||
          appointment.address
            ?.toLowerCase()
            .includes(query) ||
          client?.name
            .toLowerCase()
            .includes(query) ||
          client?.company
            ?.toLowerCase()
            .includes(query) ||
          chantier?.name
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === "Tous" ||
          appointment.status === statusFilter;

        return (
          matchesSearch && matchesStatus
        );
      }
    );

    return [...result].sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.start_at).getTime() -
          new Date(b.start_at).getTime()
        );
      }

      if (sortBy === "recent") {
        return (
          new Date(b.start_at).getTime() -
          new Date(a.start_at).getTime()
        );
      }

      const now = Date.now();

      const aTime =
        new Date(a.start_at).getTime();

      const bTime =
        new Date(b.start_at).getTime();

      const aFuture = aTime >= now;
      const bFuture = bTime >= now;

      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;

      return aTime - bTime;
    });
  }, [
    appointments,
    clients,
    chantiers,
    search,
    statusFilter,
    sortBy,
  ]);

  const now = Date.now();

  const upcomingCount = appointments.filter(
    (appointment) =>
      new Date(
        appointment.start_at
      ).getTime() >= now &&
      appointment.status !== "Annulé"
  ).length;

  const confirmedCount = appointments.filter(
    (appointment) =>
      appointment.status === "Confirmé"
  ).length;

  const completedCount = appointments.filter(
    (appointment) =>
      appointment.status === "Terminé"
  ).length;

  const cancelledCount = appointments.filter(
    (appointment) =>
      appointment.status === "Annulé"
  ).length;

  const availableChantiers = form.client_id
    ? chantiers.filter(
        (chantier) =>
          !chantier.client_id ||
          chantier.client_id ===
            form.client_id
      )
    : chantiers;

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Rendez-vous
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Planifiez et suivez tous vos
            rendez-vous clients et chantiers.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nouveau rendez-vous
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="À venir"
          value={upcomingCount.toString()}
          icon={
            <CalendarClock className="h-5 w-5 text-blue-600" />
          }
        />

        <StatCard
          label="Confirmés"
          value={confirmedCount.toString()}
          icon={
            <CalendarCheck2 className="h-5 w-5 text-emerald-600" />
          }
        />

        <StatCard
          label="Terminés"
          value={completedCount.toString()}
          icon={
            <CheckCircle2 className="h-5 w-5 text-violet-600" />
          }
        />

        <StatCard
          label="Annulés"
          value={cancelledCount.toString()}
          icon={
            <CalendarX2 className="h-5 w-5 text-red-600" />
          }
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Planning
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredAppointments.length} rendez-vous
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500 md:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="Tous">
                Tous les statuts
              </option>

              {statuses.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="upcoming">
                Prochains rendez-vous
              </option>

              <option value="recent">
                Plus récents
              </option>

              <option value="oldest">
                Plus anciens
              </option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Chargement...
            </p>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-12 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucun rendez-vous
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Planifiez votre premier rendez-vous.
              </p>
            </div>
          ) : (
            filteredAppointments.map(
              (appointment) => {
                const client = getClient(
                  appointment.client_id
                );

                const chantier = getChantier(
                  appointment.chantier_id
                );

                return (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50/40"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {appointment.title}
                          </h3>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusStyle(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />

                            {formatDate(
                              appointment.start_at
                            )}
                          </span>

                          <span className="flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" />

                            {formatTime(
                              appointment.start_at
                            )}

                            {appointment.end_at
                              ? ` → ${formatTime(
                                  appointment.end_at
                                )}`
                              : ""}
                          </span>

                          {client && (
                            <span className="flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5" />

                              {client.name}
                              {client.company
                                ? ` · ${client.company}`
                                : ""}
                            </span>
                          )}

                          {chantier && (
                            <span className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5" />

                              {chantier.name}
                            </span>
                          )}

                          {appointment.address && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />

                              {appointment.address}
                            </span>
                          )}
                        </div>

                        {appointment.description && (
                          <p className="mt-3 max-w-3xl text-xs leading-5 text-slate-600">
                            {appointment.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                        <select
                          value={appointment.status}
                          onChange={(event) =>
                            updateStatus(
                              appointment.id,
                              event.target.value
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                        >
                          {statuses.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              appointment
                            )
                          }
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteAppointment(
                              appointment.id
                            )
                          }
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingAppointment
                    ? "Modifier le rendez-vous"
                    : "Nouveau rendez-vous"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Planifiez une visite, un appel ou une réunion.
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

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Titre *">
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        title:
                          event.target.value,
                      })
                    }
                    className="input"
                    placeholder="Visite chantier"
                  />
                </Field>
              </div>

              <Field label="Client">
                <select
                  value={form.client_id}
                  onChange={(event) =>
                    handleClientChange(
                      event.target.value
                    )
                  }
                  className="input"
                >
                  <option value="">
                    Aucun client
                  </option>

                  {clients.map(
                    (client) => (
                      <option
                        key={client.id}
                        value={client.id}
                      >
                        {client.name}
                        {client.company
                          ? ` — ${client.company}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Chantier">
                <select
                  value={form.chantier_id}
                  onChange={(event) =>
                    handleChantierChange(
                      event.target.value
                    )
                  }
                  className="input"
                >
                  <option value="">
                    Aucun chantier
                  </option>

                  {availableChantiers.map(
                    (chantier) => (
                      <option
                        key={chantier.id}
                        value={chantier.id}
                      >
                        {chantier.name}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Date *">
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      date:
                        event.target.value,
                    })
                  }
                  className="input"
                />
              </Field>

              <Field label="Heure *">
                <input
                  type="time"
                  value={form.time}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      time:
                        event.target.value,
                    })
                  }
                  className="input"
                />
              </Field>

              <Field label="Durée">
                <select
                  value={form.duration}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      duration:
                        event.target.value,
                    })
                  }
                  className="input"
                >
                  <option value="15">
                    15 minutes
                  </option>

                  <option value="30">
                    30 minutes
                  </option>

                  <option value="45">
                    45 minutes
                  </option>

                  <option value="60">
                    1 heure
                  </option>

                  <option value="90">
                    1 h 30
                  </option>

                  <option value="120">
                    2 heures
                  </option>
                </select>
              </Field>

              <Field label="Statut">
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status:
                        event.target.value,
                    })
                  }
                  className="input"
                >
                  {statuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Adresse">
                  <input
                    value={form.address}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        address:
                          event.target.value,
                      })
                    }
                    className="input"
                    placeholder="12 rue du chantier, Paris"
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description:
                          event.target.value,
                      })
                    }
                    className="input min-h-28 resize-none"
                    placeholder="Informations importantes pour le rendez-vous..."
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={saveAppointment}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : editingAppointment
                  ? "Enregistrer"
                  : "Créer le rendez-vous"}
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
          padding: 0.65rem 0.75rem;
          font-size: 0.75rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .input:focus {
          border-color: rgb(59 130 246);
        }
      `}</style>
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
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  BellRing,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  UserRound,
  FileText,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Video,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Client = {
  id: string;
  name: string;
  company: string | null;
};

type Devis = {
  id: string;
  number: string;
  project: string;
  client_id: string | null;
};

type Relance = {
  id: string;
  organization_id: string;
  client_id: string | null;
  devis_id: string | null;
  title: string;
  description: string | null;
  channel: string;
  scheduled_at: string;
  status: string;
  result: string | null;
  created_by_ai: boolean | null;
  ai_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type FormState = {
  title: string;
  client_id: string;
  devis_id: string;
  channel: string;
  date: string;
  time: string;
  status: string;
  description: string;
};

const channels = [
  "Appel téléphonique",
  "Email",
  "Rendez-vous",
  "SMS",
  "Autre",
];

const statuses = ["À faire", "En cours", "Terminée", "Annulée"];

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

function createEmptyForm(): FormState {
  return {
    title: "",
    client_id: "",
    devis_id: "",
    channel: "Appel téléphonique",
    date: getToday(),
    time: "10:00",
    status: "À faire",
    description: "",
  };
}

export default function RelancesPage() {
  const [relances, setRelances] = useState<Relance[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [channelFilter, setChannelFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("date-asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRelance, setEditingRelance] = useState<Relance | null>(null);

  const [form, setForm] = useState<FormState>(createEmptyForm());

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

    const [relancesResult, clientsResult, devisResult] = await Promise.all([
      supabase
        .from("relances")
        .select("*")
        .eq("organization_id", organizationId)
        .order("scheduled_at", { ascending: true }),

      supabase
        .from("clients")
        .select("id, name, company")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true }),

      supabase
        .from("devis")
        .select("id, number, project, client_id")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
    ]);

    if (relancesResult.error) {
      console.error("Erreur chargement relances :", relancesResult.error);
    } else {
      setRelances((relancesResult.data || []) as Relance[]);
    }

    if (clientsResult.error) {
      console.error("Erreur chargement clients :", clientsResult.error);
    } else {
      setClients((clientsResult.data || []) as Client[]);
    }

    if (devisResult.error) {
      console.error("Erreur chargement devis :", devisResult.error);
    } else {
      setDevis((devisResult.data || []) as Devis[]);
    }

    setLoading(false);
  }

  function getClient(clientId: string | null) {
    if (!clientId) return null;
    return clients.find((client) => client.id === clientId);
  }

  function getDevis(devisId: string | null) {
    if (!devisId) return null;
    return devis.find((item) => item.id === devisId);
  }

  function openCreateModal() {
    setEditingRelance(null);
    setForm(createEmptyForm());
    setModalOpen(true);
  }

  function openEditModal(relance: Relance) {
    const date = new Date(relance.scheduled_at);

    const local = new Date(
      date.getTime() - date.getTimezoneOffset() * 60 * 1000
    );

    const dateValue = local.toISOString().split("T")[0];
    const timeValue = local.toISOString().slice(11, 16);

    setEditingRelance(relance);

    setForm({
      title: relance.title || "",
      client_id: relance.client_id || "",
      devis_id: relance.devis_id || "",
      channel: relance.channel || "Appel téléphonique",
      date: dateValue,
      time: timeValue,
      status: relance.status || "À faire",
      description: relance.description || "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingRelance(null);
    setForm(createEmptyForm());
  }

  function handleClientChange(clientId: string) {
    const currentDevis = devis.find((item) => item.id === form.devis_id);

    const keepCurrentDevis =
      currentDevis &&
      (!clientId ||
        !currentDevis.client_id ||
        currentDevis.client_id === clientId);

    setForm({
      ...form,
      client_id: clientId,
      devis_id: keepCurrentDevis ? form.devis_id : "",
    });
  }

  function handleDevisChange(devisId: string) {
    const selectedDevis = devis.find((item) => item.id === devisId);

    setForm({
      ...form,
      devis_id: devisId,
      client_id: selectedDevis?.client_id || form.client_id,
    });
  }

  async function saveRelance() {
    if (!form.title.trim()) {
      alert("Le titre de la relance est obligatoire.");
      return;
    }

    if (!form.date) {
      alert("La date de la relance est obligatoire.");
      return;
    }

    setSaving(true);

    const organizationId = await getOrganizationId();

    if (!organizationId) {
      setSaving(false);
      return;
    }

    const scheduledAt = new Date(
      `${form.date}T${form.time || "09:00"}:00`
    ).toISOString();

    const payload = {
      organization_id: organizationId,
      client_id: form.client_id || null,
      devis_id: form.devis_id || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      channel: form.channel,
      scheduled_at: scheduledAt,
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    if (editingRelance) {
      const { error } = await supabase
        .from("relances")
        .update(payload)
        .eq("id", editingRelance.id);

      if (error) {
        console.error(error);
        alert(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("relances").insert(payload);

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

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("relances")
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

  async function deleteRelance(id: string) {
    const confirmed = window.confirm(
      "Supprimer définitivement cette relance ?"
    );

    if (!confirmed) return;

    const { error } = await supabase.from("relances").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadPage();
  }

  function isLate(relance: Relance) {
    if (relance.status === "Terminée" || relance.status === "Annulée") {
      return false;
    }

    return new Date(relance.scheduled_at).getTime() < Date.now();
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusStyle(status: string) {
    if (status === "Terminée") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "En cours") {
      return "bg-blue-50 text-blue-700";
    }

    if (status === "Annulée") {
      return "bg-slate-100 text-slate-500";
    }

    return "bg-amber-50 text-amber-700";
  }

  function getChannelIcon(channel: string) {
    if (channel === "Email") {
      return <Mail className="h-4 w-4 text-slate-500" />;
    }

    if (channel === "SMS") {
      return <MessageSquare className="h-4 w-4 text-slate-500" />;
    }

    if (channel === "Rendez-vous") {
      return <Video className="h-4 w-4 text-slate-500" />;
    }

    return <Phone className="h-4 w-4 text-slate-500" />;
  }

  const filteredRelances = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = relances.filter((relance) => {
      const client = getClient(relance.client_id);
      const quote = getDevis(relance.devis_id);

      const matchesSearch =
        !query ||
        relance.title.toLowerCase().includes(query) ||
        relance.description?.toLowerCase().includes(query) ||
        client?.name.toLowerCase().includes(query) ||
        client?.company?.toLowerCase().includes(query) ||
        quote?.number.toLowerCase().includes(query) ||
        quote?.project.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "Tous" || relance.status === statusFilter;

      const matchesChannel =
        channelFilter === "Tous" || relance.channel === channelFilter;

      return matchesSearch && matchesStatus && matchesChannel;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "date-desc") {
        return (
          new Date(b.scheduled_at).getTime() -
          new Date(a.scheduled_at).getTime()
        );
      }

      if (sortBy === "recent") {
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime()
        );
      }

      return (
        new Date(a.scheduled_at).getTime() -
        new Date(b.scheduled_at).getTime()
      );
    });
  }, [
    relances,
    clients,
    devis,
    search,
    statusFilter,
    channelFilter,
    sortBy,
  ]);

  const totalRelances = relances.length;

  const todoCount = relances.filter(
    (relance) => relance.status === "À faire"
  ).length;

  const lateCount = relances.filter(isLate).length;

  const completedCount = relances.filter(
    (relance) => relance.status === "Terminée"
  ).length;

  const availableDevis = form.client_id
    ? devis.filter(
        (item) => !item.client_id || item.client_id === form.client_id
      )
    : devis;

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Relances
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Centralisez vos relances clients et ne laissez plus passer une
            opportunité.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle relance
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total relances"
          value={totalRelances.toString()}
          icon={<BellRing className="h-5 w-5 text-blue-600" />}
        />

        <StatCard
          label="À faire"
          value={todoCount.toString()}
          icon={<Clock3 className="h-5 w-5 text-amber-600" />}
        />

        <StatCard
          label="En retard"
          value={lateCount.toString()}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
        />

        <StatCard
          label="Terminées"
          value={completedCount.toString()}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Suivi des relances
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredRelances.length} relance
              {filteredRelances.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500 md:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
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
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="Tous">Tous les canaux</option>

              {channels.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="date-asc">Échéance proche</option>
              <option value="date-desc">Échéance lointaine</option>
              <option value="recent">Plus récentes</option>
              <option value="oldest">Plus anciennes</option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Chargement...
            </p>
          ) : filteredRelances.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-12 text-center">
              <BellRing className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucune relance
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Créez votre première relance pour commencer votre suivi.
              </p>
            </div>
          ) : (
            filteredRelances.map((relance) => {
              const client = getClient(relance.client_id);
              const quote = getDevis(relance.devis_id);
              const late = isLate(relance);

              return (
                <div
                  key={relance.id}
                  className={`rounded-xl border p-4 transition hover:bg-slate-50/50 ${
                    late
                      ? "border-red-100 bg-red-50/20"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
                          {getChannelIcon(relance.channel)}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900">
                          {relance.title}
                        </h3>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusStyle(
                            relance.status
                          )}`}
                        >
                          {relance.status}
                        </span>

                        {late && (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700">
                            En retard
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />

                          {formatDate(relance.scheduled_at)} à{" "}
                          {formatTime(relance.scheduled_at)}
                        </span>

                        <span>{relance.channel}</span>

                        {client && (
                          <span className="flex items-center gap-1.5">
                            <UserRound className="h-3.5 w-3.5" />

                            {client.name}
                            {client.company ? ` · ${client.company}` : ""}
                          </span>
                        )}

                        {quote && (
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />

                            {quote.number} · {quote.project}
                          </span>
                        )}
                      </div>

                      {relance.description && (
                        <p className="mt-3 max-w-3xl text-xs leading-5 text-slate-600">
                          {relance.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                      <select
                        value={relance.status}
                        onChange={(event) =>
                          updateStatus(relance.id, event.target.value)
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
                        onClick={() => openEditModal(relance)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteRelance(relance.id)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingRelance ? "Modifier la relance" : "Nouvelle relance"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Planifiez une action commerciale liée à un client ou à un
                  devis.
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
                        title: event.target.value,
                      })
                    }
                    className="input"
                    placeholder="Relancer pour le devis cuisine"
                  />
                </Field>
              </div>

              <Field label="Client">
                <select
                  value={form.client_id}
                  onChange={(event) => handleClientChange(event.target.value)}
                  className="input"
                >
                  <option value="">Aucun client</option>

                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                      {client.company ? ` — ${client.company}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Devis">
                <select
                  value={form.devis_id}
                  onChange={(event) => handleDevisChange(event.target.value)}
                  className="input"
                >
                  <option value="">Aucun devis</option>

                  {availableDevis.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.number} — {item.project}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Canal">
                <select
                  value={form.channel}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      channel: event.target.value,
                    })
                  }
                  className="input"
                >
                  {channels.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Statut">
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value,
                    })
                  }
                  className="input"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Date *">
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      date: event.target.value,
                    })
                  }
                  className="input"
                />
              </Field>

              <Field label="Heure">
                <input
                  type="time"
                  value={form.time}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      time: event.target.value,
                    })
                  }
                  className="input"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                    className="input min-h-28 resize-none"
                    placeholder="Informations importantes pour la relance..."
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
                onClick={saveRelance}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : editingRelance
                  ? "Enregistrer"
                  : "Créer la relance"}
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
          <p className="text-xs font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5">{icon}</div>
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
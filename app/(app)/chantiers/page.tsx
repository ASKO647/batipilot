"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Euro,
  Loader2,
  MapPin,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type ChantierStatus =
  | "À venir"
  | "En cours"
  | "En attente"
  | "Terminé"
  | "Annulé";

type ChantierRow = {
  id: string;
  organization_id: string;
  client_id: string | null;
  devis_id: string | null;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  status: ChantierStatus;
  progress: number;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  ai_summary: string | null;
  ai_generated: boolean | null;
  created_at: string;
  updated_at: string | null;
};

type ClientRow = {
  id: string;
  name: string;
  company: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
};

type ChantierForm = {
  clientId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  budget: string;
  startDate: string;
  endDate: string;
  status: ChantierStatus;
};

const emptyForm: ChantierForm = {
  clientId: "",
  name: "",
  description: "",
  address: "",
  city: "",
  postalCode: "",
  budget: "",
  startDate: "",
  endDate: "",
  status: "À venir",
};

export default function ChantiersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientIdFromUrl = searchParams.get("clientId");

  const [organizationId, setOrganizationId] = useState("");

  const [chantiers, setChantiers] = useState<ChantierRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("recent");

  const [form, setForm] = useState<ChantierForm>(emptyForm);

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (!clientIdFromUrl || clients.length === 0) {
      return;
    }

    const selectedClient = clients.find(
      (client) => client.id === clientIdFromUrl
    );

    if (!selectedClient) return;

    openCreateModal(selectedClient.id);
  }, [clientIdFromUrl, clients]);

  async function loadPage() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Utilisateur introuvable :", userError);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile?.organization_id
    ) {
      console.error("Erreur profil :", profileError);
      setLoading(false);
      return;
    }

    const currentOrganizationId =
      profile.organization_id;

    setOrganizationId(currentOrganizationId);

    const [
      { data: chantierData, error: chantierError },
      { data: clientData, error: clientError },
    ] = await Promise.all([
      supabase
        .from("chantiers")
        .select("*")
        .eq("organization_id", currentOrganizationId)
        .order("created_at", { ascending: false }),

      supabase
        .from("clients")
        .select(
          "id, name, company, address, city, postal_code"
        )
        .eq("organization_id", currentOrganizationId)
        .order("name", { ascending: true }),
    ]);

    if (chantierError) {
      console.error(
        "Erreur chargement chantiers :",
        chantierError
      );
    }

    if (clientError) {
      console.error(
        "Erreur chargement clients :",
        clientError
      );
    }

    setChantiers(
      (chantierData || []) as ChantierRow[]
    );

    setClients((clientData || []) as ClientRow[]);

    setLoading(false);
  }

  function getClient(chantier: ChantierRow) {
    if (!chantier.client_id) {
      return null;
    }

    return (
      clients.find(
        (client) => client.id === chantier.client_id
      ) || null
    );
  }

  function getClientLabel(chantier: ChantierRow) {
    const client = getClient(chantier);

    if (!client) {
      return "Client non renseigné";
    }

    if (client.company) {
      return `${client.name} — ${client.company}`;
    }

    return client.name;
  }

  function openCreateModal(
    selectedClientId?: string
  ) {
    const client = selectedClientId
      ? clients.find(
          (item) => item.id === selectedClientId
        )
      : undefined;

    setForm({
      ...emptyForm,
      clientId: selectedClientId || "",
      address: client?.address || "",
      city: client?.city || "",
      postalCode: client?.postal_code || "",
    });

    setCreateOpen(true);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setForm(emptyForm);

    if (clientIdFromUrl) {
      router.replace("/chantiers");
    }
  }

  function selectClient(value: string) {
    const selectedClient = clients.find(
      (client) => client.id === value
    );

    setForm((current) => ({
      ...current,
      clientId: value,
      address: selectedClient?.address || "",
      city: selectedClient?.city || "",
      postalCode: selectedClient?.postal_code || "",
    }));
  }

  async function createChantier() {
    if (!organizationId) {
      alert("Organisation introuvable.");
      return;
    }

    if (!form.clientId) {
      alert("Sélectionne un client.");
      return;
    }

    if (!form.name.trim()) {
      alert("Ajoute un nom de chantier.");
      return;
    }

    if (
      form.startDate &&
      form.endDate &&
      form.endDate < form.startDate
    ) {
      alert(
        "La date de fin ne peut pas être avant la date de début."
      );
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("chantiers")
      .insert({
        organization_id: organizationId,
        client_id: form.clientId,
        devis_id: null,

        name: form.name.trim(),

        description:
          form.description.trim() || null,

        address:
          form.address.trim() || null,

        city:
          form.city.trim() || null,

        postal_code:
          form.postalCode.trim() || null,

        status: form.status,

        progress:
          form.status === "Terminé" ? 100 : 0,

        budget: form.budget
          ? Number(form.budget)
          : 0,

        start_date:
          form.startDate || null,

        end_date:
          form.endDate || null,

        ai_summary: null,
        ai_generated: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error(
        "Erreur création chantier :",
        error
      );

      alert(error.message);
      setSaving(false);
      return;
    }

    await loadPage();

    setSaving(false);
    setCreateOpen(false);
    setForm(emptyForm);

    if (clientIdFromUrl) {
      router.replace("/chantiers");
    }

    if (data?.id) {
      router.push(`/chantiers/${data.id}`);
    }
  }

const filteredChantiers = useMemo(() => {
  const result = chantiers.filter((chantier) => {
    const query = search.trim().toLowerCase();

    const client = getClient(chantier);

    const matchesSearch =
      !query ||
      chantier.name.toLowerCase().includes(query) ||
      chantier.address?.toLowerCase().includes(query) ||
      chantier.city?.toLowerCase().includes(query) ||
      client?.name.toLowerCase().includes(query) ||
      client?.company?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "Tous" ||
      chantier.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return [...result].sort((a, b) => {
    if (sortBy === "oldest") {
      return (
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
      );
    }

    if (sortBy === "budget-desc") {
      return Number(b.budget || 0) - Number(a.budget || 0);
    }

    if (sortBy === "budget-asc") {
      return Number(a.budget || 0) - Number(b.budget || 0);
    }

    if (sortBy === "progress-desc") {
      return Number(b.progress || 0) - Number(a.progress || 0);
    }

    if (sortBy === "progress-asc") {
      return Number(a.progress || 0) - Number(b.progress || 0);
    }

    if (sortBy === "start-asc") {
      if (!a.start_date && !b.start_date) return 0;
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;

      return (
        new Date(a.start_date).getTime() -
        new Date(b.start_date).getTime()
      );
    }

    if (sortBy === "start-desc") {
      if (!a.start_date && !b.start_date) return 0;
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;

      return (
        new Date(b.start_date).getTime() -
        new Date(a.start_date).getTime()
      );
    }

    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  });
}, [
  chantiers,
  clients,
  search,
  statusFilter,
  sortBy,
]);

  const activeCount = chantiers.filter(
    (chantier) => chantier.status === "En cours"
  ).length;

  const upcomingCount = chantiers.filter(
    (chantier) => chantier.status === "À venir"
  ).length;

  const finishedCount = chantiers.filter(
    (chantier) => chantier.status === "Terminé"
  ).length;

  const totalBudget = chantiers.reduce(
    (total, chantier) =>
      total + Number(chantier.budget || 0),
    0
  );

  function formatMoney(value: number | null) {
    return Number(value || 0).toLocaleString(
      "fr-FR",
      {
        style: "currency",
        currency: "EUR",
      }
    );
  }

  function formatDate(value: string | null) {
    if (!value) return null;

    return new Date(
      `${value}T12:00:00`
    ).toLocaleDateString("fr-FR");
  }

  return (
    <>
      <div className="w-full px-7 py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Chantiers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Créez, consultez et suivez tous vos
              chantiers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={15} />
            Nouveau chantier
          </button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Building2}
            label="Total"
            value={String(chantiers.length)}
          />

          <StatCard
            icon={Building2}
            label="En cours"
            value={String(activeCount)}
          />

          <StatCard
            icon={CalendarDays}
            label="À venir"
            value={String(upcomingCount)}
          />

          <StatCard
            icon={Euro}
            label="Budget total"
            value={formatMoney(totalBudget)}
          />
        </div>

        <section className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tous les chantiers
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {chantiers.length} chantier
                {chantiers.length !== 1 ? "s" : ""}{" "}
                enregistré
                {chantiers.length !== 1 ? "s" : ""}
                {finishedCount > 0
                  ? ` • ${finishedCount} terminé${
                      finishedCount !== 1 ? "s" : ""
                    }`
                  : ""}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Rechercher par chantier, client, entreprise ou ville..."
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
              >
                <option value="Tous">
                  Tous les statuts
                </option>

                <option value="À venir">
                  À venir
                </option>

                <option value="En cours">
                  En cours
                </option>

                <option value="En attente">
                  En attente
                </option>

                <option value="Terminé">
                  Terminé
                </option>

                <option value="Annulé">
                  Annulé
                </option>
              </select>
              <select
  value={sortBy}
  onChange={(event) =>
    setSortBy(event.target.value)
  }
  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
>
  <option value="recent">
    Plus récents
  </option>

  <option value="oldest">
    Plus anciens
  </option>

  <option value="budget-desc">
    Budget décroissant
  </option>

  <option value="budget-asc">
    Budget croissant
  </option>

  <option value="progress-desc">
    Progression décroissante
  </option>

  <option value="progress-asc">
    Progression croissante
  </option>

  <option value="start-asc">
    Date de début proche
  </option>

  <option value="start-desc">
    Date de début lointaine
  </option>
</select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2
                size={18}
                className="animate-spin"
              />

              Chargement des chantiers...
            </div>
          ) : filteredChantiers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Building2
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 text-sm font-semibold text-slate-700">
                Aucun chantier trouvé
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Créez votre premier chantier ou
                modifiez vos filtres.
              </p>

              {chantiers.length === 0 && (
                <button
                  type="button"
                  onClick={() => openCreateModal()}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white"
                >
                  <Plus size={14} />
                  Créer un chantier
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredChantiers.map((chantier) => {
                const client = getClient(chantier);

                return (
                  <button
                    key={chantier.id}
                    type="button"
                    onClick={() =>
                      router.push(
                        `/chantiers/${chantier.id}`
                      )
                    }
                    className="block w-full px-5 py-5 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">
                            {chantier.name}
                          </p>

                          <StatusBadge
                            status={chantier.status}
                          />
                        </div>

                        {/* CLIENT ASSOCIÉ */}

                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">
                            <UserRound
                              size={13}
                              className="text-blue-600"
                            />
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-700">
                              {getClientLabel(chantier)}
                            </p>

                            {client && (
                              <p className="text-[10px] text-slate-400">
                                Client associé
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={13} />

                            {[
                              chantier.address,
                              chantier.postal_code,
                              chantier.city,
                            ]
                              .filter(Boolean)
                              .join(", ") ||
                              "Adresse non renseignée"}
                          </span>

                          {chantier.start_date && (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={13} />

                              Début :{" "}
                              {formatDate(
                                chantier.start_date
                              )}
                            </span>
                          )}

                          {chantier.end_date && (
                            <span>
                              Fin :{" "}
                              {formatDate(
                                chantier.end_date
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 sm:min-w-[150px] sm:text-right">
                        <p className="text-sm font-bold text-slate-800">
                          {formatMoney(chantier.budget)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {chantier.progress}% terminé
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#2563EB] transition-all"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              chantier.progress || 0,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {createOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 px-4 py-8 backdrop-blur-[1px]"
          onMouseDown={closeCreateModal}
        >
          <div
            className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Nouveau chantier
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Renseignez les informations
                  principales du chantier.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Client *
                </label>

                <select
                  value={form.clientId}
                  onChange={(event) =>
                    selectClient(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="">
                    Sélectionner un client
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.name}
                      {client.company
                        ? ` — ${client.company}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Nom du chantier *"
                value={form.name}
                placeholder="Ex : Rénovation appartement Dijon"
                onChange={(value) =>
                  setForm({
                    ...form,
                    name: value,
                  })
                }
              />

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Décris les travaux à réaliser..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <Input
                label="Adresse"
                value={form.address}
                placeholder="Ex : 10 rue Victor Hugo"
                onChange={(value) =>
                  setForm({
                    ...form,
                    address: value,
                  })
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Ville"
                  value={form.city}
                  placeholder="Ex : Dijon"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      city: value,
                    })
                  }
                />

                <Input
                  label="Code postal"
                  value={form.postalCode}
                  placeholder="Ex : 21000"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      postalCode: value,
                    })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Budget
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.budget}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        budget: event.target.value,
                      })
                    }
                    placeholder="Ex : 15000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Statut
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status:
                          event.target
                            .value as ChantierStatus,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="À venir">
                      À venir
                    </option>

                    <option value="En cours">
                      En cours
                    </option>

                    <option value="En attente">
                      En attente
                    </option>

                    <option value="Terminé">
                      Terminé
                    </option>

                    <option value="Annulé">
                      Annulé
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Date de début
                  </label>

                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        startDate: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Date de fin prévue
                  </label>

                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        endDate: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={saving}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={createChantier}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Créer le chantier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Input({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>

        <Icon
          size={16}
          className="text-slate-400"
        />
      </div>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: ChantierStatus;
}) {
  const style =
    status === "En cours"
      ? "bg-blue-50 text-blue-700"
      : status === "Terminé"
      ? "bg-emerald-50 text-emerald-700"
      : status === "En attente"
      ? "bg-amber-50 text-amber-700"
      : status === "Annulé"
      ? "bg-red-50 text-red-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${style}`}
    >
      {status}
    </span>
  );
}
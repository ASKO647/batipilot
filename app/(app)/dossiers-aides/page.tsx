"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  X,
  FileText,
  Euro,
  Clock3,
  CircleCheck,
  UserRound,
  Building2,
  Pencil,
  Trash2,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type ClientRow = {
  id: string;
  name: string;
  company: string | null;
};

type ChantierRow = {
  id: string;
  name: string;
};

type DossierAideRow = {
  id: string;
  organization_id: string;
  client_id: string | null;
  chantier_id: string | null;
  title: string;
  type: string;
  status: string;
  amount: number | null;
  description: string | null;
  required_documents: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

const types = [
  "MaPrimeRénov’",
  "CEE",
  "Éco-PTZ",
  "TVA réduite",
  "Aides locales",
  "Autre",
];

const statuses = [
  "À préparer",
  "En cours",
  "Documents manquants",
  "Envoyé",
  "Validé",
  "Refusé",
];

export default function DossiersAidesPage() {
  const [items, setItems] = useState<DossierAideRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [chantiers, setChantiers] = useState<ChantierRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("recent");

  const [form, setForm] = useState({
    clientId: "",
    chantierId: "",
    title: "",
    type: "MaPrimeRénov’",
    status: "À préparer",
    amount: "",
    description: "",
    requiredDocuments: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
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

  async function loadData() {
    setLoading(true);

    const organizationId = await getOrganizationId();

    if (!organizationId) {
      setLoading(false);
      return;
    }

    const [
      dossiersResponse,
      clientsResponse,
      chantiersResponse,
    ] = await Promise.all([
      supabase
        .from("dossiers_aides")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),

      supabase
        .from("clients")
        .select("id,name,company")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true }),

      supabase
        .from("chantiers")
        .select("id,name")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true }),
    ]);

    if (dossiersResponse.error) {
      console.error(
        "Erreur chargement dossiers :",
        dossiersResponse.error
      );
    }

    if (clientsResponse.error) {
      console.error(
        "Erreur chargement clients :",
        clientsResponse.error
      );
    }

    if (chantiersResponse.error) {
      console.error(
        "Erreur chargement chantiers :",
        chantiersResponse.error
      );
    }

    setItems(
      (dossiersResponse.data || []) as DossierAideRow[]
    );

    setClients(
      (clientsResponse.data || []) as ClientRow[]
    );

    setChantiers(
      (chantiersResponse.data || []) as ChantierRow[]
    );

    setLoading(false);
  }

  function resetForm() {
    setForm({
      clientId: "",
      chantierId: "",
      title: "",
      type: "MaPrimeRénov’",
      status: "À préparer",
      amount: "",
      description: "",
      requiredDocuments: "",
      notes: "",
    });

    setEditingId(null);
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(item: DossierAideRow) {
    setEditingId(item.id);

    setForm({
      clientId: item.client_id || "",
      chantierId: item.chantier_id || "",
      title: item.title || "",
      type: item.type || "MaPrimeRénov’",
      status: item.status || "À préparer",
      amount:
        item.amount !== null
          ? item.amount.toString()
          : "",
      description: item.description || "",
      requiredDocuments:
        item.required_documents?.join(", ") || "",
      notes: item.notes || "",
    });

    setModalOpen(true);
  }

  async function saveDossier() {
    if (!form.title.trim()) {
      alert("Ajoute un titre.");
      return;
    }

    if (!form.clientId) {
      alert("Choisis un client.");
      return;
    }

    setSaving(true);

    try {
      const organizationId = await getOrganizationId();

      if (!organizationId) {
        alert("Organisation introuvable.");
        return;
      }

      const documents = form.requiredDocuments
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        organization_id: organizationId,
        client_id: form.clientId || null,
        chantier_id: form.chantierId || null,
        title: form.title.trim(),
        type: form.type,
        status: form.status,
        amount: form.amount
          ? Number(form.amount)
          : null,
        description: form.description.trim() || null,
        required_documents:
          documents.length > 0 ? documents : null,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from("dossiers_aides")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          console.error(error);
          alert(error.message);
          return;
        }

        alert("Dossier d'aide modifié.");
      } else {
        const { error } = await supabase
          .from("dossiers_aides")
          .insert(payload);

        if (error) {
          console.error(error);
          alert(error.message);
          return;
        }

        alert("Dossier d'aide créé.");
      }

      setModalOpen(false);
      resetForm();

      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    id: string,
    status: string
  ) {
    const { error } = await supabase
      .from("dossiers_aides")
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

    await loadData();
  }

  async function deleteDossier(id: string) {
    const confirmed = window.confirm(
      "Supprimer définitivement ce dossier d'aide ?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("dossiers_aides")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadData();
  }

  function getClientName(clientId: string | null) {
    if (!clientId) return "Aucun client";

    const client = clients.find(
      (item) => item.id === clientId
    );

    if (!client) return "Client inconnu";

    return client.company
      ? `${client.name} — ${client.company}`
      : client.name;
  }

  function getChantierName(
    chantierId: string | null
  ) {
    if (!chantierId) return null;

    return (
      chantiers.find(
        (item) => item.id === chantierId
      )?.name || "Chantier inconnu"
    );
  }

  function formatAmount(amount: number | null) {
    if (amount === null || amount === undefined) {
      return "Non renseigné";
    }

    return Number(amount).toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });
  }

  function getStatusStyle(status: string) {
    if (status === "Validé") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "Refusé") {
      return "bg-red-50 text-red-700";
    }

    if (status === "Envoyé") {
      return "bg-blue-50 text-blue-700";
    }

    if (status === "Documents manquants") {
      return "bg-orange-50 text-orange-700";
    }

    if (status === "En cours") {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-slate-100 text-slate-600";
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = items.filter((item) => {
      const clientName = getClientName(
        item.client_id
      ).toLowerCase();

      const chantierName = (
        getChantierName(item.chantier_id) || ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.description
          ?.toLowerCase()
          .includes(query) ||
        clientName.includes(query) ||
        chantierName.includes(query);

      const matchesStatus =
        statusFilter === "Tous" ||
        item.status === statusFilter;

      const matchesType =
        typeFilter === "Tous" ||
        item.type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortBy === "amount-desc") {
        return (
          Number(b.amount || 0) -
          Number(a.amount || 0)
        );
      }

      if (sortBy === "amount-asc") {
        return (
          Number(a.amount || 0) -
          Number(b.amount || 0)
        );
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    items,
    clients,
    chantiers,
    search,
    statusFilter,
    typeFilter,
    sortBy,
  ]);

  const totalAmount = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0
    );
  }, [items]);

  const inProgressCount = useMemo(() => {
    return items.filter((item) =>
      ["En cours", "Documents manquants"].includes(
        item.status
      )
    ).length;
  }, [items]);

  const validatedCount = useMemo(() => {
    return items.filter(
      (item) => item.status === "Validé"
    ).length;
  }, [items]);

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dossiers d&apos;aides
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Suivez les aides financières et les
            dossiers administratifs de vos clients.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nouveau dossier
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total dossiers"
          value={items.length.toString()}
          icon={
            <FileText className="h-5 w-5 text-blue-600" />
          }
        />

        <StatCard
          label="En cours"
          value={inProgressCount.toString()}
          icon={
            <Clock3 className="h-5 w-5 text-amber-600" />
          }
        />

        <StatCard
          label="Validés"
          value={validatedCount.toString()}
          icon={
            <CircleCheck className="h-5 w-5 text-emerald-600" />
          }
        />

        <StatCard
          label="Montant potentiel"
          value={formatAmount(totalAmount)}
          icon={
            <Euro className="h-5 w-5 text-violet-600" />
          }
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tous les dossiers
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredItems.length} résultat
              {filteredItems.length > 1 ? "s" : ""}
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
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="Tous">
                Tous les statuts
              </option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="Tous">
                Tous les types
              </option>

              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
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
              <option value="recent">
                Plus récents
              </option>
              <option value="oldest">
                Plus anciens
              </option>
              <option value="amount-desc">
                Montant décroissant
              </option>
              <option value="amount-asc">
                Montant croissant
              </option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Chargement...
            </p>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center">
              <FileText className="mx-auto h-7 w-7 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucun dossier d&apos;aide
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Ajoutez votre premier dossier avec le
                bouton ci-dessus.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const chantierName =
                getChantierName(item.chantier_id);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50/40"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {item.title}
                        </h3>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>

                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                          {item.type}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5" />
                          {getClientName(item.client_id)}
                        </span>

                        {chantierName && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            {chantierName}
                          </span>
                        )}

                        {item.amount !== null && (
                          <span className="flex items-center gap-1.5">
                            <Euro className="h-3.5 w-3.5" />
                            {formatAmount(item.amount)}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="mt-3 max-w-3xl text-xs leading-5 text-slate-500">
                          {item.description}
                        </p>
                      )}

                      {item.required_documents &&
                        item.required_documents.length > 0 && (
                          <div className="mt-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              Documents demandés
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.required_documents.map(
                                (document) => (
                                  <span
                                    key={document}
                                    className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-600"
                                  >
                                    {document}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {item.notes && (
                        <p className="mt-3 text-xs text-slate-500">
                          <strong className="text-slate-700">
                            Notes :
                          </strong>{" "}
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                      <select
                        value={item.status}
                        onChange={(event) =>
                          updateStatus(
                            item.id,
                            event.target.value
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                      >
                        {statuses.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(item)
                        }
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteDossier(item.id)
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
            })
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingId
                    ? "Modifier le dossier"
                    : "Nouveau dossier d'aide"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Renseignez les informations du dossier
                  administratif.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Client
                  </label>

                  <select
                    value={form.clientId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        clientId: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">
                      Choisir un client
                    </option>

                    {clients.map((client) => (
                      <option
                        key={client.id}
                        value={client.id}
                      >
                        {client.company
                          ? `${client.name} — ${client.company}`
                          : client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Chantier
                  </label>

                  <select
                    value={form.chantierId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        chantierId: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">
                      Aucun chantier
                    </option>

                    {chantiers.map((chantier) => (
                      <option
                        key={chantier.id}
                        value={chantier.id}
                      >
                        {chantier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Field
                  label="Titre du dossier"
                  value={form.title}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      title: value,
                    })
                  }
                  placeholder="Ex : MaPrimeRénov isolation"
                />

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Type d&apos;aide
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        type: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Statut
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    {statuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <NumberField
                  label="Montant estimé"
                  value={form.amount}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      amount: value,
                    })
                  }
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold text-slate-600">
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
                  placeholder="Décrivez le dossier..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="mt-4">
                <Field
                  label="Documents nécessaires"
                  value={form.requiredDocuments}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      requiredDocuments: value,
                    })
                  }
                  placeholder="Ex : Avis d'imposition, devis, RIB"
                />

                <p className="mt-1 text-[10px] text-slate-400">
                  Sépare les documents avec des virgules.
                </p>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Notes internes
                </label>

                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes: event.target.value,
                    })
                  }
                  placeholder="Ajoutez une note..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={saveDossier}
                  disabled={saving}
                  className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Enregistrement..."
                    : editingId
                    ? "Enregistrer les modifications"
                    : "Créer le dossier"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="0"
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
}
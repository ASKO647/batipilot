"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  X,
  Building2,
  MapPin,
  Euro,
  CalendarDays,
  UserRound,
  ExternalLink,
  Trash2,
  Pencil,
  Trophy,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type AppelOffreRow = {
  id: string;
  organization_id: string;
  title: string;
  organization: string;
  location: string | null;
  sector: string | null;
  description: string | null;
  estimated_budget: number | null;
  min_budget: number | null;
  max_budget: number | null;
  publication_date: string | null;
  deadline: string;
  planned_start_date: string | null;
  status: string;
  priority: string;
  responsible: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string | null;
};

const statuses = [
  "À analyser",
  "En préparation",
  "Réponse envoyée",
  "Gagné",
  "Perdu",
  "Expiré",
];

const priorities = [
  "Faible",
  "Moyenne",
  "Haute",
  "Urgente",
];

export default function AppelsOffresPage() {
  const [items, setItems] = useState<AppelOffreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [priorityFilter, setPriorityFilter] = useState("Toutes");
  const [sortBy, setSortBy] = useState("recent");

  const [form, setForm] = useState({
    title: "",
    organization: "",
    location: "",
    sector: "",
    description: "",
    estimatedBudget: "",
    minBudget: "",
    maxBudget: "",
    publicationDate: "",
    deadline: "",
    plannedStartDate: "",
    status: "À analyser",
    priority: "Moyenne",
    responsible: "",
    sourceUrl: "",
  });

  useEffect(() => {
    loadAppelsOffres();
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

  async function loadAppelsOffres() {
    setLoading(true);

    const organizationId = await getOrganizationId();

    if (!organizationId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("appels_offres")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement appels d'offres :", error);
      setLoading(false);
      return;
    }

    setItems((data || []) as AppelOffreRow[]);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      title: "",
      organization: "",
      location: "",
      sector: "",
      description: "",
      estimatedBudget: "",
      minBudget: "",
      maxBudget: "",
      publicationDate: "",
      deadline: "",
      plannedStartDate: "",
      status: "À analyser",
      priority: "Moyenne",
      responsible: "",
      sourceUrl: "",
    });

    setEditingId(null);
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(item: AppelOffreRow) {
    setEditingId(item.id);

    setForm({
      title: item.title || "",
      organization: item.organization || "",
      location: item.location || "",
      sector: item.sector || "",
      description: item.description || "",
      estimatedBudget: item.estimated_budget?.toString() || "",
      minBudget: item.min_budget?.toString() || "",
      maxBudget: item.max_budget?.toString() || "",
      publicationDate: item.publication_date || "",
      deadline: item.deadline || "",
      plannedStartDate: item.planned_start_date || "",
      status: item.status || "À analyser",
      priority: item.priority || "Moyenne",
      responsible: item.responsible || "",
      sourceUrl: item.source_url || "",
    });

    setModalOpen(true);
  }

  async function saveAppelOffre() {
    if (!form.title.trim()) {
      alert("Ajoute un titre.");
      return;
    }

    if (!form.organization.trim()) {
      alert("Ajoute l'organisme.");
      return;
    }

    if (!form.deadline) {
      alert("Ajoute une date limite.");
      return;
    }

    setSaving(true);

    try {
      const organizationId = await getOrganizationId();

      if (!organizationId) {
        alert("Organisation introuvable.");
        return;
      }

      const payload = {
        organization_id: organizationId,
        title: form.title.trim(),
        organization: form.organization.trim(),
        location: form.location.trim() || null,
        sector: form.sector.trim() || null,
        description: form.description.trim() || null,
        estimated_budget: form.estimatedBudget
          ? Number(form.estimatedBudget)
          : null,
        min_budget: form.minBudget
          ? Number(form.minBudget)
          : null,
        max_budget: form.maxBudget
          ? Number(form.maxBudget)
          : null,
        publication_date: form.publicationDate || null,
        deadline: form.deadline,
        planned_start_date: form.plannedStartDate || null,
        status: form.status,
        priority: form.priority,
        responsible: form.responsible.trim() || null,
        source_url: form.sourceUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from("appels_offres")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          console.error(error);
          alert(error.message);
          return;
        }

        alert("Appel d'offres modifié.");
      } else {
        const { error } = await supabase
          .from("appels_offres")
          .insert(payload);

        if (error) {
          console.error(error);
          alert(error.message);
          return;
        }

        alert("Appel d'offres créé.");
      }

      setModalOpen(false);
      resetForm();

      await loadAppelsOffres();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("appels_offres")
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

    await loadAppelsOffres();
  }

  async function deleteAppelOffre(id: string) {
    const confirmed = window.confirm(
      "Supprimer définitivement cet appel d'offres ?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("appels_offres")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadAppelsOffres();
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

  function formatDate(date: string | null) {
    if (!date) return "Non définie";

    return new Date(date).toLocaleDateString("fr-FR");
  }

  function getStatusStyle(status: string) {
    if (status === "Gagné") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "Perdu") {
      return "bg-red-50 text-red-700";
    }

    if (status === "Réponse envoyée") {
      return "bg-blue-50 text-blue-700";
    }

    if (status === "En préparation") {
      return "bg-amber-50 text-amber-700";
    }

    if (status === "Expiré") {
      return "bg-slate-100 text-slate-500";
    }

    return "bg-violet-50 text-violet-700";
  }

  function getPriorityStyle(priority: string) {
    if (priority === "Urgente") {
      return "bg-red-50 text-red-700";
    }

    if (priority === "Haute") {
      return "bg-orange-50 text-orange-700";
    }

    if (priority === "Moyenne") {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-slate-100 text-slate-600";
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = items.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.organization.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query) ||
        item.sector?.toLowerCase().includes(query) ||
        item.responsible?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "Tous" ||
        item.status === statusFilter;

      const matchesPriority =
        priorityFilter === "Toutes" ||
        item.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortBy === "deadline-asc") {
        return (
          new Date(a.deadline).getTime() -
          new Date(b.deadline).getTime()
        );
      }

      if (sortBy === "deadline-desc") {
        return (
          new Date(b.deadline).getTime() -
          new Date(a.deadline).getTime()
        );
      }

      if (sortBy === "budget-desc") {
        return (
          Number(b.estimated_budget || 0) -
          Number(a.estimated_budget || 0)
        );
      }

      if (sortBy === "budget-asc") {
        return (
          Number(a.estimated_budget || 0) -
          Number(b.estimated_budget || 0)
        );
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    items,
    search,
    statusFilter,
    priorityFilter,
    sortBy,
  ]);

  const toAnalyzeCount = useMemo(() => {
    return items.filter(
      (item) => item.status === "À analyser"
    ).length;
  }, [items]);

  const preparationCount = useMemo(() => {
    return items.filter(
      (item) => item.status === "En préparation"
    ).length;
  }, [items]);

  const wonCount = useMemo(() => {
    return items.filter(
      (item) => item.status === "Gagné"
    ).length;
  }, [items]);

  const estimatedTotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item.estimated_budget || 0),
      0
    );
  }, [items]);

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Appels d&apos;offres
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Centralisez, analysez et suivez vos opportunités commerciales.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nouvel appel d&apos;offres
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="À analyser"
          value={toAnalyzeCount.toString()}
          icon={<Search className="h-5 w-5 text-violet-600" />}
        />

        <StatCard
          label="En préparation"
          value={preparationCount.toString()}
          icon={<Building2 className="h-5 w-5 text-amber-600" />}
        />

        <StatCard
          label="Gagnés"
          value={wonCount.toString()}
          icon={<Trophy className="h-5 w-5 text-emerald-600" />}
        />

        <StatCard
          label="Budget potentiel"
          value={formatAmount(estimatedTotal)}
          icon={<Euro className="h-5 w-5 text-blue-600" />}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tous les appels d&apos;offres
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
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="Toutes">
                Toutes les priorités
              </option>

              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
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
              <option value="deadline-asc">
                Échéance proche
              </option>
              <option value="deadline-desc">
                Échéance lointaine
              </option>
              <option value="budget-desc">
                Budget décroissant
              </option>
              <option value="budget-asc">
                Budget croissant
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
              <Building2 className="mx-auto h-7 w-7 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucun appel d&apos;offres
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Ajoutez votre première opportunité avec le bouton ci-dessus.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
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

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getPriorityStyle(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {item.organization}
                      </span>

                      {item.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.location}
                        </span>
                      )}

                      {item.responsible && (
                        <span className="flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5" />
                          {item.responsible}
                        </span>
                      )}

                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Limite : {formatDate(item.deadline)}
                      </span>
                    </div>

                    {item.sector && (
                      <p className="mt-3 text-xs font-medium text-slate-600">
                        Secteur : {item.sector}
                      </p>
                    )}

                    {item.description && (
                      <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                      {item.estimated_budget !== null && (
                        <span>
                          Budget estimé :{" "}
                          <strong className="text-slate-700">
                            {formatAmount(
                              item.estimated_budget
                            )}
                          </strong>
                        </span>
                      )}

                      {item.min_budget !== null && (
                        <span>
                          Min :{" "}
                          {formatAmount(item.min_budget)}
                        </span>
                      )}

                      {item.max_budget !== null && (
                        <span>
                          Max :{" "}
                          {formatAmount(item.max_budget)}
                        </span>
                      )}
                    </div>

                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Voir la source
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
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
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteAppelOffre(item.id)
                      }
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingId
                    ? "Modifier l'appel d'offres"
                    : "Nouvel appel d'offres"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Renseignez les informations de l&apos;opportunité.
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
                <Field
                  label="Titre"
                  value={form.title}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      title: value,
                    })
                  }
                  placeholder="Ex : Rénovation école municipale"
                />

                <Field
                  label="Organisme"
                  value={form.organization}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      organization: value,
                    })
                  }
                  placeholder="Ex : Mairie de Lyon"
                />

                <Field
                  label="Localisation"
                  value={form.location}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      location: value,
                    })
                  }
                  placeholder="Ex : Lyon"
                />

                <Field
                  label="Secteur"
                  value={form.sector}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      sector: value,
                    })
                  }
                  placeholder="Ex : Rénovation énergétique"
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
                  placeholder="Décrivez le marché..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <NumberField
                  label="Budget estimé"
                  value={form.estimatedBudget}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      estimatedBudget: value,
                    })
                  }
                />

                <NumberField
                  label="Budget minimum"
                  value={form.minBudget}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      minBudget: value,
                    })
                  }
                />

                <NumberField
                  label="Budget maximum"
                  value={form.maxBudget}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      maxBudget: value,
                    })
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <DateField
                  label="Publication"
                  value={form.publicationDate}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      publicationDate: value,
                    })
                  }
                />

                <DateField
                  label="Date limite"
                  value={form.deadline}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      deadline: value,
                    })
                  }
                />

                <DateField
                  label="Début prévu"
                  value={form.plannedStartDate}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      plannedStartDate: value,
                    })
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Priorité
                  </label>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    {priorities.map((priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Responsable"
                  value={form.responsible}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      responsible: value,
                    })
                  }
                  placeholder="Ex : Julien Martin"
                />

                <Field
                  label="Lien source"
                  value={form.sourceUrl}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      sourceUrl: value,
                    })
                  }
                  placeholder="https://..."
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
                  onClick={saveAppelOffre}
                  disabled={saving}
                  className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Enregistrement..."
                    : editingId
                    ? "Enregistrer les modifications"
                    : "Créer l'appel d'offres"}
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

function DateField({
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
        type="date"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
}
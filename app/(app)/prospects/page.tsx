"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserRound,
  Building2,
  Mail,
  Phone,
  MapPin,
  Plus,
  TrendingUp,
  Users,
  UserCheck,
  Trash2,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Prospect = {
  id: string;
  organization_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  type: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  created_at: string;
  pipeline_stage: string | null;
};

const pipelineStages = [
  "Nouveau",
  "À contacter",
  "Qualifié",
  "Rendez-vous",
  "Devis",
  "Négociation",
];

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("recent");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    city: "",
    type: "particulier",
    source: "",
    notes: "",
    pipeline_stage: "Nouveau",
  });

  useEffect(() => {
    loadProspects();
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

  async function loadProspects() {
    setLoading(true);

    const organizationId = await getOrganizationId();

    if (!organizationId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("organization_id", organizationId)
      .in("status", ["prospect", "qualified"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement prospects :", error);
      setLoading(false);
      return;
    }

    setProspects((data || []) as Prospect[]);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      city: "",
      type: "particulier",
      source: "",
      notes: "",
      pipeline_stage: "Nouveau",
    });
  }

  async function createProspect() {
    if (!form.name.trim()) {
      alert("Le nom du prospect est obligatoire.");
      return;
    }

    setSaving(true);

    const organizationId = await getOrganizationId();

    if (!organizationId) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("clients").insert({
      organization_id: organizationId,
      name: form.name.trim(),
      company: form.company.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      city: form.city.trim() || null,
      type: form.type,
      status: "prospect",
      source: form.source.trim() || null,
      notes: form.notes.trim() || null,
      pipeline_stage: form.pipeline_stage,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      setSaving(false);
      return;
    }

    resetForm();
    setModalOpen(false);
    setSaving(false);

    await loadProspects();
  }

  async function updatePipelineStage(id: string, pipelineStage: string) {
    const status =
      pipelineStage === "Qualifié" ||
      pipelineStage === "Rendez-vous" ||
      pipelineStage === "Devis" ||
      pipelineStage === "Négociation"
        ? "qualified"
        : "prospect";

    const { error } = await supabase
      .from("clients")
      .update({
        pipeline_stage: pipelineStage,
        status,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadProspects();
  }

  async function convertToClient(id: string) {
    const confirmed = window.confirm(
      "Convertir ce prospect en client ?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("clients")
      .update({
        status: "client",
        pipeline_stage: "Client",
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadProspects();
  }

  async function deleteProspect(id: string) {
    const confirmed = window.confirm(
      "Supprimer définitivement ce prospect ?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadProspects();
  }

  const filteredProspects = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = prospects.filter((prospect) => {
      const matchesSearch =
        !query ||
        prospect.name.toLowerCase().includes(query) ||
        prospect.company?.toLowerCase().includes(query) ||
        prospect.email?.toLowerCase().includes(query) ||
        prospect.phone?.toLowerCase().includes(query) ||
        prospect.city?.toLowerCase().includes(query) ||
        prospect.source?.toLowerCase().includes(query);

      const stage = prospect.pipeline_stage || "Nouveau";

      const matchesStage =
        stageFilter === "Tous" || stage === stageFilter;

      return matchesSearch && matchesStage;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [prospects, search, stageFilter, sortBy]);

  const totalProspects = prospects.length;

  const qualifiedCount = prospects.filter(
    (prospect) => prospect.status === "qualified"
  ).length;

  const newCount = prospects.filter(
    (prospect) =>
      !prospect.pipeline_stage ||
      prospect.pipeline_stage === "Nouveau"
  ).length;

  const appointmentCount = prospects.filter(
    (prospect) => prospect.pipeline_stage === "Rendez-vous"
  ).length;

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Prospects
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Suivez vos prospects et faites-les avancer dans votre pipeline commercial.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nouveau prospect
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total prospects"
          value={totalProspects.toString()}
          icon={<Users className="h-5 w-5 text-blue-600" />}
        />

        <StatCard
          label="Nouveaux"
          value={newCount.toString()}
          icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
        />

        <StatCard
          label="Qualifiés"
          value={qualifiedCount.toString()}
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
        />

        <StatCard
          label="Rendez-vous"
          value={appointmentCount.toString()}
          icon={<UserRound className="h-5 w-5 text-amber-600" />}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Pipeline commercial
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredProspects.length} prospect
              {filteredProspects.length > 1 ? "s" : ""}
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
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="Tous">Toutes les étapes</option>

              {pipelineStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
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
              <option value="name-asc">Nom A-Z</option>
              <option value="name-desc">Nom Z-A</option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Chargement...
            </p>
          ) : filteredProspects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center">
              <Users className="mx-auto h-7 w-7 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucun prospect
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Ajoutez votre premier prospect pour commencer votre suivi commercial.
              </p>
            </div>
          ) : (
            filteredProspects.map((prospect) => (
              <div
                key={prospect.id}
                className="rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50/40"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {prospect.name}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          prospect.status === "qualified"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {prospect.status === "qualified"
                          ? "Qualifié"
                          : "Prospect"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      {prospect.company && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {prospect.company}
                        </span>
                      )}

                      {prospect.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {prospect.email}
                        </span>
                      )}

                      {prospect.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {prospect.phone}
                        </span>
                      )}

                      {prospect.city && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {prospect.city}
                        </span>
                      )}
                    </div>

                    {prospect.source && (
                      <p className="mt-3 text-xs text-slate-500">
                        Source :{" "}
                        <span className="font-medium text-slate-700">
                          {prospect.source}
                        </span>
                      </p>
                    )}

                    {prospect.notes && (
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {prospect.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                    <select
                      value={prospect.pipeline_stage || "Nouveau"}
                      onChange={(event) =>
                        updatePipelineStage(
                          prospect.id,
                          event.target.value
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                    >
                      {pipelineStages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => convertToClient(prospect.id)}
                      className="rounded-lg border border-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Convertir en client
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteProspect(prospect.id)}
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
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Nouveau prospect
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Ajoutez un nouveau contact à votre pipeline commercial.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nom *">
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  className="input"
                  placeholder="Jean Dupont"
                />
              </Field>

              <Field label="Entreprise">
                <input
                  value={form.company}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      company: event.target.value,
                    })
                  }
                  className="input"
                  placeholder="Dupont Rénovation"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email: event.target.value,
                    })
                  }
                  className="input"
                  placeholder="jean@email.fr"
                />
              </Field>

              <Field label="Téléphone">
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value,
                    })
                  }
                  className="input"
                  placeholder="06 12 34 56 78"
                />
              </Field>

              <Field label="Ville">
                <input
                  value={form.city}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      city: event.target.value,
                    })
                  }
                  className="input"
                  placeholder="Paris"
                />
              </Field>

              <Field label="Type">
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type: event.target.value,
                    })
                  }
                  className="input"
                >
                  <option value="particulier">Particulier</option>
                  <option value="professionnel">Professionnel</option>
                </select>
              </Field>

              <Field label="Source">
                <input
                  value={form.source}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      source: event.target.value,
                    })
                  }
                  className="input"
                  placeholder="Google, téléphone, recommandation..."
                />
              </Field>

              <Field label="Étape">
                <select
                  value={form.pipeline_stage}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      pipeline_stage: event.target.value,
                    })
                  }
                  className="input"
                >
                  {pipelineStages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Notes">
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        notes: event.target.value,
                      })
                    }
                    className="input min-h-28 resize-none"
                    placeholder="Besoin, budget, délai, informations importantes..."
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={createProspect}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Création..." : "Créer le prospect"}
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
          padding: 0.65rem 0.75rem;
          font-size: 0.75rem;
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
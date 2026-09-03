"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  FileText,
  Building2,
  Download,
  ExternalLink,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type DocumentRow = {
  id: string;
  organization_id: string;
  chantier_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  note: string | null;
  created_at: string;
};

type ChantierRow = {
  id: string;
  name: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [chantiers, setChantiers] = useState<ChantierRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [chantierFilter, setChantierFilter] = useState("Tous");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [sortBy, setSortBy] = useState("recent");

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

    const [documentsResponse, chantiersResponse] =
      await Promise.all([
        supabase
          .from("chantier_documents")
          .select("*")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false }),

        supabase
          .from("chantiers")
          .select("id,name")
          .eq("organization_id", organizationId)
          .order("name", { ascending: true }),
      ]);

    if (documentsResponse.error) {
      console.error(
        "Erreur chargement documents :",
        documentsResponse.error
      );
    }

    if (chantiersResponse.error) {
      console.error(
        "Erreur chargement chantiers :",
        chantiersResponse.error
      );
    }

    setDocuments(
      (documentsResponse.data || []) as DocumentRow[]
    );

    setChantiers(
      (chantiersResponse.data || []) as ChantierRow[]
    );

    setLoading(false);
  }

  function getChantierName(chantierId: string) {
    return (
      chantiers.find(
        (chantier) => chantier.id === chantierId
      )?.name || "Chantier inconnu"
    );
  }

  function getPublicUrl(filePath: string) {
    const { data } = supabase.storage
      .from("chantier-documents")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  function formatFileSize(size: number | null) {
    if (!size) return "Taille inconnue";

    if (size < 1024) {
      return `${size} o`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} Ko`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} Mo`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  async function deleteDocument(document: DocumentRow) {
    const confirmed = window.confirm(
      `Supprimer définitivement "${document.file_name}" ?`
    );

    if (!confirmed) return;

    const { error: storageError } =
      await supabase.storage
        .from("chantier-documents")
        .remove([document.file_path]);

    if (storageError) {
      console.error(
        "Erreur suppression fichier :",
        storageError
      );
      alert(storageError.message);
      return;
    }

    const { error: databaseError } = await supabase
      .from("chantier_documents")
      .delete()
      .eq("id", document.id);

    if (databaseError) {
      console.error(
        "Erreur suppression document :",
        databaseError
      );
      alert(databaseError.message);
      return;
    }

    await loadData();
  }

  const categories = useMemo(() => {
    const values = documents
      .map((document) => document.category)
      .filter(
        (category): category is string =>
          Boolean(category)
      );

    return Array.from(new Set(values)).sort();
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = documents.filter((document) => {
      const chantierName = getChantierName(
        document.chantier_id
      ).toLowerCase();

      const matchesSearch =
        !query ||
        document.file_name.toLowerCase().includes(query) ||
        document.file_type
          ?.toLowerCase()
          .includes(query) ||
        document.category
          ?.toLowerCase()
          .includes(query) ||
        document.note?.toLowerCase().includes(query) ||
        chantierName.includes(query);

      const matchesChantier =
        chantierFilter === "Tous" ||
        document.chantier_id === chantierFilter;

      const matchesCategory =
        categoryFilter === "Toutes" ||
        document.category === categoryFilter;

      return (
        matchesSearch &&
        matchesChantier &&
        matchesCategory
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortBy === "name-asc") {
        return a.file_name.localeCompare(
          b.file_name,
          "fr"
        );
      }

      if (sortBy === "name-desc") {
        return b.file_name.localeCompare(
          a.file_name,
          "fr"
        );
      }

      if (sortBy === "size-desc") {
        return Number(b.file_size || 0) -
          Number(a.file_size || 0);
      }

      if (sortBy === "size-asc") {
        return Number(a.file_size || 0) -
          Number(b.file_size || 0);
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    documents,
    chantiers,
    search,
    chantierFilter,
    categoryFilter,
    sortBy,
  ]);

  const totalSize = useMemo(() => {
    return documents.reduce(
      (total, document) =>
        total + Number(document.file_size || 0),
      0
    );
  }, [documents]);

  const linkedChantiersCount = useMemo(() => {
    return new Set(
      documents.map(
        (document) => document.chantier_id
      )
    ).size;
  }, [documents]);

  return (
    <div className="w-full px-7 py-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Documents
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Retrouvez tous les documents liés à vos
          chantiers au même endroit.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total documents"
          value={documents.length.toString()}
          icon={
            <FileText className="h-5 w-5 text-blue-600" />
          }
        />

        <StatCard
          label="Chantiers concernés"
          value={linkedChantiersCount.toString()}
          icon={
            <Building2 className="h-5 w-5 text-violet-600" />
          }
        />

        <StatCard
          label="Espace utilisé"
          value={formatFileSize(totalSize)}
          icon={
            <FolderOpen className="h-5 w-5 text-emerald-600" />
          }
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tous les documents
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredDocuments.length} résultat
              {filteredDocuments.length > 1 ? "s" : ""}
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
              value={chantierFilter}
              onChange={(event) =>
                setChantierFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="Tous">
                Tous les chantiers
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

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="Toutes">
                Toutes les catégories
              </option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
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
              <option value="name-asc">
                Nom A → Z
              </option>
              <option value="name-desc">
                Nom Z → A
              </option>
              <option value="size-desc">
                Plus lourds
              </option>
              <option value="size-asc">
                Plus légers
              </option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Chargement...
            </p>
          ) : filteredDocuments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center">
              <FileText className="mx-auto h-7 w-7 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucun document
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Les documents ajoutés depuis vos
                chantiers apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <div className="hidden grid-cols-[2fr_1.3fr_1fr_110px_120px] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:grid">
                <span>Document</span>
                <span>Chantier</span>
                <span>Catégorie</span>
                <span>Taille</span>
                <span>Actions</span>
              </div>

              {filteredDocuments.map((document) => {
                const publicUrl = getPublicUrl(
                  document.file_path
                );

                return (
                  <div
                    key={document.id}
                    className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 lg:grid-cols-[2fr_1.3fr_1fr_110px_120px] lg:items-center lg:gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-50 p-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {document.file_name}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            Ajouté le{" "}
                            {formatDate(
                              document.created_at
                            )}
                          </p>

                          {document.note && (
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {document.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {getChantierName(
                          document.chantier_id
                        )}
                      </span>
                    </div>

                    <div>
                      {document.category ? (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                          {document.category}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Non classé
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      {formatFileSize(
                        document.file_size
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Ouvrir"
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <a
                        href={publicUrl}
                        download={document.file_name}
                        title="Télécharger"
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          deleteDocument(document)
                        }
                        title="Supprimer"
                        className="rounded-lg border border-red-100 p-2 text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
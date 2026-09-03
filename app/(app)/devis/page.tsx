"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  FileText,
  Euro,
  CheckCircle2,
  Clock3,
  Eye,
  Download,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

import {
  downloadDevisPdf,
  previewDevisPdf,
  type DevisPdfCompany,
} from "../../../lib/devisPdf";

type DevisRow = {
  id: string;
  client_id: string | null;
  number: string | null;
  project: string | null;
  description: string | null;
  amount: number | null;
  tva: number | null;
  status: string | null;
  created_at: string;
  validity_date?: string | null;
};

type ClientRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
};

export default function DevisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Chargement des devis...
        </div>
      }
    >
      <DevisPageContent />
    </Suspense>
  );
}

function DevisPageContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  const [clientName, setClientName] = useState("");
  const [saving, setSaving] = useState(false);

  const [devis, setDevis] = useState<DevisRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);

  const [companySettings, setCompanySettings] =
    useState<DevisPdfCompany>({});

  const [pdfLoadingId, setPdfLoadingId] =
    useState<string | null>(null);

  const [emailLoadingId, setEmailLoadingId] =
    useState<string | null>(null);

  const [statusLoadingId, setStatusLoadingId] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = useState(
    clientId || ""
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("recent");

  const [form, setForm] = useState({
    project: "",
    description: "",
    amount: "",
    tva: "20",
    validityDate: "",
    status: "Brouillon",
  });

  useEffect(() => {
    async function loadClientName() {
      if (!clientId) return;

      const { data, error } = await supabase
        .from("clients")
        .select("name")
        .eq("id", clientId)
        .single();

      if (error) {
        console.error("Erreur chargement client :", error);
        return;
      }

      setClientName(data.name);
      setSelectedClientId(clientId);
    }

    loadClientName();
  }, [clientId]);

  useEffect(() => {
    loadPageData();
  }, []);

  async function getOrganizationId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      console.error(
        "Erreur chargement organisation :",
        error
      );

      return null;
    }

    return profile.organization_id as string;
  }

  async function loadPageData() {
    const organizationId = await getOrganizationId();

    if (!organizationId) return;

    await Promise.all([
      loadClients(organizationId),
      loadDevis(organizationId),
      loadCompanySettings(organizationId),
    ]);
  }

  async function loadClients(
    providedOrganizationId?: string
  ) {
    const organizationId =
      providedOrganizationId ||
      (await getOrganizationId());

    if (!organizationId) return;

    const { data, error } = await supabase
      .from("clients")
      .select(
        "id,name,company,email,phone,address,city,postal_code"
      )
      .eq("organization_id", organizationId)
      .order("name", { ascending: true });

    if (error) {
      console.error(
        "Erreur chargement clients :",
        error
      );

      return;
    }

    setClients((data || []) as ClientRow[]);
  }

  async function loadDevis(
    providedOrganizationId?: string
  ) {
    const organizationId =
      providedOrganizationId ||
      (await getOrganizationId());

    if (!organizationId) return;

    const { data, error } = await supabase
      .from("devis")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Erreur chargement devis :",
        error
      );

      return;
    }

    setDevis((data || []) as DevisRow[]);
  }

  async function loadCompanySettings(
    providedOrganizationId?: string
  ) {
    const organizationId =
      providedOrganizationId ||
      (await getOrganizationId());

    if (!organizationId) return;

    const { data: settings, error: settingsError } =
      await supabase
        .from("organization_settings")
        .select(
          "company_name,legal_name,siret,vat_number,phone,email,website,address,city,postal_code"
        )
        .eq("organization_id", organizationId)
        .maybeSingle();

    if (settingsError) {
      console.error(
        "Erreur chargement paramètres entreprise :",
        settingsError
      );
    }

    const { data: organization } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle();

    setCompanySettings({
      company_name:
        settings?.company_name ||
        organization?.name ||
        "Mon entreprise",

      legal_name: settings?.legal_name || null,
      siret: settings?.siret || null,
      vat_number: settings?.vat_number || null,
      phone: settings?.phone || null,
      email: settings?.email || null,
      website: settings?.website || null,
      address: settings?.address || null,
      city: settings?.city || null,
      postal_code: settings?.postal_code || null,
    });
  }

  async function createDevis() {
    if (!selectedClientId) {
      alert("Sélectionne un client.");
      return;
    }

    if (!form.project.trim()) {
      alert("Ajoute un nom de projet.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Ajoute un montant valide.");
      return;
    }

    setSaving(true);

    try {
      const organizationId =
        await getOrganizationId();

      if (!organizationId) {
        alert(
          "Impossible de récupérer ton organisation."
        );

        return;
      }

      const devisNumber = `DEV-${new Date().getFullYear()}-${Date.now()
        .toString()
        .slice(-6)}`;

      const { error } = await supabase
        .from("devis")
        .insert({
          organization_id: organizationId,
          client_id: selectedClientId,
          number: devisNumber,
          project: form.project.trim(),
          description:
            form.description.trim() || null,
          amount: Number(form.amount),
          tva: Number(form.tva),
          status: form.status,
          validity_date:
            form.validityDate || null,
        });

      if (error) {
        console.error(
          "Erreur création devis :",
          error
        );

        alert(error.message);
        return;
      }

      setForm({
        project: "",
        description: "",
        amount: "",
        tva: "20",
        validityDate: "",
        status: "Brouillon",
      });

      if (!clientId) {
        setSelectedClientId("");
      }

      await loadDevis(organizationId);

      alert("Devis créé.");
    } finally {
      setSaving(false);
    }
  }

  function getClient(
    clientIdValue: string | null
  ) {
    if (!clientIdValue) return null;

    return (
      clients.find(
        (client) =>
          client.id === clientIdValue
      ) || null
    );
  }

  function formatAmount(
    amount: number | null
  ) {
    return Number(amount || 0).toLocaleString(
      "fr-FR",
      {
        style: "currency",
        currency: "EUR",
      }
    );
  }

  function calculateTtc(item: DevisRow) {
    const amount = Number(item.amount || 0);
    const tva = Number(item.tva || 0);

    return amount + amount * (tva / 100);
  }

  function getStatusStyle(
    status: string | null
  ) {
    if (status === "Accepté") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "Envoyé") {
      return "bg-blue-50 text-blue-700";
    }

    if (status === "Refusé") {
      return "bg-red-50 text-red-700";
    }

    return "bg-slate-100 text-slate-600";
  }

  async function preparePdf(
    item: DevisRow,
    action: "preview" | "download"
  ) {
    const client = getClient(item.client_id);

    if (!client) {
      alert(
        "Impossible de générer le PDF : aucun client n'est associé à ce devis."
      );

      return;
    }

    setPdfLoadingId(item.id);

    try {
      const options = {
        devis: {
          id: item.id,
          number: item.number,
          project: item.project,
          description: item.description,
          amount: item.amount,
          tva: item.tva,
          status: item.status,
          created_at: item.created_at,
          validity_date:
            item.validity_date || null,
        },

        client: {
          id: client.id,
          name: client.name,
          company: client.company,
          email: client.email,
          phone: client.phone,
          address: client.address,
          city: client.city,
          postal_code: client.postal_code,
        },

        company: companySettings,
      };

      if (action === "preview") {
        previewDevisPdf(options);
      } else {
        downloadDevisPdf(options);
      }
    } catch (error) {
      console.error(
        "Erreur génération PDF :",
        error
      );

      alert(
        "Une erreur est survenue pendant la génération du PDF."
      );
    } finally {
      setPdfLoadingId(null);
    }
  }

  async function sendDevisByEmail(item: DevisRow) {
    const client = getClient(item.client_id);

    if (!client) {
      alert(
        "Aucun client n'est associé à ce devis."
      );
      return;
    }

    if (!client.email) {
      alert(
        "Ce client n'a pas d'adresse email. Ajoute son email dans sa fiche client avant d'envoyer le devis."
      );
      return;
    }

    const confirmed = window.confirm(
      `Envoyer le devis ${
        item.number || ""
      } à ${client.email} ?`
    );

    if (!confirmed) {
      return;
    }

    setEmailLoadingId(item.id);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !session?.access_token
      ) {
        alert(
          "Ta session a expiré. Reconnecte-toi puis réessaie."
        );
        return;
      }

      const response = await fetch(
        `/api/devis/${item.id}/envoyer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      let result: {
        success?: boolean;
        message?: string;
        error?: string;
      } = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        console.error(
          "Erreur envoi devis :",
          result
        );

        alert(
          result.error ||
            "Impossible d'envoyer le devis."
        );

        return;
      }

      alert(
        result.message ||
          `Devis envoyé à ${client.email}.`
      );

      await loadDevis();
    } catch (error) {
      console.error(
        "Erreur envoi email :",
        error
      );

      alert(
        "Une erreur est survenue pendant l'envoi du devis."
      );
    } finally {
      setEmailLoadingId(null);
    }
  }

  async function updateDevisStatus(
    item: DevisRow,
    newStatus: string
  ) {
    if (item.status === newStatus) return;

    setStatusLoadingId(item.id);

    try {
      const organizationId =
        await getOrganizationId();

      if (!organizationId) {
        alert(
          "Impossible de récupérer ton organisation."
        );
        return;
      }

      const { error } = await supabase
        .from("devis")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("organization_id", organizationId);

      if (error) {
        console.error(
          "Erreur modification statut devis :",
          error
        );
        alert(error.message);
        return;
      }

      await loadDevis(organizationId);
    } finally {
      setStatusLoadingId(null);
    }
  }

  async function deleteDevis(item: DevisRow) {
    const confirmed = window.confirm(
      `Supprimer définitivement le devis ${
        item.number || item.project || ""
      } ?`
    );

    if (!confirmed) return;

    setDeletingId(item.id);

    try {
      const organizationId =
        await getOrganizationId();

      if (!organizationId) {
        alert(
          "Impossible de récupérer ton organisation."
        );
        return;
      }

      const { error } = await supabase
        .from("devis")
        .delete()
        .eq("id", item.id)
        .eq("organization_id", organizationId);

      if (error) {
        console.error(
          "Erreur suppression devis :",
          error
        );
        alert(error.message);
        return;
      }

      await loadDevis(organizationId);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredDevis = useMemo(() => {
    const result = devis.filter((item) => {
      const query =
        search.trim().toLowerCase();

      const client = getClient(
        item.client_id
      );

      const matchesSearch =
        !query ||
        item.project
          ?.toLowerCase()
          .includes(query) ||
        item.number
          ?.toLowerCase()
          .includes(query) ||
        item.description
          ?.toLowerCase()
          .includes(query) ||
        client?.name
          .toLowerCase()
          .includes(query) ||
        client?.company
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "Tous" ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
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

      if (sortBy === "validity-asc") {
        if (
          !a.validity_date &&
          !b.validity_date
        ) {
          return 0;
        }

        if (!a.validity_date) return 1;
        if (!b.validity_date) return -1;

        return (
          new Date(
            a.validity_date
          ).getTime() -
          new Date(
            b.validity_date
          ).getTime()
        );
      }

      if (sortBy === "validity-desc") {
        if (
          !a.validity_date &&
          !b.validity_date
        ) {
          return 0;
        }

        if (!a.validity_date) return 1;
        if (!b.validity_date) return -1;

        return (
          new Date(
            b.validity_date
          ).getTime() -
          new Date(
            a.validity_date
          ).getTime()
        );
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    devis,
    clients,
    search,
    statusFilter,
    sortBy,
  ]);

  const totalAmount = useMemo(() => {
    return devis.reduce(
      (total, item) =>
        total +
        Number(item.amount || 0),
      0
    );
  }, [devis]);

  const acceptedCount = useMemo(() => {
    return devis.filter(
      (item) =>
        item.status === "Accepté"
    ).length;
  }, [devis]);

  const waitingCount = useMemo(() => {
    return devis.filter(
      (item) =>
        item.status === "Brouillon" ||
        item.status === "Envoyé"
    ).length;
  }, [devis]);

  return (
    <div className="w-full px-7 py-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Devis
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Créez, gérez, générez et envoyez vos
          devis clients.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Total devis
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {devis.length}
              </p>
            </div>

            <div className="rounded-lg bg-slate-100 p-2.5">
              <FileText className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Montant total HT
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatAmount(totalAmount)}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-2.5">
              <Euro className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Acceptés
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {acceptedCount}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                En attente
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {waitingCount}
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 p-2.5">
              <Clock3 className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {clientId && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-blue-700">
            Création d&apos;un devis depuis une
            fiche client
          </p>

          <p className="mt-1 text-xs text-blue-600">
            Client sélectionné :{" "}
            {clientName || "Chargement..."}
          </p>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Nouveau devis
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Renseignez les informations du devis.
          </p>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-xs font-semibold text-slate-600">
            Client
          </label>

          <select
            value={selectedClientId}
            onChange={(event) =>
              setSelectedClientId(
                event.target.value
              )
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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

        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold text-slate-600">
            Projet
          </label>

          <input
            type="text"
            value={form.project}
            onChange={(event) =>
              setForm({
                ...form,
                project:
                  event.target.value,
              })
            }
            placeholder="Ex : Rénovation salle de bain"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold text-slate-600">
            Description
          </label>

          <textarea
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description:
                  event.target.value,
              })
            }
            rows={4}
            placeholder="Décris les travaux à réaliser..."
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600">
              Montant HT
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) =>
                setForm({
                  ...form,
                  amount:
                    event.target.value,
                })
              }
              placeholder="Ex : 5000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600">
              TVA
            </label>

            <select
              value={form.tva}
              onChange={(event) =>
                setForm({
                  ...form,
                  tva:
                    event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="5.5">
                5,5 %
              </option>

              <option value="10">
                10 %
              </option>

              <option value="20">
                20 %
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold text-slate-600">
            Date de validité
          </label>

          <input
            type="date"
            value={form.validityDate}
            onChange={(event) =>
              setForm({
                ...form,
                validityDate:
                  event.target.value,
              })
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold text-slate-600">
            Statut initial
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
            <option value="Brouillon">Brouillon</option>
            <option value="Envoyé">Envoyé</option>
            <option value="Accepté">Accepté</option>
            <option value="Refusé">Refusé</option>
          </select>
        </div>

        {form.amount &&
          Number(form.amount) > 0 && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total HT</span>

                <span>
                  {formatAmount(
                    Number(form.amount)
                  )}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>
                  TVA {form.tva} %
                </span>

                <span>
                  {formatAmount(
                    Number(form.amount) *
                      (Number(form.tva) /
                        100)
                  )}
                </span>
              </div>

              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    Total TTC
                  </span>

                  <span className="text-base font-bold text-blue-600">
                    {formatAmount(
                      Number(form.amount) *
                        (1 +
                          Number(
                            form.tva
                          ) /
                            100)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={createDevis}
            disabled={saving}
            className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Création..."
              : "Créer le devis"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tous les devis
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredDevis.length} résultat
              {filteredDevis.length > 1
                ? "s"
                : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Rechercher..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500 md:w-64"
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

              <option value="Brouillon">
                Brouillon
              </option>

              <option value="Envoyé">
                Envoyé
              </option>

              <option value="Accepté">
                Accepté
              </option>

              <option value="Refusé">
                Refusé
              </option>
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value
                )
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

              <option value="validity-asc">
                Validité la plus proche
              </option>

              <option value="validity-desc">
                Validité la plus lointaine
              </option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filteredDevis.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                Aucun devis trouvé
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Modifie ta recherche ou tes
                filtres.
              </p>
            </div>
          ) : (
            filteredDevis.map((item) => {
              const client = getClient(
                item.client_id
              );

              const isPdfLoading =
                pdfLoadingId === item.id;

              const isEmailLoading =
                emailLoadingId === item.id;

              const isStatusLoading =
                statusLoadingId === item.id;

              const isDeleting =
                deletingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 px-4 py-4 transition hover:border-slate-200 hover:bg-slate-50/50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {item.project ||
                            "Devis"}
                        </p>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status ||
                            "Brouillon"}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.number ||
                          "Sans numéro"}{" "}
                        ·{" "}
                        {new Date(
                          item.created_at
                        ).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>

                      {client && (
                        <>
                          <p className="mt-2 text-xs font-medium text-slate-600">
                            Client :{" "}
                            {client.name}
                            {client.company
                              ? ` — ${client.company}`
                              : ""}
                          </p>

                          {client.email && (
                            <p className="mt-1 text-xs text-slate-500">
                              {client.email}
                            </p>
                          )}
                        </>
                      )}

                      {item.description && (
                        <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                          {item.description}
                        </p>
                      )}

                      {item.validity_date && (
                        <p className="mt-2 text-xs text-slate-500">
                          Valable jusqu&apos;au{" "}
                          {new Date(
                            item.validity_date
                          ).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 lg:text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {formatAmount(
                          item.amount
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        HT · TVA{" "}
                        {Number(
                          item.tva || 0
                        )}{" "}
                        %
                      </p>

                      <p className="mt-1 text-xs font-semibold text-blue-600">
                        {formatAmount(
                          calculateTtc(item)
                        )}{" "}
                        TTC
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <div className="relative">
                      <select
                        value={item.status || "Brouillon"}
                        onChange={(event) =>
                          updateDevisStatus(
                            item,
                            event.target.value
                          )
                        }
                        disabled={
                          isStatusLoading ||
                          isDeleting ||
                          isEmailLoading
                        }
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-700 outline-none transition hover:border-blue-200 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Modifier le statut"
                      >
                        <option value="Brouillon">Brouillon</option>
                        <option value="Envoyé">Envoyé</option>
                        <option value="Accepté">Accepté</option>
                        <option value="Refusé">Refusé</option>
                      </select>

                      {isStatusLoading && (
                        <Loader2 className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 animate-spin text-blue-600" />
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={
                        isPdfLoading ||
                        isEmailLoading ||
                        isDeleting ||
                        !client
                      }
                      onClick={() =>
                        preparePdf(
                          item,
                          "preview"
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPdfLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}

                      Aperçu PDF
                    </button>

                    <button
                      type="button"
                      disabled={
                        isPdfLoading ||
                        isEmailLoading ||
                        isDeleting ||
                        !client
                      }
                      onClick={() =>
                        preparePdf(
                          item,
                          "download"
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPdfLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}

                      Télécharger PDF
                    </button>

                    <button
                      type="button"
                      disabled={
                        isEmailLoading ||
                        isPdfLoading ||
                        isDeleting ||
                        !client ||
                        !client.email
                      }
                      onClick={() =>
                        sendDevisByEmail(item)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isEmailLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}

                      {isEmailLoading
                        ? "Envoi..."
                        : "Envoyer par email"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteDevis(item)}
                      disabled={
                        isDeleting ||
                        isPdfLoading ||
                        isEmailLoading ||
                        isStatusLoading
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}

                      {isDeleting
                        ? "Suppression..."
                        : "Supprimer"}
                    </button>

                    {!client && (
                      <p className="text-[11px] text-red-500">
                        Aucun client associé :
                        actions indisponibles.
                      </p>
                    )}

                    {client && !client.email && (
                      <p className="text-[11px] text-amber-600">
                        Ajoute un email à ce client
                        pour pouvoir envoyer le devis.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ReceiptText,
  Euro,
  CircleCheck,
  Clock3,
  Plus,
  X,
  Eye,
  Download,
  Loader2,
  Send,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

import {
  downloadFacturePdf,
  previewFacturePdf,
  type FacturePdfCompany,
} from "../../../lib/facturePdf";

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

type FactureRow = {
  id: string;
  organization_id: string;
  client_id: string | null;
  number: string;
  title: string;
  description: string | null;
  amount: number;
  tva: number;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
};

const statuses = [
  "Brouillon",
  "Envoyée",
  "Payée",
  "En retard",
  "Annulée",
];

export default function FacturesPage() {
  const [factures, setFactures] = useState<FactureRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);

  const [companySettings, setCompanySettings] =
    useState<FacturePdfCompany>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [pdfLoadingId, setPdfLoadingId] =
    useState<string | null>(null);

  const [emailLoadingId, setEmailLoadingId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("recent");

  const [form, setForm] = useState({
    clientId: "",
    title: "",
    description: "",
    amount: "",
    tva: "20",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
  });

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

    await Promise.all([
      loadClients(organizationId),
      loadFactures(organizationId),
      loadCompanySettings(organizationId),
    ]);

    setLoading(false);
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

  async function loadFactures(
    providedOrganizationId?: string
  ) {
    const organizationId =
      providedOrganizationId ||
      (await getOrganizationId());

    if (!organizationId) return;

    const { data, error } = await supabase
      .from("factures")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Erreur chargement factures :",
        error
      );
      return;
    }

    setFactures((data || []) as FactureRow[]);
  }

  async function loadCompanySettings(
    providedOrganizationId?: string
  ) {
    const organizationId =
      providedOrganizationId ||
      (await getOrganizationId());

    if (!organizationId) return;

    const {
      data: settings,
      error: settingsError,
    } = await supabase
      .from("organization_settings")
      .select(
        "company_name,legal_name,siret,vat_number,phone,email,website,address,city,postal_code"
      )
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (settingsError) {
      console.error(
        "Erreur paramètres entreprise :",
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

  async function createFacture() {
    if (!form.clientId) {
      alert("Sélectionne un client.");
      return;
    }

    if (!form.title.trim()) {
      alert("Ajoute un titre à la facture.");
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
        alert("Organisation introuvable.");
        return;
      }

      const number = `FAC-${new Date().getFullYear()}-${Date.now()
        .toString()
        .slice(-6)}`;

      const { error } = await supabase
        .from("factures")
        .insert({
          organization_id: organizationId,
          client_id: form.clientId,
          number,
          title: form.title.trim(),
          description:
            form.description.trim() || null,
          amount: Number(form.amount),
          tva: Number(form.tva),
          status: "Brouillon",
          issue_date: form.issueDate || null,
          due_date: form.dueDate || null,
        });

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      setForm({
        clientId: "",
        title: "",
        description: "",
        amount: "",
        tva: "20",
        issueDate: new Date()
          .toISOString()
          .slice(0, 10),
        dueDate: "",
      });

      setModalOpen(false);

      await loadFactures(organizationId);

      alert("Facture créée.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    id: string,
    status: string
  ) {
    const updateData: {
      status: string;
      paid_at?: string | null;
    } = {
      status,
    };

    if (status === "Payée") {
      updateData.paid_at =
        new Date().toISOString();
    } else {
      updateData.paid_at = null;
    }

    const { error } = await supabase
      .from("factures")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadFactures();
  }

  function getClient(clientId: string | null) {
    if (!clientId) return null;

    return (
      clients.find(
        (client) => client.id === clientId
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

  function formatDate(date: string | null) {
    if (!date) return "Non définie";

    return new Date(date).toLocaleDateString(
      "fr-FR"
    );
  }

  function calculateTtc(facture: FactureRow) {
    const ht = Number(facture.amount || 0);
    const tva = Number(facture.tva || 0);

    return ht + ht * (tva / 100);
  }

  function getStatusStyle(status: string) {
    if (status === "Payée") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "Envoyée") {
      return "bg-blue-50 text-blue-700";
    }

    if (status === "En retard") {
      return "bg-red-50 text-red-700";
    }

    if (status === "Annulée") {
      return "bg-slate-100 text-slate-500";
    }

    return "bg-amber-50 text-amber-700";
  }

  async function preparePdf(
    facture: FactureRow,
    action: "preview" | "download"
  ) {
    const client = getClient(
      facture.client_id
    );

    if (!client) {
      alert(
        "Impossible de générer le PDF : aucun client n'est associé à cette facture."
      );
      return;
    }

    setPdfLoadingId(facture.id);

    try {
      const options = {
        facture: {
          id: facture.id,
          number: facture.number,
          title: facture.title,
          description: facture.description,
          amount: Number(facture.amount),
          tva: Number(facture.tva),
          status: facture.status,
          issue_date: facture.issue_date,
          due_date: facture.due_date,
          paid_at: facture.paid_at,
          created_at: facture.created_at,
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
        previewFacturePdf(options);
      } else {
        downloadFacturePdf(options);
      }
    } catch (error) {
      console.error(
        "Erreur génération facture PDF :",
        error
      );

      alert(
        "Une erreur est survenue pendant la génération du PDF."
      );
    } finally {
      setPdfLoadingId(null);
    }
  }

  async function sendFactureByEmail(
    facture: FactureRow
  ) {
    const client = getClient(
      facture.client_id
    );

    if (!client) {
      alert(
        "Aucun client n'est associé à cette facture."
      );
      return;
    }

    if (!client.email) {
      alert(
        "Ce client n'a pas d'adresse email. Ajoute son email dans sa fiche client avant d'envoyer la facture."
      );
      return;
    }

    const confirmed = window.confirm(
      `Envoyer la facture ${facture.number} à ${client.email} ?`
    );

    if (!confirmed) {
      return;
    }

    setEmailLoadingId(facture.id);

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
        `/api/factures/${facture.id}/envoyer`,
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
          "Erreur envoi facture :",
          result
        );

        alert(
          result.error ||
            "Impossible d'envoyer la facture."
        );

        return;
      }

      alert(
        result.message ||
          `Facture envoyée à ${client.email}.`
      );

      await loadFactures();
    } catch (error) {
      console.error(
        "Erreur envoi email facture :",
        error
      );

      alert(
        "Une erreur est survenue pendant l'envoi de la facture."
      );
    } finally {
      setEmailLoadingId(null);
    }
  }

  const filteredFactures = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    const result = factures.filter(
      (facture) => {
        const client = getClient(
          facture.client_id
        );

        const matchesSearch =
          !query ||
          facture.number
            .toLowerCase()
            .includes(query) ||
          facture.title
            .toLowerCase()
            .includes(query) ||
          facture.description
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
          facture.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

    return [...result].sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortBy === "amount-desc") {
        return (
          Number(b.amount) -
          Number(a.amount)
        );
      }

      if (sortBy === "amount-asc") {
        return (
          Number(a.amount) -
          Number(b.amount)
        );
      }

      if (sortBy === "due-asc") {
        if (
          !a.due_date &&
          !b.due_date
        ) {
          return 0;
        }

        if (!a.due_date) return 1;
        if (!b.due_date) return -1;

        return (
          new Date(a.due_date).getTime() -
          new Date(b.due_date).getTime()
        );
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    factures,
    clients,
    search,
    statusFilter,
    sortBy,
  ]);

  const totalAmount = useMemo(() => {
    return factures.reduce(
      (total, facture) =>
        total +
        Number(facture.amount || 0),
      0
    );
  }, [factures]);

  const paidAmount = useMemo(() => {
    return factures
      .filter(
        (facture) =>
          facture.status === "Payée"
      )
      .reduce(
        (total, facture) =>
          total +
          Number(facture.amount || 0),
        0
      );
  }, [factures]);

  const waitingAmount = useMemo(() => {
    return factures
      .filter(
        (facture) =>
          facture.status !== "Payée" &&
          facture.status !== "Annulée"
      )
      .reduce(
        (total, facture) =>
          total +
          Number(facture.amount || 0),
        0
      );
  }, [factures]);

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Factures
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gérez la facturation, les paiements et vos
            documents PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setModalOpen(true)
          }
          className="flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total factures"
          value={factures.length.toString()}
          icon={
            <ReceiptText className="h-5 w-5 text-slate-600" />
          }
        />

        <StatCard
          label="Montant facturé HT"
          value={formatAmount(totalAmount)}
          icon={
            <Euro className="h-5 w-5 text-blue-600" />
          }
        />

        <StatCard
          label="Montant encaissé HT"
          value={formatAmount(paidAmount)}
          icon={
            <CircleCheck className="h-5 w-5 text-emerald-600" />
          }
        />

        <StatCard
          label="À encaisser HT"
          value={formatAmount(waitingAmount)}
          icon={
            <Clock3 className="h-5 w-5 text-amber-600" />
          }
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Toutes les factures
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredFactures.length} résultat
              {filteredFactures.length > 1
                ? "s"
                : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
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
                setSortBy(
                  event.target.value
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >
              <option value="recent">
                Plus récentes
              </option>

              <option value="oldest">
                Plus anciennes
              </option>

              <option value="amount-desc">
                Montant décroissant
              </option>

              <option value="amount-asc">
                Montant croissant
              </option>

              <option value="due-asc">
                Échéance la plus proche
              </option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Chargement...
            </p>
          ) : filteredFactures.length ===
            0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center">
              <ReceiptText className="mx-auto h-7 w-7 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucune facture
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Créez votre première facture avec
                le bouton Nouvelle facture.
              </p>
            </div>
          ) : (
            filteredFactures.map(
              (facture) => {
                const client =
                  getClient(
                    facture.client_id
                  );

                const isPdfLoading =
                  pdfLoadingId ===
                  facture.id;

                const isEmailLoading =
                  emailLoadingId ===
                  facture.id;

                return (
                  <div
                    key={facture.id}
                    className="rounded-xl border border-slate-100 px-4 py-4 transition hover:border-slate-200 hover:bg-slate-50/50"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {facture.title}
                          </p>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusStyle(
                              facture.status
                            )}`}
                          >
                            {facture.status}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {facture.number}
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

                        {facture.description && (
                          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                            {facture.description}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                          <span>
                            Émise :{" "}
                            {formatDate(
                              facture.issue_date
                            )}
                          </span>

                          <span>
                            Échéance :{" "}
                            {formatDate(
                              facture.due_date
                            )}
                          </span>

                          {facture.paid_at && (
                            <span className="font-medium text-emerald-600">
                              Payée le{" "}
                              {new Date(
                                facture.paid_at
                              ).toLocaleDateString(
                                "fr-FR"
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="sm:text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {formatAmount(
                              facture.amount
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            HT · TVA{" "}
                            {Number(
                              facture.tva ||
                                0
                            )}{" "}
                            %
                          </p>

                          <p className="mt-1 text-xs font-semibold text-blue-600">
                            {formatAmount(
                              calculateTtc(
                                facture
                              )
                            )}{" "}
                            TTC
                          </p>
                        </div>

                        <select
                          value={
                            facture.status
                          }
                          onChange={(event) =>
                            updateStatus(
                              facture.id,
                              event.target
                                .value
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
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        disabled={
                          isPdfLoading ||
                          isEmailLoading ||
                          !client
                        }
                        onClick={() =>
                          preparePdf(
                            facture,
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
                          !client
                        }
                        onClick={() =>
                          preparePdf(
                            facture,
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
                          !client ||
                          !client.email
                        }
                        onClick={() =>
                          sendFactureByEmail(
                            facture
                          )
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

                      {!client && (
                        <p className="text-[11px] text-red-500">
                          Aucun client associé :
                          actions indisponibles.
                        </p>
                      )}

                      {client &&
                        !client.email && (
                          <p className="text-[11px] text-amber-600">
                            Ajoute un email au client
                            pour pouvoir envoyer la
                            facture.
                          </p>
                        )}
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Nouvelle facture
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Créez une facture pour un
                  client.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Client
                </label>

                <select
                  value={form.clientId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      clientId:
                        event.target
                          .value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">
                    Sélectionner un client
                  </option>

                  {clients.map(
                    (client) => (
                      <option
                        key={
                          client.id
                        }
                        value={
                          client.id
                        }
                      >
                        {client.name}
                        {client.company
                          ? ` — ${client.company}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Objet de la facture
                </label>

                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title:
                        event.target
                          .value,
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
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target
                          .value,
                    })
                  }
                  rows={3}
                  placeholder="Description de la prestation..."
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
                    value={
                      form.amount
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        amount:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="5000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    TVA
                  </label>

                  <select
                    value={form.tva}
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        tva:
                          event
                            .target
                            .value,
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

              {form.amount &&
                Number(
                  form.amount
                ) > 0 && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Total HT
                      </span>

                      <span>
                        {formatAmount(
                          Number(
                            form.amount
                          )
                        )}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        TVA {form.tva} %
                      </span>

                      <span>
                        {formatAmount(
                          Number(
                            form.amount
                          ) *
                            (Number(
                              form.tva
                            ) /
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
                            Number(
                              form.amount
                            ) *
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

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Date
                    d&apos;émission
                  </label>

                  <input
                    type="date"
                    value={
                      form.issueDate
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        issueDate:
                          event
                            .target
                            .value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Date
                    d&apos;échéance
                  </label>

                  <input
                    type="date"
                    value={
                      form.dueDate
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        dueDate:
                          event
                            .target
                            .value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(false)
                  }
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={
                    createFacture
                  }
                  disabled={saving}
                  className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Création..."
                    : "Créer la facture"}
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
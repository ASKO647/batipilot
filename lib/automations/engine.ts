import { supabaseAdmin } from "@/lib/supabase/admin";

type TriggerType =
  | "Nouveau client"
  | "Nouveau devis"
  | "Devis envoyé"
  | "Devis accepté"
  | "Devis refusé"
  | "Relance en retard"
  | "Rendez-vous proche"
  | "Chantier créé"
  | "Échéance chantier proche"
  | "Chantier terminé";

type ActionType =
  | "Créer une relance"
  | "Créer un rendez-vous"
  | "Créer un chantier";

type Automation = {
  id: string;
  organization_id: string;
  name: string;
  trigger_type: TriggerType;
  delay_days: number;
  action_type: ActionType;
  active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
};

type Candidate = {
  id: string;
  label: string;
  clientId?: string | null;
  devisId?: string | null;
  chantierId?: string | null;
};

export type AutomationRunResult = {
  automationId: string;
  automationName: string;
  organizationId: string;
  candidates: number;
  executed: number;
  ignored: number;
  errors: number;
};

/* =========================================================
   Vérifie si cette automatisation a déjà réussi
   sur cet élément.
========================================================= */

async function alreadyExecuted(
  automationId: string,
  entityId: string
) {
  const { data, error } = await supabaseAdmin
    .from("automation_executions")
    .select("id")
    .eq("automation_id", automationId)
    .eq("entity_id", entityId)
    .eq("result", "Exécutée")
    .limit(1);

  if (error) {
    console.error(
      "[AUTOMATIONS] Erreur vérification historique:",
      error
    );

    return false;
  }

  return Boolean(data && data.length > 0);
}

/* =========================================================
   Recherche les éléments correspondant au déclencheur.
========================================================= */

async function findCandidates(
  automation: Automation
): Promise<Candidate[]> {
  const organizationId =
    automation.organization_id;

  const now = new Date();

  const delay = Math.max(
    automation.delay_days || 0,
    0
  );

  /* -------------------------
     Nouveau client
  ------------------------- */

  if (
    automation.trigger_type ===
    "Nouveau client"
  ) {
    const since = new Date();

    since.setDate(
      since.getDate() -
        Math.max(delay, 1)
    );

    const { data, error } =
      await supabaseAdmin
        .from("clients")
        .select(
          "id,name,company,created_at"
        )
        .eq(
          "organization_id",
          organizationId
        )
        .gte(
          "created_at",
          since.toISOString()
        );

    if (error) {
      throw error;
    }

    return (data || []).map(
      (item) => ({
        id: item.id,

        label: item.company
          ? `${item.name} · ${item.company}`
          : item.name,

        clientId: item.id,
      })
    );
  }

  /* -------------------------
     Devis
  ------------------------- */

  if (
    automation.trigger_type ===
      "Nouveau devis" ||
    automation.trigger_type ===
      "Devis envoyé" ||
    automation.trigger_type ===
      "Devis accepté" ||
    automation.trigger_type ===
      "Devis refusé"
  ) {
    let query = supabaseAdmin
      .from("devis")
      .select(
        "id,client_id,number,project,status,created_at"
      )
      .eq(
        "organization_id",
        organizationId
      );

    if (
      automation.trigger_type ===
      "Devis envoyé"
    ) {
      query = query.eq(
        "status",
        "Envoyé"
      );
    }

    if (
      automation.trigger_type ===
      "Devis accepté"
    ) {
      query = query.eq(
        "status",
        "Accepté"
      );
    }

    if (
      automation.trigger_type ===
      "Devis refusé"
    ) {
      query = query.eq(
        "status",
        "Refusé"
      );
    }

    if (
      automation.trigger_type ===
      "Nouveau devis"
    ) {
      const since = new Date();

      since.setDate(
        since.getDate() -
          Math.max(delay, 1)
      );

      query = query.gte(
        "created_at",
        since.toISOString()
      );
    }

    const { data, error } =
      await query;

    if (error) {
      throw error;
    }

    return (data || []).map(
      (item) => ({
        id: item.id,

        label: `${item.number}${
          item.project
            ? ` · ${item.project}`
            : ""
        }`,

        clientId: item.client_id,
        devisId: item.id,
      })
    );
  }

  /* -------------------------
     Relance en retard
  ------------------------- */

  if (
    automation.trigger_type ===
    "Relance en retard"
  ) {
    const { data, error } =
      await supabaseAdmin
        .from("relances")
        .select(
          "id,client_id,devis_id,title,scheduled_at,status"
        )
        .eq(
          "organization_id",
          organizationId
        )
        .lt(
          "scheduled_at",
          now.toISOString()
        )
        .in(
          "status",
          ["À faire", "En cours"]
        );

    if (error) {
      throw error;
    }

    return (data || []).map(
      (item) => ({
        id: item.id,
        label: item.title,
        clientId: item.client_id,
        devisId: item.devis_id,
      })
    );
  }

  /* -------------------------
     Rendez-vous proche
  ------------------------- */

  if (
    automation.trigger_type ===
    "Rendez-vous proche"
  ) {
    const end = new Date();

    end.setDate(
      end.getDate() +
        Math.max(delay, 1)
    );

    const { data, error } =
      await supabaseAdmin
        .from("rendez_vous")
        .select(
          "id,client_id,chantier_id,title,start_at,status"
        )
        .eq(
          "organization_id",
          organizationId
        )
        .gte(
          "start_at",
          now.toISOString()
        )
        .lte(
          "start_at",
          end.toISOString()
        )
        .neq(
          "status",
          "Annulé"
        );

    if (error) {
      throw error;
    }

    return (data || []).map(
      (item) => ({
        id: item.id,
        label: item.title,
        clientId: item.client_id,
        chantierId:
          item.chantier_id,
      })
    );
  }

  /* -------------------------
     Chantiers
  ------------------------- */

  if (
    automation.trigger_type ===
      "Chantier créé" ||
    automation.trigger_type ===
      "Échéance chantier proche" ||
    automation.trigger_type ===
      "Chantier terminé"
  ) {
    let query = supabaseAdmin
      .from("chantiers")
      .select(
        "id,client_id,devis_id,name,status,end_date,created_at"
      )
      .eq(
        "organization_id",
        organizationId
      );

    if (
      automation.trigger_type ===
      "Chantier créé"
    ) {
      const since = new Date();

      since.setDate(
        since.getDate() -
          Math.max(delay, 1)
      );

      query = query.gte(
        "created_at",
        since.toISOString()
      );
    }

    if (
      automation.trigger_type ===
      "Chantier terminé"
    ) {
      query = query.eq(
        "status",
        "Terminé"
      );
    }

    if (
      automation.trigger_type ===
      "Échéance chantier proche"
    ) {
      const today = new Date()
        .toISOString()
        .slice(0, 10);

      const end = new Date();

      end.setDate(
        end.getDate() +
          Math.max(delay, 1)
      );

      query = query
        .gte(
          "end_date",
          today
        )
        .lte(
          "end_date",
          end
            .toISOString()
            .slice(0, 10)
        )
        .neq(
          "status",
          "Terminé"
        )
        .neq(
          "status",
          "Annulé"
        );
    }

    const { data, error } =
      await query;

    if (error) {
      throw error;
    }

    return (data || []).map(
      (item) => ({
        id: item.id,
        label: item.name,
        clientId: item.client_id,
        devisId: item.devis_id,
        chantierId: item.id,
      })
    );
  }

  return [];
}

/* =========================================================
   Exécute l'action de l'automatisation.
========================================================= */

async function executeAction(
  automation: Automation,
  candidate: Candidate
) {
  const organizationId =
    automation.organization_id;

  const delay = Math.max(
    automation.delay_days || 0,
    0
  );

  /* -------------------------
     Créer une relance
  ------------------------- */

  if (
    automation.action_type ===
    "Créer une relance"
  ) {
    const scheduled = new Date();

    scheduled.setDate(
      scheduled.getDate() + delay
    );

    const { error } =
      await supabaseAdmin
        .from("relances")
        .insert({
          organization_id:
            organizationId,

          client_id:
            candidate.clientId ||
            null,

          devis_id:
            candidate.devisId ||
            null,

          title:
            `Automatisation · ${automation.name}`,

          description:
            `Relance créée automatiquement suite à : ${automation.trigger_type}`,

          channel:
            "Appel téléphonique",

          scheduled_at:
            scheduled.toISOString(),

          status: "À faire",

          created_by_ai: false,
        });

    if (error) {
      throw error;
    }

    return true;
  }

  /* -------------------------
     Créer un rendez-vous
  ------------------------- */

  if (
    automation.action_type ===
    "Créer un rendez-vous"
  ) {
    const start = new Date();

    start.setDate(
      start.getDate() +
        Math.max(delay, 1)
    );

    start.setHours(
      9,
      0,
      0,
      0
    );

    const end = new Date(start);

    end.setMinutes(
      end.getMinutes() + 30
    );

    const { error } =
      await supabaseAdmin
        .from("rendez_vous")
        .insert({
          organization_id:
            organizationId,

          client_id:
            candidate.clientId ||
            null,

          chantier_id:
            candidate.chantierId ||
            null,

          title:
            `Suivi automatique · ${candidate.label}`,

          description:
            `Rendez-vous créé par l’automatisation « ${automation.name} ».`,

          start_at:
            start.toISOString(),

          end_at:
            end.toISOString(),

          status: "Prévu",

          created_by_ai: false,
        });

    if (error) {
      throw error;
    }

    return true;
  }

  /* -------------------------
     Créer un chantier
  ------------------------- */

  if (
    automation.action_type ===
    "Créer un chantier"
  ) {
    if (!candidate.clientId) {
      return false;
    }

    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from("chantiers")
      .select("id")
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "client_id",
        candidate.clientId
      )
      .neq(
        "status",
        "Annulé"
      )
      .limit(1);

    if (existingError) {
      throw existingError;
    }

    if (
      existing &&
      existing.length > 0
    ) {
      return false;
    }

    const { error } =
      await supabaseAdmin
        .from("chantiers")
        .insert({
          organization_id:
            organizationId,

          client_id:
            candidate.clientId,

          devis_id:
            candidate.devisId ||
            null,

          name: candidate.label
            ? `Chantier · ${candidate.label}`
            : "Nouveau chantier",

          status: "À venir",

          progress: 0,
        });

    if (error) {
      throw error;
    }

    return true;
  }

  return false;
}

/* =========================================================
   Historique d'exécution.
========================================================= */

async function logExecution(
  automation: Automation,
  candidate: Candidate,
  result:
    | "Exécutée"
    | "Ignorée"
    | "Erreur"
) {
  const { error } =
    await supabaseAdmin
      .from(
        "automation_executions"
      )
      .insert({
        organization_id:
          automation.organization_id,

        automation_id:
          automation.id,

        entity_id:
          candidate.id,

        entity_label:
          candidate.label,

        action_type:
          automation.action_type,

        result,
      });

  if (error) {
    console.error(
      "[AUTOMATIONS] Impossible d'enregistrer l'historique:",
      error
    );
  }
}

/* =========================================================
   Exécute UNE automatisation.
========================================================= */

export async function runServerAutomation(
  automation: Automation
): Promise<AutomationRunResult> {
  const result: AutomationRunResult =
    {
      automationId:
        automation.id,

      automationName:
        automation.name,

      organizationId:
        automation.organization_id,

      candidates: 0,
      executed: 0,
      ignored: 0,
      errors: 0,
    };

  if (!automation.active) {
    return result;
  }

  console.log(
    `[AUTOMATIONS] Analyse : ${automation.name}`
  );

  const candidates =
    await findCandidates(
      automation
    );

  result.candidates =
    candidates.length;

  for (
    const candidate of candidates
  ) {
    try {
      const exists =
        await alreadyExecuted(
          automation.id,
          candidate.id
        );

      if (exists) {
        continue;
      }

      const success =
        await executeAction(
          automation,
          candidate
        );

      if (success) {
        result.executed += 1;

        await logExecution(
          automation,
          candidate,
          "Exécutée"
        );
      } else {
        result.ignored += 1;

        await logExecution(
          automation,
          candidate,
          "Ignorée"
        );
      }
    } catch (error) {
      result.errors += 1;

      console.error(
        `[AUTOMATIONS] Erreur sur ${candidate.label}:`,
        error
      );

      await logExecution(
        automation,
        candidate,
        "Erreur"
      );
    }
  }

  const nextExecutionCount =
    (automation.execution_count ||
      0) + result.executed;

  const { error: updateError } =
    await supabaseAdmin
      .from("automation_rules")
      .update({
        execution_count:
          nextExecutionCount,

        last_executed_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        automation.id
      )
      .eq(
        "organization_id",
        automation.organization_id
      );

  if (updateError) {
    console.error(
      "[AUTOMATIONS] Erreur mise à jour règle:",
      updateError
    );
  }

  console.log(
    `[AUTOMATIONS] ${automation.name} terminé : ${result.executed} exécutée(s), ${result.ignored} ignorée(s), ${result.errors} erreur(s).`
  );

  return result;
}

/* =========================================================
   Exécute TOUTES les automatisations actives,
   pour TOUTES les organisations.

   Cette fonction sera appelée par notre tâche serveur.
========================================================= */

export async function runAllServerAutomations() {
  console.log(
    "[AUTOMATIONS] Démarrage du moteur BatiPilot"
  );

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("automation_rules")
    .select("*")
    .eq("active", true)
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  if (error) {
    console.error(
      "[AUTOMATIONS] Impossible de charger les règles:",
      error
    );

    throw error;
  }

  const automations =
    (data || []) as Automation[];

  const results:
    AutomationRunResult[] = [];

  for (
    const automation of automations
  ) {
    try {
      const result =
        await runServerAutomation(
          automation
        );

      results.push(result);
    } catch (error) {
      console.error(
        `[AUTOMATIONS] Échec règle ${automation.name}:`,
        error
      );

      results.push({
        automationId:
          automation.id,

        automationName:
          automation.name,

        organizationId:
          automation.organization_id,

        candidates: 0,
        executed: 0,
        ignored: 0,
        errors: 1,
      });
    }
  }

  const summary = {
    automations:
      results.length,

    candidates:
      results.reduce(
        (total, item) =>
          total +
          item.candidates,
        0
      ),

    executed:
      results.reduce(
        (total, item) =>
          total +
          item.executed,
        0
      ),

    ignored:
      results.reduce(
        (total, item) =>
          total +
          item.ignored,
        0
      ),

    errors:
      results.reduce(
        (total, item) =>
          total + item.errors,
        0
      ),

    results,
  };

  console.log(
    "[AUTOMATIONS] Moteur terminé",
    summary
  );

  return summary;
}
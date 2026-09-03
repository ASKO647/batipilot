import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "La clé OPENAI_API_KEY n'est pas configurée.",
        },
        { status: 500 }
      );
    }

    const authHeader =
      request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error:
            "Utilisateur non authentifié.",
        },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    /*
      IMPORTANT :
      ce client Supabase reçoit le token de l'utilisateur.
      Les règles RLS peuvent donc reconnaître auth.uid().
    */
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error(
        "Erreur utilisateur :",
        userError
      );

      return NextResponse.json(
        {
          error: "Session invalide.",
        },
        { status: 401 }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(
        "Erreur profil :",
        profileError
      );

      return NextResponse.json(
        {
          error:
            "Impossible de charger le profil utilisateur.",
        },
        { status: 500 }
      );
    }

    if (!profile?.organization_id) {
      return NextResponse.json(
        {
          error:
            "Aucune organisation n'est associée à ce compte.",
        },
        { status: 403 }
      );
    }

    const organizationId =
      profile.organization_id;

    const {
      data: chantier,
      error: chantierError,
    } = await supabase
      .from("chantiers")
      .select("*")
      .eq("id", id)
      .eq(
        "organization_id",
        organizationId
      )
      .single();

    if (chantierError || !chantier) {
      console.error(
        "Erreur chantier :",
        chantierError
      );

      return NextResponse.json(
        {
          error: "Chantier introuvable.",
        },
        { status: 404 }
      );
    }

    let client = null;

    if (chantier.client_id) {
      const {
        data: clientData,
        error: clientError,
      } = await supabase
        .from("clients")
        .select(
          "name, company, email, phone"
        )
        .eq("id", chantier.client_id)
        .eq(
          "organization_id",
          organizationId
        )
        .single();

      if (clientError) {
        console.error(
          "Erreur client :",
          clientError
        );
      } else {
        client = clientData;
      }
    }

    const {
      data: interventions,
      error: interventionsError,
    } = await supabase
      .from("chantier_interventions")
      .select(
        "type, title, content, intervention_date"
      )
      .eq("chantier_id", id)
      .eq(
        "organization_id",
        organizationId
      )
      .order("intervention_date", {
        ascending: true,
      });

    if (interventionsError) {
      console.error(
        "Erreur interventions :",
        interventionsError
      );
    }

    const {
      data: photos,
      error: photosError,
    } = await supabase
      .from("chantier_photos")
      .select(
        "file_name, caption, created_at"
      )
      .eq("chantier_id", id)
      .eq(
        "organization_id",
        organizationId
      )
      .order("created_at", {
        ascending: true,
      });

    if (photosError) {
      console.error(
        "Erreur photos :",
        photosError
      );
    }

    const {
      data: documents,
      error: documentsError,
    } = await supabase
      .from("chantier_documents")
      .select(
        "file_name, category, note, created_at"
      )
      .eq("chantier_id", id)
      .eq(
        "organization_id",
        organizationId
      )
      .order("created_at", {
        ascending: true,
      });

    if (documentsError) {
      console.error(
        "Erreur documents :",
        documentsError
      );
    }

    const prompt = `
Tu es BatiPilot, un assistant IA spécialisé dans le suivi des chantiers du bâtiment.

Génère un compte-rendu professionnel à partir des données fournies.

Règles :
- N'invente aucune information.
- Utilise uniquement les données disponibles.
- Identifie les avancées importantes.
- Signale les incidents et points de vigilance.
- Reste synthétique et professionnel.
- Le texte doit être compréhensible par un artisan, un dirigeant BTP ou un client.
- Ne crée pas de tableau.

Structure :

RÉSUMÉ GÉNÉRAL

AVANCEMENT

ÉLÉMENTS IMPORTANTS

POINTS DE VIGILANCE

PROCHAINES ACTIONS


CHANTIER

Nom : ${chantier.name}

Statut : ${chantier.status}

Progression : ${chantier.progress} %

Budget : ${
      chantier.budget ??
      "Non renseigné"
    }

Date de début : ${
      chantier.start_date ??
      "Non renseignée"
    }

Date de fin : ${
      chantier.end_date ??
      "Non renseignée"
    }

Adresse :
${
  [
    chantier.address,
    chantier.postal_code,
    chantier.city,
  ]
    .filter(Boolean)
    .join(" ") || "Non renseignée"
}

Description :
${
  chantier.description ||
  "Aucune description"
}

CLIENT

${
  client
    ? JSON.stringify(client, null, 2)
    : "Aucun client associé"
}

NOTES ET INTERVENTIONS

${
  interventions?.length
    ? JSON.stringify(
        interventions,
        null,
        2
      )
    : "Aucune intervention enregistrée"
}

PHOTOS

${
  photos?.length
    ? JSON.stringify(
        photos,
        null,
        2
      )
    : "Aucune photo enregistrée"
}

DOCUMENTS

${
  documents?.length
    ? JSON.stringify(
        documents,
        null,
        2
      )
    : "Aucun document enregistré"
}
`;

    const response =
      await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
      });

    const summary =
      response.output_text?.trim();

    if (!summary) {
      return NextResponse.json(
        {
          error:
            "L'IA n'a pas généré de compte-rendu.",
        },
        { status: 500 }
      );
    }

    const {
      data: updatedChantier,
      error: updateError,
    } = await supabase
      .from("chantiers")
      .update({
        ai_summary: summary,
        ai_generated: true,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .eq(
        "organization_id",
        organizationId
      )
      .select("ai_summary")
      .single();

    if (
      updateError ||
      !updatedChantier
    ) {
      console.error(
        "Erreur enregistrement résumé :",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Le compte-rendu a été généré mais n'a pas pu être enregistré.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summary:
        updatedChantier.ai_summary,
    });
  } catch (error) {
    console.error(
      "Erreur génération compte-rendu IA :",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur interne.",
      },
      { status: 500 }
    );
  }
}
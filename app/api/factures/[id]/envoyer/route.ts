import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

import { generateFacturePdf } from "@/lib/facturePdf";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Identifiant de la facture manquant.",
        },
        {
          status: 400,
        }
      );
    }

    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Utilisateur non authentifié.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken = authorization.replace(
      "Bearer ",
      ""
    );

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error:
            "Configuration Supabase incorrecte.",
        },
        {
          status: 500,
        }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Configuration Resend incorrecte.",
        },
        {
          status: 500,
        }
      );
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json(
        {
          error:
            "Adresse d'expédition non configurée.",
        },
        {
          status: 500,
        }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },

        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    /*
    =====================================================
    AUTHENTIFICATION
    =====================================================
    */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      console.error(
        "Erreur authentification :",
        userError
      );

      return NextResponse.json(
        {
          error:
            "Session invalide ou expirée.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    =====================================================
    ORGANISATION
    =====================================================
    */

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile?.organization_id
    ) {
      console.error(
        "Erreur profil :",
        profileError
      );

      return NextResponse.json(
        {
          error:
            "Organisation introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    const organizationId =
      profile.organization_id;

    /*
    =====================================================
    FACTURE
    =====================================================
    */

    const {
      data: facture,
      error: factureError,
    } = await supabase
      .from("factures")
      .select("*")
      .eq("id", id)
      .eq(
        "organization_id",
        organizationId
      )
      .single();

    if (factureError || !facture) {
      console.error(
        "Erreur facture :",
        factureError
      );

      return NextResponse.json(
        {
          error:
            "Facture introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    if (!facture.client_id) {
      return NextResponse.json(
        {
          error:
            "Aucun client n'est associé à cette facture.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    CLIENT
    =====================================================
    */

    const {
      data: client,
      error: clientError,
    } = await supabase
      .from("clients")
      .select(
        `
        id,
        name,
        company,
        email,
        phone,
        address,
        city,
        postal_code
        `
      )
      .eq("id", facture.client_id)
      .eq(
        "organization_id",
        organizationId
      )
      .single();

    if (clientError || !client) {
      console.error(
        "Erreur client :",
        clientError
      );

      return NextResponse.json(
        {
          error:
            "Client introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    if (!client.email) {
      return NextResponse.json(
        {
          error:
            "Ce client n'a pas d'adresse email.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    PARAMÈTRES ENTREPRISE
    =====================================================
    */

    const {
      data: settings,
      error: settingsError,
    } = await supabase
      .from("organization_settings")
      .select(
        `
        company_name,
        legal_name,
        siret,
        vat_number,
        phone,
        email,
        website,
        address,
        city,
        postal_code
        `
      )
      .eq(
        "organization_id",
        organizationId
      )
      .maybeSingle();

    if (settingsError) {
      console.error(
        "Erreur paramètres entreprise :",
        settingsError
      );
    }

    const {
      data: organization,
      error: organizationError,
    } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle();

    if (organizationError) {
      console.error(
        "Erreur organisation :",
        organizationError
      );
    }

    const company = {
      company_name:
        settings?.company_name ||
        organization?.name ||
        "Mon entreprise",

      legal_name:
        settings?.legal_name || null,

      siret:
        settings?.siret || null,

      vat_number:
        settings?.vat_number || null,

      phone:
        settings?.phone || null,

      email:
        settings?.email || null,

      website:
        settings?.website || null,

      address:
        settings?.address || null,

      city:
        settings?.city || null,

      postal_code:
        settings?.postal_code || null,
    };

    /*
    =====================================================
    GÉNÉRATION PDF
    =====================================================
    */

    const pdf = generateFacturePdf({
      facture: {
        id: facture.id,

        number:
          facture.number || "Facture",

        title:
          facture.title || "Prestation",

        description:
          facture.description,

        amount: Number(
          facture.amount || 0
        ),

        tva: Number(
          facture.tva || 0
        ),

        status:
          facture.status,

        issue_date:
          facture.issue_date,

        due_date:
          facture.due_date,

        paid_at:
          facture.paid_at,

        created_at:
          facture.created_at,
      },

      client: {
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        postal_code:
          client.postal_code,
      },

      company,
    });

    const pdfArrayBuffer =
      pdf.output("arraybuffer");

    const pdfBuffer =
      Buffer.from(pdfArrayBuffer);

    /*
    =====================================================
    INFORMATIONS EMAIL
    =====================================================
    */

    const number =
      facture.number || "Facture";

    const title =
      facture.title || "Prestation";

    const companyName =
      company.company_name ||
      company.legal_name ||
      "BatiPilot";

    const clientName =
      client.name || "Client";

    const amountHt =
      Number(facture.amount || 0);

    const tva =
      Number(facture.tva || 0);

    const amountTtc =
      amountHt +
      amountHt * (tva / 100);

    const formattedAmount =
      amountTtc.toLocaleString(
        "fr-FR",
        {
          style: "currency",
          currency: "EUR",
        }
      );

    const dueDate =
      facture.due_date
        ? new Date(
            facture.due_date
          ).toLocaleDateString(
            "fr-FR"
          )
        : null;

    /*
    =====================================================
    ENVOI RESEND
    =====================================================
    */

    const fromEmail =
      process.env.RESEND_FROM_EMAIL;

    const {
      data,
      error: emailError,
    } = await resend.emails.send({
      from: `BatiPilot <${fromEmail}>`,

      to: [client.email],

      subject: `${number} - ${companyName}`,

      html: `
        <!DOCTYPE html>

        <html lang="fr">
          <head>
            <meta charset="UTF-8" />
          </head>

          <body
            style="
              margin:0;
              padding:0;
              background:#f8fafc;
              font-family:Arial,Helvetica,sans-serif;
              color:#0f172a;
            "
          >
            <div
              style="
                max-width:620px;
                margin:0 auto;
                padding:32px 20px;
              "
            >
              <div
                style="
                  background:#ffffff;
                  border:1px solid #e2e8f0;
                  border-radius:16px;
                  overflow:hidden;
                "
              >

                <div
                  style="
                    padding:28px 32px;
                    border-bottom:1px solid #e2e8f0;
                  "
                >
                  <div
                    style="
                      font-size:20px;
                      font-weight:700;
                    "
                  >
                    ${companyName}
                  </div>

                  <div
                    style="
                      margin-top:6px;
                      color:#64748b;
                      font-size:13px;
                    "
                  >
                    Facture ${number}
                  </div>
                </div>

                <div
                  style="
                    padding:32px;
                  "
                >
                  <p
                    style="
                      margin:0 0 18px;
                      font-size:15px;
                      line-height:1.6;
                    "
                  >
                    Bonjour ${clientName},
                  </p>

                  <p
                    style="
                      margin:0 0 18px;
                      font-size:15px;
                      line-height:1.6;
                      color:#475569;
                    "
                  >
                    Veuillez trouver en pièce jointe
                    notre facture concernant
                    <strong>${title}</strong>.
                  </p>

                  <div
                    style="
                      margin:24px 0;
                      padding:18px;
                      background:#f8fafc;
                      border-radius:10px;
                    "
                  >
                    <div
                      style="
                        color:#64748b;
                        font-size:12px;
                      "
                    >
                      Montant TTC
                    </div>

                    <div
                      style="
                        margin-top:5px;
                        color:#2563eb;
                        font-size:22px;
                        font-weight:700;
                      "
                    >
                      ${formattedAmount}
                    </div>

                    ${
                      dueDate
                        ? `
                          <div
                            style="
                              margin-top:10px;
                              color:#64748b;
                              font-size:12px;
                            "
                          >
                            Échéance :
                            <strong>
                              ${dueDate}
                            </strong>
                          </div>
                        `
                        : ""
                    }
                  </div>

                  <p
                    style="
                      margin:0 0 18px;
                      font-size:15px;
                      line-height:1.6;
                      color:#475569;
                    "
                  >
                    Le document PDF joint contient
                    le détail complet de la facture.
                  </p>

                  <p
                    style="
                      margin:28px 0 0;
                      font-size:15px;
                      line-height:1.6;
                    "
                  >
                    Cordialement,
                    <br />

                    <strong>
                      ${companyName}
                    </strong>
                  </p>
                </div>

                <div
                  style="
                    padding:18px 32px;
                    background:#f8fafc;
                    color:#94a3b8;
                    font-size:11px;
                  "
                >
                  Email envoyé depuis BatiPilot.
                </div>

              </div>
            </div>
          </body>
        </html>
      `,

      attachments: [
        {
          filename: `${number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    /*
    =====================================================
    ERREUR RESEND
    =====================================================
    */

    if (emailError) {
      console.error(
        "Erreur Resend :",
        emailError
      );

      return NextResponse.json(
        {
          error:
            emailError.message ||
            "L'envoi de la facture a échoué.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    =====================================================
    PASSAGE AUTOMATIQUE À "ENVOYÉE"
    =====================================================
    */

    if (facture.status === "Brouillon") {
      const {
        error: statusError,
      } = await supabase
        .from("factures")
        .update({
          status: "Envoyée",
        })
        .eq("id", facture.id)
        .eq(
          "organization_id",
          organizationId
        );

      if (statusError) {
        console.error(
          "Email envoyé mais statut facture non modifié :",
          statusError
        );
      }
    }

    /*
    =====================================================
    SUCCÈS
    =====================================================
    */

    return NextResponse.json({
      success: true,

      message:
        `Facture envoyée à ${client.email}.`,

      emailId:
        data?.id || null,
    });
  } catch (error) {
    console.error(
      "Erreur route envoi facture :",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur serveur pendant l'envoi de la facture.",
      },
      {
        status: 500,
      }
    );
  }
}
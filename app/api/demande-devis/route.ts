import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const resendApiKey =
  process.env.RESEND_API_KEY;

const resendFromEmail =
  process.env.RESEND_FROM_EMAIL ||
  "onboarding@resend.dev";

const notificationEmail =
  process.env.QUOTE_REQUEST_NOTIFICATION_EMAIL ||
  "arnollld35@gmail.com";

/*
=====================================================
UPSTASH / RATE LIMIT
=====================================================
*/

const upstashUrl =
  process.env.UPSTASH_REDIS_REST_URL;

const upstashToken =
  process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  upstashUrl && upstashToken
    ? new Redis({
        url: upstashUrl,
        token: upstashToken,
      })
    : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        5,
        "10 m"
      ),
      analytics: true,
      prefix: "batipilot:demande-devis",
    })
  : null;

/*
=====================================================
VALEURS AUTORISÉES
=====================================================
*/

const allowedNeeds = [
  "Devis & factures",
  "Suivi de chantiers",
  "Relances",
  "Appels d’offres",
  "Dossiers d’aides",
  "Automatisations",
  "Agents IA",
  "Téléphone IA",
  "Marketing IA",
  "Autre",
];

const allowedBusinessTypes = [
  "Entreprise générale du bâtiment",
  "Rénovation",
  "Maçonnerie",
  "Plomberie",
  "Électricité",
  "Chauffage / Climatisation",
  "Menuiserie",
  "Peinture",
  "Couverture / Charpente",
  "Isolation",
  "Carrelage / Sols",
  "Paysage / Extérieurs",
  "Autre",
];

const allowedCompanySizes = [
  "Indépendant",
  "2 à 5 salariés",
  "6 à 10 salariés",
  "11 à 25 salariés",
  "26 à 50 salariés",
  "51 salariés et plus",
];

/*
=====================================================
TYPE DU BODY
=====================================================
*/

type QuoteRequestBody = {
  companyName?: unknown;
  contactName?: unknown;
  email?: unknown;
  phone?: unknown;
  businessType?: unknown;
  companySize?: unknown;
  needs?: unknown;
  message?: unknown;
  privacyAccepted?: unknown;

  /*
   * Champ anti-spam invisible.
   * Un humain doit toujours l'envoyer vide.
   */
  websiteCompany?: unknown;
};

/*
=====================================================
UTILITAIRES
=====================================================
*/

function cleanText(
  value: unknown,
  maxLength = 500
) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function cleanMultilineText(
  value: unknown,
  maxLength = 3000
) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\r\n/g, "\n")
    .slice(0, maxLength);
}

function isValidEmail(email: string) {
  if (email.length > 200) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function isValidPhone(phone: string) {
  const normalized = phone.replace(
    /[\s().-]/g,
    ""
  );

  return /^\+?[0-9]{8,15}$/.test(
    normalized
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getClientIp(
  request: NextRequest
) {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for"
    );

  if (forwardedFor) {
    return (
      forwardedFor
        .split(",")[0]
        ?.trim() || "unknown"
    );
  }

  const realIp =
    request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function jsonError(
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

/*
=====================================================
POST
=====================================================
*/

export async function POST(
  request: NextRequest
) {
  try {
    /*
    =====================================================
    CONFIGURATION SERVEUR
    =====================================================
    */

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !resendApiKey
    ) {
      console.error(
        "Variables serveur manquantes pour demande-devis."
      );

      return jsonError(
        "Le service est temporairement indisponible.",
        500
      );
    }

    /*
    =====================================================
    RATE LIMIT
    =====================================================

    En production :
    - maximum 5 demandes
    - par IP
    - sur une période glissante de 10 minutes
    */

    if (ratelimit) {
      const ip = getClientIp(request);

      const result =
        await ratelimit.limit(ip);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Trop de demandes ont été envoyées. Veuillez patienter quelques minutes avant de réessayer.",
          },
          {
            status: 429,
            headers: {
              "Cache-Control": "no-store",
              "X-RateLimit-Limit":
                result.limit.toString(),
              "X-RateLimit-Remaining":
                result.remaining.toString(),
              "X-RateLimit-Reset":
                result.reset.toString(),
            },
          }
        );
      }
    } else {
      /*
       * En local, on ne bloque pas le formulaire
       * si Upstash n'est pas encore configuré.
       *
       * En production, on affiche un warning
       * afin de ne pas oublier de le configurer.
       */
      if (
        process.env.NODE_ENV ===
        "production"
      ) {
        console.warn(
          "ATTENTION : Upstash n'est pas configuré. Le rate limit demande-devis est désactivé."
        );
      }
    }

    /*
    =====================================================
    TAILLE MAXIMUM DE LA REQUÊTE
    =====================================================
    */

    const contentLength =
      request.headers.get(
        "content-length"
      );

    if (
      contentLength &&
      Number(contentLength) > 20_000
    ) {
      return jsonError(
        "La requête envoyée est trop volumineuse.",
        413
      );
    }

    /*
    =====================================================
    LECTURE DU BODY
    =====================================================
    */

    let body: QuoteRequestBody;

    try {
      body =
        (await request.json()) as QuoteRequestBody;
    } catch {
      return jsonError(
        "Les données envoyées sont invalides.",
        400
      );
    }

    /*
    =====================================================
    HONEYPOT ANTI-SPAM
    =====================================================
    */

    const honeypot = cleanText(
      body.websiteCompany,
      200
    );

    if (honeypot) {
      /*
       * On fait croire au robot
       * que la demande a été acceptée.
       *
       * Rien n'est enregistré.
       */
      return NextResponse.json(
        {
          success: true,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    /*
    =====================================================
    NETTOYAGE DES DONNÉES
    =====================================================
    */

    const companyName = cleanText(
      body.companyName,
      150
    );

    const contactName = cleanText(
      body.contactName,
      150
    );

    const email = cleanText(
      body.email,
      200
    ).toLowerCase();

    const phone = cleanText(
      body.phone,
      50
    );

    const rawBusinessType =
      cleanText(
        body.businessType,
        150
      );

    const businessType =
      allowedBusinessTypes.includes(
        rawBusinessType
      )
        ? rawBusinessType
        : "";

    const rawCompanySize =
      cleanText(
        body.companySize,
        100
      );

    const companySize =
      allowedCompanySizes.includes(
        rawCompanySize
      )
        ? rawCompanySize
        : "";

    const message =
      cleanMultilineText(
        body.message,
        3000
      );

    const privacyAccepted =
      body.privacyAccepted === true;

    const needs = Array.isArray(
      body.needs
    )
      ? Array.from(
          new Set(
            body.needs
              .filter(
                (
                  item
                ): item is string =>
                  typeof item ===
                  "string"
              )
              .map((item) =>
                cleanText(
                  item,
                  100
                )
              )
              .filter(
                (item) =>
                  item.length > 0 &&
                  allowedNeeds.includes(
                    item
                  )
              )
          )
        ).slice(0, 10)
      : [];

    /*
    =====================================================
    VALIDATION
    =====================================================
    */

    if (!companyName) {
      return jsonError(
        "Renseignez le nom de votre entreprise.",
        400
      );
    }

    if (!contactName) {
      return jsonError(
        "Renseignez votre nom.",
        400
      );
    }

    if (
      !email ||
      !isValidEmail(email)
    ) {
      return jsonError(
        "Renseignez une adresse email valide.",
        400
      );
    }

    if (
      !phone ||
      !isValidPhone(phone)
    ) {
      return jsonError(
        "Renseignez un numéro de téléphone valide.",
        400
      );
    }

    if (needs.length === 0) {
      return jsonError(
        "Sélectionnez au moins un besoin.",
        400
      );
    }

    if (!privacyAccepted) {
      return jsonError(
        "Vous devez accepter la politique de confidentialité.",
        400
      );
    }

    /*
    =====================================================
    SUPABASE ADMIN
    =====================================================
    */

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken:
              false,
          },
        }
      );

    /*
    =====================================================
    ENREGISTREMENT DE LA DEMANDE
    =====================================================

    La Service Role reste uniquement côté serveur.

    Aucune policy INSERT anonyme
    n'est nécessaire sur quote_requests.
    */

    const {
      data: quoteRequest,
      error: insertError,
    } = await supabaseAdmin
      .from("quote_requests")
      .insert({
        company_name:
          companyName,

        contact_name:
          contactName,

        email,

        phone,

        business_type:
          businessType || null,

        company_size:
          companySize || null,

        needs,

        message:
          message || null,

        privacy_accepted:
          true,

        source:
          "Site BatiPilot",

        status:
          "Nouveau",
      })
      .select(
        "id,created_at"
      )
      .single();

    if (insertError) {
      console.error(
        "Erreur insertion quote_requests:",
        insertError
      );

      return jsonError(
        "Impossible d'enregistrer votre demande.",
        500
      );
    }

    /*
    =====================================================
    RESEND
    =====================================================
    */

    const resend =
      new Resend(
        resendApiKey
      );

    /*
    =====================================================
    EMAIL INTERNE BATIPILOT
    =====================================================
    */

    try {
      const internalEmail =
        await resend.emails.send({
          from: `BatiPilot <${resendFromEmail}>`,

          to: [
            notificationEmail,
          ],

          subject:
            `Nouvelle demande de devis — ${companyName}`,

          html: `
            <div
              style="
                margin:0;
                padding:32px;
                background:#f8fafc;
                font-family:Arial,Helvetica,sans-serif;
                color:#172033;
              "
            >
              <div
                style="
                  max-width:680px;
                  margin:0 auto;
                  background:#ffffff;
                  border:1px solid #e2e8f0;
                  border-radius:18px;
                  overflow:hidden;
                "
              >
                <div
                  style="
                    padding:26px 30px;
                    background:#172033;
                    color:white;
                  "
                >
                  <div
                    style="
                      font-size:22px;
                      font-weight:800;
                    "
                  >
                    BatiPilot
                  </div>

                  <div
                    style="
                      margin-top:5px;
                      font-size:13px;
                      color:#94a3b8;
                    "
                  >
                    Nouvelle demande commerciale
                  </div>
                </div>

                <div
                  style="
                    padding:30px;
                  "
                >
                  <h1
                    style="
                      margin:0 0 8px;
                      font-size:24px;
                    "
                  >
                    Nouvelle demande de devis
                  </h1>

                  <p
                    style="
                      margin:0 0 26px;
                      color:#64748b;
                      line-height:1.6;
                    "
                  >
                    Une entreprise vient de demander
                    des informations sur BatiPilot.
                  </p>

                  <table
                    style="
                      width:100%;
                      border-collapse:collapse;
                      font-size:14px;
                    "
                  >
                    <tr>
                      <td
                        style="
                          padding:11px 0;
                          color:#64748b;
                          width:180px;
                          vertical-align:top;
                        "
                      >
                        Entreprise
                      </td>

                      <td
                        style="
                          padding:11px 0;
                          font-weight:700;
                        "
                      >
                        ${escapeHtml(
                          companyName
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding:11px 0;
                          color:#64748b;
                          vertical-align:top;
                        "
                      >
                        Contact
                      </td>

                      <td
                        style="
                          padding:11px 0;
                          font-weight:700;
                        "
                      >
                        ${escapeHtml(
                          contactName
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding:11px 0;
                          color:#64748b;
                          vertical-align:top;
                        "
                      >
                        Email
                      </td>

                      <td
                        style="
                          padding:11px 0;
                          font-weight:700;
                        "
                      >
                        ${escapeHtml(
                          email
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding:11px 0;
                          color:#64748b;
                          vertical-align:top;
                        "
                      >
                        Téléphone
                      </td>

                      <td
                        style="
                          padding:11px 0;
                          font-weight:700;
                        "
                      >
                        ${escapeHtml(
                          phone
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding:11px 0;
                          color:#64748b;
                          vertical-align:top;
                        "
                      >
                        Activité
                      </td>

                      <td
                        style="
                          padding:11px 0;
                        "
                      >
                        ${
                          businessType
                            ? escapeHtml(
                                businessType
                              )
                            : "Non renseignée"
                        }
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding:11px 0;
                          color:#64748b;
                          vertical-align:top;
                        "
                      >
                        Taille
                      </td>

                      <td
                        style="
                          padding:11px 0;
                        "
                      >
                        ${
                          companySize
                            ? escapeHtml(
                                companySize
                              )
                            : "Non renseignée"
                        }
                      </td>
                    </tr>
                  </table>

                  <div
                    style="
                      margin-top:24px;
                      padding:18px;
                      border-radius:12px;
                      background:#eff6ff;
                    "
                  >
                    <div
                      style="
                        margin-bottom:8px;
                        font-size:12px;
                        font-weight:800;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                        color:#2563eb;
                      "
                    >
                      Besoins
                    </div>

                    <div
                      style="
                        line-height:1.7;
                      "
                    >
                      ${needs
                        .map(
                          (need) =>
                            `• ${escapeHtml(
                              need
                            )}`
                        )
                        .join("<br />")}
                    </div>
                  </div>

                  ${
                    message
                      ? `
                        <div
                          style="
                            margin-top:20px;
                            padding:18px;
                            border:1px solid #e2e8f0;
                            border-radius:12px;
                          "
                        >
                          <div
                            style="
                              margin-bottom:8px;
                              font-size:12px;
                              font-weight:800;
                              text-transform:uppercase;
                              letter-spacing:.08em;
                              color:#64748b;
                            "
                          >
                            Message
                          </div>

                          <div
                            style="
                              white-space:pre-wrap;
                              line-height:1.7;
                            "
                          >
                            ${escapeHtml(
                              message
                            )}
                          </div>
                        </div>
                      `
                      : ""
                  }

                  <div
                    style="
                      margin-top:26px;
                      padding-top:20px;
                      border-top:1px solid #e2e8f0;
                      font-size:12px;
                      color:#94a3b8;
                    "
                  >
                    Référence :
                    ${escapeHtml(
                      quoteRequest.id
                    )}
                  </div>
                </div>
              </div>
            </div>
          `,
        });

      if (
        internalEmail.error
      ) {
        console.error(
          "Erreur email BatiPilot:",
          internalEmail.error
        );
      }
    } catch (emailError) {
      console.error(
        "Erreur email interne BatiPilot:",
        emailError
      );
    }

    /*
    =====================================================
    EMAIL DE CONFIRMATION PROSPECT
    =====================================================
    */

    try {
      const prospectEmail =
        await resend.emails.send({
          from: `BatiPilot <${resendFromEmail}>`,

          to: [email],

          subject:
            "Votre demande a bien été reçue — BatiPilot",

          html: `
            <div
              style="
                margin:0;
                padding:32px;
                background:#f8fafc;
                font-family:Arial,Helvetica,sans-serif;
                color:#172033;
              "
            >
              <div
                style="
                  max-width:620px;
                  margin:0 auto;
                  background:#ffffff;
                  border:1px solid #e2e8f0;
                  border-radius:18px;
                  overflow:hidden;
                "
              >
                <div
                  style="
                    padding:26px 30px;
                    background:#172033;
                    color:white;
                  "
                >
                  <div
                    style="
                      font-size:22px;
                      font-weight:800;
                    "
                  >
                    BatiPilot
                  </div>
                </div>

                <div
                  style="
                    padding:32px;
                  "
                >
                  <h1
                    style="
                      margin:0;
                      font-size:24px;
                    "
                  >
                    Merci ${escapeHtml(
                      contactName
                    )}.
                  </h1>

                  <p
                    style="
                      margin:16px 0 0;
                      color:#64748b;
                      line-height:1.7;
                    "
                  >
                    Votre demande concernant BatiPilot
                    a bien été reçue.

                    Notre équipe reviendra vers vous
                    afin d'échanger sur les besoins de
                    ${escapeHtml(
                      companyName
                    )}.
                  </p>

                  <div
                    style="
                      margin-top:24px;
                      padding:18px;
                      background:#eff6ff;
                      border-radius:12px;
                    "
                  >
                    <div
                      style="
                        font-size:13px;
                        font-weight:700;
                        color:#2563eb;
                      "
                    >
                      Besoins sélectionnés
                    </div>

                    <div
                      style="
                        margin-top:8px;
                        line-height:1.7;
                      "
                    >
                      ${needs
                        .map(
                          (need) =>
                            `• ${escapeHtml(
                              need
                            )}`
                        )
                        .join("<br />")}
                    </div>
                  </div>

                  <p
                    style="
                      margin:26px 0 0;
                      color:#64748b;
                      line-height:1.7;
                    "
                  >
                    À bientôt,
                    <br />

                    <strong
                      style="
                        color:#172033;
                      "
                    >
                      L'équipe BatiPilot
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          `,
        });

      if (
        prospectEmail.error
      ) {
        console.warn(
          "Confirmation prospect non envoyée:",
          prospectEmail.error
        );
      }
    } catch (
      confirmationError
    ) {
      console.warn(
        "Erreur confirmation prospect:",
        confirmationError
      );
    }

    /*
    =====================================================
    SUCCÈS
    =====================================================
    */

    return NextResponse.json(
      {
        success: true,
        requestId:
          quoteRequest.id,
      },
      {
        status: 201,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erreur API demande-devis:",
      error
    );

    return jsonError(
      "Une erreur est survenue. Veuillez réessayer.",
      500
    );
  }
}
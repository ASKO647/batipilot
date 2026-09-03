import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function updateSession(
  request: NextRequest
) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value);
            }
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const { data, error } =
    await supabase.auth.getClaims();

  const userId =
    data?.claims?.sub ?? null;

  const pathname =
    request.nextUrl.pathname;

  /*
   * Les routes API restent gérées
   * par leur propre authentification.
   */
  if (pathname.startsWith("/api")) {
    return response;
  }

  /*
   * Pages accessibles sans connexion.
   */
  const publicRoutes = [
    "/",
    "/landing",
    "/connexion",
    "/inscription",
    "/demo",
    "/demande-demo",
  ];

  const isPublicRoute =
    publicRoutes.includes(pathname);

  /*
   * Si l'utilisateur n'est pas connecté
   * et essaie d'accéder au SaaS,
   * on le renvoie vers /connexion.
   */
  if (
    (!userId || error) &&
    !isPublicRoute
  ) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname = "/connexion";

    loginUrl.searchParams.set(
      "redirectTo",
      pathname
    );

    return NextResponse.redirect(
      loginUrl
    );
  }

  /*
   * Si l'utilisateur est déjà connecté,
   * inutile de lui montrer Connexion
   * ou Inscription.
   */
  if (
    userId &&
    (pathname === "/connexion" ||
      pathname === "/inscription")
  ) {
    const dashboardUrl =
      request.nextUrl.clone();

    dashboardUrl.pathname =
      "/dashboard";

    dashboardUrl.search = "";

    return NextResponse.redirect(
      dashboardUrl
    );
  }

  return response;
}
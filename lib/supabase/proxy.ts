import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  const pathname = request.nextUrl.pathname;

  /*
   * Les routes API gèrent leur propre authentification.
   */
  if (pathname.startsWith("/api")) {
    return response;
  }

  /*
   * Pages publiques accessibles sans connexion.
   */
  const publicRoutes = [
    "/",
    "/landing",
    "/connexion",
    "/inscription",
    "/demo",
    "/demande-demo",
    "/demander-un-devis",
  ];

  const isPublicRoute = publicRoutes.includes(pathname);

  /*
   * Un visiteur non connecté qui tente d'accéder
   * à une page privée est redirigé vers la connexion.
   */
  if ((!userId || error) && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/connexion";
    loginUrl.search = "";

    /*
     * On ne conserve que le chemin interne.
     * Cela évite de transformer redirectTo en redirection externe.
     */
    loginUrl.searchParams.set("redirectTo", pathname);

    return NextResponse.redirect(loginUrl);
  }

  /*
   * À partir d'ici, soit l'utilisateur est connecté,
   * soit il consulte une page publique.
   */
  if (!userId) {
    return response;
  }

  /*
   * On récupère l'organisation liée au compte.
   * Le profil est lisible par son propriétaire grâce à la RLS.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  const organizationId = profile?.organization_id ?? null;

  /*
   * Si le compte possède une organisation, on vérifie
   * si son onboarding a déjà été finalisé.
   */
  let onboardingCompleted = false;

  if (organizationId) {
    const { data: settings } = await supabase
      .from("organization_settings")
      .select("onboarding_completed")
      .eq("organization_id", organizationId)
      .maybeSingle();

    onboardingCompleted = settings?.onboarding_completed === true;
  }

  /*
   * Connexion / inscription :
   *
   * - compte configuré     -> dashboard
   * - compte non configuré -> onboarding
   */
  if (pathname === "/connexion" || pathname === "/inscription") {
    const destinationUrl = request.nextUrl.clone();

    destinationUrl.pathname = onboardingCompleted
      ? "/dashboard"
      : "/onboarding";

    destinationUrl.search = "";

    return NextResponse.redirect(destinationUrl);
  }

  /*
   * Un utilisateur connecté mais non configuré ne peut pas
   * entrer dans le SaaS avant d'avoir terminé l'onboarding.
   *
   * Les pages publiques restent accessibles.
   */
  if (
    !onboardingCompleted &&
    !isPublicRoute &&
    pathname !== "/onboarding"
  ) {
    const onboardingUrl = request.nextUrl.clone();

    onboardingUrl.pathname = "/onboarding";
    onboardingUrl.search = "";

    return NextResponse.redirect(onboardingUrl);
  }

  /*
   * Une fois l'onboarding terminé, revenir manuellement
   * sur /onboarding renvoie vers le dashboard.
   */
  if (onboardingCompleted && pathname === "/onboarding") {
    const dashboardUrl = request.nextUrl.clone();

    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";

    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

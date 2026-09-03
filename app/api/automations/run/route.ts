import { NextResponse } from "next/server";
import { runAllServerAutomations } from "@/lib/automations/engine";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.AUTOMATION_CRON_SECRET;

  if (!expectedSecret) {
    return false;
  }

  return authHeader === `Bearer ${expectedSecret}`;
}

async function handleAutomationRun(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const result = await runAllServerAutomations();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Erreur automatisations serveur :", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue pendant les automatisations.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleAutomationRun(request);
}

export async function POST(request: Request) {
  return handleAutomationRun(request);
}
import { jsPDF } from "jspdf";

export type FacturePdfData = {
  id?: string;
  number: string;
  title: string;
  description?: string | null;
  amount: number;
  tva: number;
  status?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
  created_at: string;
};

export type FacturePdfClient = {
  id?: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

export type FacturePdfCompany = {
  company_name?: string | null;
  legal_name?: string | null;
  siret?: string | null;
  vat_number?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

type GenerateFacturePdfOptions = {
  facture: FacturePdfData;
  client: FacturePdfClient;
  company: FacturePdfCompany;
};

const BLUE = { r: 37, g: 99, b: 235 };
const DARK = { r: 15, g: 23, b: 42 };
const SLATE = { r: 100, g: 116, b: 139 };
const LIGHT = { r: 248, g: 250, b: 252 };
const BORDER = { r: 226, g: 232, b: 240 };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("fr-FR");
}

function cleanFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-");
}

function getCompanyName(company: FacturePdfCompany) {
  return (
    company.company_name ||
    company.legal_name ||
    "Mon entreprise"
  );
}

function getClientName(client: FacturePdfClient) {
  return client.company || client.name || "Client";
}

function addFooter(
  doc: jsPDF,
  company: FacturePdfCompany,
  pageNumber: number
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  const parts = [
    getCompanyName(company),
    company.siret ? `SIRET : ${company.siret}` : null,
    company.vat_number ? `TVA : ${company.vat_number}` : null,
  ].filter(Boolean);

  doc.text(parts.join(" • "), 15, pageHeight - 11);

  doc.text(`Page ${pageNumber}`, pageWidth - 15, pageHeight - 11, {
    align: "right",
  });
}

function addNewPage(
  doc: jsPDF,
  company: FacturePdfCompany
) {
  doc.addPage();
  const pageNumber = doc.getNumberOfPages();
  addFooter(doc, company, pageNumber);
  return 22;
}

function ensureSpace(
  doc: jsPDF,
  y: number,
  requiredHeight: number,
  company: FacturePdfCompany
) {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (y + requiredHeight > pageHeight - 25) {
    return addNewPage(doc, company);
  }

  return y;
}

export function generateFacturePdf({
  facture,
  client,
  company,
}: GenerateFacturePdfOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const amountHt = Number(facture.amount || 0);
  const tvaRate = Number(facture.tva || 0);
  const tvaAmount = amountHt * (tvaRate / 100);
  const amountTtc = amountHt + tvaAmount;

  const companyName = getCompanyName(company);
  const clientName = getClientName(client);

  doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
  doc.roundedRect(margin, 15, 13, 13, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("B", margin + 6.5, 23.7, {
    align: "center",
  });

  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(companyName, margin + 18, 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  let companyY = 27;

  const companyLines = [
    company.address,
    [company.postal_code, company.city]
      .filter(Boolean)
      .join(" "),
  ].filter(Boolean) as string[];

  for (const line of companyLines) {
    doc.text(line, margin + 18, companyY);
    companyY += 4;
  }

  doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("FACTURE", pageWidth - margin, 22, {
    align: "right",
  });

  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFontSize(10);

  doc.text(
    facture.number || "Sans numéro",
    pageWidth - margin,
    29,
    {
      align: "right",
    }
  );

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.line(margin, 42, pageWidth - margin, 42);

  let y = 51;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text("ENTREPRISE", margin, y);

  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  const contactLines = [
    company.phone ? `Téléphone : ${company.phone}` : null,
    company.email ? `Email : ${company.email}` : null,
    company.website ? `Site : ${company.website}` : null,
    company.siret ? `SIRET : ${company.siret}` : null,
    company.vat_number ? `N° TVA : ${company.vat_number}` : null,
  ].filter(Boolean) as string[];

  if (contactLines.length === 0) {
    doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
    doc.text(
      "Informations à compléter dans Paramètres.",
      margin,
      y
    );
  } else {
    for (const line of contactLines) {
      doc.text(line, margin, y);
      y += 4.5;
    }
  }

  const clientBoxX = 112;
  const clientBoxY = 49;
  const clientBoxWidth = pageWidth - margin - clientBoxX;
  const clientBoxHeight = 42;

  doc.setFillColor(LIGHT.r, LIGHT.g, LIGHT.b);
  doc.roundedRect(
    clientBoxX,
    clientBoxY,
    clientBoxWidth,
    clientBoxHeight,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text("CLIENT", clientBoxX + 5, clientBoxY + 7);

  let clientY = clientBoxY + 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.text(clientName, clientBoxX + 5, clientY);

  clientY += 5;

  if (
    client.company &&
    client.name &&
    client.company !== client.name
  ) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(client.name, clientBoxX + 5, clientY);
    clientY += 4.5;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  const clientLines = [
    client.address,
    [client.postal_code, client.city]
      .filter(Boolean)
      .join(" "),
    client.email,
    client.phone,
  ].filter(Boolean) as string[];

  for (const line of clientLines) {
    if (clientY > clientBoxY + clientBoxHeight - 4) break;

    doc.text(line, clientBoxX + 5, clientY);
    clientY += 4;
  }

  y = 102;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);

  doc.roundedRect(margin, y, contentWidth, 19, 3, 3, "FD");

  const columnWidth = contentWidth / 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  doc.text("DATE D'ÉMISSION", margin + 5, y + 6);
  doc.text(
    "DATE D'ÉCHÉANCE",
    margin + columnWidth + 5,
    y + 6
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  doc.text(
    formatDate(facture.issue_date || facture.created_at),
    margin + 5,
    y + 13
  );

  doc.text(
    formatDate(facture.due_date),
    margin + columnWidth + 5,
    y + 13
  );

  doc.line(
    margin + columnWidth,
    y,
    margin + columnWidth,
    y + 19
  );

  y += 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text("OBJET", margin, y);

  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  const titleLines = doc.splitTextToSize(
    facture.title || "Prestation",
    contentWidth
  );

  doc.text(titleLines, margin, y);
  y += titleLines.length * 6;

  if (facture.description) {
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

    const descriptionLines = doc.splitTextToSize(
      facture.description,
      contentWidth
    );

    for (const line of descriptionLines) {
      y = ensureSpace(doc, y, 8, company);

      doc.text(line, margin, y);
      y += 5;
    }
  }

  y += 10;

  y = ensureSpace(doc, y, 66, company);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text("DÉTAIL DE LA FACTURE", margin, y);

  y += 7;

  doc.setFillColor(LIGHT.r, LIGHT.g, LIGHT.b);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  doc.text("DÉSIGNATION", margin + 5, y + 7.5);

  doc.text(
    "MONTANT HT",
    pageWidth - margin - 5,
    y + 7.5,
    {
      align: "right",
    }
  );

  y += 17;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  const designationLines = doc.splitTextToSize(
    facture.title || "Prestation",
    115
  );

  doc.text(designationLines, margin + 5, y);

  doc.setFont("helvetica", "bold");

  doc.text(
    formatCurrency(amountHt),
    pageWidth - margin - 5,
    y,
    {
      align: "right",
    }
  );

  y += Math.max(designationLines.length * 5, 7);

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.line(margin, y, pageWidth - margin, y);

  y += 9;

  const totalX = 120;
  const valueX = pageWidth - margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  doc.text("Total HT", totalX, y);

  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.text(formatCurrency(amountHt), valueX, y, {
    align: "right",
  });

  y += 7;

  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  doc.text(
    `TVA (${tvaRate.toLocaleString("fr-FR")} %)`,
    totalX,
    y
  );

  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  doc.text(formatCurrency(tvaAmount), valueX, y, {
    align: "right",
  });

  y += 7;

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.line(totalX, y, valueX, y);

  y += 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.text("TOTAL TTC", totalX, y);

  doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
  doc.setFontSize(14);

  doc.text(formatCurrency(amountTtc), valueX, y, {
    align: "right",
  });

  y += 18;

  y = ensureSpace(doc, y, 45, company);

  doc.setFillColor(LIGHT.r, LIGHT.g, LIGHT.b);

  doc.roundedRect(
    margin,
    y,
    contentWidth,
    34,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  doc.text("PAIEMENT", margin + 5, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  const paymentLines = [
    facture.due_date
      ? `Date limite de paiement : ${formatDate(
          facture.due_date
        )}.`
      : "Date limite de paiement non définie.",
    `Statut actuel : ${facture.status || "Brouillon"}.`,
    facture.paid_at
      ? `Paiement enregistré le ${formatDate(
          facture.paid_at
        )}.`
      : null,
  ].filter(Boolean) as string[];

  let paymentY = y + 14;

  for (const line of paymentLines) {
    doc.text(`• ${line}`, margin + 5, paymentY);
    paymentY += 5;
  }

  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    addFooter(doc, company, page);
  }

  return doc;
}

export function downloadFacturePdf(
  options: GenerateFacturePdfOptions
) {
  const doc = generateFacturePdf(options);

  const number = options.facture.number || "facture";

  const client =
    options.client.company ||
    options.client.name ||
    "client";

  const fileName = cleanFileName(
    `${number}-${client}`
  );

  doc.save(`${fileName}.pdf`);
}

export function previewFacturePdf(
  options: GenerateFacturePdfOptions
) {
  const doc = generateFacturePdf(options);

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank", "noopener,noreferrer");

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);
}
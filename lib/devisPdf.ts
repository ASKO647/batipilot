import { jsPDF } from "jspdf";

export type DevisPdfData = {
  id?: string;
  number: string | null;
  project: string | null;
  description: string | null;
  amount: number | null;
  tva: number | null;
  status?: string | null;
  created_at: string;
  validity_date?: string | null;
};

export type DevisPdfClient = {
  id?: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

export type DevisPdfCompany = {
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

type GenerateDevisPdfOptions = {
  devis: DevisPdfData;
  client: DevisPdfClient;
  company: DevisPdfCompany;
};

const BLUE = {
  r: 37,
  g: 99,
  b: 235,
};

const DARK = {
  r: 15,
  g: 23,
  b: 42,
};

const SLATE = {
  r: 100,
  g: 116,
  b: 139,
};

const LIGHT = {
  r: 248,
  g: 250,
  b: 252,
};

const BORDER = {
  r: 226,
  g: 232,
  b: 240,
};

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

function safeText(value?: string | null) {
  if (!value) return "";
  return String(value);
}

function getCompanyName(company: DevisPdfCompany) {
  return (
    company.company_name ||
    company.legal_name ||
    "Mon entreprise"
  );
}

function getClientDisplayName(client: DevisPdfClient) {
  if (client.company) {
    return client.company;
  }

  return client.name || "Client";
}

function addFooter(
  doc: jsPDF,
  company: DevisPdfCompany,
  pageNumber: number
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  const companyName = getCompanyName(company);

  const legalParts = [
    companyName,
    company.siret ? `SIRET : ${company.siret}` : null,
    company.vat_number
      ? `TVA : ${company.vat_number}`
      : null,
  ].filter(Boolean);

  doc.text(
    legalParts.join(" • "),
    15,
    pageHeight - 11
  );

  doc.text(
    `Page ${pageNumber}`,
    pageWidth - 15,
    pageHeight - 11,
    {
      align: "right",
    }
  );
}

function addNewPage(
  doc: jsPDF,
  company: DevisPdfCompany
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
  company: DevisPdfCompany
) {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (y + requiredHeight > pageHeight - 25) {
    return addNewPage(doc, company);
  }

  return y;
}

export function generateDevisPdf({
  devis,
  client,
  company,
}: GenerateDevisPdfOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const amountHt = Number(devis.amount || 0);
  const tvaRate = Number(devis.tva || 0);
  const tvaAmount = amountHt * (tvaRate / 100);
  const amountTtc = amountHt + tvaAmount;

  const companyName = getCompanyName(company);
  const clientName = getClientDisplayName(client);

  /*
   * HEADER
   */

  doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
  doc.roundedRect(
    margin,
    15,
    13,
    13,
    3,
    3,
    "F"
  );

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

  const companyAddress = [
    company.address,
    [company.postal_code, company.city]
      .filter(Boolean)
      .join(" "),
  ].filter(Boolean);

  let companyInfoY = 27;

  for (const line of companyAddress) {
    if (!line) continue;

    doc.text(
      safeText(line),
      margin + 18,
      companyInfoY
    );

    companyInfoY += 4;
  }

  doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("DEVIS", pageWidth - margin, 22, {
    align: "right",
  });

  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  doc.text(
    devis.number || "Sans numéro",
    pageWidth - margin,
    29,
    {
      align: "right",
    }
  );

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.line(
    margin,
    42,
    pageWidth - margin,
    42
  );

  /*
   * CONTACT ENTREPRISE
   */

  let y = 51;

  const contactLines = [
    company.phone
      ? `Téléphone : ${company.phone}`
      : null,
    company.email
      ? `Email : ${company.email}`
      : null,
    company.website
      ? `Site : ${company.website}`
      : null,
    company.siret
      ? `SIRET : ${company.siret}`
      : null,
    company.vat_number
      ? `N° TVA : ${company.vat_number}`
      : null,
  ].filter(Boolean) as string[];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text(
    "ENTREPRISE",
    margin,
    y
  );

  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

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

  /*
   * CLIENT
   */

  const clientBoxX = 112;
  const clientBoxY = 49;
  const clientBoxWidth = pageWidth - margin - clientBoxX;
  const clientBoxHeight = 42;

  doc.setFillColor(
    LIGHT.r,
    LIGHT.g,
    LIGHT.b
  );

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

  doc.text(
    "CLIENT",
    clientBoxX + 5,
    clientBoxY + 7
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  let clientY = clientBoxY + 14;

  doc.text(
    clientName,
    clientBoxX + 5,
    clientY
  );

  clientY += 5;

  if (
    client.company &&
    client.name &&
    client.company !== client.name
  ) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);

    doc.text(
      client.name,
      clientBoxX + 5,
      clientY
    );

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
    if (clientY > clientBoxY + clientBoxHeight - 4) {
      break;
    }

    doc.text(
      safeText(line),
      clientBoxX + 5,
      clientY
    );

    clientY += 4;
  }

  /*
   * DATES
   */

  y = 102;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(
    BORDER.r,
    BORDER.g,
    BORDER.b
  );

  doc.roundedRect(
    margin,
    y,
    contentWidth,
    19,
    3,
    3,
    "FD"
  );

  const dateColumnWidth = contentWidth / 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  doc.text(
    "DATE D'ÉMISSION",
    margin + 5,
    y + 6
  );

  doc.text(
    "DATE DE VALIDITÉ",
    margin + dateColumnWidth + 5,
    y + 6
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  doc.text(
    formatDate(devis.created_at),
    margin + 5,
    y + 13
  );

  doc.text(
    formatDate(devis.validity_date),
    margin + dateColumnWidth + 5,
    y + 13
  );

  doc.setDrawColor(
    BORDER.r,
    BORDER.g,
    BORDER.b
  );

  doc.line(
    margin + dateColumnWidth,
    y,
    margin + dateColumnWidth,
    y + 19
  );

  /*
   * PROJET
   */

  y += 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text("PROJET", margin, y);

  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  const projectLines = doc.splitTextToSize(
    devis.project || "Travaux",
    contentWidth
  );

  doc.text(
    projectLines,
    margin,
    y
  );

  y += projectLines.length * 6;

  if (devis.description) {
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

    const descriptionLines =
      doc.splitTextToSize(
        devis.description,
        contentWidth
      );

    for (const line of descriptionLines) {
      y = ensureSpace(
        doc,
        y,
        8,
        company
      );

      doc.text(line, margin, y);

      y += 5;
    }
  }

  /*
   * DÉTAIL FINANCIER
   */

  y += 10;

  y = ensureSpace(
    doc,
    y,
    66,
    company
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text(
    "DÉTAIL DU DEVIS",
    margin,
    y
  );

  y += 7;

  const tableX = margin;
  const tableWidth = contentWidth;

  doc.setFillColor(
    LIGHT.r,
    LIGHT.g,
    LIGHT.b
  );

  doc.roundedRect(
    tableX,
    y,
    tableWidth,
    12,
    2,
    2,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  doc.text(
    "DÉSIGNATION",
    tableX + 5,
    y + 7.5
  );

  doc.text(
    "MONTANT HT",
    tableX + tableWidth - 5,
    y + 7.5,
    {
      align: "right",
    }
  );

  y += 17;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  const designation =
    devis.project || "Travaux";

  const designationLines =
    doc.splitTextToSize(
      designation,
      115
    );

  doc.text(
    designationLines,
    tableX + 5,
    y
  );

  doc.setFont("helvetica", "bold");

  doc.text(
    formatCurrency(amountHt),
    tableX + tableWidth - 5,
    y,
    {
      align: "right",
    }
  );

  y += Math.max(
    designationLines.length * 5,
    7
  );

  doc.setDrawColor(
    BORDER.r,
    BORDER.g,
    BORDER.b
  );

  doc.line(
    tableX,
    y,
    tableX + tableWidth,
    y
  );

  /*
   * TOTAUX
   */

  y += 9;

  const totalX = 120;
  const valueX = pageWidth - margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  doc.text(
    "Total HT",
    totalX,
    y
  );

  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  doc.text(
    formatCurrency(amountHt),
    valueX,
    y,
    {
      align: "right",
    }
  );

  y += 7;

  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  doc.text(
    `TVA (${tvaRate.toLocaleString("fr-FR")} %)`,
    totalX,
    y
  );

  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  doc.text(
    formatCurrency(tvaAmount),
    valueX,
    y,
    {
      align: "right",
    }
  );

  y += 7;

  doc.setDrawColor(
    BORDER.r,
    BORDER.g,
    BORDER.b
  );

  doc.line(
    totalX,
    y,
    valueX,
    y
  );

  y += 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  doc.text(
    "TOTAL TTC",
    totalX,
    y
  );

  doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
  doc.setFontSize(14);

  doc.text(
    formatCurrency(amountTtc),
    valueX,
    y,
    {
      align: "right",
    }
  );

  /*
   * CONDITIONS
   */

  y += 18;

  y = ensureSpace(
    doc,
    y,
    47,
    company
  );

  doc.setFillColor(
    LIGHT.r,
    LIGHT.g,
    LIGHT.b
  );

  doc.roundedRect(
    margin,
    y,
    contentWidth,
    38,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  doc.text(
    "CONDITIONS",
    margin + 5,
    y + 7
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  const conditions = [
    devis.validity_date
      ? `Ce devis est valable jusqu'au ${formatDate(
          devis.validity_date
        )}.`
      : "La durée de validité de ce devis est à définir avec l'entreprise.",
    "Les travaux seront réalisés selon les modalités convenues entre l'entreprise et le client.",
    "Toute modification des travaux pourra faire l'objet d'un devis complémentaire.",
  ];

  let conditionY = y + 14;

  for (const condition of conditions) {
    const lines = doc.splitTextToSize(
      `• ${condition}`,
      contentWidth - 10
    );

    doc.text(
      lines,
      margin + 5,
      conditionY
    );

    conditionY += lines.length * 4 + 2;
  }

  /*
   * SIGNATURE
   */

  y += 48;

  y = ensureSpace(
    doc,
    y,
    40,
    company
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);

  doc.text(
    "BON POUR ACCORD",
    margin,
    y
  );

  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);

  doc.text(
    'Date, signature du client et mention "Bon pour accord" :',
    margin,
    y
  );

  y += 8;

  doc.setDrawColor(
    BORDER.r,
    BORDER.g,
    BORDER.b
  );

  doc.roundedRect(
    margin,
    y,
    contentWidth,
    25,
    3,
    3,
    "D"
  );

  /*
   * FOOTERS
   */

  const pageCount = doc.getNumberOfPages();

  for (
    let page = 1;
    page <= pageCount;
    page++
  ) {
    doc.setPage(page);

    addFooter(
      doc,
      company,
      page
    );
  }

  return doc;
}

export function downloadDevisPdf(
  options: GenerateDevisPdfOptions
) {
  const doc = generateDevisPdf(options);

  const number =
    options.devis.number || "devis";

  const client =
    options.client.company ||
    options.client.name ||
    "client";

  const fileName = cleanFileName(
    `${number}-${client}`
  );

  doc.save(`${fileName}.pdf`);
}

export function previewDevisPdf(
  options: GenerateDevisPdfOptions
) {
  const doc = generateDevisPdf(options);

  const blob = doc.output("blob");

  const url = URL.createObjectURL(blob);

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);
}
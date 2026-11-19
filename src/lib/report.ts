'use client';

import type { ComplaintsSummary, ComplaintRecord } from '../types/complaint';
import {
  getCategoryLabel,
  getMealPeriodLabel,
  getPriorityLabel,
  getStatusLabel,
} from '../types/complaint';

const PAGE_W = 1400;
const PAGE_H = 1980;
const MARGIN = 64;
const CONTENT_W = PAGE_W - MARGIN * 2;
const GAP = 24;
const ROW_H = 54;

const FONT = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';

const COLORS = {
  ink: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  soft: '#94a3b8',
  line: '#e2e8f0',
  surface: '#f8fafc',
  emerald: '#047857',
  emeraldDark: '#065f46',
  emeraldSoft: '#d1fae5',
  amber: '#b45309',
  amberSoft: '#fef3c7',
  sky: '#0369a1',
  skySoft: '#e0f2fe',
  red: '#b91c1c',
  white: '#ffffff',
};

export interface ReportInput {
  complaints: ComplaintRecord[];
  summary: ComplaintsSummary;
  filtersLabel: string;
  generatedAt?: Date;
}

function font(weight: number, size: number): string {
  return `${weight} ${size}px ${FONT}`;
}

const LOGO_SRC = '/logo_comedor.jpg';

let logoPromise: Promise<HTMLImageElement | null> | null = null;

function loadLogo(): Promise<HTMLImageElement | null> {
  if (logoPromise) return logoPromise;
  logoPromise = new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = LOGO_SRC;
  });
  return logoPromise;
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  x: number,
  y: number,
  size: number
) {
  roundRect(ctx, x, y, size, size, size * 0.22);
  ctx.fillStyle = COLORS.white;
  ctx.fill();

  if (!logo) return;

  const padding = size * 0.11;
  const available = size - padding * 2;
  const ratio = logo.naturalWidth / logo.naturalHeight || 1;
  let width = available;
  let height = available;
  if (ratio >= 1) {
    height = available / ratio;
  } else {
    width = available * ratio;
  }

  ctx.save();
  roundRect(ctx, x, y, size, size, size * 0.22);
  ctx.clip();
  ctx.drawImage(
    logo,
    x + (size - width) / 2,
    y + (size - height) / 2,
    width,
    height
  );
  ctx.restore();
}

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result.trimEnd()}…`;
}

function formatGeneratedAt(date: Date): string {
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatIncidentDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  input: ReportInput,
  top: number,
  logo: HTMLImageElement | null
) {
  const height = 190;
  const gradient = ctx.createLinearGradient(MARGIN, top, MARGIN + CONTENT_W, top + height);
  gradient.addColorStop(0, '#064e3b');
  gradient.addColorStop(0.55, '#047857');
  gradient.addColorStop(1, '#0f766e');

  roundRect(ctx, MARGIN, top, CONTENT_W, height, 28);
  ctx.fillStyle = gradient;
  ctx.fill();

  const logoSize = 92;
  drawLogo(ctx, logo, MARGIN + 38, top + 49, logoSize);

  const textX = MARGIN + 38 + logoSize + 24;

  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = font(700, 18);
  ctx.fillText('COMEDOR UNIVERSITARIO UNAS', textX, top + 58);

  ctx.fillStyle = COLORS.white;
  ctx.font = font(700, 44);
  ctx.fillText('Reporte de reclamos', textX, top + 114);

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = font(400, 20);
  ctx.fillText(
    truncateText(ctx, input.filtersLabel, CONTENT_W - 520),
    textX,
    top + 152
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = font(600, 18);
  ctx.fillText(
    `Generado ${formatGeneratedAt(input.generatedAt ?? new Date())}`,
    MARGIN + CONTENT_W - 40,
    top + 58
  );

  ctx.fillStyle = COLORS.white;
  ctx.font = font(700, 44);
  ctx.fillText(String(input.summary.total), MARGIN + CONTENT_W - 40, top + 122);

  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = font(400, 18);
  ctx.fillText('reclamos en el reporte', MARGIN + CONTENT_W - 40, top + 152);
  ctx.textAlign = 'left';
}

function drawKpis(ctx: CanvasRenderingContext2D, summary: ComplaintsSummary, top: number) {
  const cards = [
    { label: 'Pendientes', value: summary.byStatus.pendiente, color: COLORS.amber },
    { label: 'En revisión', value: summary.byStatus.en_revision, color: COLORS.sky },
    { label: 'Resueltos', value: summary.byStatus.resuelto, color: COLORS.emerald },
    { label: 'Con fotografía', value: summary.withPhotos, color: '#7c3aed' },
  ];
  const cardW = (CONTENT_W - GAP * (cards.length - 1)) / cards.length;
  const height = 140;

  cards.forEach((card, index) => {
    const x = MARGIN + index * (cardW + GAP);
    roundRect(ctx, x, top, cardW, height, 20);
    ctx.fillStyle = COLORS.white;
    ctx.fill();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.stroke();

    roundRect(ctx, x, top, 8, height, 4);
    ctx.fillStyle = card.color;
    ctx.fill();

    ctx.fillStyle = COLORS.muted;
    ctx.font = font(600, 18);
    ctx.fillText(card.label.toUpperCase(), x + 28, top + 46);

    ctx.fillStyle = COLORS.ink;
    ctx.font = font(700, 52);
    ctx.fillText(String(card.value), x + 28, top + 112);
  });
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
) {
  roundRect(ctx, x, y, width, height, 20);
  ctx.fillStyle = COLORS.white;
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = COLORS.ink;
  ctx.font = font(600, 21);
  ctx.fillText(title, x + 24, y + 42);
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  entries: { label: string; value: number }[],
  color: string
) {
  const max = Math.max(1, ...entries.map((entry) => entry.value));
  const labelW = 168;
  const valueW = 42;
  const barX = x + labelW + 10;
  const barMaxW = Math.max(20, width - labelW - valueW - 10);
  let cursor = y;

  for (const entry of entries) {
    ctx.fillStyle = COLORS.body;
    ctx.font = font(400, 18);
    ctx.fillText(truncateText(ctx, entry.label, labelW - 8), x, cursor + 14);

    roundRect(ctx, barX, cursor + 2, barMaxW, 16, 8);
    ctx.fillStyle = COLORS.surface;
    ctx.fill();

    const barW = Math.max(6, (entry.value / max) * barMaxW);
    roundRect(ctx, barX, cursor + 2, barW, 16, 8);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = COLORS.ink;
    ctx.font = font(700, 18);
    ctx.textAlign = 'right';
    ctx.fillText(String(entry.value), x + width, cursor + 14);
    ctx.textAlign = 'left';

    cursor += 38;
  }
}

function drawBreakdowns(ctx: CanvasRenderingContext2D, summary: ComplaintsSummary, top: number) {
  const panelW = (CONTENT_W - GAP * 2) / 3;
  const height = 246;

  drawPanel(ctx, MARGIN, top, panelW, height, 'Por turno');
  drawBars(
    ctx,
    MARGIN + 24,
    top + 62,
    panelW - 48,
    [
      { label: 'Desayuno', value: summary.byMealPeriod.desayuno },
      { label: 'Almuerzo', value: summary.byMealPeriod.almuerzo },
      { label: 'Cena', value: summary.byMealPeriod.cena },
    ],
    COLORS.emerald
  );

  drawPanel(ctx, MARGIN + panelW + GAP, top, panelW, height, 'Por estado');
  drawBars(
    ctx,
    MARGIN + panelW + GAP + 24,
    top + 62,
    panelW - 48,
    [
      { label: 'Pendiente', value: summary.byStatus.pendiente },
      { label: 'En revisión', value: summary.byStatus.en_revision },
      { label: 'Resuelto', value: summary.byStatus.resuelto },
      { label: 'Archivado', value: summary.byStatus.archivado },
    ],
    COLORS.sky
  );

  drawPanel(ctx, MARGIN + (panelW + GAP) * 2, top, panelW, height, 'Por prioridad');
  drawBars(
    ctx,
    MARGIN + (panelW + GAP) * 2 + 24,
    top + 62,
    panelW - 48,
    [
      { label: 'Alta', value: summary.byPriority.alta },
      { label: 'Media', value: summary.byPriority.media },
      { label: 'Baja', value: summary.byPriority.baja },
    ],
    COLORS.amber
  );
}

function drawCategories(ctx: CanvasRenderingContext2D, summary: ComplaintsSummary, top: number) {
  const height = 236;
  drawPanel(ctx, MARGIN, top, CONTENT_W, height, 'Reclamos por categoría');

  const entries = [
    { label: 'Calidad de cocción', value: summary.byCategory.calidad_coccion },
    { label: 'Temperatura', value: summary.byCategory.temperatura },
    { label: 'Higiene y limpieza', value: summary.byCategory.higiene_limpieza },
    { label: 'Tamaño de porción', value: summary.byCategory.tamano_porcion },
    { label: 'Atención y espera', value: summary.byCategory.atencion_espera },
    { label: 'Otros', value: summary.byCategory.otros },
  ];
  const max = Math.max(1, ...entries.map((entry) => entry.value));
  const columnW = (CONTENT_W - 96) / 2;
  const barMaxW = columnW - 250;

  entries.forEach((entry, index) => {
    const column = index < 3 ? 0 : 1;
    const row = index % 3;
    const x = MARGIN + 24 + column * (columnW + 24);
    const y = top + 78 + row * 48;

    ctx.fillStyle = COLORS.body;
    ctx.font = font(400, 18);
    ctx.fillText(truncateText(ctx, entry.label, 190), x, y + 12);

    roundRect(ctx, x + 200, y, barMaxW, 16, 8);
    ctx.fillStyle = COLORS.surface;
    ctx.fill();

    roundRect(ctx, x + 200, y, Math.max(6, (entry.value / max) * barMaxW), 16, 8);
    ctx.fillStyle = COLORS.emerald;
    ctx.fill();

    ctx.fillStyle = COLORS.ink;
    ctx.font = font(700, 18);
    ctx.fillText(String(entry.value), x + 200 + barMaxW + 16, y + 12);
  });
}

const TABLE_COLUMNS = [
  { key: 'fecha', label: 'Fecha', width: 148 },
  { key: 'turno', label: 'Turno', width: 136 },
  { key: 'categoria', label: 'Categoría', width: 320 },
  { key: 'estado', label: 'Estado', width: 168 },
  { key: 'prioridad', label: 'Prioridad', width: 148 },
  { key: 'descripcion', label: 'Descripción', width: 0 },
] as const;

function drawTableHeader(ctx: CanvasRenderingContext2D, top: number) {
  roundRect(ctx, MARGIN, top, CONTENT_W, 56, 14);
  ctx.fillStyle = COLORS.emeraldDark;
  ctx.fill();

  ctx.fillStyle = COLORS.white;
  ctx.font = font(600, 18);
  let x = MARGIN + 20;
  for (const column of TABLE_COLUMNS) {
    ctx.fillText(column.label.toUpperCase(), x, top + 35);
    x += column.width;
  }
  return top + 56;
}

function drawTableRows(
  ctx: CanvasRenderingContext2D,
  top: number,
  rows: ComplaintRecord[]
) {
  let y = top;
  const lastColumnWidth =
    CONTENT_W -
    TABLE_COLUMNS.slice(0, -1).reduce((total, column) => total + column.width, 0);

  rows.forEach((item, index) => {
    if (index % 2 === 1) {
      ctx.fillStyle = COLORS.surface;
      ctx.fillRect(MARGIN, y, CONTENT_W, ROW_H);
    }

    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN, y + ROW_H);
    ctx.lineTo(MARGIN + CONTENT_W, y + ROW_H);
    ctx.stroke();

    const values = [
      formatIncidentDate(item.incidentDate),
      getMealPeriodLabel(item.mealPeriod),
      getCategoryLabel(item.category),
      getStatusLabel(item.status),
      getPriorityLabel(item.priority),
      item.description.replace(/\s+/g, ' '),
    ];

    let x = MARGIN + 20;
    values.forEach((value, columnIndex) => {
      const width =
        columnIndex === values.length - 1
          ? lastColumnWidth - 24
          : TABLE_COLUMNS[columnIndex].width - 16;
      const isLast = columnIndex === values.length - 1;
      ctx.fillStyle = isLast ? COLORS.body : COLORS.ink;
      ctx.font = isLast ? font(400, 17) : font(600, 18);
      ctx.fillText(truncateText(ctx, value, width), x, y + 34);
      x += TABLE_COLUMNS[columnIndex].width;
    });

    y += ROW_H;
  });

  if (rows.length === 0) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = font(400, 20);
    ctx.textAlign = 'center';
    ctx.fillText(
      'Sin reclamos registrados para los filtros aplicados.',
      MARGIN + CONTENT_W / 2,
      top + 90
    );
    ctx.textAlign = 'left';
  }

  return y;
}

function drawContinuationHeader(
  ctx: CanvasRenderingContext2D,
  input: ReportInput,
  pageNumber: number,
  logo: HTMLImageElement | null
) {
  const top = MARGIN;
  roundRect(ctx, MARGIN, top, CONTENT_W, 84, 18);
  ctx.fillStyle = COLORS.emeraldDark;
  ctx.fill();

  drawLogo(ctx, logo, MARGIN + 20, top + 16, 52);

  ctx.fillStyle = COLORS.white;
  ctx.font = font(700, 22);
  ctx.fillText('Comedor Universitario UNAS', MARGIN + 88, top + 38);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = font(400, 17);
  ctx.fillText('Reporte de reclamos', MARGIN + 88, top + 64);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = font(400, 18);
  ctx.fillText(
    `Continuación · página ${pageNumber} · ${truncateText(ctx, input.filtersLabel, 520)}`,
    MARGIN + CONTENT_W - 28,
    top + 52
  );
  ctx.textAlign = 'left';
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  pageNumber: number,
  totalPages: number,
  input: ReportInput
) {
  const lineY = PAGE_H - MARGIN - 44;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, lineY);
  ctx.lineTo(MARGIN + CONTENT_W, lineY);
  ctx.stroke();

  ctx.fillStyle = COLORS.soft;
  ctx.font = font(400, 16);
  ctx.fillText(
    `Comedor Universitario UNAS · Datos almacenados en Neon DB · Generado ${formatGeneratedAt(
      input.generatedAt ?? new Date()
    )}`,
    MARGIN,
    lineY + 30
  );

  ctx.textAlign = 'right';
  ctx.fillText(`Página ${pageNumber} de ${totalPages}`, MARGIN + CONTENT_W, lineY + 30);
  ctx.textAlign = 'left';
}

export async function renderReportPages(input: ReportInput): Promise<HTMLCanvasElement[]> {
  const logo = await loadLogo();
  const rows = [...input.complaints].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pages: HTMLCanvasElement[] = [];

  let offset = 0;
  let pageNumber = 1;
  let guard = 0;

  do {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar el lienzo del reporte.');

    ctx.fillStyle = COLORS.white;
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    let tableTop: number;
    let capacity: number;

    if (pageNumber === 1) {
      drawCover(ctx, input, MARGIN, logo);
      drawKpis(ctx, input.summary, 282);
      drawBreakdowns(ctx, input.summary, 450);
      drawCategories(ctx, input.summary, 724);
      tableTop = 988;
      capacity = 15;
    } else {
      drawContinuationHeader(ctx, input, pageNumber, logo);
      tableTop = 196;
      capacity = 29;
    }

    const headerEnd = drawTableHeader(ctx, tableTop);
    const slice = rows.slice(offset, offset + capacity);
    drawTableRows(ctx, headerEnd, slice);
    offset += slice.length;

    pages.push(canvas);
    pageNumber += 1;
    guard += 1;
  } while (offset < rows.length && guard < 200);

  pages.forEach((canvas, index) => {
    const ctx = canvas.getContext('2d');
    if (ctx) drawFooter(ctx, index + 1, pages.length, input);
  });

  return pages;
}

export function buildReportFilename(extension: string): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  return `reporte_comedor_${stamp}.${extension}`;
}

export async function downloadReportPdf(input: ReportInput) {
  const { jsPDF } = await import('jspdf');
  const pages = await renderReportPages(input);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [PAGE_W, PAGE_H],
    compress: true,
  });

  pages.forEach((canvas, index) => {
    if (index > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait');
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PAGE_W, PAGE_H);
  });

  pdf.save(buildReportFilename('pdf'));
}

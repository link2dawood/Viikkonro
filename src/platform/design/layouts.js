// Calendar layouts: page geometry for each way a calendar can be laid out on
// paper, in PDF points. The A4 "year-glance" numbers match the site's existing
// calendar PDF (3 x 4 month grid, 36 pt margins, 8 pt column and 6 pt row
// gaps), which still draws itself in prerender.js; a test pins the two
// together until the PDF code moves onto this module.

export const PAPER = Object.freeze({
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
});

export const DEFAULT_MARGIN = 36;

const A4_ROW_HEIGHT = 150;
const A4_GRID_TOP = 96;

export const LAYOUTS = Object.freeze({
  "year-glance": {
    id: "year-glance",
    name: "Koko vuosi yhdellä sivulla",
    orientation: "portrait",
    monthsPerPage: 12,
    columns: 3,
    rows: 4,
    columnGap: 8,
    rowGap: 6,
  },
  "month-page": {
    id: "month-page",
    name: "Yksi kuukausi sivulla",
    orientation: "landscape",
    monthsPerPage: 1,
    columns: 1,
    rows: 1,
    columnGap: 0,
    rowGap: 0,
  },
  "week-list": {
    id: "week-list",
    name: "Viikkolista",
    orientation: "portrait",
    monthsPerPage: 0,
    columns: 1,
    rows: 1,
    columnGap: 0,
    rowGap: 0,
  },
});

export const DEFAULT_LAYOUT = Object.freeze({ id: "year-glance", paper: "A4" });

/**
 * @returns {{id: string, paper: string, orientation: string, page: {width: number, height: number},
 *   margin: number, content: {x: number, y: number, width: number, height: number},
 *   grid: {columns: number, rows: number, top: number, cell: {width: number, height: number}}}}
 */
export function resolveLayout({ id = "year-glance", paper = "A4", orientation, margin = DEFAULT_MARGIN } = {}) {
  const layout = LAYOUTS[id];
  if (!layout) throw new Error(`Unknown layout "${id}".`);
  const size = PAPER[paper];
  if (!size) throw new Error(`Unknown paper size "${paper}".`);
  const wanted = orientation ?? layout.orientation;
  if (wanted !== "portrait" && wanted !== "landscape") throw new Error(`Unknown orientation "${wanted}".`);
  const page =
    wanted === "portrait"
      ? { width: size.width, height: size.height }
      : { width: size.height, height: size.width };
  const content = { x: margin, y: margin, width: page.width - margin * 2, height: page.height - margin * 2 };
  const scale = page.height / PAPER.A4.height;
  const top = layout.id === "year-glance" ? Math.round(A4_GRID_TOP * scale) : margin;
  const rowHeight =
    layout.id === "year-glance"
      ? A4_ROW_HEIGHT * scale
      : (content.height - (top - margin) - layout.rowGap * (layout.rows - 1)) / layout.rows;
  return {
    id: layout.id,
    paper,
    orientation: wanted,
    page,
    margin,
    content,
    grid: {
      columns: layout.columns,
      rows: layout.rows,
      top,
      cell: {
        width: (content.width - layout.columnGap * (layout.columns - 1)) / layout.columns,
        height: rowHeight,
      },
    },
  };
}

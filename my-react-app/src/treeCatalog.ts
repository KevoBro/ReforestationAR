import placeholderPreview from "./assets/react.svg";
import singleElmGLB from "./assets/ElmTreeAlternate.glb?url";
import singleElmUSDZ from "./assets/ElmTreeAlternate.usdz?url"; 
import shrubGLB from "./assets/treeShrubRevised.glb?url";
import shrubUSDZ from "./assets/treeShrubRevised.usdz?url";
import shrubPreview from "./assets/tree_previews/shrubTreePreview.png";
import elmPreview from "./assets/tree_previews/elmTreePreview.png";

// This URL can be overridden with VITE_TREE_API_URL for different environments.
const DEFAULT_TREE_API_URL =
  "https://heliotrox.heliotrox.com/wp-json/wp/v2/tree?acf_format=standard&_fields=id,slug,acf,title";

export const TREE_API_URL = import.meta.env.VITE_TREE_API_URL ?? DEFAULT_TREE_API_URL;

export type TreeCatalogEntry = {
  id: string;
  name: string;
  previewImage: string;
  multiGlb: string;
  singleGlb: string;
  singleUsdz: string;
  species: string;
  modelAge: string;
  heightRange: string;
  soilConditions: string;
  description: string;
};

export type WordPressTreeEntry = {
  id?: number;
  slug?: string;
  title?: {
    rendered?: string;
  };
  acf?: {
    latin?: string;
    model_glb?: string;
    model_usdz?: string;
    age_low?: string;
    age_high?: string;
    preview?: string;
    height_low?: string;
    height_high?: string;
    soil_conditions?: string;
    description?: string;
  };
};

// Local fallback data keeps the app usable during API outages and also gives
// the client a simple reference for the shape each entry needs to follow.
export const TREE_CATALOG_FALLBACK: TreeCatalogEntry[] = [
  {
    id: "elm",
    name: "Elm Tree",
    previewImage: elmPreview,
    multiGlb: singleElmGLB,
    singleGlb: singleElmGLB,
    singleUsdz: singleElmUSDZ,
    species: "American Elm",
    modelAge: "Approx. 10-12 years",
    heightRange: "35-55 ft",
    soilConditions: "Moist, well-drained soils with full sun to partial shade",
    description: "Placeholder entry for an elm tree used to test browsing, selection, and future catalog expansion.",
  },
  {
    id: "shrub",
    name: "Shrub",
    previewImage: shrubPreview,
    multiGlb: shrubGLB,
    singleGlb: shrubGLB,
    singleUsdz: shrubUSDZ,
    species: "Mixed Shrub Placeholder",
    modelAge: "Approx. 3-5 years",
    heightRange: "4-8 ft",
    soilConditions: "Adaptable soils with moderate moisture and partial to full sun",
    description: "Placeholder entry for a shrub model used to test compact planting options in the catalog flow.",
  },
];

export const TREE_CATALOG = TREE_CATALOG_FALLBACK;

const stripHtmlTags = (value: string) => value.replace(/<[^>]*>/g, "").trim();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatRangeLabel = (low: string | undefined, high: string | undefined, unit: string, prefix?: string) => {
  const start = low?.trim();
  const end = high?.trim();

  if (start && end) {
    return `${prefix ? `${prefix} ` : ""}${start}-${end} ${unit}`;
  }
  if (start) {
    return `${prefix ? `${prefix} ` : ""}${start} ${unit}`;
  }
  if (end) {
    return `${prefix ? `${prefix} ` : ""}${end} ${unit}`;
  }
  return prefix ? `${prefix} Unknown` : "Unknown";
};

// Converts the WordPress custom post type response into the structure shared by
// the single-model page, multi-model page, and tree catalog UI.
export const mapWordPressTreeToCatalogEntry = (entry: WordPressTreeEntry): TreeCatalogEntry | null => {
  const name = stripHtmlTags(entry.title?.rendered ?? "");
  const acf = entry.acf;
  const glb = acf?.model_glb?.trim();

  if (!name || !glb) {
    return null;
  }

  return {
    id: entry.slug?.trim() || (entry.id ? String(entry.id) : slugify(name)),
    name,
    previewImage: acf?.preview?.trim() || placeholderPreview,
    multiGlb: glb,
    singleGlb: glb,
    singleUsdz: acf?.model_usdz?.trim() || "",
    species: acf?.latin?.trim() || "Unknown species",
    modelAge: formatRangeLabel(acf?.age_low, acf?.age_high, "years", "Approx."),
    heightRange: formatRangeLabel(acf?.height_low, acf?.height_high, "ft"),
    soilConditions: acf?.soil_conditions?.trim() || "No soil conditions provided.",
    description: acf?.description?.trim() || "No description provided.",
  };
};

import placeholderPreview from "./assets/react.svg";
//import multiElmGLB from "./assets/ElmTree.glb?url";
import singleElmGLB from "./assets/ElmTreeAlternate.glb?url";
import singleElmUSDZ from "./assets/tree_elm.usdz?url";
import shrubGLB from "./assets/treeShrubRevised.glb?url";
import shrubUSDZ from "./assets/treeShrubRevised.usdz?url";

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

export const TREE_CATALOG: TreeCatalogEntry[] = [
  {
    id: "elm",
    name: "Elm Tree",
    previewImage: placeholderPreview,
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
    previewImage: placeholderPreview,
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

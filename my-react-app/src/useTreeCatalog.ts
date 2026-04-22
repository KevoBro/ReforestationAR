import { useEffect, useState } from "react";
import {
  TREE_API_URL,
  TREE_CATALOG_FALLBACK,
  mapWordPressTreeToCatalogEntry,
  type TreeCatalogEntry,
  type WordPressTreeEntry,
} from "./treeCatalog";

type UseTreeCatalogResult = {
  trees: TreeCatalogEntry[];
  loading: boolean;
  error: string | null;
  usingFallback: boolean;
};

const FALLBACK_ERROR_MESSAGE = "Using the local fallback catalog instead.";

export default function useTreeCatalog(): UseTreeCatalogResult {
  const [trees, setTrees] = useState<TreeCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadTrees = async () => {
      try {
        setLoading(true);
        setError(null);
        setUsingFallback(false);

        const response = await fetch(TREE_API_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`WordPress API request failed with status ${response.status}.`);
        }

        const payload = (await response.json()) as WordPressTreeEntry[];
        const mappedTrees = payload.map(mapWordPressTreeToCatalogEntry).filter((entry): entry is TreeCatalogEntry => entry !== null);

        if (mappedTrees.length === 0) {
          throw new Error("WordPress returned no usable tree entries.");
        }

        setTrees(mappedTrees);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : FALLBACK_ERROR_MESSAGE;
        setTrees(TREE_CATALOG_FALLBACK);
        setError(message);
        setUsingFallback(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadTrees();

    return () => controller.abort();
  }, []);

  return { trees, loading, error, usingFallback };
}

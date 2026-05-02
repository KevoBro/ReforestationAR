import "../tree-catalog.css";
import type { TreeCatalogEntry } from "../treeCatalog";

type TreeCatalogModalProps = {
  selectedId: string;
  trees: TreeCatalogEntry[];
  title?: string;
  showInfoButton?: boolean;
  onClose: () => void;
  onOpenDetails?: (tree: TreeCatalogEntry) => void;
  onSelect: (tree: TreeCatalogEntry) => void;
};

export default function TreeCatalogModal({
  selectedId,
  trees,
  title = "Tree Catalog",
  showInfoButton = false,
  onClose,
  onOpenDetails,
  onSelect,
}: TreeCatalogModalProps) {
  return (
    <div className="catalog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="catalog-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        // The sheet stops click events so the backdrop only closes when the user
        // clicks outside the catalog content.
        onClick={(event) => event.stopPropagation()}
      >
        <div className="catalog-header">
          <div>
            <div className="catalog-eyebrow">Catalog</div>
            <div className="catalog-title">{title}</div>
          </div>
          <button type="button" className="catalog-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="catalog-grid">
          {trees.map((tree) => (
            <div key={tree.id} className={`catalog-card${tree.id === selectedId ? " is-selected" : ""}`}>
              {showInfoButton ? (
                <button
                  type="button"
                  className="catalog-info-button"
                  aria-label={`Open details for ${tree.name}`}
                  onClick={() => onOpenDetails?.(tree)}
                >
                  i
                </button>
              ) : null}

              <button type="button" className="catalog-select-button" onClick={() => onSelect(tree)}>
                <img className="catalog-preview" src={tree.previewImage} alt="" aria-hidden="true" />
                <span className="catalog-preview-scrim" />
                <span className="catalog-card-name">{tree.name}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

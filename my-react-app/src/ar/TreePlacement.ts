import { AssetReference, Behaviour, type NeedleXREventArgs, WebXR } from "@needle-tools/engine";
import { type Material, Object3D } from "three";

type SelectTreeEvent = CustomEvent<string>;

export class TreePlacement extends Behaviour {
    private webxr: WebXR | null = null;
    private ghost: Object3D | null = null;
    private currentAsset: AssetReference | null = null;

    private readonly onSelectTree = async (event: Event) => {
        const url = (event as SelectTreeEvent).detail;
        if (!url) return;
        this.currentAsset = AssetReference.getOrCreateFromUrl(url, this.context);
        await this.createGhost();
    };

    private readonly onConfirmPlacement = async () => {
        await this.placeTree();
    };

    start() {
        this.webxr = this.context.scene.getComponent(WebXR) ?? null;
        if (!this.webxr) {
            console.warn("TreePlacement: WebXR component not found in scene.");
            return;
        }

        window.addEventListener("select-tree", this.onSelectTree as EventListener);
        window.addEventListener("confirm-placement", this.onConfirmPlacement);
    }

    onDisable() {
        window.removeEventListener("select-tree", this.onSelectTree as EventListener);
        window.removeEventListener("confirm-placement", this.onConfirmPlacement);
    }

    onUpdateXR(args: NeedleXREventArgs) {
        if (!this.ghost) return;
        const hit = args.xr.getHitTest();
        if (!hit) {
            this.ghost.visible = false;
            return;
        }

        this.ghost.visible = true;
        this.ghost.position.copy(hit.position);
        this.ghost.quaternion.copy(hit.quaternion);
    }

    onLeaveXR() {
        if (this.ghost) this.ghost.visible = false;
    }

    private async createGhost() {
        if (!this.currentAsset) return;

        this.destroyGhost();

        const instance = await this.currentAsset.instantiate(this.context.scene);
        if (!instance) return;

        this.ghost = instance;
        this.ghost.visible = false;
        this.makeGhostMaterial(this.ghost);
    }

    private makeGhostMaterial(root: Object3D) {
        root.traverse((obj) => {
            const maybeMesh = obj as Object3D & { material?: Material | Material[] };
            if (!maybeMesh.material) return;
            const materials = Array.isArray(maybeMesh.material) ? maybeMesh.material : [maybeMesh.material];
            for (const mat of materials) {
                mat.transparent = true;
                mat.opacity = Math.min(mat.opacity ?? 1, 0.45);
                mat.depthWrite = false;
            }
        });
    }

    private async placeTree() {
        if (!this.currentAsset || !this.ghost) return;

        const tree = await this.currentAsset.instantiate(this.context.scene);
        if (!tree) return;

        tree.position.copy(this.ghost.position);
        tree.quaternion.copy(this.ghost.quaternion);
        tree.scale.copy(this.ghost.scale);
    }

    private destroyGhost() {
        if (!this.ghost) return;
        if ("destroy" in this.ghost && typeof this.ghost.destroy === "function") {
            this.ghost.destroy();
        } else if (this.ghost.parent) {
            this.ghost.parent.remove(this.ghost);
        }
        this.ghost = null;
    }
}

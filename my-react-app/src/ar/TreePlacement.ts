import { AssetReference, Behaviour, type NeedleXREventArgs, WebXR } from "@needle-tools/engine";
import { Box3, BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, Object3D, Quaternion, Vector3, type Material } from "three";

type SelectTreeEvent = CustomEvent<string>;
type TreePlacementDebugDetail = {
    status?: string;
    selectedUrl?: string;
    ghostReady?: boolean;
    ghostVisible?: boolean;
    canPlace?: boolean;
    mode?: "hit" | "fallback" | "none";
    message?: string;
};

const DEBUG_USE_TEST_CUBE = true;

export class TreePlacement extends Behaviour {
    private webxr: WebXR | null = null;
    private placementRoot: Object3D | null = null;
    private ghost: Object3D | null = null;
    private headLockedDebugCube: Mesh | null = null;
    private currentAsset: AssetReference | null = null;
    private canPlace = false;
    private readonly hitPosition = new Vector3();
    private readonly hitQuaternion = new Quaternion();
    private readonly fallbackPosition = new Vector3();
    private readonly fallbackForward = new Vector3();
    private readonly tempCenter = new Vector3();
    private readonly tempSize = new Vector3();
    private readonly desiredGhostHeightMeters = 1.2;
    private lastDebugMode: "hit" | "fallback" | "none" = "none";
    private lastDebugAt = 0;

    private emitDebug(detail: TreePlacementDebugDetail) {
        window.dispatchEvent(new CustomEvent<TreePlacementDebugDetail>("tree-placement-debug", { detail }));
    }

    private readonly onSelectTree = async (event: Event) => {
        const url = (event as SelectTreeEvent).detail;
        if (!url) return;
        this.currentAsset = AssetReference.getOrCreateFromUrl(url, this.context);
        this.emitDebug({ selectedUrl: url, status: "selected-model", message: "Model selected from UI event" });
        await this.createGhost();
    };

    private readonly onConfirmPlacement = async () => {
        await this.placeTree();
    };

    start() {
        this.webxr = this.context.scene.getComponent(WebXR) ?? null;
        if (!this.webxr) {
            console.warn("TreePlacement: WebXR component not found in scene.");
            this.emitDebug({ status: "error", message: "WebXR component not found in scene." });
            return;
        }

        window.addEventListener("select-tree", this.onSelectTree as EventListener);
        window.addEventListener("confirm-placement", this.onConfirmPlacement);
        this.emitDebug({ status: "ready", message: "TreePlacement started and listeners attached." });

        const initialUrl = (window as unknown as { __selectedTreeUrl?: string }).__selectedTreeUrl;
        if (initialUrl) {
            void this.onSelectTree(new CustomEvent<string>("select-tree", { detail: initialUrl }));
        }
    }

    onDisable() {
        window.removeEventListener("select-tree", this.onSelectTree as EventListener);
        window.removeEventListener("confirm-placement", this.onConfirmPlacement);
    }

    onUpdateXR(args: NeedleXREventArgs) {
        if (!this.ghost) return;
        const hit = args.xr.getHitTest();
        if (!hit) {
            const cam = this.context.mainCamera;
            this.fallbackForward.set(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
            this.fallbackPosition.copy(cam.position).addScaledVector(this.fallbackForward, 1.2);
            this.fallbackPosition.y -= 0.2;

            this.ghost.visible = true;
            this.ghost.position.copy(this.fallbackPosition);
            this.ghost.quaternion.copy(cam.quaternion);
            this.hitPosition.copy(this.fallbackPosition);
            this.hitQuaternion.copy(cam.quaternion);
            this.canPlace = true;
            const now = Date.now();
            if (this.lastDebugMode !== "fallback" || now - this.lastDebugAt > 1000) {
                this.lastDebugMode = "fallback";
                this.lastDebugAt = now;
                this.emitDebug({
                    status: "tracking",
                    mode: "fallback",
                    ghostReady: !!this.ghost,
                    ghostVisible: this.ghost.visible,
                    canPlace: this.canPlace,
                    message: "No hit-test yet. Using camera-forward fallback preview."
                });
            }
            return;
        }

        this.ghost.visible = true;
        this.ghost.position.copy(hit.position);
        this.ghost.quaternion.copy(hit.quaternion);
        this.hitPosition.copy(hit.position);
        this.hitQuaternion.copy(hit.quaternion);
        this.canPlace = true;
        const now = Date.now();
        if (this.lastDebugMode !== "hit" || now - this.lastDebugAt > 1000) {
            this.lastDebugMode = "hit";
            this.lastDebugAt = now;
            this.emitDebug({
                status: "tracking",
                mode: "hit",
                ghostReady: !!this.ghost,
                ghostVisible: this.ghost.visible,
                canPlace: this.canPlace,
                message: "Hit-test active. Ghost snapped to detected surface."
            });
        }
    }

    onEnterXR() {
        this.ensurePlacementRoot();
        this.ensureHeadLockedDebugCube();
        if (this.ghost) this.ghost.visible = false;
        this.canPlace = false;
        this.recreateGhostForActiveSession();
        this.emitDebug({ status: "entered-xr", ghostVisible: false, canPlace: false, mode: "none" });
    }

    onLeaveXR() {
        if (this.ghost) this.ghost.visible = false;
        this.canPlace = false;
        this.destroyHeadLockedDebugCube();
        this.destroyPlacementRoot();
        this.emitDebug({ status: "left-xr", ghostVisible: false, canPlace: false, mode: "none" });
    }

    private async createGhost() {
        this.destroyGhost();
        this.ensurePlacementRoot();

        let instance: Object3D | null = null;
        if (DEBUG_USE_TEST_CUBE) {
            instance = this.createDebugCube(true);
            this.placementRoot?.add(instance);
        } else {
            if (!this.currentAsset) return;
            instance = await this.currentAsset.instantiate(this.placementRoot ?? this.context.scene);
            if (!instance) {
                console.warn("TreePlacement: Failed to instantiate ghost from selected tree asset.");
                this.emitDebug({ status: "error", ghostReady: false, message: "Ghost instantiate failed. Check model URL/asset file." });
                return;
            }
        }

        this.ghost = instance;
        if (!DEBUG_USE_TEST_CUBE) {
            this.normalizeModelForPlacement(this.ghost);
        }
        this.ghost.visible = false;
        if (!DEBUG_USE_TEST_CUBE) {
            this.makeGhostMaterial(this.ghost);
        }
        this.emitDebug({
            status: "ghost-created",
            ghostReady: true,
            ghostVisible: this.ghost.visible,
            canPlace: this.canPlace,
            message: DEBUG_USE_TEST_CUBE ? "Debug cube ghost created." : "Ghost model instantiated successfully."
        });
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
        if ((!this.currentAsset && !DEBUG_USE_TEST_CUBE) || !this.ghost || !this.canPlace) {
            this.emitDebug({
                status: "place-blocked",
                ghostReady: !!this.ghost,
                canPlace: this.canPlace,
                message: "Place blocked. Missing model, ghost, or valid placement pose."
            });
            return;
        }

        let tree: Object3D | null = null;
        if (DEBUG_USE_TEST_CUBE) {
            tree = this.createDebugCube(false);
            this.ensurePlacementRoot();
            this.placementRoot?.add(tree);
        } else {
            this.ensurePlacementRoot();
            tree = await this.currentAsset!.instantiate(this.placementRoot ?? this.context.scene);
            if (!tree) {
                console.warn("TreePlacement: Failed to instantiate placed tree from selected tree asset.");
                this.emitDebug({ status: "error", message: "Placed tree instantiate failed." });
                return;
            }
            this.normalizeModelForPlacement(tree);
        }

        tree.position.copy(this.hitPosition);
        tree.quaternion.copy(this.hitQuaternion);
        tree.scale.copy(this.ghost.scale);
        this.emitDebug({
            status: "placed",
            canPlace: this.canPlace,
            message: DEBUG_USE_TEST_CUBE ? "Debug cube placed in scene." : "Tree placed in scene."
        });
    }

    private createDebugCube(isGhost: boolean): Mesh {
        const color = isGhost ? 0x3be37a : 0x4ec3ff;
        const material = new MeshBasicMaterial({
            color,
            transparent: isGhost,
            opacity: isGhost ? 0.45 : 1,
            depthTest: false,
            depthWrite: false,
            side: DoubleSide
        });
        const cube = new Mesh(new BoxGeometry(0.28, 0.28, 0.28), material);
        cube.name = isGhost ? "DebugGhostCube" : "DebugPlacedCube";
        cube.renderOrder = 999;
        return cube;
    }

    private normalizeModelForPlacement(root: Object3D) {
        const box = new Box3().setFromObject(root);
        if (box.isEmpty()) return;

        box.getCenter(this.tempCenter);
        box.getSize(this.tempSize);

        if (this.tempSize.y > 0) {
            const uniformScale = this.desiredGhostHeightMeters / this.tempSize.y;
            root.scale.multiplyScalar(uniformScale);
        }

        const boxAfterScale = new Box3().setFromObject(root);
        if (boxAfterScale.isEmpty()) return;

        boxAfterScale.getCenter(this.tempCenter);
        root.position.x -= this.tempCenter.x;
        root.position.z -= this.tempCenter.z;
        root.position.y -= boxAfterScale.min.y;
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

    private ensurePlacementRoot() {
        const xrRig = this.context.xr?.rig?.gameObject ?? null;
        const desiredParent = xrRig ?? this.context.scene;

        if (this.placementRoot?.parent === desiredParent) return;
        if (this.placementRoot?.parent && this.placementRoot.parent !== desiredParent) {
            this.placementRoot.removeFromParent();
        }
        if (this.placementRoot) {
            desiredParent.add(this.placementRoot);
            this.emitDebug({
                status: "placement-root",
                message: xrRig
                    ? "Placement root attached to XR rig (hit-test uses rig space)."
                    : "Placement root attached to scene."
            });
            return;
        }

        this.placementRoot = new Object3D();
        this.placementRoot.name = "TreePlacementRoot";
        desiredParent.add(this.placementRoot);
        this.emitDebug({
            status: "placement-root",
            message: xrRig
                ? "Placement root attached to XR rig (hit-test uses rig space)."
                : "Placement root attached to scene."
        });
    }

    private destroyPlacementRoot() {
        this.destroyGhost();
        if (!this.placementRoot) return;
        this.placementRoot.removeFromParent();
        this.placementRoot = null;
    }

    private recreateGhostForActiveSession() {
        if (!this.currentAsset && !DEBUG_USE_TEST_CUBE) return;
        void this.createGhost();
    }

    private ensureHeadLockedDebugCube() {
        if (!DEBUG_USE_TEST_CUBE || this.headLockedDebugCube) return;
        const parent = this.context.mainCamera.parent ?? this.context.scene;
        const material = new MeshBasicMaterial({
            color: 0xff3355,
            depthTest: false,
            depthWrite: false,
            side: DoubleSide
        });
        const cube = new Mesh(new BoxGeometry(0.18, 0.18, 0.18), material);
        cube.name = "HeadLockedDebugCube";
        cube.position.set(0, 0, -0.75);
        cube.renderOrder = 1000;
        parent.add(cube);
        this.headLockedDebugCube = cube;
        this.emitDebug({ status: "headlocked", message: "Head-locked debug cube attached in front of XR camera." });
    }

    private destroyHeadLockedDebugCube() {
        if (!this.headLockedDebugCube) return;
        this.headLockedDebugCube.removeFromParent();
        this.headLockedDebugCube = null;
    }
}

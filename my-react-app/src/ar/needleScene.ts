import {
    addComponent,
    AnimationUtils,
    AssetReference,
    ContactShadows,
    DragControls,
    DragMode,
    findObjectOfType,
    fitObjectIntoVolume,
    OrbitControls,
    onStart,
    WebXR,
} from "@needle-tools/engine";
import { Box3, DirectionalLight, HemisphereLight, Object3D, Vector3 } from "three";

export type TreeSpecies = {
    id: string;
    name: string;
    glb: string;
};

type GardenContext = {
    __gardenInitialized?: boolean;
} & Parameters<Parameters<typeof onStart>[0]>[0];

const ADD_TREE_EVENT = "garden:add-tree";
const TREE_DISPLAY_BOUNDS = new Box3();

let activeContext: GardenContext | null = null;
let activeOrbitControls: OrbitControls | null = null;
let activeShadows: ContactShadows | null = null;
let plantedTrees: Object3D[] = [];
let addTreeListenerAttached = false;
let nextTreeIndex = 0;
let arButtonAttachRetries = 0;

const AR_BUTTON_SLOT_ID = "needle-ar-button-slot";

const getTreeSpawnPosition = (index: number) => {
    const spacing = 1.35;
    const column = (index % 3) - 1;
    const row = Math.floor(index / 3);
    return {
        x: column * spacing,
        y: 0,
        z: -row * spacing,
    };
};

const fitTreeModel = (root: Object3D) => {
    TREE_DISPLAY_BOUNDS.setFromCenterAndSize(new Vector3(0, 0.95, 0), new Vector3(0.95, 1.9, 0.95));
    fitObjectIntoVolume(root, TREE_DISPLAY_BOUNDS);
};

const refreshCameraFit = () => {
    if (!activeOrbitControls || plantedTrees.length === 0) return;
    activeOrbitControls.fitCamera({
        objects: plantedTrees,
        immediate: false,
        fitOffset: 1.2,
        fitDirection: { x: -0.35, y: 0.28, z: 1 },
        relativeTargetOffset: { y: 0.15 },
        fov: 28,
    });
};

const addTreeToScene = async (detail: TreeSpecies) => {
    if (!activeContext) return;

    const spawn = getTreeSpawnPosition(nextTreeIndex++);
    const anchor = new Object3D();
    anchor.name = `TreeAnchor_${detail.id}_${nextTreeIndex}`;
    anchor.position.set(spawn.x, spawn.y, spawn.z);
    activeContext.scene.add(anchor);

    const asset = AssetReference.getOrCreateFromUrl(detail.glb, activeContext);
    const instance = await asset.instantiate(anchor);
    if (!instance) {
        anchor.removeFromParent();
        console.warn(`Failed to instantiate tree asset: ${detail.glb}`);
        return;
    }

    fitTreeModel(instance);
    AnimationUtils.autoplayAnimations(instance);

    const drag = addComponent(anchor, DragControls, {
        dragMode: DragMode.XZPlane,
        xrDragMode: DragMode.Attached,
        keepRotation: true,
        xrKeepRotation: true,
        showGizmo: false,
    });
    drag.snapGridResolution = 0;

    plantedTrees = [...plantedTrees, anchor];
    activeShadows?.fitShadows({ object: anchor, positionOffset: { y: 0.01 } });
    refreshCameraFit();
};

const attachAddTreeListener = () => {
    if (addTreeListenerAttached) return;
    addTreeListenerAttached = true;

    window.addEventListener(ADD_TREE_EVENT, (event: Event) => {
        const detail = (event as CustomEvent<TreeSpecies>).detail;
        if (!detail?.glb) return;
        void addTreeToScene(detail);
    });
};

const attachNeedleARButtonToOverlay = (button: HTMLButtonElement) => {
    const slot = document.getElementById(AR_BUTTON_SLOT_ID);
    if (slot) {
        slot.replaceChildren(button);
        arButtonAttachRetries = 0;
        return;
    }

    if (arButtonAttachRetries >= 40) return;
    arButtonAttachRetries += 1;
    window.setTimeout(() => attachNeedleARButtonToOverlay(button), 100);
};

onStart((context) => {
    const gardenContext = context as GardenContext;
    if (gardenContext.__gardenInitialized) return;

    gardenContext.__gardenInitialized = true;
    activeContext = gardenContext;

    context.renderer.setClearAlpha(0);
    context.mainCamera.position.set(0, 1.8, 5.5);
    context.mainCamera.lookAt(0, 0.9, 0);

    activeOrbitControls = findObjectOfType(OrbitControls) ?? null;
    if (activeOrbitControls) {
        activeOrbitControls.enablePan = true;
        activeOrbitControls.fitCamera({
            objects: context.scene,
            immediate: false,
            fitOffset: 1.05,
            fitDirection: { x: -0.35, y: 0.28, z: 1 },
            relativeTargetOffset: { y: 0.15 },
            fov: 28,
        });
    }

    const hemiLight = new HemisphereLight(0xf4f7ff, 0x6c7a5d, 1.2);
    const dirLight = new DirectionalLight(0xffffff, 1.35);
    dirLight.position.set(4, 6, 3);
    context.scene.add(hemiLight);
    context.scene.add(dirLight);

    activeShadows = ContactShadows.auto();
    activeShadows.darkness = 0.72;
    activeShadows.opacity = 0.88;

    const webxr = addComponent(context.scene, WebXR, {
        createARButton: true,
        createVRButton: false,
        createSendToQuestButton: false,
        createQRCode: false,
        autoPlace: true,
    });
    attachNeedleARButtonToOverlay(webxr.getButtonsFactory().createARButton());

    context.menu.setVisible(true);
    context.menu.setSpatialMenuVisible(true);
    context.menu.showFullscreenOption(true);
    attachAddTreeListener();
});

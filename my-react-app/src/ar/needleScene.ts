import type { Context as NeedleContext, OrbitControls as OrbitControlsType } from "@needle-tools/engine";
import {
    addComponent,
    AnimationUtils,
    AssetReference,
    ContactShadows,
    Context,
    DragControls,
    DragMode,
    fitObjectIntoVolume,
    ObjectUtils,
    OrbitControls,
    WebXR,
} from "@needle-tools/engine";
import { Box3, Color, DirectionalLight, HemisphereLight, MeshStandardMaterial, Object3D, Vector3 } from "three";

export type TreeSpecies = {
    id: string;
    name: string;
    glb: string;
};

type GardenContext = NeedleContext & {
    __gardenInitialized?: boolean;
};

const ADD_TREE_EVENT = "garden:add-tree";
const TREE_DISPLAY_BOUNDS = new Box3();

let activeContext: GardenContext | null = null;
let activeOrbitControls: OrbitControlsType | null = null;
let activeShadows: ContactShadows | null = null;
let activeWebXR: WebXR | null = null;
let activeARButtonSlot: HTMLElement | null = null;
let plantedTrees: Object3D[] = [];
let addTreeListenerAttached = false;
let nextTreeIndex = 0;

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

const createSceneGround = () => {
    const ground = ObjectUtils.createPrimitive("Cylinder", {
        scale: [4.2, 0.08, 4.2],
        position: [0, -0.04, 0],
        material: new MeshStandardMaterial({
            color: new Color(0.78, 0.8, 0.74),
            metalness: 0.08,
            roughness: 0.82,
        })
    });
    ground.name = "GardenGround";
    return ground;
};

const mountNeedleARButton = () => {
    if (!activeWebXR || !activeARButtonSlot) return;
    const button = activeWebXR.getButtonsFactory().createARButton();
    button.classList.add("garden-ar-button");
    if (activeARButtonSlot.firstElementChild !== button) {
        activeARButtonSlot.replaceChildren(button);
    }
};

export const initializeGardenScene = async (host: HTMLElement) => {
    if (activeContext) return activeContext;

    const context = new Context({ domElement: host }) as GardenContext;
    context.runInBackground = true;
    await context.create({ files: [] });

    if (!context.__gardenInitialized) {
        context.__gardenInitialized = true;
        context.renderer.setClearAlpha(0);

        context.mainCamera.position.set(0, 1.8, 5.5);
        context.mainCamera.lookAt(0, 0.9, 0);

        const orbit = addComponent(context.mainCamera, OrbitControls, {
            enablePan: true,
            autoFit: false,
            autoTarget: false,
            minPolarAngle: 0.3,
            maxPolarAngle: 1.45,
            zoomSpeed: 0.8,
        });
        orbit.targetElement = context.domElement as HTMLElement;
        activeOrbitControls = orbit;

        const hemiLight = new HemisphereLight(0xf4f7ff, 0x6c7a5d, 1.2);
        const dirLight = new DirectionalLight(0xffffff, 1.35);
        dirLight.position.set(4, 6, 3);
        context.scene.add(hemiLight);
        context.scene.add(dirLight);

        const ground = createSceneGround();
        context.scene.add(ground);

        activeShadows = ContactShadows.auto();
        activeShadows.darkness = 0.72;
        activeShadows.opacity = 0.88;

        activeWebXR = addComponent(context.scene, WebXR, {
            createARButton: false,
            createVRButton: false,
            createSendToQuestButton: false,
            createQRCode: false,
            autoPlace: true,
        });
        mountNeedleARButton();

        context.menu.showFullscreenOption(true);
        attachAddTreeListener();
    }

    activeContext = context;
    return context;
};

export const setGardenARButtonSlot = (slot: HTMLElement | null) => {
    activeARButtonSlot = slot;
    mountNeedleARButton();
};

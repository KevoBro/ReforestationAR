import { Context, NeedleXRSession, onStart, WebXR } from "@needle-tools/engine";
import { TreePlacement } from "./TreePlacement";

const CONTEXT_KEY = "__needle_context";
const CREATE_KEY = "__needle_context_creating";

const waitForContainer = (): Promise<HTMLElement> => {
    return new Promise((resolve) => {
        const tick = () => {
            const el = document.getElementById("ar-container");
            if (el) resolve(el);
            else requestAnimationFrame(tick);
        };
        tick();
    });
};

const ensureContext = async (): Promise<Context> => {
    const w = window as unknown as Record<string, unknown>;
    const existing = w[CONTEXT_KEY] as Context | undefined;
    if (existing) return existing;
    const creating = w[CREATE_KEY] as Promise<Context> | undefined;
    if (creating) return creating;

    const createPromise = (async () => {
        const container = await waitForContainer();
        const context = new Context({ domElement: container });
        context.runInBackground = true;
        await context.create({ files: [] });
        w[CONTEXT_KEY] = context;
        return context;
    })();

    w[CREATE_KEY] = createPromise;
    return createPromise;
};

void ensureContext();

onStart((context) => {

    const webxr = context.scene.addComponent(WebXR, {
        createARButton: false,
        createVRButton: false,
        createQRCode: false,
        useQuicklookExport: true
    });
    void webxr;

    context.scene.addComponent(TreePlacement);

    const sessionInit = NeedleXRSession.getDefaultSessionInit("immersive-ar");
    sessionInit.requiredFeatures = Array.from(new Set([...(sessionInit.requiredFeatures ?? []), "hit-test"]));
    sessionInit.optionalFeatures = Array.from(new Set([
        ...(sessionInit.optionalFeatures ?? []),
        "dom-overlay",
        "light-estimation",
        "anchors"
    ]));
    sessionInit.domOverlay = { root: document.body };

    const tryStart = async () => {
        if (NeedleXRSession.active) return;
        try {
            await NeedleXRSession.start("ar", sessionInit, context);
        } catch (err) {
            console.warn("Failed to start AR session", err);
        }
    };

    const startOnFirstGesture = () => {
        window.removeEventListener("pointerdown", startOnFirstGesture);
        window.removeEventListener("touchstart", startOnFirstGesture);
        void tryStart();
    };

    window.addEventListener("start-ar", () => void tryStart());
    window.addEventListener("pointerdown", startOnFirstGesture, { once: true });
    window.addEventListener("touchstart", startOnFirstGesture, { once: true });
    void tryStart();

});

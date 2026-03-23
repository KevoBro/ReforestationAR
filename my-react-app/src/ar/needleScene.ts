import type { Context as NeedleContext } from "@needle-tools/engine";
import { Context, NeedleXRSession, WebXR } from "@needle-tools/engine";
import { TreePlacement } from "./TreePlacement";

type InitializedContext = NeedleContext & {
    __treePlacementInitialized?: boolean;
    __startARHandler?: () => void;
};

let activeStartARHandler: (() => void) | null = null;

const emitInitDebug = (message: string) => {
    window.dispatchEvent(new CustomEvent("tree-placement-debug", {
        detail: {
            status: "init",
            message
        }
    }));
};

type SessionAttempt = {
    label: string;
    init: XRSessionInit;
    strategy: "needle" | "direct";
};

const cloneSessionInit = (init: XRSessionInit): XRSessionInit => ({
    requiredFeatures: init.requiredFeatures ? [...init.requiredFeatures] : undefined,
    optionalFeatures: init.optionalFeatures ? [...init.optionalFeatures] : undefined,
    domOverlay: init.domOverlay ? { root: init.domOverlay.root } : undefined,
});

const formatFeatures = (value?: readonly string[]) => value?.length ? value.join(",") : "none";
const formatError = (error: unknown) => {
    if (error instanceof Error) {
        const name = error.name || "Error";
        const message = error.message || "no message";
        return `${name}: ${message}`;
    }
    if (typeof error === "object" && error !== null) {
        const maybeName = "name" in error ? String((error as { name?: unknown }).name ?? "") : "";
        const maybeMessage = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
        const maybeCode = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
        const details = [maybeName, maybeMessage, maybeCode ? `code=${maybeCode}` : ""].filter(Boolean).join(" | ");
        return details || JSON.stringify(error);
    }
    return String(error);
};

export const initializeNeedleScene = (context: NeedleContext) => {
    const initializedContext = context as InitializedContext;
    if (initializedContext.__treePlacementInitialized) {
        emitInitDebug("Needle scene already initialized.");
        return;
    }
    initializedContext.__treePlacementInitialized = true;

    const webxr = context.scene.addComponent(WebXR, {
        createARButton: false,
        createVRButton: false,
        createSendToQuestButton: false,
        createQRCode: false,
        useQuicklookExport: false,
        autoPlace: true,
        usePlacementReticle: false,
        usePlacementAdjustment: false,
        autoCenter: false
    });
    void webxr;

    context.scene.addComponent(TreePlacement);
    emitInitDebug("Needle scene initialized. WebXR and TreePlacement attached.");
    context.renderer.setClearAlpha(0);
    context.menu.setVisible(false);
    context.menu.setSpatialMenuVisible(false);
    context.menu.showFullscreenOption(false);

    context.domElement.addEventListener("xr-session-started", () => {
        emitInitDebug("xr-session-started event received from context.");
    });
    context.domElement.addEventListener("enter-ar", () => {
        emitInitDebug("enter-ar event received from context.");
    });
    context.domElement.addEventListener("exit-ar", () => {
        emitInitDebug("exit-ar event received from context.");
    });

    const sessionInit = NeedleXRSession.getDefaultSessionInit("immersive-ar");
    sessionInit.requiredFeatures = Array.from(new Set([...(sessionInit.requiredFeatures ?? []), "hit-test"]));
    sessionInit.optionalFeatures = Array.from(new Set([
        ...(sessionInit.optionalFeatures ?? []),
        "dom-overlay",
        "light-estimation",
        "anchors"
    ]));
    sessionInit.domOverlay = { root: context.domElement as HTMLElement };

    const attemptStart = async (webxrComponent: WebXR) => {
        const attempts: SessionAttempt[] = [
            {
                label: "Needle default AR session",
                init: cloneSessionInit(sessionInit),
                strategy: "needle"
            },
            {
                label: "Direct immersive-ar with hit-test + dom-overlay",
                init: {
                    requiredFeatures: ["hit-test"],
                    optionalFeatures: ["dom-overlay"],
                    domOverlay: { root: context.domElement as HTMLElement }
                },
                strategy: "direct"
            },
            {
                label: "Direct immersive-ar with hit-test only",
                init: {
                    requiredFeatures: ["hit-test"]
                },
                strategy: "direct"
            },
            {
                label: "Direct immersive-ar minimal session",
                init: {},
                strategy: "direct"
            }
        ];

        for (const attempt of attempts) {
            emitInitDebug(
                `Trying ${attempt.label}. required=${formatFeatures(attempt.init.requiredFeatures)}, ` +
                `optional=${formatFeatures(attempt.init.optionalFeatures)}`
            );

            try {
                if (attempt.strategy === "needle") {
                    const session = await webxrComponent.enterAR(attempt.init);
                    if (session) {
                        emitInitDebug(`${attempt.label} succeeded.`);
                        return session;
                    }
                    emitInitDebug(`${attempt.label} returned no active session.`);
                    continue;
                }

                const xrSession = await navigator.xr?.requestSession("immersive-ar", attempt.init);
                if (!xrSession) {
                    emitInitDebug(`${attempt.label} returned no XRSession.`);
                    continue;
                }

                const session = NeedleXRSession.setSession("immersive-ar", xrSession, attempt.init, context);
                emitInitDebug(`${attempt.label} succeeded via direct requestSession.`);
                return session;
            } catch (error) {
                const message = formatError(error);
                emitInitDebug(`${attempt.label} failed. ${message}`);
            }
        }

        return null;
    };

    initializedContext.__startARHandler = () => {
        if (NeedleXRSession.active) return;
        void (async () => {
            try {
                const xrAvailable = "xr" in navigator && !!navigator.xr;
                const sessionSupported = xrAvailable && navigator.xr?.isSessionSupported
                    ? await navigator.xr.isSessionSupported("immersive-ar").catch(() => false)
                    : false;
                const needleSupported = await NeedleXRSession.isARSupported().catch(() => false);

                emitInitDebug(
                    `Requesting AR session start. navigator.xr=${xrAvailable ? "yes" : "no"}, ` +
                    `isSessionSupported=${sessionSupported ? "yes" : "no"}, ` +
                    `NeedleXRSession.isARSupported=${needleSupported ? "yes" : "no"}`
                );

                const session = await attemptStart(webxr);
                if (session) emitInitDebug("AR session start requested successfully.");
                else emitInitDebug("AR session request returned no active session.");
            } catch (err) {
            console.warn("Failed to start AR session", err);
            window.dispatchEvent(new CustomEvent("tree-placement-debug", {
                detail: {
                    status: "error",
                    message: "Could not start XR session. Make sure permissions are allowed."
                }
            }));
            }
        })();
    };
    activeStartARHandler = initializedContext.__startARHandler;

    window.addEventListener("start-ar", initializedContext.__startARHandler);
};

export const startNeedleARSession = () => {
    if (!activeStartARHandler) {
        window.dispatchEvent(new CustomEvent("tree-placement-debug", {
            detail: {
                status: "error",
                message: "AR start requested before Needle scene finished initializing."
            }
        }));
        return;
    }
    emitInitDebug("Begin AR button pressed.");
    activeStartARHandler();
};

export const createFallbackNeedleContext = async (host: HTMLElement) => {
    const context = new Context({ domElement: host });
    context.runInBackground = true;
    await context.create({ files: [] });
    emitInitDebug("Fallback Context created manually on host element.");
    return context;
};

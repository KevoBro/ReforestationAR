// src/ar/ARScene.ts

import { onStart, WebXR } from "@needle-tools/engine";

onStart((context) => {

    const webxr = context.scene.addComponent(WebXR, {
        createARButton: false
    });
    void webxr;

    console.log("WebXR initialized");
});

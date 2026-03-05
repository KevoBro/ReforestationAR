// src/ar/ARScene.ts

import { onStart, WebXR } from "@needle-tools/engine";

onStart(context => {

    // Add WebXR component to the scene
    context.scene.addComponent(WebXR, {
        createVRButton: false,
        createARButton: true
    });

    console.log("WebXR initialized");
});

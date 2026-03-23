import type { HTMLAttributes } from "react";
import type { Context } from "@needle-tools/engine";

type NeedleEngineAttributes = HTMLAttributes<HTMLElement> & {
    src?: string;
    "keep-alive"?: string;
    "camera-controls"?: string;
    "background-image"?: string;
    "environment-image"?: string;
    "background-blurriness"?: string;
    context?: Context;
    getContext?: () => Promise<Context>;
};

declare module "react/jsx-runtime" {
    namespace JSX {
        interface IntrinsicElements {
            "needle-engine": NeedleEngineAttributes;
        }
    }
}

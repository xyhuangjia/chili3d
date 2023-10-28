// Copyright 2022-2023 the Chili authors. All rights reserved. AGPL-3.0 license.

import { I18n, I18nKeys } from "chili-core";
import style from "./toast.module.css";
import { div } from "../controls";

export class Toast {
    static #lastToast: [any, HTMLElement] | undefined;

    static show = (message: I18nKeys, ...args: any[]) => {
        if (this.#lastToast) {
            clearTimeout(this.#lastToast[0]);
            this.#lastToast[1].remove();
        }

        const toast = div(
            { className: style.container },
            div({ className: style.message, textContent: I18n.translate(message, ...args) }),
        );
        document.body.appendChild(toast);
        this.#lastToast = [
            setTimeout(() => {
                toast.remove();
                this.#lastToast = undefined;
            }, 2000),
            toast,
        ];
    };
}

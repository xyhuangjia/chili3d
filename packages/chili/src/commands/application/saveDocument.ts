// Copyright 2022-2023 the Chili authors. All rights reserved. AGPL-3.0 license.

import { AsyncController, command, I18n, IApplication, ICommand, PubSub } from "chili-core";

@command({
    name: "doc.save",
    display: "command.document.save",
    icon: "icon-save",
})
export class SaveDocument implements ICommand {
    async execute(app: IApplication): Promise<void> {
        if (!app.activeDocument) return;
        PubSub.default.pub(
            "showPermanent",
            async () => {
                await app.activeDocument!.save();
                PubSub.default.pub("showToast", "toast.document.saved");
            },
            "toast.excuting{0}",
            I18n.translate("command.document.save"),
        );
    }
}

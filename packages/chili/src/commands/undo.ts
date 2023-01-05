// Copyright 2022-2023 the Chili authors. All rights reserved. MPL-2.0 license.

import { Commands, i18n } from "chili-shared";
import { command, ICommand, IDocument } from "chili-core";

@command({
    name: Commands.Undo,
    display: i18n.commandUndo,
    icon: "icon-undo",
})
export class Undo implements ICommand {
    async excute(document: IDocument): Promise<boolean> {
        document.undo();
        return true;
    }
}
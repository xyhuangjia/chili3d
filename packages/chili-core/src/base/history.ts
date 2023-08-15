// Copyright 2022-2023 the Chili authors. All rights reserved. MPL-2.0 license.

import { INode, INodeLinkedList } from "../model";
import { IDisposable } from "./disposable";

export interface IHistoryRecord {
    readonly name: string;
    undo(): void;
    redo(): void;
}

export class History implements IDisposable {
    #undos: IHistoryRecord[] = [];
    #redos: IHistoryRecord[] = [];

    disabled: boolean = false;
    undoLimits: number = 2;

    dispose(): void {
        this.#undos.length = 0;
        this.#redos.length = 0;
    }

    add(record: IHistoryRecord) {
        this.#redos.length = 0;
        this.#undos.push(record);
        if (this.#undos.length > this.undoLimits) {
            this.#undos = this.#undos.slice(this.#undos.length - this.undoLimits);
        }
    }

    undoCount() {
        return this.#undos.length;
    }

    redoCount() {
        return this.#redos.length;
    }

    undo() {
        this.tryOperate(() => {
            let records = this.#undos.pop();
            if (records === undefined) return;
            records.undo();
            this.#redos.push(records);
        });
    }

    redo() {
        this.tryOperate(() => {
            let records = this.#redos.pop();
            if (records === undefined) return;
            records.redo();
            this.#undos.push(records);
        });
    }

    private tryOperate(action: () => void) {
        let isDisabled = this.disabled;
        if (!isDisabled) this.disabled = true;
        try {
            action();
        } finally {
            this.disabled = isDisabled;
        }
    }
}

export class PropertyHistoryRecord implements IHistoryRecord {
    readonly name: string;
    constructor(
        readonly object: any,
        readonly property: string | symbol | number,
        readonly oldValue: any,
        readonly newValue: any
    ) {
        this.name = `change ${String(property)} property`;
    }

    undo(): void {
        this.object[this.property] = this.oldValue;
    }

    redo(): void {
        this.object[this.property] = this.newValue;
    }
}

export enum NodeAction {
    add,
    remove,
    move,
    insertAfter,
    insertBefore,
}

export interface NodeRecord {
    node: INode;
    action: NodeAction;
    oldParent?: INodeLinkedList;
    oldPrevious?: INode;
    newParent?: INodeLinkedList;
    newPrevious?: INode;
}

export class NodeLinkedListHistoryRecord implements IHistoryRecord {
    readonly name: string;
    constructor(readonly records: NodeRecord[]) {
        this.name = `change node`;
    }

    undo() {
        for (let index = this.records.length - 1; index >= 0; index--) {
            let record = this.records[index];
            if (record.action === NodeAction.add) {
                record.newParent?.remove(record.node);
            } else if (record.action === NodeAction.remove) {
                record.oldParent?.add(record.node);
            } else if (record.action === NodeAction.move) {
                record.newParent?.move(record.node, record.oldParent!, record.oldPrevious);
            } else if (record.action === NodeAction.insertAfter) {
                record.newParent?.remove(record.node);
            } else if (record.action === NodeAction.insertBefore) {
                record.newParent?.remove(record.node);
            }
        }
    }

    redo() {
        for (const record of this.records) {
            if (record.action === NodeAction.add) {
                record.newParent?.add(record.node);
            } else if (record.action === NodeAction.remove) {
                record.oldParent?.remove(record.node);
            } else if (record.action === NodeAction.move) {
                record.oldParent?.move(record.node, record.newParent!, record.newPrevious);
            } else if (record.action === NodeAction.insertAfter) {
                record.newParent?.insertAfter(record.newPrevious, record.node);
            } else if (record.action === NodeAction.insertBefore) {
                record.newParent?.insertBefore(record.newPrevious?.nextSibling, record.node);
            }
        }
    }
}

export class ArrayRecord implements IHistoryRecord {
    readonly records: Array<IHistoryRecord> = [];

    constructor(readonly name: string) {}

    undo() {
        for (let index = this.records.length - 1; index >= 0; index--) {
            this.records[index].undo();
        }
    }

    redo() {
        for (const record of this.records) {
            record.redo();
        }
    }
}

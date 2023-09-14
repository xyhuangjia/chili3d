// Copyright 2022-2023 the Chili authors. All rights reserved. AGPL-3.0 license.

import { AsyncController } from "../src";

test("test cancel", async () => {
    let controller = new AsyncController();
    expect(controller.result?.status === "cancel").toBeFalsy();
    await new Promise((r, s) => {
        setTimeout(() => {
            controller.cancel();
            r("resolved");
        }, 30);
    });
    expect(controller.result?.status === "cancel").toBeTruthy();
});

test("test fail", async () => {
    let controller = new AsyncController();
    expect(controller.result?.status === "fail").toBeFalsy();
    await new Promise((r, s) => {
        setTimeout(() => {
            controller.fail("fail msg");
            r("resolved");
        }, 30);
    });
    expect(controller.result?.status === "fail").toBeTruthy();
    expect(controller.result?.message).toBe("fail msg");
});

test("test complete", async () => {
    let controller = new AsyncController();
    expect(controller.result?.status === "success").toBeFalsy();
    await new Promise((r, s) => {
        setTimeout(() => {
            controller.success();
            r("resolved");
        }, 30);
    });
    expect(controller.result?.status === "success").toBeTruthy();
});

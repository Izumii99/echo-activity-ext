import { ActivityManager } from "../../activityForward";
import { Path } from "../../resouce";
import { DrawMods, SharedCenterModifier } from "@mod-utils/ChatRoomOrder";
import { Prereqs } from "../../prereqs";
import { monadic } from "@mod-utils/monadic";
import { ChatRoomOrderTools } from "@mod-utils/ChatRoomOrder";
import { Tools } from "@mod-utils/Tools";

const items = [
    { prev: "CollarLeash", next: "拉紧的牵绳" },
    { prev: "ChainLeash", next: "拉紧的链子" },
];

const itemMap = Object.fromEntries(items.map((i) => [i.prev, i.next]));

/** @type {AssetGroupItemName[]} */
const pairiGroups = ["ItemMisc", "ItemHandheld"];

/** @type { CustomActivity} */
const pullActivity = {
    activity: {
        Name: "拉到身边",
        Prerequisite: [
            "UseHands",
            "Luzi_TargetLeashedOrCanBeLeashed",
            Prereqs.any(
                ...pairiGroups.flatMap((group) =>
                    items.flatMap((i) => [
                        Prereqs.all(
                            Prereqs.Acted.GroupIs("ItemNeckRestraints", i.prev),
                            () => !!AssetGet("Female3DCG", group, i.next),
                            Prereqs.Acting.GroupEmpty(group)
                        ),
                        Prereqs.all(
                            Prereqs.Acted.GroupIs("ItemNeckRestraints", i.prev),
                            () => !!AssetGet("Female3DCG", group, i.next),
                            Prereqs.Acting.GroupIs(group, i.next)
                        ),
                    ])
                )
            ),
        ],
        MaxProgress: 0,
        Target: ["ItemTorso", "ItemNeckRestraints", "ItemNeck"],
    },
    run: (player, sender, { TargetCharacter, SourceCharacter }) => {
        if (TargetCharacter === player.MemberNumber) {
            // 遵守物品权限
            if (!ServerChatRoomGetAllowItem(sender, player)) return;

            const group = "ItemNeckRestraints";
            Tools.findCharacter("SourceC", SourceCharacter)
                .then(() => InventoryGet(player, group))
                .then((item, { SourceC }) => {
                    ChatRoomOrderTools.wearAndPair(player, item.Asset, { nextCharacter: SourceC.MemberNumber });
                    ChatRoomOrderTools.leashPlayer(SourceC);
                });
        } else if (SourceCharacter === player.MemberNumber) {
            Tools.findCharacter("TargetC", TargetCharacter)
                .then((target) => InventoryGet(target, "ItemNeckRestraints"))
                .then((item) => itemMap[item.Asset.Name])
                .then((pairItemName) =>
                    monadic(player.Appearance.find((i) => i.Asset.Name === pairItemName)?.Asset).valueOr(() =>
                        monadic(pairiGroups.find((g) => !player.Appearance.some((i) => i.Asset.Group.Name === g)))
                            .then((group) => AssetGet("Female3DCG", group, pairItemName))
                            .valueOr(undefined)
                    )
                )
                .then((asset, { TargetC }) => {
                    ChatRoomOrderTools.wearAndPair(player, asset, { prevCharacter: TargetC.MemberNumber });
                    ChatRoomOrderTools.leashTarget(TargetC);
                });
        }
    },
    useImage: () => Path.resolve("activities/pull_to_side.png"),
    label: {
        CN: "拉到身边",
        EN: "Pull to One's Side",
        RU: "Притащить к себе",
        UA: "Притягнути до себе",
    },
    dialog: {
        CN: "SourceCharacter将TargetCharacter拉到身边.",
        EN: "SourceCharacter pulls TargetCharacter to PronounPossessive side.",
        RU: "SourceCharacter притаскивает TargetCharacter к себе.",
        UA: "SourceCharacter притягує TargetCharacter ближче до себе.",
    },
};

/** @type { CustomActivity} */
const stuffActivity = {
    activity: {
        Name: "塞牵绳",
        Prerequisite: [
            "Luzi_CanWalk",
            "UseHands",
            Prereqs.ActingCheck((acting) => ChatRoomCanBeLeashed(acting)),
            Prereqs.any(
                ...pairiGroups.flatMap((group) =>
                    items.flatMap((i) => [
                        Prereqs.all(
                            Prereqs.Acting.GroupIs("ItemNeckRestraints", i.prev),
                            () => !!AssetGet("Female3DCG", group, i.next),
                            Prereqs.Acted.GroupEmpty(group)
                        ),
                        Prereqs.all(
                            Prereqs.Acting.GroupIs("ItemNeckRestraints", i.prev),
                            () => !!AssetGet("Female3DCG", group, i.next),
                            Prereqs.Acted.GroupIs(group, i.next)
                        ),
                    ])
                )
            ),
        ],
        MaxProgress: 0,
        Target: ["ItemTorso", "ItemNeckRestraints", "ItemNeck"],
    },
    run: (player, sender, { TargetCharacter, SourceCharacter }) => {
        if (TargetCharacter === player.MemberNumber) {
            // 遵守物品权限
            if (!ServerChatRoomGetAllowItem(sender, player)) return;

            Tools.findCharacter("SourceC", SourceCharacter)
                .then((source) => InventoryGet(source, "ItemNeckRestraints"))
                .then((item) => itemMap[item.Asset.Name])
                .then((pairItemName) =>
                    monadic(player.Appearance.find((i) => i.Asset.Name === pairItemName)?.Asset).valueOr(() =>
                        monadic(pairiGroups.find((g) => !player.Appearance.some((i) => i.Asset.Group.Name === g)))
                            .then((group) => AssetGet("Female3DCG", group, pairItemName))
                            .valueOr(undefined)
                    )
                )
                .then((asset, { SourceC }) => {
                    ChatRoomOrderTools.wearAndPair(player, asset, { prevCharacter: SourceC.MemberNumber });
                    ChatRoomOrderTools.leashTarget(SourceC);
                });
        } else if (SourceCharacter === player.MemberNumber) {
            Tools.findCharacter("TargetC", TargetCharacter)
                .then(() => InventoryGet(player, "ItemNeckRestraints"))
                .then((item, { TargetC }) => {
                    ChatRoomOrderTools.wearAndPair(player, item.Asset, { nextCharacter: TargetC.MemberNumber });
                    ChatRoomOrderTools.leashPlayer(TargetC);
                });
        }
    },
    useImage: () => Path.resolve("activities/pull_to_side.png"),
    label: {
        CN: "塞牵绳",
        EN: "Stuff the Leash",
    },
    dialog: {
        CN: "SourceCharacter走到TargetCharacter身边，把牵绳塞进对方手里.",
        EN: "SourceCharacter walks to TargetCharacter and stuffs the leash into PronounPossessive hand.",
    },
};

export default function () {
    ActivityManager.addCustomActivity([pullActivity, stuffActivity]);
    SharedCenterModifier.addModifier(DrawMods.asset(items, ["center", { X: -75, Y: 0 }], ["center", { X: 75, Y: 0 }]));
}

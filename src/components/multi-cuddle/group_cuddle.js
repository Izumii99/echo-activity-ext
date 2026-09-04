import { ActivityManager } from "../../activityForward";
import { Prereqs } from "../../prereqs";
import { DrawMods, SharedCenterModifier } from "@mod-utils/ChatRoomOrder";
import { Path } from "../../resouce";
import { monadic } from "@mod-utils/monadic";
import { ChatRoomOrderTools } from "@mod-utils/ChatRoomOrder";
import { Tools } from "@mod-utils/Tools";

function injectInvisibleAsset(groupName, assetName) {
    const group = AssetGroupGet("Female3DCG", groupName);
    if (!group) return;
    if (AssetGet("Female3DCG", groupName, assetName)) return;

    // Clone dari asset yang sudah ada sebagai template agar semua properti BC terpenuhi
    const template = group.Asset.find(a => a.Wear) ?? group.Asset[0];
    if (!template) return;

    const cloned = /** @type {any} */ ({ ...template,
        Name: assetName,
        Description: assetName,
        Visible: false,
        Value: -1,
        Random: false,
        Effect: /** @type {any[]} */ ([]),
        AllowLock: false,
        Extended: false,
        Restrain: false,
        RemoveAtLogin: true,
        Wear: true,
        Group: group,
        DynamicGroupName: groupName,
    });

    // BC menggunakan AssetMap (global Map) untuk lookup, BUKAN iterasi group.Asset
    // Harus update keduanya agar AssetGet() dan InventoryWear() bisa menemukan asset ini
    group.Asset.push(cloned);
    /* global AssetMap, Asset */
    if (typeof AssetMap !== "undefined") AssetMap.set(`${groupName}/${assetName}`, cloned);
    if (typeof Asset !== "undefined" && Array.isArray(Asset)) Asset.push(cloned);
}

/**
 * @param {object} arg
 * @param {XCharacter} arg.next
 * @param {XCharacter} arg.prev
 * @param {string} arg.groupName
 * @param {string} arg.assetName
 * @param {"follow"|"lead"} arg.type
 */
function doPairing({ next, prev, groupName, assetName }) {
    const asset = AssetGet("Female3DCG", groupName, assetName);
    console.log(`[GroupCuddle] doPairing — asset:`, asset, `| prev:`, prev?.Name, `| next:`, next?.Name, `| Player:`, Player?.Name);
    if (!asset) {
        console.error("[GroupCuddle] Asset not found, aborting pairing:", groupName, assetName);
        return;
    }
    monadic(asset).then((a) => {
        console.log("[GroupCuddle] monadic resolved, calling wearAndPair...");
        if (prev.MemberNumber === Player.MemberNumber) {
            ChatRoomOrderTools.wearAndPair(Player, a, { nextCharacter: next.MemberNumber }, "follow");
        } else if (next.MemberNumber === Player.MemberNumber) {
            ChatRoomOrderTools.wearAndPair(Player, a, { prevCharacter: prev.MemberNumber }, "lead");
        }
        console.log("[GroupCuddle] After wearAndPair, ItemMisc/ItemArms:", InventoryGet(Player, groupName));
        ChatRoomCharacterUpdate(Player);
    });
}

// Activity 1: Lap Hug (Using ItemMisc)
const lapHugActivity = {
    activity: {
        Name: "Pangku (Group Hug)",
        Prerequisite: [
            "Luzi_CanWalk",
            Prereqs.Acted.GroupEmpty(["ItemMisc"]),
            Prereqs.Acting.GroupEmpty(["ItemMisc"]),
        ],
        MaxProgress: 0,
        Target: ["ItemTorso", "ItemTorso2", "ItemArms"],
    },
    run: (player, sender, { TargetCharacter, SourceCharacter }) => {
        if (TargetCharacter === player.MemberNumber) {
            if (!ServerChatRoomGetAllowItem(sender, player)) return;
            Tools.findCharacter("SourceC", SourceCharacter).then((source) =>
                doPairing({ next: player, prev: source, groupName: "ItemMisc", assetName: "GroupHugLap" })
            );
        } else if (SourceCharacter === player.MemberNumber) {
            Tools.findCharacter("TargetC", TargetCharacter).then((target) =>
                doPairing({ next: target, prev: player, groupName: "ItemMisc", assetName: "GroupHugLap" })
            );
        }
    },
    useImage: () => Path.resolve("activities/cuddle_hold.png"),
    label: {
        CN: "Pangku (Group Hug)",
        EN: "Lap Hug (Group)",
    },
    dialog: {
        CN: "SourceCharacter memangku TargetCharacter.",
        EN: "SourceCharacter puts TargetCharacter on their lap.",
    },
};

// Activity 2: Side Hug (Using ItemArms)
const sideHugActivity = {
    activity: {
        Name: "Rangkul Samping (Group Hug)",
        Prerequisite: [
            "Luzi_CanWalk",
            Prereqs.Acted.GroupEmpty(["ItemArms"]),
            Prereqs.Acting.GroupEmpty(["ItemArms"]),
        ],
        MaxProgress: 0,
        Target: ["ItemTorso", "ItemTorso2", "ItemArms"],
    },
    run: (player, sender, { TargetCharacter, SourceCharacter }) => {
        if (TargetCharacter === player.MemberNumber) {
            if (!ServerChatRoomGetAllowItem(sender, player)) return;
            Tools.findCharacter("SourceC", SourceCharacter).then((source) =>
                doPairing({ next: player, prev: source, groupName: "ItemArms", assetName: "GroupHugSide" })
            );
        } else if (SourceCharacter === player.MemberNumber) {
            Tools.findCharacter("TargetC", TargetCharacter).then((target) =>
                doPairing({ next: target, prev: player, groupName: "ItemArms", assetName: "GroupHugSide" })
            );
        }
    },
    useImage: () => Path.resolve("activities/pull_to_side.png"),
    label: {
        CN: "Rangkul Samping (Group Hug)",
        EN: "Side Hug (Group)",
    },
    dialog: {
        CN: "SourceCharacter merangkul TargetCharacter di samping.",
        EN: "SourceCharacter hugs TargetCharacter from the side.",
    },
};

const itemsLap = [{ prev: "GroupHugLap", next: "GroupHugLap" }];
const itemsSide = [{ prev: "GroupHugSide", next: "GroupHugSide" }];

export default function () {
    injectInvisibleAsset("ItemMisc", "GroupHugLap");
    injectInvisibleAsset("ItemArms", "GroupHugSide");

    // Debug: verify injection
    const lap  = AssetGet("Female3DCG", "ItemMisc", "GroupHugLap");
    const side = AssetGet("Female3DCG", "ItemArms", "GroupHugSide");
    console.log("[GroupCuddle] Asset inject result — GroupHugLap:", lap, "| GroupHugSide:", side);

    ActivityManager.addCustomActivity([lapHugActivity, sideHugActivity]);
    
    // Lap Hug offset: Y -50 (like Cuddle)
    SharedCenterModifier.addModifier(DrawMods.asset(itemsLap, ["center", { X: 0, Y: -50 }], ["center"]));
    
    // Side Hug offset: X 75 (like Pull to Side)
    SharedCenterModifier.addModifier(DrawMods.asset(itemsSide, ["center", { X: -75, Y: 0 }], ["center", { X: 75, Y: 0 }]));
}

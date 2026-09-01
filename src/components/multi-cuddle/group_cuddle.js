import { ActivityManager } from "../../activityForward";
import { Prereqs } from "../../prereqs";
import { DrawMods, SharedCenterModifier } from "@mod-utils/ChatRoomOrder";
import { Path } from "../../resouce";
import { monadic } from "@mod-utils/monadic";
import { ChatRoomOrderTools } from "@mod-utils/ChatRoomOrder";
import { Tools } from "@mod-utils/Tools";

function injectInvisibleAsset(groupName, assetName) {
    const group = AssetGroupGet("Female3DCG", groupName);
    if (group) {
        if (!AssetGet("Female3DCG", groupName, assetName)) {
            group.Asset.push({
                Name: assetName,
                Description: assetName,
                Group: group,
                Visible: false,
                Wear: true,
                Value: -1,
                Random: false,
                Effect: []
            });
        }
    }
}

/**
 * @param {object} arg
 * @param {XCharacter} arg.next
 * @param {XCharacter} arg.prev
 * @param {string} groupName
 * @param {string} assetName
 * @param {"follow"|"lead"} type
 */
function doPairing({ next, prev, groupName, assetName, type }) {
    monadic(AssetGet("Female3DCG", groupName, assetName)).then((asset) => {
        if (prev.MemberNumber === Player.MemberNumber) {
            ChatRoomOrderTools.wearAndPair(Player, asset, { nextCharacter: next.MemberNumber }, type);
        } else if (next.MemberNumber === Player.MemberNumber) {
            ChatRoomOrderTools.wearAndPair(Player, asset, { prevCharacter: prev.MemberNumber }, type);
        }
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
                doPairing({ next: player, prev: source, groupName: "ItemMisc", assetName: "GroupHugLap", type: "lead" })
            );
        } else if (SourceCharacter === player.MemberNumber) {
            Tools.findCharacter("TargetC", TargetCharacter).then((target) =>
                doPairing({ next: target, prev: player, groupName: "ItemMisc", assetName: "GroupHugLap", type: "lead" })
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
                doPairing({ next: player, prev: source, groupName: "ItemArms", assetName: "GroupHugSide", type: "lead" })
            );
        } else if (SourceCharacter === player.MemberNumber) {
            Tools.findCharacter("TargetC", TargetCharacter).then((target) =>
                doPairing({ next: target, prev: player, groupName: "ItemArms", assetName: "GroupHugSide", type: "lead" })
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

    ActivityManager.addCustomActivity([lapHugActivity, sideHugActivity]);
    
    // Lap Hug offset: Y -50 (like Cuddle)
    SharedCenterModifier.addModifier(DrawMods.asset(itemsLap, ["center", { X: 0, Y: -50 }], ["center"]));
    
    // Side Hug offset: X 75 (like Pull to Side)
    SharedCenterModifier.addModifier(DrawMods.asset(itemsSide, ["center", { X: -75, Y: 0 }], ["center", { X: 75, Y: 0 }]));
}

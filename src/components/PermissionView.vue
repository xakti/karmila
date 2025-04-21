<template>
    <Card class="drop-shadow">
        <template #title>
            <span class="font-bold">Permissions & Keys</span>
        </template>
        <template #content>
            <Tree :value="permissions" scroll-height="flex">
                <template #default="{node}">
                    <Fieldset :legend="`${node.label} (${node.data.required_auth.threshold})`">
                        <template v-if="node.data.required_auth.keys.length > 0">
                            <div v-for="(it,n) in node.data.required_auth.keys" :key="n"
                                 class="border rounded-md border-surface p-1 flex flex-col whitespace-nowrap">
                                <p>
                                    <span>+{{ it.weight }}</span>
                                    <i class="pi pi-key mx-3 cursor-pointer" @click="formatKey(it)"></i>
                                    <span>{{ it.key }}</span>
                                </p>
                            </div>
                        </template>
                        <template v-if="node.data.required_auth.accounts.length > 0">
                            <div v-for="(it,n) in node.data.required_auth.accounts" :key="n"
                                 class="border rounded-md border-surface p-1 flex flex-col my-2 whitespace-nowrap">
                                <span>+{{ it.weight }} {{ it.permission.actor }}@{{ it.permission.permission }}</span>
                            </div>
                        </template>
                        <template v-if="node.data.required_auth.waits.length > 0">
                            <div v-for="(it,n) in node.data.required_auth.waits" :key="n"
                                 class="border rounded-md border-surface p-1 flex flex-col">
                                <span>+{{ it.weight }} Wait {{ it.wait_sec }} Seconds</span>
                            </div>
                        </template>
                    </Fieldset>
                </template>
            </Tree>
            <Message size="small" severity="info">
                Note:
                PUB_K1 keys are the new format for public keys and are interchangeable with the old format.
                Click on the <i class="pi pi-key"/> icon to see the old format.
            </Message>
        </template>
    </Card>
</template>

<script setup>

import {onActivated, onMounted, ref, watch} from "vue";
import {PublicKey, Serializer} from "@wharfkit/antelope";

/*
const data = [
    {
        "perm_name": "active",
        "parent": "owner",
        "required_auth": {
            "threshold": 1,
            "keys": [
                {
                    "key": "VEX5bSxGA9sxpskLUeTFNBuFvoPVQqKcQnRA45cmUGhKSNFx7pyuK",
                    "weight": 1
                }
            ],
            "accounts": [
                {
                    "permission": {
                        "actor": "sawityildfam",
                        "permission": "vex.code"
                    },
                    "weight": 1
                }
            ],
            "waits": [{"wait_sec": 120, "weight": 1}]
        }
    },
    {
        "perm_name": "cron",
        "parent": "active",
        "required_auth": {
            "threshold": 1,
            "keys": [
                {
                    "key": "VEX7PmyUaRYZqPZZyFdSBdFQsqGjhc4emUBvAs9rQXKzaB9YNqY3c",
                    "weight": 1
                }
            ],
            "accounts": [],
            "waits": []
        }
    },
    {
        "perm_name": "owner",
        "parent": "",
        "required_auth": {
            "threshold": 1,
            "keys": [
                {
                    "key": "VEX5bSxGA9sxpskLUeTFNBuFvoPVQqKcQnRA45cmUGhKSNFx7pyuK",
                    "weight": 1
                }
            ],
            "accounts": [],
            "waits": []
        }
    }
];
*/
const props = defineProps({
    permissions: Array
});
const permissions = ref([]);

onMounted(hook);
onActivated(hook);

function hook() {
    let object = Serializer.objectify(props.permissions);
    permissions.value = findChildren(object, "");
}

watch(() => props.permissions, hook);

function formatKey(data) {
    if (data.k1) {
        data.key = data.k1;
        delete data.k1;
    } else {
        data.k1 = data.key;
        data.key = PublicKey.from(data.key).toLegacyString("VEX");
    }
}


function findChildren(src, parent) {
    return src.filter(it => it.parent === parent).map((ij) => {
        let tmp = {
            label: ij.perm_name,
            data: ij
        };
        tmp.key = parent.length === 0 ? "owner" : `${ij.parent}-${ij.perm_name}`;
        const children = findChildren(src, ij.perm_name);
        if (children.length > 0) {
            tmp.children = children;
        }
        return tmp;
    });
}

</script>

<template>
    <div id="newborn" class="p-2">

        <Card v-if="ready" class="drop-shadow md:w-2/3 md:mx-auto">
            <template #title>Newborn</template>
            <template #content>
                <DataTable :value="newborn" size="small" resizable-columns scrollable scroll-height="500px">
                    <Column header="Account">
                        <template #body="{data}">
                            <Button link as="router-link" :to="`/account/${getName(data.data)}`">{{
                                    getName(data.data)
                                }}
                            </Button>
                        </template>
                    </Column>
                    <Column header="Creator">
                        <template #body="{data}">
                            <Button link as="router-link" :to="`/account/${data.data.creator}`">{{
                                    data.data.creator
                                }}
                            </Button>
                        </template>
                    </Column>
                    <Column header="Time"
                            :field="it => DateTime.fromISO(it.timestamp + 'Z').toRelative()"></Column>
                </DataTable>
            </template>
        </Card>
        <div v-else class="flex h-screen w-screen">
            <div class="m-auto">
                <ProgressSpinner stroke-width="5"></ProgressSpinner>
            </div>
        </div>

    </div>
</template>

<script setup>
import {onActivated, ref} from "vue";
import {DateTime} from "luxon";
import {endpointHyperion} from "../js/nodes.js";
import {useToast} from "primevue";

const toast = useToast();
const newborn = ref([]);
const ready = ref(false);


onActivated(() => {
    fetchNewAccount();
});

function getName(data) {
    // beda nama field pada versi hyperion
    return (data.hasOwnProperty("name")) ? data.name : data.newact;
}

async function fetchNewAccount() {
    let url = `${endpointHyperion}/v2/history/get_actions?account=vexcore&act.name=newaccount&simple=true&limit=20`;
    try {
        let res = await fetch(url);
        if (res.ok) {
            res = await res.json();
            newborn.value = res.simple_actions;
            ready.value = true;
        }
    } catch (e) {
        toast.add({life: 3000, severity: "error", summary: "Loading Error", detail: e.message});
    }
}
</script>



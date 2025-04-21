<template>
    <div id="block">

        <template v-if="ready">
            <Card class="drop-shadow m-2 md:w-1/2 md:mx-auto">
                <template #content>
                    <div class="inline-flex items-center gap-2 mb-1">
                        <span class="font-bold text-lg">Block {{ route.params.number }}</span>
                        <Button v-if="isPending()" rounded size="small" :label="`${pending}s`">
                            <template #icon><i class="pi pi-hourglass animate-spin"></i></template>
                        </Button>
                        <Button v-else rounded size="small" label="Irreversible" icon="pi pi-lock"></Button>
                        <Button rounded size="small" icon="pi pi-download" @click="doDownload"></Button>
                    </div>
                    <p class="truncate">Block ID: {{ block.id }}</p>
                    <p>Producer:
                        <Button link as="router-link" :to="`/producer/${block.producer}`">{{ block.producer }}</Button>
                    </p>
                    <span>Time:
                    {{
                            DateTime.fromISO(block.timestamp + 'Z').toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
                        }}</span>
                </template>
            </Card>
            <div class="m-2 p-1 border border-surface rounded-md shadow-md">
                <DataTable :value="block.transactions" size="small" scrollable scroll-height="400px"
                           :data-key="it => it.id"
                           resizable-columns
                           v-model:expanded-rows="expandedRows">
                    <template #header>
                        <span class="font-bold text-lg">{{ countTransaction() }}</span>
                    </template>
                    <Column expander style="width: 5rem"/>
                    <Column header="TX ID" :field="it => it.id"></Column>
                    <Column header="Root Action">
                        <template #body="{data}">
                            <span>{{ data.actions[0].action }} on {{ data.actions[0].account }}</span>
                        </template>
                    </Column>
                    <Column header="# Actions">
                        <template #body="{data}">
                            <span>{{ data.actions.length }}</span>
                        </template>
                    </Column>
                    <template #expansion="{data}">
                        <DataTable :value="data.actions">
                            <Column header="Action">
                                <template #body="{data}">
                                    <span>{{ data.action }} on {{ data.account }}</span>
                                </template>
                            </Column>
                            <Column header="Data">
                                <template #body="{data}">
                                    <ActDataView :data="data.data"></ActDataView>
                                </template>
                            </Column>
                            <Column header="Authorization">
                                <template #body="{data}">
                                    <span>{{ data.authorization[0].account }}@{{
                                            data.authorization[0].permission
                                        }}</span>
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </DataTable>
            </div>
        </template>
        <div v-else class="flex h-screen w-screen">
            <div class="m-auto">
                <ProgressSpinner stroke-width="5"></ProgressSpinner>
            </div>
        </div>

    </div>
</template>
<script setup>
import {onActivated, reactive, ref} from "vue";
import {onBeforeRouteLeave, useRoute} from "vue-router";
import {useToast} from "primevue";
import {DateTime} from "luxon";
import ActDataView from "../components/ActDataView.vue";
import {endpointHyperion} from "../js/nodes.js";
import ChainInfo from "../js/chain-info.js";
import {startInterval,download} from "../js/utils.js";

const route = useRoute();
const toast = useToast();
const block = reactive({number: 0});
const expandedRows = ref([]);
const ready = ref(false);
const pending = ref(0);
let stopPending = null;
let stopLIB = null


onActivated(() => {
    ChainInfo.getChainInfo();
    if (block.number !== route.params.number) fetchBlock();

    stopPending = startInterval(refreshPending, 1000);
    stopLIB = startInterval(ChainInfo.getChainInfo, 3000);
});

onBeforeRouteLeave(() => {
    stopPending();
    stopLIB();
});

function isPending() {
    return block.number > ChainInfo.chainInfo.last_irreversible_block_num && pending.value > 0;
}

function refreshPending() {
    pending.value = Math.max(pending.value - 1, 0);
}

function countTransaction() {
    let len = block.transactions.length;
    let label = `${len} Transaction`;
    if (len > 1) label += "s";
    return label;
}

async function fetchBlock() {
    try {
        let res = await fetch(`${endpointHyperion}/v1/trace_api/get_block`, {
            method: "POST", body: JSON.stringify({
                block_num: route.params.number
            })
        });
        if (res.ok) {
            res = await res.json();
            let diff = res.number - ChainInfo.chainInfo.last_irreversible_block_num;
            pending.value = Math.floor(diff / 2);
            Object.assign(block, res);
            ready.value = true;
        }
    } catch (e) {
        ready.value = false;
        toast.add({life: 3000, severity: "error", summary: "Error", detail: e.message});
    }
}

function doDownload() {
    let fileName = `VEX_BLOCK_${block.number}.txt`;
    download(fileName, JSON.stringify(block, null, 2));
}
</script>



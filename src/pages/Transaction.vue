<template>
    <div id="transaction" class="p-2">

        <template v-if="ready">
            <div class="border border-surface rounded-md shadow-md p-2 md:w-1/2 md:mx-auto">
                <div class="inline-flex items-center gap-2 mb-1">
                    <span class="font-bold text-lg">Transaction</span>
                    <Button v-if="isPending()" rounded size="small" :label="`${pending}s`">
                        <template #icon><i class="pi pi-hourglass animate-spin"></i></template>
                    </Button>
                    <Button v-else rounded size="small" label="Irreversible" icon="pi pi-lock"></Button>
                    <Button rounded size="small" icon="pi pi-download" @click="doDownload"></Button>
                </div>
                <p class="text-sm truncate">{{ trx.trx_id }}</p>
                <div class="flex flex-col">
                    <span>Block number:
                        <router-link class="text-primary-400" :to="`/block/${trx.actions[0].block_num}`">
                            {{ trx.actions[0].block_num }}
                        </router-link>
                    </span>
                    <span>Block time: {{
                            DateTime.fromISO(trx.actions[0].timestamp + 'Z').toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
                        }}</span><br>
                    <div class="flex flex-wrap justify-between">
                        <Fieldset legend="Usage" class="size-fit">
                            <div><span class="text-green-400 font-semibold text-lg">CPU</span> {{ usage.cpu }} µs
                            </div>
                            <div><span class="text-cyan-500 font-semibold text-lg">NET</span> {{ usage.net }} bytes
                            </div>
                        </Fieldset>
                        <Fieldset legend="Producer" class="size-fit text-center">
                            <Button link as="router-link" :to="`/producer/${producer}`">{{ producer }}</Button>
                        </Fieldset>
                    </div>
                </div>
            </div>

            <div class="mt-2 p-1 border border-surface rounded-md shadow-md">
                <DataTable :value="trx.actions" size="small" resizable-columns scrollable scroll-height="400px">
                    <template #header>
                        <span class="font-bold text-lg">{{ countActions(trx.actions) }}</span>
                    </template>
                    <Column header="Contract" :field="it => it.act.account"></Column>
                    <Column header="Action" :field="it => it.act.name"></Column>
                    <Column header="Data" :field="it => it.act.data" class="max-w-[250px]">
                        <template #body="{data}">
                            <ActDataView :data="data.act.data"></ActDataView>
                        </template>
                    </Column>
                    <Column header="Authorization">
                        <template #body="{data}">
                            <span>{{ data.act.authorization[0].actor }}@{{
                                    data.act.authorization[0].permission
                                }}</span>
                        </template>
                    </Column>
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
import {endpointHyperion} from "../js/nodes.js";
import ChainInfo from "../js/chain-info.js";
import ActDataView from "../components/ActDataView.vue";
import {startInterval, download} from "../js/utils.js";

const route = useRoute();
const toast = useToast();
const trx = reactive({trx_id: ""});
const usage = reactive({cpu: 0, net: 0});
const producer = ref("");
const ready = ref(false);
const pending = ref(0);
let stopPending = null;
let stopLIB = null;

onActivated(() => {
    ChainInfo.getChainInfo();
    if (trx.trx_id !== route.params.id) fetchTransaction();
    stopPending = startInterval(refreshPending, 1000);
    stopLIB = startInterval(ChainInfo.getChainInfo, 3000);
});

onBeforeRouteLeave(() => {
    stopPending();
    stopLIB();
});

function doDownload() {
    let fileName = `VEX_TRX_${trx.trx_id}.txt`;
    download(fileName, JSON.stringify(trx, null, 2));
}

function isPending() {
    return trx.actions[0].block_num > ChainInfo.chainInfo.last_irreversible_block_num && pending.value > 0;
}

function refreshPending() {
    pending.value = Math.max(pending.value - 1, 0);
}

function countActions(actions) {
    let len = actions.length;
    let label = `${len} Action`;
    if (len > 1) label += "s";
    return label;
}

function findResourceUsage(actions) {
    actions.every(it => {
        if (it.action_ordinal === 1) {
            usage.cpu = it.cpu_usage_us;
            usage.net = it.net_usage_words;
            producer.value = it.producer;
            return false;
        }
        return true;
    });
}

async function fetchTransaction() {
    try {
        let res = await fetch(`${endpointHyperion}/v2/history/get_transaction?id=${route.params.id}`);
        if (res.ok) {
            res = await res.json();

            let diff = res.actions[0].block_num - ChainInfo.chainInfo.last_irreversible_block_num;
            pending.value = Math.floor(diff / 2);

            Object.assign(trx, res);
            findResourceUsage(res.actions);
            ready.value = true;
        }
    } catch (e) {
        ready.value = false;
        toast.add({life: 3000, severity: "error", summary: "Error", detail: e.message});
    }
}
</script>



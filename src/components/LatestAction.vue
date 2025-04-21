<template>
    <div class="border rounded-md shadow-md border-surface p-1">
        <DataTable :value="ChainInfo.actions.value" size="small" resizable-columns column-resize-mode="fit"
                   scrollable scroll-height="480px">
            <template #header>
                <span class="font-bold text-lg">Latest Actions</span>
            </template>
            <Column header="TX">
                <template #body="{data}">
                    <Button link as="router-link" :to="`/transaction/${data.transaction_id}`">{{
                            data.transaction_id.slice(0, 8)
                        }}
                    </Button>
                </template>
            </Column>
            <Column header="Contract" field="contract"></Column>
            <Column header="Action" field="action"></Column>
            <Column header="Data" style="max-width: 250px">
                <template #body="{data}">
                    <ActDataView :data="data.data"></ActDataView>
                </template>
            </Column>
            <Column header="Authorization" field="actors"></Column>
        </DataTable>
    </div>

</template>
<script setup>
import {endpointHyperion} from "../js/nodes.js";
import {onActivated} from "vue";
import {onBeforeRouteLeave} from "vue-router";
import ActDataView from "./ActDataView.vue";
import ChainInfo from "../js/chain-info.js";
import {startInterval} from "../js/utils.js";

let stopFetchActions = null;

onActivated(() => {
    fetchActions();
    stopFetchActions = startInterval(fetchActions, 1000);
});

onBeforeRouteLeave(() => {
    stopFetchActions();
});

async function fetchActions() {
    let search = new URLSearchParams();
    search.set("skip", 0);
    search.set("limit", 10);
    search.set("simple", true);
    search.set("noBinary", true);

    let fullUrl = `${endpointHyperion}/v2/history/get_actions?${search.toString()}`;
    try {
        let res = await fetch(fullUrl, {
            headers: {"Content-Type": "application/json"}
        });
        if (res.ok) {
            res = await res.json();
            ChainInfo.actions.value = res.simple_actions;
        }
    } catch (e) {
        console.log(e.message);
    }
}

</script>



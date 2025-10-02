<template>
    <Card class="drop-shadow ">
        <template #content>
            <div class="flex gap-2 max-sm:flex-wrap max-sm:justify-center">
                <Fieldset legend="Chain Info" class="w-full">
                    <div class="flex justify-between gap-2 text-nowrap">
                        <div class="flex flex-col">
                            <span>VEX Price:</span>
                            <span>Head Producer:</span>
                            <span>Latest Block:</span>
                        </div>
                        <div class="flex flex-col" style="min-width: 100px">
                            <span>{{ vexPrice }}</span>
                            <span>{{ ChainInfo.chainInfo.head_block_producer }}</span>
                            <span>{{ ChainInfo.chainInfo.head_block_num }}</span>
                        </div>
                    </div>
                </Fieldset>
                <Fieldset legend="RAM" class="w-full">
                    <div class="flex justify-between gap-2 text-nowrap">
                        <div class="flex flex-col">
                            <span>Price:</span>
                            <span>Reserved:</span>
                            <span>Max:</span>
                        </div>
                        <div class="flex flex-col">
                            <span>{{ ChainInfo.ramPrice }} VEX/Kb</span>
                            <span>{{ ram.reserved }}</span>
                            <span>{{ ram.max }}</span>
                        </div>
                    </div>
                </Fieldset>
                <Fieldset legend="Hourly Traffic" class="w-full">
                    <div class="flex justify-between gap-2">
                        <div class="flex flex-col">
                            <span>Actors:</span>
                            <span>Actions:</span>
                            <span>TXs:</span>
                        </div>
                        <div class="flex flex-col">
                            <span>{{ ChainInfo.actionUsage.data.unique_actors }}</span>
                            <span>{{ groupNumber(ChainInfo.actionUsage.data.action_count) }}</span>
                            <span>{{ groupNumber(ChainInfo.actionUsage.data.tx_count) }}</span>
                        </div>
                    </div>
                </Fieldset>
            </div>
        </template>
    </Card>
</template>

<script setup>

import {onActivated, reactive, ref} from "vue";
import {onBeforeRouteLeave} from "vue-router";
import ChainInfo from "@/js/chain-info.js";
import {formatBytes, startInterval, groupNumber} from "@/js/utils.js";

const vexPrice = ref("Loading...");
const ram = reactive({max: "0 GB", reserved: "0 GB", percent: 0});

let stopChainInfo = null;

onActivated(() => {
    getVexPrice();
    ChainInfo.getActionUsage();
    ChainInfo.fetchRamMarket();
    ChainInfo.fetchVexcoreGlobal().then(calculateRam);

    stopChainInfo = startInterval(ChainInfo.getChainInfo, 1000);
});

onBeforeRouteLeave(() => {
    stopChainInfo();
});

async function getVexPrice() {
    await ChainInfo.fetchVexPrice();
    vexPrice.value = `${ChainInfo.vexPrice.value}`;
}

async function calculateRam() {
    let data = ChainInfo.vexcoreGlobal;
    let maxRam = parseInt(data.max_ram_size);
    let ramReserved = parseInt(data.total_ram_bytes_reserved);
    let percent = (ramReserved / maxRam) * 100;
    ram.max = formatBytes(maxRam, 0);
    ram.reserved = formatBytes(ramReserved, 3);
    ram.percent = parseFloat(percent.toFixed(2));
}


</script>


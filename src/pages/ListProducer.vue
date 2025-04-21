<template>
    <div id="producer-list">

        <div class="px-2">
            <Message v-if="infoStake.show" class="mt-2" closable severity="info">{{ infoStake.message }}</Message>
        </div>

        <div v-if="producers.rows.length > 0" class="border rounded-md border-surface shadow-md p-1 m-2">
            <DataTable :value="producers.rows" v-model:selection="selectedProducers" data-key="owner"
                      size="small" resizable-columns scrollable scroll-height="550px">
                <template #footer>
                    <div class="flex justify-center gap-2">
                        <FloatLabel variant="in">
                            <AutoComplete input-id="search" :suggestions="suggestions.producer"
                                          @complete="completeProducer" @itemSelect="onClickProducer"></AutoComplete>
                            <label for="search">Search</label>
                        </FloatLabel>
                        <Button label="Vote" @click="vote"></Button>
                    </div>
                </template>

                <Column header="Rank" field="pos"></Column>
                <Column header="Name" header-class="">
                    <template #body="{data}">
                        <div class="inline-flex gap-2 items-center">
                            <img v-if="data.logo" :src="data.logo" alt="" width="32"/>
                            <router-link :to="`/producer/${data.owner}`">
                                {{ data.owner }}
                            </router-link>
                        </div>
                    </template>
                </Column>
                <Column header="Status">
                    <template #body="{data}">
                        <Tag :severity="colorBP(data)" rounded :value="statusBP(data)"></Tag>
                    </template>
                </Column>
                <Column header="Votes %" :field="it=> it.percent.toFixed(3)"></Column>
                <Column header="Total Votes" field="stake"></Column>
                <Column header="Rewards Per Day" field="rewards"></Column>
                <Column header="Compliance">
                    <template #body="{data}">
                        <div class="flex flex-col">
                            <span class="mx-auto">{{ data.compliance.count }}/6</span>
                            <ProgressBar :value="data.compliance.percent"></ProgressBar>
                        </div>
                    </template>
                </Column>
                <Column header="Last Claim"
                        :field="it=> DateTime.fromISO(`${it.last_claim_time}Z`).toRelative()"></Column>
                <Column selectionMode="multiple"></Column>
            </DataTable>
        </div>
        <div v-else class="flex w-screen h-screen">
            <div class="m-auto">
                <ProgressSpinner stroke-width="5"></ProgressSpinner>
            </div>
        </div>

    </div>
</template>

<script setup>
import {useToast} from "primevue";
import {onActivated, reactive, ref} from "vue";
import {onBeforeRouteLeave, useRouter} from "vue-router";
import {Asset} from "@wharfkit/antelope";
import {PlaceholderName} from "@wharfkit/signing-request";
import {DateTime} from "luxon";
import {client, contractKit} from "../js/nodes.js";
import ChainInfo from "../js/chain-info.js";
import {copyToClipboard, startInterval} from "../js/utils.js";
import {producers, fetchProducers, fetchBPJson} from "../js/producer.js";
import {suggestions, completeProducer} from "../js/auto.js";
import Wallet from "../js/wallet.js";

const router = useRouter();
const toast = useToast();
const vexStats = reactive({supply: Asset.fromString("0.0000 VEX"), stake: Asset.fromString("0.0000 VEX"), percent: 0});
const infoStake = reactive({show: false, message: ""});
const selectedProducers = ref([]);
let stopBeat = null;


onActivated(() => {
    ChainInfo.fetchVexcoreGlobal().then(() => {
        if (producers.rows.length === 0) {
            loadProducers();
        }
    });
    percentStaked();
    stopBeat = startInterval(beat, 1000);
});

onBeforeRouteLeave(() => {
    stopBeat();
});

async function vote() {
    let producers = selectedProducers.value.map(it => it.owner);
    if (producers.length === 0) {
        toast.add({severity: "warn", life: 3000, summary: "Vote Producers", detail: "no producer selected"});
        return;
    }

    const sc = await contractKit.load("vexcore");
    let action = sc.action("voteproducer", {
        voter: PlaceholderName, proxy: "", producers: producers
    });
    let sr = await Wallet.createSigningRequest({action});
    let vsr = sr.encode(true, false, "vsr:");
    copyToClipboard(vsr);
    toast.add({severity: "success", life: 3000, summary: "Vote Producers", detail: "vsr copied"});
}

function statusBP(data) {
    if (data.owner === ChainInfo.chainInfo.head_block_producer) {
        return "Producing";
    } else if (data.pos <= 21) {
        return "Top 21";
    } else {
        return "Paid Standby";
    }
}

function colorBP(data) {
    if (data.owner === ChainInfo.chainInfo.head_block_producer) {
        return "success";
    } else {
        return "danger";
    }
}

function onClickProducer(event) {
    router.push(`/producer/${event.value}`);
}

/**
 * jumlah VEX yang distake di akun vex.stake
 */
async function percentStaked() {
    await fetchVexStake();
    await fetchVexStats();
    let supply = vexStats.supply.units;
    let stake = vexStats.stake.units;
    let percent = (stake / supply) * 100;
    vexStats.percent = parseFloat(percent.toFixed(2));

    infoStake.message = `Total Staked ${vexStats.stake} (${vexStats.percent}%)`;
    infoStake.show = true;
}

async function fetchVexStats() {
    let res = await client.v1.chain.get_currency_stats("vex.token", "VEX");
    vexStats.supply = res.VEX.supply;
}

async function fetchVexStake() {
    let res = await client.v1.chain.get_currency_balance("vex.token", "vex.stake", "VEX");
    vexStats.stake = res[0];
}

async function beat() {
    // baca chain info untuk mendapatkan head producer
    await ChainInfo.getChainInfo();
    let producer = ChainInfo.chainInfo.head_block_producer;
    let res = await fetchProducers(producer, 1);

    let n = producers.rows.findIndex(it => it.owner === producer);
    let newData = res.rows[0];
    delete newData.pos;
    Object.assign(producers.rows[n], newData);
}

async function loadProducers() {
    producers.pos = 1;
    let res = await fetchProducers(undefined);
    producers.rows = res.rows;
    producers.more = res.more;
    producers.pos = res.rows.length + 1;

    producers.rows.forEach(it => {
        fetchBPJson(it).then(json => {
            it.logo = json.org.branding.logo_256;
        });
    });
}

</script>



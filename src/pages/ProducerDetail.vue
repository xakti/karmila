<template>
    <div id="producer-detail" class="p-2">

        <template v-if="producerReady">
            <Card class="drop-shadow md:w-1/2 md:mx-auto">
                <template #content>
                    <div v-if="producer.compliance.count > 0" class="flex flex-row gap-2 items-center">
                        <img :src="producer.logo.value" alt="" width="64">
                        <div class="flex flex-col">
                            <router-link :to="`/account/${route.params.name}`">
                                {{ route.params.name }}
                            </router-link>
                            <span class="font-bold text-2xl">{{ producer.json.org.candidate_name }}</span>
                        </div>
                    </div>
                    <div v-else class="flex flex-nowrap gap-2 items-center">
                        <router-link class="font-bold text-2xl" :to="`/account/${route.params.name}`">
                            {{ route.params.name }}
                        </router-link>
                    </div>

                    <div class="flex flex-col mt-2">
                        <div v-if="producer.url" class="flex justify-between">
                            <span class="font-bold">Website:</span>
                            <a :href="producer.url" target="_blank">{{ producer.url }}</a>
                        </div>
                        <div v-if="producer.email" class="flex justify-between">
                            <span class="font-bold">Email:</span>
                            <a :href="`mailto:${producer.email}`" target="_blank">{{ producer.email }}</a>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-bold">Location:</span>
                            <span>{{ producer.location.name }} {{ getFlagEmoji(producer.location.country) }}</span>
                        </div>
                        <div class="flex gap-2 justify-center mt-2">
                            <a :href="`https://github.com/${producer.social.github}`" target="_blank">
                                <i class="pi pi-github" style="font-size: 1.5rem"/></a>
                            <a :href="`https://t.me/${producer.social.telegram}`" target="_blank">
                                <i class="pi pi-telegram" style="font-size: 1.5rem"/></a>
                            <a :href="`https://x.com/${producer.social.twitter}`" target="_blank">
                                <i class="pi pi-twitter" style="font-size: 1.5rem"/></a>
                            <a :href="`https://youtube.com/${producer.social.youtube}`" target="_blank">
                                <i class="pi pi-youtube" style="font-size: 1.5rem"/></a>
                        </div>
                    </div>
                    <Divider></Divider>
                    <div class="flex justify-between gap-2">
                        <span class="font-bold text-nowrap">Total Votes:</span>
                        <span>{{ producer.stake }} ({{ producer.percent.toFixed(3) }}%)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-bold">Block Pay:</span>
                        <span>{{ producer.blockPay }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-bold">Vote Pay:</span>
                        <span>{{ producer.votePay }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-bold">Last Claim:</span>
                        <span>{{ producer.lastClaim.toRelative() }}</span>
                    </div>
                    <Fieldset legend="Compliance">
                        <div class="grid grid-cols-3 gap-2">
                            <Tag v-for="(it,key,n) in producer.compliance.value" :key="n"
                                 :icon="`pi ${it ? 'pi-check' : 'pi-times'}`"
                                 :value="key" :severity="it ? 'success' : 'danger'"></Tag>
                        </div>
                    </Fieldset>
                </template>
                <template #footer>
                    <div class="flex justify-end">
                        <Button label="Vote" @click="voteVSR"></Button>
                    </div>
                </template>
            </Card>
        </template>

        <Card v-if="producerReady.value && producer.json.nodes.length > 0" class="drop-shadow md:w-1/2 md:mx-auto mt-2">
            <template #title>Nodes</template>
            <template #content>
                <div class="flex flex-wrap gap-2 justify-center">
                    <div v-for="(it,n) in producer.json.nodes" :key="n"
                         class="border rounded-xl flex flex-col p-2 shadow">
                        <span class="font-bold text-lg text-center">{{ capitalizeFirstLetter(it.node_type) }}</span>
                        <span v-if="it.api_endpoint">API: <a :href="it.api_endpoint" target="_blank">{{
                                it.api_endpoint
                            }}</a></span>
                        <span v-if="it.ssl_endpoint">SSL: <a :href="it.ssl_endpoint" target="_blank">{{
                                it.ssl_endpoint
                            }}</a></span>
                        <span v-if="it.p2p_endpoint">P2P: <a :href="it.p2p_endpoint" target="_blank">{{
                                it.p2p_endpoint
                            }}</a></span>
                        <Fieldset v-if="it.features" legend="Features">
                            <div class="flex flex-wrap gap-2">
                                <Tag v-for="(ij,m) in it.features" :key="m" :value="ij"></Tag>
                            </div>
                        </Fieldset>
                    </div>
                </div>
            </template>
        </Card>

        <div v-if="voters.length > 0" class="border border-surface rounded-md shadow mt-2 p-2 md:w-1/2 md:mx-auto">
            <span class="font-bold text-lg">Voters</span>
            <DataTable ref="scroll" :value="voters" resizable-columns size="small" scrollable scroll-height="450px">
                <Column header="No" field="no"></Column>
                <Column header="Account">
                    <template #body="{data}">
                        <Button link as="router-link" :to="`/account/${data.account}`">{{ data.account }}</Button>
                    </template>
                </Column>
                <Column header="Weight" :field="it => it.stake"></Column>
            </DataTable>
            <div class="flex justify-center gap-2 mt-2">
                <FloatLabel variant="in">
                    <InputNumber fluid id="skip" v-model="votersQuery.skip" :min="1"></InputNumber>
                    <label for="skip">Skip</label>
                </FloatLabel>
                <Button label="More" :loading="votersQuery.loading" @click="moreVoters"></Button>
            </div>
        </div>

    </div>
</template>

<script setup>
import {useRoute, useRouter} from "vue-router";
import {onActivated, reactive, ref} from "vue";
import {useToast} from "primevue";
import {PlaceholderName} from "@wharfkit/signing-request";
import {abiCache} from "../js/nodes.js";
import ChainInfo from "@/js/chain-info.js";
import Wallet from "@/js/wallet.js";
import {fetchProducers, fetchVoters} from "@/js/producer.js";
import {capitalizeFirstLetter, copyToClipboard, getFlagEmoji} from "@/js/utils.js";
import {Action} from "@wharfkit/antelope";

const route = useRoute();
const router = useRouter();
const toast = useToast();
let producer = null;
const producerReady = ref(false);
const voters = ref([]);
const votersQuery = reactive({skip: 40, loading: false});
const loading = ref(false);
const scroll = ref();

onActivated(async () => {
    producerReady.value = false;
    await ChainInfo.fetchVexcoreGlobal();
    loadProducer();
    if (producer && producer.owner !== route.params.name) loadVoters();
});

async function loadProducer() {
    let res = await fetchProducers(route.params.name, 1);
    if (res.rows.length > 0) {
        producer = res.rows[0];
        producer.fetchBPJson();
        producerReady.value = true;
    } else {
        toast.add({severity: "info", life: 3000, summary: "Not Found", detail: "account not registered as producer"});
    }
}

async function loadVoters() {
    voters.value = [];
    let data = await fetchVoters(route.params.name);
    if (data.length > 0) {
        voters.value = data;
    }
}

async function moreVoters() {
    votersQuery.loading = true;
    let data = await fetchVoters(route.params.name, votersQuery.skip);
    if (data.length > 0) {
        voters.value = data;
        votersQuery.skip += data.length;
        votersQuery.loading = false;
        setTimeout(() => {
            if (scroll != null) {
                scroll.value.$el.firstElementChild.scrollTo({top: 0, behavior: "smooth"});
            }
        }, 200);
    } else {
        toast.add({life: 3000, severity: "info", summary: "Voters", detail: "no more voters"});
        votersQuery.loading = false;
    }
}

async function createVoteVSR() {
    const abi = await abiCache.getAbi("vexcore");
    const action = Action.from({
        account: "vexcore", name: "voteproducer", authorization: [],
        data: {
            voter: PlaceholderName, proxy: "", producers: [producer.owner]
        }
    }, abi);
    const request = await Wallet.createSigningRequest({action});
    return request.encode(true, false, "vsr:");
}

async function voteVSR() {
    try {
        let vsr = await createVoteVSR();
        let msg;
        if (Wallet.isConnected()) {
            await Wallet.session.signingRequest(vsr);
            msg = "thank you";
        } else {
            copyToClipboard(vsr);
            msg = "vsr copied";
        }
        toast.add({severity: "success", life: 3000, summary: "Vote Producer", detail: msg});
    } catch (e) {
        toast.add({severity: "error", life: 3000, summary: "Vote Failed", detail: e.message});
    }
}

</script>



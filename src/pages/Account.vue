<template>
    <div id="account" class="p-2">

        <div v-if="state.progress === 3" class="flex flex-col">

            <Card class="drop-shadow md:w-1/2 md:mx-auto mb-2">
                <template #title>
                    <i v-if="state.account.privileged" class="pi pi-shield mr-1"></i>
                    <i v-else class="pi pi-user mr-1"></i>
                    <span class="text-2xl font-bold">{{ route.params.name }}</span>
                    <span v-if="state.creator.length > 0" class="text-xs ml-1">by {{ state.creator }}</span>
                </template>
                <template #content>
                    <div class="flex justify-between items-center">
                        <span class="font-bold">Total Balance</span>
                        <div class="flex flex-col text-right">
                            <span>{{ formatAsset(totalBalance()) }}</span>
                            <span>{{ formatAsset(ChainInfo.toIDR(totalBalance())) }}</span>
                        </div>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-bold">Liquid</span>
                        <span>{{ state.account.core_liquid_balance || "0.0000 VEX" }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-bold">Staked</span>
                        <span>{{ getStaked() }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-bold">Refunding</span>
                        <span>{{ refundBalance() }}</span>
                    </div>
                    <div v-if="state.account.rex_info" class="flex justify-between">
                        <span class="font-bold">Total REX</span>
                        <span>{{ state.account.rex_info.rex_balance }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-bold">Created on</span>
                        <span>{{
                                DateTime.fromISO(state.account.created + 'Z').toLocaleString(DateTime.DATETIME_MED)
                            }}</span>
                    </div>
                </template>
            </Card>

            <Card v-if="isVoteProducer()" class="drop-shadow md:mx-auto md:w-1/2 mb-2">
                <template #title>
                    <span class="font-bold">Votes</span>
                </template>
                <template #content>
                    <div>
                        <div class="flex justify-between">
                            <span class="font-bold">Producers</span>
                            <p class="text-center">{{ state.account.voter_info.producers.join(", ") }}</p>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-bold">Weight</span>
                            <span>{{ voteWeight() }}</span>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="drop-shadow mb-2 md:mx-auto md:w-1/2">
                <template #title><span class="font-bold">Resources</span></template>
                <template #content>
                    <div class="flex flex-col gap-2">
                        <Fieldset legend="RAM">
                            <div class="text-center">
                                <ProgressBar :value="userRes.ram"></ProgressBar>
                                <span>{{ userRes.ramStr }}</span>
                            </div>
                        </Fieldset>
                        <Fieldset legend="CPU">
                            <div class="flex flex-col text-center">
                                <ProgressBar :value="userRes.cpu"></ProgressBar>
                                <span>{{ userRes.cpuStr }}</span>
                                <div class="flex justify-between">
                                    <span>Self-staked</span>
                                    <span>{{ myCpuBalance() }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Staked by others</span>
                                    <span>{{ cpuByOthers() }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Total</span>
                                    <span>{{ totalCpu() }}</span>
                                </div>
                            </div>
                        </Fieldset>
                        <Fieldset legend="NET">
                            <div class="flex flex-col text-center">
                                <ProgressBar :value="userRes.net"></ProgressBar>
                                <span>{{ userRes.netStr }}</span>
                                <div class="flex justify-between">
                                    <span>Self-staked</span>
                                    <span>{{ myNetBalance() }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Staked by others</span>
                                    <span>{{ netByOthers() }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Total</span>
                                    <span>{{ totalNet() }}</span>
                                </div>
                            </div>
                        </Fieldset>
                        <Fieldset v-if="state.account.refund_request" class="mt-2" legend="Refund Request">
                            <div class="flex justify-between">
                                <span>Request Time</span>
                                <span>{{
                                        DateTime.fromISO(state.account.refund_request.request_time + 'Z').toLocaleString(DateTime.DATETIME_MED)
                                    }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>NET</span>
                                <span>{{ state.account.refund_request.net_amount }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>CPU</span>
                                <span>{{ state.account.refund_request.cpu_amount }}</span>
                            </div>
                        </Fieldset>
                    </div>
                </template>
            </Card>

            <PermissionView class="mb-2 md:w-2/3 md:mx-auto" :permissions="state.account.permissions"></PermissionView>
            <TokenView class="mb-2 md:w-2/3 md:mx-auto" :account="route.params.name"></TokenView>
            <ABIView v-if="hasContract" class="mb-2 md:w-2/3 md:mx-auto" :contract="route.params.name"
                     :abi="abi"></ABIView>
            <ActionHistory class="md:w-2/3 md:mx-auto" :account="route.params.name"></ActionHistory>

        </div>
        <div v-else class="flex h-screen w-screen">
            <div class="m-auto">
                <ProgressSpinner v-if="state.progress === 1" stroke-width="5"></ProgressSpinner>
                <span v-else-if="state.progress === 2">account {{ route.params.name }} not found</span>
            </div>
        </div>

    </div>
</template>

<script setup>
import {useRoute} from "vue-router";
import {onActivated, reactive, ref} from "vue";
import {DateTime} from "luxon";
import {useToast} from "primevue";
import {Asset, Int64} from "@wharfkit/antelope";
import {vote2stake} from "../js/voting.js";
import {client} from "../js/nodes.js";
import ChainInfo from "../js/chain-info.js";
import {formatAsset, formatBytes, formatMicroSeconds} from "../js/utils.js";
import TokenView from "../components/TokenView.vue";
import ActionHistory from "../components/ActionHistory.vue";
import PermissionView from "../components/PermissionView.vue";
import ABIView from "../components/ABIView.vue";

const route = useRoute();
const toast = useToast();
const state = reactive({
    account: {
        account_name: "",
        total_resources: {}, voter_info: {}
    },
    creator: "",
    progress: 1
});
const userRes = reactive({});
const abi = ref();
const hasContract = ref(false);

onActivated(() => {
    if (ChainInfo.vexPrice.value === 0) ChainInfo.fetchVexPrice();
    if (state.account.account_name.toString() !== route.params.name) {
        getAccount();
        getABI();
        ChainInfo.getCreator(route.params.name).then(it => state.creator = it);
    }
});

function isVoteProducer() {
    return (state.account.voter_info && state.account.voter_info.producers.length > 0);
}

async function getAccount() {
    try {
        state.account = await client.v1.chain.get_account(route.params.name);
        calcUserResources();
        state.progress = 3;
    } catch (e) {
        state.progress = 2;
    }
}

async function getABI() {
    try {
        let res = await client.v1.chain.get_abi(route.params.name);
        if (res.account_name === route.params.name && res.abi) {
            abi.value = res.abi;
            hasContract.value = true;
        } else {
            hasContract.value = false;
        }
    } catch (e) {
        hasContract.value = false;
    }
}

function totalBalance() {
    const total = Asset.fromString("0.0000 VEX");
    total.value = liquidBalance().value + getStaked().value;
    return total;
}

function liquidBalance() {
    const balance = Asset.fromString("0.0000 VEX");
    if (state.account.core_liquid_balance) {
        balance.value = state.account.core_liquid_balance.value;
    }
    return balance;
}

function getStaked() {
    let staked = Asset.fromString("0.0000 VEX");
    staked.value = totalCpu().value + totalNet().value;
    return staked;
}

function refundBalance() {
    let refund = Asset.fromString("0.0000 VEX");
    if (state.account.refund_request) {
        let cpu = state.account.refund_request.cpu_amount;
        let net = state.account.refund_request.net_amount;
        refund.value = cpu.value + net.value;
    }
    return refund;
}

function voteWeight() {
    let votes = Asset.fromString("0.0000 VEX");
    let voterInfo = state.account.voter_info;
    if (voterInfo !== null) {
        votes.units = Int64.from(vote2stake(state.account.voter_info.last_vote_weight));
    }
    return votes;
}

function calcUserResources() {
    const cpu = state.account.cpu_limit;
    const net = state.account.net_limit;
    const ramQuota = state.account.ram_quota;
    const ramUsage = state.account.ram_usage;
    const minus1 = Int64.from(-1);

    userRes.cpu = minus1.equals(cpu.max) ? 0 : parseFloat(((cpu.used / cpu.max) * 100).toFixed(2));
    userRes.net = minus1.equals(net.max) ? 0 : parseFloat(((net.used / net.max) * 100).toFixed(2));
    userRes.ram = minus1.equals(ramQuota) ? 0 : parseFloat(((ramUsage / ramQuota) * 100).toFixed(2));
    userRes.cpuStr = minus1.equals(cpu.max) ? "∞ µs" : `${formatMicroSeconds(cpu.used)} / ${formatMicroSeconds(cpu.max)}`;
    userRes.netStr = minus1.equals(net.max) ? "∞ Kb" : `${formatBytes(net.used, 2)} / ${formatBytes(net.max, 2)}`;
    userRes.ramStr = minus1.equals(ramQuota) ? "∞ Kb" : `${formatBytes(ramUsage, 2)} / ${formatBytes(ramQuota, 2)}`;
}

function myCpuBalance() {
    if (state.account.self_delegated_bandwidth && state.account.self_delegated_bandwidth.cpu_weight) {
        return state.account.self_delegated_bandwidth.cpu_weight;
    }
    return Asset.fromString("0.0000 VEX");
}

function cpuByOthers() {
    let other = Asset.fromString("0.0000 VEX");
    if (state.account.total_resources) {
        let totalCpu = state.account.total_resources.cpu_weight;
        other.value = totalCpu.value - myCpuBalance().value
    }
    return other;
}

function myNetBalance() {
    if (state.account.self_delegated_bandwidth && state.account.self_delegated_bandwidth.net_weight) {
        return state.account.self_delegated_bandwidth.net_weight;
    }
    return Asset.fromString("0.0000 VEX");
}

function netByOthers() {
    let other = Asset.fromString("0.0000 VEX");
    if (state.account.total_resources) {
        let total = state.account.total_resources.net_weight;
        other.value = total.value - myNetBalance().value
    }
    return other;
}

function totalCpu() {
    if (state.account.total_resources) {
        return state.account.total_resources.cpu_weight;
    }
    return Asset.fromString("0.0000 VEX");
}

function totalNet() {
    if (state.account.total_resources) {
        return state.account.total_resources.net_weight;
    }
    return Asset.fromString("0.0000 VEX");
}
</script>



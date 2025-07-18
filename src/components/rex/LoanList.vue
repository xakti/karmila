<template>
    <div id="loan-list" class="border border-surface rounded-md shadow-md p-2">
        <span class="font-bold text-xl">Loan List</span>
        <Tabs value="0" class="mt-2">
            <TabList>
                <Tab value="0">CPU</Tab>
                <Tab value="1">NET</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DataTable :value="Rex.loanList.cpu" size="small" resizable-columns
                               scrollable scroll-height="500px">
                        <Column header="Receiver" field="receiver"></Column>
                        <Column header="Staked" field="total_staked"></Column>
                        <Column header="Payment" field="payment"></Column>
                        <Column header="Expiration"
                                :field="it => DateTime.fromISO(`${it.expiration}Z`).toRelative()"></Column>
                        <template #empty>kamu belum sewa CPU</template>
                    </DataTable>
                </TabPanel>
                <TabPanel value="1">
                    <DataTable :value="Rex.loanList.net" size="small" resizable-columns
                               scrollable scroll-height="500px">
                        <Column header="Receiver" field="receiver"></Column>
                        <Column header="Staked" field="total_staked"></Column>
                        <Column header="Payment" field="payment"></Column>
                        <Column header="Expiration"
                                :field="it => DateTime.fromISO(`${it.expiration}Z`).toRelative()"></Column>
                        <template #empty>kamu belum sewa NET</template>
                    </DataTable>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>
<script setup>

import {onActivated, onMounted} from "vue";
import {DateTime} from "luxon";
import Rex from "../../js/rex.js";
import Wallet from "../../js/wallet.js";

onMounted(hook);
onActivated(hook);

function hook() {
    if (Wallet.isConnected()) {
        Rex.fetchCPULoan(Wallet.account.value);
        Rex.fetchNETLoan(Wallet.account.value);
    }
}
</script>



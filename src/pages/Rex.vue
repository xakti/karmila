<template>
    <div id="rex" class="p-2">

        <div class="flex flex-col md:flex-row md:flex-wrap md:justify-center gap-2 items-center">
            <RexFund class="w-full md:w-1/2 lg:w-1/3"></RexFund>
            <RexMarket class="md:w-1/2 lg:w-1/3"></RexMarket>
            <RentResource class="w-full md:w-1/2 lg:w-1/3" @rent="onRent"></RentResource>
            <LoanList class="w-full md:w-1/2"></LoanList>
        </div>

    </div>
</template>
<script setup>

import {onActivated} from "vue";
import RexFund from "../components/rex/RexFund.vue";
import RentResource from "../components/rex/RentResource.vue";
import RexMarket from "../components/rex/RexMarket.vue";
import LoanList from "../components/rex/LoanList.vue";
import Rex from "../js/rex.js";
import Wallet from "../js/wallet.js";

onActivated(() => {
    Rex.fetchPool();
});

function onRent(type) {
    if (type === "CPU") {
        Rex.fetchCPULoan(Wallet.account.value);
    } else {
        Rex.fetchNETLoan(Wallet.account.value);
    }
}
</script>


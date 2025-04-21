<template>
    <div id="bidname" class="p-2">

        <div class="border rounded-md border-surface shadow p-1">
            <span class="font-bold text-xl mx-2">Name Bids</span>
            <Tabs value="0" @update:value="tabChange">
                <TabList>
                    <Tab value="0">Active</Tab>
                    <Tab value="1">Sold</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel value="0">
                        <div class="border border-surface rounded-md shadow-md p-1 md:w-2/3 mx-auto">
                            <DataTable ref="scroll" :value="bids.active" size="small"
                                       resizable-columns scrollable scroll-height="500px"
                                       selection-mode="single" data-key="newname"
                                       @rowSelect="bidName">
                                <Column header="Name" field="newname"></Column>
                                <Column header="Price" field="high_bid"></Column>
                                <Column header="Bidder">
                                    <template #body="{data}">
                                        <router-link :to="`/account/${data.high_bidder}`">{{
                                                data.high_bidder
                                            }}
                                        </router-link>
                                    </template>
                                </Column>
                                <Column header="Bid Time"
                                        :field="it => DateTime.fromISO(it.last_bid_time + 'Z').toRelative()">
                                </Column>
                            </DataTable>
                        </div>
                    </TabPanel>
                    <TabPanel value="1">
                        <div class="md:w-1/2 mx-auto mb-2">
                            <InputGroup>
                                <FloatLabel variant="in">
                                    <InputText id="name" type="text" v-model="query.name"></InputText>
                                    <label for="name">Find by name</label>
                                </FloatLabel>
                                <InputGroupAddon>
                                    <Button text icon="pi pi-search" :loading="loading" @click="runQuery"></Button>
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                        <div class="border border-surface rounded-md shadow-md p-1 md:w-2/3 mx-auto">
                            <DataTable ref="scroll" :value="bids.sold" size="small" resizable-columns scrollable
                                       scroll-height="500px">
                                <Column header="Name" field="newname"></Column>
                                <Column header="Price" field="high_bid"></Column>
                                <Column header="Bidder">
                                    <template #body="{data}">
                                        <router-link :to="`/account/${data.high_bidder}`">{{
                                                data.high_bidder
                                            }}
                                        </router-link>
                                    </template>
                                </Column>
                                <Column header="Bid Time"
                                        :field="it => DateTime.fromISO(it.last_bid_time + 'Z').toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)">
                                </Column>
                            </DataTable>
                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>

        <Dialog class="container size-fit" :header="`Bid for ${selected.newname}`" :visible="showDialog.bid"
                @update:visible="showDialog.bid = false">
            <div class="flex max-sm:flex-wrap gap-2">
                <FloatLabel variant="in">
                    <InputNumber id="price" v-model="bidPrice" :max-fraction-digits="4"></InputNumber>
                    <label for="price">Price</label>
                </FloatLabel>
                <Button label="Submit" @click="raiseBid"></Button>
            </div>
        </Dialog>

    </div>
</template>

<script setup>

import {Asset, Int64} from "@wharfkit/antelope";
import {useToast} from "primevue";
import {onActivated, reactive, ref} from "vue";
import {DateTime} from "luxon";
import {PlaceholderName} from "@wharfkit/signing-request";
import {client, contractKit} from "../js/nodes.js";
import Wallet from "../js/wallet.js";
import {copyToClipboard} from "../js/utils.js";


const toast = useToast();
const bids = reactive({active: [], sold: [], next: "", more: false});
const query = reactive({name: "", limit: 50});
const showDialog = reactive({bid: false, claim: false});
const selected = reactive({newname: ""});
const bidPrice = ref();
const loading = ref(false);
const scroll = ref();

onActivated(() => {
    fetchActiveBid(query.limit);
    findByName(undefined, query.limit);
});

function tabChange(event) {
    if (event === "0") {
        // fetchActiveBid(query.limit);
    } else {
        // fetchSoldName(undefined, 50);
    }
}

function bidName(event) {
    Object.assign(selected, event.data);
    showDialog.bid = true;
}


async function fetchSoldName(bound, limit) {
    let args = {
        json: true,
        code: "vexcore",
        scope: "vexcore",
        table: "namebids",
        index_position: 2,
        key_type: "i64",
        reverse: true,
        limit: limit
    };
    if (bound) args.upper_bound = bound;
    let res = await client.v1.chain.get_table_rows(args);
    if (res.rows.length > 0) {
        bids.more = res.more;
        bids.next = res.next_key;
        let rows = [];
        res.rows.forEach(it => {
            if (it.high_bid < 0) {
                let price = Asset.fromString("0.0000 VEX");
                price.units = Int64.from(it.high_bid * -1);
                it.high_bid = price.toString();
                rows.push(it);
            }
        });
        bids.sold = rows;
    }
}

async function runQuery() {
    loading.value = true;
    await findByName(query.name, query.limit);
    setTimeout(() => {
        if (scroll != null) {
            scroll.value.$el.firstElementChild.scrollTo({top: 0, behavior: "smooth"});
        }
    }, 100);
    loading.value = false;
}

async function findByName(name, limit) {
    let args = {
        json: true,
        code: "vexcore",
        scope: "vexcore",
        table: "namebids",
        limit: limit,
        lower_bound: name
    };
    let res = await client.v1.chain.get_table_rows(args);
    if (res.rows.length > 0) {
        bids.more = res.more;
        bids.next = res.next_key;
        let rows = [];
        res.rows.forEach(it => {
            if (it.high_bid < 0) {
                let price = Asset.fromString("0.0000 VEX");
                price.units = Int64.from(it.high_bid * -1);
                it.high_bid = price.toString();
                rows.push(it);
            }
        });
        bids.sold = rows;
    }
}

async function fetchActiveBid(limit) {
    let args = {
        json: true,
        code: "vexcore",
        scope: "vexcore",
        table: "namebids",
        index_position: 2,
        key_type: "i64",
        reverse: true,
        limit: limit
    };
    let res = await client.v1.chain.get_table_rows(args);
    if (res.rows.length > 0) {
        bids.more = res.more;
        bids.next = res.next_key;
        let rows = [];
        res.rows.forEach(it => {
            if (it.high_bid > 0) {
                let price = Asset.fromString("0.0000 VEX");
                price.units = Int64.from(it.high_bid);
                it.high_bid = price.toString();
                rows.push(it);
            }
        });
        bids.active = rows;
    }
}

async function raiseBid() {
    let bid = Asset.fromString("0.0000 VEX");
    bid.value = parseFloat(bidPrice.value);

    let sc = await contractKit.load("vexcore");
    let action = sc.action("bidname", {
        bidder: PlaceholderName,
        newname: selected.newname,
        bid: bid.toString()
    });
    let sr = await Wallet.createSigningRequest({action});
    let vsr = sr.encode(true, false, "vsr:");
    copyToClipboard(vsr);
    toast.add({severity: "success", life: 3000, summary: "Raise Bid", detail: "vsr copied"});
    showDialog.bid = false;
    bidPrice.value = "";
}
</script>



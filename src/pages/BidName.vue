<template>
    <div id="bidname" class="p-2">

        <div class="border rounded-md border-surface shadow p-1">
            <span class="font-bold text-xl mx-2">Name Bids</span>
            <Tabs value="0" @update:value="tabChange">
                <TabList>
                    <Tab value="0">Active</Tab>
                    <Tab value="1">Sold</Tab>
                    <Tab value="2">Bid</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel value="0">
                        <div class="border border-surface rounded-md shadow-md p-1 md:w-2/3 mx-auto">
                            <DataTable ref="scroll" :value="bids.active" size="small"
                                       resizable-columns scrollable scroll-height="500px"
                                       selection-mode="single" data-key="newname"
                                       @rowSelect="tryRaiseBid">
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
                            <form>
                                <InputGroup>
                                    <FloatLabel variant="in">
                                        <InputText id="name" type="text" v-model="query.name"></InputText>
                                        <label for="name">Find by name</label>
                                    </FloatLabel>
                                    <InputGroupAddon>
                                        <Button type="submit" text icon="pi pi-search" :loading="loading"
                                                @click="runQuery"></Button>
                                    </InputGroupAddon>
                                </InputGroup>
                            </form>
                        </div>
                        <div class="border border-surface rounded-md shadow-md p-1 md:w-2/3 mx-auto">
                            <DataTable ref="scroll" :value="bids.sold" size="small" resizable-columns
                                       scrollable scroll-height="500px"
                                       selection-mode="single" @rowSelect="onSelectSold">
                                <Column header="Name" field="newname"></Column>
                                <Column header="Price" field="high_bid" :sortable="true"></Column>
                                <Column header="Bidder" :sortable="true" sort-field="high_bidder">
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
                    <TabPanel value="2">
                        <div class="flex flex-col gap-2 md:w-1/2 mx-auto">
                            <FloatLabel variant="in">
                                <InputText id="new-name" fluid v-model="newName"></InputText>
                                <label for="new-name">Account Name</label>
                            </FloatLabel>
                            <FloatLabel variant="in">
                                <InputText id="price" fluid v-model="bidPrice" type="number"
                                           inputmode="decimal"></InputText>
                                <label for="price">Price</label>
                            </FloatLabel>
                            <Message size="small">
                                <i class="pi pi-info-circle"/> Your bid must be the highest spot for 24 hours to win.
                            </Message>
                            <div class="inline-flex justify-end">
                                <Button label="Submit" @click="bidName"></Button>
                            </div>
                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>

        <Dialog :header="`Bid for ${selected.newname}`" :visible="showBidDialog"
                @update:visible="showBidDialog = false">
            <div class="flex flex-col md:flex-row gap-2">
                <FloatLabel variant="in">
                    <InputText id="raise-price" v-model="bidPrice" type="number" inputmode="decimal"></InputText>
                    <label for="raise-price">Price</label>
                </FloatLabel>
                <Button label="Submit" @click="raiseBid"></Button>
            </div>
        </Dialog>

    </div>
</template>

<script setup>

import {ABI, Action, Asset, Authority, Int64, KeyType, KeyWeight, PrivateKey, UInt16, UInt32} from "@wharfkit/antelope";
import {useToast} from "primevue";
import {onActivated, reactive, ref} from "vue";
import {DateTime} from "luxon";
import {PlaceholderAuth, PlaceholderName} from "@wharfkit/signing-request";
import {abiCache, client} from "@/js/nodes.js";
import Wallet from "@/js/wallet.js";
import {download, getErrorMessage} from "@/js/utils.js";


const toast = useToast();
const bids = reactive({active: [], sold: [], next: "", more: false});
const query = reactive({name: "", limit: 50});
const showBidDialog = ref(false);
const selected = reactive({newname: ""});
const bidPrice = ref();
const newName = ref("");
const loading = ref(false);
const scroll = ref();
/**
 * @type {ABI}
 */
let abi;

onActivated(() => {
    fetchActiveBid(query.limit);
    findByName(undefined, query.limit);
    abiCache.getAbi("vexcore").then(val => abi = val);
});

function tabChange(event) {
    if (event === "0") {
        // fetchActiveBid(query.limit);
    } else {
        // fetchSoldName(undefined, 50);
    }
}

/**
 * nama active diklik, tampilkan dialog untuk naikkan harga
 * @param event
 */
function tryRaiseBid(event) {
    Object.assign(selected, event.data);
    showBidDialog.value = true;
}

/**
 * klik cari
 * @return {Promise<void>}
 */
async function runQuery() {
    loading.value = true;
    await findByName(query.name, query.limit);
    setTimeout(() => {
        if (scroll != null) {
            scroll.value.$el.firstElementChild.scrollTo({top: 0, behavior: "smooth"});
        }
    }, 200);
    loading.value = false;
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

async function nameAvailable(name) {
    let args = {
        json: true,
        code: "vexcore",
        scope: "vexcore",
        table: "namebids",
        limit: 1,
        lower_bound: name
    };
    let used = 0;
    try {
        let result = await client.v1.chain.get_table_rows(args);
        if (result.rows.length === 1) {
            let found = result.rows[0].newname;
            if (found === name) used++;
        }
        if (used === 0) {
            let acc = await client.v1.chain.get_account(name);
            if (acc && acc.account_name.toString() === name) used++;
        }
        return (used === 0);
    } catch (e) {
        return true;
    }
}

/**
 * klik untuk buat akun
 * @param event
 * @return {Promise<void>}
 */
async function onSelectSold(event) {
    let creator = event.data.high_bidder;
    let name = event.data.newname;
    if (!Wallet.isConnected()) {
        toast.add({severity: "info", life: 3000, summary: "Wallet not connected"});
        return;
    }

    try {
        let {vsr, data} = await newAccountRequest(creator, name);
        await Wallet.session.signingRequest(vsr);
        let filename = `New_Account_${name}.txt`;
        download(filename, data);
        toast.add({severity: "success", life: 3000, summary: `Account ${name} created`});
    } catch (e) {
        toast.add({severity: "error", life: 4000, summary: "Create Account Error", detail: getErrorMessage(e)});
    }
}

async function raiseBid() {
    const price = parseFloat(bidPrice.value);
    if (!Wallet.isConnected()) {
        toast.add({severity: "error", life: 3000, summary: "Wallet not connected"});
        return;
    }
    if (price === 0 || isNaN(price)) {
        toast.add({severity: "error", life: 3000, summary: `Set your price`});
        return;
    }

    let currentPrice = Asset.from(selected.high_bid);
    let bid = Asset.fromString("0.0000 VEX");
    bid.units = bid.symbol.convertFloat(price);

    if (bid.value <= currentPrice.value) {
        toast.add({severity: "error", life: 3000, summary: "Raise your price"});
        return;
    }

    try {
        const action = Action.from({
            account: "vexcore", name: "bidname",
            authorization: [PlaceholderAuth],
            data: {
                bidder: PlaceholderName,
                newname: selected.newname,
                bid: bid.toString()
            }
        }, abi);
        await Wallet.session.transact({action});

        showBidDialog.value = false;
        bidPrice.value = "";
        toast.add({severity: "success", life: 3000, summary: "Successfully raise bid"});
        setTimeout(() => {
            fetchActiveBid(query.limit);
        }, 1500);
    } catch (e) {
        toast.add({severity: "error", life: 4000, summary: "Raise Bid Error", detail: getErrorMessage(e)});
    }
}

async function bidName() {
    const price = parseFloat(bidPrice.value);
    const name = newName.value.toLowerCase();

    if (!Wallet.isConnected()) {
        toast.add({severity: "error", life: 3000, summary: "Wallet not connected"});
        return;
    }
    if (name.length === 0) {
        toast.add({severity: "error", life: 3000, summary: "Enter account name"});
        return;
    }
    if (price === 0 || isNaN(price)) {
        toast.add({severity: "error", life: 3000, summary: `Set your price`});
        return;
    }
    const oke = await nameAvailable(name);
    if (!oke) {
        toast.add({severity: "error", life: 3000, summary: `Account ${name} already exist`});
        return;
    }

    const bid = Asset.fromString("0.0000 VEX");
    bid.units = bid.symbol.convertFloat(price);

    try {
        const action = Action.from({
            account: "vexcore", name: "bidname",
            authorization: [PlaceholderAuth],
            data: {
                bidder: PlaceholderName,
                newname: name,
                bid: bid.toString()
            }
        }, abi);
        await Wallet.session.transact({action});

        newName.value = "";
        bidPrice.value = "";
        toast.add({severity: "success", life: 3000, summary: `Successfully bid ${name}`});

        setTimeout(() => {
            fetchActiveBid(query.limit);
        }, 1500);
    } catch (e) {
        toast.add({severity: "error", life: 4000, summary: "Bid Name Error", detail: getErrorMessage(e)});
    }
}

async function newAccountRequest(creator, name) {
    let key = PrivateKey.generate(KeyType.K1);
    let auth = Authority.from({
        threshold: UInt32.from(1),
        keys: [KeyWeight.from({key: key.toPublic(), weight: UInt16.from(1)})],
        accounts: [], waits: []
    });
    const newAccount = Action.from({
        account: "vexcore", name: "newaccount",
        authorization: [PlaceholderAuth],
        data: {creator: creator, name: name, owner: auth, active: auth}
    }, abi);
    const ram = Action.from({
        account: "vexcore", name: "buyrambytes",
        authorization: [PlaceholderAuth],
        data: {payer: creator, receiver: name, bytes: 4096}
    }, abi);
    const delegate = Action.from({
        account: "vexcore", name: "delegatebw",
        authorization: [PlaceholderAuth],
        data: {
            from: creator, receiver: name, stake_net_quantity: "0.0500 VEX",
            stake_cpu_quantity: "0.3000 VEX", transfer: true
        }
    }, abi);

    let request = await Wallet.createSigningRequest({actions: [newAccount, ram, delegate]});
    let vsr = request.encode(true, false, "vsr:");

    let exportData = `Account: ${name}\n`;
    exportData += `Public Key: ${key.toPublic().toString()}\n`;
    exportData += `Private Key: ${key.toString()}\n`;
    exportData += `Wif: ${key.toWif()}`;

    return {vsr, data: exportData};
}
</script>



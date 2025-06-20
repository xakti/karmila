import {fetchProducers, producers} from "@/js/producer.js";
import {DateTime} from "luxon";
import {Asset, Int64} from "@wharfkit/antelope";
import {vote2stake} from "@/js/voting.js";
import ChainInfo from "@/js/chain-info.js";
import {reactive, ref} from "vue";

export class ProducerData {

    constructor(data) {
        this.owner = data.owner;
        this.totalVotes = parseInt(data.total_votes);
        this.key = data.producer_key;
        this.url = data.url;
        // this.unpaidBlocks = data.unpaid_blocks;
        this.lastClaim = DateTime.fromISO(`${data.last_claim_time}Z`);
        this.position = 0;
        this.logo = ref("/token-default.png");
        this.compliance = reactive({value: {}, percent: 0, count: 0});
        this.parseCompliance(); // set default

        this.percent = (this.totalVotes / producers.totalVoteWeight) * 100;
        const stake = Asset.fromString("0.0000 VEX");
        stake.units = Int64.from(vote2stake(this.totalVotes));
        this.stake = stake;
        this.blockPay = this.calcBlockPay(data.unpaid_blocks);
        this.votePay = this.calcVotePay(this.totalVotes);
        this.rewards = Asset.fromUnits(this.blockPay.units.adding(this.votePay.units), this.blockPay.symbol);
    }

    async refresh() {
        let res = await fetchProducers(this.owner, 1);
        if (res.rows.length > 0) {
            this.percent = res.rows[0].percent;
            this.stake = res.rows[0].stake;
            this.rewards = res.rows[0].rewards;
            this.lastClaim = res.rows[0].lastClaim;
        }
    }

    calcBlockPay(unpaidBlock) {
        const global = ChainInfo.vexcoreGlobal;
        const pay = Asset.fromString("0.0000 VEX");

        if (global.total_unpaid_blocks > 0) {
            const amount = (global.perblock_bucket * unpaidBlock) / global.total_unpaid_blocks;
            pay.units = Int64.from(amount);
        }
        return pay;
    }

    calcVotePay(totalVotes) {
        const global = ChainInfo.vexcoreGlobal;
        const amount = (global.pervote_bucket * totalVotes) / global.total_producer_vote_weight;
        const pay = Asset.fromString("0.0000 VEX");
        pay.units = Int64.from(amount);
        return pay;
    }


    async fetchBPJson() {
        if (this.url.length === 0) return;

        try {
            let res = await fetch(`${this.url}/bp.json`);
            if (res.ok) {
                const json = await res.json();
                this.json = json;
                let logo = json.org.branding.logo_256 ?? "";
                if (logo) this.logo.value = logo;
                this.parseCompliance();
            }
        } catch (e) {
        }
    }

    parseCompliance() {
        let result = {
            "BP.Json": false, Name: false, Email: false, Website: false, Logo: false, Country: false
        };

        if (this.json) {
            result["BP.Json"] = true;
            result.Name = this.json.producer_account_name.length > 0;
            result.Email = this.json.org.email.length > 0;
            result.Website = this.json.org.website.length > 0;
            result.Logo = this.json.org.branding.logo_256.length > 0;
            result.Country = this.json.org.location.country.length > 0;
        }
        let count = 0;
        Object.values(result).forEach(it => {
            if (it) count++;
        });
        let percent = (count / 6) * 100;
        this.compliance.value = result;
        this.compliance.count = count;
        this.compliance.percent = percent;
    }

    get location() {
        if (this.json) {
            return this.json.org.location;
        }
        return {name: "Indonesia", country: "ID"};
    }

    get email() {
        if (this.json) {
            return this.json.org.email ?? "";
        }
        return "";
    }

    get social() {
        if (this.json) {
            return this.json.org.social;
        }
        return {
            github: "",
            telegram: "",
            twitter: "",
            youtube: "",
        };
    }

}

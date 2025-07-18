import {reactive, ref} from "vue";
import {Asset, Int64} from "@wharfkit/antelope";
import {client} from "./nodes.js";
import ChainInfo from "./chain-info.js";

const Rex = {
    pool: reactive({
        total_lent: "0.0000 VEX",
        total_unlent: "0.0000 VEX",
        total_rent: "0.0000 VEX",
        total_lendable: "0.0000 VEX",
        total_rex: "0.0000 REX",
        loan_num: 0
    }),
    rexBalance: reactive({
        owner: "", vote_stake: "0.0000 VEX", rex_balance: "0.0000 REX",
        matured_rex: "0.0000 REX", rex_maturities: [], locked: "0.0000 REX"
    }),
    rexFund: ref(Asset.fromString("0.0000 VEX")),
    loanList: reactive({cpu: [], net: []}),


    async fetchPool() {
        let args = {
            json: true, code: ChainInfo.SYSTEM_CONTRACT, scope: ChainInfo.SYSTEM_CONTRACT, table: "rexpool",
            key_type: "i64", index_position: 1, limit: 1
        };
        let res = await client.v1.chain.get_table_rows(args);
        if (res.rows.length) {
            Object.assign(this.pool, res.rows[0]);
        }
    },
    async fetchRexBalance(name) {
        let args = {
            json: true, code: ChainInfo.SYSTEM_CONTRACT, scope: ChainInfo.SYSTEM_CONTRACT, table: "rexbal",
            key_type: "i64", index_position: 1, limit: 1,
            lower_bound: name, upper_bound: name
        };
        let res = await client.v1.chain.get_table_rows(args);
        if (res.rows.length) {
            const bal = res.rows[0];
            if (bal.owner === name) {
                Object.assign(this.rexBalance, bal);
                let matured = Asset.fromString("0.0000 REX");
                matured.units = bal.matured_rex;
                this.rexBalance.matured_rex = matured;
                this.rexBalance.locked = this.getLockedRex(bal.rex_maturities);
            }
        }
    },
    async fetchRexFund(name) {
        let args = {
            json: true, code: ChainInfo.SYSTEM_CONTRACT, scope: ChainInfo.SYSTEM_CONTRACT, table: "rexfund",
            key_type: "i64", index_position: 1, limit: 1,
            lower_bound: name, upper_bound: name
        };
        let res = await client.v1.chain.get_table_rows(args);
        let fund = Asset.fromString("0.0000 VEX");
        if (res.rows.length) {
            fund = Asset.fromString(res.rows[0].balance);
        }
        this.rexFund.value = fund;
    },
    async fetchCPULoan(name) {
        let args = {
            json: true, code: ChainInfo.SYSTEM_CONTRACT, scope: ChainInfo.SYSTEM_CONTRACT, table: "cpuloan",
            key_type: "i64", index_position: 3, limit: 50,
            lower_bound: name, upper_bound: name
        };
        let res = await client.v1.chain.get_table_rows(args);
        if (res.rows.length) {
            this.loanList.cpu = res.rows;
        }
    },
    async fetchNETLoan(name) {
        let args = {
            json: true, code: ChainInfo.SYSTEM_CONTRACT, scope: ChainInfo.SYSTEM_CONTRACT, table: "netloan",
            key_type: "i64", index_position: 3, limit: 50,
            lower_bound: name, upper_bound: name
        };
        let res = await client.v1.chain.get_table_rows(args);
        if (res.rows.length) {
            this.loanList.net = res.rows;
        }
    },
    calculateLentPercent() {
        const totalLent = parseFloat(this.pool.total_lent);
        const totalLendable = parseFloat(this.pool.total_lendable);
        const percent = (totalLent / totalLendable) * 100;
        return percent.toFixed(2);
    },
    calcPrice() {
        const totalLendable = Asset.fromString(this.pool.total_lendable);
        const totalRex = Asset.fromString(this.pool.total_rex);

        const price = totalLendable.value / totalRex.value;
        return price.toFixed(10);
    },
    /**
     *
     * @param {Asset} loan
     */
    calculateLoanCost(loan) {
        const totalRent = Asset.fromString(this.pool.total_rent);
        const totalUnlent = Asset.fromString(this.pool.total_unlent);
        const cost = Asset.fromString("0.0000 VEX");

        const numerator = totalRent.units.multiplying(loan.units);
        const denominator = totalUnlent.units.subtracting(loan.units);
        cost.units = numerator.dividing(denominator);
        return cost;
    },

    /**
     *
     * @param {Asset} payment
     */
    calculateLoanAmount(payment) {
        const totalRent = Asset.fromString(this.pool.total_rent);
        const totalUnlent = Asset.fromString(this.pool.total_unlent);
        const amount = Asset.fromString("0.0000 VEX");

        const numerator = payment.units.multiplying(totalUnlent.units);
        const denominator = totalRent.units.adding(payment.units);
        amount.units = numerator.dividing(denominator);
        return amount;
    },
    getLockedRex(rexMaturities) {
        const now = new Date();
        const locked = rexMaturities.filter(it => new Date(it.first + '.000Z') > now);
        let total = 0;
        locked.forEach(it => total += it.second);
        const rex = Asset.fromString("0.0000 REX");
        rex.units = Int64.from(total);
        return rex;
    }


};
export default Rex;

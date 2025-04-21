/**
 * voteWeightToday computes the stake2vote weight for EOS, in order to compute the decaying value.
 */
export function voteWeightToday() {
    const seconds_per_day = 86400;
    const block_timestamp_epoch = new Date(Date.UTC(2000, 0, 1, 0, 0, 0, 0)).getTime();
    return Math.floor((Date.now() - block_timestamp_epoch) / 1000 / (seconds_per_day * 7)) / 52;
}
/**
 * Convert EOS stake into decaying value
 *
 * @param {number} staked
 */
export function stake2vote(staked) {
    return staked * Math.pow(2, voteWeightToday());
}

/**
 * Convert vote decay value into EOS stake
 *
 * @param {number} vote vote
 */
export function vote2stake(vote) {
    return vote / Math.pow(2, voteWeightToday());
}
/**
 * Calculate producer vpay
 *
 * @return {bigint} producer pay as int64t
 */
export function calculate_producer_per_vote_pay(total_votes, pervote_bucket, total_producer_vote_weight) {
    return (pervote_bucket * total_votes) / total_producer_vote_weight;
}
export function formatBytes(bytes, decimal) {
    let kiloBytes = 1024; // One Kilobyte is 1024 bytes
    let megaBytes = 1048576; // One MB is 1024 KB
    let gigaBytes = 1073741824; // One GB is 1024 MB

    // return bytes if less than a KB
    if (bytes < kiloBytes) return bytes + " Bytes";
    // return KB if less than a MB
    else if (bytes < megaBytes) return (bytes / kiloBytes).toFixed(decimal) + " KB";
    // return MB if less than a GB
    else if (bytes < gigaBytes) return (bytes / megaBytes).toFixed(decimal) + " MB";
    // return GB if less than a TB
    else return (bytes / gigaBytes).toFixed(decimal) + " GB";
}

export function formatMicroSeconds(micros) {
    let int = 0;
    let remainder = 0;
    const calcSec = 1000 ** 2;
    const calcMin = calcSec * 60;
    const calcHour = calcMin * 60;
    if (micros > calcHour) {
        int = Math.floor(micros / calcHour);
        remainder = micros % calcHour;
        return int + 'h ' + Math.round(remainder / calcMin) + 'min';
    }
    if (micros > calcMin) {
        int = Math.floor(micros / calcMin);
        remainder = micros % calcMin;
        return int + 'min ' + Math.round(remainder / calcSec) + 's';
    }
    if (micros > calcSec) {
        return (micros / calcSec).toFixed(2) + 's';
    }
    if (micros > 1000) {
        return (micros / (1000)).toFixed(2) + 'ms';
    }
    return micros + 'µs';
}

export function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    } else {
        const el = document.createElement('textarea');
        try {
            el.setAttribute('contentEditable', '');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            const range = document.createRange();
            range.selectNodeContents(el);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            el.setSelectionRange(0, el.value.length);
            document.execCommand('copy');
        } finally {
            document.body.removeChild(el)
        }
    }
}

export function startInterval(handler, timeout) {
    let id = setInterval(handler, timeout);
    return () => {
        clearInterval(id);
    };
}

export function getFlagEmoji(countryCode) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

export function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

/**
 *
 * @param {Asset} asset
 */
export function formatAsset(asset) {
    let val = String(asset.value).replace(
        /^\d+/,
        number => [...number].map(
            (digit, index, digits) => (
                !index || (digits.length - index) % 3 ? '' : ','
            ) + digit
        ).join('')
    );
    return `${val} ${asset.symbol.code.toString()}`;
}

export function groupNumber(value) {
    return String(value).replace(
        /^\d+/,
        number => [...number].map(
            (digit, index, digits) => (
                !index || (digits.length - index) % 3 ? '' : ','
            ) + digit
        ).join('')
    );
}

export function download(filename, data) {
    let url = window.URL.createObjectURL(new Blob([data], {type: 'text/plain'}));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

export function getErrorMessage(error) {
    let msg = error.message;
    if (error.response) {
        let json = error.response.json;
        msg = json.error.details[0].message;
    } else if (error.error) {
        msg = error.error.details[0].message;
    }
    return msg;
}

export function toBoolean(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
        switch (value.trim().toLowerCase()) {
            case "true":
            case "1":
            case "yes":
            case "on":
                return true;
            case "false":
            case "0":
            case "no":
            case "off":
                return false;
            default:
                return false; // fallback
        }
    }
    return false; // kalau tipe lain (null, undefined, object, dll)
}

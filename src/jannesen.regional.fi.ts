﻿/// <reference path="lib-ext.d.ts"/>
/// <export-interface path="jannesen.regional.ts"/>
import * as $J from "jc3/jannesen";
import * as $JL from "jc3/jannesen.language";

export const decimalPoint = ",";
export const firstDay = 1;
export const regexDate = /^([0-9]+)[\-\/. ]([0-9]+|[A-Za-z]+)[\-\/. ]([0-9]+)$/;
export const regexTime           = /^([0-2]?[0-9]{3})$|^([0-2]?[0-9]):([0-5][0-9])(?::([0-5][0-9])(?:\.([0-9]{1,3}))?)?$/;
export const regexTimeMS         = /^([0-9]+):([0-5][0-9])(?:\.([0-9]{1,3}))?$/;

export function timePlaceHolder(format: string | $J.TimeFormat): string | undefined
{
    switch (format) {
        case $J.TimeFormat.HM: return "uu:mm";
        case $J.TimeFormat.HMS: return "uu:mm:ss";
        case $J.TimeFormat.HMSF: return "uu:mm:ss.fff";
        case $J.TimeFormat.MS: return "mm:ss";
        default: return undefined;
    }
}

export function stringToInt(s: string): number {
    var r = parseInt(s.trim().replace(/\./g, ""), 10);

    if (!isNaN(r))
        return r;

    throw new $J.FormatError($JL.incorrect_integer_value(s));
}

export function intToString(v: number): string {
    return v.toString();
}

export function stringToBoolean(s: string): boolean {
    switch (s.trim().toLowerCase()) {
        case "0": return false;
        case "1": return true;
        case "j": return true;
        case "n": return false;
        case "ja": return true;
        case "nee": return false;
    }

    throw new $J.FormatError($JL.incorrect_boolean_value(s));
}

export function booleanToString(v: boolean, f?: string): string {
    return (v) ? $JL.yes : $JL.no;
}

export function stringToNumber(s: string): number {
    var r = parseFloat(s.trim().replace(/\./g, "").replace(/,/, "."));

    if (!isNaN(r))
        return r;

    throw new $J.FormatError($JL.incorrect_numeric_value(s));
}

export function numberToString(v: number, f?: string): string {
    if (f && /^F[0-9]/.test(f))
        return v.toFixed(parseInt(f.substr(1), 10)).replace(".", ",");

    return v.toPrecision().replace(".", ",");
}

export function stringToDate(s: string): number {
    try {
        var parts = /^([0-9]+)[\-\/. ]([0-9]+|[A-Za-z]+)[\-\/. ]([0-9]+)$/.exec(s.trim());

        if (parts !== null && typeof parts[1] === "string" && typeof parts[2] === "string" && typeof parts[3] === "string") {
            var d: number;
            var m: number;
            var y: number;

            if (parts[1]!.length === 4) {
                y = stringToYear(parts[1]!);
                m = stringToMonth(parts[2]!);
                d = stringToDay(parts[3]!);
            }
            else {
                d = stringToDay(parts[1]!);
                m = stringToMonth(parts[2]!);
                y = stringToYear(parts[3]!);
            }

            if (y >= 1900 && y <= 2099 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                let v = Date.UTC(y, m - 1, d);
                if ((new Date(v)).getUTCDate() === d)
                    return v / (24 * 60 * 60 * 1000);
            }
        }
    }
    catch (e) {
        // Ignore error
    }

    throw new $J.FormatError($JL.invalid_date);
}

export function dateToString(v: number | Date, f?: string): string {
    var d: Date = !(v instanceof Date) ? new Date(v * (24 * 60 * 60 * 1000)) : <Date>v;

    if (typeof f === "string" && f !== "") {
        var rtn: string = "";
        var p: number = 0;

        while (p < f.length) {
            var c = f.substr(p, 1);
            var n = 0;

            while (p < f.length && f[p] === c) { ++n; ++p; }

            switch (c) {
                case "d":
                    switch (n) {
                        case 2: rtn += $JL.dayNamesShort[d.getUTCDay()]; break;
                        case 3: rtn += $JL.dayNames[d.getUTCDay()]; break;
                        default: rtn += $JL.dayNamesMin[d.getUTCDay()]; break;
                    }
                    break;

                case "D": rtn += $J.intToA(d.getUTCDate(), n); break;

                case "M":
                    switch (n) {
                        case 3: rtn += $JL.monthNamesShort[d.getUTCMonth()]; break;
                        case 4: rtn += $JL.monthNames[d.getUTCMonth()]; break;
                        default: rtn += $J.intToA(d.getUTCMonth() + 1, n); break;
                    }
                    break;

                case "Y": rtn += $J.intToA(d.getUTCFullYear(), n); break;
                case "\\":
                    rtn += f.substr(p + 1, 1);
                    n = 2;
                    break;

                default:
                    rtn += c.repeat(n);
                    break;
            }
        }
        return rtn;
    }
    else {
        return $J.intToA(d.getUTCDate(), 1) + " " +
            $JL.monthNamesShort[d.getUTCMonth()] + " " +
            $J.intToA(d.getUTCFullYear(), 4);
    }
}

export function stringToTime(text:string, timeformat?:$J.TimeFormat):number {
    let m:RegExpExecArray|null;

    switch (timeformat) {
    case $J.TimeFormat.MS:
        if (m = regexTimeMS.exec(text)) {
            if (typeof m[1] === "string" && typeof m[2] === "string") {
                return $J.parseIntExact(m[1]!) * 60000 +
                       $J.parseIntExact(m[2])   * 1000 +
                       (typeof m[3] === "string" ? $J.parseIntExact(m[3]) : 0);
            }
        }

    default:
        if (m = regexTime.exec(text)) {
            if (typeof m[1] === "string") {
                return $J.parseIntExact(m[1].substr(0, m[1].length-2)) * 3600000 +
                        $J.parseIntExact(m[1].substr(m[1].length-2, 2))   * 60000;
            }
            else if (typeof m[2] === "string" && typeof m[3] === "string") {
                return $J.parseIntExact(m[2]!) * 3600000 +
                       $J.parseIntExact(m[3]!)   * 60000 +
                       (typeof m[4] === "string" ? $J.parseIntExact(m[4]) * 1000 : 0) +
                       (typeof m[5] === "string" ? $J.parseIntExact(m[5])        : 0);
            }
        }
    }

    throw new $J.FormatError("Invalid time");
}

export function timeToString(value:number, timeformat?:$J.TimeFormat):string {
    let sign = (value < 0);
    if (sign) value = -value;

    let n:{ result:number, remainder:number };
    let fraction:number;
    let seconds:number;

    switch(timeformat) {
    case $J.TimeFormat.HM:
        n = $J.divModulo(Math.round(value / 60000), 60);
        return (sign ? "-":"") + $J.intToA(n.result, 2) + ":" + $J.intToA(n.remainder, 2);

    case $J.TimeFormat.HMS:
        n = $J.divModulo(Math.round(value / 1000), 60);  seconds  = n.remainder;
        n = $J.divModulo(n.result,                 60);
        return (sign ? "-":"") + $J.intToA(n.result, 1) + ":" + $J.intToA(n.remainder, 2) + ":" + $J.intToA(seconds, 2);

    default:
    case $J.TimeFormat.HMSF:
        n = $J.divModulo(Math.round(value), 1000);  fraction = Math.round(n.remainder * 1000);
        n = $J.divModulo(n.result,            60);  seconds  = n.remainder;
        n = $J.divModulo(n.result,            60);

        return (sign ? "-":"") + $J.intToA(n.result, 1) + ":" + $J.intToA(n.remainder, 2) + ":" + $J.intToA(seconds, 2) + "." + $J.intToA(fraction, 3);

    case $J.TimeFormat.MS:
        n = $J.divModulo(Math.round(value / 1000), 60);  seconds  = n.remainder;
        return (sign ? "-":"") + $J.intToA(n.result, 1) + ":" + $J.intToA(n.remainder, 2);
    }
}

export function stringToDay(s: string): number {
    if (/^[0-9]+$/.test(s))
        return parseInt(s, 10);

    return NaN;
}

export function stringToMonth(s: string): number {
    if (/^[0-9]+$/.test(s))
        return parseInt(s, 10);

    for (var m = 0; m < 12; ++m) {
        if ($JL.monthNames[m] === s || $JL.monthNamesShort[m] === s)
            return m + 1;
    }

    return NaN;
}

export function stringToYear(s: string): number {
    if (/^[0-9]+$/.test(s)) {
        var m = parseInt(s, 10);

        if (m >= 0 && m < 100)
            return (m >= 30 ? 1900 : 2000) + m;

        return m;
    }

    return NaN;
}

export function yearToShortYear(y: number): number {
    if (y >= 2000 && y < 2030) return y - 2000;
    if (y >= 1930 && y < 2000) return y - 1900;

    return y;
}

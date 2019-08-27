/// <reference path="lib-ext.d.ts"/>
/// <export-interface path="jannesen.regional.ts"/>
import * as $J  from "jc3/jannesen";
import * as $JL from "jc3/jannesen.language";

export const decimalPoint        = ",";
export const firstDay            = 1;
export const regexDate           = /^([0-3]?[0-9][0-2][0-9])$|^([0-9]{1,4})[\-\/. ]([01]?[0-9]|[A-Za-z]+)(?:[\-\/. ]([0-9]{1,4}))?$/;
export const regexTime           = /^([0-2]?[0-9]{3})$|^([0-2]?[0-9]):([0-5][0-9])(?::([0-5][0-9])(?:\.([0-9]{1,3}))?)?$/;
export const regexTimeMS         = /^([0-9]+):([0-5][0-9])(?:\.([0-9]{1,3}))?$/;

export function timePlaceHolder(format: string|$J.TimeFormat): string|undefined
{
    switch(format) {
    case $J.TimeFormat.HM:      return "hh:mm";
    case $J.TimeFormat.HMS:     return "hh:mm:ss";
    case $J.TimeFormat.HMSF:    return "hh:mm:ss.fff";
    case $J.TimeFormat.MS:      return "mm:ss";
    default:                    return undefined;
    }
}

export function stringToInt(s: string): number
{
    var r = parseInt(s.trim(), 10);

    if (!isNaN(r))
        return r;

    throw new $J.FormatError($JL.incorrect_integer_value(s));
}

export function intToString(v: number): string
{
    return v.toString();
}

export function stringToBoolean(s: string): boolean
{
    switch(s.trim().toLowerCase()) {
    case "0":       return false;
    case "1":       return true;
    case "j":       return true;
    case "n":       return false;
    case "ja":      return true;
    case "nee":     return false;
    }

    throw new $J.FormatError($JL.incorrect_boolean_value(s));
}

export function booleanToString(v: boolean, f?: string): string
{
    return (v) ? $JL.yes : $JL.no;
}

export function stringToNumber(s: string): number
{
    var r = parseFloat(s.trim());

    if (!isNaN(r))
        return r;

    throw new $J.FormatError($JL.incorrect_numeric_value(s));
}

export function numberToString(v: number, f?: string): string
{
    if (f && /^F[0-9]/.test(f))
        return v.toFixed(parseInt(f.substr(1), 10));

    return v.toPrecision();
}

export function stringToDate(s: string): number
{
    try {
        const parts = regexDate.exec(s.trim());

        if (parts !== null) {
            if (typeof parts[1] === "string") {
                const r = dayMonthToData(parts[1].substr(0, parts[1].length-2), parts[1].substr(parts[1].length-2, 2));
                if (r !== undefined) {
                    return r;
                }
            }
            else if (typeof parts[2] === "string" && typeof parts[3] === "string") {
                if (typeof parts[4] === "string") {
                    let d: number;
                    let m: number;
                    let y: number;

                    if (parts[2]!.length === 4) {
                        y = stringToYear(parts[2]!);
                        m = stringToMonth(parts[3]!);
                        d = stringToDay(parts[4]!);
                    }
                    else {
                        d = stringToDay(parts[2]!);
                        m = stringToMonth(parts[4]!);
                        y = stringToYear(parts[5]!);
                    }
                    if (y>=1900 && y<=2099 && m>= 1 && m<=12 && d>=1 && d<=31) {
                        return $J.newDate(y, m, d);
                    }
                }
                else {
                    const r = dayMonthToData(parts[2], parts[3]);
                    if (r !== undefined) {
                        return r;
                    }
                }
            }
        }
    }
    catch(e) {
        // Ignore error
    }

    throw new $J.FormatError($JL.invalid_date);

    function dayMonthToData(sd:string, sm:string) {
        const d = stringToDay(sd);
        const m = stringToMonth(sm);

        if (m>= 1 && m<=12 && d>=1 && d<=31) {
            const curdate = $J.curDate();
            let y = $J.dateParts(curdate).Year;
            let date = $J.newDate(y, m, d);

            if (date < curdate) {
                date = $J.newDate(++y, m, d);
            }

            if ((date - curdate) > 270) {
                date = $J.newDate(y - 1, m, d);
            }

            return date;
        }
    }
}

export function dateToString(v: number | Date): string
{
    var d: Date = !(v instanceof Date) ? new Date(v * (24 * 60 * 60 * 1000)) : <Date>v;
    return $J.intToA(d.getUTCDate(), 1) + " " +
           $JL.monthNamesShort[d.getUTCMonth()] + " " +
           $J.intToA(d.getUTCFullYear(), 4);
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

export function stringToDay(s: string): number
{
    if (/^[0-9]+$/.test(s))
        return parseInt(s, 10);

    return NaN;
}

export function stringToMonth(s: string): number
{
    if (/^[0-9]+$/.test(s))
        return parseInt(s, 10);

    for (var m = 0 ; m < 12 ; ++m) {
        if ($JL.monthNames[m] === s || $JL.monthNamesShort[m] === s)
            return m+1;
    }

    return NaN;
}

export function stringToYear(s: string): number
{
    if (/^[0-9]+$/.test(s)) {
        var m = parseInt(s, 10);

        if (m>=0 && m<100)
            return (m >= 30 ? 1900 : 2000) + m;

        return m;
    }

    return NaN;
}

export function yearToShortYear(y: number): number
{
    if (y>=2000 && y<2030)  return y-2000;
    if (y>=1930 && y<2000)  return y-1900;

    return y;
}

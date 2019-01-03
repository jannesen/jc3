/// <reference path="lib-ext.d.ts"/>
import * as $J from "jc3/jannesen";
import * as $JL from "jc3/jannesen.language";

export const decimalPoint        = ".";
export const firstDay            = 1;
export const regexDate           = /^([0-9]{1,4})[\-\/. ]([01]?[0-9]|[A-Za-z]+)(?:[\-\/. ]([0-9]{1,4}))?$/;

export function timePlaceHolder(format: string|number): string|undefined
{
    switch(format) {
    case 1 /*$JT.TimeFormat.HM*/:       return "hh:mm";
    case 2 /*$JT.TimeFormat.HMS*/:      return "hh:mm:ss";
    case 3 /*$JT.TimeFormat.MS*/:       return "mm:ss";
    case 4 /*$JT.TimeFormat.HMSF*/:     return "hh:mm:ss.fff";
    default:                            return undefined;
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
        var parts = regexDate.exec(s.trim());

        if (parts !== null) {
            var d: number;
            var m: number;
            var y: number;

            if (typeof parts[1] === "string" && typeof parts[2] === "string") {
                if (typeof parts[3] === "string") {
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
                    if (y>=1900 && y<=2099 && m>= 1 && m<=12 && d>=1 && d<=31) {
                        return $J.newDate(y, m, d);
                    }
                }
                else {
                    d = stringToDay(parts[1]!);
                    m = stringToMonth(parts[2]!);

                    if (m>= 1 && m<=12 && d>=1 && d<=31) {
                        const curdate = $J.curDate();
                        y = $J.dateParts(curdate).Year;
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
        }
    }
    catch(e) {
        // Ignore error
    }

    throw new $J.FormatError($JL.invalid_date);
}

export function dateToString(v: number | Date, f?: string): string
{
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

export function stringToDatetime(s: string): number
{
    try {
        var parts = /^([0-9]+)[\-\/. ]([0-9]+|[A-Za-z]+)[\-\/. ]([0-9]+) +([0-9]+)[:.]([0-9]+)(?:[:.]([0-9]+)(?:\.([0-9]+))?)?$/.exec(s.trim());

        if (parts !== null && typeof parts[1] === "string" && typeof parts[2] === "string" && typeof parts[3] === "string" && typeof parts[4] === "string" && typeof parts[5] === "string") {
            var d:number = stringToDay(parts[1]!);
            var m:number = stringToMonth(parts[2]!);
            var y:number = stringToYear(parts[3]!);
            var H:number = $J.parseIntExact(parts[4]!);
            var M:number = $J.parseIntExact(parts[5]!);
            var S:number = 0;
            var F:number = 0;

            if (typeof parts[6] === "string") {
                S = $J.parseIntExact(parts[6]!) ;
                if (typeof parts[7] === "string") {
                    while (parts[7]!.length < 3)
                        parts[7] += "0";

                    parts[7] = parts[7]!.substr(0, 3);
                    F = $J.parseIntExact(parts[7]!);
                }
            }

            if (y>=1900 && y<=2099 && m>= 1 && m<=12 && d>=1 && d<=31 && H>=0 && ((H<=23 && M>=0 && M<=59 && S>=0 && S<=59 && F>=0 && F<=999) || (H===24 && M===0 && S===0 && F===0))) {
                let v = Date.UTC(y, m - 1, d, H, M, S, F);
                if ((new Date(v)).getUTCDate() === d)
                    return v;
            }
        }
    }
    catch(e) {
        // Ignore error
    }

    throw new $J.FormatError($JL.invalid_datetime);
}

export function datetimeToString(v: number|Date, f?: string): string
{
    var d: Date = !(v instanceof Date) ? new Date(<number>v) : <Date>v;

    if (typeof f === "string" && f !== "") {
        var rtn:string = "";
        var p:number   = 0;
        var h:number   = 0;

        if (f.substr(0, 1) === "~") {
            ++p;

            if (d.getTime() % (24*60*60*1000) === 0) {
                d = new Date(d.getTime() - (24*60*60*1000));
                h = 24;
            }
        }

        while (p < f.length) {
            var c = f.substr(p, 1);
            var n = 0;

            while (p < f.length && f[p] === c)
                { ++n; ++p; }

            switch(c) {
            case "d":
                switch(n) {
                case 2:     rtn += $JL.dayNamesShort[d.getUTCDay()];        break;
                case 3:     rtn += $JL.dayNames[d.getUTCDay()];             break;
                default:    rtn += $JL.dayNamesMin[d.getUTCDay()];          break;
                }
                break;

            case "D":   rtn += $J.intToA(d.getUTCDate(), n);                break;

            case "M":
                switch(n) {
                case 3:     rtn += $JL.monthNamesShort[d.getUTCMonth()];    break;
                case 4:     rtn += $JL.monthNames[d.getUTCMonth()];         break;
                default:    rtn += $J.intToA(d.getUTCMonth() + 1, n);       break;
                }
                break;

            case "Y":   rtn += $J.intToA(d.getUTCFullYear() , n);           break;
            case "h":   rtn += $J.intToA(d.getUTCHours() + h, n);           break;
            case "m":   rtn += $J.intToA(d.getUTCMinutes()  , n);           break;
            case "s":   rtn += $J.intToA(d.getUTCSeconds()  , n);           break;
            case "f":
                switch(n) {
                case 1:     rtn += $J.intToA($J.round(d.getUTCMilliseconds() / 100, 0), 1);  break;
                case 2:     rtn += $J.intToA($J.round(d.getUTCMilliseconds()  / 10, 0), 2);  break;
                default:    rtn += $J.intToA(d.getUTCMilliseconds()                   , 3);  break;
                }
                break;

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
        return $J.intToA(d.getUTCDate(),      1)    + " " +
               $JL.monthNamesShort[d.getUTCMonth()] + " " +
               $J.intToA(d.getUTCFullYear(),  4)    + " " +
               $J.intToA(d.getUTCHours(),     2)    + ":" +
               $J.intToA(d.getUTCMinutes(),   2)    + ":" +
               $J.intToA(d.getUTCSeconds(),   2);
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

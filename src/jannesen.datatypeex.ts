/// <reference path="lib-ext.d.ts"/>
import * as $J   from "jc3/jannesen";
import * as $JT  from "jc3/jannesen.datatype";
import * as $JR  from "jc3/jannesen.regional";
import * as $JL  from "jc3/jannesen.language";
import * as $JI  from "jc3/jannesen.input";
import * as $JIE from "jc3/jannesen.inputex";

var rounderror = 100.5 - (1.005 * 100);

//===================================== RangeValue ==================================================
/**
 *!!DOC
 */
export interface IRangeValue {
    Begin:  number|null;
    End:    number|null;
}
/**
 *!!DOC
 */
export interface IRangeAttributes extends $JT.ISimpleTypeAttributes<DateRange> {
    minValue?: number;
    maxValue?: number;
}

/**
 *!!DOC
 */
export abstract class RangeValue extends $JT.SimpleType<IRangeValue> {
    public static NativeType = "object";

    public  cnvTextToValue(text: string): IRangeValue|null {
        let rtn = stringToDateRange(text);
        return rtn;
    }

    /**
     *!!DOC
     */
    public get MinValue():number|undefined {
        return this.getAttr("minValue");
    }
    public set MinValue(v:number|undefined) {
        this.setAttr("minValue", (typeof v === "number" ? v : undefined));
    }

    /**
     *!!DOC
     */
    public get MaxValue():number|undefined {
        return this.getAttr("maxValue");
    }
    public set MaxValue(v:number|undefined) {
        this.setAttr("maxValue", (typeof v === "number" ? v : undefined));
    }

    protected _normalizeValue(v:IRangeValue|null):IRangeValue|null {
        if (v !== null) {
            switch(typeof v.Begin) {
            case "number":
                break;
            case "undefined":
                v.Begin = null;
                break;
            case "object":
                if (v.Begin === null)
                    break;
            // fall tru
            default:
                throw new $J.InvalidStateError("Invalid IRangeValue.Begin.");
            }
            switch(typeof v.End) {
            case "number":
                break;
            case "undefined":
                v.End = null;
                break;
            case "object":
                if (v.End === null)
                    break;
            // fall tru
            default:
                throw new $J.InvalidStateError("Invalid IRangeValue.End.");
            }

            if (v && v.Begin! > v.End!) {
                var t = v.Begin;
                v.Begin = v.End;
                v.End   = t;
            }
        }

        return v;
    }
    protected validateValue() {
        let value = this._value;

        if (value !== null) {
            let minValue = this.MinValue;
            let maxValue = this.MaxValue;

            // Make sure the dates do not cross the min and max value
            if (typeof maxValue === 'number' && (value.End! > maxValue || value.Begin! > maxValue)) {
                return $JL.valuetohigh_message;
            }

            if (typeof minValue === 'number' && (value.End! < minValue || value.Begin! < minValue)) {
                return $JL.valuetolow_message;
            }
        }

        return super.validateValue();
    }
}

//===================================== DateRange ==================================================
/**
 *!!DOC
 */
/**
 *!!DOC
 */
export interface IDateRangeAttributes extends IRangeAttributes {
}

/**
 *!!DOC
 */
export class DateRange extends RangeValue {
    public static Name       = "DateRange";
    public static Attributes = $J.extend<IDateRangeAttributes>({ minValue: $J.newDate(1900, 1, 1), maxValue: $J.newDate(2100, 12, 31) }, $JT.SimpleType.Attributes);

    public static subClass(attr: IDateRangeAttributes): typeof DateRange {
        return $JT.subClassHelper(DateRange, attr);
    }

    public  cnvTextToValue(text: string): IRangeValue|null {
        return stringToDateRange(text);
    }

    public  cnvValueToText(dateRange: IRangeValue): string {
        return dateRangeToString(dateRange);
    }

    public  cnvValueToInvariant(value: IRangeValue): string {
        return $J.dateToString(value.Begin) + '~' + $J.dateToString(value.End);
    }

    public  cnvInvariantToValue(datestring: string): IRangeValue {
        let parts = datestring.split('~', 2);
        return { Begin: $J.parseDate(parts[0]), End: $J.parseDate(parts[1]) };
    }

    public  getControl(opts?: $JIE.IDateRangeControlOptions): $JI.IControlContainer<DateRange> {
        return this.getinputcontrol<$JIE.DateRange, $JIE.IDateRangeControlOptions>("jc3/jannesen.inputex", "DateRange", opts);
    }

    protected isTypeOf(o: any): boolean {
        return o instanceof DateRange;
    }
}

//===================================== DateTimeRange ======================================================
/**
 *!!DOC
 */
export interface IDateTimeRangeAttributes extends IRangeAttributes {
    timezone?:   $JT.ITimeZone;
}

/**
 *!!DOC
 */
export class DateTimeRange extends RangeValue {
    public static Name       = "DateTimeRange";
    public static Attributes = $J.extend<IDateTimeRangeAttributes>({ }, $JT.SimpleType.Attributes);

    public static subClass(attr: IDateTimeRangeAttributes): typeof DateTimeRange {
        return $JT.subClassHelper(DateTimeRange, attr);
    }

    public  cnvTextToValue(text: string): IRangeValue|null {
        const timezone = this.TimeZone;
        let   v = stringToDateTimeRange(text);

        if (timezone && v) {
            v = { Begin: timezone.LocalToUtc(v.Begin), End: timezone.LocalToUtc(v.End) };
        }

        return v;
    }

    public  cnvValueToText(dateRange: IRangeValue): string {
        const timezone = this.TimeZone;
        let   v = dateRange;

        if (timezone) {
            v = { Begin: timezone.UtcToLocal(v.Begin), End: timezone.UtcToLocal(v.End) };
        }

        return dateTimeRangeToString(v);
    }

    public  cnvValueToInvariant(value: IRangeValue): string {
        return $J.datetimeToString(value.Begin) + '~' +
               $J.datetimeToString(value.End);
    }

    public  cnvInvariantToValue(datestring: string): IRangeValue {
        let parts = datestring.split('~', 2);
        return { Begin: $J.parseDatetimeNumber(parts[0]), End: $J.parseDatetimeNumber(parts[1]) };
    }

    public  getControl(opts?: $JIE.IDateTimeRangeControlOptions): $JI.IControlContainer<DateTimeRange> {
        return this.getinputcontrol<$JIE.DateTimeRange, $JIE.IDateTimeRangeControlOptions>("jc3/jannesen.inputex", "DateTimeRange", opts);
    }

    /**
     *!!DOC
     */
    public get TimeZone(): $JT.ITimeZone {
        return this.getAttr("timezone");
    }

    protected isTypeOf(o: any): boolean {
        return o instanceof DateTimeRange;
    }
}

//===================================== helpers ===================================================

function divModulo(v: number,      divisor: number): { result:number, remainder:number };
function divModulo(v: number|null, divisor: number): { result:number, remainder:number }|null;
function divModulo(v: number|null, divisor: number): { result:number, remainder:number }|null {
    if (v === null)
        return null;

    let r = Math.floor(v / divisor + rounderror);

    return {
        result:     r,
        remainder:  v - (r * divisor)
    };
}

const regexTime              = /^([0-2]?[0-9]):([0-5][0-9])(?::([0-5][0-9])(?:\.([0-9]{1,3}))?)?$/;
const sregexDate             = regexToString($JR.regexDate);
const sregexTime             = regexToString(regexTime);
const regexDataRangeFull     = new RegExp("^(" + sregexDate + ") ?-? ?(" + sregexDate + ")$");
const regexDateAndTimeRange  = new RegExp("^(" + sregexDate + ") (" + sregexTime + ") ?-? ?(" + sregexTime + ")$");
const regexDataTimeRangeFull = new RegExp("^(" + sregexDate + " " + sregexTime + ") ?-? ?(" + sregexDate + " " + sregexTime + ")$");

function dateRangeToString(dateRange: IRangeValue):string
{
    if (typeof dateRange.Begin === 'number' && typeof dateRange.End === 'number') {
        const beginParts = $J.dateParts(dateRange.Begin);
        const endParts   = $J.dateParts(dateRange.End);

        if (beginParts.Year === endParts.Year) {
            if (dateRange.Begin === dateRange.End) {
                return $JR.dateToString(dateRange.Begin);
            }

            if (beginParts.Day === 1) {
                if (endParts.Month === beginParts.Month && dateRange.End  === $J.newDate(beginParts.Year, beginParts.Month + 1, 1) - 1) {
                    return $JL.monthNamesShort[endParts.Month - 1] + " " + beginParts.Year;
                }

                if ((beginParts.Month - 1) % 3 === 0 && endParts.Month === beginParts.Month + 2 && dateRange.End === $J.newDate(beginParts.Year, beginParts.Month + 3, 1) - 1) {
                    return "Q" + (((beginParts.Month-1) / 3) + 1) + " " + beginParts.Year;
                }

                if (beginParts.Month ===  1 && endParts.Month   === 12 && endParts.Day   === 31) {
                    return "" + beginParts.Year;
                }
            }

        }
    }

    return (typeof dateRange.Begin === "number" ? $JR.dateToString(dateRange.Begin) : "" ) +
           " - " +
           (typeof dateRange.End   === "number" ? $JR.dateToString(dateRange.End)   : "" );
}
function dateTimeRangeToString(dateRange: IRangeValue):string {
    const begin = divModulo(dateRange.Begin, 86400000);
    const end   = divModulo(dateRange.End,   86400000);

    if (end && end.remainder === 0) {
        end.remainder = 86400000;
        end.result--;
    }

    if (begin && end && begin.remainder === 0 && end.remainder === 86400000) {
        return dateRangeToString({ Begin: begin.result, End: end.result });
    }

    var timeformat = 0;

    if (begin && begin.remainder % 1000 !== 0)
        timeformat = 2;
    else
    if (end   && end.remainder % 1000 !== 0)
        timeformat = 2;
    else
    if (begin && begin.remainder % 60000 !== 0)
        timeformat = 1;
    else
    if (end   && end.remainder % 60000 !== 0)
        timeformat = 1;

    if (begin && end && begin.result === end.result) {
        return $JR.dateToString(begin.result) + " " + timeToString(begin.remainder, timeformat) + "-" + timeToString(end.remainder, timeformat);
    }

    return (begin ? $JR.dateToString(begin.result) + " " + timeToString(begin.remainder, timeformat) : "") +
           " - " +
           (end   ? $JR.dateToString(end.result)   + " " + timeToString(end.remainder, timeformat)   : "");
}
function stringToDateRange(text:string):IRangeValue|null
{
    text = text.trim().replace("  ", " ").toLowerCase();

    if (text === "")
        return null;

    try {
        let match:RegExpExecArray|null;

        if (match = regexDataRangeFull.exec(text)) {
            if (typeof match[1] === "string" && typeof match[2] === "string") {
                return { Begin: $JR.stringToDate(match[1]!), End: $JR.stringToDate(match[2]!) };
            }
        }

        if ($JR.regexDate.test(text)) {
            const day = $JR.stringToDate(text);
            return { Begin: day , End: day };
        }

        if (match = /^^([1[0-2]|0?[1-9]|[a-z]+) ?-? ?([12][0-9]{3})$/.exec(text)) {
            if (typeof match[1] === "string" && typeof match[2] === "string") {
                const m    = $JR.stringToMonth(match[1]!);
                if (isNaN(m))
                    throw new $J.FormatError($JL.invalid_daterange);

                const year = $J.parseIntExact(match[2]!);

                return { Begin: $J.newDate(year, m, 1), End: $J.newDate(year, m + 1, 1) - 1 };
            }
        }

        if (match = /^q([1-4]) ?-? ?([12][0-9]{3})$/.exec(text)) {
            if (typeof match[1] === "string" && typeof match[2] === "string") {
                const m    = ($J.parseIntExact(match[1]!) - 1) * 3 + 1;
                const year = $J.parseIntExact(match[2]!);

                return { Begin: $J.newDate(year, m, 1), End: $J.newDate(year, m + 3, 1) - 1 };
            }
        }

        if (/^[12][0-9]{3}$/.test(text)) {
            const year = $J.parseIntExact(text);
            return { Begin: $J.newDate(year, 1, 1), End: $J.newDate(year, 12, 31) };
        }
    } catch(e) {
    }

    throw new $J.FormatError($JL.invalid_daterange);
}
function stringToDateTimeRange(text:string):IRangeValue|null {
    let match:RegExpExecArray|null;

    text = text.trim().replace("  ", " ").toLowerCase();

    if (text === "")
        return null;

    try {
        if (match = regexDataTimeRangeFull.exec(text)) {
            if (typeof match[1] === "string" && typeof match[2] === "string") {
                return { Begin: $JR.stringToDatetime(match[1]!), End:$JR.stringToDatetime(match[2]!) };
            }
        }
        else if (match = regexDateAndTimeRange.exec(text)) {
            if (typeof match[1] === "string" && typeof match[2] === "string" && typeof match[3] === "string") {
                const d = $JR.stringToDate(match[1]!) * 86400000;
                return { Begin: d + stringToTime(match[2]!), End: d + stringToTime(match[3]!) };
            }
        }

        let d = stringToDateRange(text);
        if (d) {
            return {
                Begin: (typeof d.Begin === 'number' ? d.Begin     * 86400000 : null),
                End:   (typeof d.End   === 'number' ? (d.End + 1) * 86400000 : null)
            };
        }
    } catch(e) {
    }

    throw new $J.FormatError($JL.invalid_datetimerange);
}
function timeToString(value:number, timeformat:number):string {
    let   n        = divModulo(Math.round(value), 3600000);
    const hour     = n.result;
          n        = divModulo(n.remainder,         60000);
    const min      = n.result;

    let s = $J.intToA(hour, 1) + ":" + $J.intToA(min, 2);

    if (timeformat >= 1) {
        n = divModulo(n.remainder,         1000);

        s += ":" + $J.intToA(n.result, 2);

        if (timeformat >= 2)
            s += "." + $J.intToA(n.remainder, 3);
    }

    return s;
}
function stringToTime(text:string):number {
    const m = regexTime.exec(text);
    if (!(m && typeof m[1] === "string" && typeof m[2] === "string"))
        throw new $J.FormatError("Invalid time");

    return $J.parseIntExact(m[1]!) * 3600000 +
           $J.parseIntExact(m[2]!)   * 60000 +
           (typeof m[3] === "string" ? $J.parseIntExact(m[3]!) * 1000 : 0) +
           (typeof m[4] === "string" ? $J.parseIntExact(m[4]!)        : 0);
}
function regexToString(r: RegExp): string {
    let s = r.source;
    let i = 0;

    while ((i = s.indexOf('(', i)) >= 0) {
        i = i + 1;

        if (s[i] !== '?')
            s = s.substr(0, i) + '?:' + s.substr(i);
    }

    return s.substr(1, s.length - 2);
}

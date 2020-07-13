/// <reference path="lib-ext.d.ts"/>
const tick_per_day            = (24*60*60*1000);
const rounderror              = 100.5 - (1.005 * 100);
var global_uniqueidcounter  = Math.floor(Math.random() * 100000);

//=============================================== Enums ===========================================
/**
 * !!DOC
 */
export const enum DayOfWeek
{
    sunday      = 0,
    monday      = 1,
    tuesday     = 2,
    wednesday   = 3,
    thursday    = 4,
    friday      = 5,
    saturday    = 6
}

/**
 * !!DOC
 */
export const enum TimeFormat
{
    HM      =  1,    // HH:MM
    HMS     =  2,    // HH:MM:SS
    HMSF    =  3,    // HH:MM:SS.FFF
    MS      = 10,    // MM:SS (mm can be bigger then 60)
    SEC     = 11     // SS.FFF
}

/**
 * To JSON conversion flags
 */
export const enum ToJsonFlags
{
    None            = 0,
    StripNullEmpty = 0x01
}


//=============================================== Interface =======================================
/**
 * A wrapper for executing an event handler in a try-catch.
 */
export interface DateParts
{
    Year:       number;
    Month:      number;
    Day:        number;
}

/**
 * A wrapper for executing an event handler in a try-catch.
 */
export interface IEventSource
{
    bind(eventName: string, handler: (ev:any)=>void, thisArg?:any): void;
    unbind(eventName: string, handler: (ev:any)=>void, thisArg?:any): void;
}

/**
 * A wrapper for executing an event handler in a try-catch.
 */
export interface IEventWrapper
{
    (data: any):void;
    eventName:          string;
    eventHandler:       (ev:any) => void;
    thisArg?:           any;
}

/**
 * !!DOC
 */
export interface IEventHandlerCollection
{
    [eventName: string]: IEventWrapper[]|undefined;
}

/**
 * !!DOC
 */
export interface JsonArray extends Array<JsonValue> {}
export type JsonObject  = { [key: string]: JsonValue };
export type JsonValue   = number|string|boolean|null|undefined|JsonObject|JsonArray;

/**
 * !!DOC
 */
export interface IUrlArgsFunc      { toUrlArgs(): { [name:string]: string }; }
export interface IUrlValue         { toUrlValue(): string|null; }
export interface IUrlArgsInvariant { [name:string]: string; }
export interface IUrlArgsColl      { [name:string]: string|number|boolean|null|undefined|IUrlValue; }
export type IUrlArgs = IUrlArgsInvariant | IUrlArgsColl | IUrlArgsFunc;
export function isIUrlArgsFunc(v: Object): v is IUrlArgsFunc {
    return typeof (v as any).toUrlArgs === 'function';
}
export function isIUrlValue(v: Object): v is IUrlValue {
    return typeof (v as any).toUrlValue === 'function';
}

/**
 * !!DOC
 */
export interface ICallArgs // TODO
{
    [key: string]: string|number|boolean|Object|null;
}

/**
 * !!DOC
 */
export interface ISetFocusOnError extends Error
{
    setFocusOnError():  boolean;
}

export function isISetFocusOnError(o:Error): o is ISetFocusOnError
{
    return o instanceof Error && typeof (o as any).setFocusOnError === 'function';
}

//=============================================== Error Classes ===================================
/**
 *!!DOC
 */
export class MessageError extends __Error
{
    constructor(message:string, innerError?:Error) {
        super("MessageError", message);
        this.innerError  = innerError;
    }
}

/**
 *!!DOC
 */
export class InvalidStateError extends __Error
{
    constructor(message?:string, innerError?:Error) {
        super("InvalidStateError", message || "Invalid state");
        this.innerError  = innerError;
    }
}

/**
 *!!DOC
 */
export class NotImplentedError extends __Error
{
    constructor(funcname:string) {
        super("NotImplentedError", funcname + ": not implemented.");
    }
}

/**
 * !!DOC
 */
export interface IAjaxCallDefinition
{
    method:                 string;
    callname?:              string;
    timeout?:               number;
    request_contenttype?:   string;
    response_contenttype?:  string;
}
/**
 * !!DOC
 */
export class AjaxError extends __Error
{
    public  errCode:        string;
    public  callDefinition: IAjaxCallDefinition;
    public  httpStatus:     number|undefined;

    constructor(errCode: string, message:string, callDefinition:IAjaxCallDefinition, httpStatus?:number, innerError?:Error) {
        super("AjaxError", message);
        this.errCode        = errCode;
        this.callDefinition = callDefinition;
        this.httpStatus     = httpStatus;
        this.innerError     = innerError;
    }
}

/**
 *!!DOC
 */
export interface IServerErrorDetails
{
    code:   string;
    detail: [{
                    class:      string;
                    message:    string;
            }];
}

/**
 *!!DOC
 */
export class ServerError extends __Error
{
    public  errCode:        string;
    public  serverError:    IServerErrorDetails;

    constructor(serverError: IServerErrorDetails)
    {
        let message:string|undefined;

        if (serverError instanceof Object && Array.isArray(serverError.detail) && serverError.detail.length > 0) {
            message = serverError.detail[0].message;
            if (typeof message === 'string' && message.startsWith('[')) {
                const i = message.indexOf('] ');
                if (i > 0) {
                    message = message.substr(i+2);
                }
            }
        }

        super("ServerError", (message !== undefined ? message : "Invalid error response received from server."));
        this.errCode     = (serverError instanceof Object && typeof serverError.code === "string" ? serverError.code : "UNKNOWN");
        this.serverError = serverError;
    }

    public toMessageString()
    {
        let rtn = '';

        if (this.serverError instanceof Object && Array.isArray(this.serverError.detail)) {
            for (let d of this.serverError.detail) {
                const m = '[ServerError.detail]: ' + (typeof d.message === 'string' && d.message.length > 0 ? d.message : 'UNKNOWN');
                rtn = (rtn.length ? rtn + '\n' + m : m);
            }
        }
        else {
            rtn = '[ServerError]: ' + this.message;
        }

        return rtn;
    }
}

/**
 *!!DOC
 */
export class ConversionError extends __Error
{
    constructor(message:string) {
        super("ConversionError", message);
    }
}

/**
 *!!DOC
 */
export class FormatError extends __Error
{
    constructor(message:string) {
        super("FormatError", message);
    }
}

//=============================================== Static functions ================================
/**
 * Run through the properties of each of the mixins and copy them over to the target of the mixins,
 * filling out the stand-in properties with their implementations
 * @param derivedCtor
 * @param baseCtors
 * @returns {}
 */
export function applyMixins(derivedCtor: any, baseCtors: any[])
{
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}

/**
 * Test if constructor create type
 *
 */
export function testContructorOf<T extends new ()=>Object>(constructor:any, type:T): constructor is T
{
    if (typeof constructor !== 'function') {
        return false;
    }

    while (true) {
        if (constructor === type) {
            return true;
        }

        let x = Object.getPrototypeOf(constructor.prototype);
        if (!x) {
            return false;
        }

        constructor = x.constructor;
    }
}

/**
 * Merge the contents of two or more objects together into the first object.
 * And return the first object
 *
 * @param   target      to extend.
 */
export function extend(target:any, ...sources: any[]): Object;
export function extend<T extends { [key: string]: any }>(target: T, ...sources: any[]): T;
export function extend(target:any, ...sources: any[]): Object
{
    sources.forEach(obj =>
    {
        if (obj instanceof Object) {
            for (var propertyName in obj) {
                if (obj.hasOwnProperty(propertyName)) {
                    if (target[propertyName] === undefined)
                        target[propertyName] = obj[propertyName];
                }
            }
        }
    });

    return target;
}

/**
 * !!DOC
 */
export function isEqual(a1: any, a2: any) {
    let leftChain:any[]|undefined;
    let rightChain:any[]|undefined;

    return compare(a1, a2);

    function compare(l: any, r: any) {
        if (l === r) {
            return true;
        }

        if (typeof l === 'number' && typeof r === 'number' && isNaN(l) && isNaN(r)) {
            return true;
        }

        if (l instanceof Object && r instanceof Object) {
            if (l.constructor === Object && r.constructor === Object) {
                if (leftChain) {
                    const lc = leftChain.indexOf(l);
                    const rc = leftChain.indexOf(r);

                    if (lc >= 0 || rc >= 0) {
                        return lc === rc;
                    }
                }
                else {
                    leftChain  = [];
                    rightChain = [];
                }

                leftChain.push(l);
                rightChain!.push(r);

                const lnames = Object.getOwnPropertyNames(l);
                const rnames = Object.getOwnPropertyNames(r);

                if (lnames.length !== rnames.length) {
                    return false;
                }

                if (lnames.length > 0) {
                    const names = new Set(lnames);
                    for (let n of rnames) {
                        if (!names.has(n)) {
                            return false;
                        }
                    }

                    for (let n of lnames) {
                        if (!compare(l[n], r[n])) {
                            return false;
                        }
                    }
                }
                else {
                    if (typeof l.valueOf === 'function') {
                        if (!(typeof r.valueOf === 'function' && l.valueOf() === r.valueOf())) {
                            return false;
                        }
                    }
                    else {
                        if (typeof r.valueOf === 'function') {
                            return false;
                        }
                    }
                }

                return true;
            }
            else if (l instanceof Array && r instanceof Array) {
                if (l.length !== r.length) {
                    return false;
                }

                for (let i = 0; i < l.length; ++i) {
                    if (!compare(l[i], r[i])) {
                        return false;
                    }
                }

                return true;
            }
            else if (typeof l.isEqual === 'function') {
                return l.isEqual(r);
            }

            return false;
        }

        return false;
    }
}

/**
 * !!DOC
 */
export function removeItemFromArray(arr:any[], item:any): void {
    console.assert(Array.isArray(arr), "Array.isArray(arr) failed");

    if (Array.isArray(arr)) {
        let foundIndex = arr.indexOf(item);
        console.assert(foundIndex !== -1, "arr.indexOf(item) failed");
        if (foundIndex !== -1)
            arr.splice(foundIndex, 1);
    }
}

/**
 * encode to uri argument
 *
 * @param   value       variable to encode.
 */
export function valueToInvariant(value: string|number|boolean|IUrlValue): string|null
{
    switch(typeof value) {
    case "string":      return value as string;
    case "number":      return value.toString();
    case "boolean":     return value ? "1" : "0";
    case "object":
        if (isIUrlValue(value)) {
            return value.toUrlValue();
        }
    }

    throw new InvalidStateError("argument error valueToInvariant(" + typeof value +").");
}

/**
 * Calculate date value from y,m,d
 * The date value is the number of days since 1/1/1970
 *
 * @param   year    year.
 * @param   month   month.
 * @param   month   day.
 */
export function newDate(year: number, month: number, day: number): number
{
    while (month < 1) {
        year--;
        month += 12;
    }
    while (month > 12) {
        year++;
        month -= 12;
    }

    return Math.round(Date.UTC(year, month - 1, day) / tick_per_day);
}

/**
 * return current date value
 */
export function curDate(): number
{
    var d = Date.now();
    d = d - ((new Date(d)).getTimezoneOffset() * 60 * 1000);
    return Math.floor(d / tick_per_day);
}

/**
 * return current date value
 */
export function dateParts(d:number): DateParts
{
    let date =new Date(Math.floor(d) * (24*60*60*1000));

    return {
        Year:   date.getUTCFullYear(),
        Month:  date.getUTCMonth() + 1,
        Day:    date.getUTCDate()
    };
}

/**
 * Return day-of-the-week from date value.
 * 0 is synday
 * @param   d   date value.
 */
export function getDateDay(d: number): number;
export function getDateDay(d: number|undefined): number|undefined;
export function getDateDay(d: number|null): number|null;
export function getDateDay(d: number|null|undefined): number|null|undefined
{
    if (d === undefined || d === null)
        return d;

    return ((<number>d) + 7000 - 3) % 7;
}

/**
 * !!DOC
 */
export function dateFromDatetime(d: Date|number):                number;
export function dateFromDatetime(d: Date|number|null):           number|null;
export function dateFromDatetime(d: Date|number|undefined):      number|undefined;
export function dateFromDatetime(d: Date|number|undefined|null): number|undefined|null;
export function dateFromDatetime(d: Date|number|undefined|null): number|undefined|null
{
    if (d === undefined || d === null)
        return <any>d;

    if (typeof d !== "number")
        d = (<Date>d).getTime();

    return Math.floor((<number>d) / (24*60*60*1000));
}

/**
 * !!DOC
 */
export function datetimeFromDate(d: number): Date
{
    if (d === undefined || d === null)
        return <any>d;

    return new Date(Math.floor(d) * (24*60*60*1000));
}

/**
 * !!DOC
 */
export function datetimeNumberFromDate(d: number): number {
    if (d === undefined || d === null)
        return <any>d;

    return Math.floor(d) * (24 * 60 * 60 * 1000);
}

/**
 * !!DOC
 */
export function parseIntExact(s: string): number
{
    if (/^(\-|\+)?[0-9]+$/.test(s)) {
        var r = parseInt(s, 10);

        if (!isNaN(r))
            return r;
    }

    throw new ConversionError("Invalid integer value \'" + s + "\'.");
}

/**
 * !!DOC
 */
export function parseFloatExact(s: string): number
{
    if (/^(\-\+)?[0-9]*(\.[0-9]*)?$/.test(s)) {
        var r = parseFloat(s);

        if (!isNaN(r))
            return r;
    }

    throw new ConversionError("Invalid number value \'" + s + "\'.");
}

/**
 * !!DOC
 */
export function parseDate(s: string): number
{
    try {
        var parts = /^([0-9]{4})\-([0-9]{1,2})\-([0-9]{1,2})$/.exec(s);

        if (parts !== null && typeof parts[1] === "string" && typeof parts[2] === "string" && typeof parts[2] === "string") {
            var y  = parseIntExact(parts[1]!);
            var m  = parseIntExact(parts[2]!);
            var d  = parseIntExact(parts[3]!);

            if (y>=1900 && y<=2099 && m>=1 && m<=12 && d>=1 && d<=31)
                return newDate(y, m, d);
        }
    }
    catch(e) {
        // Ignore error
    }
    throw new ConversionError("Invalid date value \'" + s + "\'.");
}

/**
 * !!DOC
 */
export function parseDatetime(s: string): Date
{
    return new Date(parseDatetimeNumber(s));
}

/**
 * !!DOC
 */
export function parseDatetimeNumber(s: string): number
{
    try {
        var parts = /^([0-9]{4})\-([0-9]{1,2})\-([0-9]{1,2})T([0-9]{1,2}):([0-9]{1,2})(?::([0-9]{2})(?:\.([0-9]{1,3}))?)?$/.exec(s);

        if (parts !== null && typeof parts[1] === "string" && typeof parts[2] === "string" && typeof parts[3] === "string" && typeof parts[4] === "string" && typeof parts[5] === "string") {
            var y = parseIntExact(parts[1]!);
            var m = parseIntExact(parts[2]!);
            var d = parseIntExact(parts[3]!);
            var H = parseIntExact(parts[4]!);
            var M = parseIntExact(parts[5]!);
            var S = 0;
            var F = 0;

            if (typeof parts[6] === "string") {
                S = parseIntExact(parts[6]!) ;
                if (typeof parts[7] === "string") {
                    while (parts[7]!.length < 3)
                        parts[7] += "0";

                    parts[7] = parts[7]!.substr(0, 3);
                    F = parseIntExact(parts[7]!);
                }
            }

            if (y>=1900 && y<=2099 && m>= 1 && m<=12 && d>=1 && d<=31 && H>=0 && H<=23 && M>=0 && M<=59 && S>=0 && S<=59 && F>=0 && F<=999)
                return Date.UTC(y, m - 1, d, H, M, S, F);
        }
    }
    catch(e){
        // Ignore error
    }
    throw new ConversionError("Invalid datetime value \'" + s + "\'.");
}

/**
 * !!DOC
 */
export function parseUrlArgs(urlargs: IUrlArgsInvariant|string): IUrlArgsInvariant
{
    if (typeof urlargs === 'string') {
        var args = <IUrlArgsInvariant>{};

        if (urlargs.length > 0) {
            for (let urlarg of urlargs.split("&")) {
                var s = urlarg.indexOf("=");
                if (s < 0)
                    throw new FormatError("syntax error in urlargs.");

                args[decodeURIComponent(urlarg.substring(0, s))] = decodeURIComponent(urlarg.substring(s + 1));
            }
        }

        return args;
    }

    if (urlargs instanceof Object)
        return <IUrlArgsInvariant>urlargs;

    throw new InvalidStateError("Invalid urlargs type.");
}

/**
 * !!DOC
 */
export function intToA(v: number, l: number): string
{
    if (v === null || v === undefined)
        return "";

    var s = v.toString();

    if (l === s.length + 1) return "0"+s;
    if (l >   s.length)     return "0".repeat(l-s.length) + s;

    return s;
}

/**
 * !!DOC
 */
export function dateToString(v: number|null|undefined): string
{
    if (v === null || v === undefined)
        return "";

    var d = new Date(v * (24*60*60*1000));

    return intToA(d.getUTCFullYear(), 4) + "-" +
           intToA(d.getUTCMonth()+1,  2) + "-" +
           intToA(d.getUTCDate(),     2);
}

/**
 * !!DOC
 */
export function datetimeToString(v: number|Date|null|undefined): string
{
    if (v === null || v === undefined)
        return "";

    if (typeof v === "number")
        v = new Date(<number>v);

    var r = intToA(v.getUTCFullYear(), 4) + "-" +
            intToA(v.getUTCMonth()+1,  2) + "-" +
            intToA(v.getUTCDate(),     2) + "T" +
            intToA(v.getUTCHours(),    2) + ":" +
            intToA(v.getUTCMinutes(),  2) + ":" +
            intToA(v.getUTCSeconds(),  2);

    if (v.getUTCMilliseconds() !== 0)
        r += "." + intToA(v.getUTCMilliseconds(),  3);

    return r;
}

/**
 * !!DOC
 */
export function objectToUrlArgs(args: IUrlArgs): string;
export function objectToUrlArgs(name: string, args?: IUrlArgs|null|void): string;
export function objectToUrlArgs(p1: string|IUrlArgs|null|undefined|void, p2?: IUrlArgs|null|void): string
{
    let rtn = "";
    let sep = "";

    if (typeof p1 === "string") {
        rtn = p1 as string;
        sep = "?";
        p1 = p2;
    }

    if (p1 instanceof Object) {
        if (isIUrlArgsFunc(p1)) {
            p1 = p1.toUrlArgs();
        }

        for (var key in p1) {
            if (p1.hasOwnProperty(key)) {
                var value = p1[key];

                if (value !== undefined && value !== null) {
                    value = valueToInvariant(value);
                    if (value !== null) {
                        rtn += sep + encodeURIComponent(key) + "=" + encodeURIComponent(value);
                        sep = "&";
                    }
                }
            }
        }
    }

    return rtn;
}

/**
 * !!DOC
 */
export function generateUUID()
{
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                                                                        var r = (d + Math.random()*16)%16 | 0;
                                                                        d = Math.floor(d/16);
                                                                        return (c==='x' ? r : (r&0x3|0x8)).toString(16);
                                                                    });
}

/**
 * !!DOC
 */
export function round(v: number, p: number): number
{
    if (v === undefined || v === null)
        return <any>v;

    var pow: number;

    switch(p) {
    case 0:     return Math.round(v);
    case 1:     pow = 10;           break;
    case 2:     pow = 100;          break;
    case 3:     pow = 1000;         break;
    case 4:     pow = 10000;        break;
    default:    if (p > 0)      { pow = Math.pow(10, p); break; }
                return v;
    }

    v = v * pow;
    v = (v > 0) ? v - rounderror : v + rounderror;
    return Math.round(v) / pow;
}

/**
 * Divide and return result and remainder
 */
export function divModulo(v: number,      divisor: number): { result:number, remainder:number };
export function divModulo(v: number|null, divisor: number): { result:number, remainder:number }|null;
export function divModulo(v: number|null, divisor: number): { result:number, remainder:number }|null {
    if (v === null)
        return null;

    let r = Math.floor(v / divisor + rounderror);

    return {
        result:     r,
        remainder:  v - (r * divisor)
    };
}

/**
 * !!DOC
 */
export function add(...values: (number|null|undefined)[]): number|null|undefined {
    return MathHelper(1, values);
}

/**
 * !!DOC
 */
export function sub(...values: (number|null|undefined)[]): number|null|undefined {
    return MathHelper(2, values);
}

/**
 * !!DOC
 */
export function mul(...values: (number|null|undefined)[]): number|null|undefined {
    return MathHelper(3, values);
}
/**
 * !!DOC
 */
export function div(...values: (number|null|undefined)[]): number|null|undefined {
    return MathHelper(4, values);
}

function MathHelper(func:number, values:(number|null|undefined)[]): number|null|undefined {
    if (values.length === 0)
        return undefined;
    var r = values[0];
    if (typeof r !== 'number')
        return r;
    for (var i = 1; i < values.length; ++i) {
        var v = values[i];
        if (typeof v !== 'number')
            return v;

        switch(func) {
        case 1:     r += v; break;
        case 2:     r -= v; break;
        case 3:     r *= v; break;
        case 4:     r /= v; break;
        }
    }
    return r;
}

/**
 * !!DOC
 */
export function uniqueid(): number {
    return global_uniqueidcounter++;
}

//=============================================== Timeout =========================================
/**
 * !!DOC
 */
export function setTimeout(handler: ()=>void, delay:number, thisArg?:any) {
    return window.setTimeout(eventWrapper("timeout", handler, thisArg), delay);
}

/**
 * Timeout class
 */
export class Timeout
{
    private     _handler:      ()=>void;
    private     _thisArg:       any;
    private     _timeout:       number|undefined;

    /**
     * @param handler
     *  handler to call when the timeout fires.
     * @param thisArg
     *  this value when calling handler
     */
                constructor(handler: ()=>void, thisArg?:any)
    {
        this._handler = handler;
        this._thisArg = thisArg;
        this._timeout = undefined;
    }
    /**
     * start timeout. If timeout is already running do noting.
     *
     * @param timeout
     *  timeout in ms.
     */
    public      start(timeout:number)
    {
        if (this._timeout === undefined) {
            this._timeout = setTimeout(this._timeoutHandler, timeout, this);
        }
    }
    /**
     *  set timeout. If timeout is already running reset timeout to new value.
     *
     * @param timeout
     *  timeout in ms.
     */
    public      set(timeout:number)
    {
        this.clear();
        this._timeout = setTimeout(this._timeoutHandler, timeout, this);
    }
    /**
     *  clear timeout
     */
    public      clear()
    {
        if (this._timeout !== undefined) {
            clearTimeout(this._timeout);
            this._timeout = undefined;
        }
    }

    private     _timeoutHandler()
    {
        this._timeout = undefined;

        try {
            this._handler.call(this._thisArg);
        }
        catch(e) {
            globalError('Timeout.handler failed.', e);
        }
    }
}

//=============================================== runAsync ========================================
const g_truepromise = Promise.resolve(true);
let g_runQueue:((() => void)|null)[]|undefined = undefined;
/**
 * Add callback to the async queue. The callback is called before browser paint.
 * Without multiple === true only 1 entry of the callback is on the async queue (only the last one).
 * This is a way the debounce multple events to one event.
 *
 * @param callback
 *  callback to call
 *
 * @param multiple
 *  normaly only 1 entry of the callback is on the async queue (only the last one).
 *  If multiple === true the previous entry is not deleted.
 */
export function runAsync(callback: () => void, multiple?:boolean)
{
    if (!g_runQueue) {
        g_runQueue = [ callback ];
        g_truepromise.then(() => {
            if (g_runQueue) {
                for (let i = 0 ; i < g_runQueue.length ; ++i) {
                    try {
                        const cb = g_runQueue[i];
                        if (cb) {
                            cb();
                        }
                    }
                    catch (e) {
                        globalError("callbackAsync failed.", e);
                    }
                }
                g_runQueue = undefined;
            }
        });
    } else {
        if (!multiple) {
            const i = g_runQueue.indexOf(callback);
            if (i >= 0) {
                g_runQueue[i] = null;
            }
        }

        g_runQueue.push(callback);
    }
}

//=============================================== errorTranslator =================================
export type ErrorTranslateSet = (IErrorTranslate)[];
export interface IErrorTranslate {
    errclass:           string | IErrorConstructor<Error>;
    translator:         string | ((err:any)=>string|undefined) | IErrorTranslatorRegExp | IErrorTranslatorRegExp[];
    translateInner?:    boolean;
}
export interface IErrorConstructor<T extends Error>
{
    new(...args: any): T;
    readonly prototype: T;
}
export interface IErrorTranslatorRegExp
{
    regex:      RegExp;
    replace:    string | ((m:RegExpExecArray)=>string|undefined);
}

const g_errorTranslators: (((err:Error)=>string|undefined)  | ErrorTranslateSet)[] = [];
/**
 * registrate error localisation translator
 *
 * @param translator
 *  The Translator
 */
export function registratedErrorTranslator(translator: ((err:Error)=>string|undefined) | ErrorTranslateSet)
{
    if (g_errorTranslators.indexOf(translator) < 0) {
        g_errorTranslators.splice(0, 0, translator);
    }
}

/**
 * translate err to localised text for use of display error text to user.
 *
 * @param err
 *  The Error
 */
export function translateError(err: Error|Error[]): string
{
    if (err instanceof Error) {
        return translateErrorError(err) || "ERROR: " +  (typeof err.name === 'string' ? err.name : "[UNDEFINED]");
    }

    if (Array.isArray(err)) {
        if (err.length > 0) {
            return translateError(err[0]);
        }
    }

    return "INTERNAL ERROR: INVALID ERROR ARGUMENT.";
}

function translateErrorError(err: Error):string|undefined
{
    for (let translates of g_errorTranslators) {
        try {
            if (typeof translates === 'function') {
                const r = translates(err);
                if (r) {
                    return r;
                }
            }
            else if (Array.isArray(translates)) {
                for (let translate of translates) {
                    if ((typeof translate.errclass === 'string'   && translate.errclass === err.name) ||
                        (typeof translate.errclass === 'function' && err instanceof translate.errclass)) {
                        let rtn:string|undefined;
                        if (typeof translate.translator === 'string') {
                            rtn = translate.translator;
                        }
                        else if (typeof translate.translator === 'function') {
                            rtn = translate.translator(err);
                        }
                        else if (Array.isArray(translate.translator)) {
                            for (let translateregex of translate.translator) {
                                rtn = translateErrorRegExp(err, translateregex);
                                if (rtn) {
                                    break;
                                }
                            }
                        }
                        else if (translate.translator instanceof Object) {
                            rtn = translateErrorRegExp(err, translate.translator);
                        }

                        if (rtn) {
                            if (translate.translateInner && err.innerError) {
                                const ri = translateErrorError(err.innerError);
                                if (ri) {
                                    rtn += '\n' + ri;
                                }
                            }

                            return rtn;
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error("Error in error translator.", e);
        }
    }
}
function translateErrorRegExp(err: Error, r: IErrorTranslatorRegExp)
{
    if (r.regex instanceof RegExp) {
        if (r.regex.test(err.message)) {
            if (typeof r.replace === 'string') {
               return err.message.replace(r.regex, r.replace);
            }
            if (typeof r.replace === 'function') {
                return r.replace(r.regex.exec(err.message)!);
            }
        }
    }
}

//=============================================== global ==========================================
/**
 * !!DOC
 */
export function globalError(msg:string, e:Object):void
{
    var firsterr:Object|undefined;

    var m = "=== ERROR ===";

    if (msg)
        m = m + "\n" + msg;

    while (e instanceof Object) {
        m += "\n" + e.toString();
        e = (<any>(firsterr = e)).innerError;
    }

    if (firsterr && (<any>firsterr).stack)
        m += "\n\n=== STACKTRACE ===\n" + (<any>firsterr).stack;

    console.error(m);
    alert(m);
}

/**
 * !!DOC
 */
export function logError(err:Error):void
{
    let log:boolean = false;
    let e:Error;

    for (e = err; e instanceof Error; e = (e as any).innerError) {
        switch (e.name) {
        case "MessageError":
        case "ValidateErrors":
            break;
        default:
            log = true;
            break;
        }
    }

    if (log) {
        let firsterr:Error|undefined;

        var m = "=== ERROR ===";

        for (e = err; e instanceof Error; e = ((firsterr = e) as any).innerError) {
            m += "\n" + e.toString();
        }

        if (firsterr && (firsterr as any).stack) {
            m += "\n\n=== STACKTRACE ===\n" + (<any>firsterr).stack;
        }

        console.error(m);
    }
}
//=============================================== EventHandling mixin =============================
/**
 * A mixin class to provide event handling.
 */
export class EventHandling implements IEventSource
{
    /*protected*/       //!!TSB protected not posible because typescript mixin
    public      _eventHandlers:     IEventHandlerCollection|undefined;

    /**
     * Attach a handler to an event.
     * @param eventName
     * @param handler
     * @returns {}
     */
    public bind(eventName: string, handler: (ev:any)=>void, thisArg?:any): void
    {
        if (!this._eventHandlers) this._eventHandlers = {};

        eventBind(this._eventHandlers, eventName, handler, thisArg);
    }

    /**
     * Remove a previously-attached event handler.
     * @param eventName
     * @param eventWrapper
     * @returns {}
     */
    public unbind(eventName: string, handler: (ev:any)=>void, thisArg?:any): void
    {
        eventUnbind(this._eventHandlers, eventName, handler, thisArg);
    }

    /**
     * Execute all handlers and behaviors attached to the object for the given event
     * @param eventName
     * @param data
     */
    public trigger(eventName: string, data?: any): void {
        eventTrigger(this._eventHandlers, eventName, data);
    }
}

interface IEventCollectionEntry
{
    source:     IEventSource;
    eventName:  string;
    handler:    (ev:any) => void;
    thisArg:    any;
}

export interface IEventCollectionSource<T,N extends string>
{
    bind(eventName: N, handler: (ev:T)=>void, thisArg?:any): void;
    unbind(eventName: N, handler: (ev:any)=>void, thisArg?:any): void;
}


export class EventCollection
{
    private             _events:            IEventCollectionEntry[]|null;

    public              constructor() {
        this._events = null;
    }

    public              bind<N extends string, T>(source: IEventCollectionSource<T,N>, eventName: N, handler: (ev: T) => void, thisArg?: any) {
        if (!this._events) {
            this._events = [];
        }
        source.bind(eventName, handler, thisArg);
        this._events.push({source, eventName, handler, thisArg });
    }
    public              unbind<N extends string, T>(source: IEventCollectionSource<T,N>, eventName: N, handler: (ev: T) => void, thisArg?: any) {
        const   events = this._events;
        if (events) {
            let     idx = 0;
            while (idx < events.length) {
                const event = events[idx];

                if (event.source === source && event.eventName === eventName && event.handler === handler && event.thisArg === thisArg) {
                    events.splice(idx, 1);
                }
                else {
                    ++idx;
                }
            }
        }

        source.unbind(eventName, handler, thisArg);
    }
    public              unbindAll() {
        const events = this._events;

        if (events) {
            this._events = null;

            for (const event of events) {
                event.source.unbind(event.eventName, event.handler, event.thisArg);
            }
        }
    }
}
//=============================================== Helpers =========================================
/**
 * !!DOC
 */

export function eventBind(eventHandlers:IEventHandlerCollection, eventName: string, handler: (ev:any)=>void, thisArg?:any) {
    let events = eventHandlers[eventName];
    if (!events) {
        eventHandlers[eventName] = events = [];
    }
    let wrapper = eventWrapper(eventName, handler, thisArg);
    events.push(wrapper);
}
export function eventUnbind(eventHandlers:IEventHandlerCollection|undefined, eventName: string, handler: (ev:any)=>void, thisArg?:any) {
    let n = 0;

    if (eventHandlers) {
        const   events = eventHandlers[eventName];

        if (events) {
            let     idx = 0;

            while (idx < events.length) {
                const event = events[idx];

                if (event.eventHandler === handler && event.thisArg === thisArg) {
                    events.splice(idx, 1);
                    ++n;
                }
                else {
                    ++idx;
                }
            }
        }
    }

    if (n === 0) {
        console.error("unbind('" + eventName + "'): failed");
    }
}
export function eventTrigger(eventHandlers:IEventHandlerCollection|undefined, eventName: string, data:any) {
    if (eventHandlers) {
        const events = eventHandlers[eventName];
        if (events) {
            switch(events.length) {
            case 0:
                break;

            case 1:
                events[0](data);
                break;

            default:
                for (const e of events.slice(0)) {
                    if (events.includes(e)) {
                        e(data);
                    }
                }
                break;
            }
        }
    }
}
export function eventWrapper(eventName:string, eventHandler:(ev:any)=>void, thisArg:any): IEventWrapper
{
    let h = newEventHandler() as IEventWrapper;
    h.eventName    = eventName;
    h.eventHandler = eventHandler;
    h.thisArg      = thisArg;
    return h;
}

function newEventHandler()
{
    function me(evdata:any) {
        try {
            (<any>me).eventHandler.call((<any>me).thisArg, evdata);
        }
        catch (e) {
            globalError((<any>me).eventName + " handler failed.", e);
        }
    }

    return me;
}

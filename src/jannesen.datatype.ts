/// <reference path="lib-ext.d.ts"/>
/// <reference path="../js/alameda.d.ts" />
import * as $J   from "jc3/jannesen";
import * as $JA  from "jc3/jannesen.async";
import * as $JD  from "jc3/jannesen.dom";
import * as $JR  from "jc3/jannesen.regional";
import * as $JL  from "jc3/jannesen.language";
import * as $JI  from "jc3/jannesen.input";

var rounderror = 100.5 - (1.005 * 100);
var emptyOpts  = {};
const regexDateTime = new RegExp("^(" + regexToString($JR.regexDate) + ") *[ .] *(" + regexToString($JR.regexTime) + ")$");

//===================================== Enums =====================================================
/**
 *!!DOC
 */
export const enum ChangeReason
{
    Parse       =  0,
    Assign      =  1,
    UI          = 10,
    _linked     = 100      // Internal value
}

/**
 *!!DOC
 */
export const enum TimeFactor
{
    Ms      = 1,
    Sec     = 1000,
    Min     = 60000,
    Hour    = 3600000,
    Day     = 86400000
}

/**
 *!!DOC
 */
export const enum SelectDatasourceFlags
{
    StaticEnum      = 0x0001,       // Static enum
    SearchFetch     = 0x0010,       // backend FetchData supports search argument.
    SearchAll       = 0x0020,       // backend FetchData supports returns all record (no search argument).
    CacheFetch      = 0x0040,       // Cache de fetchdata
    Loaded          = 0x1000,       // Datasource is loaded
}

/**
 *!!DOC
 */
export const enum SelectDatasourceCallStatus
{
    Created     =  0,
    Busy        =  1,
    Error       =  9,
    Done        = 10
}

/**
 *!!DOC
 */
export type ScalarType = number|string|boolean|null;
export type SelectValue = number|string;

/**
 *!!DOC
 */
export type RecordSet<TRec extends IFieldDef> = Set<Record<TRec>>;

/**
 * Assign type
 */
type NativeTypeOf      <T extends SimpleType<any>> = T extends SimpleType<infer V> ? V : unknown;
type AssignSympleType  <T extends SimpleType<any>> = T|NativeTypeOf<T>|null;
type AssignRecord      <T extends Record<any>>     = T extends Record<infer V> ? AssignRecordMapper<V> : unknown;
type AssignRecordMapper<T extends IFieldDef>       = { [K in keyof T]?: AssignType<InstanceType<T[K]>> };
type AssignSet         <T extends Set<any>>        = T extends Set<infer V> ? T|V[]|null : unknown;

export type AssignType <T> = T extends SimpleType<any> ? AssignSympleType<T>
                           : T extends Record<any> ? AssignRecord<T>
                           : T extends Set<any> ? AssignSet<T>
                           : unknown;

//===================================== Interfaces ================================================
/**
 * !!DOC
 */
export interface ITimeZone
{
    /**
     * !!DOC
     */
    Name:           string;
    /**
     * !!DOC
     */
    UtcToLocal<T extends number|null|undefined>   (n: T): T;
    /**
     * !!DOC
     */
    LocalToUtc<T extends number|null|undefined>   (n: T): T;
}

/**
 *!!DOC
 */
export interface ISelectRecord
{
}

/**
 *!!DOC
 */
export interface IBaseConstructor<TValue, TAttr>
{
    Name:           string;
    Attributes:     TAttr;
    NativeType?:    string;
    ItemDef?:       IBaseConstructor<BaseType, TAttr>;
    FieldDef?:      IFieldDef;
    new():          TValue;
}

/**
 * !!DOC
 */
export interface IControlBase
{
                focus(): void;
}

export interface IControl<T> extends IControlBase
{
    readonly    value: T|undefined;
    readonly    isVisible: boolean;
                disabled: boolean;
                linkValue(value: T|undefined): void;
                valueChanged(reason:ChangeReason, changed:boolean): void;
                attrChanged(attrName: string): void;
                preValidate(): $JA.Task<unknown>|null;
                setError(message: string|null): void;
}

export interface IBaseControl extends IControl<BaseType<IBaseControl>>
{
}
/**
 * !!DOC
 */
export interface IControlContainer<T extends BaseType<IBaseControl>> extends IControl<T>, $JD.IDOMContainer
{
}

//===================================== ValidateErrors ============================================
/**
 *!!DOC
 */
export interface IValidateOptions
{
    seterror?:      boolean;
    partial?:       $JD.DOMHTMLElement;
}

/**
 *!!DOC
 */
export interface IValidateOptionsAsync extends IValidateOptions
{
    context:        $JA.Context|null;
    preValidates?:  (context:$JA.Context|null) => ($JA.Task<unknown>|Error|null)[]|null;
}

export const enum ValidateResult
{
    OK      = 0,
    Partial = 1,
    Error   = -1
}

export type ValidateValueResult = null|string|Error;

export interface IValidateErrorErrors
{
    error:      string | Error;
    value?:     BaseType;
    control?:   IControlBase;
    path?:      string;
}

export class ValidateErrors extends __Error
{
    private     _errors:    IValidateErrorErrors[];

    public get  errors()
    {
        return this._errors;
    }

                constructor(error?:string|Error, value?:BaseType, control?:IControlBase, path?:string)
    {
        super("ValidateErrors");
        this.message = "Empty ValidateErrors";
        this._errors = [];

        if (error) {
            this.addError(error, value, control, path);
        }
    }

    public      addError(error:string|Error, value?:BaseType, control?:IControlBase, path?:string): void
    {
        if (control === undefined && value) {
            control = value.boundControl;
        }

        if (error instanceof ValidateErrors) {
            for (const e of error._errors) {
                this.addError(e.error, e.value, e.control, e.path);
            }
        }
        else {
            this.message = (this._errors.length > 0) ? this.message + "\n" + stringErrorToMessage(error) : stringErrorToMessage(error);
            this._errors.push({ error, value, control, path });
        }
    }
    public      getFirstControl()
    {
        return (this._errors.length > 0) ? this._errors[0].control : null;
    }
    /**
     * Set focus to first error control is posible
     */
    public      setFocusOnError()
    {
        const ctl = this.getFirstControl();

        if (ctl) {
            ctl.focus();
            return true;
        }

        return false;
    }
    public      toMessageString()
    {
        let rtn:string = '';

        for (let e of this._errors) {
            let s = e.path  ? '[ValidateErrors][' + e.path +']: ' + stringErrorToMessage(e.error) : stringErrorToMessage(e.error);
            rtn = rtn.length > 0 ? rtn + '\n' + s : s;
        }

        return rtn;
    }
}

export class ValueError extends __Error
{
    public      value:     BaseType;
    public      control:   IControlBase|undefined;

                constructor(value:BaseType, control:IControlBase|undefined, innerError:Error)
    {
        super("ValueError", "Value error");
        this.value       = value;
        this.control     = control;
        this.innerError  = innerError;
    }
}

export interface IValidatable
{
    preValidateAsync?:                   (context:$JA.Context|null)=>($JA.Task<unknown>|Error)[]|$JA.Task<unknown>|Error|null;
    validateNow(opts:IValidateOptions):  ValidateResult|Error;
}

export function validateAsync(opts:IValidateOptionsAsync, ...validatables:(IValidatable|null|undefined)[]): $JA.Task<ValidateResult>
{
    return new $JA.Task((resolved:(result:ValidateResult)=>void, reject:(err:Error)=>void, oncancel:(handler:(reason:Error)=>void)=>void) => {
               const errors = new ValidateErrors();
               let runningTasks:number;

               oncancel((reason) => {
                               runningTasks = -1;
                               reject(reason);
                           });

               waitTasks();

               function waitTasks() {
                   let waitTasks = [] as $JA.Task<unknown>[];

                   try {
                       if (typeof opts.preValidates === 'function') {
                           addPreValidate(opts.preValidates(opts.context));
                       }

                       for (const v of validatables) {
                           if (v instanceof Object && typeof v.preValidateAsync === 'function') {
                               addPreValidate(v.preValidateAsync(opts.context));
                               if (errors.errors.length > 0 || waitTasks.length > 0) {
                                   break;
                               }
                           }
                       }
                   }
                   catch (e) {
                       reject(e);
                       return;
                   }

                   if (errors.errors.length > 0) {
                       reject(errors);
                   }
                   else if ((runningTasks = waitTasks.length) > 0) {
                       for (let r of waitTasks) {
                           r.then(() => {
                                      taskDone();
                                  },
                                  (e) => {
                                      errors.addError(e);
                                      taskDone();
                                });
                       }
                   }
                   else {
                       validate();
                   }

                   function addPreValidate(r:($JA.Task<unknown>|Error|null)[]|$JA.Task<unknown>|Error|null)
                   {
                        if (Array.isArray(r)) {
                            r.forEach(addPreValidate);
                        }
                        else if (r instanceof $JA.Task) {
                            if (r.isPending) {
                                waitTasks.push(r);
                            }
                            else if (r.isRejected) {
                                errors.addError(r.reason);
                            }
                        }
                        else if (r instanceof Error) {
                            errors.addError(r);
                        }
                        else if (r !== null) {
                            errors.addError(new $J.InvalidStateError("argument error addPreValidate(r)."));
                        }
                   }
               }
               function taskDone() {
                   if (--runningTasks === 0) {
                       if (errors.errors.length > 0) {
                           reject(errors);
                       }
                       else {
                           waitTasks();
                       }
                   }
               }
               function validate() {
                    let result = ValidateResult.OK;
                    for (const v of validatables) {
                         if (v) {
                             try {
                                 const r = v.validateNow(opts);
                                 if (r instanceof Error) {
                                     errors.addError(r);
                                 }
                                 else {
                                     result = mergeValidateResult(result, r);
                                 }
                             }
                             catch (e) {
                                 errors.addError(e);
                             }
                         }
                    }

                    if (errors.errors.length > 0) {
                        reject(errors);
                    }
                    else {
                        resolved(result);
                    }
               }
           }, opts.context);
}

//===================================== BaseType ==================================================
/**
 *!!DOC
 */
export interface IBaseTypeAttributes
{
    uiClass?:               string;
    null_response_error?:   boolean;
}

/**
 *!!DOC
 */
export abstract class BaseType<TControl extends IBaseControl=IBaseControl> implements IValidatable, $J.EventHandling, $JD.IToDom, $J.IUrlValue
{
    public static   Name = "BaseType";
    public static   Attributes:IBaseTypeAttributes = {};

    protected   _control:       TControl|undefined;
    protected   _attributes:    ({ [ key:string]: any; } | undefined);
    protected   _uniqueid:      string|undefined;

    /**
     *!!DOC
     */
    constructor()
    {
        this._initialize();
    }

    // #region mixin $J.EventHandling
    public _eventHandlers:      $J.IEventHandlerCollection|undefined;
    public bind(eventName:string,    handler:(ev:any)=>void, thisArg?:any): void   { throw new $J.InvalidStateError("Mixin not applied."); }
    public unbind(eventName:string, handler:(ev?:any)=>void, thisArg?:any): void          { throw new $J.InvalidStateError("Mixin not applied."); }
    public trigger(eventName:string, data: any): void                                      { throw new $J.InvalidStateError("Mixin not applied."); }
    // #endregion

    /**
     * Return if input-control is bound.
     */
    public get hasControl() {
        return this._control instanceof Object;
    }
    /**
     * Get bound input-control. Throw error is no control is linked
     */
    public get control() {
        if (!this._control) {
            throw new $J.InvalidStateError("Not control defined.");

        }
        return this._control;
    }
    /**
     * Get bound input-control. if no control is bound return undefined.
     */
    public get boundControl() {
        return this._control;
    }

    /**
     *!!DOC
     */
    public get value():any {
        throw new $J.NotImplentedError("$JT.BaseType.get_value");
    }
    /**
     *!!DOC
     */
    public set value(v:any) {
        throw new $J.NotImplentedError("$JT.BaseType.set_value");
    }

    /**
     *!!DOC
     */
    public get hasValue():boolean {
        throw new $J.NotImplentedError("$JT.BaseType.get_hasValue");
    }

    /**
     *!!DOC
     */
    public get uniqueid():string {
        if (!this._uniqueid)
            this._uniqueid = "_jid_" + $J.uniqueid();

        return this._uniqueid;
    }

    /**
     *!!DOC
     */
    public assign(r:unknown):void {
        throw new $J.NotImplentedError("$JT.BaseType.assign");
    }

    /**
     *!!DOC
     */
    public clone(): this
    {
        let c = new (this.constructor as any)();

        if (this._attributes !== undefined) c._attributes = this._attributes;
        if (this._uniqueid   !== undefined) c._uniqueid   = this._uniqueid;

        return c;
    }

    /**
     * Returns all busy tasks before the data can be validated
     */
    public preValidateAsync(context:$JA.Context|null)
    {
        let rtn = [] as ($JA.Task<unknown>|Error)[];

        this.validateTreeWalker((item, path, result) => {
                                    if (result === ValidateResult.OK) {
                                        try {
                                            if (item._control && item._control.preValidate) {
                                                if (addTask(item, path, item._control.preValidate())) {
                                                    return ValidateResult.Error;
                                                }
                                            }

                                            if (item instanceof Record) {
                                                if (item._validators) {
                                                    for (const v of item._validators) {
                                                        addTask(item, path, v.preValidateAsync(context));
                                                    }
                                                }
                                            }
                                        }
                                        catch(err) {
                                            addTask(item, path, err);
                                            return ValidateResult.Error;
                                        }
                                    }

                                    return result;
                                }, '$');

        return rtn;

        function addTask(item:BaseType, path:string, tr:$JA.Task<unknown>|Error|null|($JA.Task<unknown>|Error)[]) {
            if (tr instanceof $JA.Task) {
                if (tr.isPending) {
                    rtn.push(tr.catch((err) => $JA.Task.reject(new ValidateErrors(err, item, item._control, path))));
                    return false;
                }
                else if (tr.isRejected) {
                    rtn.push(new ValidateErrors(tr.reason, item, item._control, path));
                    return true;
                }

                return false;
            }
            if (tr instanceof Error) {
                if (item._control) {
                    item._control.setError(stringErrorToMessage(tr));
                }

                rtn.push(new ValidateErrors(tr, item, item._control, path));
                return true;
            }

            if (Array.isArray(tr)) {
                for (const t of tr) {
                    if (addTask(item, path, t)) {
                        return true;
                    }
                }
            }

            return false;
        }
    }

    /**
     * Validate the data. It is up to the developer to make sure the data is stable (no active async tasks),
     */
    public validateNow(opts:IValidateOptions)
    {
        let errors:ValidateErrors|undefined;
        let rtn = this.validateTreeWalker((item, path, result) => {
                                                let err:ValidateValueResult = null;

                                                if (result === ValidateResult.OK) {
                                                    try {
                                                        err = item.validateValue();
                                                    }
                                                    catch(e) {
                                                        err = e;
                                                    }
                                                }

                                                if (opts.seterror !== false && item._control) {
                                                    item._control.setError(stringErrorToMessage(err));
                                                }

                                                if (err) {
                                                    result = addError(item, path, err);
                                                }

                                                if (result === ValidateResult.OK && item instanceof Record) {
                                                    if (item._validators) {
                                                        for(const v of item._validators) {
                                                            const x = v.validateNow(opts);
                                                            if (x instanceof Error) {
                                                                result = addError(item, path, x);
                                                            }
                                                        }
                                                    }
                                                }

                                                return result;
                                            }, '$');
        return errors ? errors : rtn;

        function addError(item:BaseType, path:string, err:string|Error) {
            if (!errors) {
                errors = new ValidateErrors();
            }

            errors.addError(err, item, (opts.seterror !== false ? item._control : undefined), path);
            return ValidateResult.Error;
        }
    }

    /**
     * Validate data.
     * Before validate wait until al input are ready.
     */
    public validateAsync(opts:IValidateOptionsAsync): $JA.Task<ValidateResult> {
        return validateAsync(opts, this);
    }

    /**
     *!!DOC
     */
    public getAttr(name:string):any {
        if (this._attributes instanceof Object) {
            var r = this._attributes[name];
            if (r !== undefined)
                return r;
        }

        return (this.constructor as any).Attributes[name];
    }

    /**
     *!!DOC
     */
    public setAttr(name:string, value:any):this {
        if (this._attributes === undefined)
            this._attributes = {};

        this._attributes[name] = value;

        if (this._control) {
            this._control.attrChanged(name);
        }

        return this;
    }

    /**
     *!!DOC
     */
    protected _initialize():void {
        throw new $J.NotImplentedError("$JT.BaseType._initialize");
    }

    /**
     *!!DOC
     */
    public toDom(format?:string):$JD.AddNode {
        return this.toText(format);
    }

    /**
     *!!DOC
     */
    public toText(format?:string):string {
        throw new $J.NotImplentedError("$JT.BaseType.toText");
    }

    /**
     *!!DOC
     */
    public getControl(opt?:$JI.IControlOptions):IControlContainer<BaseType> {
        throw new $J.NotImplentedError("$JT.BaseType.getControl");
    }

    /**
     *!!DOC
     */
    public toInvariant():string|null {
        throw new $J.NotImplentedError("$JT.BaseType.toInvariant");
    }

    /**
     *!!DOC
     */
    public parseInvariant(s:string|null):void {
        throw new $J.NotImplentedError("$JT.BaseType.parseInvariant");
    }

    /**
     *!!DOC
     */
    public parseUrlValue(s:string|number|boolean|null|undefined|$J.IUrlValue):void {
        throw new $J.NotImplentedError("$JT.BaseType.parseUrlValue");
    }

    /**
     *!!DOC
     */
    public toUrlValue():string|null {
        return this.toInvariant();
    }

    /**
     *!!DOC
     */
    public toJSON():$J.JsonValue {
        throw new $J.NotImplentedError("$JT.BaseType.toJSON");
    }

    /**
     *!!DOC
     */
    public parseJSON(v:$J.JsonValue):void {
        throw new $J.NotImplentedError("$JT.BaseType.parseJSON");
    }

    /**
     *!!DOC
     */
    public abstract setDefault():void;

    /**
     *!!DOC
     */
    public sortCompare(other:this)
    {
        return 0;
    }

    /**
     *!!DOC
     */
    public setError(msg?:string): boolean {
        if (this._control && typeof this._control.setError === "function") {
            this._control.setError(msg || null);
            return true;
        }

        return false;
    }

    public setErrorAndReturnValidateError(msg:string|Error):ValidateErrors
    {
        return new ValidateErrors(msg, this, this.setError(stringErrorToMessage(msg)) ? this._control : undefined);
    }
    /**
     *!!DOC
     */
    public get UIClass(): string|undefined {
        return this.getAttr("uiClass");
    }

    /**
     *!!DOC
     */
    public toString(): string {
        return JSON.stringify(this.toJSON());
    }

    /**
     *!!DOC
     */
    public unlinkControl(ctl:IBaseControl) {
        if (this._control === ctl) {
            this._control.linkValue(undefined);
            this._control = undefined;
        }
    }

    /**
     *!!DOC
     */
    public validateValue(): ValidateValueResult {
        return null;
    }

    /**
     *!!DOC
     */
    /*@internal*/ validateTreeWalker(cb:(item:BaseType, path:string, childResult:ValidateResult)=>ValidateResult, path:string): ValidateResult {
        return cb(this, path, ValidateResult.OK);
    }

    /**
     *!!DOC
     */
    protected getinputcontrol<T extends IControl<BaseType>, TOpts>(modulename: string, classname: string, opts:TOpts|undefined):T {
        return this.linkControl<T>(new (getModuleClass(modulename, classname))(this, (opts instanceof Object ? opts : emptyOpts as TOpts)));
    }

    public  linkControl<TControl extends IControl<BaseType>>(ctl:TControl):TControl {
        if (this._control) {
            this._control.linkValue(undefined);
            this._control = undefined;
        }

        if (ctl) {
            (this._control = ctl as any).linkValue(this); //!!TODO
        }

        return ctl;
    }
}
$J.applyMixins(BaseType, [$J.EventHandling]);

//===================================== SimpleType ================================================
/**
 *!!DOC
 */
export interface ISimpleTypeAttributes<TNative> extends IBaseTypeAttributes
{
    required?:      boolean;
    default?:       TNative;
    placeholder?:   string;
}

/**
 *!!DOC
 */
export abstract class SimpleType<TNative,TControl extends IBaseControl=IBaseControl> extends BaseType<TControl>
{
    public static   Name        = "SimpleType";
    public static   Attributes  = $J.extend<ISimpleTypeAttributes<any>>({ }, BaseType.Attributes);

    protected       _value!:    TNative|null;

    /**
     *!!DOC
     */
    public static castFrom(v:any) {
        var x = new (this as any)();
        x.setValue(x.convertAnyToValue(v), ChangeReason.Parse);
        return x;
    }

    /**
     *!!DOC
     */
    protected   _initialize() {
        this._value = this.Default;
    }

    /**
     *!!DOC
     */
    public get internalvalue():TNative|null {
        return this._value;
    }

    /**
     *!!DOC
     */
    public get value():TNative|null {
        if (this._control && this._control.preValidate) {
            try {
                const r = this._control.preValidate();
                if (r) {
                    if (r.isPending) {
                        throw new $JA.BusyError("Input is busy.");
                    }
                    else if (r.isRejected) {
                        throw r.reason;
                    }
                }
            }
            catch (e) {
                throw new ValueError(this, this._control, e);
            }
        }

        return this._value;
    }
    public set value(v:TNative|null) {
        this.setValue(v, ChangeReason.Assign);
    }

    public bind(eventName:"changed", handler:(ev:ChangeReason)=>void, thisArg?:any): void;
    public bind(eventName: string, handler:(ev: ChangeReason) => void, thisArg?:any) {
        super.bind(eventName, handler, thisArg);
    }

    /**
     *!!DOC
     */
    public assign(v:TNative|SimpleType<TNative>|null|undefined) {
        this.setValue(v, ChangeReason.Assign);
    }

    /**
     *!!DOC
     */
    public clone(): this
    {
        let c = (super.clone() as this);

        c._value = this.value;

        return c;
    }

    /**
     * Return true if data has a value (not equal default).
     * If the data is bound to a input and the input is invalid then this functions returns false.
     */
    public get hasValue() {
        try {
            return this.value !== this.Default;
        }
        catch (e) {
            return false;
        }
    }

    /**
     *!!DOC
     */
    public toText(format?:string):string {
        let value = this.value;
        return value !== null ? this.cnvValueToText(value, format || this.getAttr("format")) : "";
    }

    /**
     *!!DOC
     */
    public toUrlValue(): string|null {
        let value = this._value;

        if (value === null) {
            return null;
        }

        if (value === this.Default) {
            return null;
        }

        return this.cnvValueToInvariant(value);
    }

    /**
     *!!DOC
     */
    public toInvariant() {
        let value = this.value;
        return value !== null ? this.cnvValueToInvariant(value) : null;
    }

    /**
     *!!DOC
     */
    public parseInvariant(v:string):void {
        this.setValue(this.cnvInvariantToValue(v), ChangeReason.Parse);
    }

    /**
     *!!DOC
     */
    public toJSON():$J.JsonValue {
        return this.toInvariant();
    }

    /**
     *!!DOC
     */
    public parseJSON(vjson:$J.JsonValue):void {
        this.setValue(this.cnvJSONToValue(vjson), ChangeReason.Parse);
    }

    /**
     *!!DOC
     */
    public parseUrlValue(s:string|number|boolean|null|undefined|$J.IUrlValue):void {
        if (s instanceof Object && $J.isIUrlValue(s)) {
            s = s.toUrlValue();
        }

        switch (typeof s) {
        case 'undefined':
            this.setValue(this.Default, ChangeReason.Parse);
            return;

        case 'string':
            this.setValue(this.cnvInvariantToValue(s), ChangeReason.Parse);
            return;
        }

        this.setValue(this.convertAnyToValue(s), ChangeReason.Parse);
    }


    /**
     *!!DOC
     */
    public getOutput(format?:string) {
        const self = this;
        const span = $JD.createElement('span');
        changed();
        self.bind('changed', changed);
        span.bind('RemovedFromDocument', () => { self.unbind('changed', changed ); });
        return span;

        function changed() {
            let c = self.toDom(format);
            if (c === '') { c = '\xA0'; }
            span.empty().appendChild(c);
        }
    }


    /**
     *!!DOC
     */
    public setDefault():void {
        if (this._value === null) {
            this.setValue(this.Default, ChangeReason.Parse);
        }
    }

    /**
     * Return the value of the data.
     * If the data is bound to a input and the input is invalid then this function return undefined.
     */
    public getValue():TNative|null|undefined;
    public getValue(errValue:null):TNative|null;
    public getValue(errValue:TNative):TNative|null;
    public getValue(errValue?:TNative|null)
    {
        try {
            return this.value;
        }
        catch (e) {
            return errValue;
        }
    }
    /**
     *!!DOC
     */
    public setValue(value:TNative|SimpleType<TNative>|null|undefined, reason:ChangeReason): void {
        if (value instanceof SimpleType) {
            value = value.value;
        }

        if (value === undefined) {
            value = null;
        }
        else if (value !== null && typeof value !== (this.constructor as any).NativeType) {
            throw new $J.InvalidStateError("setValue invalid value type got '" + (typeof value) + "' expect '" + (this.constructor as any).NativeType + "'.");
        }

        if (this._value !== value) {
            value = this._normalizeValue(value);
        }

        if (this._value !== value || reason === ChangeReason.UI) {
            this._value = value;

            if (this._control)
                this._control.valueChanged(reason, true);

            if (this._eventHandlers)
                this.trigger("changed", reason);
        } else {
            if (this._control)
                this._control.valueChanged(reason, false);
        }
    }

    /**
     *!!DOC
     */
    public sortCompare(other:this)
    {
        if (this._value === null) {
            return other._value === null ? 0 : 1;
        }
        else if (other._value === null) {
            return -1;
        }

        if (this._value < other._value)
            return -1;
        if (this._value > other._value)
            return 1;
        return 0;
    }

    /**
     *!!DOC
     */
    public convertAnyToValue(v:any):TNative|null {
        if (v === undefined || v === null)
            return null;

        switch (typeof v) {
        case "string":
            return this.cnvInvariantToValue(<string>v);

        case "number":
            return this.cnvNumberToValue(<number>v);

        case "boolean":
            return this.cnvBooleanToValue(<boolean>v);

        case "object":
            if (v instanceof SimpleType && this.isTypeOf(v))
                return v.value;

            return this.cnvObjectToValue(<Object>v);

        default:
            throw new $J.ConversionError("No conversion from " + (typeof v) + ".");
        }
    }

    /**
     *!!DOC
     */
    public cnvValueToText(v:TNative, format?:string):string {
        throw new $J.NotImplentedError("$JT.SimpleType.cnvValueToText");
    }

    /**
     *!!DOC
     */
    public cnvTextToValue(s:string):TNative|null {
        throw new $J.NotImplentedError("$JT.SimpleType.cnvTextToValue");
    }

    /**
     *!!DOC
     */
    public cnvValueToInvariant(v:TNative):string {
        throw new $J.NotImplentedError("$JT.SimpleType.cnvValueToInvariant");
    }

    /**
     *!!DOC
     */
    public cnvInvariantToValue(s:string):TNative {
        throw new $J.NotImplentedError("$JT.SimpleType.cnvInvariantToValue");
    }

    /**
     *!!DOC
     */
    public cnvNumberToValue(v:number):TNative {
        throw new $J.ConversionError("No conversion available from number-to-value.");
    }

    /**
     *!!DOC
     */
    public cnvBooleanToValue(v:boolean):TNative {
        throw new $J.ConversionError("No conversion available from boolean-to-value.");
    }

    /**
     *!!DOC
     */
    public cnvObjectToValue(o:Object):TNative|null {
        if (typeof (o as any).toJSON === "function") {
            return this.cnvJSONToValue((o as any).toJSON());
        }

        throw new $J.ConversionError("No conversion available from object-to-value.");
    }

    /**
     *!!DOC
     */
    public cnvJSONToValue(vjson:$J.JsonValue):TNative|null {
        let v:any;

        if (vjson === undefined || vjson === null) {
            return null;
        }

        switch(typeof vjson) {
        case "string":  v = this.cnvInvariantToValue(vjson as string);        break;
        case "number":  v = this.cnvJSONnumberToValue(vjson as number);       break;
        case "boolean": v = this.cnvJSONbooleanToValue(vjson as boolean);     break;
        }

        if (v === undefined)
            throw new $J.ConversionError("Can\'t cnvJSONToValue '" + (typeof vjson) +"'.");

        return v;
    }

    /**
     *!!DOC
     */
    public cnvJSONnumberToValue(v:number):TNative|undefined {
        return undefined;
    }

    /**
     *!!DOC
     */
    public cnvJSONbooleanToValue(v:boolean):TNative|undefined {
        return undefined;
    }

    /*
     *!!DOC
     */
    protected _normalizeValue(v:TNative|null):TNative|null {
        return v;
    }

    /**
     *!!DOC
     */
    public get Required():boolean {
        return !!this.getAttr("required");
    }
    public set Required(v:boolean) {
        this.setAttr("required", !!v);
    }

    /**
     *!!DOC
     */
    public get Default():TNative|null {
        var d = this.getAttr("default");
        return (d !== undefined) ? d : null;
    }

    /**
     *!!DOC
     */
    public get Placeholder():string|undefined {
        return this.getAttr("placeholder");
    }

    public validateValue(): ValidateValueResult {
        if (this.Required && this._value === null)
            return $JL.input_required;

        return super.validateValue();
    }

    protected isTypeOf(o: any): boolean {
        throw new $J.NotImplentedError("isTypeOf not implemented");
    }

    public valueOf() {
        return this.value;
    }
}

//===================================== SimpleNumberType ==========================================
/**
 *!!DOC
 */
export interface ISimpleNumberTypeAttributes extends ISimpleTypeAttributes<number>
{
    minValue?:  number;
    maxValue?:  number;
}

/**
 *!!DOC
 */
export abstract class SimpleNumberType<TControl extends IBaseControl> extends SimpleType<number, TControl>
{
    public static   NativeType  = "number";

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

    public validateValue(): ValidateValueResult {
        let value = this._value;

        if (value !== null) {
            let minValue = this.MinValue;
            let maxValue = this.MaxValue;

            if (typeof minValue === 'number' && minValue > value)
                return $JL.valuetolow_message;

            if (typeof maxValue === 'number' && maxValue < value)
                return $JL.valuetohigh_message;
        }

        return super.validateValue();
    }
}

//===================================== Integer ===================================================
/**
 *!!DOC
 */
export interface IIntegerAttributes extends ISimpleNumberTypeAttributes
{
}

/**
 *!!DOC
 */
export class Integer extends SimpleNumberType<$JI.Integer>
{
    public static   Name        = "Integer";
    public static   Attributes  = $J.extend<IIntegerAttributes>({ }, SimpleType.Attributes);
    public static   subClass(attr:IIntegerAttributes): typeof Integer {
        return subClassHelper(Integer, attr);
    }

    public getControl(opts?:$JI.IIntegerControlOptions):$JI.Integer {
        return this.getinputcontrol<$JI.Integer, $JI.IIntegerControlOptions>("jc3/jannesen.input", "Integer", opts);
    }

    public toJSON(): $J.JsonValue {
        return this.value;
    }

    public cnvValueToText(value: number): string {
        return $JR.intToString(value);
    }

    public cnvTextToValue(text: string): number|null {
        return $JR.stringToInt(text);
    }

    public cnvValueToInvariant(value: number): string {
        return value.toString();
    }

    public cnvInvariantToValue(invariant: string): number {
        return $J.parseIntExact(invariant);
    }

    public cnvJSONnumberToValue(jsonNumber: number): number {
        return Math.round(jsonNumber);
    }

    public cnvNumberToValue(v: number): number {
        return v;
    }

    public cnvBooleanToValue(bool: boolean): number {
        return bool ? 1 : 0;
    }

    protected isTypeOf(o:any) {
        return o instanceof Integer;
    }
}

//===================================== Number ====================================================
/**
 *!!DOC
 */
export interface INumberAttributes extends ISimpleNumberTypeAttributes
{
    precision?: number;
    format?:    string;
}

/**
 *!!DOC
 */
export class Number extends SimpleNumberType<$JI.Number>
{
    public static   Name        = "Number";
    public static   Attributes  = $J.extend<INumberAttributes>({ precision:2 }, SimpleType.Attributes);
    public static   subClass(attr:INumberAttributes): typeof Number {
        return subClassHelper(Number, attr);
    }

    public getControl(opts?:$JI.INumberControlOptions):$JI.Number {
        return this.getinputcontrol<$JI.Number, $JI.INumberControlOptions>("jc3/jannesen.input", "Number", opts);
    }

    public toJSON(): $J.JsonValue {
        return this.value;
    }

    public cnvValueToText(value: number, format?:string): string {
        if (!format) {
            if (this.Precision >= 0)
                format = "F" + this.Precision.toString();
        }
        return $JR.numberToString(value, format);
    }

    public cnvTextToValue(text: string): number|null {
        return $JR.stringToNumber(text);
    }

    public cnvValueToInvariant(value: number): string {
        return value.toString();
    }

    public cnvInvariantToValue(invariant: string): number {
        return $J.parseFloatExact(invariant);
    }

    public cnvJSONnumberToValue(jsonNumber: number): number {
        return jsonNumber;
    }

    public cnvNumberToValue(v: number): number {
        return v;
    }

    public cnvBooleanToValue(bool: boolean): number {
        return bool ? 1 : 0;
    }

    /**
     *!!DOC
     */
    public get Precision():number {
        const p = this.getAttr("precision");
        return (typeof p === 'number' && p >= 0) ? p : 2;
    }

    /**
     *!!DOC
     */
    public get Format():string|undefined {
        return this.getAttr("format");
    }
    public set Format(v:string|undefined) {
        this.setAttr("format", typeof v === "string" ? v : undefined);
    }

    protected _normalizeValue(v:number|null):number|null {
        if (v !== null) {
            var p = this.getAttr("precision");
            if (typeof p === 'number' && p >= 0 && p <= 10)      v = $J.round(v, p);
        }
        return v;
    }

    protected isTypeOf(o:any) {
        return o instanceof Number;
    }
}

//===================================== String ===================================================
/**
 *!!DOC
 */
export const enum StringOptions
{
    None                    = 0x0000,
    Password                = 0x0001,
    LowerCase               = 0x0002,
    UpperCase               = 0x0004,
    RemoveInvalidChars      = 0x0008,
    NoTrim                  = 0x0010
}
/**
 *!!DOC
 */
export interface IStringAttributes extends ISimpleTypeAttributes<string>
{
    minLength?: number;
    maxLength?: number;
    options?:   StringOptions;
    charset?:   RegExp;
    validator?: RegExp|((s:string)=>boolean);
}

/**
 *!!DOC
 */
export abstract class StringBase<TControl extends IBaseControl=IBaseControl> extends SimpleType<string, TControl>
{
    public toJSON(): $J.JsonValue {
        return this.value;
    }

    public cnvValueToText(value: string): string {
        return value;
    }

    public cnvTextToValue(text: string): string|null {
        let options = this.Options;

        if (!(options & StringOptions.NoTrim)) {
            text = text.trim();
        }
        if (text === "") {
            return null;
        }
        if (options & StringOptions.UpperCase) {
            text = text.toUpperCase();
        }
        if (options & StringOptions.LowerCase) {
            text = text.toLowerCase();
        }
        if (options & StringOptions.RemoveInvalidChars) {
            let charset = this.Charset;
            if (charset) {
                for (let i = 0 ; i < text.length ; ++i) {
                    if (!charset.test(text.charAt(i))) {
                        text = text.substring(0, i) + text.substring(i + 1);
                        --i;
                    }
                }
            }
        }

        return text;
    }

    public cnvValueToInvariant(value: string): string {
        return value.toString();
    }

    public cnvInvariantToValue(invariant: string): string {
        return invariant;
    }

    public cnvJSONnumberToValue(jsonNumber: number): string {
        return jsonNumber.toString();
    }

    public cnvNumberToValue(v: number): string {
        return v.toString();
    }

    public cnvBooleanToValue(bool: boolean): string {
        return bool ? "1" : "0";
    }

    /**
     *!!DOC
     */
    public get MinLength():number|undefined {
        return this.getAttr("minLength");
    }

    /**
     *!!DOC
     */
    public get MaxLength():number|undefined {
        return this.getAttr("maxLength");
    }

    /**
     *!!DOC
     */
    public get Options():StringOptions {
        return this.getAttr("options") || StringOptions.None;
    }

    /**
     *!!DOC
     */
    public get Charset():RegExp|undefined {
        return this.getAttr("charset");
    }

    /**
     *!!DOC
     */
    public get Validator():RegExp|((s:string)=>boolean)|undefined {
        return this.getAttr("validator");
    }

    public validateValue(): ValidateValueResult {
        let value = this.value;

        if (value !== null) {
            const minLength = this.MinLength;
            if (typeof minLength === 'number' && minLength > value.length) {
                return $JL.text_to_short(minLength);
            }

            const maxLength = this.MaxLength;
            if (typeof maxLength === 'number' && maxLength < value.length) {
                return $JL.text_to_long(maxLength);
            }

            let validator = this.Validator;

            if (validator instanceof RegExp) {
                if (!(<RegExp>validator).test(value)) {
                    return $JL.input_invalid;
                }
            } else if (typeof validator === "function") {
                if (!validator(value)) {
                    return $JL.input_invalid;
                }
            }
        }

        return super.validateValue();
    }

    protected isTypeOf(o:any) {
        return o instanceof String;
    }
}

export class String extends StringBase<$JI.String> {
    public static   Name        = "String";
    public static   NativeType  = "string";
    public static   Attributes  = $J.extend<IStringAttributes>({ }, SimpleType.Attributes);
    public static   subClass(attr:IStringAttributes): typeof String {
        return subClassHelper(String, attr);
    }

    public getControl(opts?:$JI.IStringControlOptions):$JI.String {
        return this.getinputcontrol<$JI.String, $JI.IStringControlOptions>("jc3/jannesen.input", "String", opts);
    }
}

export class StringMultiLine extends StringBase<$JI.StringMultiLine> {
    public static   Name        = "StringMultiLine";
    public static   NativeType  = "string";
    public static   Attributes  = $J.extend<IStringAttributes>({ }, SimpleType.Attributes);
    public static   subClass(attr:IStringAttributes): typeof StringMultiLine {
        return subClassHelper(StringMultiLine, attr);
    }

    public getControl(opts?:$JI.IStringMultiLineControlOptions):$JI.StringMultiLine {
        return this.getinputcontrol<$JI.StringMultiLine, $JI.IStringMultiLineControlOptions>("jc3/jannesen.input", "StringMultiLine", opts);
    }

    public toDom(format?:string):$JD.AddNode {
        return $JD.multilineStringToContent(this.value);
    }
}

//===================================== Boolean ===================================================
/**
 *!!DOC
 */
export interface IBooleanAttributes extends ISimpleTypeAttributes<boolean>
{
    tristate?: boolean;
}

/**
 *!!DOC
 */
export class Boolean extends SimpleType<boolean, $JI.Boolean>
{
    public static   Name        = "Boolean";
    public static   NativeType  = "boolean";
    public static   Attributes  = $J.extend<IBooleanAttributes>({ tristate:true }, SimpleType.Attributes);
    public static   subClass(attr:IBooleanAttributes): typeof Boolean {
        return subClassHelper(Boolean, attr);
    }

    public toDom(format?: string): $JD.AddNode {
        switch (format) {
        case "check": {
                return (this._value === true) ?  "\u2714" :
                       (this._value === false) ? "" :
                                                 "\u2205";
            }
            break;
        default:        return super.toDom();
        }
    }
    /**
     *!!DOC
     */
    public toJSON(): $J.JsonValue {
        return this.value;
    }

    public getControl(opts?:$JI.IBooleanControlOptions):$JI.Boolean {
        return this.getinputcontrol<$JI.Boolean, $JI.IBooleanControlOptions>("jc3/jannesen.input", "Boolean", opts);
    }

    public cnvJSONnumberToValue(v:number): boolean {
        return v!==0;
    }

    public cnvJSONbooleanToValue(v:boolean): boolean {
        return v;
    }

    public cnvInvariantToValue(s:string): boolean {
        switch(s) {
        case "0":       return false;
        case "1":       return true;
        case "n":       return false;
        case "y":       return true;
        case "no":      return false;
        case "yes":     return true;
        case "false":   return false;
        case "true":    return true;
        default:        throw new $J.ConversionError("Unknown boolean invariant-value '" + s + "'.");
        }
    }

    public cnvValueToInvariant(v:boolean): string {
        return v ? "1" : "0";
    }

    public cnvValueToText(val: boolean, format?: string): string {
        return $JR.booleanToString(val);
    }

    public cnvTextToValue(val: string): boolean|null {
        return $JR.stringToBoolean(val);
    }

    public cnvBooleanToValue(val:boolean): boolean {
        return val;
    }

    public get Tristate(): boolean {
        return !!this.getAttr("tristate");
    }
    public set Tristate(v: boolean) {
        this.setAttr("tristate",v);
    }

    protected _normalizeValue(v:boolean|null):boolean|null {
        if (v === null) {
            if (!this.Tristate) {
                v = !!this.Default;
            }
        }
        return v;
    }

    protected isTypeOf(o:any) {
        return o instanceof Boolean;
    }
}

//===================================== Date ======================================================
/**
 *!!DOC
 */
export interface IDateAttributes extends ISimpleNumberTypeAttributes
{
    format?:string;
}

/**
 *!!DOC
 */
export class Date extends SimpleNumberType<$JI.Date>
{
    public static   Name        = "Date";
    public static   Attributes  = $J.extend<IDateAttributes>({ }, SimpleType.Attributes);
    public static   subClass(attr:IDateAttributes): typeof Date {
        return subClassHelper(Date, attr);
    }

    public getControl(opts?:$JI.IDateControlOptions):$JI.Date {
        return this.getinputcontrol<$JI.Date, $JI.IDateControlOptions>("jc3/jannesen.input", "Date", opts);
    }

    public cnvValueToText(value: number): string {
        const format = this.Format;

        if (typeof format === "string" && format !== "") {
            let date = new $global.Date(value * (24 * 60 * 60 * 1000));
            let rtn  = "";
            let p    = 0;

            while (p < format.length) {
                let c = format.substr(p, 1);
                let n = 0;

                while (p < format.length && format[p] === c) { ++n; ++p; }

                switch (c) {
                case "d":
                    switch (n) {
                        case 2:  rtn += $JL.dayNamesShort[date.getUTCDay()]; break;
                        case 3:  rtn += $JL.dayNames[date.getUTCDay()];      break;
                        default: rtn += $JL.dayNamesMin[date.getUTCDay()];   break;
                    }
                    break;

                case "D": rtn += $J.intToA(date.getUTCDate(), n); break;

                case "M":
                    switch (n) {
                        case 3:  rtn += $JL.monthNamesShort[date.getUTCMonth()]; break;
                        case 4:  rtn += $JL.monthNames[date.getUTCMonth()];      break;
                        default: rtn += $J.intToA(date.getUTCMonth() + 1, n);    break;
                    }
                    break;

                case "Y": rtn += $J.intToA(date.getUTCFullYear(), n); break;
                case "\\":
                    rtn += format.substr(p + 1, 1);
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
            return $JR.dateToString(value);
        }
    }

    public cnvTextToValue(text: string): number|null {
        return $JR.stringToDate(text);
    }

    public cnvValueToInvariant(value: number): string {
        return $J.dateToString(value);
    }

    public cnvInvariantToValue(invariant: string): number {
        return $J.parseDate(invariant);
    }

    public cnvJSONnumberToValue(jsonNumber: number): number {
        return jsonNumber;
    }

    public cnvNumberToValue(v: number): number {
        return v;
    }

    public cnvObjectToValue(obj: Object): number|null {
        if (obj instanceof DateTime) {
            return $J.dateFromDatetime((obj as DateTime).valueToUI((<DateTime>obj).value));
        }

        if (obj instanceof Date) {
            return $J.dateFromDatetime(<any>obj);
        }

        return super.cnvObjectToValue(obj);
    }

    /**
     *!!DOC
     */
    public get Format():string|undefined {
        return this.getAttr("format");
    }
    public set Format(v:string|undefined) {
        this.setAttr("format", typeof v === "string" ? v : undefined);
    }

    protected _normalizeValue(v:number|null):number|null {
        if (v !== null) {
            v = Math.round(v);
        }
        return v;
    }

    protected isTypeOf(o:any) {
        return o instanceof Date;
    }
}

//===================================== DateTime ==================================================
/**
 *!!DOC
 */
export interface IDateTimeAttributes extends ISimpleNumberTypeAttributes
{
    format?:        string;
    displayUtc?:    boolean;
    timezone?:      ITimeZone;
}

/**
 *!!DOC
 */
export class DateTime extends SimpleNumberType<$JI.DateTime>
{
    public static   Name        = "DateTime";
    public static   Attributes  = $J.extend<IDateTimeAttributes>({ displayUtc:false, timezone:undefined }, SimpleType.Attributes);
    public static   subClass(attr:IDateTimeAttributes): typeof DateTime {
        return subClassHelper(DateTime, attr);
    }

    public getControl(opts?:$JI.IDateTimeControlOptions):$JI.DateTime {
        return this.getinputcontrol<$JI.DateTime, $JI.IDateTimeControlOptions>("jc3/jannesen.input", "DateTime", opts);
    }

    public cnvValueToText(value: number, format?: string): string {
        value = this.valueToUI(value);

        if (typeof format === "string" && format !== "") {
            let date = new $global.Date(value);

            var rtn:string = "";
            var p:number   = 0;
            var h:number   = 0;

            if (format.substr(0, 1) === "~") {
                ++p;

                if (date.getTime() % (24*60*60*1000) === 0) {
                    date = new $global.Date(date.getTime() - (24*60*60*1000));
                    h = 24;
                }
            }

            while (p < format.length) {
                var c = format.substr(p, 1);
                var n = 0;

                while (p < format.length && format[p] === c)
                    { ++n; ++p; }

                switch(c) {
                case "d":
                    switch(n) {
                    case 2:     rtn += $JL.dayNamesShort[date.getUTCDay()];        break;
                    case 3:     rtn += $JL.dayNames[date.getUTCDay()];             break;
                    default:    rtn += $JL.dayNamesMin[date.getUTCDay()];          break;
                    }
                    break;

                case "D":   rtn += $J.intToA(date.getUTCDate(), n);                break;

                case "M":
                    switch(n) {
                    case 3:     rtn += $JL.monthNamesShort[date.getUTCMonth()];    break;
                    case 4:     rtn += $JL.monthNames[date.getUTCMonth()];         break;
                    default:    rtn += $J.intToA(date.getUTCMonth() + 1, n);       break;
                    }
                    break;

                case "Y":   rtn += $J.intToA(date.getUTCFullYear() , n);           break;
                case "h":   rtn += $J.intToA(date.getUTCHours() + h, n);           break;
                case "m":   rtn += $J.intToA(date.getUTCMinutes()  , n);           break;
                case "s":   rtn += $J.intToA(date.getUTCSeconds()  , n);           break;
                case "f":
                    switch(n) {
                    case 1:     rtn += $J.intToA($J.round(date.getUTCMilliseconds() / 100, 0), 1);  break;
                    case 2:     rtn += $J.intToA($J.round(date.getUTCMilliseconds()  / 10, 0), 2);  break;
                    default:    rtn += $J.intToA(date.getUTCMilliseconds()                   , 3);  break;
                    }
                    break;

                case "\\":
                    rtn += format.substr(p + 1, 1);
                    n = 2;
                    break;

                default:
                    rtn += c.repeat(n);
                    break;
                }
            }
            return rtn;
        }

        {
            const n = $J.divModulo(value, 86400000);
            return $JR.dateToString(n.result) + " " + $JR.timeToString(n.remainder, $J.TimeFormat.HMS);
        }
    }

    public cnvTextToValue(text: string): number {
        const m = regexDateTime.exec(text);

        if (m && typeof m[1] === 'string' && typeof m[2] === 'string') {
            return this.uiToValue($JR.stringToDate(m[1]) * 86400000 + $JR.stringToTime(m[2], $J.TimeFormat.HMS));
        }

        throw new $J.FormatError($JL.invalid_datetime);
    }

    public cnvValueToInvariant(val: number): string {
        return $J.datetimeToString(val);
    }

    public cnvInvariantToValue(invariant: string) {
        return $J.parseDatetimeNumber(invariant);
    }

    public cnvNumberToValue(v:number)
    {
        return v;
    }

    /**
     *!!DOC
     */
    public get Format(): string|undefined {
        return this.getAttr("format");
    }
    public set Format(v: string|undefined) {
        this.setAttr("format", typeof v === "string" ? v : undefined);
    }

    /**
     *!!DOC
     */
    public get DisplayUtc(): boolean {
        return !!this.getAttr("displayUtc");
    }
    /**
     *!!DOC
     */
    public get TimeZone(): ITimeZone|undefined {
        return this.getAttr("timezone");
    }
    public get ValueIsUtc() {
        return (this.TimeZone || this.DisplayUtc) ? true : false;
    }
    /**
     *!!DOC
     */
    public Now(): number
    {
        let     d = (new $global.Date());
        return this.ValueIsUtc ? d.getTime() : d.getTime() - (d.getTimezoneOffset() * 60 * 1000);
    }
    /**
     * Return (local) date.
     */
    public toDateValue()
    {
        let value = this.value;

        if (typeof value === 'number') {
            const tz = this.TimeZone;
            if (tz) {
                value = tz.UtcToLocal(value);
            }

            value = $J.dateFromDatetime(value);
        }

        return value;
    }

    /* @internal */ valueToUI<T extends number|null>(v: T): T {
        const   tz = this.TimeZone;
        return tz ? tz.UtcToLocal(v) : v;
    }
    /* @internal */ uiToValue<T extends number|null>(v: T): T {
        const   tz = this.TimeZone;
        return tz ? tz.LocalToUtc(v) : v;
    }

    protected isTypeOf(o:any) {
        return o instanceof DateTime;
    }
}

//===================================== Time ======================================================
/**
 *!!DOC
 */
export interface ITimeAttributes extends ISimpleNumberTypeAttributes
{
    factor?:TimeFactor;
    precision?:number;
    format?:string;
    duration?:boolean;
}

/**
 *!!DOC
 */
export class Time extends SimpleNumberType<$JI.Time>
{
    public static   Name        = "Time";
    public static   NativeType  = "number";
    public static   Attributes  = $J.extend<ITimeAttributes>({ factor:TimeFactor.Sec, precision:0 }, SimpleType.Attributes);
    public static   subClass(attr:ITimeAttributes): typeof Time {
        return subClassHelper(Time, attr);
    }

    public get datavalue(): number|null {
        const v = this.value;
        return typeof v === 'number' ? $J.round(v / this.Factor + rounderror, this.Precision) : null;
    }

    public set datavalue(v: number|null) {
        this.value =  typeof v === 'number' ? Math.round($J.round(v, this.Precision) * this.Factor) : null;
    }

    public getControl(opts?:$JI.ITimeControlOptions):$JI.Time {
        return this.getinputcontrol<$JI.Time, $JI.ITimeControlOptions>("jc3/jannesen.input", "Time", opts);
    }

    public cnvValueToText(value: number, format?:string): string {
        let f = this.getTimeFormat(format);

        if (typeof f === "string") {
            return $JR.numberToString(value, format);
        }

        return $JR.timeToString(value, f);
    }

    public cnvTextToValue(text: string): number|null {
        text = text.trim();

        if (text.length === 0)
            return null;

        let f = this.getTimeFormat();

        if (typeof f === "string") {
            return Math.round($J.round($JR.stringToNumber(text), this.Precision) * this.Factor);
        }

        if (this.Duration && /^[0-9]+$/.test(text)) {
            return $JR.stringToInt(text) * this.Factor;
        }

        return $JR.stringToTime(text, f);
    }

    public cnvValueToInvariant(v: number): string {
        return (v / this.Factor).toFixed(this.Precision);
    }

    public cnvInvariantToValue(invariant: string): number {
        return $J.parseIntExact(invariant) * this.Factor;
    }

    public cnvJSONnumberToValue(v: number): number {
        return v * this.Factor;
    }

    public cnvNumberToValue(v: number): number {
        var p = Math.round(this.Factor / Math.pow(10, this.Precision));
        return Math.round(v / p) * p;
    }

    /**
     *!!DOC
     */
    public get Factor():TimeFactor {
        return this.getAttr("factor");
    }

    /**
     *!!DOC
     */
    public get Precision():number {
        return this.getAttr("precision");
    }

    /**
     *!!DOC
     */
    public get Duration():number {
        return this.getAttr("duration");
    }

    /**
     *!!DOC
     */
    public get Format():string|undefined {
        return this.getAttr("format");
    }
    public set Format(v:string|undefined) {
        this.setAttr("format", typeof v === "string" ? v : undefined);
    }

    /**
     *!!DOC
     */
    public getTimeFormat(format?: string): string|number {
        if (typeof format !== "string") {
            format = this.Format;
        }

        if (typeof format !== "string") {
            switch(this.Factor) {
            case TimeFactor.Hour:       return "F2";
            case TimeFactor.Min:        return $J.TimeFormat.HM;
            case TimeFactor.Sec:        return (this.Precision === 0 ? $J.TimeFormat.HMS : $J.TimeFormat.HMSF);
            default:                    return $J.TimeFormat.HMSF;
            }
        }

        if (/^F[0-9]$/.test(format)) return format;
        switch(format) {
        case "HM":
        case "HH:MM":
                return $J.TimeFormat.HM;
        case "HMS":
        case "HH:MM:SS":
                return $J.TimeFormat.HMS;
        case "HMSF":
        case "HH:MM:SS.FFF":
                return $J.TimeFormat.HMSF;
        case "MS":
        case "MM:SS":
                return $J.TimeFormat.MS;
        default:
            throw new $J.FormatError("Invalid timeformat '" + format + "'.");
        }
    }

    protected _normalizeValue(v:number|null):number|null {
        if (v !== null) {
            var p = Math.round(this.Factor / Math.pow(10, this.Precision));
            v = Math.round(v / p) * p;
        }

        return v;
    }

    protected isTypeOf(o:any) {
        return o instanceof Time;
    }
}

//===================================== Select ====================================================
/**
 *!!DOC
 */
export interface ISelectTypeAttributeDropdownColumn
{
    fieldname:      string;
    width?:         string;
}

/**
 *!!DOC
 */
export type TDatasource_Record<TDatasource extends SelectDatasource<SelectValue, ISelectRecord>> = TDatasource extends SelectDatasource<infer T1, infer T2> ? T2 : ISelectRecord;

/**
 *!!DOC
 */
export interface ISelectTypeAttributes<TNativeType extends SelectValue, TDatasource extends SelectDatasource<SelectValue, ISelectRecord>> extends ISimpleTypeAttributes<TNativeType>
{
    datasource:         TDatasource;
    displayfield?:      string|((rec:TDatasource_Record<TDatasource>,format:string)=>string);
    href?:              (key:TNativeType)=>string;
    dropdown_columns?:  ISelectTypeAttributeDropdownColumn[];
}

/**
 *!!DOC
 */
export abstract class SelectType<TNative extends SelectValue, TDatasource extends SelectDatasource<TNative,ISelectRecord>> extends SimpleType<TNative, $JI.ISelectInputControl<TNative, TDatasource>>
{
    public static   Name        = "SelectType";
    public static   Attributes  = $J.extend<ISelectTypeAttributes<SelectValue, SelectDatasource<SelectValue, ISelectRecord>>>({ displayfield:"text" } as any, SimpleType.Attributes);

    private _record?:TDatasource_Record<TDatasource>;

    /**
     *!!DOC
     */
    public toText(format?:string):string {
        const value = this.value;
        return this.toDisplayText(value, this.getrecordAsync(value, false), format);
    }

    /**
     *!!DOC
     */
    public toDom(format?:string):string|$JD.DOMHTMLElement|$JD.DOMText {
        const value = this.value;
        const rec   = this.getrecordAsync(value, true);
        let rtn:string|$JD.DOMHTMLElement|$JD.DOMText;

        if (rec instanceof $JA.Task) {
            const text = $JD.createText($JL.loading);
            rec.then((data) => {
                         if (this.internalvalue === value) {
                             text.text = this.toDisplayText(value, data, format);
                         }
                     },
                     (err) => {
                         if (this.internalvalue === value) {
                             text.text = this.toDisplayText(value, err);
                         }
                     });
            rtn = text;
        }
        else {
            rtn = this.toDisplayText(value, rec, format);
        }

        const href = (format !== 'text' && value) ? this.cnvHRef(value) : undefined;
        if (href) {
            rtn = $JD.createElement("a", { href: href }, rtn);
        }

        return rtn;
    }

    /**
     *!!DOC
     */
    public getControl(opt?:$JI.ISelectInputControlOptions<TNative,TDatasource>):$JI.ISelectInputControl<TNative, TDatasource> {
        return this.getControlInput(opt);
    }

    /**
     *!!DOC
     */
    public getControlInput(opts?:$JI.ISelectInputControlOptions<TNative,TDatasource>):$JI.SelectInput<TNative,TDatasource> {
        return this.getinputcontrol<$JI.SelectInput<TNative,TDatasource>, $JI.ISelectInputControlOptions<TNative,TDatasource>>("jc3/jannesen.input", "SelectInput", opts);
    }

    /**
     *!!DOC
     */
    public getControlRadio(opts?:$JI.ISelectRadioControlOptions):$JI.SelectRadio<TNative,TDatasource> {
        return this.getinputcontrol<$JI.SelectRadio<TNative,TDatasource>, $JI.ISelectRadioControlOptions>("jc3/jannesen.input", "SelectRadio", opts);
    }

    /**
     *!!DOC
     */
    public toJSON() {
        return this.value;
    }

    /**
     *!!DOC
     */
    public  parseJSON(vjson:$J.JsonValue):void {
        this.setValue(vjson as (TNative|TDatasource_Record<TDatasource>|null|undefined), ChangeReason.Parse);
    }

    /**
     *!!DOC
     */
    public  setValue(value:TNative|SimpleType<TNative>|SelectType<TNative, TDatasource>|TDatasource_Record<TDatasource>|null|undefined, reason:ChangeReason): void {
        if (value instanceof Object) {
            const datasource = this.Datasource;

            if (datasource instanceof RemoteSelectDatasource) {
                if (value instanceof SelectType) {
                    const setvalue = value;
                    if (datasource !== setvalue.Datasource) {
                        throw new $J.InvalidStateError("SelectType.setValue value has invalid datasource.");
                    }

                    value = setvalue.value;
                    this._record = setvalue._record;
                }
                else
                if (value instanceof BaseType) {
                    value = value.value;
                }
                else {
                    const key = (value as any)[datasource.keyfieldname] as TNative;

                    if (typeof key !== (this.constructor as any).NativeType) {
                        throw new $J.InvalidStateError("SelectType.setValue invalid object-value, key-type= '" + (typeof value) + "' expect '" + (this.constructor as any).NativeType + "'.");
                    }

                    this._record = value as any;
                    value = key;
                }
            }
            else {
                if (value instanceof SelectType) {
                    if (datasource !== value.Datasource) {
                        throw new $J.InvalidStateError("SelectType.setValue value has invalid datasource.");
                    }

                    value = value.value;
                }
                else {
                    const keyfieldname = datasource.keyfieldname;
                    if ((value as Object).hasOwnProperty(keyfieldname)) {
                        value = (value as ({readonly [key:string]:any}))[keyfieldname] as TNative;
                    }
                    else {
                        throw new $J.InvalidStateError("SelectType.setValue invalid value.");
                    }
                }
            }
        }

        super.setValue(value, reason);
    }

    /**
     *!!DOC
     */
    public  toDisplayText(key:TNative|null|undefined, rec:TDatasource_Record<TDatasource>|undefined|Error, format?:string) {
        try {
            if (rec instanceof Error) {
                return "[ERROR: " + rec.message + "]";
            }
            else if (rec instanceof Object) {
                let rtn:string|undefined;

                let displayfield = this.Displayfield;
                if (typeof displayfield === 'string') {
                    rtn = (rec as any)[displayfield as string];
                }
                if (typeof displayfield === 'function') {
                    rtn = displayfield(rec, format);
                }
                if (typeof rtn === "string") {
                    return rtn;
                }
            }

            if (key === null) {
                return "";
            }
            if (key === undefined) {
                return "[undefined]";
            }

            return "#" + key.toString();
        }
        catch (err) {
            return "[ERROR: " + err.message + "]";
        }
    }

    /**
     *!!DOC
     */
    public  cnvHRef(key:TNative):string|undefined {
        const h = this.HRef;

        return (typeof h === 'function') ? h(key) : undefined;
    }

    /**
     *!!DOC
     */
    public get Datasource():TDatasource {
        return this.getAttr("datasource");
    }

    /**
     *!!DOC
     */
    public set Datasource(value:TDatasource) {
        this.setAttr("datasource", value);
    }

    /**
     *!!DOC
     */
    public get Displayfield():string|((rec:TDatasource_Record<TDatasource>,format:string|undefined)=>string) {
        return this.getAttr("displayfield");
    }

    /**
     *!!DOC
     */
    public get HRef():(key:TNative)=>string|undefined {
        return this.getAttr("href");
    }

    /**
     *!!DOC
     */
    public  assign(value:TNative|SimpleType<TNative>|SelectType<TNative, TDatasource>|TDatasource_Record<TDatasource>|null|undefined):void {
        if (value instanceof Object) {
            this.setValue(value, ChangeReason.Assign);
        }
        else {
            super.assign(value);
        }
    }

    /**
     *!!DOC
     */
    public  getrecordAsync(key:TNative|null, allowAsync:false): TDatasource_Record<TDatasource>|undefined;
    public  getrecordAsync(key:TNative|null, allowAsync:true):  TDatasource_Record<TDatasource>|undefined|$JA.Task<TDatasource_Record<TDatasource>|undefined>;
    public  getrecordAsync(key:TNative|null, allowAsync:boolean): TDatasource_Record<TDatasource>|undefined|$JA.Task<TDatasource_Record<TDatasource>|undefined> {
        const datasource = this.Datasource;

        if (this._record && (this._record as any)[datasource.keyfieldname] === key) {
            return this._record;
        }

        let rtn = datasource.getrecordAsync(key, allowAsync) as (TDatasource_Record<TDatasource>|undefined|$JA.Task<TDatasource_Record<TDatasource>|undefined>);

        if (rtn && datasource instanceof RemoteSelectDatasource) {
            if (rtn instanceof $JA.Task) {
                rtn = rtn.then((r) => {
                                    this._storeRecord(r);
                                    return r;
                               });
            }
            else {
                this._storeRecord(rtn);
            }
        }

        return rtn;
    }

    protected isTypeOf(o:any) {
        return o instanceof SelectType && o.Datasource === this.Datasource;
    }

    private         _storeRecord(rec:TDatasource_Record<TDatasource>|undefined) {
        if (rec instanceof Object && (rec as any)[this.Datasource.keyfieldname] === this._value) {
            this._record = rec;
        }
    }
}

/**
 *!!DOC
 */
export interface INumberSelectConstructor<TDatasource extends SelectDatasource<number,ISelectRecord>>
{
    readonly    Name:           "NumberSelect";
    readonly    NativeType:     "number";
    readonly    Attributes:     ISelectTypeAttributes<number,TDatasource>;
                subClass(attr:ISelectTypeAttributes<number,TDatasource>): INumberSelectConstructor<TDatasource>;
                subClass(attr:ISimpleTypeAttributes<string>): INumberSelectConstructor<TDatasource>;
                castFrom(v:any): NumberSelect<TDatasource>;
                new():          NumberSelect<TDatasource>;
}

/**
 *!!DOC
 */
export class NumberSelect<TDatasource extends SelectDatasource<number,ISelectRecord>> extends SelectType<number, TDatasource>
{
    public static   Name        = "NumberSelect";
    public static   NativeType  = "number";

    public static   subClass<TDatasource extends SelectDatasource<number,ISelectRecord>>(attr:ISelectTypeAttributes<number,TDatasource>): INumberSelectConstructor<TDatasource>
    {
        return subClassHelper(NumberSelect, attr);
    }

    public cnvValueToInvariant(v: number):string
    {
        return v.toString();
    }

    public cnvInvariantToValue(invariant: string): number
    {
        return $J.parseIntExact(invariant);
    }

    public cnvJSONnumberToValue(v: number): number {
        return v;
    }
}

/**
 *!!DOC
 */
export interface IStringSelectConstructor<TDatasource extends SelectDatasource<string,ISelectRecord>>
{
    readonly    Name:           "StringSelect";
    readonly    NativeType:     "string";
    readonly    Attributes:     ISelectTypeAttributes<string,TDatasource>;
                subClass(attr:ISelectTypeAttributes<string,TDatasource>): IStringSelectConstructor<TDatasource>;
                subClass(attr:ISimpleTypeAttributes<string>): IStringSelectConstructor<TDatasource>;
                new():          StringSelect<TDatasource>;
}

/**
 *!!DOC
 */
export class StringSelect<TDatasource extends SelectDatasource<string,ISelectRecord>> extends SelectType<string, TDatasource>
{
    public static   Name        = "StringSelect";
    public static   NativeType  = "string";

    public static   subClass<TDatasource extends SelectDatasource<string,ISelectRecord>>(attr:ISelectTypeAttributes<string,TDatasource>): IStringSelectConstructor<TDatasource> {
        return subClassHelper(StringSelect, attr);
    }

    public cnvValueToInvariant(v: string): string {
        return v;
    }

    public cnvInvariantToValue(invariant: string): string {
        return invariant;
    }

    public cnvJSOStringToValue(v: string): string {
        return v;
    }
}

//===================================== Record ====================================================
/**
 *!!DOC
 */
export interface IRecordAttributes extends ISimpleTypeAttributes<Object>
{
    validate?: (rec:Record<IFieldDef>) => ValidateValueResult;
}

/**
 *!!DOC
 */
export interface IFieldDef
{
    [name: string]: IBaseConstructor<BaseType,IBaseTypeAttributes>;
}

/**
 *!!DOC
 */
export interface IRecord
{
    [name: string]: BaseType;
}

/**
 *!!DOC
 */
export interface IRecordConstructor<TRecord extends IFieldDef>
{
    Name:           "Record";
    Attributes:     IRecordAttributes;
    FieldDef:       TRecord;
    new():          Record<TRecord>;
}

/**
 *!!DOC
 */
export type RecordIFieldDef<T>    = T extends Record<infer U> ? U : never;
export type FieldDefFieldNames<T> = T extends IFieldDef ? { [K in keyof T] : K }[keyof T] : string;
export type RecordFieldNames<T>   = T extends Record<infer U> ? { [K in keyof U] : K }[keyof U] : string;
type UnboxArray<T> = T extends Array<infer U> ? U:never;
export type RecordObject<TRec extends IFieldDef, TNames extends string[]> = { [K in (keyof TRec) & UnboxArray<TNames>]: TRec[K] } ;


/**
 *!!DOC
 */
export class Record<TRec extends IFieldDef> extends BaseType implements $J.IUrlArgsFunc
{
    public static   Name                = "Record";
    public static   Attributes          = $J.extend<IRecordAttributes>({ null_response_error:true }, BaseType.Attributes);
    public static   FieldDef:IFieldDef  = {};

    protected       _fields!:IRecord|null;
    /*@internal*/   _validators?:RecordValidator<this>[];

    public static   define<T extends IFieldDef>(recdef:T, attr?:IRecordAttributes): IRecordConstructor<T> {
        var newClass:any = new Function("this._initialize();");

        newClass.prototype   = Object.create(Record.prototype);
        newClass.prototype.constructor = newClass;

        newClass.Name        = Record.Name;
        newClass.Attributes  = $J.extend<IRecordAttributes>(attr || {}, Record.Attributes);
        newClass.FieldDef    = recdef;

        return newClass;
    }

    protected       _initialize():void {
        this._fields = null;
    }

    /**
     *!!DOC
     */
    public get FieldDef(): TRec {
        return (this.constructor as any).FieldDef;
    }

    /**
     *!!DOC
     */
    public get FieldNames(): string[] {
        return Object.getOwnPropertyNames((this.constructor as any).FieldDef);
    }

    /**
     *!!DOC
     */
    public get hasValue():boolean {
        if (this._fields !== null) {
            for(var name in this._fields) {
                if (this._fields.hasOwnProperty(name) && this._fields[name].hasValue)
                    return true;
            }
        }
        return false;
    }

    /**
     *!!DOC
     */
    public get fields(): IRecord|null {
        return <any>(this._fields);
    }
    public set fields(r: IRecord|null) {
        throw new $J.NotImplentedError("$JT.Record.set_fields");
    }

    /**
     *!!DOC
     */
    public clone():this {
        let c = super.clone();

        if (this._fields) {
            c._fields = <IRecord>{};
            for(let name of this.FieldNames) {
                c._fields[name] = this._fields[name].clone();
            }
        }

        return c;
    }

    /**
     *!!DOC
     */
    public assign(r:any):void { //TODO typing
        if (r === null || r === undefined) {
            this.FieldNames.forEach((name) => this.field(name).assign(null));
            return;
        }

        if (r instanceof Record) {
            this.FieldNames.forEach((name) => this.field(name).assign((<Record<IFieldDef>>r).contains(name) ? (<Record<IFieldDef>>r).field(name) : null));
            return;
        }

        if (r instanceof Object) {
            this.FieldNames.forEach((name) => this.field(name).assign((<Object>r).hasOwnProperty(name) ? r[name] : null));
            return;
        }

        throw new TypeError("Invalid argument type '" + typeof r + "'.");
    }

    /**
     *!!DOC
     */
    public contains(name:string):boolean
    {
        return (this.constructor as any).FieldDef.hasOwnProperty(name);
    }

    /**
     *!!DOCx
     */
    public field<K extends keyof TRec>(name: K): InstanceType<TRec[K]>;
    public field<T extends BaseType>(name:string): (T extends SimpleType<any>|Record<any>|Set<any> ? T : unknown);
    public field(name:string): unknown
    {
        if (!this.contains(name))
            throw new $J.InvalidStateError("field '" + name + "' is not part of the record.");

        if (!this._fields) {
            this._fields = this._createFields();
        }

        return this._fields[name];
    }

    public toJSON(): $J.JsonValue {
        if (this._fields === null)
            return null;

        let rtn:$J.JsonObject = {};

        for(let name of Object.getOwnPropertyNames(this._fields)) {
            rtn[name] = this._fields[name].toJSON();
        }

        return rtn;
    }

    public parseJSON(v:$J.JsonValue):void {
        if (v instanceof Object) {
            if (this._fields === null) {
                this._fields = this._createFields();
            }

            for(let name of Object.getOwnPropertyNames(this._fields)) {
                try {
                    this._fields[name].parseJSON((v as $J.JsonObject)[name]);
                }
                catch(e) {
                    throw new $J.InvalidStateError("Error in '" + name + "'.parseJSON. " + e.message);
                }
            }
        }
    }

    public setDefault():void {
        if (this._fields === null) {
            this._fields = this._createFields();
        }

        for (let name of Object.getOwnPropertyNames(this._fields)) {
            this._fields[name].setDefault();
        }
    }

    public toUrlArgs(): $J.IUrlArgsInvariant {
        var rtn = {} as $J.IUrlArgsInvariant;

        if (this._fields !== null) {
            for (let name of Object.getOwnPropertyNames(this._fields)) {
                let urlValue = this._fields[name].toUrlValue();
                if (urlValue !== null) {
                    rtn[name] = urlValue;
                }
            }
        }

        return rtn;
    }

    public parseUrlArgs(urlargs: $J.IUrlArgs|string):void {
        if (typeof urlargs === 'string') {
            urlargs = $J.parseUrlArgs(urlargs);
        }
        else if (urlargs instanceof Object && $J.isIUrlArgsFunc(urlargs)) {
            urlargs = urlargs.toUrlArgs();
        }

        if (urlargs instanceof Object) {
            if (this._fields === null) {
                this._fields = this._createFields();
            }

            for(let name of Object.getOwnPropertyNames(this._fields)) {
                try {
                    this._fields[name].parseUrlValue(urlargs[name]);
                }
                catch(e) {
                    throw new $J.InvalidStateError("Error in '" + name + "'.parseJSON. " + e.message);
                }
            }
        }
    }

    /**
     * Create object with field[fieldnames] as properties.
     */
    public toObject<TNames extends Array<keyof TRec>>(fieldNames: TNames): { [K in (keyof TRec) & UnboxArray<TNames>]: InstanceType<TRec[K]> }
    {
        let rtn = {} as any;
        for (const fn of fieldNames) {
            rtn[fn] = this.field(fn);
        }
        return rtn;
    }

    /**
     *!!DOC
     */
    public sortCompare<K extends keyof TRec>(other:this, ...fields:K[])
    {
        for(let i = 0 ; i < fields.length ; ++i) {
            let c  = this.field(fields[i]).sortCompare(other.field(fields[i]));
            if (c !== 0)
                return c;
        }
        return 0;
    }

    /**
     * register a record (async) validator
     */
    public registerValidator<TFieldNames extends FieldDefFieldNames<TRec>[], TContext extends ObjectFieldValue>(fieldNames:TFieldNames, dataContext:TContext, softvalidate:boolean, validator:RecordValidatorValidator<{ [K in (keyof TRec) & UnboxArray<TFieldNames>]: InstanceType<TRec[K]> }, TContext>, thisArg?:any)
    {
        if (!this._validators) {
            this._validators = [];
        }
        this._validators.push(new RecordValidator(this, fieldNames, dataContext, softvalidate, validator as RecordValidatorValidator<ObjectFields,ObjectFields>, thisArg));
    }

    /**
     *!!DOC
     */
    /*@internal*/ validateTreeWalker(cb:(item:BaseType, path:string, childResult:ValidateResult)=>ValidateResult, path:string) : ValidateResult {
        let rtn = ValidateResult.OK;

        if (this._fields !== null) {
            for (let name of Object.getOwnPropertyNames(this._fields)) {
                rtn = mergeValidateResult(rtn, this._fields[name].validateTreeWalker(cb, path + '.' + name));
            }
        }

        return cb(this, path, rtn);
    }

    private _createFields() {
        let fielddef = this.FieldDef;
        let fields   = <IRecord>{};

        for (let name of Object.getOwnPropertyNames(fielddef)) {
            fields[name] = new fielddef[name]();
        }

        return fields;
    }
}

//===================================== Set =======================================================
/**
 *!!DOC
 */
export interface ISetAttributes extends ISimpleTypeAttributes<Array<any>> // TODO typing
{
    minOccurs?: number;
    maxOccurs?: number;
    validate?:  (rec:Set<Record<IFieldDef>|SimpleType<any>>) => ValidateValueResult;
}

/**
 *!!DOC
 */
export type ISetItemDefConstructor<TSet extends Record<any>|SimpleType<any>> =
    TSet extends Record<any> ?   {
                                Name:           "Record";
                                Attributes:     IRecordAttributes;
                                FieldDef:       RecordIFieldDef<TSet>;
                                new():          TSet;
                            } : {
                                Name:           "SimpleType";
                                Attributes:     ISimpleTypeAttributes<any>;
                                NativeType:     string;
                                new():          TSet;
                            };

export interface ISetConstructor<TSet extends Record<IFieldDef>|SimpleType<any>>
{
    Name:           "Set";
    Attributes:     ISetAttributes;
    ItemDef:        ISetItemDefConstructor<TSet>;
    new():          Set<TSet>;
}

export type RecordOfSet<TSet extends RecordSet<IFieldDef>> = TSet extends Set<infer U> ? U : never;

/**
 *!!DOC
 */
export class Set<TSet extends Record<IFieldDef>|SimpleType<any>> extends BaseType
{
    public static   Name                                                            = "Set";
    public static   Attributes                                                      = $J.extend<ISetAttributes>({ }, BaseType.Attributes);
    public static   ItemDef:typeof Record| typeof SimpleType | undefined   = undefined;

    protected       _items!:TSet[];

    public static   define<TSet extends Record<IFieldDef>|SimpleType<any>>(itemdef:IBaseConstructor<TSet, IBaseTypeAttributes>, attr?:ISetAttributes): ISetConstructor<TSet> {
        var newClass:any = new Function("this._initialize();");

        newClass.prototype   = Object.create(Set.prototype);
        newClass.prototype.constructor = newClass;

        newClass.Name        = Set.Name;
        newClass.Attributes  = $J.extend<ISetAttributes>(attr || {}, Set.Attributes);
        newClass.ItemDef     = itemdef;

        return newClass;
    }

    protected _initialize() {
        this._items = [];
    }

    /**
     *!!DOC
     */
    public get hasValue():boolean {
        return this.count > 0;
    }

    /**
     *!!DOC
     */
    public get ItemDef(): ISetItemDefConstructor<TSet> {
        const itemdef = (this.constructor as any).ItemDef;
        if (!itemdef) {
            throw new $J.InvalidStateError("ItemDef not defined.");
        }

        return itemdef;
    }

    /**
     *!!DOC
     */
    public get count(): number {
        return this._items.length;
    }

    /**
     *!!DOC
     */
    public bind(eventName:"added",   handler:(ev:{ item:TSet, index: number})=>void, thisArg?:any): void;
    public bind(eventName:"removed", handler:(ev:{ item:TSet, index: number})=>void, thisArg?:any): void;
    public bind(eventName: string,   handler:(ev:any)                        =>void, thisArg?:any): void {
        super.bind(eventName, handler, thisArg);
    }

    /**
     *!!DOC
     */
    public select(filter: (item:TSet)=>boolean): Set<TSet> {
        let rtn = new (this.constructor as any)();

        this.forEach((item) => {
                            if (filter(item)) {
                                rtn._items.push(item);
                            }
                        });

        return rtn;
    }

    /**
     *!!DOC
     */
    public selectFirst(filter: (item:TSet)=>boolean): TSet|null {
        for (let i = 0 ; i < this._items.length ; ++i) {
            if (filter(this._items[i])) {
                return this._items[i];
            }
        }

        return null;
    }

    /**
     *!!DOC
     */
    public clone():this {
        let c = super.clone();

        c._items = this._items.map((i) => i.clone()) as any;

        return c;
    }

    /**
     *!!DOC
     */
    public assign(r:any):void { //TODO typing
        if (this._items.length !== 0)
            throw new $J.InvalidStateError("Set.assign only possible on a empty set");

        if (r === null || r === undefined)
            return;

        if (Array.isArray(r) || r instanceof Set) {
            r.forEach((v) => {
                const item = this.createItem();
                item.assign(v);
                this.addItem(item);
            });

            return;
        }

        throw new TypeError("Invalid argument type '" + typeof r + "'.");
    }

    /**
     *!!DOC
     */
    public item(idx:number):TSet {
        if (typeof idx !== "number")
            throw new $J.InvalidStateError("Argument error Set.item().");

        if (idx < 0 || idx >= this._items.length)
            throw new $J.InvalidStateError("Set.item[" + idx.toString() + "] index out or range.");

        return this._items[idx];
    }

    /**
     *!!DOC
     */
    public toJSON(): $J.JsonValue {
        return this._items.map(item => item.toJSON());
    }

    /**
     *!!DOC
     */
    public parseJSON(vjson: $J.JsonValue):void {
        if (vjson !== undefined) {
            if (!Array.isArray(vjson))
                throw new $J.InvalidStateError("Expect array.");

            for (const v of vjson) {
                const item = this.createItem();
                item.parseJSON(v);
                this.addItem(item);
            }
        }
    }

    /**
     *!!DOC
     */
    public setDefault():void {
        this._items.forEach(i => { i.setDefault(); } );
    }

    /**
     *!!DOC
     */
    public createItem(): TSet
    {
        return new ((this.constructor as any).ItemDef)() as TSet;
    }

    /**
     *!!DOC
     */
    public addItem(item: TSet, index?: number):void {
        if (index !== undefined && index >= 0 && index < this._items.length) {
            this._items.splice(index, 0, item);
        } else {
            index = this._items.length;
            this._items.push(item);
        }

        this.trigger("added", { item, index });
    }

    /**
     *!!DOC
     */
    public removeItem(item:TSet) {
        const index = this._items.indexOf(item);

        if (index < 0) {
            throw new $J.InvalidStateError("Item not part of set.");
        }

        this._items.splice(index, 1);
        this.trigger("removed", { item, index });
    }

    /**
     *!!DOC
     */
    public clear()
    {
        while (this.count > 0) {
            this.removeItem(this.item(0));
        }
    }
    /**
     *!!DOC
     */
    public forEach(callback: (item: TSet, index:number) => void, thisArg?:any):void {
        this._items.forEach((value, index) => callback.call(thisArg, value, index) );
    }

    public [Symbol.iterator]()
    {
        return this._items.values();
    }
    /**
     *!!DOC
     */
    public map<T>(callback: (item: TSet, index:number, set: TSet[]) => T, thisArg?:any):T[] {
        return this._items.map((value, index, items) => callback.call(thisArg, value, index, items));
    }

    /**
     *!!DOC
     */
    public toArray():TSet[] {
        return this._items.slice();
    }

    /**
     *!!DOC
     */
    public get MinOccurs():number|undefined {
        return this.getAttr("minOccurs");
    }

    /**
     *!!DOC
     */
    public get MaxOccurs():number|undefined {
        return this.getAttr("maxOccurs");
    }

    /**
     *!!DOC
     */
    public validateValue(): ValidateValueResult {
        const minOccurs = this.MinOccurs;
        if (typeof minOccurs === 'number' && minOccurs > this._items.length)    return $JL.items_to_few;
        const maxOccurs = this.MaxOccurs;
        if (typeof maxOccurs === 'number' && maxOccurs < this._items.length)    return $JL.items_to_many;

        let validate = this.getAttr("validate") as ((set:Set<TSet>) => ValidateValueResult)|undefined;

        return typeof validate === 'function' ? validate(this) : null;
    }

    /**
     *!!DOC
     */
    /*@internal*/ validateTreeWalker(cb:(item:BaseType, path:string, childResult:ValidateResult)=>ValidateResult, path:string): ValidateResult {
        let rtn = ValidateResult.OK;

        this._items.forEach((item, index) => {
                                rtn = mergeValidateResult(rtn, item.validateTreeWalker(cb, path + '[' + index + ']'));
                            });

        return cb(this, path, rtn);
    }
}

//===================================== SelectDatasource ==========================================
/**
 *!!DOC
 */
export abstract class SelectDatasource<TNative extends SelectValue, TRecord extends ISelectRecord>
{
    protected       _keyfieldname:      string;

    /**
     *!!DOC
     */
    public get flags(): SelectDatasourceFlags {
        throw new $J.NotImplentedError("SelectDatasource.options");
    }
    /**
     *!!DOC
     */
    public get keyfieldname()   {
        return this._keyfieldname;
    }

    /*protected*/ constructor(keyname?: string) {
        this._keyfieldname         = keyname || "key";
    }

    /**
     *!!DOC
     */
    public abstract getrecordAsync(key:TNative|null, allowAsync:boolean): TRecord|undefined|$JA.Task<TRecord|undefined>;
    /**
     *!!DOC
     */
    public abstract fetchdataAsync(context:$JA.Context, inputContext:$JI.SelectInputContext, searchkeys?:string|string[], max?:number): $JA.Task<TRecord[]|string>;
    /**
     *!!DOC
     */
    public filter_searchtext(searchkeys:string[]): string[] {
        return searchkeys;
    }
    /**
     *!!DOC
     */
    public normalize_searchtext(searchtext: string) : string|string[] {
        return searchtext.split(" ").filter((s) => s.length > 0);
    }
}

/**
 *!!DOC
 */
export class EnumSelectDatasource<TNative extends SelectValue, TRecord extends ISelectRecord> extends SelectDatasource<TNative, TRecord>
{
    private         _enumset:       TRecord[];

    public  get flags(): SelectDatasourceFlags {
        return SelectDatasourceFlags.StaticEnum | SelectDatasourceFlags.Loaded;
    }

    public  constructor(enumset: TRecord[], keyname?: string) {
        super(keyname);
        this._enumset = enumset;
    }

    public  getenumset(): TRecord[] {
        return this._enumset;
    }
    public  getrecord(key:TNative|null): TRecord|undefined {
        const enumset = this._enumset;
        const keyname = this._keyfieldname;

        for(var i=0 ; i<enumset.length ; ++i) {
            if ((enumset[i] as ({readonly [key:string]:any}))[keyname] === key) {
                    return enumset[i];
            }
        }

        return undefined;
    }
    public  getrecordAsync(key:TNative): TRecord|undefined {
        return this.getrecord(key);
    }
    public  fetchdataAsync(context:$JA.Context, inputContext:$JI.SelectInputContext, searchkeys?:string|string[], max?:number): $JA.Task<TRecord[]> {
        if (searchkeys !== undefined)
            throw new $J.InvalidStateError("EnumSelectDatasource.search not implemented.");

        return $JA.Task.resolve(this._enumset);
    }
}

/**
 *!!DOC
 */
export interface RemoteSelectDatasourceOpts
{
    callname_lookup?:       string;
    callname_fetchdata?:    string;
    flags:                  SelectDatasourceFlags;
    cache_timeout?:         number;
    keyfieldname:           string;
    fetch_filter?:          string[];               // List with words (in uppercase) which are not index by the server.
    minkeylength?:          number;
    searchtext_normalize?:  (text:string) => string|string[];
}
/**
 *!!DOC
 */
export class RemoteSelectDatasource<TNative extends SelectValue, TRecord extends ISelectRecord> extends SelectDatasource<TNative, TRecord>
{
    private         _opts:          RemoteSelectDatasourceOpts;
    private         _cache:         { [key:string]: {
                                            timeout?:       number;
                                            entry:          TRecord|undefined|$JA.Task<TRecord|undefined>;
                                        }
                                    };
    private         _cachetimeout:  number;
    private         _cleanuptimer:  number|undefined;

    public  get opts(): RemoteSelectDatasourceOpts {
        return this._opts;
    }
    public  get flags(): SelectDatasourceFlags {
        return this._opts.flags;
    }

    public  constructor(opts: RemoteSelectDatasourceOpts) {
        Object.freeze(opts);
        super(opts.keyfieldname);
        this._opts  = opts;
        this._cache = {};
        this._cache["_"] = (undefined as any);
        delete this._cache["_"];
        this._cachetimeout = (typeof opts.cache_timeout === 'number') ? opts.cache_timeout : 60000;
    }

    public  addrecord(rec:TRecord):void {
        const key = (rec as ({readonly [key:string]:any}))[this._keyfieldname];

        if (typeof key !== 'number' && typeof key !== 'string') {
            throw new $J.InvalidStateError("invalid key argument in RemoteSelectDatasource.key.");
        }

        this._cache[encode_key(key)] = { timeout:this._entrytimeout(), entry:rec };
        if (!this._cleanuptimer && this._cachetimeout > 0) {
            this._cleanuptimer = $J.setTimeout(this._cleanup, this._cachetimeout + 500, this);
        }
    }
    public  getrecordAsync(key:TNative, allowAsync:boolean): TRecord|undefined|$JA.Task<TRecord|undefined> {
        if (key === null) {
            return undefined;
        }

        const ck = encode_key(key);
        const e = this._cache[ck];
        if (e !== undefined) {
            if (!allowAsync && e.entry instanceof $JA.Task) {
                return undefined;
            }

            return e.entry;
        }

        if (!allowAsync) {
            return undefined;
        }

        if (!this.opts.callname_lookup) {
            throw new $J.InvalidStateError("RemoteSelectDatasource.lookup not defined.");
        }

        const task = $JA.Ajax<$JA.IAjaxCallDefinition<any,void,TRecord>>({
                                                                             method:                     "GET",
                                                                             callname:                   this.opts.callname_lookup,
                                                                             response_contenttype:       $JA.MimeType.Json,
                                                                         }, {
                                                                             callargs:                   { key: key },
                                                                         }, null)
                        .then((data) => {
                                  if ((data as ({readonly [key:string]:any}))[this._keyfieldname] === key) {
                                      this._cache[ck].timeout = $global.Date.now() + this._cachetimeout;
                                      this._cache[ck].entry   = data;

                                      if (!this._cleanuptimer) {
                                          this._cleanuptimer = $J.setTimeout(this._cleanup, 15000, this);
                                      }

                                      return data;
                                  }

                                  delete this._cache[ck];
                                  throw new $J.InvalidStateError("Recieved invalid record from backend.");
                              },
                              (err) => {
                                  delete this._cache[ck];
                                  throw err;
                              });

        this._cache[ck] = { entry: task };

        return task;
    }
    public  fetchdataAsync(context:$JA.Context, inputContext:$JI.SelectInputContext, searchkeys?:string|string[], max?:number): $JA.Task<TRecord[]|string> {
        if (!this.opts.callname_fetchdata) {
            throw new $J.InvalidStateError("RemoteSelectDatasource.fetch not defined.");
        }

        let callargs: $J.IUrlArgsColl = {};

        if (inputContext) {
            for (var key in inputContext) {
                if (inputContext.hasOwnProperty(key)) {
                    var value = inputContext[key];
                    if (value !== undefined && value !== null) {
                        callargs[key] = value;
                    }
                }
            }
        }

        if (searchkeys) {
            callargs["searchtext"] = (Array.isArray(searchkeys) ? (searchkeys as string[]).join(" ") : searchkeys);
        }
        if (max) {
            callargs["max"] = max.toString();
        }

        const url = $J.objectToUrlArgs(this.opts.callname_fetchdata, callargs);

        return $JA.Ajax<$JA.IAjaxCallDefinition<void,void,TRecord[]|string>>({
                                                                                  method:                 "GET",
                                                                                  response_contenttype:   $JA.MimeType.Json,
                                                                             }, {
                                                                                  url
                                                                             }, context);
    }
    public  filter_searchtext(searchtext:string[]): string[] {
        const fetch_filter = this._opts.fetch_filter;
        const minkeylength = this._opts.minkeylength || 2;

        return searchtext.filter((v) => (v.length >= minkeylength && !(fetch_filter instanceof Array && fetch_filter.indexOf(v) >= 0)));
    }
    public  normalize_searchtext(searchtext: string): string | string[] {
        if (this._opts.searchtext_normalize) {
            return this._opts.searchtext_normalize(searchtext);
        }

        return super.normalize_searchtext(searchtext);
    }

    private _entrytimeout()
    {
        const t = this._cachetimeout;
        return (t > 0) ? $global.Date.now() + t : undefined;
    }
    private _cleanup() {
        this._cleanuptimer = undefined;

        const n = $global.Date.now();
        let m = $global.Number.MAX_SAFE_INTEGER;

        for (const ct of Object.keys(this._cache)) {
            const l = this._cache[ct].timeout;
            if (l !== undefined) {
                if (l <= n) {
                    delete this._cache[ct];
                }
                else if (m > l) {
                    m = l;
                }
            }
        }

        if (m < $global.Number.MAX_SAFE_INTEGER) {
            this._cleanuptimer = $J.setTimeout(this._cleanup, Math.max(m - $global.Date.now(), 0) + 500, this);
        }
    }
}

//===================================== helpers ===================================================
export function subClassHelper(baseClass:any,attr:IBaseTypeAttributes)
{
    var newClass:any = new Function("this._initialize();");

    newClass.prototype   = Object.create(baseClass.prototype);
    newClass.prototype.constructor = newClass;

    newClass.Name        = baseClass.Name;
    newClass.NativeType  = baseClass.NativeType;
    newClass.Attributes  = $J.extend(attr || {}, baseClass.Attributes);
    newClass.subClass    = (attr:IBaseTypeAttributes) => { return subClassHelper(newClass, attr); };
    newClass.castFrom    = baseClass.castFrom;

    return newClass;
}

function getModuleClass(modulename:string, classname:string) {
    const module = require(modulename);
    if (!module)
        throw new $J.InvalidStateError("'" + modulename + "' not load.");

    const cls = module[classname];
    if (typeof cls !== 'function')
       throw new $J.InvalidStateError("'" + classname + "' does not exist in '" + modulename + "' not load.");

    return cls;
}

function encode_key(key: SelectValue): string {
    switch(typeof key) {
    case 'number':
        return '#' + (key as number).toString();

    case 'string':
        return '@' + (key as string);

    case 'object':
        if (key === null)
            return 'null';
        break;
    }

    throw new $J.InvalidStateError("RemoteSelectDatasource invalid key type '" + typeof key + "'.");
}

function mergeValidateResult(r1:ValidateResult, r2:ValidateResult): ValidateResult
{
    if (r1 === ValidateResult.OK &&
        r2 === ValidateResult.OK) {
        return ValidateResult.OK;
    }

    if ((r1 === ValidateResult.OK || r1 === ValidateResult.Partial) &&
        (r2 === ValidateResult.OK || r2 === ValidateResult.Partial)) {
        return ValidateResult.Partial;
    }

    return ValidateResult.Error;
}

function stringErrorToMessage(e:string|Error): string;
function stringErrorToMessage(e:null|string|Error): string|null;
function stringErrorToMessage(e:null|string|Error): string|null
{
    if (e === null)             return null;
    if (typeof e === "string")  return e;
    if (e instanceof Error)     return e.message;

    return "Invalid argument 'message'.";
}

function regexToString(r: RegExp) {
    return r.source.replace(/\((?![?])/g, '(?:').replace(/[\^\$]/g, '');
}

type ObjectFields = { [key:string]: BaseType };
type ObjectFieldValue = { [key:string]: BaseType };
type RecordValidatorValidator<TFields, TContext> = (fields:TFields, contextFields:TContext, ct:$JA.Context)=>ValidateResult|Error|$JA.Task<ValidateResult|Error>;

class RecordValidator<TRec extends Record<IFieldDef>> implements IValidatable
{
    private     _fields:        ObjectFields;
    private     _dataContext:   ObjectFieldValue;
    private     _allfields:     BaseType[];
    private     _validator:     RecordValidatorValidator<ObjectFields,ObjectFieldValue>;
    private     _thisArg:       any;
    private     _initstate:     undefined|$J.JsonValue[];
    private     _delaytimer:    number|null;
    private     _result:        undefined|ValidateResult|Error|$JA.Task<ValidateResult|Error>;
    private     _context:       $JA.Context|null;

    constructor(rec:TRec, fieldNames:string[], dataContext:ObjectFieldValue, softvalidate:boolean, validator:RecordValidatorValidator<ObjectFields,ObjectFields>, thisArg:any)
    {
        this._fields      = rec.toObject(fieldNames);
        this._dataContext = dataContext;
        this._allfields   = RecordValidator._getFields(this._fields, this._dataContext);
        this._validator   = validator;
        this._thisArg     = thisArg;
        this._initstate   = softvalidate ? this._getState() : undefined;
        this._delaytimer  = null;
        this._result      = undefined;
        this._context     = null;

        this._allfields.forEach((f) => f.bind('changed', this._fieldChanged, this));
    }

    public  preValidateAsync(context:$JA.Context|null):($JA.Task<unknown>|Error)[]|$JA.Task<unknown>|Error|null
    {
        const waiton = [] as $JA.Task<unknown>[];

        for (const v of this._allfields) {
            const control = v.boundControl;
            if (control) {
                const r = control.preValidate();
                if (r && !r.isFulfilled) {
                    if (r.isPending) {
                        waiton.push(r);
                    }
                    else {
                        this._result = undefined;
                        return null;
                    }
                }
            }
        }

        if (waiton.length > 0) {
            return $JA.Task.all(waiton)
                           .then(() => this._preValidateAsync(),
                                 (e) => undefined);
        }
        else {
            return this._preValidateAsync();
        }
    }
    public  validateNow(opts:IValidateOptions): ValidateResult|Error
    {
        let result = this._result;

        if (result instanceof $JA.Task) {
            result = new $J.InvalidStateError("Validation is busy.");
        }

        if (result === undefined) {
            result = new $J.InvalidStateError("Validation not yet done.");
        }

        return result;
    }

    private _fieldChanged(reason:ChangeReason)
    {
        if (this._context) {
            this._context.stop();
            this._context = null;
        }
        if (this._delaytimer) {
            clearTimeout(this._delaytimer);
        }

        this._delaytimer = setTimeout(() => {
                                          this._delaytimer = null;
                                          this._startValidate(reason === ChangeReason.UI);
                                      }, 25);
    }
    private _startValidate(seterror:boolean)
    {
        if (this._delaytimer) {
            clearTimeout(this._delaytimer);
            this._delaytimer = null;
        }

        if (this._testFieldValid()) {
            if (this._initstate !== undefined && $J.isEqual(this._initstate, this._getState())) {
                this._setError(this._result = ValidateResult.OK);
            }
            else {
                const self = this;
                const context = new $JA.Context({});

                try {
                    this._context = context;
                    this._result  = this._validator.call(this._thisArg, this._fields, this._dataContext, this._context);

                    if (this._result instanceof $JA.Task) {
                        this._result.then(setResult, setResult);
                    }
                    else {
                        setResult(this._result);
                    }
                }
                catch (e) {
                    setResult(e);
                }

                function setResult(result: ValidateResult|Error) {
                if (self._context === context) {
                    self._context = null;
                    self._result = result;
                    self._setError(result);
                }
            }
            }
        }
        else {
            this._setError(this._result = undefined);
        }

        return this._result;

    }
    private _setError(result:undefined|ValidateResult|Error)
    {
        let fields = RecordValidator._getFields(this._fields);

        if (result instanceof ValidateErrors) {
            const errors = result.errors;
            if (errors) {
                for (const err of errors) {
                    const value = err.value;
                    if (value) {
                        const i     = fields.indexOf(value);
                        if (i !== -1) {
                            value.setError(err.error instanceof Error ? err.error.message : err.error);
                            fields.splice(i, 1);
                        }
                    }
                }
            }
        }

        for(const f of fields) {
            f.setError();
        }
    }
    private _preValidateAsync()
    {
        if (this._result === undefined) {
            this._startValidate(false);
        }

        return (this._result instanceof $JA.Task) ? this._result : null;
    }
    private _testFieldValid()
    {
        for (const v of this._allfields) {
            const control = v.boundControl;
            if (control) {
                try {
                    const r = control.preValidate();
                    if (r && !r.isFulfilled) {
                        return false;
                    }
                }
                catch (e) {
                    return false;
                }
            }
        }

        for (const v of this._allfields) {
            try {
                if (v.validateValue()) {
                    return false;
                }
            }
            catch (e) {
                return false;
            }
        }

        return true;
    }
    private _getState()
    {
        return this._allfields.map((f) => f.toJSON());
    }
    private static _getFields(...objectFields: ObjectFieldValue[])
    {
        const rtn = [] as BaseType[];
        for (const objf of objectFields) {
            for (const n of Object.getOwnPropertyNames(objf)) {
                if (objf[n] instanceof BaseType) {
                    rtn.push(objf[n]);
                }
            }
        }
        return rtn;
    }
}

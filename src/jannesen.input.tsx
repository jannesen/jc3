﻿/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J         from "jc3/jannesen";
import * as $JA        from "jc3/jannesen.async";
import * as $JD        from "jc3/jannesen.dom";
import * as $JT        from "jc3/jannesen.datatype";
import * as $JR        from "jc3/jannesen.regional";
import * as $JSTRING   from "jc3/jannesen.string";
import * as $JL        from "jc3/jannesen.language";
import * as $JPOPUP    from "jc3/jannesen.ui.popup";
import * as $JSELECT   from "jc3/jannesen.ui.select";

//===================================== Control Interface =========================================
/**
 * !!DOC
 */
export interface IControlOptions
{
    id?:        string;
    name?:      string;
    extClass?:  string;
    width?:     number|string;
    disabled?:  boolean;
}

//===================================== SimpleControl =============================================
/**
 * !!DOC
 */
export abstract class SimpleControl<TValue extends $JT.SimpleType<any>,
                                    TOpts extends IControlOptions>
                                        implements $JT.IControlContainer<TValue>, $J.IEventSource
{
    protected   _container!:        $JD.DOMHTMLElement;
    protected   _opts:              TOpts;
    protected   _value:             TValue|undefined;
    protected   _errormsg:          ErrorMessage|undefined;

    /**
     * !!DOC
     */
    public get  isVisible() : boolean
    {
        return this._container.isVisible;
    }

    /**
     * !!DOC
     */
    public get  disabled()
    {
        return this._container.disabled;
    }
    public set  disabled(d:boolean)
    {
        let cur = this._container.disabled;

        d = !!d;
        if (cur !== d) {
            let input = this.getinputelm();

            switch(input.prop("tagName")) {
            case "INPUT":
            case "TEXTAREA":
            case "SELECT":
                input.disabled = d;
            }

            this._container.disabled = d;
        }
    }

    /**
     * !!DOC
     */
    public get  opts()
    {
        return this._opts;
    }


    /**
     * !!DOC
     */
    constructor(opts: TOpts) {
        this._opts      = opts;
        this._value     = undefined;
        this._errormsg  = undefined;
    }

    /**
     * !!DOC
     */
    public get  container(): $JD.DOMHTMLElement {
        return this._container;
    }

    /**
     * !!DOC
     */
    public get  value() {
        return this._value;
    }

    /**
     * !!DOC
     */
    public      linkValue(value: TValue|undefined): void
    {
        this._value = value;
        if (value) {
            this.valueChanged($JT.ChangeReason._linked, true);
        }
    }

    /**
     * !!DOC
     */
    public      valueChanged(reason:$JT.ChangeReason, changed:boolean): void {
        throw new $J.InvalidStateError("Not implemented valueChanged().");
    }

    /**
     * !!DOC
     */
    public      attrChanged(attrName: string): void {
    }

    /**
     * !!DOC
     */
    public      preValidate(): $JA.Task<unknown>|null
    {
        this.parseInput(true);
        return null;
    }

    /**
     * !!DOC
     */
    public      parseInput(validate:boolean): void {
        throw new $J.InvalidStateError("Not implemented parseInput().");
    }

    /**
     * !!DOC
     */
    public      setError(message: string|null): void {
        if (typeof message === 'string' && message.length > 0) {
            if (this._errormsg === undefined || this._errormsg.message !== message) {
                this._container.addClass("-error");
                this._container.attr("title", message);

                if (this._errormsg) {
                    this._errormsg.Remove();
                    this._errormsg = undefined;
                }

                this._errormsg = new ErrorMessage(this.getinputelm(), message);
            }
        } else {
            if (this._errormsg) {
                this._errormsg.Remove();
                this._errormsg = undefined;
                this._container.attr("title", undefined);
                this._container.removeClass("-error");
            }
        }
    }

    /**
     * Focus input element
     */
    public      focus() {
        this.getinputelm().focus();
    }

    /**
     * Bind handler to input element event
     */
    public      bind<K extends keyof $JD.DOMElementEventMap>(eventName: K, handler:(ev:$JD.DOMElementEventMap[K]) => void, thisArg?:any, options?:AddEventListenerOptions): void
    {
        this.getinputelm().bind(eventName, handler, thisArg, options);
    }
    /**
     * Unbind handler to input element event
     */
    public      unbind(eventName: string, handler:(ev:any) => void, thisArg?:any): void
    {
        this.getinputelm().unbind(eventName, handler, thisArg);
    }

    protected       setcontainer(container: $JD.DOMHTMLElement) {
        container.bind("RemovedFromDocument", this.control_destroy, this);
        this._container = container;

        if (typeof this._opts.disabled === 'boolean') {
            this.disabled = this._opts.disabled;
        }
    }

    public abstract getinputelm(): $JD.DOMHTMLElement;

    protected control_destroy() {
        if (this._errormsg) {
            this._errormsg.Remove();
            this._errormsg = undefined;
        }
        if (this._value) {
            this._value.unlinkControl(this);
        }
    }
}

//===================================== InputTextControl ==========================================
/**
 * !!DOC
 */
export interface IInputControlOptions extends IControlOptions
{
    placeholder?:   string;
    tabIndex?:      number;
    'class'?:       string;
}

export const enum DropdownFocus {
    No          = 0,
    Yes         = 1,
    Mandatory   = 2
}

/**
 * !!DOC
 */
export abstract class InputTextControl<TNativeValue,
                                       TValue extends $JT.SimpleType<TNativeValue>,
                                       TInput extends InputTextControl<TNativeValue, TValue, TInput, TOpts, TDropdownData, TDropdownRtn, TDropdown>,
                                       TOpts extends IInputControlOptions,
                                       TDropdownData = void,
                                       TDropdownRtn = TNativeValue|null,
                                       TDropdown extends $JPOPUP.DropdownContent<TNativeValue, TInput, TDropdownData, TDropdownRtn> = $JPOPUP.DropdownContent<TNativeValue, TInput, TDropdownData, TDropdownRtn>>
                                            extends SimpleControl<TValue, TOpts>
                                            implements $JPOPUP.IControlDropdown<TDropdownRtn|null>
{
    protected   _input:             $JD.DOMHTMLElement;
    protected   _text:              string | undefined;
    protected   _activeDropdown:    $JPOPUP.DropdownPopup<TNativeValue, TInput, TDropdownData, TDropdownRtn, TDropdown>|undefined;
    protected   _eventHandlers?:    $J.IEventHandlerCollection;

                            constructor(value:TValue, type:string, typeClass:string, opts:TOpts, dropdown:boolean, forcecontainer?:boolean)
    {
        super(opts);


        let container:$JD.DOMHTMLElement;
        let input = <input type={type} spellCheck={false} autoComplete="no-autocomplete" />;

        input.bind("focus",   this.input_onfocus, this);
        input.bind("blur",    this.input_onblur,  this);
        input.bind("keydown", this.input_onkeydown,  this);

        if (this.keyRemap !== InputTextControl.prototype.keyRemap) {
            input.bind("keypress", this.input_onkeypress, this);
        }

        if (dropdown) {
            const dropdownctl = <span class="-dropdown-button" tabIndex={-1} />;
            dropdownctl.bind("click", this.dropdown_click, this);
            container = <div>{ input }{ dropdownctl }</div>;
        }
        else if (forcecontainer) {
            container = <div>{ input }</div>;
        }
        else {
            container = input;
        }

        container.addClass("jannesen-input").addClass(typeClass);
        if (dropdown || forcecontainer) {
            container.addClass("-container");
            if (dropdown) {
                container.addClass("-dropdown");
            }
        }

        genericAttr(container, input, opts, value);

        {
            let placeholder = opts.placeholder;
            if (!placeholder)   placeholder = value.Placeholder;
            if (!placeholder)   placeholder = this.defaultPlaceHolder(value);

            if (placeholder) {
                input.attr("placeholder", placeholder);
            }
        }

        if (opts.tabIndex) {
            input.attr("tabIndex", opts.tabIndex);
        }

        if (opts['class']) {
            input.addClass(opts['class']);
        }

        if (opts.width) {
            container.css("width", opts.width);
        }

        this._input = input;

        if (dropdown) {
            if ($JD.body.hasClass("jannesen-ui-mobile")) {
                this.getinputelm().bind("click", this.dropdown_click, this);
            }

            if (this.disableKeyboard()) {
                this.getinputelm().attr("readonly", true).attr("tabIndex", 0);      // Don't use keyboard on mobile devices.
            }
        }

        this._text           = "";
        this._activeDropdown = undefined;
        this.setcontainer(container);
    }

    public                  valueChanged(reason:$JT.ChangeReason, changed:boolean): void
    {
        this.closeDropdown(true);

        if (this._value && (changed || this.isDirty())) {
            let vvalue = this._value.internalvalue;
            this._text = (vvalue !== null ? this._value.cnvValueToText(vvalue, this._value.getAttr("format")) : "");

            if (this._input.prop("value") !== this._text)
                this._input.prop("value", this._text);
        }

        this.setError(null);
    }
    public                  dropdownClose(value:TDropdownRtn|undefined, ev:Event|undefined)
    {
        if (this._activeDropdown && this._input) {
            const dropdown = this._activeDropdown;
            this.closeDropdown(true);

            if (value !== undefined) {
                const v = this.value;
                if (v) {
                    this.dropdownValueSet(v, value, dropdown);
                }
            }

            if (ev instanceof KeyboardEvent && ev.key === 'Tab' && !(ev.ctrlKey || ev.altKey && ev.metaKey) &&
                $global.document.activeElement === this._input.element) {
                $global.document.activeElement.dispatchEvent(new KeyboardEvent(ev.type, {
                                                                                   code:       ev.code,
                                                                                   key:        ev.key,
                                                                                   location:   ev.location,
                                                                                   repeat:     ev.repeat,
                                                                                   altKey:     ev.altKey,
                                                                                   ctrlKey:    ev.ctrlKey,
                                                                                   metaKey:    ev.metaKey,
                                                                                   shiftKey:   ev.shiftKey,
                                                                                   bubbles:    true,
                                                                                   cancelable: true,
                                                                                   view:       $global.window
                                                                               }));
            }
        }
    }
    public                  isDirty()
    {
        return (this._text !== this._input.prop("value"));
    }
    public                  parseInput(validate:boolean): void
    {
        if (this._value) {
            let text = this._input.prop("value");

            if (this._text !== text) {
                this._value.setValue((text === "" ? null : this._value.cnvTextToValue(text)), $JT.ChangeReason.UI);
            }
        }
    }
    public                  getinputelm(): $JD.DOMHTMLElement
    {
        return this._input;
    }

    /**
     * Bind handler to input element event
     */
    public                  bind<K extends keyof $JD.DOMElementEventMap>(eventName: K, handler:(ev:$JD.DOMElementEventMap[K]) => void, thisArg?:any, options?:AddEventListenerOptions): void
    {
        if (eventName === 'blur') {
            if (!this._eventHandlers) this._eventHandlers = {};
            $J.eventBind(this._eventHandlers, eventName, handler, thisArg);
            return;
        }

        super.bind(eventName, handler, thisArg, options);
    }
    /**
     * Unbind handler to input element event
     */
    public                  unbind(eventName: string, handler:(ev:any) => void, thisArg?:any): void
    {
        if (eventName === 'blur') {
            $J.eventUnbind(this._eventHandlers, eventName, handler, thisArg);
            return;
        }

        super.unbind(eventName, handler, thisArg);
    }

    protected   abstract    openDropdown(): void;

    protected               defaultPlaceHolder(value: TValue): string|undefined
    {
        return undefined;
    }
    protected               keyRemap(key: string): string|null
    {
        return key;
    }
    protected               disableKeyboard()
    {
        return $JD.body.hasClass("jannesen-ui-mobile");
    }
    protected               selectall(): void
    {
        let elm = this._input.element as HTMLInputElement;
        if (elm === document.activeElement && elm.selectionStart! >= 0) {
            elm.selectionStart = 0;
            elm.selectionEnd   = elm.value.length;
        }
    }
    protected               getDropdown(dropdownClass: string|$JPOPUP.IDropdownConstructor<TNativeValue, TInput, TDropdownData, TDropdownRtn, TDropdown>, className:string, focus:DropdownFocus, calldata:TDropdownData, onready?:(content:TDropdown)=>void)
    {
        if (!(this._activeDropdown && this._activeDropdown.DropdownClass === dropdownClass && $J.isEqual(this._activeDropdown.Calldata, calldata))) {
            this.closeDropdown(false);
            this._activeDropdown  = new $JPOPUP.DropdownPopup(this as any /* Typing is ok */, this._input, dropdownClass, className, focus === DropdownFocus.Mandatory, calldata);
            this._activeDropdown.load();
            this._activeDropdown.container!.bind("blur", this.input_onblur, this);
        }

        if (focus) {
            this._activeDropdown.Focus();
        }

        if (onready) {
            this._activeDropdown.LoadTask.then(onready);
        }
    }
    protected               closeDropdown(restorefocus:boolean)
    {
        const activeDropdown = this._activeDropdown;
        if (activeDropdown) {
            this._activeDropdown = undefined;

            if (restorefocus) {
                const c = activeDropdown.container;
                if (c && c.contains($global.document.activeElement)) {
                    this._input.focus();
                }
            }

            activeDropdown.Stop();
        }
    }
    protected               dropdownValueSet(datavalue:TValue, value:TDropdownRtn, dropdown:$JPOPUP.DropdownPopup<TNativeValue, TInput, TDropdownData, TDropdownRtn, TDropdown>)
    {
        throw new $J.InvalidStateError("dropdownValueSet not implented");
    }

    protected               dropdown_click()
    {
        if (!this._activeDropdown) {
            this.openDropdown();
        } else {
            this.closeDropdown(false);
            this.getinputelm().focus();
        }
    }
    protected               control_destroy()
    {
        this.closeDropdown(false);
        super.control_destroy();
    }
    protected               input_onfocus(ev:FocusEvent): void
    {
        if (this._activeDropdown && this._activeDropdown.FocusMandatory) {
            this.closeDropdown(false);
        }

        if (this._container !== this._input) {
            this._container.addClass("-focus");
        }

        if (ev.relatedTarget && !this.hasFocus(ev.relatedTarget as Element) && !($JD.body && $JD.body.hasClass("jannesen-ui-mobile"))) {
            this.selectall();
        }
    }
    protected               input_onkeydown(evt:KeyboardEvent)
    {
        switch(evt.key) {
        case "Tab":
            if (!(evt.altKey || evt.ctrlKey || evt.metaKey)) {
                this.onblurparse();
            }
            break;

        case "ArrowDown":
        case "F4":
            if (!(evt.altKey || evt.ctrlKey || evt.metaKey)) {
                this.openDropdown();
                return;
            }
        }
    }
    protected               input_onblur(ev:FocusEvent): void
    {
        if (this._container !== this._input) {
            this._container.removeClass("-focus");
        }

        if (!this.hasFocus(ev.relatedTarget as Element)) {
            if (this._activeDropdown) {
                this.closeDropdown(!ev.relatedTarget || ev.relatedTarget === $global.document.body);
            }

            this.onblurparse();
            $J.eventTrigger(this._eventHandlers, 'blur', ev);
        }
    }
    protected               input_onkeypress(evt:KeyboardEvent): void
    {
        if (evt.key.length === 1) {
            const key = this.keyRemap(evt.key);

            if (key !== evt.key) {
                evt.preventDefault();
                if (typeof key === 'string') {
                    let selectionStart = (this._input.element as any).selectionStart as number;
                    let selectionEnd   = (this._input.element as any).selectionEnd   as number;

                    if (selectionStart <= selectionEnd) {
                        let inputtext = this._input.prop("value") as string;

                        if (inputtext.length > selectionStart) {
                            inputtext = inputtext.substr(0, selectionStart) + key + inputtext.substr(selectionEnd);
                        } else {
                            inputtext += key;
                        }

                        this._input.prop("value", inputtext);
                        (this._input.element as any).selectionStart = selectionStart + 1;
                        (this._input.element as any).selectionEnd   = selectionStart + 1;
                    }
                }
            }

            if (typeof key === 'string') {
                this.setError(null);
            }
        }
    }
    protected               onblurparse()
    {
        try {
            if (this._value) {
                if (this._errormsg && this._errormsg.errorValue === this.getinputelm().prop("value")) {
                    return;
                }

                this.parseInput(false);
                this.setError(null);
            }
        } catch(e) {
            this.setError(e.message);
        }
    }
    protected               hasFocus(elm:any): boolean
    {
        let     e:Element|null|undefined;

        for (e = elm ; e instanceof Element && e !== document.body ; e = e.parentElement) {
            if (e === this._container.element || (this._activeDropdown && this._activeDropdown.container && e === this._activeDropdown.container.element))
                return true;
        }

        return false;
    }
}

//===================================== InputTextControl ==========================================
/**
 * !!DOC
 */

export type DropdownValues<TNative> = TNative | { value:TNative, text:string };
export type DropdownValuesList<TNative> = DropdownValues<TNative>[] | $JA.Task<DropdownValues<TNative>[]>;

export interface IInputControlDropdownValuesOptions<TNative> extends IInputControlOptions
{
    dropdown_values?:   () => DropdownValuesList<TNative>|null|undefined;
}

export abstract class InputTextValueDropdownControl<TNativeValue,
                                                    TValue extends $JT.SimpleType<TNativeValue,TInput>,
                                                    TInput extends InputTextValueDropdownControl<TNativeValue, TValue, TInput, TOpts>,
                                                    TOpts extends IInputControlDropdownValuesOptions<TNativeValue>>
                                                        extends InputTextControl<TNativeValue, TValue, TInput, TOpts>
{
                constructor(value:TValue, type:string, typeClass:string, opts:TOpts, dropdown?:boolean)
    {
        super(value, type, typeClass, opts, true);
    }

    protected   openDropdown()
    {
        if (this._value) {
            try {
                if (typeof this.opts.dropdown_values === 'function') {
                    this.focus();
                    this.setError(null);
                    this.getDropdown("jc3/jannesen.ui.select:ValuesDropdown", "-tablelist -valuedropdown", DropdownFocus.Yes);
                }
                else {
                    this.focus();
                    this.parseInput(false);
                    this.setError(null);
                    this.getDropdownStd();
                }
            } catch(e) {
                this.setError(e.message);
            }
        }
    }
    protected   dropdownValueSet(datavalue:TValue, value:TNativeValue)
    {
        datavalue.setValue(value, $JT.ChangeReason.UI);
    }

    protected abstract getDropdownStd():void;
}

export abstract class InputTextValuesDropdownControl<TNativeValue,
                                                     TValue extends $JT.SimpleType<TNativeValue, TInput>,
                                                     TInput extends InputTextValuesDropdownControl<TNativeValue, TValue, TInput, TOpts>,
                                                     TOpts extends IInputControlDropdownValuesOptions<TNativeValue>>
                                                        extends InputTextControl<TNativeValue, TValue, TInput, TOpts>
{
                constructor(value:TValue, type:string, typeClass:string, opts:TOpts, dropdown?:boolean)
    {
        super(value, type, typeClass, opts, dropdown || typeof opts.dropdown_values === 'function');
    }

    protected   openDropdown()
    {
        if (typeof this.opts.dropdown_values === 'function' && this._value) {
            try {
                this.focus();
                this.setError(null);
                this.getDropdown("jc3/jannesen.ui.select:ValuesDropdown", "-tablelist -valuedropdown", DropdownFocus.Yes);
            } catch(e) {
                this.setError(e.message);
            }
        }
    }
    protected   dropdownValueSet(datavalue:TValue, value:TNativeValue)
    {
        datavalue.setValue(value, $JT.ChangeReason.UI);
    }
}

//===================================== InputTextControl ==========================================
/**
 * !!DOC
 */
export interface IIntegerControlOptions extends IInputControlDropdownValuesOptions<number>
{
}

/**
 * !!DOC
 */
export class Integer extends InputTextValuesDropdownControl<number, $JT.Integer, Integer, IIntegerControlOptions>
{
    constructor(value:$JT.Integer, opts:IIntegerControlOptions) {
        super(value, "text", "-integer", opts);
    }

    protected   keyRemap(key: string) {
        if (key >= "0" && key <= "9")
            return key;

        switch (key) {
            case "-":
                return key;
        }

        return null;
    }
}

//===================================== Number ====================================================
/**
 * !!DOC
 */
export interface INumberControlOptions extends IInputControlDropdownValuesOptions<number>
{
}

/**
 * !!DOC
 */
export class Number extends InputTextValuesDropdownControl<number, $JT.Number, Number, INumberControlOptions>
{
    constructor(value:$JT.Number, opts:INumberControlOptions) {
        super(value, "text", "-number", opts);
    }

    protected   keyRemap(key: string) {
        if (key >= "0" && key <= "9")
            return key;

        switch(key) {
            case ".":
            case $JR.decimalPoint:
                return $JR.decimalPoint;
            case "-":
                return key;
            }

        return null;
    }
}

//===================================== String ====================================================
/**
 * !!DOC
 */
export interface IStringControlOptions extends IInputControlDropdownValuesOptions<string>
{
}

/**
 * !!DOC
 */
export class String extends InputTextValuesDropdownControl<string, $JT.String, String, IStringControlOptions>
{
    constructor(value:$JT.String, opts:IStringControlOptions) {
        super(value, ((value.Options & $JT.StringOptions.Password) ? "password" : "text"), "-string", opts);
    }

    protected       keyRemap(key: string) {
        if (this._value) {
            let charset = this._value.Charset;
            let options = this._value.Options;

            if ((options & $JT.StringOptions.LowerCase) && key >= "A" && key <= "Z") {
                key = key.toLowerCase();
            }

            if ((options & $JT.StringOptions.UpperCase) && key >= "a" && key <= "z") {
                key = key.toLocaleUpperCase();
            }

            if (!(charset instanceof RegExp) || charset.test(key)) {
                return key;
            }
        }

        return null;
    }

}

//===================================== StringMultiLine ===========================================
/**
 * !!DOC
 */
export interface IStringMultiLineControlOptions extends IInputControlOptions
{
    height?:    number|string;
}

/**
 * !!DOC
 */
export class StringMultiLine extends SimpleControl<$JT.StringMultiLine, IStringMultiLineControlOptions>
{
    protected   _text:      string|undefined;

    /**
     * !!DOC
     */
    constructor(value:$JT.StringMultiLine, opts:IStringMultiLineControlOptions) {
        super(opts);
        this._text = undefined;

        let textarea = <textarea type="text" class="jannesen-input -string -multiline" spellCheck={false} onblur={()=>{this._textarea_onblur();}} />;

        genericAttr(textarea, textarea, opts, value);

        if (opts.placeholder) {
            textarea.attr("placeholder", opts.placeholder);
        }
        if (opts.width) {
            textarea.css("width", opts.width);
        }
        if (opts.height) {
            textarea.css("height", opts.height);
        }

        this.setcontainer(textarea);
    }

    public          valueChanged(reason:$JT.ChangeReason, changed:boolean): void {
        if (this._value && (changed || this._container.prop("value") !== this._text)) {
            let vvalue = this._value.internalvalue;
            this._text = vvalue !== null ? this._value!.cnvValueToText(vvalue) : "";

            if (this._container.prop("value") !== this._text)
                this._container.prop("value", this._text);

            this.setError(null);
        }
    }

    public          parseInput(validate:boolean): void {
        if (this._value) {
            const text = this._container.prop("value");

            if (this._text !== text) {
                this._value.setValue((text === "" ? null : this._value.cnvTextToValue(text)), $JT.ChangeReason.UI);
            }
        }
    }

    public          getinputelm() {
        return this._container;
    }

    private         _textarea_onblur(): void {
        try {
            if (this._value) {
                this.parseInput(false);
            }
        } catch(e) {
            this.setError(e.message);
        }
    }
}

//===================================== Boolean ===================================================
/**
 * !!DOC
 */
export interface IBooleanControlOptions extends IInputControlOptions
{
    text?:  string;
}

/**
 * !!DOC
 */
export class Boolean extends SimpleControl<$JT.Boolean, IBooleanControlOptions>
{
    private _button:        $JD.DOMHTMLElement;

    constructor(value:$JT.Boolean, opts:IBooleanControlOptions) {
        super(opts);

        let container = <div class="jannesen-input -boolean"/>;
        let button:     $JD.DOMHTMLElement;

        if (typeof opts.text === "string") {
            container.appendChild(button = <span/>, <span class="-label">{ opts.text }</span>);
        } else {
            button = container;
        }

        button.attr("tabIndex",   opts.tabIndex || 0).addClass("-button");
        button.bind("keypress",   this._onKeyPress, this);
        container.bind("click",   this._onClick,    this);

        genericAttr(container, button, opts, value);

        this._button = button;
        this.setcontainer(container);
    }

    public      valueChanged(reason:$JT.ChangeReason): void {
        if (this._value && reason !== $JT.ChangeReason.UI) {
            this._setValue(this._value.internalvalue);
        }
        this.setError(null);
    }

    public      parseInput(validate:boolean): void {
        if (this._value) {
            let value = this._getValue();

            if (value !== this._value.internalvalue) {
                this._value.setValue(value, $JT.ChangeReason.UI);
                this.setError(null);
            }
        }
    }

    public      getinputelm() {
        return this._button;
    }

    private     _onClick(): void {
        if (!this.disabled) {
            this._setValueByUI(this._getValue() !== true);
        }
    }

    private     _onKeyPress(ev:KeyboardEvent):void {
        if (!(ev.metaKey || ev.altKey || ev.ctrlKey)) {
            switch(ev.key) {
            case  " ":
                this._onClick();
                break;
            case "j":
            case "y":
                this._setValueByUI(true);
                break;
            case "n":
            case "f":
                this._setValueByUI(false);
                break;
            }
        }
    }

    private     _getValue(): boolean|null {
        if (this._button.hasClass("-true")) return true;
        if (this._button.hasClass("-false")) return false;
        return null;
    }
    private     _setValueByUI(value: boolean) {
        this._setValue(value);

        if (this._value && value !== this._value.internalvalue) {
            this._value.setValue(value, $JT.ChangeReason.UI);
        }
    }
    private     _setValue(value: boolean|null) {
        if (value === true) {
            this._button.removeClass("-null").removeClass("-false").addClass("-true");
        }
        else if (value === false) {
            this._button.removeClass("-null").removeClass("-true").addClass("-false");
        }
        else {
            this._button.removeClass("-false").removeClass("-true").addClass("-null");
        }
    }
}

//===================================== Date ======================================================
/**
 * !!DOC
 */
export interface IDateControlOptions extends IInputControlDropdownValuesOptions<number>
{
}

/**
 * !!DOC
 */
export class Date extends InputTextValueDropdownControl<number, $JT.Date, Date, IDateControlOptions>
{
    constructor(value:$JT.Date, opts:IDateControlOptions) {
        super(value, "text", "-date", opts, true);
    }

    protected   defaultPlaceHolder(value:$JT.Date):string {
        return $JL.datePlaceHolder;
    }
    protected   keyRemap(key: string) {
        if ((key >= "0" && key <= "9") ||
            (key >= "A" && key <= "Z") ||
            (key >= "a" && key <= "z"))
            return key;

        switch(key) {
        case ".": // .
        case "-": // -
            return "/";

        case " ": //
        case "/": // /
            return key;
        }

        return null;
    }
    protected   getDropdownStd()
    {
        this.getDropdown("jc3/jannesen.ui.datetimepicker:DateInputDropdown", "-noscroll -date", DropdownFocus.Mandatory);
    }
}

//===================================== DateTime ==================================================
/**
 * !!DOC
 */
export interface IDateTimeControlOptions extends IInputControlOptions
{
}

/**
 * !!DOC
 */
export class DateTime extends InputTextValueDropdownControl<number, $JT.DateTime, DateTime, IDateTimeControlOptions>
{
    constructor(value:$JT.DateTime, opts:IDateTimeControlOptions) {
        super(value, "text", "-datetime", opts, true);
    }

    protected   getDropdownStd()
    {
        this.getDropdown("jc3/jannesen.ui.datetimepicker:DateTimeInputDropdown", "-noscroll -datetime", DropdownFocus.Mandatory);
    }
}

//===================================== Time ======================================================
/**
 * !!DOC
 */
export interface ITimeControlOptions extends IInputControlOptions
{
}

/**
 * !!DOC
 */
export class Time extends InputTextValueDropdownControl<number, $JT.Time, Time, ITimeControlOptions>
{
    constructor(value:$JT.Time, opts:ITimeControlOptions) {
        super(value, "text", "-time", opts, true);
    }

    protected   defaultPlaceHolder(value:$JT.Time):string|undefined {
        return $JR.timePlaceHolder(value.getTimeFormat());
    }
    protected   keyRemap(key: string) {
        if (this._value) {
            if (key >= "0" && key <= "9")
                return key;

            switch(key) {
            case "-":
                return key;

            case ".": {
                    const timeformat = this._value.getTimeFormat();
                    return (typeof timeformat === "string")    ? $JR.decimalPoint :
                           (timeformat === $J.TimeFormat.HMSF) ? "." : ":";
                }
            case ":": {
                    const timeformat = this._value.getTimeFormat();
                    if (typeof timeformat === "number")
                        return ":";
                }
                break;
            }
        }

        return null;
    }
    protected   getDropdownStd()
    {
        this.getDropdown("jc3/jannesen.ui.datetimepicker:TimeInputDropdown", "-noscroll -time", DropdownFocus.Mandatory);
    }
}

//===================================== SelectRadio ===============================================
/**
 * !!DOC
 */
export interface ISelectRadioControlOptions extends IInputControlOptions
{
}

/**
 * !!DOC
 */
export class SelectRadio<TNativeValue extends $JT.SelectValue, TDatasource extends $JT.SelectDatasource<TNativeValue,$JT.ISelectRecord>>
{
    protected   _value:         $JT.SelectType<TNativeValue, TDatasource>|undefined;
    protected   _keyvalue:      TNativeValue|null|undefined;
    protected   _buttons:       RadioButton<TNativeValue,TDatasource>[];
    protected   _disabled:      boolean;

    /**
     * !!DOC
     */
    public get  isVisible() : boolean
    {
        return false;
    }

    /**
     * !!DOC
     */
    public get  disabled() {
        return this._disabled;
    }
    public set  disabled(d:boolean) {
        this._disabled = !!d;

        for (let b of this._buttons) {
            b.disabled = d;
        }
    }


    constructor() {
        this._value    = undefined;
        this._keyvalue = undefined;
        this._buttons  = [];
        this._disabled = false;
    }

    /**
     * !!DOC
     */
    public get  value(): $JT.SelectType<TNativeValue, TDatasource>|undefined {
        return this._value;
    }

    /**
     * !!DOC
     */
    public      linkValue(value: $JT.SelectType<TNativeValue, TDatasource>): void {
        this._value = value;
        if (value) {
            this.valueChanged($JT.ChangeReason._linked);
        }
    }

    /**
     * !!DOC
     */
    public      valueChanged(reason:$JT.ChangeReason): void {
        if (this._value && reason !== $JT.ChangeReason.UI) {
            this._setValue(this._value.internalvalue);
        }
        this.setError(null);
    }

    /**
     * !!DOC
     */
    public      attrChanged(attrName: string): void {
    }


    /**
     * !!DOC
     */
    public      preValidate(): $JA.Task<unknown>|null {
        return null;
    }

    /**
     * !!DOC
     */
    public      setError(message: string|null): void {
        // TODO
    }

    /**
     * !!DOC
     */
    public      focus() {
        if (this._buttons.length > 0) {
            this._buttons[0].focus();
        }
    }

    public      getinputelm(): $JD.DOMHTMLElement
    {
        throw new $J.InvalidStateError("SelectRadio has no input element.");
    }

    public      getRadioButton(keyvalue:TNativeValue, text?:string): $JD.DOMHTMLElement {
        if (!this._value) {
            throw new $J.InvalidStateError("Control not linked to value.");
        }

        if (text === undefined) {
            text = this._value.toDisplayText(keyvalue, this._value.getrecordAsync(keyvalue, false));
        }

        let button = new RadioButton<TNativeValue,TDatasource>(this, keyvalue, text, keyvalue === this._keyvalue);

        this._buttons.push(button);

        return button.container;
    }

    /* @internal */ _onclick(keyvalue: TNativeValue) {
        if (this._value && keyvalue !== this._keyvalue) {
            this._setValue(keyvalue);
            this._value.setValue(keyvalue, $JT.ChangeReason.UI);
        }
    }

    /* @internal */ _button_ondestroy(button:RadioButton<TNativeValue,TDatasource>) {
        $J.removeItemFromArray(this._buttons, button);
    }

    private     _setValue(keyvalue: TNativeValue|null) {
        this._keyvalue = keyvalue;
        this._buttons.forEach((b) => b.setValue(keyvalue));
    }
}

/**
 * !!DOC
 */
export class RadioButton<TNativeValue extends $JT.SelectValue, TDatasource extends $JT.SelectDatasource<TNativeValue, $JT.ISelectRecord>> implements $JD.IDOMContainer {
    private _control:       SelectRadio<TNativeValue,TDatasource>|undefined;
    private _keyvalue:      TNativeValue;
    private _container:     $JD.DOMHTMLElement;
    private _button:        $JD.DOMHTMLElement;

    public get  container()
    {
        return this._container;
    }

    public get  disabled()
    {
        return this.container.disabled;
    }
    public set  disabled(d:boolean)
    {
        this.container.disabled = d;
    }


    constructor(control: SelectRadio<TNativeValue,TDatasource>, keyvalue: TNativeValue, text:string, checked:boolean) {
        let container = <div class="jannesen-input -radio"/>;
        let button:$JD.DOMHTMLElement;

        if (typeof text === 'string') {
            container.appendChild(button = <span/>, <span class="-label">{ text }</span>);
        }
        else {
            button = container;
        }

        button.attr("tabIndex",   0).addClass("-button");
        button.bind("keypress",   this._onKeyPress, this);
        container.bind("click",   this._onClick,    this);

        if (checked) {
            button.addClass("-checked");
        }

        container.bind("RemovedFromDocument", this._button_ondestroy, this);
        this._control   = control;
        this._keyvalue  = keyvalue;
        this._container = container;
        this._button    = button;
    }

    public      focus() {
        this._button.focus();
    }

    /* @internal */ setValue(keyvalue: TNativeValue|null) {
        this._button.toggleClass("-checked", keyvalue === this._keyvalue);
    }

    private _onKeyPress(ev:KeyboardEvent) {
        if (ev.key===" " && !(ev.metaKey || ev.ctrlKey || ev.altKey|| ev.shiftKey) && this._control) {
            this._control._onclick(this._keyvalue);
        }
    }

    private _onClick() {
        if (this._control && !this.disabled) {
            this._control._onclick(this._keyvalue);
            this.focus();
        }
    }

    private _button_ondestroy() {
        if (this._control) {
            this._control._button_ondestroy(this);
            this._control = undefined;
        }
    }
}

//===================================== SelectInput ==============================================
export type SelectInputContext = $J.IUrlArgsColl|null;
/**
 * !!DOC
 */
export interface ISelectInputControl<TNative extends $JT.SelectValue, TDatasource extends $JT.SelectDatasource<TNative,$JT.ISelectRecord>> extends $JT.IControlContainer<$JT.SelectType<TNative, TDatasource>>
{
}

/**
 * !!DOC
 */
export interface ISelectInputControlOptions<TNativeValue extends $JT.SelectValue, TDatasource extends $JT.SelectDatasource<TNativeValue,$JT.ISelectRecord>> extends IInputControlOptions
{
    filter?:                    (rec:$JT.TDatasource_Record<TDatasource>)=>(boolean|null|undefined);
    sort?:                      (rec1:$JT.TDatasource_Record<TDatasource>,rec2:$JT.TDatasource_Record<TDatasource>)=>number;
    fetchmax?:                  number;
    get_context?:               (ctl:SelectInput<TNativeValue,TDatasource>)=>SelectInputContext|undefined;
    simpleDropdown?:            boolean;
    simpleNulltext?:            string;
    dropdown_height?:           number;
    dropdown_columns?:          $JT.ISelectTypeAttributeDropdownColumn<$JT.TDatasource_Record<TDatasource>>[];
}

const enum SelectInputState
{
    ValueSetByCode = 0,
    ValueSetByUI,
    InputChanged,
    FindActive,
    FindFailed
}
/**
 * !!DOC
 */
export class SelectInput<TNativeValue extends $JT.SelectValue = $JT.SelectValue,
                         TDatasource extends $JT.SelectDatasource<TNativeValue, $JT.ISelectRecord> = $JT.SelectDatasource<TNativeValue, $JT.ISelectRecord>>
                extends InputTextControl<TNativeValue,
                                        $JT.SelectType<TNativeValue,TDatasource>,
                                        SelectInput<TNativeValue,TDatasource>,
                                        ISelectInputControlOptions<TNativeValue,TDatasource>,
                                        SelectDataSet<TNativeValue, TDatasource>,
                                        $JT.TDatasource_Record<TDatasource>|null,
                                        $JSELECT.SelectInputDropdown<TNativeValue,TDatasource>>
                implements ISelectInputControl<TNativeValue, TDatasource>
{
    private     _activetask:        $JA.Task<unknown>|undefined;
    private     _lookuptask:        $JA.Task<unknown>|undefined;
    private     _inputTimer:        number|undefined;
    private     _state:             SelectInputState;
    private     _stateContext:      SelectInputContext|undefined;
    private     _stateText:         string|undefined;
    private     _dataset:           SelectDataSet<TNativeValue, TDatasource>|undefined;


                    constructor(value:$JT.SelectType<TNativeValue,TDatasource>, opts:ISelectInputControlOptions<TNativeValue,TDatasource>) {
        super(value, "text", "-select", opts, (value.Datasource.flags & $JT.SelectDatasourceFlags.SearchFetch) === 0 || (value.Datasource.flags & $JT.SelectDatasourceFlags.SearchAll) !== 0, true);
        this.getinputelm().bind("input", this.input_textchange, this);
        this._activetask   = undefined;
        this._inputTimer   = undefined;
        this._state        = SelectInputState.ValueSetByCode;
        this._stateContext = undefined;
        this._stateText    = undefined;
        this._dataset      = undefined;
    }

    /**
     * set the input context.
     *
     * Input context is forwarded to the datasource to only return result in this context.
     * The context saved durring input (dropdown) and used when validating.
     * If the context is changed between input and validation a error is generated.
     * If the value is set from code this context === undefined and not used during validation.
     * Calling setContext set the context after the value is (restored) from code.
     *
     */
    public          setContext()
    {
        this._stateContext = (typeof this._opts.get_context === "function") ? this._opts.get_context(this) : null;
    }
    /**
     * Inform the input that the input context is changed.
     * @param setOnlyOne
     * as the dataset only contains 1 record then set this one value like user selected it.
     */
    public          contextChanged(setOnlyOne:boolean)
    {
        if (this._value) {
            if (this._state !== SelectInputState.ValueSetByCode || (this._value.internalvalue === null && setOnlyOne)) {
                const text = this._input.prop("value") as string;
                if (text !== '' || setOnlyOne) {
                    const inputContext = this._getContext();

                    if (typeof inputContext === 'object' && !$J.isEqual(this._stateContext, inputContext)) {
                        this._findContextChanged(text, inputContext, setOnlyOne);
                    }
                }
            }
        }
    }
    /**
     * This method is call from jannesen.datatype. not to by called from user code!
     */
    public          valueChanged(reason:$JT.ChangeReason, changed:boolean): void {
        this._stoptask();

        if (this._value) {
            const vvalue = this._value.internalvalue;
            const rec    = this._value.getrecordAsync(vvalue, true);

            if (rec instanceof $JA.Task) {
                this._input.prop("value", this._text = "loading. . .");
                this.container.addClass("-busy");
                this._lookuptask = rec;
                rec.then((data) => {
                             if (this._lookuptask === rec) {
                                 this._lookuptask = undefined;
                                 this.container.removeClass("-busy");
                                 if (this._value && vvalue === this._value.internalvalue) {
                                    this._input.prop("value", this._text = this._value.toDisplayText(vvalue, data));
                                 }
                             }
                         },
                         (err) => {
                             if (this._lookuptask === rec) {
                                 this._lookuptask = undefined;
                                 this.container.removeClass("-busy");
                                 if (this._value && vvalue === this._value.internalvalue) {
                                     this._input.prop("value", this._text = this._value.toDisplayText(vvalue, err));
                                 }
                             }
                         });
            }
            else {
                this._input.prop("value", this._text = this._value.toDisplayText(vvalue, rec));
            }
        } else {
            this._input.prop("value", this._text = "");
        }

        if (reason !== $JT.ChangeReason.UI) {
            this._state = SelectInputState.ValueSetByCode;
            this._stateContext = undefined;
            this._stateText = undefined;
            this.closeDropdown(true);
        }
        else {
            this._state = SelectInputState.ValueSetByUI;
            this._stateText = undefined;
        }

        this.setError(null);
    }
    /**
     * !!DOC
     */
    public          get_opts()
    {
        return this._opts;
    }
    /**
     * !!DOC
     */
    public          preValidate(): $JA.Task<unknown>|null
    {
        if (this._value) {
            this.closeDropdown(true);

            if (this._activetask) {
                return this._activetask;
            }

            let text = this._input.prop("value") as string;

            if (this._state !== SelectInputState.ValueSetByCode && text !== '') {
                const inputContext = this._getContext();
                if (typeof inputContext === 'object' &&
                    !(this._state === SelectInputState.ValueSetByUI && $J.isEqual(this._stateContext, inputContext)) &&
                    !(this._state === SelectInputState.FindFailed   && $J.isEqual(this._stateContext, inputContext) && this._stateText === text)) {
                    const t = this._findContextChanged(text, inputContext, false);
                    if (t) {
                        if (t.isPending) {
                            return t;
                        }
                        else {
                            text = this._input.prop("value") as string;
                        }
                    }
                }

                if (!(this._state === SelectInputState.ValueSetByUI && $J.isEqual(this._stateContext, inputContext))) {
                    throw new $J.FormatError($JL.input_incomplete);
                }
            }

            if (this._text !== text) {
                throw new $J.FormatError($JL.input_incomplete);
            }
        }

        return null;
    }

    /* @internal */ dropdownKeyDown(ev:KeyboardEvent) {
        if ((ev.key.length === 1 || (ev.key === 'Backspace' && !ev.shiftKey)) && !(ev.ctrlKey || ev.altKey || ev.metaKey) && !this.disableKeyboard()) {
            $J.runAsync(() => {
                            let input = this.getinputelm();
                            let v = input.prop("value") as string;

                            switch(ev.key) {
                            case 'Backspace':
                                if (v.length === 0) {
                                    return;
                                }

                                v = v.substr(0, v.length - 1);
                                break;

                            default:
                                if (v.length > 64) {
                                    return;
                                }

                                v = v + ev.key;
                                break;
                            }

                            input.prop("value", v);

                            this.input_textchange();
                        });
            return true;
        }

        return false;
    }

    public          disableKeyboard()
    {
        return !!this._opts.simpleDropdown && super.disableKeyboard();
    }
    protected       openDropdown() {
        this.focus();
        if (this._value) {
            if ((this._value.Datasource.flags & $JT.SelectDatasourceFlags.SearchFetch) !== 0) {
                const text = (this.getinputelm().prop("value") as string).trim();

                if (text.length > 0) {
                    this._getDropdown(DropdownFocus.Yes, (content) => content.Refresh(text));
                    return;
                }
            }

            if ((this._value.Datasource.flags & ($JT.SelectDatasourceFlags.StaticEnum|$JT.SelectDatasourceFlags.SearchAll)) !== 0) {
                this._getDropdown(DropdownFocus.Yes, (content) => content.RefrechAll());
            }
        }
    }
    protected       dropdownValueSet(datavalue:$JT.SelectType<TNativeValue,TDatasource>, rec:$JT.TDatasource_Record<TDatasource>, dropdown:$JPOPUP.DropdownPopup<TNativeValue, SelectInput<TNativeValue, TDatasource>, SelectDataSet<TNativeValue, TDatasource>, $JT.TDatasource_Record<TDatasource>|null, $JSELECT.SelectInputDropdown<TNativeValue,TDatasource>>)
    {
        this._setValueUI(rec, dropdown.Calldata);
    }

    protected       input_onblur(ev:FocusEvent) {
        this._inputTimerStop();

        if (this._container !== this._input) {
            this._container.removeClass("-focus");
        }

        if (!(ev && this.hasFocus(ev.relatedTarget as Element))) {
            let dataset:SelectDataSet<TNativeValue, TDatasource>|undefined;
            if (this._activeDropdown) {
                dataset = this._activeDropdown.Calldata;
                this.closeDropdown(false);
            }

            if (this._value && (this._state === SelectInputState.InputChanged || this._state === SelectInputState.FindFailed)) {
                const text = this.getinputelm().prop("value") as string;

                if (this._text !== text) {
                    if (text.trim() === "") {
                        this._setValueUI(null);
                    }
                    else {
                        if (!dataset) {
                            dataset = this._getDataset(this._getContext());
                        }

                        if (dataset && (this._state === SelectInputState.InputChanged || !$J.isEqual(this._stateContext, dataset!.InputContext))) {
                            this._state = SelectInputState.FindActive;
                            this._stateText = undefined;
                            this._runtask(dataset.FetchByText(text),
                                          (result) => {
                                              if (result) {
                                                  this._setValueUI(result, dataset);
                                              }
                                              else {
                                                  this._findFailed($JL.input_incomplete, dataset!.InputContext, text);
                                              }
                                          },
                                          (err) => {
                                              this._findFailed(err, dataset!.InputContext, text);
                                          });
                        }
                        else {
                            if (this._state !== SelectInputState.FindFailed) {
                                this._findFailed($JL.input_incomplete, dataset && dataset!.InputContext, text);
                            }
                        }
                    }
                }
            }

            this._dataset = undefined;
            $J.eventTrigger(this._eventHandlers, "blur", ev);
        }
    }
    protected       input_onkeydown(evt:KeyboardEvent) {
        if (!(evt.altKey || evt.ctrlKey || evt.metaKey)) {
            switch(evt.key) {
            case "ArrowDown":
            case "F4":
                if (this._inputTimer || this._activeDropdown) {
                    this._inputTimerStop();
                    this._updatedropdown(DropdownFocus.Yes);
                } else {
                    this.openDropdown();
                }
                break;

            case "Backspace":
            case "Delete":
                this.input_textchange();
                break;

            default:
                if (evt.key.length === 1) {
                    this.input_textchange();
                }
                break;
            }
        }
    }
    protected       input_textchange() {
        this._stoptask();
        this._inputTimerStop();
        this._state = SelectInputState.InputChanged;
        this._inputTimer = $J.setTimeout(() => {
                                            this._inputTimer = undefined;

                                            if (this._value) {
                                                if (this._activeDropdown && this._activeDropdown.Content) {
                                                    if ((this._activeDropdown.Content).LocalSearch((this.getinputelm().prop("value") as string).trim())) {
                                                        this._updatedropdown(DropdownFocus.No);
                                                        return ;
                                                    }
                                                }

                                                if (this._activeDropdown || this.getinputelm().prop("value") !== '') {
                                                    this._inputTimer = $J.setTimeout(() => {
                                                                                        this._inputTimer = undefined;
                                                                                        this._updatedropdown(DropdownFocus.No);
                                                                                     }, this._value.Datasource.flags & $JT.SelectDatasourceFlags.SearchAll ? 100 : 250);
                                                }
                                            }
                                        }, 100);
        this.setError(null);
    }

    private         _updatedropdown(focus:DropdownFocus) {
        if (this._value) {
            let text = (this.getinputelm().prop("value") as string).trim();

            if (text === "" && (this._value.Datasource.flags & ($JT.SelectDatasourceFlags.SearchFetch|$JT.SelectDatasourceFlags.SearchAll)) === $JT.SelectDatasourceFlags.SearchFetch) {
                this.closeDropdown(false);
                this._value.setValue(null, $JT.ChangeReason.UI);
            } else {
               this._getDropdown(focus, (content) => content.Refresh(text));
            }
        }
    }
    private         _getDropdown(focus:DropdownFocus, onready:(content:$JSELECT.SelectInputDropdown<TNativeValue,TDatasource>)=>void)
    {
        const dataset = this._getDataset(this._getContext());
        if (dataset) {
            this.getDropdown("jc3/jannesen.ui.select:SelectInputDropdown", "-tablelist -select", focus, dataset, onready);
        }
        else {
            this.closeDropdown(true);
        }
    }
    private         _getDataset(inputContext:SelectInputContext|undefined):SelectDataSet<TNativeValue, TDatasource>|undefined
    {
        if (typeof inputContext === 'object') {
            if (!(this._dataset && $J.isEqual(this._dataset.InputContext, inputContext))) {
                this._dataset = new SelectDataSet(this, inputContext);
            }

            return this._dataset;
        }

        return undefined;
    }
    private         _getContext()
    {
        if (typeof this._opts.get_context === "function") {
            try {
                const context = this._opts.get_context(this);
                if (context instanceof Object) {
                    return context;
                }
            } catch(err) {
            }
            return undefined;
        }
        return null;
    }
    private         _inputTimerStop()
    {
        if (this._inputTimer) {
            clearTimeout(this._inputTimer);
            this._inputTimer = undefined;
        }
    }
    private         _findContextChanged(text:string, inputContext:SelectInputContext|undefined, setOnlyOne:boolean)
    {
        const dataset = this._getDataset(inputContext);
        if (dataset) {
            this._state = SelectInputState.FindActive;
            return this._runtask(dataset.FetchContextChange(text, setOnlyOne),
                                    (result) => {
                                        if (result) {
                                            this._setValueUI(result, dataset);
                                        }
                                        else {
                                            this._findFailed(text !== '' ? $JL.input_incomplete : null, inputContext, text);
                                        }
                                    },
                                    (err) => {
                                        this._findFailed(err, inputContext, text);
                                    });
        }
    }
    private         _runtask<T>(task:$JA.Task<T>, onfulfilled:(value:T)=>void, onrejected?: (err:Error)=>void): $JA.Task<T>
    {
        if (task.isFulfilled) {
            onfulfilled(task.value);
        }
        else if (task.isRejected) {
            if (onrejected) {
                onrejected(task.reason);
            }
        }
        else {
            task = task.then((r) => {
                        if (this._activetask === task) {
                            this._stoptask();
                            onfulfilled(r);
                        }
                        return r;
                    },
                    (e) => {
                        if (this._activetask === task) {
                            this._stoptask();
                            if (onrejected) {
                                onrejected(e);
                            }
                        }
                        throw e;
                    });
            this._activetask = task;
            this.container.addClass("-busy");
        }

        return task;
    }
    private         _stoptask()
    {
        this._activetask = undefined;
        this._lookuptask = undefined;
        this.container.removeClass("-busy");
    }
    private         _setValueUI(rec:$JT.TDatasource_Record<TDatasource>|null, dataset?:SelectDataSet<TNativeValue, TDatasource>)
    {
        this._stoptask();

        if (rec && dataset) {
            const datasource = dataset.Datasource;

            if (datasource instanceof $JT.RemoteSelectDatasource) {
                datasource.addrecord(rec);
            }

            this._stateContext = dataset.InputContext;
        }
        else {
            this._stateContext = undefined;
        }

        if (this._value) {
            this._value.setValue(rec, $JT.ChangeReason.UI);
        }
    }
    private         _findFailed(err:Error|string|null, context:SelectInputContext|undefined, text:string)
    {
        this._state = SelectInputState.FindFailed;
        this._stateContext = context;
        this._stateText    = text;
        this.setError($JT.stringErrorToMessage(err));
    }
}

interface ISelectDataSetFetch<TRecord>
{
    ct:             $JA.Context|null;
    task:           $JA.Task<TRecord[]|string>;
    searchkeys?:    string|string[];
}

export class SelectDataSet<TNativeValue extends $JT.SelectValue,
                           TDatasource extends $JT.SelectDatasource<TNativeValue, $JT.ISelectRecord>>
{
    private     _value:                     $JT.SelectType<TNativeValue, TDatasource>;
    private     _datasource:                TDatasource;
    private     _inputContext:              SelectInputContext;
    private     _inputOpts:                 ISelectInputControlOptions<TNativeValue, TDatasource>;
    private     _columns:                   $JT.ISelectTypeAttributeDropdownColumn<$JT.TDatasource_Record<TDatasource>>[];
    private     _currectfetch:              ISelectDataSetFetch<$JT.TDatasource_Record<TDatasource>>|undefined;

    public get  Value()
    {
        return this._value;
    }
    public get  Datasource()
    {
        return this._datasource;
    }
    public get  InputContext()
    {
        return this._inputContext;
    }
    public get  Columns()
    {
        return this._columns;
    }

                constructor(input:SelectInput<TNativeValue, TDatasource>, inputContext:SelectInputContext)
    {
        if (!(input && input.value)) {
            throw new $J.InvalidStateError("Input/value not available.");
        }
        this._value        = input.value;
        this._datasource   = this._value.Datasource;
        this._inputContext = inputContext;
        this._inputOpts    = input.get_opts();
        this._columns      = input.get_opts().dropdown_columns || this._value.getAttr("dropdown_columns") as $JT.ISelectTypeAttributeDropdownColumn<$JT.TDatasource_Record<TDatasource>>[];
        this._currectfetch = undefined;
    }

    public      Fetch(text:string, maxrec?:number): $JA.Task<string|$JT.TDatasource_Record<TDatasource>[]>
    {
        try {
            text = $JSTRING.removeDiacritics(text.trim()).toUpperCase();

            if (!maxrec) {
                maxrec = this._inputOpts.fetchmax || 250;
            }

            if (this._datasource.flags & $JT.SelectDatasourceFlags.SearchFetch) {
                let searchkeys = SelectDataSet.normalizeSearchKeys(this._datasource.normalize_searchtext(text));

                if (searchkeys instanceof Array) {
                    searchkeys   = this._datasource.filter_searchtext(searchkeys);

                    if (this._currectfetch && SelectDataSet.hassearchdata(this._currectfetch.searchkeys, searchkeys) &&
                        ((this._currectfetch.task.isFulfilled && this._currectfetch.task.value instanceof Array) ||
                         $J.isEqual(this._currectfetch.searchkeys, searchkeys) )) {
                        return this._filterSortDataTask(this._currectfetch.task, text, maxrec!);
                    }

                    this._fetchDataStop();

                    if (searchkeys.length > 0 || (this._datasource.flags & $JT.SelectDatasourceFlags.SearchAll) !== 0) {
                        return this._filterSortDataTask(this._fetchDataAsync(searchkeys, maxrec), text, maxrec!);
                    } else {
                        return $JA.Task.resolve("NEEDS-MORE-KEYS");
                    }
                }
                else {
                    return this._filterSortDataTask((this._currectfetch && this._currectfetch.searchkeys === searchkeys)
                                                        ? this._currectfetch.task
                                                        : this._fetchDataAsync(searchkeys, maxrec),
                                                    undefined, 10000000);
                }
            }
            else {
                return this._filterSortDataTask(this._currectfetch ? this._currectfetch.task : this._fetchDataAsync(), text, maxrec!);
            }
        }
        catch (err) {
            return $JA.Task.reject(err);
        }
    }
    public      FetchAll(): $JA.Task<string|$JT.TDatasource_Record<TDatasource>[]>
    {
        return this._filterSortDataTask((this._currectfetch && this._currectfetch.searchkeys === undefined)
                                            ? this._currectfetch.task
                                            : this._fetchDataAsync(undefined, (this._datasource.flags & $JT.SelectDatasourceFlags.SearchFetch ? this._inputOpts.fetchmax || 250 : undefined)),
                                        undefined, 1000000);
    }
    public      FetchByText(text: string): $JA.Task<$JT.TDatasource_Record<TDatasource>|undefined>
    {
        return this.Fetch(text, 1)
                   .thenD((result) => {
                       if (result instanceof Array && result.length === 1) {
                           return result[0];
                       }
                   });
    }
    public      FetchContextChange(text:string, selectone:boolean): $JA.Task<$JT.TDatasource_Record<TDatasource>|undefined>
    {
        if (this._datasource.flags & $JT.SelectDatasourceFlags.SearchFetch) {
            return this.FetchByText(text);
        }
        else {
            text = $JSTRING.removeDiacritics(text.trim()).toUpperCase();
            return this.FetchAll()
                       .thenD((data) => {
                           data = this._filterSortData(data, this._inputOpts.filter, undefined, undefined, 1000000);
                           if (data instanceof Array) {
                               if (data.length === 1 && selectone) {
                                   return data[0];
                               }

                               if (text !== '') {
                                   const x = this._filterSortData(data, undefined, text, undefined, 1);
                                   if (x instanceof Array && x.length === 1) {
                                       return x[0];
                                   }
                               }
                           }
                       });
        }
    }
    public      LocalSearch(text:string)
    {
        if (this._currectfetch && this._currectfetch.task.isFulfilled) {
            if (this._datasource.flags & $JT.SelectDatasourceFlags.SearchFetch) {
                const keywords = this._datasource.normalize_searchtext($JSTRING.removeDiacritics(text.trim()).toUpperCase());
                return SelectDataSet.hassearchdata(this._currectfetch.searchkeys, SelectDataSet.normalizeSearchKeys(keywords));
            }
            else {
                return true;
            }
        }

        return false;
    }

    private     _fetchDataAsync(searchkeys?:string|string[], max?:number)
    {
        this._fetchDataStop();
        const ct   = new $JA.Context({ });
        const task = this._datasource.fetchdataAsync(ct, this._inputContext, searchkeys, max) as (/*TS Limit*/ $JA.Task<string|$JT.TDatasource_Record<TDatasource>[]>);

        this._currectfetch = { ct, task, searchkeys };

        return task;
    }
    private     _fetchDataStop()
    {
        if (this._currectfetch) {
            if (this._currectfetch.ct) {
                this._currectfetch.ct.stop();
            }
            this._currectfetch = undefined;
        }
    }

    private     _filterSortDataTask(task:        $JA.Task<string|$JT.TDatasource_Record<TDatasource>[]>,
                                    filterText:  string|undefined,
                                    maxrec:number)
    {
        return task.thenD((data) => this._filterSortData(data, this._inputOpts.filter, filterText, this._inputOpts.sort, maxrec));
    }

    private     _filterSortData(data:        string|$JT.TDatasource_Record<TDatasource>[],
                                filterFunc:  ((rec:$JT.TDatasource_Record<TDatasource>)=>(boolean|null|undefined))|undefined,
                                filterText:  string|undefined,
                                sortFunc:    ((rec1:$JT.TDatasource_Record<TDatasource>,rec2:$JT.TDatasource_Record<TDatasource>)=>number)|undefined,
                                maxrec:number)
    {
        if (typeof data === 'string') {
            return data;
        }

        const keys = filterText ? SelectDataSet.normalizeSearchKeys(filterText.split(' ')) : undefined;

        let rtn = [] as $JT.TDatasource_Record<TDatasource>[];

        for (const rec of data) {
            if ((!filterFunc || filterFunc(rec)) &&
                (!keys || this._recFilter(rec, keys))) {
                if (rtn.length >= maxrec) {
                    return "TOMANY-RESULTS";
                }

                rtn.push(rec);
            }
        }

        if (sortFunc) {
            rtn = rtn.sort(sortFunc);
        }

        return rtn;
    }
    private     _recFilter(rec:$JT.TDatasource_Record<TDatasource>, keys:string[])
    {
        for(let key of keys) {
            if (!(this._columns && this._columns.some((col) => SelectDataSet.containskey(SelectDataSet.columnText(rec, col.fieldname), key))) &&
                !SelectDataSet.containskey(this._value.toDisplayText((rec as ({readonly [key:string]:any}))[this._datasource.keyfieldname] as (TNativeValue|null|undefined), rec), key)) {
                return false;
            }
        }

        return true;
    }

    public  static  columnText<TRec extends { [key:string]:any }>(rec:TRec, field:$JT.TDatasource_FieldNames<TRec>|((rec:TRec)=>string))
    {
        if (typeof field === 'function') {
            return field(rec);
        }
        else {
            const v = (rec as any)[field];
            switch (typeof v) {
            case "string":      return v as string;
            case "number":      return v.toString();
            case "boolean":     return v ? "true":"false";
            default:
                if (v === null)
                    return null;

                return "???";
            }
        }
    }
    private static  normalizeSearchKeys(keys:string[]):string[];
    private static  normalizeSearchKeys(keys:string|string[]):string|string[];
    private static  normalizeSearchKeys(keys:string|string[]) {
        if (typeof keys === 'string') {
            return keys;
        }

        return keys.filter((k) => k.length > 0 && !keys.some((r) => r.length > k.length && r.startsWith(k)));
    }
    private static  hassearchdata(fd_searchtext:string|string[]|undefined, searchtext:string|string[])
    {
        if (typeof searchtext === 'string' && typeof fd_searchtext === 'string') {
            return fd_searchtext === searchtext;
        }

        if (searchtext instanceof Array && fd_searchtext instanceof Array) {
            for (let i = 0 ; i < fd_searchtext.length ; ++i) {
                let k = fd_searchtext[i];

                if (!(searchtext as string[]).some((s) => s.startsWith(k)))
                    return false;
            }

            return true;
        }

        return false;
    }
    private static  containskey(text:string|null, key:string)
    {
        if (typeof text === 'string') {
            text = $JSTRING.removeDiacritics(text).toUpperCase();

            let p = text.indexOf(key);
            if (p >= 0) {
                if (p === 0) {
                    return true;
                }

                if (/[A-Z0-9]/.test(key.charAt(0))) {
                    return /[^A-Z0-9]/.test(text.charAt(p-1));
                }
                else {
                    return true;
                }
            }
        }
        return false;
    }
}

//===================================== Popups ===================================================

export class ErrorMessage
{
    private     _inputelm:          $JD.DOMHTMLElement;
    private     _errorValue:        string;
    private     _message:           string;
    private     _popup:             $JPOPUP.Tooltip|undefined;

    public get      errorValue() {
        return this._errorValue;
    }
    public get      message() {
        return this._message;
    }

                    constructor (inputelm: $JD.DOMHTMLElement, message: string) {
        this._inputelm   = inputelm;
        this._errorValue = inputelm.prop('value');
        this._message    = message;
        inputelm.bind("focus", this._createPopup, this);
        inputelm.bind("blur",  this._removePopup, this);
        this._popup    = undefined;

        if (inputelm.element === document.activeElement) {
            this._createPopup();
        }
    }

    public          Remove() {
        this._inputelm.unbind("focus", this._createPopup, this);
        this._inputelm.unbind("blur",  this._removePopup, this);
        this._removePopup();
    }

    private         _createPopup() {
        if (!this._popup) {
            this._popup = new $JPOPUP.Tooltip(this._inputelm, this._message);
        }
    }
    private         _removePopup() {
        if (this._popup) {
            this._popup.Stop();
            this._popup = undefined;
        }
    }
}

//===================================== Set =======================================================
export interface ISetOptions<TSet extends $JT.Record<$JT.IFieldDef>|$JT.SimpleType<any>=$JT.Record<$JT.IFieldDef>>
{
    data:               $JT.Set<TSet>;
    container:          $JD.DOMHTMLElement;
    autoAddDel?:        boolean;
    itemClass?:         new (set:SetInput<TSet>, data:TSet, emptyNew:boolean) => SetItem<TSet>;
    itemConstructor?:   (rec:TSet, setItem:SetItem<TSet>) => $JD.DOMHTMLElement;
}

export class SetInput<TSet extends $JT.Record<$JT.IFieldDef>|$JT.SimpleType<any>> extends $JD.Container
{
    private             _data:          $JT.Set<TSet>;
    private             _autoAddDel:    boolean;
    private             _itemClass:     new (set:any, data:any, emptyNew:boolean) => SetItem<TSet>;
    private             _setItems:      SetItem<TSet>[];
    private             _newSetEntry:   SetItem<TSet>|null;

    public      get     autoAddDel() {
        return this._autoAddDel!;
    }

    public              constructor(attr:ISetOptions<TSet>) {
        super(attr.container);
        this._data        = attr.data;
        this._autoAddDel  = !!attr.autoAddDel;

        if (attr.itemClass) {
            this._itemClass = attr.itemClass;
        }
        else if (attr.itemConstructor) {
            const itemConstructor = attr.itemConstructor;
            this._itemClass = class extends SetItem<TSet> {
                                  public      constructDom(rec:TSet):$JD.DOMHTMLElement {
                                      return itemConstructor(rec, this);
                                  }
                              };
        }
        else {
            throw new $J.InvalidStateError("Missing itemClass or itemConstructor.");
        }

        this._setItems    = [];
        this._newSetEntry = null;

        attr.data.forEach((r) => {
            const item = new this._itemClass(this, r, false);
            this._container.appendChild(item.domElement);
            this._setItems.push(item);
        });

        this._container.bind("RemovedFromDocument", this._container_RemovedFromDocument, this);
        this._data.bind("added",   this._set_onAdded, this);
        this._data.bind("removed", this._set_onRemoved, this);

        if (this._autoAddDel) {
            this.addNewItem();
        }
    }

    public              addItem(setItem: SetItem<TSet>) {
        this._data.addItem(setItem.data);
    }
    public              removeItem(setItem: SetItem<TSet>) {
        const activeElement = $global.document.activeElement;
        if (activeElement instanceof HTMLElement && setItem.domElement.element.contains($global.document.activeElement)) {
            let form = $JD.getTabForm(setItem.domElement.element);
            if (form) {
                let f = $JD.nextTabStop(form, activeElement, false, setItem.domElement.element);
                if (!f) {
                    f = $JD.nextTabStop(form, activeElement, true, setItem.domElement.element);
                }
                if (f) {
                    f.focus();
                }
            }
        }

        this._data.removeItem(setItem.data);
    }

    public              addNewItem() {
        if (!this._newSetEntry) {
            this._newSetEntry = new this._itemClass(this, new this._data.ItemDef, true);
            this._container.appendChild(this._newSetEntry.domElement);
        }
    }

    private             _container_RemovedFromDocument() {
        this._data.unbind("added",   this._set_onAdded, this);
        this._data.unbind("removed", this._set_onRemoved, this);

        for (const item of this._setItems) {
            item.itemRemoved(false);
        }
    }
    private             _set_onAdded(ev:{ item:TSet, index: number}) {
        if (this._newSetEntry && this._newSetEntry.data === ev.item) {
            this._setItems.push(this._newSetEntry);
            this._newSetEntry.itemAdded();
            this._newSetEntry = null;
            this.addNewItem();
        }
        else {
            const item = new this._itemClass(this, ev.item, false);
            this._container.appendChild(item.domElement);
            this._setItems.push(item);
        }
    }
    private             _set_onRemoved(ev:{ item:TSet, index: number}) {
        const idx = this._findSetItemByDataItem(ev.item);
        if (idx >= 0) {
            const setItem = this._setItems[idx];
            setItem.itemRemoved(true);
            this._container.removeChild(setItem.domElement);
            this._setItems.splice(idx, 1);
        }
    }
    private             _findSetItemByDataItem(dataItem: TSet) {
        for (let idx = 0 ; idx < this._setItems.length ; ++idx) {
            if (this._setItems[idx].data === dataItem) {
                return idx;
            }
        }

        return -1;
    }
}

export abstract class SetItem<TSet extends $JT.Record<$JT.IFieldDef>|$JT.SimpleType<any>>
{
    private             _set:           SetInput<TSet>;
    private             _data:          TSet;
    private             _newitem:       boolean;
    private             _domElement:    $JD.DOMHTMLElement;
    private             _events:        $J.EventCollection;

    public  get         data() {
        return this._data;
    }
    public  get         newitem() {
        return this._newitem;
    }
    public  get         domElement() {
        return this._domElement;
    }

    protected get       events() {
        return this._events;
    }

    public              constructor(set:SetInput<TSet>, data:TSet, newitem:boolean) {
        this._set        = set;
        this._data       = data;
        this._newitem    = newitem;
        this._events     = new $J.EventCollection();
        this._domElement = this.constructDom(data);

        if (newitem) {
            this._domElement.addClass("jannesen-ui-setitem-new");
        }

        if (set.autoAddDel) {
            this._bindFields(data);
        }
    }

    public  abstract    constructDom(data:TSet): $JD.DOMHTMLElement;

    public              remove() {
        this._set.removeItem(this);
    }

    public              itemAdded() {
        this._newitem = false;
        this._domElement.removeClass("jannesen-ui-setitem-new");
    }
    public              itemRemoved(fromset:boolean) {
        this._events.unbindAll();
    }

    private             _bindFields(data:$JT.BaseType) {
        if (data instanceof $JT.SimpleType) {
            if (data.hasControl) {
                this._events.bind(data, "changed", this._onChanged, this);
            }
        }

        if (data instanceof $JT.Record) {
            for (var n of data.FieldNames) {
                this._bindFields(data.field(n));
            }
        }
    }
    private             _onChanged(reason:$JT.ChangeReason) {
        if (reason === $JT.ChangeReason.UI && this._set.autoAddDel) {
            try {
                if (this._newitem) {
                    if (this._hasValue(this._data)) {
                        this._set.addItem(this);
                    }
                }
                else {
                    if (!this._hasValue(this._data)) {
                        this.remove();
                    }
                }
            }
            catch (e) {
            }
        }
    }

    private             _hasValue(v: $JT.BaseType) {
        if (v instanceof $JT.SimpleType) {
            return (v.hasControl && v.hasValue);
        }

        if (v instanceof $JT.Record) {
            const fields = v.fields;
            if (fields) {
                for(var name in fields) {
                    if (fields.hasOwnProperty(name) && this._hasValue(fields[name])) {
                        return true;
                    }
                }
            }

            return false;
        }

        if (v instanceof $JT.Set) {
            for (var idx = 0 ; idx < v.count ; ++idx) {
                if (this._hasValue(v.item(idx))) {
                    return true;
                }
            }

            return false;
        }

        return false;
    }
}

//===================================== Helpers ===================================================
function genericAttr(container:$JD.DOMHTMLElement, node: $JD.DOMHTMLElement, opts: IControlOptions, value: $JT.BaseType) {
    if (opts.id) {
        node.attr("id", opts.id);
    }

    if (opts.name) {
        node.attr("name", opts.id);
    }

    if (opts.extClass) {
        container.addClass(opts.extClass);
    }

    let uiClass = value.UIClass;
    if (uiClass) {
        container.addClass(uiClass);
    }
}

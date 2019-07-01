/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J         from "jc3/jannesen";
import * as $JA        from "jc3/jannesen.async";
import * as $JD        from "jc3/jannesen.dom";
import * as $JT        from "jc3/jannesen.datatype";
import * as $JR        from "jc3/jannesen.regional";
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

/**
 * !!DOC
 */
export interface ISelectRadioControl<TNativeValue extends $JT.SelectValue, TDatasource extends $JT.SelectDatasource<TNativeValue, $JT.ISelectRecord>> extends $JT.IControl<$JT.SelectType<TNativeValue, TDatasource>>
{
    getRadioButton(key:TNativeValue, text?:string): $JD.DOMHTMLElement;
}

//===================================== SimpleControl =============================================
/**
 * !!DOC
 */
export abstract class SimpleControl<TValue extends $JT.SimpleType<any>,
                                    TOpts extends IControlOptions>
                                        implements $JT.IControlContainer<TValue>
{
    protected   _container!:    $JD.DOMHTMLElement;
    protected   _opts:          TOpts;
    protected   _value:         TValue|undefined;
    protected   _errormsg:      ErrorMessage|undefined;

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
    public      linkValue(value: TValue|undefined): void {
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
    public      preValidate()
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
     * !!DOC
     */
    public      focus() {
        this.getinputelm().focus();
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
    placeholder?: string;
}


/**
 * !!DOC
 */
export abstract class InputTextControl<TNativeValue,
                                       TValue extends $JT.SimpleType<TNativeValue>,
                                       TInput extends InputTextControl<TNativeValue, TValue, TInput, TOpts, TCalldata, TDropdown>,
                                       TOpts extends IInputControlOptions,
                                       TCalldata = void,
                                       TDropdown extends $JPOPUP.DropdownContent<TNativeValue, TInput, TCalldata> = $JPOPUP.DropdownContent<TNativeValue, TInput, TCalldata>>
                                            extends SimpleControl<TValue, TOpts>
                                            implements $JPOPUP.IControlDropdown<TNativeValue|null>
{
    protected   _input:             $JD.DOMHTMLElement;
    protected   _text:              string;
    protected   _activeDropdown:    $JPOPUP.DropdownPopup<TNativeValue, TInput, TCalldata, TNativeValue|null, TDropdown>|undefined;

                            constructor(value:TValue, type:string, typeClass:string, opts:TOpts, dropdown: boolean)
    {
        super(opts);


        let container:$JD.DOMHTMLElement;
        let input = <input type={type} spellCheck={false} />;

        input.bind("focus",   this.input_onfocus, this);
        input.bind("blur",    this.input_onblur,  this);
        input.bind("keydown", this.input_onkeydown,  this);

        if (this.keyRemap !== InputTextControl.prototype.keyRemap) {
            input.bind("keypress", this.input_onkeypress, this);
        }

        if (dropdown) {
            const dropdownctl = <span class="-dropdown-button" />;
            dropdownctl.bind("click", this.dropdown_click, this);
            container = <div>{ input }{ dropdownctl }</div>;
        }
        else {
            container = input;
        }

        container.addClass("jannesen-input").addClass(typeClass);
        if (dropdown) {
            container.addClass("-dropdown");
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

        if (opts.width) {
            container.css("width", opts.width);
        }

        if (dropdown) {
            if ($JD.body.hasClass("jannesen-ui-mobile")) {
                this.getinputelm().bind("click", this.dropdown_click, this);
            }

            if (this.disableKeyboard()) {
                this.getinputelm().attr("readonly", true).attr("tabIndex", 0);      // Don't use keyboard on mobile devices.
            }
        }

        this._input          = input;
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
    public                  dropdownClose(value:TNativeValue|null|undefined, ev:Event|undefined)
    {
        if (this._activeDropdown && this._input) {
            this.closeDropdown(true);

            if (value !== undefined) {
                const v = this.value;
                if (v) {
                    v.setValue(value, $JT.ChangeReason.UI);
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
    protected               getDropdown(dropdownClass: string|$JPOPUP.IDropdownConstructor<TNativeValue, TInput, TCalldata, TNativeValue|null, TDropdown>, className:string, focus:boolean, calldata:TCalldata, onready?:(content:TDropdown)=>void)
    {
        if (!(this._activeDropdown && this._activeDropdown.DropdownClass === dropdownClass && $J.isEqual(this._activeDropdown.Calldata, calldata))) {
            this.closeDropdown(false);
            this._activeDropdown  = new $JPOPUP.DropdownPopup(this as any /* Typing is ok */, this._input, dropdownClass, className, calldata);
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
                evt.preventDefault();
                evt.stopPropagation();
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
export interface IInputControlDropdownValuesOptions<TNative> extends IInputControlOptions
{
    dropdown_values?:   (context:$JA.Context) => TNative[] | $JA.Task<TNative[]>;
}

export abstract class InputTextValueDropdownControl<TNativeValue,
                                                    TValue extends $JT.SimpleType<TNativeValue>,
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
                this.focus();
                this.parseInput(false);
                this.setError(null);
                if (this.opts.dropdown_values) {
                    this.getDropdown("jc3/jannesen.ui.select:ValuesDropdown", "-tablelist -valuedropdown", true);
                }
                else {
                    this.getDropdownStd();
                }
            } catch(e) {
                this.setError(e.message);
            }
        }
    }

    protected abstract getDropdownStd():void;
}

export abstract class InputTextValuesDropdownControl<TNativeValue,
                                                     TValue extends $JT.SimpleType<TNativeValue>,
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
        if (this.opts.dropdown_values && this._value) {
            try {
                this.focus();
                this.parseInput(false);
                this.setError(null);
                this.getDropdown("jc3/jannesen.ui.select:ValuesDropdown", "-tablelist -valuedropdown", true);
            } catch(e) {
                this.setError(e.message);
            }
        }
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
            let text = this._container.prop("value");

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

        button.attr("tabIndex",   0).addClass("-button");
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
        this.getDropdown("jc3/jannesen.ui.datetimepicker:DateInputDropdown", "-date", true);
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
        this.getDropdown("jc3/jannesen.ui.datetimepicker:DateTimeInputDropdown", "-datetime", true);
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
                           (timeformat === $JT.TimeFormat.HMSF) ? "." : ":";
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
        this.getDropdown("jc3/jannesen.ui.datetimepicker:TimeInputDropdown", "-time", true);
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
export class SelectRadio<TNativeValue extends $JT.SelectValue, TDatasource extends $JT.SelectDatasource<TNativeValue,$JT.ISelectRecord>> implements ISelectRadioControl<TNativeValue,TDatasource>
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
    public      preValidate() {
        return null;
    }

    /**
     * !!DOC
     */
    public      setError(message: string|null): void {
        //!!TODO
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
export interface ISelectInputControlOptions<TNativeValue extends $JT.SelectValue, TDatasource extends $JT.SelectDatasource<TNativeValue,$JT.ISelectRecord>> extends IInputControlOptions
{
    filter?:                    (rec:$JT.TDatasource_Record<TDatasource>)=>(boolean|null|undefined);
    sort?:                      (rec1:$JT.TDatasource_Record<TDatasource>,rec2:$JT.TDatasource_Record<TDatasource>)=>number;
    fetchmax?:                  number;
    before_dropdown?:           (ctl:SelectInput<TNativeValue,TDatasource>)=>SelectInputContext|undefined;
    simpleDropdown?:            boolean;
    simpleNulltext?:            string;
    dropdown_height?:           number;
    dropdown_columns?:          $JT.ISelectTypeAttributeDropdownColumn[];
}

/**
 * !!DOC
 */
export class SelectInput<TNativeValue extends $JT.SelectValue,
                         TDatasource extends $JT.SelectDatasource<TNativeValue, $JT.ISelectRecord>>
                extends InputTextControl<TNativeValue, $JT.SelectType<TNativeValue,TDatasource>, SelectInput<TNativeValue,TDatasource>, ISelectInputControlOptions<TNativeValue,TDatasource>, SelectInputContext, $JSELECT.SelectInputDropdown<TNativeValue,TDatasource>>
{
    private     _activelookup:      $JA.Task<any>|undefined;
    private     _inputContext:      SelectInputContext|undefined;
    private     _inputTimer:        number|undefined;

                    constructor(value:$JT.SelectType<TNativeValue,TDatasource>, opts:ISelectInputControlOptions<TNativeValue,TDatasource>) {
        super(value, "text", "-select", opts, (value.Datasource.flags & $JT.SelectDatasourceFlags.SearchFetch) === 0 || (value.Datasource.flags & $JT.SelectDatasourceFlags.SearchAll) !== 0);
        this.getinputelm().bind("paste",   this.input_textchange, this);
        this.getinputelm().bind("cut",     this.input_textchange, this);
        this._activelookup = undefined;
        this._inputContext = undefined;
        this._inputTimer   = undefined;
    }

    public          valueChanged(reason:$JT.ChangeReason, changed:boolean): void {
        this._activelookup = undefined;

        if (this._value) {
            const vvalue = this._value.internalvalue;
            const rec    = this._value.getrecordAsync(vvalue, true);

            if (rec instanceof $JA.Task) {
                this._activelookup = rec;
                rec.then((data) => {
                             if (rec === this._activelookup) {
                                 this._activelookup = undefined;
                                 if (this._value && vvalue === this._value.internalvalue) {
                                     this._input.prop("value", this._text = this._value.toDisplayText(vvalue, data));
                                 }
                             }
                         },
                         (err) => {
                             if (rec === this._activelookup) {
                                 this._activelookup = undefined;
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
            this._inputContext = undefined;
            this.closeDropdown(true);
        }

        this.setError(null);
    }

    public          parseInput(validate:boolean): void {
        if (this._text !== this._input.prop("value") || (validate && !(this._inputContext===undefined || $J.isEqual(this._inputContext, this._getContext())))) {
            throw new $J.FormatError($JL.input_incomplete);
        }
    }

    public          get_opts()
    {
        return this._opts;
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

    public          dropdownClose(value:TNativeValue|null|undefined, ev:Event|undefined)
    {
        const activeDropdown = this._activeDropdown;
        if (activeDropdown && this._input) {
            super.dropdownClose(value, ev);
            if (value !== undefined) {
                this._inputContext = value !== null ? activeDropdown.Calldata : null;
            }
        }
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
                    this._getDropdown(true, (content) => content.Refresh(text));
                    return;
                }
            }

            if ((this._value.Datasource.flags & ($JT.SelectDatasourceFlags.StaticEnum|$JT.SelectDatasourceFlags.SearchAll)) !== 0) {
                this._getDropdown(true, (content) => content.Refresh(""));
            }
        }
    }
    protected       input_onblur(ev:FocusEvent) {
        this._inputTimerStop();

        if (this._container !== this._input) {
            this._container.removeClass("-focus");
        }

        if (!(ev && this.hasFocus(ev.relatedTarget as Element))) {
            if (this._activeDropdown) {
                this.closeDropdown(false);
            }

            if (this._value) {
                const text = this.getinputelm().prop("value") as string;

                if (this._text !== text) {
                    if (text.trim() === "") {
                        if (this._value.internalvalue !== null) {
                            this._value.setValue(null, $JT.ChangeReason.UI);
                        }
                    }

                    if (ev) {
                        this.onblurparse();
                    }
                }
            }
        }
    }
    protected       input_onkeydown(evt:KeyboardEvent) {
        if (!(evt.altKey || evt.ctrlKey || evt.metaKey)) {
            switch(evt.key) {
            case "ArrowDown":
            case "F4":
                evt.preventDefault();
                evt.stopPropagation();

                if (this._inputTimer || this._activeDropdown) {
                    this._inputTimerStop();
                    this._updatedropdown(true);
                } else {
                    this.openDropdown();
                }
                break;

            case "Backspace":
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
        this._inputTimerStop();
        this._inputTimer = $J.setTimeout(() => {
                                            this._inputTimer = undefined;

                                            if (this._value) {
                                                if (this._activeDropdown && this._activeDropdown.Content) {
                                                    if ((this._activeDropdown.Content).LocalSearch((this.getinputelm().prop("value") as string).trim())) {
                                                        this._updatedropdown(false);
                                                        return ;
                                                    }
                                                }

                                                this._inputTimer = $J.setTimeout(() => {
                                                                                    this._inputTimer = undefined;
                                                                                    this._updatedropdown(false);
                                                                                }, this._value.Datasource.flags & $JT.SelectDatasourceFlags.SearchAll ? 100 : 250);
                                            }
                                        }, 100);
        this.setError(null);
    }

    private         _updatedropdown(focus:boolean) {
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
    private         _getDropdown(focus:boolean, onready:(content:$JSELECT.SelectInputDropdown<TNativeValue,TDatasource>)=>void)
    {
        const context = this._getContext();

        if (typeof context === 'object') {
            this.getDropdown("jc3/jannesen.ui.select:SelectInputDropdown", "-tablelist -select", focus, context, onready);
        }
        else {
            this.closeDropdown(true);
        }
    }
    private         _getContext()
    {
        if (typeof this._opts.before_dropdown === "function") {
            try {
                const context = this._opts.before_dropdown(this);
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


//===================================== Set =======================================================
export interface ISetOptions<TSet extends $JT.Record|$JT.SimpleType<any>=$JT.Record>
{
    data:               $JT.Set<TSet>;
    container:          $JD.DOMHTMLElement;
    autoAddDel?:        boolean;
    itemClass?:         new (set:SetInput<TSet>, data:TSet, emptyNew:boolean) => SetItem<TSet>;
    itemConstructor?:   (rec:TSet, setItem:SetItem<TSet>) => $JD.DOMHTMLElement;
}

export class SetInput<TSet extends $JT.Record|$JT.SimpleType<any>> extends $JD.Container
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

export abstract class SetItem<TSet extends $JT.Record|$JT.SimpleType<any>>
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

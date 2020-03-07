/// <reference path="lib-ext.d.ts"/>
import * as $J    from "jc3/jannesen";

var ondomreadyHandlers:             $J.IEventWrapper[]|undefined  = [];
var onlocationhashchangeHandlers:   $J.IEventWrapper[]            = [];
var curlocationhash:                string|undefined;
var styleNameDefaultExt:            any = { "border-block-end-width": "px", "border-block-start-width": "px", "border-bottom-left-radius": "px", "border-bottom-right-radius": "px", "border-bottom-width": "px", "border-image-width": "px", "border-inline-end-width": "px", "border-inline-start-width": "px", "border-left-width": "px", "border-right-width": "px", "border-top-left-radius": "px", "border-top-right-radius": "px", "border-top-width": "px", "bottom": "px", "column-rule-width": "px", "column-width": "px", "font-size": "px", "height": "px", "left": "px", "letter-spacing": "px", "line-height": "px", "margin-bottom": "px", "margin-left": "px", "margin-right": "px", "margin-top": "px", "max-height": "px", "min-height": "px", "max-width":"px", "min-width":"px", "outline-width": "px", "padding-bottom": "px", "padding-left": "px", "padding-right": "px", "padding-top": "px", "right": "px", "top": "px", "width": "px", "z-index": "" } ;
var styleNameDefaultExtSet:         any = { "border-width": "px", "margin": "px", "padding": "px" };

type NodeFragment = (HTMLElement|Text)|(HTMLElement|Text)[];

/**
 * !!DOC
 */
export interface ISize
{
    width: number;
    height: number;
}

/**
 * !!DOC
 */
export interface IPosition
{
    top: number;
    left: number;
}

/**
 * !!DOC
 */
export interface IRect extends IPosition, ISize
{
}

/**
 * !!DOC
 */
export interface IClientRect extends IRect
{
    right:  number;
    bottom: number;
}

/**
 * !!DOC
 */
export interface ICssValues
{
    "border-block-end-width"?:      number;
    "border-block-start-width"?:    number;
    "border-bottom-left-radius"?:   number;
    "border-bottom-right-radius"?:  number;
    "border-bottom-width"?:         number;
    "border-image-width"?:          number;
    "border-inline-end-width"?:     number;
    "border-inline-start-width"?:   number;
    "border-left-width"?:           number;
    "border-right-width"?:          number;
    "border-top-left-radius"?:      number;
    "border-top-right-radius"?:     number;
    "border-top-width"?:            number;
    "bottom"?:                      number;
    "column-rule-width"?:           number;
    "column-width"?:                number;
    "font-size"?:                   number;
    "height"?:                      number;
    "left"?:                        number;
    "letter-spacing"?:              number;
    "line-height"?:                 number;
    "margin-bottom"?:               number;
    "margin-left"?:                 number;
    "margin-right"?:                number;
    "margin-top"?:                  number;
    "max-height"?:                  number;
    "min-height"?:                  number;
    "outline-width"?:               number;
    "padding-bottom"?:              number;
    "padding-left"?:                number;
    "padding-right"?:               number;
    "padding-top"?:                 number;
    "right"?:                       number;
    "top"?:                         number;
    "width"?:                       number;
    "z-index"?:                     number;
    [name:string]:                  string|number|undefined;
}
/**
 * !!DOC
 */
export interface IToDom
{
    toDom(): AddNode;
}

/**
 * !!DOC
 */
export interface IDOMContainer
{
    readonly container: AddNode;
}

/**
 * !!DOC
 */
export interface HTMLAttributes {
    accept?:                string;
    acceptCharset?:         string;
    accessKey?:             string;
    action?:                string;
    allowFullScreen?:       boolean;
    allowTransparency?:     boolean;
    alt?:                   string;
    async?:                 boolean;
    autoComplete?:          string;
    autoFocus?:             boolean;
    autoPlay?:              boolean;
    cellPadding?:           number | string;
    cellSpacing?:           number | string;
    charSet?:               string;
    checked?:               boolean;
    classID?:               string;
    class?:                 string;
    colSpan?:               number | string;
    cols?:                  number;
    content?:               string;
    contentEditable?:       boolean;
    contextMenu?:           string;
    controls?:              any;
    coords?:                string;
    crossOrigin?:           string;
    data?:                  string;
    dateTime?:              string;
    defaultChecked?:        boolean;
    defaultValue?:          string;
    defer?:                 boolean;
    dir?:                   string;
    disabled?:              boolean;
    download?:              any;
    draggable?:             boolean;
    encType?:               string;
    for?:                   string;
    form?:                  string;
    formAction?:            string;
    formEncType?:           string;
    formMethod?:            string;
    formNoValidate?:        boolean;
    formTarget?:            string;
    frameBorder?:           number | string;
    headers?:               string;
    height?:                number | string;
    hidden?:                boolean;
    high?:                  number;
    href?:                  string;
    hrefLang?:              string;
    htmlFor?:               string;
    httpEquiv?:             string;
    icon?:                  string;
    id?:                    string;
    label?:                 string;
    lang?:                  string;
    list?:                  string;
    loop?:                  boolean;
    low?:                   number;
    manifest?:              string;
    marginHeight?:          number;
    marginWidth?:           number;
    max?:                   number | string;
    maxLength?:             number;
    media?:                 string;
    mediaGroup?:            string;
    method?:                string;
    min?:                   number | string;
    multiple?:              boolean;
    muted?:                 boolean;
    name?:                  string;
    noValidate?:            boolean;
    open?:                  boolean;
    optimum?:               number;
    pattern?:               string;
    placeholder?:           string;
    poster?:                string;
    preload?:               string;
    radioGroup?:            string;
    readOnly?:              boolean;
    rel?:                   string;
    required?:              boolean;
    role?:                  string;
    rowSpan?:               number;
    rows?:                  number;
    sandbox?:               string;
    scope?:                 string;
    scoped?:                boolean;
    scrolling?:             string;
    seamless?:              boolean;
    selected?:              boolean;
    shape?:                 string;
    size?:                  number;
    sizes?:                 string;
    span?:                  number | string;
    spellCheck?:            boolean;
    src?:                   string;
    srcDoc?:                string;
    srcSet?:                string;
    start?:                 number;
    step?:                  number|string;
    style?:                 string;
    tabIndex?:              number|string;
    target?:                string;
    title?:                 string;
    type?:                  string;
    useMap?:                string;
    value?:                 string;
    width?:                 number|string;
    wmode?:                 string;

    onblur?:                EventHandler<FocusEvent>;
    onclick?:               EventHandler<MouseEvent>;
    onchange?:              EventHandler<Event>;
    oncontextmenu?:         EventHandler<PointerEvent>;
    ondblclick?:            EventHandler<MouseEvent>;
    onerror?:               EventHandler<Event>;
    onfocus?:               EventHandler<FocusEvent>;
    oninput?:               EventHandler<Event>;
    onkeydown?:             EventHandler<KeyboardEvent>;
    onkeypress?:            EventHandler<KeyboardEvent>;
    onkeyup?:               EventHandler<KeyboardEvent>;
    onload?:                EventHandler<Event>;
    onmousedown?:           EventHandler<MouseEvent>;
    onmouseenter?:          EventHandler<MouseEvent>;
    onmouseleave?:          EventHandler<MouseEvent>;
    onmousemove?:           EventHandler<MouseEvent>;
    onmouseout?:            EventHandler<MouseEvent>;
    onmouseover?:           EventHandler<MouseEvent>;
    onmouseup?:             EventHandler<MouseEvent>;
    onwheel?:               EventHandler<WheelEvent>;
    onscroll?:              EventHandler<UIEvent>;
    onselect?:              EventHandler<UIEvent>;
}

export interface EventHandler<T> {
    (event: T): void;
}

/**
 * !!DOC
 */
export interface AddArray extends Array<AddNode> {}
export type AddNode    = DOMHTMLElement|DOMText|IDOMContainer|IToDom|HTMLElement|string|DOMNodeList|AddArray|undefined|null|false;
export interface RemoveArray extends Array<RemoveNode> {}
export type RemoveNode = DOMHTMLElement|DOMText|IDOMContainer|HTMLElement|Node|DOMNodeList|RemoveArray|undefined|null;

/**
 * !!DOC
 */
export interface ISetSize
{
    setSize(size:ISize|undefined):void;
}

/**
 * !!DOC
 */
export function ImplementsSetSize(o: any): o is ISetSize
{
    return (o instanceof Object && typeof o.setSize === 'function');
}

/**
 * !!DOC
 */
export interface IShow
{
    show(f:boolean):void;
}

/**
 * !!DOC
 */
export function ImplementsShow(o: any): o is IShow
{
    return (o instanceof Object && typeof o.show === 'function');
}


interface DOMWindowEventMap extends WindowEventMap
{
    "focusin":              FocusEvent;
}
interface DOMDocumentEventMap
{
    "scroll":               UIEvent;
    "visibilitychange":     Event;
}
interface DOMElementEventMap
{
    "click":                      MouseEvent;
    "dblclick":                   MouseEvent;
    "mousedown":                  MouseEvent;
    "mouseenter":                 MouseEvent;
    "mouseleave":                 MouseEvent;
    "mousemove":                  MouseEvent;
    "mouseout":                   MouseEvent;
    "mouseover":                  MouseEvent;
    "mouseup":                    MouseEvent;
    "mousewheel":                 MouseWheelEvent;
    "touchend":                   TouchEvent;
    "touchmove":                  TouchEvent;
    "touchstart":                 TouchEvent;
    "wheel":                      WheelEvent;
    "blur":                       FocusEvent;
    "focus":                      FocusEvent;
    "focusin":                    FocusEvent;
    "focusout":                   FocusEvent;
    "keydown":                    KeyboardEvent;
    "keypress":                   KeyboardEvent;
    "keyup":                      KeyboardEvent;
    "animationstart":             AnimationEvent;
    "animationend":               AnimationEvent;
    "transitionend":              TransitionEvent;
    "paste":                      ClipboardEvent;
    "cut":                        ClipboardEvent;
    "contextmenu":                PointerEvent;
    "scroll":                     UIEvent ;
    "select":                     UIEvent;
    "change":                     Event;
    "error":                      Event;
    "input":                      Event;
    "load":                       Event;
    "AddedToDocument":            DOMHTMLElement;
    "RemovedFromDocument":        DOMHTMLElement;
}
//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export class DOMWindow implements $J.IEventSource
{
    private _window:    Window;
    private _events:    $J.IEventWrapper[];

    //-------------------------------------------constructor------------------------------------------------------
    /**
     * !!DOC
     */
    /* @internal */ constructor(win: Window)
    {
        this._window = win;
        this._events = [];
    }

    //-------------------------------------------properties------------------------------------------------------
    /**
     * !!DOC
     */
    public get size(): ISize
    {
        return  {
                    width:  this._window.innerWidth,
                    height: this._window.innerHeight
                };
    }

    /**
     * !!DOC
     */
    public get pageOffset(): IPosition
    {
        return  {
                    top:  this._window.pageYOffset,
                    left: this._window.pageXOffset
                };
    }

    //-------------------------------------------methods------------------------------------------------------
    /**
     * !!DOC
     */

    public bind<K extends keyof DOMWindowEventMap>(eventName: K, handler:(ev:DOMWindowEventMap[K]) => void, thisArg?:any, options?:AddEventListenerOptions): void;
    public bind(eventName:string, handler:(ev:any) => void, thisArg?:any, options?:AddEventListenerOptions): void
    {
        event_bind(this._window, this._events, eventName, handler, thisArg, options);
    }

    /**
     * !!DOC
     */
    public unbind(eventName: string, handler:(ev:any) => void, thisArg?:any): void
    {
        event_unbind(this._window, this._events, eventName, handler, thisArg);
    }
}

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export class DOMHTMLDocument implements $J.IEventSource
{
    private _document:  HTMLDocument;
    private _events:    $J.IEventWrapper[];

    //-------------------------------------------constructor------------------------------------------------------
    /**
     * !!DOC
     */
    /* @internal */ constructor(doc: HTMLDocument)
    {
        this._document = doc;
        this._events   = [];
    }

    //-------------------------------------------methods------------------------------------------------------
    /**
     * !!DOC
     */
    public bind<K extends keyof DOMDocumentEventMap>(eventName: K, handler:(ev:DOMDocumentEventMap[K]) => void, thisArg?:any, options?:AddEventListenerOptions): void;
    public bind(eventName: string, handler:(ev:any) => void, thisArg?:any, options?:AddEventListenerOptions): void
    {
        event_bind(this._document, this._events, eventName, handler, thisArg, options);
    }

    /**
     * !!DOC
     */
    public unbind(eventName: string, handler:(ev:any) => void, thisArg?:any): void
    {
        event_unbind(this._document, this._events, eventName, handler, thisArg);
    }

    /**
     * !!DOC
     */
    public selectAll(selector: string): DOMNodeList
    {
        return selectAll(this._document, selector);
    }
}

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export class DOMHTMLElement implements $J.IEventSource, ISetSize, IShow
{
    private     _element:           HTMLElement;
    private     _events:            $J.IEventWrapper[]|undefined;
    private     _customEvents:      $J.IEventHandlerCollection|undefined;

    //-------------------------------------------constructor------------------------------------------------------
    /**
     * !!DOC
     */
    /*@internal*/ constructor(elm:HTMLElement)
    {
        this._element = elm;
    }

    //-------------------------------------------properties------------------------------------------------------
    /**
     * !!DOC
     */
    public get element(): HTMLElement
    {
        return this._element;
    }

    /**
     * !!DOC
     */
    public get hasChildNodes(): boolean
    {
        return this._element.hasChildNodes();
    }

    /**
     * !!DOC
     */
    public get childNodesLength(): number
    {
        return this._element.childNodes.length;
    }

    /**
     * !!DOC
     */
    public get ownerDocument(): HTMLDocument|null
    {
        return this._element.ownerDocument;
    }

    /**
     * !!DOC
     */
    public get parent()
    {
        const p = this._element.parentElement;
        return p ? element(p) : null;
    }

    /**
     * !!DOC
     */
    public get offsetParent()
    {
        var p:HTMLElement = <HTMLElement>(this._element.offsetParent);

        if (this._element.ownerDocument) {
            while (p && p !== this._element.ownerDocument.body) {
                if (getElementComputedStylePropertyString(p, "position") !== "static")
                    return element(p);

                p = <HTMLElement>(p.offsetParent);
            }
        }

        /* tslint:disable:no-use-before-declare */
        return body;
    }

    /**
     * !!DOC
     */
    public get index(): number {
        var index = 0;
        let node: Element|null = this._element;

        while (node = node.previousElementSibling) {
            index++;
        }

        return index;
    }

    /**
     * !!DOC
     */
    public get defaultView(): Window
    {
        const doc = this._element.ownerDocument;
        if (!(doc && doc.defaultView)) {
            throw new $J.InvalidStateError("defaultView is null.");
        }

        return doc.defaultView;
    }

    /**
     * !!DOC
     */
    public get isVisible()
    {
        return elementIsVisible(this._element);
    }

    /**
     * !!DOC
     */
    public get isLive(): boolean {
        if (this._element.parentElement && this._element.ownerDocument && this._element.ownerDocument.defaultView) {
            if (this._element.ownerDocument.body.contains(this._element))
                return true;
        }

        return false;
    }

    /**
     * !!DOC
     */
    public get offset(): IPosition
    {
        var rect = this._element.getBoundingClientRect();
        return  {
                    left:   rect.left + this.defaultView.pageXOffset,
                    top:    rect.top  + this.defaultView.pageYOffset
                };
    }

    /**
     * !!DOC
     */
    public get clientRect(): IClientRect
    {
        let rect = this._element.getBoundingClientRect();

        if (!rect.hasOwnProperty("width"))
            rect = { left: rect.left, top: rect.top, height: rect.bottom - rect.top, width: rect.right - rect.left, right:rect.right, bottom:rect.bottom };

        return  rect;
    }

    /**
     * !!DOC
     */
    public get outerRect(): IClientRect
    {
        let rect = this._element.getBoundingClientRect();
        let style = this.defaultView.getComputedStyle(this._element);

        let rtn = {
                    left:   rect.left   - parseFloatUndefined(style.marginLeft),
                    top:    rect.top    - parseFloatUndefined(style.marginTop),
                    right:  rect.right  + parseFloatUndefined(style.marginRight),
                    bottom: rect.bottom + parseFloatUndefined(style.marginBottom)
                    } as IClientRect;

        rtn.height = rtn.bottom - rtn.top;
        rtn.width  = rtn.right  - rtn.left;

        return  rtn;
    }


    public get position(): IPosition
    {
        var rect = this._element.getBoundingClientRect();

        var rtn:IPosition = {
                                left:   rect.left - <number>getElementComputedStyleProperty(this._element, "margin-left", 0),
                                top:    rect.top  - <number>getElementComputedStyleProperty(this._element, "margin-top",  0)
                            };

        if (getElementComputedStylePropertyString(this._element, "position") !== "fixed") {
            var offsetParent = this.offsetParent;

            if (offsetParent) {
                var parentRect   = offsetParent._element.getBoundingClientRect();

                rtn.top  -= parentRect.top  + <number>getElementComputedStyleProperty(offsetParent._element, "border-top-width",  0);
                rtn.left -= parentRect.left + <number>getElementComputedStyleProperty(offsetParent._element, "border-left-width", 0);
            }
        }

        return rtn;
    }
    public set position(value: IPosition)
    {
        setElementStyleProperty(this._element, "position", "absolute");
        setElementStyleProperty(this._element, "top",      value.top);
        setElementStyleProperty(this._element, "left",     value.left);
    }

    /**
     * !!DOC
     */
    public get size(): ISize
    {
        return  {
                    width:  this._element.offsetWidth,
                    height: this._element.offsetHeight
                };
    }
    public setSize(size: ISize|undefined) {
        if (size instanceof Object) {
            setElementStyleProperty(this._element, "box-sizing", "border-box");
            setElementStyleProperty(this._element, "width",  size.width );
            setElementStyleProperty(this._element, "height", size.height);
        }
        else {
            setElementStyleProperty(this._element, "width",  undefined);
            setElementStyleProperty(this._element, "height", undefined);
        }
    }

    /**
     * !!DOC
     */
    public get outerSize(): ISize
    {
        var rtn: ISize =    {
                                width:  this._element.offsetWidth,
                                height: this._element.offsetHeight
                            };
        var style = this.defaultView.getComputedStyle(this._element);

        rtn.width  += parseFloatUndefined(style.marginLeft) + parseFloatUndefined(style.marginRight);
        rtn.height += parseFloatUndefined(style.marginTop)  + parseFloatUndefined(style.marginBottom);

        return rtn;
    }

    /**
     * !!DOC
     */
    public get children(): DOMHTMLElement[]
    {
        var rtn:DOMHTMLElement[] = [];

        var c = this._element.childNodes;

        for (var n = 0 ; n < c.length ; ++n) {
            if (c[n].nodeType === 1)
                rtn.push(element(<HTMLElement>c[n]));
        }

        return rtn;
    }

    /**
     * !!DOC
     */
    public get  disabled()
    {
        return typeof this._element.getAttribute('disabled') === 'string';
    }
    public set  disabled(d:boolean)
    {
        if (d) {
            this._element.setAttribute('disabled', '1');
        }
        else {
            this._element.removeAttribute('disabled');
        }
    }

    /**
     * !!DOC
     */
    public childNodes(idx:number): DOMHTMLElement
    {
        if (idx>=0 && idx < this._element.childNodes.length) {
            let node = this._element.childNodes[idx];

            if (node.nodeType === 1)
                return element(node as HTMLElement);
        }

        throw new $J.InvalidStateError("child index out pf range.");
    }

    //-------------------------------------------methods------------------------------------------------------
    /**
     * !!DOC
     */
    public addClass(className:string): DOMHTMLElement
    {
        if (className.indexOf(" ") >= 0) {
            for (let cn of className.split(' ')) {
                if (cn.length > 0) {
                    this._element.classList.add(cn);
                }
            }
        }
        else {
            this._element.classList.add(className);
        }
        return this;
    }

    /**
     * !!DOC
     */
    public removeClass(className:string): DOMHTMLElement
    {
        this._element.classList.remove(className);
        return this;
    }

    /**
     * !!DOC
     */
    public toggleClass(className:string, state?:boolean): DOMHTMLElement
    {
        if (state === undefined) {
            state = !this.hasClass(className);
        }
        if (state)
            this.addClass(className);
        else
            this.removeClass(className);

        return this;
    }

    /**
     * !!DOC
     */
    public hasClass(className:string): boolean
    {
        return this._element.classList.contains(className);
    }

    /**
     * !!DOC
     */
    public css(propertyName:string): string|number;
    public css(propertyname:"animation"): string;
    public css(propertyname:"animation-delay"): string;
    public css(propertyname:"animation-duration"): string;
    public css(propertyName:"border-block-end-width"): number;
    public css(propertyName:"border-block-start-width"): number;
    public css(propertyName:"border-bottom-left-radius"): number;
    public css(propertyName:"border-bottom-right-radius"): number;
    public css(propertyName:"border-bottom-width"): number;
    public css(propertyName:"border-image-width"): number;
    public css(propertyName:"border-inline-end-width"): number;
    public css(propertyName:"border-inline-start-width"): number;
    public css(propertyName:"border-left-width"): number;
    public css(propertyName:"border-right-width"): number;
    public css(propertyName:"border-top-left-radius"): number;
    public css(propertyName:"border-top-right-radius"): number;
    public css(propertyName:"border-top-width"): number;
    public css(propertyName:"bottom"): number;
    public css(propertyName:"column-rule-width"): number;
    public css(propertyName:"column-width"): number;
    public css(propertyName:"font-size"): number;
    public css(propertyName:"height"): number;
    public css(propertyName:"left"): number;
    public css(propertyName:"letter-spacing"): number;
    public css(propertyName:"line-height"): number;
    public css(propertyName:"margin-bottom"): number;
    public css(propertyName:"margin-left"): number;
    public css(propertyName:"margin-right"): number;
    public css(propertyName:"margin-top"): number;
    public css(propertyName:"max-height"): number;
    public css(propertyName:"min-height"): number;
    public css(propertyName:"outline-width"): number;
    public css(propertyName:"padding-bottom"): number;
    public css(propertyName:"padding-left"): number;
    public css(propertyName:"padding-right"): number;
    public css(propertyName:"padding-top"): number;
    public css(propertyName:"right"): number;
    public css(propertyName:"top"): number;
    public css(propertyName:"width"): number;
    public css(propertyName:"z-index"): number;
    public css(propertyName:"transition"): string;
    public css(propertyName:"transition-property"): string;
    public css(propertyName:"transition-duration"): string;
    public css(propertyName:string, value?:string|number): this;
    public css(propertyName:string[]): ICssValues;
    public css(propertyName:Object): this;
    public css(propertyName:any, value?:string|number): any
    {
        if (typeof propertyName === "string") {
            if (arguments.length === 1) {
                return getElementComputedStyleProperty(this._element, propertyName, null);
            }

            if (arguments.length >= 2) {
                setElementStyleProperty(this._element, propertyName, value);
                return this;
            }
        }

        if (Array.isArray(propertyName)) {
            return getElementComputedStyleProperties(this._element, propertyName as string[]);
        }

        if (propertyName instanceof Object) {
            for (var key in propertyName) {
                if (propertyName.hasOwnProperty(key))
                    setElementStyleProperty(this._element, key, propertyName[key]);
            }

            return this;
        }

        return this;
    }

    /**
     * !!DOC
     */
    public attr(attrName:string):string;
    public attr(attrName:string, value:string|number|boolean|undefined):DOMHTMLElement;
    public attr(attrName:any):any;
    public attr(attrName:string|any, value?:string|number|boolean): any
    {
        if (typeof attrName === "string" && arguments.length === 1) {
            let v = this._element.getAttribute(attrName);

            if (!(v === undefined || v === null || v === "") || this._element.hasAttribute(attrName))
                return v;

            return undefined;
        }

        if (arguments.length >= 2) {
            setElementAttribute(this._element, attrName, value);
            return this;
        }

        if (attrName instanceof Object) {
            for (var key in attrName) {
                if (attrName.hasOwnProperty(key))
                    setElementAttribute(this._element, key, attrName[key]);
            }

            return this;
        }

        return this;
    }

    /**
     * !!DOC
     */
    public prop(propName:string): any;
    public prop(propName:string, value:any): DOMHTMLElement;
    public prop(propName:any): any;
    public prop(propName:string|any, value?:any): any
    {
        if (typeof propName === "string" && arguments.length === 1) {
            return (<any>this._element)[propName];
        }

        if (typeof propName === "string" && arguments.length >= 2) {
            (<any>this._element)[propName] = value;
            return this;
        }

        if (propName instanceof Object) {
            for (var key in propName) {
                if (propName.hasOwnProperty(key))
                    (<any>this._element)[key] = propName[key];
            }

            return this;
        }

        return this;
    }

    /**
     * !!DOC
     */
    public empty(): DOMHTMLElement
    {
        let childs:HTMLElement[] = [];

        if (this.isLive) {
            for (var n = 0 ; n < this._element.childNodes.length ; ++n) {
                if (this._element.childNodes[n].nodeType === 1)
                    childs.push(<HTMLElement>this._element.childNodes[n]);
            }
        }

        this._element.innerHTML = "";
        domelement_addremove_node(childs, false);

        return this;
    }

    /**
     * !!DOC
     */
    public html(): string;
    public html(value:string): DOMHTMLElement;
    public html(value?:string): any
    {
        if (arguments.length >= 1) {
            this._element.innerHTML = <string>value;
            return this;
        }

        return this._element.innerHTML;
    }

    /**
     * !!DOC
     */
    public text(): string;
    public text(value:string): DOMHTMLElement;
    public text(value?:string): any
    {
        if (arguments.length >= 1) {
            this._element.textContent = <string>value;
            return this;
        }

        return this._element.textContent;
    }

    /**
     * !!DOC
     */
    public appendChild(...children:AddNode[]): DOMHTMLElement
    {
        var f = insertHelperArray(arguments);
        if (f !== null) {
            this._element.appendChild(insertFragment(f));
            if (this.isLive) {
                domelement_addremove_node(f, true);
            }
        }

        return this;
    }

    /**
     * !!DOC
     */
    public prependChild(...children: AddNode[]): DOMHTMLElement
    {
        var f = insertHelperArray(arguments);
        if (f !== null) {
            this._element.insertBefore(insertFragment(f), this._element.firstChild);
            if (this.isLive) {
                domelement_addremove_node(f, true);
            }
        }

        return this;
    }

    /**
     * !!DOC
     */
    public replaceChild(newChild: DOMHTMLElement, oldChild: DOMHTMLElement):  DOMHTMLElement{
        if (oldChild !== null && newChild !== null && oldChild._element !== null && newChild._element !== null) {
            this._element.replaceChild(newChild._element, oldChild._element);
            if (this.isLive) {
                domelement_addremove_node(oldChild._element, false);
                domelement_addremove_node(newChild._element, true);
            }
        }
        else {
            if (oldChild !== null && oldChild._element !== null) {
                this._element.removeChild(oldChild._element);
                if (this.isLive) {
                    domelement_addremove_node(oldChild._element, false);
                }
            }
            if (newChild !== null && newChild._element !== null) {
                this._element.appendChild(newChild._element);
                if (this.isLive) {
                    domelement_addremove_node(newChild._element, true);
                }
            }
        }

        return this;
    }

    /**
     * !!DOC
     */
    public removeChild(...children:RemoveNode[]): DOMHTMLElement
    {
        for (var a = 0 ; a < arguments.length ; ++a) {
            var child = arguments[a];

            if (Array.isArray(child)) {
                for (var n = 0 ; n < child.length ; ++n)
                    this.removeChild(child[n]);
            }
            else
            if (child instanceof Object) {
                if (child instanceof DOMHTMLElement) {
                    if (child._element !== null) {
                        this._element.removeChild((<any>child)._element);
                        if (this.isLive) {
                            domelement_addremove_node((<any>child)._element, false);
                        }
                    }
                }
                else
                if (child instanceof DOMText) {
                    if ((<any>child)._element !== null) {
                        this._element.removeChild((<any>child)._element);
                    }
                }
                else
                if (child instanceof DOMNodeList) {
                    this.removeChild((<DOMNodeList>child)._elements);
                }
                else
                if (child.container instanceof Object) {
                    this.removeChild(child.container);
                }
                else
                if (child.nodeType === 1 || child.nodeType === 3) {
                    this._element.removeChild(child);
                    if (this.isLive) {
                        domelement_addremove_node(child, false);
                    }
                }
            }
        }

        return this;
    }

    /**
     * !!DOC
     */
    public insertBefore(...children:AddNode[]): DOMHTMLElement
    {
        var f = insertHelperArray(arguments);
        if (f !== null) {
            const p = this._element.parentNode;

            if (!p)
                throw new $J.InvalidStateError("Element has no parent element");

            p.insertBefore(insertFragment(f), this._element);
            if (this.isLive) {
                domelement_addremove_node(f, true);
            }
        }

        return this;
    }

    /**
     * !!DOC
     */
    public insertAfter(...children:AddNode[]): DOMHTMLElement
    {
        var f = insertHelperArray(arguments);
        if (f !== null) {
            const p = this._element.parentNode;
            if (!p)
                throw new $J.InvalidStateError("Element has no parent element");

            p.insertBefore(insertFragment(f), this._element.nextSibling);
            if (this.isLive) {
                domelement_addremove_node(f, true);
            }
        }

        return this;
    }

    /**
     * !!DOC
     */
    public appendElement(tagName:string, attrs?:HTMLAttributes, ...children:AddNode[]): DOMHTMLElement
    {
        var e = createElement.apply(this, arguments as any /* typescript can't correctly check arguments */);
        this.appendChild(e);
        return e;
    }

    /**
     * !!DOC
     */
    public focus(): DOMHTMLElement
    {
        this._element.focus();
        return this;
    }

    /**
     * !!DOC
     */
    public show(y: boolean): DOMHTMLElement
    {
        this._element.style.display = (y ? "" : "none");
        return this;
    }

    /**
     * !!DOC
     */
    public contains(elm:DOMHTMLElement|Element|undefined|null):boolean
    {
        return elm ? this._element.contains((elm instanceof DOMHTMLElement) ? elm._element : elm) : false;
    }


    /**
     * !!DOC
     */
    public data<T>(name:string): T;
    public data<T=any>(name:string, value:T): DOMHTMLElement;
    public data(name:string, value?:any): any|DOMHTMLElement
    {
        if (arguments.length >= 2) {
            this.pinElement();

            (<any>this)[name] = value;
            return this;
        }

        return (<any>this)[name];
    }

    /**
     * !!DOC
     */
    public bind<K extends keyof DOMElementEventMap>(eventName: K, handler:(ev:DOMElementEventMap[K]) => void, thisArg?:any, options?:AddEventListenerOptions): void;
    public bind(eventName: string, handler:(ev:any) => void, thisArg?:any, options?:AddEventListenerOptions): void
    {
        switch(eventName) {
        case "AddedToDocument":
        case "RemovedFromDocument":
            if (!this._customEvents) {
                this.pinElement();
                this._customEvents = {};
            }
            $J.eventBind(this._customEvents, eventName, handler, thisArg);
            break;

        default:
            if (!this._events) {
                this.pinElement();
                this._events = [];
            }
            event_bind(this._element, this._events, eventName, handler, thisArg, options);
            break;
        }
    }

    /**
     * !!DOC
     */
    public unbind(eventName: string, handler:(ev:any) => void, thisArg?:any): void
    {
        switch(eventName) {
        case "AddedToDocument":
        case "RemovedFromDocument":
            $J.eventUnbind(this._customEvents, eventName, handler, thisArg);
            break;

        default:
            event_unbind(this._element, this._events, eventName, handler, thisArg);
            break;
        }
    }

    /**
     * !!DOC
     */
    public select(selector: string)
    {
        return select(this._element, selector);
    }

    /**
     * !!DOC
     */
    public selectAll(selector: string): DOMNodeList
    {
        return selectAll(this._element, selector);
    }

    /**
     * !!DOC
     */
    public pinElement()
    {
        if ((<any>this._element)._jannesenuipin !== this)
            (<any>this._element)._jannesenuipin = this;
    }

    /* @internal */ _onaddremovefromdocument(added:boolean)
    {
        if (this._customEvents) {
            $J.eventTrigger(this._customEvents, added ? 'AddedToDocument' : 'RemovedFromDocument', this);
        }
    }
}

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export class DOMText
{
    private     _element: Text;

    //-------------------------------------------constructor------------------------------------------------------
    /**
     * !!DOC
     */
    /*@internal*/   constructor(elm:Text)
    {
        this._element = elm;
    }

    //-------------------------------------------properties------------------------------------------------------
    /**
     * !!DOC
     */
    public get  text() : string
    {
        const v = this._element.nodeValue;
        return typeof v === "string" ? v : "";
    }
    public set  text(txt : string)
    {
        this._element.nodeValue = txt;
    }
}

//-------------------------------------------------------------------------------------------------
export class DOMNodeList
{
    /*internal*/public  _elements:      (DOMHTMLElement|HTMLElement|Node)[];

    /**
     * !!DOC
     */
    /*@internal*/   constructor(...elm: (DOMHTMLElement|HTMLElement|Node)[]) {
        this._elements = elm;
    }

    /**
     * !!DOC
     */
    public  get length(): number {
        return this._elements.length;
    }

    /**
     * !!DOC
     */
    public  element(idx: number): DOMHTMLElement {
        if (idx<0 || idx >= this._elements.length) {
            throw new RangeError("idx out of range.");
        }

        let e = this._elements[idx];

        if (!(e instanceof DOMHTMLElement || e instanceof DOMText)) {
            this._elements[idx] = e = element(<HTMLElement>e);
        }

        return <DOMHTMLElement>e;
    }

    /**
     * !!DOC
     */
    public  getElements(): DOMHTMLElement[] {
        for (let i = 0 ; i < this._elements.length ; ++i) {
            let e = this._elements[i];
            if (!(e instanceof DOMHTMLElement || e instanceof DOMText)) {
                this._elements[i] = element(<HTMLElement>e);
            }
        }

        return <DOMHTMLElement[]>(this._elements);
    }

    /**
     * !!DOC
     */
    public  addNode(node:DOMHTMLElement|Element|DOMHTMLElement[]|Element[]): void {
        if (node === null && node === undefined) {
            return ;
        }

        if (Array.isArray(node)) {
            for (let i = 0 ; i < node.length ; ++i) {
                this.addNode(node[i]);
            }
            return;
        }

        this._elements.push(node as (DOMHTMLElement|Element));
    }

    /**
     * !!DOC
     */
    public  addNodeList(nodeList: NodeListOf<Element>): void {
        for (let i = 0 ; i < nodeList.length ; ++i) {
            this.addNode(nodeList.item(i));
        }
    }

    /**
     * !!DOC
     */
    public  byClass(className: string): DOMHTMLElement|null {
        for (let i = 0 ; i < this._elements.length ; ++i) {
            let elm = this.element(i);
            if (elm.hasClass(className)) {
                return elm;
            }

            let e = elm.element.querySelector("." + className);
            if (e) {
                return element(<HTMLElement>e);
            }
        }

        return null;
    }

    /**
     * !!DOC
     */
    public  byClassAll(className: string): DOMNodeList {
        let rtn = new DOMNodeList();

        for (let i = 0 ; i < this._elements.length ; ++i) {
            let elm = this.element(i);
            if (elm.hasClass(className)) {
                rtn.addNode(elm);
            }

            rtn.addNodeList(elm.element.querySelectorAll("." + className));
        }

        return rtn;
    }

    /**
     * !!DOC
     */
    public  forEach(callback: (elm:DOMHTMLElement, idx:number)=>void): void {
        this.getElements().forEach(callback);
    }

    /**
     * !!DOC
     */
    public  show(visible:boolean): void {
        this.forEach((n) => n.show(visible));
    }
}

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export abstract class Container extends $J.EventHandling implements IDOMContainer
{
    protected   _container: DOMHTMLElement;

    public get  container() {
        return this._container;
    }

    public      constructor(container: DOMHTMLElement)   {
        super();
        this._container = container;
    }

    protected   _applyAttr(attrs?:any, ...attrNames:string[]) {
        if (attrs instanceof Object) {
            for (let attrName of attrNames) {
                if (attrs.hasOwnProperty(attrName)) {
                    let attrValue = (attrs as any)[attrName];

                    if (attrName.startsWith("on")) {
                        if (typeof attrValue === "function") {
                            this.bind(attrName.substr(2), attrValue);
                        }
                    } else {
                        (this as any)[attrName] = attrValue;
                    }
                }
            }
        }
    }
}

//-------------------------------------------------------------------------------------------------
// static methods
//
/**
 * !!DOC
 */
type intrinsicNames = "a" | "abbr" | "address" | "area" | "article" | "aside" | "audio" | "b" | "base" | "bdi" | "bdo" | "big" | "blockquote" | "body" | "br" | "button" | "canvas" | "caption" | "cite" | "code" | "col" | "colgroup" | "data" | "datalist" | "dd" | "del" | "details" | "dfn" | "dialog" | "div" | "dl" | "dt" | "em" | "embed" | "fieldset" | "figcaption" | "figure" | "footer" | "form" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "head" | "header" | "hr" | "html" | "i" | "iframe" | "img" | "input" | "ins" | "kbd" | "keygen" | "label" | "legend" | "li" | "link" | "main" | "map" | "mark" | "menu" | "menuitem" | "meta" | "meter" | "nav" | "noscript" | "object" | "ol" | "optgroup" | "option" | "output" | "p" | "param" | "picture" | "pre" | "progress" | "q" | "rp" | "rt" | "ruby" | "s" | "samp" | "script" | "section" | "select" | "small" | "source" | "span" | "strong" | "style" | "sub" | "summary" | "sup" | "table" | "tbody" | "td" | "textarea" | "tfoot" | "th" | "thead" | "time" | "title" | "tr" | "track" | "u" | "ul" | "var" | "video" | "wbr";
export function createElement(tagName:intrinsicNames, attrs?:HTMLAttributes, ...children:AddNode[]): DOMHTMLElement
{
    var elm = new DOMHTMLElement($global.document.createElement(tagName));

    if (attrs !== undefined && attrs !== null && typeof attrs === "object") {
        for (var attrName in attrs) {
            if (attrs.hasOwnProperty(attrName)) {
                var attrValue = (attrs as any)[attrName];

                if (attrValue !== undefined && attrValue !== null) {
                    if (attrName.startsWith("on")) {
                        if (typeof attrValue === "function")
                            elm.bind(attrName.substr(2) as any, attrValue);
                    }
                    else
                    if (typeof attrValue === "string") {
                        elm.attr(attrName, <string>attrValue);
                    }
                    else
                    if (typeof attrValue === "number") {
                        elm.attr(attrName, <number>attrValue);
                    }
                    else
                    if (typeof attrValue === "boolean") {
                        switch (attrName) {
                        case "disabled":
                            if (attrValue) {
                                elm.attr(attrName, "1");
                            }
                            break;

                        default:
                            elm.attr(attrName, <boolean>attrValue);
                            break;
                        }
                    }
                }
            }
        }
    }

    for (var a = 2; a < arguments.length ; ++a)
        elm.appendChild(arguments[a]);

    return elm;
}

/**
 * !!DOC
 */
export function createText(txt:string): DOMText
{
    if (txt === undefined || txt === null)
        txt = "";

    return new DOMText($global.document.createTextNode(txt));
}

/**
 * !!DOC
 */
export function element(elm:HTMLElement): DOMHTMLElement
{
    if (elm instanceof HTMLElement && (<any>elm)._jannesenuipin !== undefined)
        return (<any>elm)._jannesenuipin;

    return new DOMHTMLElement(elm);
}

export function getElementData(elm:Element, data:string): any {
    if (elm instanceof HTMLElement && (<any>elm)._jannesenuipin !== undefined) {
        return (<any>elm)._jannesenuipin[data];
    }
}
/**
 * !!DOC
 */
export const window   = new DOMWindow($global.window);

/**
 * !!DOC
 */
export const document = new DOMHTMLDocument($global.document);

/**
 * !!DOC
 */
export var body:DOMHTMLElement;

/**
 * !!DOC
 */
export function ondomready(handler: () => void, thisArg?: any): void
{
    let wrapper = $J.eventWrapper("domready", handler, thisArg);

    if (ondomreadyHandlers) {
        ondomreadyHandlers.push(wrapper);
    } else {
        setTimeout(wrapper, 0);
    }
}

/**
 * !!DOC
 */
export function onlocationhashchange(handler: (h:string) => void, thisArg?: any): void
{
    onlocationhashchangeHandlers.push($J.eventWrapper("locationhashchange", handler, thisArg));
}

/**
 * !!DOC
 */
export function onlocationhashready(handler: (h:string) => void, thisArg?: any): void
{
    let wrapper = $J.eventWrapper("locationhashready", handler, thisArg);
    ondomready(() => { onlocationhashchangeHandlers.push(wrapper); wrapper(location.hash); });
}

/**
 * !!DOC
 */
export function setLocationHash(hash:string, replace?:boolean)
{
    curlocationhash = undefined;

    if (hash === null || hash === undefined)    hash = "";
    if (hash.length === 0 || hash[0] !== '#')   hash = '#' + hash;

    if (location.hash !== hash) {
        const   url = location.pathname + location.search + hash;
        if (replace) {
//            console.log('replace location: ' + url);
            location.replace(url);
        }
        else {
//            console.log('new location: ' + url);
            location.assign(url);
            if (history.state && history.replaceState) //!!Work around a IE11 problem that the history state is copied to a new history entry.
                history.replaceState(null, "", undefined);
        }
    }

    setTimeout(WINHashChange, 0);
}

/**
 * !!DOC
 */
export function multilineStringToContent(s:string|string[]|null)
{
    let lines:string[];

    if (typeof s === "string"){
        lines = (s as string).replace("\r\n", "\n").split("\n");
    }
    else if (Array.isArray(s) && s.length > 0) {
        lines = s;
    }
    else {
        return null;
    }

    if (lines.length > 1) {
        let rtn: (DOMText|DOMHTMLElement)[] = [];

        for (let i = 0 ; i < lines.length ; ++i) {
            if (i > 0)              rtn.push(createElement("br"));
            if (lines[i] !== "")    rtn.push(createText(lines[i]));
        }

        return rtn;
    }

    return createText(lines[0]);
}

/**
 * !!DOC
 */
export function elementIsVisible(e:any):boolean {
     return (e.offsetParent !== null);
}

/**
 * !!DOC
 */
export function classJoin(...classNames: (string|undefined|null|false)[])
{
    let     rtn:string|undefined;

    for (const s of classNames) {
        if (typeof s === "string") {
            rtn = (rtn === undefined) ? s : rtn + " " + s;
        }
    }

    return (rtn !== undefined) ? rtn : "";
}

/**
 * !!DOC
 */
export function compareSize(s1: ISize|null|undefined, s2: ISize|null|undefined) {
    return (s1 === s2) ||
           (s1 instanceof Object && s2 instanceof Object && s1.height === s2.height && s1.width === s2.width);
}

/**
 * !!DOC
 */
export function getTabForm(elm:HTMLElement|null) {
    while (elm && elm !== $global.document.body) {
        if (elm.classList.contains('jannesen-ui-tabform')) {
            return elm;
        }

        elm = elm.parentElement;
    }
    return null;
}

/**
 * !!DOC
 */
export function nextTabStop(body:HTMLElement, cur:HTMLElement|null, back:boolean, ignorearea?:HTMLElement) {
    let nodelist = body.querySelectorAll("input,button,textarea,select,*[tabIndex]");

    if (nodelist.length > 0) {
        let targetTabIndex: number;
        let nextFocus:      HTMLElement|undefined;
        let nextTabIndex:   number|undefined;
        let n:              Element;

        if (!back) {
            targetTabIndex = cur ? Math.max(cur.tabIndex || 0, 0) : -1;
            nextTabIndex   = 100000;

            for (let i = 0 ; i < nodelist.length ; ++i) {
                if ((n = nodelist[i]) === cur) {
                    targetTabIndex = targetTabIndex - 1;
                }
                else if (n instanceof HTMLElement && focusElement(n, ignorearea)) {
                    const t = n.tabIndex || 0;
                    if (t >= 0) {

                        if (t > targetTabIndex && t < nextTabIndex) {
                            nextFocus    = n;
                            nextTabIndex = t;
                        }
                    }
                }
            }
        }
        else {
            targetTabIndex = cur ? Math.max(cur.tabIndex || 0, 0) : -1;
            nextTabIndex   = -1;

            for (let i = nodelist.length - 1 ; i >= 0  ; --i) {
                if ((n = nodelist[i]) === cur) {
                    targetTabIndex = targetTabIndex + 1;
                }
                else if (n instanceof HTMLElement && focusElement(n, ignorearea)) {
                    const t = n.tabIndex || 0;
                    if (t >= 0) {
                        const t = n.tabIndex || 0;
                        if (t < targetTabIndex && t > nextTabIndex) {
                            nextFocus    = n;
                            nextTabIndex = t;
                        }
                    }
                }
            }
        }
        return nextFocus;
    }
}

//-------------------------------------------------------------------------------------------------
// Transitions
//
interface ITransition
{
    elm:        DOMHTMLElement;
    callback:   (elm:DOMHTMLElement, progress:number) => boolean|void;
    time:       number;
    start:      number;
}

const g_activeTransitions:ITransition[] = [];

/**
 * Start transition.
 *
 * @param elm
 *  element to run transision on. Only on transition per element.
 *
 * @param callback
 *  the callback function for transtion this function has one argument progress with the value of 0 to 1.
 *  The progress value is translated to ease-in-out. If the callback function returns false the transition is cancelled.
 *
 * @param time
 *  The total time of the transision if time === undefined the use 'transition-duration'for transtion time.
 */
export function runTransition(elm:DOMHTMLElement, callback: (elm:DOMHTMLElement, progress: number) => boolean|void, time?: number|string)
{
    if (time === undefined) {
        time = elm.css('transition-duration');
    }

    if (typeof time === 'string') {
        if (time.endsWith("s")) {
            time = parseFloat(time.substr(0, time.length - 1)) * 1000;
        }
        else if (time.endsWith("ms")) {
            time = parseFloat(time.substr(0, time.length - 1));
        }
        else {
            time = 0;
        }
    }

    const i = g_activeTransitions.findIndex((t) => t.elm.element === elm.element);
    if (i >= 0) {
        g_activeTransitions.splice(i, 1);
    }

    if (time > 10) {
        if (callback(elm, 0) !== false) {
            g_activeTransitions.push({
                elm:      elm,
                callback: callback,
                time:     time,
                start:    performance.now()
            });

            if (g_activeTransitions.length === 1) {
                transitionSchedule();
            }
        }
    }
    else {
        callback(elm, 1);
    }
}

function transitionSchedule()
{
    requestAnimationFrame(() => {
        const now = performance.now();

        for (let i = 0; i < g_activeTransitions.length; ++i) {
            const t = g_activeTransitions[i];
            const d = (now - t.start) / t.time;
            let f:boolean|void;

            if (d < 0 || d > 0.99) {
                t.callback(t.elm, 1);
                f = false;
            }
            else {
                f = t.callback(t.elm, (d<.5 ? 2*d*d : -1+(4-2*d)*d));
            }

            if (f === false) {
                g_activeTransitions.splice(i, 1);
                --i;
            }
        }

        if (g_activeTransitions.length > 0) {
            transitionSchedule();
        }
    });
}

/**
 * !!DOC
 */
export function onAnimationTransitionEnd(elm: DOMHTMLElement, cb: ()=>void)
{
    let timeoutid:number|null;
    let s:number;
    let evts = new $J.EventCollection();

    if ((s = parseCssTimer(elm.css("animation-duration"))) > 0) {
        evts.bind(elm, "animationstart", start);
        evts.bind(elm, "animationend",   done);
        timeoutid = $J.setTimeout(ontimeout, s + 50);
        return true;
    }
    else
    if ((s = parseCssTimer(elm.css("transition-duration"))) > 0) {
        evts.bind(elm, "transitionend",   done);
        timeoutid = $J.setTimeout(ontimeout, s + 50);
        return true;
    }
    else {
        $J.setTimeout(cb, 0);
        return false;
    }

    function start() {
        if (timeoutid) {
            clearTimeout(timeoutid);
            timeoutid = $J.setTimeout(ontimeout, s + 1000);
        }
    }
    function done() {
        evts.unbindAll();

        if (timeoutid) {
            clearTimeout(timeoutid);
            timeoutid = null;
        }
        cb();
    }
    function ontimeout() {
        timeoutid = null;
        done();
    }

    function parseCssTimer(s:string) {
        let r:number = 0;
        for (let t of s.split(',')) {
            t = t.trim();
            r = Math.max(r, t.endsWith("ms") ? parseFloat(t.substr(0, s.length - 2)) : t.endsWith("s") ? parseFloat(t.substr(0, s.length - 1)) * 1000 : 0);
        }

        return r;
    }
}

//-------------------------------------------------------------------------------------------------
// DOM event handlers
//
function DOMContentLoaded()
{
    $global.document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);

    if (ondomreadyHandlers) {
        body = new DOMHTMLElement($global.document.body);
        body.pinElement();

        for (var h of ondomreadyHandlers) {
            h(null);
        }

        ondomreadyHandlers = undefined;
    }
}
function WINHashChange()
{
    setTimeout(() => {
        if (curlocationhash !== location.hash) {
            curlocationhash = location.hash;

            for (var i = 0 ; i < onlocationhashchangeHandlers.length ; ++i) {
                onlocationhashchangeHandlers[i](curlocationhash);
            }
        }
    }, 0);
}

//-------------------------------------------------------------------------------------------------
// Wrapper around a event handlers so that exception logged and display to the user.
//
function event_bind(node:Window|Document|HTMLElement, events:$J.IEventWrapper[], eventName:string, handler: (ev: any) => void, thisArg:any, options?:AddEventListenerOptions): $J.IEventWrapper
{
    let wrapper = $J.eventWrapper(eventName, handler, thisArg);
    events.push(wrapper);
    node.addEventListener(eventName, wrapper, options);
    return wrapper;
}
function event_unbind(node:Window|Document|HTMLElement, events:$J.IEventWrapper[]|undefined, eventName:string, handler:(ev:any) => void, thisArg?:any): void
{
    if (events) {
        let idx = 0;

        while (idx < events.length) {
            const w = events[idx];

            if (w.eventHandler === handler && w.thisArg === thisArg) {
                events.splice(idx, 1);
                node.removeEventListener(eventName, w);
                continue;
            }

            ++idx;
        }
    }
}

//-------------------------------------------------------------------------------------------------
// domelement destroy
//
function domelement_addremove_node(element:NodeFragment, added:boolean) {
    if (element instanceof HTMLElement) {
        for (var n = 0 ; n < element.childNodes.length ; ++n) {
            if (element.childNodes[n].nodeType === 1)
                domelement_addremove_node(<HTMLElement>element.childNodes[n], added);
        }

        if ((<any>element)._jannesenuipin && (<any>element)._jannesenuipin instanceof DOMHTMLElement) {
            (<DOMHTMLElement>(<any>element)._jannesenuipin)._onaddremovefromdocument(added);
        }
    }
    else
    if (Array.isArray(element)) {
        element.forEach((i) => domelement_addremove_node(i, added));
    }
}

//-------------------------------------------------------------------------------------------------
// Select helpers
//
function select(elm:(Document|HTMLElement), selector: string): DOMHTMLElement|null
{
    const p = <HTMLElement>elm.querySelector(selector);
    return p ? element(p) : null;
}
function selectAll(elm:(Document|HTMLElement), selector:string): DOMNodeList
{
    let rtn = new DOMNodeList();

    if (elm !== null) {
        rtn.addNodeList(elm.querySelectorAll(selector));
    }

    return rtn;
}

//-------------------------------------------------------------------------------------------------
// insert helper
//
function insertHelperArray(children:any):NodeFragment|null
{
    if (children.length > 1) {
        var rtn:(Text|HTMLElement)[] = [];

        for (var n = 0 ; n < children.length ; ++n) {
            let e = insertHelper(children[n]);
            if (e) {
                if (Array.isArray(e)) {
                    e.forEach((i) => rtn.push(i));
                } else {
                    rtn.push(e);
                }
            }
        }
        return rtn;
    }
    else
    if (children.length === 1)
        return insertHelper(children[0]);

    return null;
}
function insertHelper(child:any):NodeFragment|null
{
    switch (typeof child) {
    case "string":
        return $global.document.createTextNode(child);

    case "object":
        if (child !== null) {
            if (Array.isArray(child))
                return insertHelperArray(child);

            if (child instanceof Object) {
                const c = child.container;
                if (c instanceof Object)
                    return insertHelper(c);

                if (typeof c === 'string')
                    return $global.document.createTextNode(c);

                if (typeof child.toDom === "function")
                    return insertHelper(child.toDom());

                if (child instanceof DOMHTMLElement || child instanceof DOMText)
                    return (<any>child)._element;

                if (child instanceof DOMNodeList)
                    return insertHelperArray((child as DOMNodeList).getElements());

                if (child.nodeType === 1 || child.nodeType === 3)
                    return child;
            }
        }
        break;
    }

    return null;
}
function insertFragment(f:NodeFragment):Text|HTMLElement|DocumentFragment
{
    if (Array.isArray(f)) {
        let rtn = $global.document.createDocumentFragment();
        f.forEach((i) => rtn.appendChild(i));
        return rtn;
    } else {
        return f;
    }
}

//-------------------------------------------------------------------------------------------------
// Select helpers
//
function getElementComputedStylePropertyString(element:HTMLElement, propertyName:string): string
{
    if (!(element.ownerDocument && element.ownerDocument.defaultView)) {
        throw new $J.InvalidStateError("defaultView is null.");
    }
    return element.ownerDocument.defaultView.getComputedStyle(element).getPropertyValue(propertyName);
}
function getElementComputedStyleProperty(element:HTMLElement, propertyName:string, defaultValue:string|number|null): string|number|null
{
    var v   = getElementComputedStylePropertyString(element, propertyName);

    if (typeof v !== "string")
        return defaultValue;

    var ext = <string>styleNameDefaultExt[propertyName];
    if (ext !== undefined) {
        if (!v.endsWith(ext))
            throw new $J.InvalidStateError("css('" + propertyName + "') has a invalid property value '" + v + "'.");

        return parseFloat(v.substr(0, v.length - ext.length));
    }
    return v;
}
function getElementComputedStyleProperties(element:HTMLElement, propertyNames:string[]): ICssValues
{
    if (!(element.ownerDocument && element.ownerDocument.defaultView)) {
        throw new $J.InvalidStateError("defaultView is null.");
    }
    let cssValues:ICssValues = {};
    let computedStyle = element.ownerDocument.defaultView.getComputedStyle(element);

    propertyNames.forEach((propertyName) => {
            let v:any = computedStyle.getPropertyValue(propertyName);
            let ext   = styleNameDefaultExt[propertyName] as string;
            if (ext !== undefined) {
                if (!v.endsWith(ext))
                    throw new $J.InvalidStateError("css('" + propertyName + "') has a invalid property value '" + v + "'.");

                v = parseFloat(v.substr(0, v.length - ext.length));
            }

            cssValues[propertyName] = v;
        });

    return cssValues;
}
function setElementStyleProperty(element:HTMLElement, propertyName: string, value: string|number|undefined): void
{
    if (typeof value === "number") {
        var e = styleNameDefaultExt[propertyName] || styleNameDefaultExtSet[propertyName];
        if (e) {
            value = "" + value + e;
        }

        if (propertyName === "height" || propertyName === "width") {
            if (value < 0)
                value = 0;
        }
    }

    if (value !== undefined)
        element.style.setProperty(propertyName, "" + value);
    else
        element.style.removeProperty(propertyName);
}
function setElementAttribute(element:HTMLElement, attrName:string, value: string|number|boolean|undefined)
{
    if (typeof value === "number")
        value = "" + value;
    if (typeof value === "boolean")
        value = value ? "true" : "false";

    if (value !== undefined)
        element.setAttribute(attrName, <string>value);
    else
        element.removeAttribute(attrName);
}

function parseFloatUndefined(s:string|null): number
{
    return s ? parseFloat(s) : 0;
}

function focusElement(n: HTMLElement, ignorearea?:HTMLElement) {
    if (elementIsVisible(n) && !n.getAttribute('disabled')) {
        if (ignorearea && ignorearea.contains(n))
            return false;

        return true;
    }

    return false;
}
//-------------------------------------------------------------------------------------------------
// start
//
curlocationhash = $global.window.location.hash;
$global.window.addEventListener("hashchange", WINHashChange, false);

if ($global.document.readyState === "loading")
    $global.document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
else
    setTimeout(DOMContentLoaded, 0);

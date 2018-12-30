﻿/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J          from "jc3/jannesen";
import * as $JD         from "jc3/jannesen.dom";
import * as $JT         from "jc3/jannesen.datatype";
import * as $JI         from "jc3/jannesen.input";

let screen_width_correction  = 0;
let screen_height_correction = 0;

export const enum PositionFlags
{
    Horizontal   = 0x0f,
    AlignLeft    = 0x00,
    AlignRight   = 0x01,
    Left         = 0x02,
    Right        = 0x03,
    Center       = 0x04,
    WindowLeft   = 0x08,
    WindowRight  = 0x09,
    WindowCenter = 0x0A,
    Vertical     = 0xf0,
    AlignTop     = 0x00,
    AlignBottom  = 0x10,
    Top          = 0x20,
    Bottom       = 0x30,
    Middle       = 0x40,
    WindowTop    = 0x80,
    WindowBottom = 0x90,
    WindowMiddle = 0xA0,
    _fixed       = 0x88 // Bit mask fox fix position
}
export interface IDropdownConstructor<TNativeValue,
                                      TValue extends $JT.SimpleType<TNativeValue>,
                                      TInput extends $JI.InputTextDropdownControl<TNativeValue, TValue, TInput, TOpt, TDropdown>,
                                      TOpt extends $JI.IInputControlOptions,
                                      TDropdown extends DropdownContent<TNativeValue, TValue, TInput, TOpt, TDropdown>>
{
    new     (popup: DropdownPopup<TNativeValue, TValue, TInput, TOpt, TDropdown>, context:$J.ICallArgs|undefined): TDropdown;
}

interface ICssPosition
{
    position:       string;
    left?:          number;
    right?:         number;
    top?:           number;
    bottom?:        number;
}

export abstract class Popup
{
    protected   _parentelm:         $JD.DOMHTMLElement;
    protected   _container:         $JD.DOMHTMLElement|null;
    protected   _postionFixed:      boolean;
    protected   _poselmOuterRect:   $JD.IRect|undefined;
    private     _eventCollection:   $J.EventCollection;

    public get  parentelm()
    {
        return this._parentelm;
    }
    public get  container()
    {
        return this._container;
    }
    public get  poselmClientRect()
    {
        return this._poselmOuterRect;
    }

                constructor(parentelm: $JD.DOMHTMLElement, className: string, content?: $JD.AddNode)
    {
        this._parentelm       = parentelm;
        this._postionFixed    = false;
        this._eventCollection = new $J.EventCollection();

        for (let elm = parentelm.offsetParent ; elm !== null && elm !== $JD.body ; elm = elm.offsetParent) {
            if (elm.css("position") === "fixed") {
                this._postionFixed = true;
                break;
            }
        }

        this._container = <div class={"jannesen-ui-popup " + className} />;
        this._container.data("popup", this);

        if (content) {
            this.Show(content);
        }
    }

    public      Remove()
    {
        let timeout:number;
        let container = this._container;
        this._container = null;

        this._eventCollection.unbindAll();

        if (container) {
            let transition = container.css([ "transition-duration", "transition-property" ]);

            if (typeof transition["transition-duration"] === 'string' && transition["transition-duration"] !== "0s" &&
                (transition["transition-property"] === "height" || transition["transition-property"] === "width")) {
                const transitionproperty = transition["transition-property"] as string;
                container.css(transitionproperty, container.css(transitionproperty));
                container.bind("transitionend", removed);
                timeout = setTimeout(removed, 1000);
                setTimeout(() => {
                        if (container) {
                            container.css(transitionproperty, 0);
                        }
                    }, 0);
            } else {
                removed();
            }
        }

        function removed() {
            if (container) {
                if (timeout) {
                    clearTimeout(timeout);
                }
                $JD.body.removeChild(container);
                container.empty();
                container = null;
            }
        }
    }

    protected   Show(content: $JD.AddNode, starttransition?: boolean) {
        if (!this._container) {
            throw new $J.InvalidStateError("Popup already removed.");
        }

        if (!this._container.isLive) {
            this._container.css("visibility", "hidden").appendChild(content);

            $JD.body.appendChild(this._container);

            this._eventCollection.bind($JD.window,   "resize",   this._onResize, this);
            this._eventCollection.bind($JD.window,   "scroll",   this._onScroll, this);
            this._eventCollection.bind($JD.document, "scroll",   this._onScroll, this);


            for (let e = this._parentelm.parent; e !== null; e = e.parent) {
                let s = e.css(["overflow-x", "overflow-y"]);
                if (s["overflow-x"] === "auto" || s["overflow-x"] === "scroll" ||
                    s["overflow-y"] === "auto" || s["overflow-y"] === "scroll") {
                    this._eventCollection.bind(e, "scroll", this._onScroll, this);
                }

                if (e === $JD.body)
                    break;
            }

            if (starttransition) {
                let transition = this._container.css([ "transition-duration", "transition-property" ]);

                if (typeof transition["transition-duration"] === 'string' && transition["transition-duration"] !== "0s" &&
                    (transition["transition-property"] === "height" || transition["transition-property"] === "width")) {
                    const transitionproperty = transition["transition-property"] as string;
                    const container = this._container;

                    if (content instanceof $JD.DOMHTMLElement) {
                        content.css(transitionproperty, Math.ceil(content.css(transitionproperty) as number));
                    }

                    const value = Math.ceil(container.css(transitionproperty) as number);
                    container.css(transitionproperty, 4);
                    setTimeout(() => { container.css(transitionproperty, value); }, 0);
                }
            }
        } else {
            this._container.empty().appendChild(content);
        }

        try {
            this.PositionPopup(this._container, this._poselmOuterRect = this._parentelm.outerRect);
        }
        catch (e) {
            $JD.body.removeChild(this._container);
            throw e;
        }

        this._container.css("visibility", undefined);
    }
    protected   PositionPopup(container:$JD.DOMHTMLElement, poselmOuterRect:$JD.IRect, flags?: PositionFlags): void {
        if (flags === undefined) {
            flags = PositionFlags.AlignLeft | PositionFlags.Bottom;
        }

        const fixed     = flags & (PositionFlags._fixed) ? true : false;
        let   posLeft   = poselmOuterRect.left;
        let   posTop    = poselmOuterRect.top;
        let   cssset    = { position: fixed ? "fixed" : "absolute" } as ICssPosition;
        let   window    = this._parentelm.defaultView;
        if (!fixed) {
            posLeft += window.pageXOffset;
            posTop  += window.pageYOffset;
        }

        let windowWidth  = window.innerWidth  - screen_width_correction;
        let windowHeight = window.innerHeight - screen_height_correction;
        let correctWidth = false;
        let correctBottom = false;

        switch (flags & PositionFlags.Horizontal) {
        case PositionFlags.AlignLeft:       cssset.left  = posLeft;                                                                                                     break;
        case PositionFlags.AlignRight:      cssset.right = windowWidth - (posLeft + poselmOuterRect.width);                                     correctWidth = true;    break;
        case PositionFlags.Left:            cssset.right = windowWidth - posLeft;                                                               correctWidth = true;    break;
        case PositionFlags.Right:           cssset.left  = posLeft + poselmOuterRect.width;                                                                             break;
        case PositionFlags.Center:          cssset.left  = posLeft + (poselmOuterRect.width - container.outerRect.width) / 2;                                           break;
        case PositionFlags.WindowLeft:      cssset.left  = 0;                                                                                                           break;
        case PositionFlags.WindowRight:     cssset.right = 0;                                                                                                           break;
        case PositionFlags.WindowCenter:    cssset.left  = Math.max(0, (window.innerWidth - container.outerRect.width) / 2);                                            break;
        }
        switch (flags & PositionFlags.Vertical) {
        case PositionFlags.AlignTop:        cssset.top    = posTop;                                                                                                     break;
        case PositionFlags.AlignBottom:     cssset.bottom = windowHeight - (posTop + poselmOuterRect.height);                                   correctBottom = true;   break;
        case PositionFlags.Top:             cssset.bottom = windowHeight - posTop;                                                              correctBottom = true;   break;
        case PositionFlags.Bottom:          cssset.top    = posTop + poselmOuterRect.height;                                                                            break;
        case PositionFlags.Middle:          cssset.top    = posTop  + (poselmOuterRect.height - container.outerRect.height) / 2;                                        break;
        case PositionFlags.WindowTop:       cssset.top    = 0;                                                                                                          break;
        case PositionFlags.WindowBottom:    cssset.bottom = 0;                                                                                                          break;
        case PositionFlags.WindowMiddle:    cssset.top    = Math.max(0, (screen.height - container.outerRect.height) / 2);                                              break;
        }

        container.css(cssset);

        if (correctWidth || correctBottom) {
            let actuelRect = container.outerRect;
            if (correctWidth) {
                const d = (windowWidth - cssset.right!) - (actuelRect.right + (!fixed ? window.pageXOffset : 0));
                screen_width_correction += d;

                if (-.5 > d || d > .5) {
                    container.css("right", cssset.right! - d);
                }
            }
            if (correctBottom) {
                const d = (windowHeight - cssset.bottom!) - (actuelRect.bottom + (!fixed ? window.pageYOffset : 0));
                screen_height_correction += d;

                if (-.5 > d || d > .5) {
                    container.css("bottom", cssset.bottom! - d);
                }
            }
        }
    }

    private     _onScroll()
    {
        if (this._poselmOuterRect && this._container) {
            let posClientRect = this._parentelm.outerRect;

            if (!(posClientRect.left   === this._poselmOuterRect.left   &&
                  posClientRect.top    === this._poselmOuterRect.top    &&
                  posClientRect.height === this._poselmOuterRect.height &&
                  posClientRect.width  === this._poselmOuterRect.width)) {
                this._poselmOuterRect = posClientRect;
                this.PositionPopup(this._container, this._poselmOuterRect);
            }
        }
    }
    private     _onResize()
    {
        if (this._poselmOuterRect && this._container) {
            let posClientRect = this._parentelm.outerRect;
            this._poselmOuterRect = posClientRect;
            this.PositionPopup(this._container, this._poselmOuterRect);
        }
    }
}

export class Tooltip extends Popup
{
    private     _bottom:        boolean;
    private     _right:         boolean;
    private     _markerSize:    number;
    private     _offsetX:       number;

                constructor(poselm: $JD.DOMHTMLElement, message:string)
    {
        super(poselm,  "-tooltip");

        const bottom = false;
        const right  = poselm.css("text-align") === "right";


        let markerSize = Math.round(bottom ? poselm.css("padding-bottom") + poselm.css("margin-bottom")
                                           : poselm.css("padding-top")    + poselm.css("margin-top"));

        if (markerSize < 5) {
            this._offsetX = 4 - markerSize;
            markerSize = 5;
        } else {
            this._offsetX = 0;
        }

        this._bottom     = bottom;
        this._right      = right;
        this._markerSize = markerSize;

        this.Show([
                    (<span class={bottom ? "-marker -top -outer" : "-marker -bottom -outer"} />).css("border-width", markerSize    ),
                    (<span class={bottom ? "-marker -top -inner" : "-marker -bottom -inner"} />).css("border-width", markerSize - 1),
                    <div class="-text">{ $JD.multilineStringToContent(message) }</div>
                  ]);
    }

    protected   PositionPopup(container:$JD.DOMHTMLElement, poselmOuterRect:$JD.IRect)
    {
        let e:$JD.DOMHTMLElement|null;
        let winSize       = $JD.window.size;
        let posClientRect = { top: poselmOuterRect.top, left: poselmOuterRect.left, width: poselmOuterRect.width, height: poselmOuterRect.height };
        container.position = { top: 0, left: 0 };
        container.css("max-width", Math.max(winSize.width * 0.66, posClientRect.width));

        if (this._right) {
            let markerRight = this._parentelm.css("padding-right") + this._parentelm.css("font-size") / 3 - this._markerSize;

            posClientRect.left += posClientRect.width - container.outerSize.width;
            if (posClientRect.left < 0) {
                markerRight += 0 - posClientRect.left;
                posClientRect.left = 0;
            }

            if (markerRight < 4) markerRight = 4;

            if (e = container.select("span.-marker.-outer")) e.css("right", markerRight    );
            if (e = container.select("span.-marker.-inner")) e.css("right", markerRight + 1);
        } else {
            let markerLeft = ((posClientRect.width > this._parentelm.css("font-size") * 2)
                                ? this._parentelm.css("padding-left") + this._parentelm.css("font-size") / 3
                                : posClientRect.width / 2
                             ) - this._markerSize;

            if (posClientRect.left + container.outerSize.width > winSize.width) {
                markerLeft += posClientRect.left - (winSize.width - container.outerSize.width);
                posClientRect.left = winSize.width - container.outerSize.width;
            }

            if (markerLeft < 4) markerLeft = 4;
            if (e = container.select("span.-marker.-outer")) e.css("left", markerLeft    );
            if (e = container.select("span.-marker.-inner")) e.css("left", markerLeft + 1);
        }

        if (this._postionFixed) {
            container.css("position", "fixed").css("left", posClientRect.left);
        } else {
            let view = this._parentelm.defaultView;
            container.css("position", "absolute").css("left", posClientRect.left + view.pageXOffset);
            posClientRect.top  += view.pageYOffset;
        }

        container.css("top", (this._bottom
                                        ? (posClientRect.top + posClientRect.height - 1 + this._offsetX)
                                        : (posClientRect.top - container.outerSize.height - this._offsetX)));
    }
}

export class DropdownPopup<TNativeValue,
                           TValue extends $JT.SimpleType<TNativeValue>,
                           TInput extends $JI.InputTextDropdownControl<TNativeValue, TValue, TInput, TOpts, TDropdown>,
                           TOpts extends $JI.IInputControlOptions,
                           TDropdown extends DropdownContent<TNativeValue, TValue, TInput, TOpts, TDropdown>>
                                extends Popup
{
    /* @internal */     _popupcontainer:    $JD.DOMHTMLElement;
    /* @internal */     _input:             TInput|null;
    private             _dropdownClass:     string|IDropdownConstructor<TNativeValue, TValue, TInput, TOpts, TDropdown>;
    private             _content:           TDropdown|undefined;
    private             _onreadyHandler:    ((content:TDropdown)=>void)|undefined;

    public get          DropdownClass()
    {
        return this._dropdownClass;
    }
    public get          Content()
    {
        return this._content;
    }

                        constructor(input:TInput, dropdownClass:string|IDropdownConstructor<TNativeValue, TValue, TInput, TOpts, TDropdown>, className:string, context:$J.ICallArgs|undefined)
    {
        super(input.container,  "-dropdown " + className);
        this.Show(this._popupcontainer = <div class="-popup"/>);
        this._input          = input;
        this._dropdownClass  = dropdownClass;
        this._content        = undefined;

        if (!(context instanceof Object))
            context = undefined;

        if (typeof dropdownClass === 'function') {
            this._content = new dropdownClass(this, context);
        } else {
            let classNameParts = dropdownClass.split(":", 2);

            require([ classNameParts[0] ],
                (c:any) => {
                    if (this._container) {
                        try {
                            if (classNameParts.length > 1) {
                                c = c[classNameParts[1]];

                                if (c === undefined) {
                                    throw new $J.LoadError("Can't locate '" + classNameParts[1] + "' in module.");
                                }
                            }

                            if (!((c.prototype) instanceof DropdownContent)) {
                                throw new $J.LoadError("dropdownClass is not a DropdownContent constructor.");
                            }

                            const content = new c(this, context);
                            this._content = content;
                            content.OnInit();

                            let onreadyHandler = this._onreadyHandler;
                            this._onreadyHandler = undefined;
                            if (onreadyHandler)
                                onreadyHandler(content);
                        }
                        catch(e) {
                            this.setMessage(e);
                        }
                    }
                },
                (e:any) => {
                    let err = new $J.LoadError("Loading of module '" + classNameParts[0] + "' failed.");
                    err.innerError = e;
                    this.setMessage(err);
                });
        }
    }

    public              OnReadyHandler(onready:(content:TDropdown)=>void)
    {
        if (this._content) {
            onready(this._content);
        } else {
            this._onreadyHandler = onready;
        }
    }
    public              Focus()
    {
        if (!this._container) {
            throw new $J.InvalidStateError("DropdownPopup not show");
        }

        this._container.attr("tabIndex", 1000).focus();
        if (this._content) {
            this._content.OnFocus();
        }
    }
    public              Remove()
    {
        if (this._content) {
            this._content.OnRemove();
        }

        this._input = null;
        super.Remove();
    }

    /* @internal */     setMessage(msg:string|Error, keepfocus?:boolean)
    {
        if (this._container && this._input && this._poselmOuterRect) {
            if (!keepfocus) {
                if (this._container.attr("tabIndex") !== undefined) {
                    this._input.getinputelm().focus();
                    this._container.attr("tabIndex", undefined);
                }
            }

            this._popupcontainer.empty();

            if (msg instanceof Error) {
                let m:$JD.AddNode[] = [];

                m.push("ERROR: " + (msg as Error).message);

                try {
                    for (let e = (msg as Error).innerError ; e ; e = e.innerError) {
                        m.push(<br/>);
                        m.push(e.message);
                    }

                    if (msg instanceof $J.ServerError) {
                        if ((msg as $J.ServerError).serverError.detail) {
                            (msg as $J.ServerError).serverError.detail.forEach((e) => {
                                                                                        m.push(<br/>);
                                                                                        m.push(e.message);
                                                                                });
                        }
                    }
                } catch(e) {
                }

                this._popupcontainer.appendChild(<div class="-message -error">{ m }</div>);
            } else {
                this._popupcontainer.appendChild(<div class="-message">{ msg }</div>);
            }

            this.PositionPopup(this._container, this._poselmOuterRect);
        }
    }
    /* @internal */     setContent(content:$JD.AddNode)
    {
        if (!(this._container && this._poselmOuterRect)) {
            throw new $J.InvalidStateError("Popup not show");
        }

        this._popupcontainer.empty().appendChild(content);
        this._container.attr("tabIndex", 1000);
        this.PositionPopup(this._container, this._poselmOuterRect);
    }
    /* @internal */     PositionPopup(container:$JD.DOMHTMLElement, poselmOuterRect:$JD.IRect,)
    {
        let winSize       = $JD.window.size;
        let left          = poselmOuterRect.left;
        let top           = (poselmOuterRect.top + poselmOuterRect.height - 1);
        let size          = { width: poselmOuterRect.width, height: 2};
        let maxWidth      = Math.round((winSize.width) * ($JD.body.hasClass("jannesen-ui-mobile") ? 1 : 0.95));
        let maxHeight     = winSize.height - top;
        let borderHeight:number;
        let borderWidth:number;

        {
            let css = container.css([ 'border-left-width', 'border-right-width', 'border-top-width', 'border-bottom-width']);
            borderHeight = (css['border-left-width']! + css['border-right-width']! ) || 0;
            borderWidth  = (css['border-top-width']!  + css['border-bottom-width']!) || 0;
        }

        if (this._popupcontainer && this._popupcontainer.childNodesLength > 0) {
            let childNode = this._popupcontainer.childNodes(0);
            this._popupcontainer.addClass("-position").css({ width: maxWidth-borderWidth, height: maxHeight-borderHeight-1 });
            size = childNode.outerRect;
            size.height += borderHeight;
            size.width  += borderWidth;
            size.height = Math.round(size.height + 0.44);
            size.width  = Math.round(size.width  + 0.45);
        }

        if (size.width < poselmOuterRect.width) {
            if (this._content && this._content.allwaysCenterDropdown()) {
                left -= (size.width - poselmOuterRect.width - 1) / 2;
            } else {
                size.width = poselmOuterRect.width;
            }
        }

        if (size.width > maxWidth)
            size.width = maxWidth;

        left -= Math.round(Math.max(0, (size.width - poselmOuterRect.width - 1) / 2));

        let rest = Math.min(Math.round((maxWidth - size.width) / 2), 30);

        if (left > winSize.width - rest - size.width)
            left = winSize.width - rest - size.width;

        if (left <= rest)
            left = Math.min(poselmOuterRect.left, rest);

        if (top > winSize.height - size.height)
            top = winSize.height - size.height;

        container.css({
                "top":      top,
                "left":     left,
                "height":   size.height,
                "width":    size.width
            });

        if (this._popupcontainer) {
            this._popupcontainer.css("overflow-y", this._popupcontainer.prop("scrollHeight") === this._popupcontainer.prop("offsetHeight")  ? "hidden" : undefined);
            this._popupcontainer.css({ width: undefined, height: undefined }).removeClass("-position");
        }
    }
}

export abstract class DropdownContent<TNativeValue,
                                      TValue extends $JT.SimpleType<TNativeValue>,
                                      TInput extends $JI.InputTextDropdownControl<TNativeValue, TValue, TInput, TOpts, TDropdown>,
                                      TOpts extends $JI.IInputControlOptions,
                                      TDropdown extends DropdownContent<TNativeValue, TValue, TInput, TOpts, TDropdown>>
{
    protected           _popup:         DropdownPopup<TNativeValue, TValue, TInput, TOpts, TDropdown>;

    protected get       container()
    {
        return this._popup.container;
    }
    protected get       input():TInput|null
    {
        return this._popup._input;
    }
    protected get       scrollelm()
    {
        return this._popup._popupcontainer;
    }

                        constructor(popup:DropdownPopup<TNativeValue, TValue, TInput, TOpts, TDropdown>)
    {
        this._popup   = popup;
    }

    public              OnInit()
    {
    }
    public              OnFocus()
    {
    }
    public              OnRemove()
    {
    }

    public              hasFocus()
    {
        const container = this._popup.container;
        if (container) {
            let e:Element|null;
            let celm = container.element;

            for (e = document.activeElement ; e !== null && e !== undefined && e !== document.body ; e = e.parentElement) {
                if (e === celm)
                    return true;
            }
        }

        return false;
    }

    public              allwaysCenterDropdown()
    {
        return false;
    }

    protected           setMessage(msg:string|Error, keepfocus?:boolean)
    {
        this._popup.setMessage(msg, keepfocus);
    }
    protected           setContent(content:$JD.AddNode)
    {
        this._popup.setContent(content);
    }
    protected           Close(value?:any)
    {
        let input = this.input;

        if (input) {
            input.closeDropdown(true);

            if (value !== undefined) {
                const v = input.value;
                if (v) {
                    v.setValue(value, $JT.ChangeReason.UI);
                }
            }
        }
    }
    protected           PositionPopup() {
        const container        = this._popup.container;
        const poselmClientRect = this._popup.poselmClientRect;

        if (container && poselmClientRect) {
            this._popup.PositionPopup(container, poselmClientRect);
        }
    }

    protected           ForwardTab(input:TInput|null, ev: Event|undefined) {
        if (input && ev instanceof KeyboardEvent && ev.key === 'Tab' && !ev.altKey && !ev.metaKey && !ev.ctrlKey &&
            $global.document.activeElement === input.getinputelm().element) {
            input.getinputelm().element.dispatchEvent(new KeyboardEvent(ev.type, {
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

/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J          from "jc3/jannesen";
import * as $JA         from "jc3/jannesen.async";
import * as $JD         from "jc3/jannesen.dom";

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
                                      TControl extends IControlDropdown<TDropdownRtn>,
                                      TDropdownData,
                                      TDropdownRtn,
                                      TDropdown extends DropdownContent<TNativeValue, TControl, TDropdownData, TDropdownRtn>>
{
    new     (popup: DropdownPopup<TNativeValue, TControl, TDropdownData, TDropdownRtn>, calldata:TDropdownData): TDropdown;
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
    protected   _parentelm:             $JD.DOMHTMLElement;
    protected   _container:             $JD.DOMHTMLElement|null;
    protected   _context:               $JA.Context;
    protected   _postionFixed:          boolean;
    protected   _poselmOuterRect:       $JD.IRect|undefined;
    private     _eventCollection:       $J.EventCollection;
    private     _transitionProperty:    string|undefined;

    public get  parentelm()
    {
        return this._parentelm;
    }
    public get  context()
    {
        return this._context;
    }
    public get  container()
    {
        return this._container;
    }
    public get  poselmClientRect()
    {
        return this._poselmOuterRect;
    }

                constructor(parentelm: $JD.DOMHTMLElement, className: string, parentContext: $JA.Context|undefined)
    {
        this._parentelm       = parentelm;
        this._context         = new $JA.Context({ parent:parentContext, component:this });
        this._context.register(this, this.Remove);
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
    }

    public      Stop()
    {
        this._context.stop();
    }

    protected   Remove()
    {
        let timeout:number|undefined;
        let container = this._container;

        if (container) {
            this._container = null;
            this._context.unregister(this);
            this._context.stop();
            this._eventCollection.unbindAll();

            if (this._transitionProperty && container.isLive) {
                container.bind("transitionend", removed);
                timeout = setTimeout(removed, 1000);
                setTimeout(() => {
                        if (container) {
                            container.css(this._transitionProperty!, 0);
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
                if (container.isLive) {
                    $JD.body.removeChild(container);
                }
                container.empty();
                container = null;
            }
        }
    }

    protected   Show(content: $JD.AddNode, starttransition?: boolean, extclass?:string) {
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
                const s = e.css(["overflow-x", "overflow-y"]);
                if (s["overflow-x"] === "auto" || s["overflow-x"] === "scroll" ||
                    s["overflow-y"] === "auto" || s["overflow-y"] === "scroll") {
                    this._eventCollection.bind(e, "scroll", this._onScroll, this);
                }

                if (e === $JD.body)
                    break;
            }
        } else {
            this._container.empty().appendChild(content);
        }

        this._container.removeClass("-loading").removeClass("-error");
        if (extclass) {
            this._container.addClass(extclass);
        }

        try {
            this.PositionPopup(this._container, this._poselmOuterRect = this._parentelm.outerRect);

            if (starttransition) {
                const transition = this._container.css([ "transition-duration", "transition-property" ]);

                if (typeof transition["transition-duration"] === 'string' && transition["transition-duration"] !== "0s" &&
                    (transition["transition-property"] === "height" || transition["transition-property"] === "width")) {
                    const transitionproperty = transition["transition-property"] as string;
                    const container = this._container;

                    if (content instanceof $JD.DOMHTMLElement) {
                        content.css(transitionproperty, Math.ceil(content.css(transitionproperty) as number));
                    }

                    const value = Math.ceil(container.css(transitionproperty) as number);
                    container.css(transitionproperty, 4);
                    container.css("transition-duration", 0);
                    this._transitionProperty = transitionproperty;
                    setTimeout(() => {
                                    container.css("transition-duration", undefined);
                                    container.css(transitionproperty, value);
                                }, 0);
                }
            }

            this._container.css("visibility", undefined);
        }
        catch (e) {
            $JD.body.removeChild(this._container);
            throw e;
        }
    }
    protected   ShowLoading()
    {
        if (this._container) {
            this.Show(<div>loading . . .</div>, false, "-loading");
        }
    }
    protected   PositionPopup(container:$JD.DOMHTMLElement, poselmOuterRect:$JD.IRect, flags?: PositionFlags): void {
        if (flags === undefined) {
            flags = PositionFlags.AlignLeft | PositionFlags.Bottom;
        }

        container.css({ top:0, left:0 });
        const fixed     = flags & (PositionFlags._fixed) ? true : false;
        let   posLeft   = poselmOuterRect.left;
        let   posTop    = poselmOuterRect.top;
        const cssset    = { position: fixed ? "fixed" : "absolute" } as ICssPosition;
        const window    = this._parentelm.defaultView;
        if (!fixed) {
            posLeft += window.pageXOffset;
            posTop  += window.pageYOffset;
        }

        const windowWidth  = window.innerWidth  - screen_width_correction;
        const windowHeight = window.innerHeight - screen_height_correction;
        const actuelRect = container.outerRect;
        let   correctWidth = false;
        let   correctBottom = false;

        switch (flags & PositionFlags.Horizontal) {
        case PositionFlags.AlignLeft:       cssset.left  = posLeft;                                                                                                     break;
        case PositionFlags.AlignRight:      cssset.right = windowWidth - (posLeft + poselmOuterRect.width);                                     correctWidth = true;    break;
        case PositionFlags.Left:            cssset.right = windowWidth - posLeft;                                                               correctWidth = true;    break;
        case PositionFlags.Right:           cssset.left  = posLeft + poselmOuterRect.width;                                                                             break;
        case PositionFlags.Center:          cssset.left  = posLeft + (poselmOuterRect.width - actuelRect.width) / 2;                                                    break;
        case PositionFlags.WindowLeft:      cssset.left  = 0;                                                                                                           break;
        case PositionFlags.WindowRight:     cssset.right = 0;                                                                                                           break;
        case PositionFlags.WindowCenter:    cssset.left  = Math.max(0, (window.innerWidth - actuelRect.width) / 2);                                                     break;
        }
        switch (flags & PositionFlags.Vertical) {
        case PositionFlags.AlignTop:        cssset.top    = posTop;                                                                                                     break;
        case PositionFlags.AlignBottom:     cssset.bottom = windowHeight - (posTop + poselmOuterRect.height);                                   correctBottom = true;   break;
        case PositionFlags.Top:             cssset.bottom = windowHeight - posTop;                                                              correctBottom = true;   break;
        case PositionFlags.Bottom:          cssset.top    = posTop + poselmOuterRect.height;                                                                            break;
        case PositionFlags.Middle:          cssset.top    = posTop  + (poselmOuterRect.height - actuelRect.height) / 2;                                                 break;
        case PositionFlags.WindowTop:       cssset.top    = 0;                                                                                                          break;
        case PositionFlags.WindowBottom:    cssset.bottom = 0;                                                                                                          break;
        case PositionFlags.WindowMiddle:    cssset.top    = Math.max(0, (screen.height - actuelRect.height) / 2);                                                       break;
        }

        if (typeof cssset.left    === 'number') {
            if (cssset.left > windowWidth-actuelRect.width)
                cssset.left = windowWidth-actuelRect.width;
            if (cssset.left < 0)
                cssset.left = 0;
        }
        if (typeof cssset.top     === 'number') {
            if (cssset.top > windowHeight-actuelRect.height)
                cssset.top = windowHeight-actuelRect.height;
            if (cssset.top < 0)
                cssset.top = 0;
        }

        if (typeof cssset.right   === 'number') {
            if (cssset.right  > windowWidth )
                cssset.right = windowWidth;
        }
        if (typeof cssset.bottom  === 'number') {
            if (cssset.bottom > windowHeight)
                cssset.bottom = windowHeight;
        }

        if (typeof cssset.top !== 'number')  cssset.top = undefined;
        if (typeof cssset.left !== 'number') cssset.left = undefined;

        container.css(cssset);

        if (correctWidth) {
            const d = (windowWidth - cssset.right!) - (container.outerRect.right + (!fixed ? window.pageXOffset : 0));
            screen_width_correction += d;

            if (-.5 > d || d > .5) {
                container.css("right", cssset.right! - d);
            }
        }
        if (correctBottom) {
            const d = (windowHeight - cssset.bottom!) - (container.outerRect.bottom + (!fixed ? window.pageYOffset : 0));
            screen_height_correction += d;

            if (-.5 > d || d > .5) {
                container.css("bottom", cssset.bottom! - d);
            }
        }
    }

    private     _onScroll()
    {
        if (this._poselmOuterRect && this._container) {
            const posClientRect = this._parentelm.outerRect;

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
            const posClientRect = this._parentelm.outerRect;
            this._poselmOuterRect = posClientRect;
            this.PositionPopup(this._container, this._poselmOuterRect);
        }
    }
}

export class Tooltip extends Popup
{
    private     _bottom:        boolean;
    private     _right:         boolean;
    private     _markerOuter:   $JD.DOMHTMLElement;
    private     _markerInner:   $JD.DOMHTMLElement;
    private     _markerSize!:   number;
    private     _offsetX!:      number;

                constructor(parentelm: $JD.DOMHTMLElement, content:$JD.AddNode)
    {
        super(parentelm,  "-tooltip", undefined);

        this._bottom     = false;
        this._right      = parentelm.css("text-align") === "right";
        this._calcMarkerSize();

        this.Show([
                    ( this._markerOuter = <span class="-marker -outer" /> ),
                    ( this._markerInner = <span class="-marker -inner" /> ),
                    <div class="-text">{ content }</div>
                  ]);
    }

    protected   PositionPopup(container:$JD.DOMHTMLElement, poselmOuterRect:$JD.IRect)
    {
        const winSize     = $JD.window.size;
        const posClientRect = { top: poselmOuterRect.top, left: poselmOuterRect.left, width: poselmOuterRect.width, height: poselmOuterRect.height };

        if (!this._bottom && posClientRect.top - container.outerSize.height - this._offsetX < 0) {
            this._bottom = true;
            this._calcMarkerSize();
        }

        this._markerOuter.css("border-width", this._markerSize    );
        this._markerInner.css("border-width", this._markerSize - 1);

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

            this._markerOuter.css("right", markerRight    );
            this._markerInner.css("right", markerRight + 1);
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
            this._markerOuter.css("left", markerLeft    );
            this._markerInner.css("left", markerLeft + 1);
        }

        if (this._postionFixed) {
            container.css("position", "fixed").css("left", posClientRect.left);
        } else {
            const view = this._parentelm.defaultView;
            container.css("position", "absolute").css("left", posClientRect.left + view.pageXOffset);
            posClientRect.top  += view.pageYOffset;
        }

        if (!this._bottom) {
            container.css("top", posClientRect.top - container.outerSize.height - this._offsetX);
            this._markerOuter.removeClass("-top").addClass("-bottom");
            this._markerInner.removeClass("-top").addClass("-bottom");
        }
        else {
            container.css("top", posClientRect.top + posClientRect.height - 1 + this._offsetX);
            this._markerOuter.removeClass("-bottom").addClass("-top");
            this._markerInner.removeClass("-bottom").addClass("-top");
        }
    }

    private     _calcMarkerSize() {
        const parentelm   = this._parentelm;
        this._markerSize = Math.round(this._bottom ? parentelm.css("padding-bottom") + parentelm.css("margin-bottom")
                                                 : parentelm.css("padding-top")    + parentelm.css("margin-top"));

        if (this._markerSize < 5) {
            this._offsetX    = 4 - this._markerSize;
            this._markerSize = 5;
        }
        else {
            this._offsetX    = 0;
        }
    }
}

export interface IControlDropdown<TDropdownRtn>
{
    readonly    container:                                             $JD.DOMHTMLElement;
    dropdownClose(value:TDropdownRtn|undefined, ev:Event|undefined):   void;
}

export class DropdownPopup<TNativeValue,
                           TControl extends IControlDropdown<TDropdownRtn>,
                           TDropdownData = void,
                           TDropdownRtn  = TNativeValue|null,
                           TDropdown extends DropdownContent<TNativeValue, TControl, TDropdownData, TDropdownRtn> = DropdownContent<TNativeValue, TControl, TDropdownData, TDropdownRtn>>
                                extends Popup
{
    /* @internal */     _popupcontainer:    $JD.DOMHTMLElement|undefined;
    /* @internal */     _focuselement:      $JD.DOMHTMLElement;
    /* @internal */     _control:           TControl|null;
    private             _dropdownClass:     string|IDropdownConstructor<TNativeValue, TControl, TDropdownData, TDropdownRtn, TDropdown>;
    private             _focusMandatory:    boolean;
    private             _calldata:          TDropdownData;
    private             _content:           TDropdown|undefined;
    private             _loadTask!:         $JA.Task<TDropdown>;
    private             _loadingTimer:      $J.Timeout;

    public get          DropdownClass()
    {
        return this._dropdownClass;
    }
    public get          FocusMandatory()
    {
        return this._focusMandatory;
    }
    public get          Calldata()
    {
        return this._calldata;
    }
    public get          Content()
    {
        return this._content;
    }
    public get          LoadTask()
    {
        return this._loadTask;
    }

    public get          focuselement()
    {
        return this._focuselement;
    }

                        constructor(control:TControl, focuselement:$JD.DOMHTMLElement, dropdownClass:string|IDropdownConstructor<TNativeValue, TControl, TDropdownData, TDropdownRtn, TDropdown>, className:string, focusMandatory:boolean, calldata:TDropdownData)
    {
        super(control.container,  "-dropdown " + className, undefined);
        this._focuselement      = focuselement;
        this._control           = control;
        this._dropdownClass     = dropdownClass;
        this._focusMandatory    = focusMandatory;
        this._calldata          = calldata;
        this._content           = undefined;
        this._loadingTimer      = new $J.Timeout(this.ShowLoading, this);
        this.Show(null);
        this._loadingTimer.start(200);
    }

    public              load()
    {
        this._loadTask = loadDropdownConstructor(this._dropdownClass, this._context)
                             .then((constructor) => {
                                       const content = new constructor(this, this._calldata) as TDropdown;
                                       this._content = content;
                                       const t = content.OnLoad(this._calldata, this._context);
                                       return (t) ? t.then(() => content) : content;
                                   })
                             .catch((err) => {
                                        if (this.container) {
                                            this.setMessage(err);
                                        }

                                        throw err;
                                    });
    }

    public              Focus()
    {
        if (this._container) {
            this._container.attr("tabIndex", 1000).focus();
            this._loadTask.then(() => {
                                    this._content!.OnFocus();
                                });
        }
    }
    protected           Remove()
    {
        this._loadingTimer.clear();

        if (this._content) {
            this._content.OnRemove();
        }

        this._control = null;
        super.Remove();
    }

    /* @internal */     setMessage(msg:string|Error, resetfocus?:boolean)
    {
        if (this._container && this._control && this._poselmOuterRect) {
            if (resetfocus) {
                if (this._container.attr("tabIndex") !== undefined) {
                    this._focuselement.focus();
                    this._container.attr("tabIndex", undefined);
                }
            }

            let divMessage:$JD.DOMHTMLElement;

            if (msg instanceof Error) {
                const m:$JD.AddNode[] = [];

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

                divMessage = <div class="-message -error">{ m }</div>;
            } else {
                divMessage = <div class="-message">{ msg }</div>;
            }

            if (!this._popupcontainer) {
                this._loadingTimer.clear();
                this.Show(this._popupcontainer = <div class="-popup">{ divMessage }</div>);
            }
            else {
                this._popupcontainer.empty().appendChild(divMessage);
                this.PositionPopup(this._container, this._poselmOuterRect);
            }
        }
    }
    /* @internal */     setContent(content:$JD.AddNode)
    {
        if (!(this._container && this._poselmOuterRect)) {
            throw new $J.InvalidStateError("Popup not show");
        }

        if (!this._popupcontainer) {
            this._loadingTimer.clear();
            this.Show(this._popupcontainer = <div class="-popup">{ content }</div>);
        }
        else {
            this._popupcontainer.empty().appendChild(content);
            this.PositionPopup(this._container, this._poselmOuterRect);
        }
    }
    /* @internal */     PositionPopup(container:$JD.DOMHTMLElement, poselmOuterRect:$JD.IRect)
    {
        const winSize       = $JD.window.size;
        let   left          = poselmOuterRect.left;
        const maxWidth      = Math.round((winSize.width) * ($JD.body.hasClass("jannesen-ui-mobile") ? 1 : 0.95));
        let   maxHeight     = Math.max(winSize.height - (poselmOuterRect.top + poselmOuterRect.height), poselmOuterRect.top);
        let   borderHeight:number;
        let   borderWidth:number;
        let   size:$JD.ISize;

        {
            const css = container.css([ 'border-left-width', 'border-right-width', 'border-top-width', 'border-bottom-width']);
            borderHeight = (css['border-left-width']! + css['border-right-width']! ) || 0;
            borderWidth  = (css['border-top-width']!  + css['border-bottom-width']!) || 0;
        }

        if (this._popupcontainer && this._popupcontainer.childNodesLength > 0) {
            this._popupcontainer.addClass("-position").css({ 'width': "max-content", 'height': "max-content", 'overflow-y':undefined });

            if (this._popupcontainer.css('overflow') === 'hidden') {
                maxHeight     = Math.round(winSize.height * ($JD.body.hasClass("jannesen-ui-mobile") ? 1 : 0.95));

            }

            const popupsize = this._popupcontainer.outerRect;

            size = {
                height: Math.min(Math.round(popupsize.height + borderHeight   ), maxHeight-borderHeight-1),
                width:  Math.min(Math.round(popupsize.width  + borderWidth + 2), maxWidth-borderWidth)     // Add extra of 2 px to keep browser little bit more happy
            };
        }
        else {
            size = {
                height: this.container!.element.scrollHeight + borderHeight,
                width:  this.container!.element.scrollWidth + borderWidth
            };
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

        const rest = Math.min(Math.round((maxWidth - size.width) / 2), 30);

        if (left > winSize.width - rest - size.width)
            left = winSize.width - rest - size.width;

        if (left <= rest)
            left = Math.min(poselmOuterRect.left, rest);

        let top = poselmOuterRect.top;

        if ((poselmOuterRect.top + poselmOuterRect.height - 1) + size.height < winSize.height) { // Fit below poselm
            top = poselmOuterRect.top + poselmOuterRect.height - 1;
        }
        else if (poselmOuterRect.top - size.height > 0) { // Fit above poselm
            top = poselmOuterRect.top - size.height;
        }
        else { // align bottom op window
            top = Math.max(winSize.height - size.height, 0);
        }

        container.css({
                      "top":      top,
                      "left":     left,
                      "height":   size.height,
                      "width":    size.width
                  });

        if (this._popupcontainer) {
            this._popupcontainer.css({
                                     width:         undefined,
                                     height:        undefined,
                                     "overflow-y":  this._popupcontainer.prop("scrollHeight") > (size.height - borderHeight) + 1 ? undefined : "hidden"
                                 }).removeClass("-position");
        }
    }
}

export abstract class DropdownContent<TNativeValue,
                                      TControl extends IControlDropdown<TDropdownRtn>,
                                      TDropdownData,
                                      TDropdownRtn>
{
    protected           _popup:         DropdownPopup<TNativeValue, TControl, TDropdownData, TDropdownRtn>;

    protected get       container()
    {
        return this._popup.container;
    }
    protected get       control():TControl|null
    {
        return this._popup._control;
    }
    protected get       scrollelm()
    {
        return this._popup._popupcontainer!;
    }

                        constructor(popup:DropdownPopup<TNativeValue, TControl, TDropdownData, TDropdownRtn>)
    {
        this._popup   = popup;
    }

    public              OnLoad(calldata:TDropdownData, ct:$JA.Context): $JA.Task<void>|void
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
            const celm = container.element;

            for (let e = document.activeElement ; e !== null && e !== undefined && e !== document.body ; e = e.parentElement) {
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

    protected           setMessage(msg:string|Error, resetfocus?:boolean)
    {
        this._popup.setMessage(msg, resetfocus);
    }
    protected           setContent(content:$JD.AddNode)
    {
        this._popup.setContent(content);
    }
    protected           Close(value:TDropdownRtn|undefined, ev:Event|undefined)
    {
        const control = this.control;

        if (control) {
            control.dropdownClose(value, ev);
        }
    }
    protected           PositionPopup() {
        const container        = this._popup.container;
        const poselmClientRect = this._popup.poselmClientRect;

        if (container && poselmClientRect) {
            this._popup.PositionPopup(container, poselmClientRect);
        }
    }
}

export abstract class TableDropdown<TNativeValue,
                                    TControl extends IControlDropdown<TDropdownRtn>,
                                    TDropdownData,
                                    TDropdownRtn>
                          extends DropdownContent<TNativeValue, TControl, TDropdownData, TDropdownRtn>
{
    private         _tbody:                     $JD.DOMHTMLElement|undefined;
    private         _rowcount:                  number|undefined;
    private         _selectedRow:               number|undefined;
    private         _mouseenabled:              boolean;
    private         _mousemovecnt:              number|undefined;

    protected get   selectedRow()
    {
        return this._selectedRow;
    }

                    constructor(popup:DropdownPopup<TNativeValue, TControl, TDropdownData, TDropdownRtn>)
    {
        super(popup);
        const container = this.container!;

        container.bind("keydown", (ev) => {
                                            if (this.onKeyDown(ev)) {
                                                this._mouseenabled = false;
                                                $J.eventHandled(ev);
                                            }
                                        });
        container.bind("mousemove", (ev) => {
                                            if (!this._mouseenabled) {
                                                if (this._mousemovecnt !== undefined) {
                                                    if (++(this._mousemovecnt) >= 8) {
                                                        this._mouseenabled = true;
                                                    }
                                                } else {
                                                    this._mousemovecnt = 0;
                                                    setTimeout(() => {
                                                                        this._mousemovecnt = undefined;
                                                                }, 350);
                                                }
                                            }
                                        });
        container.bind("mouseover", (ev) => {
                                            if (this._selectedRow === undefined) {
                                                this._mouseenabled = true;
                                            }

                                            if (this._mouseenabled) {
                                                this.selectRow(this._getrow(ev.target));
                                            }
                                        });
        container.bind("mouseleave", (ev) => {
                                            if (this._mouseenabled) {
                                                this.selectRow(undefined);
                                            }
                                        });
        container.bind("wheel", (ev) => {
                                            this._mouseenabled = true;
                                            $J.setTimeout(()=> {
                                                                this.selectRow(this._getrow(document.elementFromPoint(ev.clientX, ev.clientY)));
                                                            }, 50);
                                        });

        container.bind("mousedown", (ev) => {
                                            this._mouseenabled = true;
                                            if (ev.button === 0) {
                                                ev.preventDefault();
                                            }
                                        });

        container.bind("click", (ev) => {
                                            this._mouseenabled = true;
                                            if (typeof this._rowcount === 'number') {
                                                this.clickrow(this._getrow(ev.target), ev);
                                            }
                                        });
        this._mouseenabled = false;
    }

    public          OnFocus()
    {
        if (this._selectedRow === undefined && typeof this._rowcount === 'number') {
            this.selectRow(0);
        }
    }

    protected abstract clickrow(row:number|undefined, ev:Event|undefined):void;
    protected       tableColgroup():$JD.DOMHTMLElement[] | undefined
    {
        return undefined;
    }

    protected       setTBody(rows:$JD.DOMHTMLElement[])
    {
        this._selectedRow = undefined;

        if (!this._tbody) {
            const tbody = <tbody>
                             { rows }
                          </tbody>;

            const colgroup = this.tableColgroup();
            this.setContent(<div class="-data">
                                <table>
                                    { colgroup && <colgroup>{ colgroup }</colgroup> }
                                    { tbody }
                                </table>
                            </div>);
            this._tbody = tbody;
        }
        else {
            this._tbody.empty().appendChild(rows);
            this.PositionPopup();
        }

        this._rowcount = rows.length;
    }
    protected       setMessage(msg:string|Error, restorefocus?: boolean)
    {
        this._tbody       = undefined;
        this._rowcount    = undefined;
        this._selectedRow = undefined;
        super.setMessage(msg, restorefocus);
    }
    protected       setBusy()
    {
        this._rowcount = undefined;
        this.container!.addClass("-busy");
    }

    protected       onKeyDown(ev:KeyboardEvent):boolean
    {
        if (!(ev.altKey || ev.ctrlKey || ev.metaKey)) {
            const container = this.container;

            if (this._popup && container) {
                switch(ev.key) {
                case "Backspace":
                    return true;

                case "Tab":
                    if (typeof this._selectedRow === 'number') {
                        this.clickrow(this._selectedRow, ev);
                    }
                    return true;

                case "Enter":
                    if (typeof this._selectedRow === 'number') {
                        this.clickrow(this._selectedRow, ev);
                    }
                    return true;

                case "Escape":
                    this.Close(undefined, ev);
                    return true;

                case "PageUp":
                    if (typeof this._selectedRow === 'number') {
                        this.selectRow(this._selectedRow - calcPageStep(container));
                    }
                    return true;

                case "PageDown":
                    if (typeof this._selectedRow === 'number') {
                        this.selectRow(this._selectedRow + calcPageStep(container));
                    }
                    return true;

                case "End":
                    if (typeof this._rowcount === 'number') {
                        this.selectRow(this._rowcount - 1);
                    }
                    return true;

                case "Home":
                    if (typeof this._rowcount === 'number') {
                        this.selectRow(0);
                    }
                    return true;

                case "ArrowUp":
                    if (typeof this._selectedRow === 'number' && this._selectedRow > 0) {
                        this.selectRow(this._selectedRow - 1);
                    }
                    else {
                        this._popup.focuselement.focus();
                    }
                    return true;

                case "ArrowDown":
                    if (typeof this._selectedRow === 'number') {
                        this.selectRow(this._selectedRow + 1);
                    }
                    return true;
                }
            }
        }

        return false;
    }
    protected       selectRow(row:number|undefined)
    {
        if (this._tbody) {
            if (this._selectedRow !== undefined) {
                this._tbody.childNodes(this._selectedRow).removeClass("-selected");
                this._selectedRow = undefined;
            }

            if (row !== undefined && typeof this._rowcount === 'number' && this._rowcount > 0) {
                row = Math.max(Math.min(row, this._rowcount - 1), 0);
                this._tbody.childNodes(row).addClass("-selected").element.scrollIntoView({ block: 'nearest' });
                this._selectedRow = row;
            }
        }
    }

    private         _getrow(elm: any)
    {
        if (this._tbody) {
            const tbody = this._tbody.element;

            while (elm instanceof Element && elm !== document.body && elm.parentElement !== tbody) {
                elm = elm.parentElement;
            }

            for(let n = 0 ; n < tbody.childNodes.length ; ++n) {
                if (tbody.childNodes[n] === elm)
                    return n;
            }
        }

        return undefined;
    }
}

function loadDropdownConstructor<TNativeValue,
                                 TControl extends IControlDropdown<TDropdownRtn>,
                                 TDropdown extends DropdownContent<TNativeValue, TControl, TDropdownData, TDropdownRtn>,
                                 TDropdownData,
                                 TDropdownRtn>(dropdownClass:string|IDropdownConstructor<TNativeValue, TControl, TDropdownData, TDropdownRtn, TDropdown>, ct:$JA.Context)
{

    if (typeof dropdownClass === 'function') {
        return $JA.Task.resolve(dropdownClass);
    }

    const classNameParts = dropdownClass.split(":", 2);
    if (classNameParts.length !== 2) {
        throw new $J.InvalidStateError("Invalid dropdownClass '" + classNameParts + "'");
    }

    return $JA.Require(classNameParts[0], ct)
              .then((r) => {
                        if (r instanceof Object) {
                            const c = (r as any)[classNameParts[1]];

                            if (c !== undefined) {
                                if (!$J.testContructorOf(c, DropdownContent as any)) {
                                    throw new $JA.LoadError("'" + classNameParts[1] + "' in module '" + classNameParts[0] + "' is not a DropdownContent constructor.");
                                }

                                return c as IDropdownConstructor<TNativeValue, TControl, TDropdownData, TDropdownRtn, TDropdown>;
                            }
                        }

                        throw new $JA.LoadError("Can't locate '" + classNameParts[1] + "' in module '" + classNameParts[0] + "'.");
                    });
}
function calcPageStep(container:$JD.DOMHTMLElement): number
{
    const rowheight = container.css("font-size") * 1.167 + 2;
    return Math.max(1, Math.floor(container.clientRect.height / rowheight - 0.9));
}

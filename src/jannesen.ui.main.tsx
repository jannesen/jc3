/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J       from "jc3/jannesen";
import * as $JD      from "jc3/jannesen.dom";
import * as $JA      from "jc3/jannesen.async";
import * as $JUC     from "jc3/jannesen.ui.content";
import * as $JUT     from "jc3/jannesen.ui.treeview";
import * as $JUM     from "jc3/jannesen.ui.menu";

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export interface IMainState
{
    sidebarVisible?:        boolean;
    sidebarWidth:           number;
    sidebarPinned:          boolean;
}

export interface IMainAttr
{
    "class"?:               string;
    size?:                  $JD.ISize;
    sidebarVisible?:        boolean;
    sidebarWidth?:          number;
    sidebarPinned?:         boolean;
    sidebarDataSource?:     (data:$JUT.TreeViewItemList|null, ct:$JA.ICancellationToken) => $JUT.IDataSourceResult;
    newform?:               (formName:string, args:$J.IUrlArgs, replaceHistory:boolean) => ($JUC.IFormState|undefined);
    gotoback?:              () => void;
    onsidebarclick?:        (data:$JUT.TreeViewItem) => void;
    onstatechanged?:        (state:IMainState) => void;
}
/**
 * !!DOC
 */
export class Main extends $JD.Container
{
    private         _sidebar?:                  $JD.DOMHTMLElement;
    private         _sidebar_buttonbar?:        $JD.DOMHTMLElement;
    private         _sidebar_menu_container?:   $JD.DOMHTMLElement;
    private         _divider?:                  $JD.DOMHTMLElement;
    private         _content:                   $JD.DOMHTMLElement;
    private         _sidebar_close?:            $JD.DOMHTMLElement;
    private         _sidebar_pin?:              $JD.DOMHTMLElement;
    private         _sidebar_open?:             $JD.DOMHTMLElement;
    private         _sidebar_menu?:             $JUT.TreeView;
    private         _title_div:                 $JD.DOMHTMLElement;
    private         _nav_back:                  $JD.DOMHTMLElement;
    private         _nav_refresh:               $JD.DOMHTMLElement;
    private         _nav_prev:                  $JD.DOMHTMLElement;
    private         _nav_next:                  $JD.DOMHTMLElement;
    private         _moremenu:                  $JUM.MenuButton;
    private         _formloader:                $JUC.FormLoader;
    private         _size:                      $JD.ISize|undefined;
    private         _sidebar_visible:           boolean;
    private         _sidebar_pinned:            boolean;
    private         _sidebar_width:             number;
    private         _sidebar_resize_active:     boolean;
    private         _title:                     $JD.AddNode;
    private         _transition_start?:         number;
    private         _statechangeactive?:        number;

    public          newform?:                   (formName:string, args:$J.IUrlArgs, replaceHistory:boolean) => $JUC.IFormState|undefined;
    public          gotoback?:                  () => void;

    public get      size()
    {
        return this._container.size;
    }
    public set      size(size:$JD.ISize)
    {
        if (!this._size || this._size.height !== size.height || this._size.width !== size.width) {
            this._size = size;
            this._updateStyle(false);
        }
    }
    public get      sidebarVisible()
    {
        return this._sidebar_visible;
    }
    public set      sidebarVisible(visible:boolean)
    {
        if (this._sidebar && this._sidebar_visible !== visible) {
            this._sidebar_visible = visible;
            this._updateStyle(true);
            if (this._sidebar_pinned) {
                this._statechanged();
            }
        }
    }
    public get      sidebarWidth()
    {
        return this._sidebar_width;
    }
    public set      sidebarWidth(width:number)
    {
        if (this._sidebar_width !== width) {
            this._sidebar_width = width;
            this._updateStyle(false);
            this._statechanged();
        }
    }
    public get      sidebarPinned()
    {
        return this._sidebar_pinned;
    }
    public set      sidebarPinned(pinned:boolean)
    {
        if (this._sidebar_pinned !== pinned && this._sidebar) {
            this._sidebar_pinned = pinned;
            this._updateStyle(true);
            this._statechanged();
        }
    }

    public get      formloader()
    {
        return this._formloader;
    }

    public          constructor(attr:IMainAttr)
    {
        super(<div class={ $JD.classJoin(attr["class"], "jannesen-ui-main") }/>);

        if (attr.sidebarDataSource) {
            this._sidebar = <div class="-sidebar" style="width:0" onmouseleave={() => { if (!this.sidebarPinned && !this._sidebar_resize_active) { this.sidebarVisible = false; } }}> {}
                                    { this._sidebar_buttonbar = <div class="-buttonbar">
                                                                    { this._sidebar_close  = <button class="-close" tabIndex="-1" onclick={() => { this.sidebarVisible = false;               }} /> }
                                                                    { this._sidebar_pin    = <button class="-pin"   tabIndex="-1" onclick={() => { this.sidebarPinned  = !this.sidebarPinned; }} /> }
                                                                </div> }
                                    { this._sidebar_menu_container = <div class="-menu-container">
                                                                        { this._sidebar_menu = <$JUT.TreeView dataSource={ attr.sidebarDataSource }
                                                                                                              onclick={(e) => {
                                                                                                                  this.trigger("sidebarclick", e);
                                                                                                                  if (!this._sidebar_pinned) {
                                                                                                                      this.sidebarVisible = false;
                                                                                                                  }
                                                                                                              } } /> }
                                                                     </div> }
                                    { this._divider = <div class="-divider" /> }
                            </div>;

            this._container.appendChild(this._sidebar);

            this._divider.bind("mousedown",  this._onDivMove, this);
            this._divider.bind("touchstart", this._onDivMove, this);
        }

        this._content = <div class="-content" style="left:0">
                            <div class="-titlebar">
                                { this._sidebar_open = this._sidebar && <button class="-sidebar"
                                                                                tabIndex="-1"
                                                                                onclick={() => { this.gotosidebar(); } }
                                                                                onmouseover={() => { if (!this.sidebarPinned) { this.sidebarVisible = true; } } }
                                                                                title="Open side menu"/> }
                                { this._title_div    = <div   class="-title"    /> }
                                <div class="-right">
                                    { this._nav_back    = <button class="-nav-back -disabled"    tabIndex="-1" onclick={() => { if (this.gotoback) this.gotoback(); } } title="Go back"/> }
                                    { this._nav_refresh = <button class="-nav-refresh -disabled" tabIndex="-1" onclick={() => { this.refresh();                     } } title="Refresh" /> }
                                    { this._nav_prev    = <button class="-nav-prev -disabled"    tabIndex="-1" onclick={() => { this.gotoprev();                    } } title="Previous record"/> }
                                    { this._nav_next    = <button class="-nav-next -disabled"    tabIndex="-1" onclick={() => { this.gotonext();                    } } title="Next record"/> }
                                    { this._moremenu    = <$JUM.MenuButton class="jannesen-ui-menu -button -moremenu"
                                                                           title="Action menu"
                                                                           menupos={$JUM.MenuPosition.Right}
                                                                           dataSource={(ct) => {
                                                                               let   form = !this._formloader.isBusy && this._formloader.contentBody;
                                                                               return (form && form.isIdle) ? form.moreMenuDatasource(ct) : [];
                                                                           }} /> }
                                </div>
                            </div>
                            { this._formloader = new $JUC.FormLoader({
                                                    openform:           (openform, args, historyReplace, ct) => this._openform(openform, args, historyReplace, ct),
                                                    historyChangeArgs:  (args, historyReplace)               => this._historyChangeArgs(args, historyReplace),
                                                    formchanged:        (reason, form)                       => this._formChanged(reason, form)
                                                 }) }
                        </div>;
        this._container.appendChild(this._content);

        this._sidebar_visible       = false;
        this._sidebar_pinned        = false;
        this._sidebar_width         = 200;
        this._sidebar_resize_active = false;
        this._moremenu.disabled     = true;
        this._statechangeactive     = -1; // fake statechange active so no fire while init

        this._applyAttr(attr, "size", "sidebarWidth", "sidebarPinned", "sidebarVisible", "onsidebarclick", "onstatechanged", "newform", "gotoback");
        this._updateStyle(false);

        this._container.bind("AddedToDocument", () => { this._updateStyle(false); });
        this._statechangeactive     = undefined;
    }

    public          openform<TArgs=$J.IUrlArgs>(formNameClass:string|(new ()=>$JUC.Form<TArgs>), args:TArgs, saveformstate?:boolean, formstate?:$JUC.IFormState, ct?:$JA.ICancellationToken|null)
    {
        if (ct === undefined) ct=null;

        if (saveformstate) {
            this._formloader.saveFormState();
        }

        return this._openformex(formNameClass, args, formstate, ct);
    }
    public          gotosidebar()
    {
        if (this._sidebar) {
            if (!this.sidebarVisible) {
                this.sidebarVisible = true;
            }

            this._sidebar_menu!.focus();
        }
    }
    public          gotomoremenu()
    {
        if (!this._moremenu.disabled && !this._formloader.isBusy) {
            this._moremenu.openMenu();
        }
    }
    public          gotoprev()
    {
        if (this._formloader.contentBody && this._formloader.contentBody._formstate && this._formloader.contentBody._formstate.argset) {
            let prev = this._formloader.contentBody._formstate.argset.prev();

            if (prev) {
                this._openform(".", prev, true, null);
            }
        }
    }
    public          gotonext()
    {
        if (this._formloader.contentBody && this._formloader.contentBody._formstate && this._formloader.contentBody._formstate.argset) {
            let next = this._formloader.contentBody._formstate.argset.next();
            if (next) {
                this._openform(".", next, true, null);
            }
        }
    }
    public          refresh()
    {
        if (this._formloader.contentBody && typeof (this._formloader.contentBody as any).refresh === 'function') {
            (this._formloader.contentBody as any).refresh();
        }
    }

    /*@internal*/   _openform(formName:string, args:$J.IUrlArgsColl|$JUC.IUrlArgsSet, historyReplace:boolean, ct:$JA.ICancellationToken|null): $JA.Task<void>
    {
        if (!historyReplace) {
            this._formloader.saveFormState();
        }

        formName = this._fullFormName(formName);

        let argset:$JUC.IUrlArgsSet|undefined;

        if ($JUC.isIUrlArgsSet(args)) {
            argset = args;
            args = $J.extend<$J.IUrlArgsColl>({}, argset.args());
        }

        if (this._formloader.contentBody && formName === this._formloader.contentBody.contentNameClass) {
            args['_tab'] = this._formloader.contentBody.args['_tab'];
        }

        let nargs:$J.IUrlArgs;

        try {
            nargs = $JUC.normalizeUrlArgs(args);
        } catch (err) {
            return $JUC.DialogError.show(err, ct) as $JA.Task<void>;
        }

        let formstate = (this.newform) ? this.newform(formName, nargs, historyReplace) : undefined;

        if (formstate) {
            formstate.argset = argset;
        }

        return this._openformex(formName, nargs, formstate, ct);
    }
    private         _historyChangeArgs(args:$J.IUrlArgsColl, historyReplace:boolean) {
        if (this.newform) {
            let curFormNameClass = this._formloader.contentBody && this._formloader.contentBody.contentNameClass;

            if (typeof curFormNameClass === 'string'){
                try {
                    this.newform(curFormNameClass, $JUC.normalizeUrlArgs(args), historyReplace);
                } catch (e) {
                }
            }
        }
    }
    private         _openformex<TArgs>(formNameClass:string|(new ()=>$JUC.Form<TArgs>), args:TArgs, formstate:$JUC.IFormState|undefined, ct:$JA.ICancellationToken|null)
    {
        if (this._formloader.contentBody && this._formloader.contentBody.contentNameClass === formNameClass) {
            this._moremenu.disabled = true;
            this._nav_refresh.toggleClass("-disabled", true);
        }

        if (!(formstate && formstate.argset)) {
            this._nav_prev.toggleClass("-disabled", true);
            this._nav_next.toggleClass("-disabled", true);
        }

        return this._formloader.open(formNameClass, args, formstate, ct);
    }
    private         _updateStyle(transition:boolean)
    {
        if (this._sidebar) {
            this._sidebar_close!.toggleClass("-disabled", !this._sidebar_pinned);
            this._sidebar_pin!.toggleClass("-true",       this._sidebar_pinned);
            this._sidebar_open!.css("width",              this._sidebar_visible && this._sidebar_pinned ? 0 : undefined);
            this._sidebar.toggleClass("-visible",        this._sidebar_visible);

            if (this._container.isLive && this._size) {
                this._container.setSize(this._size);

                if (this._sidebar_visible) {
                    if (this._sidebar_width > this._size.width) {
                        this._sidebar_width = this._size.width;
                    }

                    if (this._sidebar_width < 64) {
                        this._sidebar_width = 64;
                    }

                    const divwidth = this._divider!.css("width");
                    this._sidebar_buttonbar!.css("width",      this._sidebar_width - divwidth);
                    this._sidebar_menu_container!.css("width", this._sidebar_width - divwidth);
                }

                if (transition) {
                    if (!this._transition_start) {
                        this._updateSidebarWidth(0);
                    }

                    this._transition_start = (new Date()).getTime();
                } else {
                    this._updateSidebarWidth(1);
                }
            }
        } else {
            if (this._container.isLive && this._size) {
                this._container.setSize(this._size);
                this._formloader.setSize({
                                            height: this._size.height - this._formloader.container.position.top,
                                            width:  this._size.width
                                         });
            }
        }
    }
    private         _updateSidebarWidth(progess:number)
    {
        if (progess > 0) {
            const curwidth = this._sidebar!.css("width");
            const curleft  = this._content.css("left");
            let width:number;
            let left:number;

            if (progess < 1) {
                width = this._sidebar_visible
                                    ? Math.max(this._sidebar_width * progess, curwidth)
                                    : Math.min(this._sidebar_width * (1 - progess), curwidth);

                left  = this._sidebar_pinned && this._sidebar_visible
                                    ? Math.max(this._sidebar_width * progess, curleft)
                                    : Math.min(this._sidebar_width * (1 - progess), curleft);
            } else {
                width = this._sidebar_visible                         ? this._sidebar_width : 0;
                left  = this._sidebar_pinned && this._sidebar_visible ? this._sidebar_width : 0;
            }

            if (left > width) {
                left = width;
            }

            if (curwidth !== width) {
                this._sidebar!.css("width", width);
            }

            if (curleft !== left) {
                this._content.css('left', left);
            }

            if (this._size) {
                this._formloader.setSize({
                                            height: this._size.height - this._formloader.container.position.top,
                                            width:  this._size.width  - left
                                         });
            }
        }

        if (progess < 1) {
            $J.setTimeout(() => {
                                if (this._container.isLive) {
                                    let t = ((new Date()).getTime() - this._transition_start!) / 500;
                                    this._updateSidebarWidth((t >= 0 && t < 1) ? (t < 0.5 ? 2*t*t : -1 + (4-2*t)*t) : 1);
                                }
                          }, 20);
        } else {
            this._transition_start = undefined;
        }
    }
    private         _formChanged(reason:$JUC.FormChangedReason, sourceform:$JUC.Form)
    {
        let   form    = this._formloader.contentBody;
        let   isLoaded = form ? form.isLoaded : false;

        if ((reason === $JUC.FormChangedReason.Loaded || reason === $JUC.FormChangedReason.TitleChanged) && form === sourceform) {
            let title:$JD.AddNode;

            try {
                title = isLoaded ? form!.formTitle() : null;
            } catch (err) {
                title = "ERROR: " + err;
            }

            if (this._title !== title) {
                this._title_div.empty().appendChild(this._title = title);
                document.title = (typeof title === 'string' ) ? title : ".....";
            }
        }

        if (reason === $JUC.FormChangedReason.Loaded && form === sourceform) {
            const argset = form && form._formstate ? form._formstate.argset : undefined;
            this._nav_back   .toggleClass("-disabled", !(typeof this.gotoback === 'function'));
            this._nav_refresh.toggleClass("-disabled", !(this._formloader.contentBody && typeof (this._formloader.contentBody as any).refresh === 'function'));
            this._nav_prev   .toggleClass("-disabled", !(argset && argset.hasPrev()));
            this._nav_next   .toggleClass("-disabled", !(argset && argset.hasNext()));

            if (isLoaded) {
                form!.focus();
            }
        }

        this._moremenu.disabled = this._formloader.isBusy || !form!.moreMenuEnabled();
    }
    private         _fullFormName(formName:string)
    {
        if (formName.startsWith("~")) {
            return formName.substr(1);
        }

        let curFormNameClass = this._formloader.contentBody && this._formloader.contentBody.contentNameClass;

        if (!(typeof curFormNameClass === 'string')) {
            throw new $J.InvalidStateError("curNameClass is not a string");
        }

        if (formName === ".") {
            return curFormNameClass;
        }

        let  i = curFormNameClass.indexOf(':');
        if (i < 0) {
            i = curFormNameClass.length;
        }
        curFormNameClass = curFormNameClass.substr(0, i);

        if (formName.startsWith(':')) {
            return  curFormNameClass + formName;
        }

        i = curFormNameClass.lastIndexOf('/', i);
        return (i >= 0) ? optimizePath(curFormNameClass.substr(0, i + 1) + formName) : formName;
    }
    private         _onDivMove(ev:UIEvent)
    {
        this._sidebar!.css("transition", "none");
        this._content.css("transition", "none");
        this._sidebar_resize_active = true;
        $JUC.moveTracker(ev, { top:0, left: this._sidebar_width },
                        (pos) => {
                            this.sidebarWidth = Math.max(64, pos.left);
                        },
                        () => {
                            this._sidebar!.css("transition", undefined);
                            this._content.css("transition", undefined);
                            this._sidebar_resize_active = false;
                            this._statechanged();
                        });
    }
    private         _statechanged()
    {
        if (!this._sidebar_resize_active && !this._statechangeactive) {
            this._statechangeactive = $J.setTimeout(() => {
                                            this._statechangeactive = undefined;
                                            this.trigger("statechanged", {
                                                             sidebarVisible: this.sidebarPinned ? this.sidebarVisible : undefined,
                                                             sidebarWidth:   this.sidebarWidth,
                                                             sidebarPinned:  this.sidebarPinned
                                                         });
                                      }, 0);
        }
    }
}

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export const main_basepath = baseUrl(location.href);

/**
 * !!DOC
 */
export function makeAbsoluteUrl(basepath: ({ host:string, path:string}), url:string)
{
    const p = absoluteUrl(basepath, url);
    return p.host + p.path + p.querystring;
}
/**
 * !!DOC
 */
export function makeRelativeUrl(basepath: ({ host:string, path:string}), url:string)
{
    const p = absoluteUrl(basepath, url);
    let r:string;

    if (p.host === basepath.host) {
        if (p.path.startsWith(main_basepath.path)) {
            r = p.path.substr(main_basepath.path.length) + p.querystring;
        } else {
            r = p.path + p.querystring;
        }
    } else {
        r = p.host + p.path + p.querystring;
    }

    return r;
}
/**
 * !!DOC
 */
export function makeModuleUrl(basepath: ({ host: string, path: string }), url: string)
{
    const path_hpqs = /^!([^#?]*)([#?].*)?$/.exec(url);

    if (!(path_hpqs && typeof path_hpqs[1] === "string")) {
        throw new $J.InvalidStateError("Invalid url '" + url + "'.");
    }

    const querystring = (path_hpqs.length > 2 && typeof path_hpqs[2] === 'string') ? path_hpqs[2] : '';
    url = path_hpqs[1]!;

    if (url.startsWith('/') || url.indexOf('//') >= 0) {
        throw new Error("Invalid module url '" + url + "'.");
    }

    url = optimizePath(basepath.path + url);
    if (!url.startsWith(main_basepath.path)) {
        throw new Error("Module url is outside the application'" + url + "'.");
    }

    return url.substr(main_basepath.path.length) + querystring;
}
/**
 * !!DOC
 */
export function absoluteUrl(basepath: ({ host:string, path:string}), url:string)
{
    const path_hpqs = /^([^#?]*)([#?].*)?$/.exec(url);

    if (!(path_hpqs && typeof path_hpqs[1] === "string")) {
        throw new $J.InvalidStateError("Invalid url '" + url + "'.");
    }

    const querystring = (path_hpqs.length > 2 && typeof path_hpqs[2] === 'string') ? path_hpqs[2] : '';
    url = path_hpqs[1]!;
    const  path_hp   = /^([a-zA-Z]+\:\/\/[a-zA-Z0-9_\-\.]+(?:\:[0-9]+)?)(.*)/.exec(url);

    if (path_hp && typeof path_hp[1] === "string" && typeof path_hp[2] === "string") {
        return {
                    host:           path_hp[1]!,
                    path:           optimizePath(path_hp[2]!),
                    querystring:    querystring
               };
    } else {
        if (!url.startsWith('/')) {
            url = basepath.path + url;
        }
    }

    return {
                host:        basepath.host,
                path:        optimizePath(url),
                querystring: querystring
           };
}
/**
 * !!DOC
 */
export function baseUrl(url: string)
{
    const match = /^([a-zA-Z]+\:\/\/[a-zA-Z0-9_\-\.]+(?:\:[0-9]+)?)(\/(?:[a-zA-Z0-9\-\.\_\~\:\/\@\!\$\+\,\;\=]+\/))/.exec(url);

    if (!(match && match.length === 3 && typeof match[1] === "string" && typeof match[2] === "string")) {
        throw new Error("Invalid path '" + url + "'.");
    }

    return {
                host: match[1]!,
                path: optimizePath(match[2]!)
           };
}
/**
 * !!DOC
 */
export function optimizePath(path: string) {
    if (path.indexOf('.') >= 0 || path.indexOf('//') >= 0) {
        const parts = path.split('/');
        const rtn   = [] as string[];

        for (let i = 0; i < parts.length ; ++i) {
            const p = parts[i];

            switch (p) {
            case '.':
                break;

            case '..':
                if (rtn.length === 0)
                    throw new Error("Invalid join try to go above root.");
                rtn.pop();
                break;

            case '':
                if (i === 0 || i === parts.length - 1) {
                    rtn.push('');
                }
                break;

            default:
                rtn.push(p);
                break;
            }
        }

        path = rtn.join('/');
    }

    return path;
}

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
var g_statecache:$JUC.IFormState[] = [];

export function get_browser_formstate(replace:boolean): $JUC.IFormState|undefined
{
    if (history.replaceState) {
        if (!history.state) {
            history.replaceState($J.generateUUID(), "", undefined);
        }

        const href = location.href;
        const uuid = history.state as string;

        for (let i = g_statecache.length - 1 ; i >= 0 ; --i) {
            let state = g_statecache[i];
            if (state.uuid === uuid) {
                if (!replace && state.href === href) {
                    if (i < g_statecache.length - 1) {
                        g_statecache.splice(i, 1);
                        g_statecache.push(state);
                    }

                    return state;
                }

                g_statecache.splice(i, 1);
                break;
            }
        }

        if (g_statecache.length > 6) {
            g_statecache.splice(0, g_statecache.length - 6);
        }

        let newState = {
                            uuid:       uuid,
                            timestamp:  (new Date).getTime(),
                            href:       href,
                            state:      undefined as any,
                            argset:     undefined as any
                       };

        g_statecache.push(newState);

        return newState;
    }

    return undefined;
}

//-------------------------------------------------------------------------------------------------

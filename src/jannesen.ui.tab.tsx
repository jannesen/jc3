/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J   from "jc3/jannesen";
import * as $JA  from "jc3/jannesen.async";
import * as $JD  from "jc3/jannesen.dom";
import * as $JUC from "jc3/jannesen.ui.content";
import * as $JUM from "jc3/jannesen.ui.menu";

export interface AddTabArray extends Array<AddTab> {}
export type AddTab    = Tab|undefined|false|AddTabArray;

export interface ITabsAttr
{
    containerClass?:    string;
    context?:           $JA.Context;
    selectfirst?:       boolean;
}

export class Tabs extends $JD.Container implements $JD.ISetSize
{
    protected   _context:               $JA.Context;
    private     _tabHeader:             $JD.DOMHTMLElement;
    private     _children:              Tab[];
    private     _size:                  $JD.ISize|undefined;
    private     _sizeContent:           $JD.ISize|undefined;
    private     _selectedTab:           Tab|null;
    private     _visibleTab:            Tab|null;
    private     _timer:                 number|null;

    public  get Tabs() {
        return this._children;
    }
    public  get context()
    {
        return this._context;
    }
    public  get size() {
        return this._size;
    }
    public  get sizeContent() {
        return this._sizeContent;
    }
    public  get selectedTab() {
        return this._selectedTab;
    }
    public  get activeTab() {
        return this._selectedTab === this._visibleTab ? this._selectedTab : null;
    }

    public      constructor(attr?: ITabsAttr, ...children: AddTab[])
    {
        const tabheader = <div class="-tab-header"/>;
        const container = <div class="jannesen-ui-tabs" tabIndex="0" >{ tabheader }</div>;

        if (attr && attr.containerClass) {
            container.addClass(attr.containerClass);
        }

        super(container);

        this._context     = new $JA.Context({ parent: attr && attr.context, component:this, dom: container });
        this._tabHeader   = tabheader;
        this._children    = [];
        this._size        = undefined;
        this._selectedTab = null;
        this._visibleTab  = null;
        this._timer       = null;

        container.data('tabs', this);

        this._addChild(children);
        container.bind("AddedToDocument", this._updsize, this);

        if (attr && attr.selectfirst && this._children.length > 0) {
            this.selectTab(this._children[0]);
        }
    }

    public      bind(eventName:"selected", handler: (ev:Tab)=>void, thisArg?:any): void;
    public      bind(eventName:"visible",  handler: (ev:Tab)=>void, thisArg?:any): void;
    public      bind(eventName:string, handler: (ev:any)=>void, thisArg?:any) {
        super.bind(eventName, handler, thisArg);
    }
    public      trigger(eventName:"selected", ev:Tab):void;
    public      trigger(eventName:"visible",  ev:Tab):void;
    public      trigger(eventName:string, ev?:any):void {
        super.trigger(eventName, ev);
    }

    public      findTab(id:string|number): undefined|Tab
    {
        if (typeof id === 'string') {
            return this._children.find((t) => t.name === id);
        }
        else if (typeof id === 'number') {
            if (id>=0 && id < this._children.length) {
                return this._children[id];
            }
        }

        return undefined;
    }
    public      addTabAt(at:number|undefined, tab:Tab, select?:boolean)
    {
        if (typeof at === 'number' && at < 0) at = 0;

        if (typeof at === 'number' && at < this._children.length) {
            const next = this._children[at];
            this._children.splice(at, 0, tab);
            next.titleElement.insertBefore(tab.titleElement);
            next.container.insertBefore(tab);
        }
        else {
            this._children.push(tab);
            this._tabHeader.appendChild(tab.titleElement);
            this._container.appendChild(tab);
        }

        if (select) {
            var loadtask = this.selectTab(tab);

            if (loadtask) {
                tab.titleElement.show(false);
                return loadtask.finally(() => { tab.titleElement.show(true); });
            }
        }
    }
    public      removeTab(tab:Tab)
    {
        const i = this._children.indexOf(tab);

        if (i >= 0) {
            this._children.splice(i, 1);
            this._tabHeader.removeChild(tab.titleElement);
            this._container.removeChild(tab);
            this.selectTab(i < this._children.length ? i : i - 1);
        }
    }
    public      selectTab(tab: string|number|Tab|undefined): void|$JA.Task<void> {
        if (typeof tab === 'string' || typeof tab === 'number') {
            tab = this.findTab(tab);
        }

        if (tab instanceof Tab && this._selectedTab !== tab) {
            if (this._timer) {
                clearTimeout(this._timer);
                this._timer = null;
            }

            if (this._selectedTab) {
                this._selectedTab.titleElement.removeClass("-active");
            }

            tab.titleElement.addClass("-active");
            this._selectedTab = tab;

            const loadTask = tab.loadTab(this, this._sizeContent);

            if (loadTask) {
                this._timer = $J.setTimeout(() => this._setVisuableTab(tab as Tab), 250);
                loadTask.finally(() => this._setVisuableTab(tab as Tab)); // Don't need to inform the formloader is already doing this.
            }
            else {
                this._setVisuableTab(tab);
            }

            this.trigger('selected', tab);
            return loadTask;
        }
    }
    public      setSize(size:$JD.ISize|undefined)
    {
        if (!$JD.compareSize(this._size, size)) {
            this._container.setSize(this._size = size);
            this._updsize();
        }
    }

    private     _addChild(child:AddTab) {
        if (Array.isArray(child)) {
            for (let c of child) {
                this._addChild(c);
            }
        }
        else if (child instanceof Tab) {
            this.addTabAt(undefined, child);
        }
    }
    private     _updsize() {
        if (this._container.isLive) {
            this._sizeContent = (this._size)
                                    ? {
                                            height: this._size.height - this._tabHeader.size.height,
                                            width:  this._size.width
                                      }
                                    : undefined;

            if (this._visibleTab) {
                this._visibleTab.setSize(this._sizeContent);
            }
        }
    }
    private     _setVisuableTab(tab: Tab) {
        if (this._selectedTab === tab && this._visibleTab !== tab) {
            if (this._timer) {
                clearTimeout(this._timer);
                this._timer = null;
            }

            if (this._visibleTab) {
                this._visibleTab.show(false);
            }

            tab.show(true);
            tab.setSize(this._sizeContent);
            this._visibleTab = tab;

            this.trigger('visible', tab);
        }
    }
}

export interface ITabAttr
{
    name?:              string;
    title:              string;
    disabled?:          boolean;
    closeable?:         boolean;
    onclick?:           () => void;
    loadcontent?:       () => $JD.AddNode;
    moremenu?:          () => $JUM.DataSourceResult;
    loadform?:          (loader:$JUC.FormLoader) => $JA.Task<void>;
}

export class Tab extends $JD.Container implements $JUC.IMoreMenu
{
    private     _name?:             string;
    private     _titleElement:      $JD.DOMHTMLElement;
    private     _closeable:         boolean;
    private     _disabled:          boolean;
    private     _moremenu?:         (ct:$JA.Context) => $JUM.DataSourceResult;
    private     _loadcontent?:      () => $JD.AddNode;
    private     _loadform?:         (loader:$JUC.FormLoader) => $JA.Task<void>;
    private     _active:            boolean;
    private     _loaded:            boolean;
    private     _size?:             $JD.ISize;
    private     _tabContent?:       $JD.AddNode;

    public get  Tabs() {
        const parent = this._container.parent;
        if (parent) {
            const tabs = parent.data('tabs');
            if (tabs instanceof Tabs) {
                return tabs;
            }
        }

        return null;
    }
    public get  name() {
        return this._name;
    }
    public get  title() {
        return this._titleElement.text();
    }
    public set  title(text:string) {
        this._titleElement.text(text);
    }
    public get  disabled() {
        return this._disabled;
    }
    public set  disabled(disabled:boolean) {
        if (this._disabled !== disabled) {
            this._disabled = disabled;
            this._titleElement.disabled = disabled;
        }
    }
    public get  closeable()
    {
        return this._closeable;
    }
    public get  tabContent()
    {
        return this._tabContent;
    }

    public      constructor(attr: ITabAttr, ...children: $JD.AddNode[]) {
        const container = <div class="jannesen-ui-tab">{ children }</div>;
        super(container);

        const titleElement = <span class="-tab">
                                 <span class="-text">
                                     { attr.title }
                                 </span>
                             </span>;

        if (attr.closeable) {
            const btn = <span class="-close"/>;
            btn.bind('click', this.close, this);
            titleElement.addClass("-closeable").appendChild(btn);
        }

        this._name          = attr.name;
        this._titleElement  = titleElement;
        this._closeable     = attr.closeable === undefined ? false : !!attr.closeable;
        this._disabled      = attr.disabled === undefined ? false : !!attr.disabled;
        this._loaded        = children.length > 0;
        this._active        = false;
        this._moremenu      = attr.moremenu;

        if (this._disabled) {
            this._titleElement.disabled = true;
        }
        if (this._loaded) {
            this._tabContent = children.length === 1 ? children[0] : children;
        }
        else {
            if (!(this._loadcontent = attr.loadcontent)) {
                this._loadform    = attr.loadform;
            }
        }

        if (attr.onclick) {
            this.bind('click', attr.onclick);
        }
        this._titleElement.bind('click', this._ontitleclick, this);
        container.show(false);
    }

    public      bind(eventName:"click", handler: (ev:any)=>void, thisArg?:any): void;
    public      bind(eventName:string, handler: (ev:any)=>void, thisArg?:any) {
        return super.bind(eventName, handler, thisArg);
    }
    public      trigger(eventName:"click"):void;
    public      trigger(eventName:string, ev?:any):void {
        super.trigger(eventName, ev);
    }

    public      moreMenuEnabled()
    {
        if ($JUC.ImplementsMoreMenu(this._tabContent)) {
            return this._tabContent.moreMenuEnabled();
        }

        return !!this._moremenu;
    }
    public      moreMenuDatasource(ct:$JA.Context):$JUM.DataSourceResult|undefined
    {
        if ($JUC.ImplementsMoreMenu(this._tabContent)) {
            return this._tabContent.moreMenuDatasource(ct);
        }

        if (this._moremenu) {
            return this._moremenu(ct);
        }

        return [];
    }
    public      close()
    {
        const tab = this.Tabs;
        if (tab) {
            tab.removeTab(this);
        }
    }
    private     _ontitleclick() {
        if (!this._disabled && !this._active) {
            const tabs = this.Tabs;
            if (tabs) {
                tabs.selectTab(this);
            }
        }
    }

    /*@internal*/ get   titleElement(): $JD.DOMHTMLElement {
        return this._titleElement;
    }
    /*@internal*/       show(display: boolean) {
        this.container.show(display);

        const formLoader = this._tabContent;
        if ($JD.ImplementsShow(formLoader)) {
            formLoader.show(display);
        }
    }
    /*@internal*/       loadTab(tabs: Tabs, size: $JD.ISize|undefined):void|$JA.Task<void> {
        if (!this._loaded) {
            this._loaded = true;

            try {
                if (typeof this._loadcontent === 'function') {
                    this._container.appendChild(this._tabContent = this._loadcontent());
                    return;
                }
                else if (typeof this._loadform === 'function') {
                    const loader = new $JUC.FormLoader(tabs.context);
                    this._container.appendChild(this._tabContent = loader);
                    try {
                        return this._loadform(loader).catch((e) => loader.openError(e));
                    }
                    catch (e) {
                        loader.openError(e);
                    }
                }
            } catch (e) {
                this._tabContent = undefined;
                $J.logError(e);
                this._container.appendChild($JUC.errorToContent(e));
                return;
            }
        }
    }
    /*@internal*/       setSize(size: $JD.ISize|undefined) {
        if (!$JD.compareSize(this._size, size)) {
            this._container.setSize(this._size = size);

            if ($JD.ImplementsSetSize(this._tabContent)) {
                this._tabContent.setSize(size);
                this._container.css("overflow", "hidden");
            }
            else {
                this._container.css("overflow", size ? "auto" : undefined);
            }
        }
    }
}

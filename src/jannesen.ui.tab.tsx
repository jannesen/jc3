/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J   from "jc3/jannesen";
import * as $JA  from "jc3/jannesen.async";
import * as $JD  from "jc3/jannesen.dom";
import * as $JUC from "jc3/jannesen.ui.content";
import * as $JUM from "jc3/jannesen.ui.menu";

export interface AddTabArray extends Array<AddTab> {}
export type AddTab    = Tab|undefined|false|AddTabArray;

export interface ITabsAttr {
    selectfirst?:   boolean;
    formhost?:      $JUC.Nullable<$JUC.IFormHost>;
}

export class Tabs extends $JD.Container {
    public      formhost?:             $JUC.Nullable<$JUC.IFormHost>;
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

    public  get size() {
        return this._size;
    }
    public  set size(size:$JD.ISize|undefined) {
        if (!$JD.compareSize(this._size, size)) {
            this._container.setSize(this._size = size);
            this._updsize();
        }
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

        super(container);

        this.formhost     = attr && attr.formhost;
        this._tabHeader   = tabheader;
        this._children    = [];
        this._size        = undefined;
        this._selectedTab = null;
        this._visibleTab  = null;
        this._timer       = null;

        container.data('tabs', this);

        this.addTab(children);
        container.bind("AddedToDocument", this._updsize, this);

        if (attr && attr.selectfirst && this._children.length > 0) {
            this.setTab(this._children[0]);
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

    public      addTab(...children: AddTab[]) {
        for (let child of children) {
            this._addChild(child);
        }
    }
    public      setTab(tab: string|number|Tab|undefined): void|$JA.Task<void> {
        if (typeof tab === 'string') {
            tab = this._children.find((t) => t.name === tab);
        }
        else if (typeof tab === 'number') {
            if (tab>=0 && tab < this._children.length) {
                tab = this._children[tab];
            }
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
                this._timer = $J.setTimeout(() => this._setVisuableTab(tab as Tab,), 250);
                loadTask.finally(() => this._setVisuableTab(tab as Tab)); // Don't need to inform the formloader is already doing this.
            }
            else {
                this._setVisuableTab(tab);
            }

            this.trigger('selected', tab);
            return loadTask;
        }
    }

    private     _addChild(child:AddTab) {
        if (Array.isArray(child)) {
            for (let c of child) {
                this._addChild(c);
            }
        }
        else if (child instanceof Tab) {
            this._children.push(child);
            this._tabHeader.appendChild(child.titleElement);
            this._container.appendChild(child);
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

export interface ITabAttr {
    name?:              string;
    title:              string;
    enabled?:           boolean;
    onclick?:           () => void;
    loadcontent?:       () => $JD.AddNode;
    moremenu?:          () => $JUM.IDataSourceResult;
    loadform?:          (loader:$JUC.FormLoader) => $JA.Task<void>;
}

export class Tab extends $JD.Container {
    private     _name?:             string;
    private     _titleElement:      $JD.DOMHTMLElement;
    private     _enabled:           boolean;
    private     _moremenu?:         (ct:$JA.ICancellationToken) => $JUM.IDataSourceResult;
    private     _loadcontent?:      () => $JD.AddNode;
    private     _loadform?:         (loader:$JUC.FormLoader) => $JA.Task<void>;
    private     _active:            boolean;
    private     _loaded:            boolean;
    private     _size?:             $JD.ISize;
    private     _formloader?:       $JUC.FormLoader;

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
    public get  enabled() {
        return this._enabled;
    }
    public set  enabled(enabled:boolean) {
        if (this._enabled !== enabled) {
            this._enabled = enabled;
            this._titleElement.toggleClass("-disabled", !enabled);
        }
    }
    public get  formloader()
    {
        return this._formloader || null;
    }

    public      constructor(attr: ITabAttr, ...children: $JD.AddNode[]) {
        const container = <div class="jannesen-ui-tab">{ children }</div>;
        super(container);
        this._name          = attr.name;
        this._titleElement  = <span>{ attr.title }</span>;
        this._enabled       = attr.enabled === undefined ? true : !!attr.enabled;
        this._loaded        = children.length > 0;
        this._active        = false;
        this._moremenu      = attr.moremenu;

        if (!this._enabled) {
            this._titleElement.addClass("-disabled");
        }
        if (!this._loaded) {
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
        return (this._loadform)
                    ? (this._formloader && this._formloader.contentBody && this._formloader.contentBody.isIdle ? this._formloader.contentBody.moreMenuEnabled() : false)
                    : !!this._moremenu;
    }
    public      moreMenuDatasource(ct:$JA.ICancellationToken):$JUM.IDataSourceResult
    {
        if (this._loadform) {
            if (this._formloader && this._formloader.contentBody && this._formloader.contentBody.isIdle) {
                return this._formloader.contentBody.moreMenuDatasource(ct);
            }
        }
        else {
            if (this._moremenu) {
                return this._moremenu(ct);
            }
        }

        return [];
    }

    private     _ontitleclick() {
        if (this._enabled && !this._active) {
            const tabs = this.Tabs;
            if (tabs) {
                tabs.setTab(this);
            }
        }
    }

    /*@internal*/ get   titleElement(): $JD.DOMHTMLElement {
        return this._titleElement;
    }
    /*@internal*/       show(display: boolean) {
        this.container.show(display);

        const formLoader = this._formloader;
        if (formLoader) {
            formLoader.show(display);
        }
    }
    /*@internal*/       loadTab(tabs: Tabs, size: $JD.ISize|undefined):void|$JA.Task<void> {
        if (!this._loaded) {
            this._loaded = true;

            try {
                if (typeof this._loadcontent === 'function') {
                    this._formloader = undefined;
                    this._container.appendChild(this._loadcontent());
                    return;
                }
                else if (typeof this._loadform === 'function') {
                    this._formloader = new $JUC.FormLoader(tabs.formhost);
                    this._container.appendChild(this._formloader);
                    return this._loadform(this._formloader);
                }
            } catch (e) {
                this._formloader = undefined;
                this._container.appendChild($JUC.errorToContent(e));
                return;
            }
        }
    }
    /*@internal*/       setSize(size: $JD.ISize|undefined) {
        if (!$JD.compareSize(this._size, size)) {
            this._size = size;
            if (!this._loadform) {
                this._container.setSize(size);
                this._container.css("overflow", size ? "auto" : undefined);
            }
            else if (this._formloader) {
                this._formloader.setSize(size);
            }
        }
    }
}

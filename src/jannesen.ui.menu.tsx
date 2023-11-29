/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J       from "jc3/jannesen";
import * as $JA      from "jc3/jannesen.async";
import * as $JD      from "jc3/jannesen.dom";
import * as $JUP     from "jc3/jannesen.ui.popup";

export type AddMenuItem         = MenuItem<unknown>|AddMenuItemsArray|null|undefined|false;
export interface AddMenuItemsArray extends Array<AddMenuItem> {}
export type AddMenuItems     = AddMenuItem[];
export type DataSourceResult = AddMenuItems | $JA.Task<AddMenuItems>;

export const enum MenuPosition
{
    Left        = 0x00,
    Right       = 0x01,
    Center      = 0x02,
    Top         = 0x04
}
export interface IMenuAttr
{
    menupos?:           MenuPosition;
    menuclass?:         string;
    firstmenuclass?:    string;
}
export interface IMenuBase extends IMenuParent
{
    attr:    IMenuAttr;
    menu_itemClick(entry:MenuEntry|null):void;
    menu_onblur(ev:FocusEvent):void;
}

export interface IMenuButtonAttr extends IMenuAttr
{
    context?:           $JA.Context;
    class?:             string;
    disabled?:          boolean;
    style?:             string;
    tabIndex?:          number;
    title?:             string;
    content?:           $JD.AddNode;
    dataSource?:        (ct:$JA.Context)=>DataSourceResult|undefined;
    onclick?:           (data:any)=>void;
}
export class MenuButton extends $JD.Container implements IMenuBase,IMenuParent
{
    private     _attr:          IMenuButtonAttr;
    private     _activeMenu:    PopupMenu|null;
    private     _context:       $JA.Context;

    public get  disabled()
    {
        return this._container.disabled;
    }
    public set  disabled(disabled:boolean)
    {
        this._container.disabled = disabled;
    }
    public get  attr() {
        return this._attr;
    }

    public      constructor(attr?: IMenuButtonAttr, ...children:AddMenuItems)
    {
        attr = { ...attr };
        if (children && children.length > 0)    attr.dataSource = () => children;
        if (attr.menupos === undefined)         attr.menupos = MenuPosition.Left;

        super(<button class={attr.class} style={attr.style} title={attr.title} disabled={attr.disabled} tabIndex={attr.tabIndex}>{ attr.content }</button>);

        this._applyAttr(attr, 'onclick');
        this._attr       = attr;
        this._activeMenu = null;
        this._context    = new $JA.Context({ parent:attr.context, component:this, dom:this.container });

        this._container.bind("click",   this._onClick,    this);
        this._container.bind("keydown", this._onKeyDown,  this);
    }

    public      openMenu(): void
    {
        if (!this._activeMenu && this._attr.dataSource) {
            const result = this._attr.dataSource(this._context);
            if (result) {
                this._activeMenu = new PopupMenu(this._container, result, this, this, this._context);
                this._container.addClass("-active");
                this._activeMenu.focus();
            }
        }
    }

    public      menu_clickItem(value:any)
    {
    }
    public      menu_closeMenu(): void
    {
        if (this._activeMenu) {
            this._activeMenu.Stop();
            this._activeMenu = null;
            this._container.removeClass("-active");
            this._container.focus();
        }
    }
    public      menu_positionChild()
    {
        const menupos = this._attr.menupos || 0;

        return ((menupos & MenuPosition.Center) !== 0 ? $JUP.PositionFlags.Center : (menupos & MenuPosition.Right) !== 0 ? $JUP.PositionFlags.AlignRight : $JUP.PositionFlags.AlignLeft) |
               ((menupos & MenuPosition.Top) !== 0 ? $JUP.PositionFlags.Top : $JUP.PositionFlags.Bottom);
    }
    public      menu_itemClick(item:MenuEntry)
    {
        this.menu_closeMenu();
        item.trigger("click", item.attr.data);
        this.trigger("click", item.attr.data);
    }
    public      menu_onblur(ev:FocusEvent)
    {
        if (this._container.element === ev.relatedTarget) {
            return;
        }

        let menu = this._activeMenu;

        while (menu) {
            if (menu.container && menu.container.element === ev.relatedTarget) {
                return; // Focus to menu active menu.
            }
            menu = menu.selected && menu.selected.subMenu;
        }

        this.menu_closeMenu();
    }

    private     _onClick(): void
    {
        if (!this._activeMenu) {
            if (!this.disabled) {
                this.openMenu();
            }
        } else {
            this.menu_closeMenu();
        }
    }
    private     _onKeyDown(ev: KeyboardEvent): void
    {
        if (!ev.altKey && !ev.ctrlKey && !ev.metaKey) {
            switch(ev.key) {
            case "ArrowDown":
                if (!this.disabled) {
                    this.openMenu();
                    $J.eventHandled(ev);
                    return;
                }
            }
        }
    }
}

export interface IFloatingMenuAttr extends IMenuAttr
{
    dataSource?:        (ct:$JA.Context)=>DataSourceResult|undefined;
    onclick?:           (data:any)=>void;
}
export class FloatingMenu implements IMenuBase,IMenuParent
{
    private     _attr:          IFloatingMenuAttr;
    private     _pos:           $JD.IPosition;
    private     _resolver:      ((value:any) => void)|null;
    private     _activeMenu:    PopupMenu|null;

    public get  attr()
    {
        return this._attr;
    }

    public      constructor(attr?: IFloatingMenuAttr, ...children:AddMenuItems)
    {
        attr = { ...attr };
        if (children && children.length > 0)    attr.dataSource = () => children;
        if (attr.menupos === undefined)         attr.menupos = MenuPosition.Left;

        this._attr       = attr;
        this._pos        = { top:0, left:0 };
        this._resolver   = null;
        this._activeMenu = null;
    }

    public      runAsync(pos:$JD.IPosition, context:$JA.Context)
    {
        if (this._activeMenu) {
            throw new $J.InvalidStateError("FloatingMenu already active");
        }

        const result = this._attr.dataSource && this._attr.dataSource(context);

        if (result) {
            return new $JA.Task<any>((resolver, reject, oncancel) => {
                       oncancel(() => {
                                    this._activeMenu = null;
                                    this._resolver   = null;
                                });

                       this._pos        = pos;
                       this._resolver   = resolver;
                       this._activeMenu = new PopupMenu($JD.body, result, this, this, context);
                       this._activeMenu.focus();
                   }, context);
        }
        else {
            return $JA.Task.resolve(undefined);
        }
    }

    public      menu_itemClick(item:MenuEntry|null)
    {
        if (this._activeMenu) {
            this._activeMenu.Stop();
            this._activeMenu = null;
        }

        if (this._resolver) {
            this._resolver(item ? item.attr.data : undefined);
            this._resolver = null;
        }
    }
    public      menu_closeMenu(): void
    {
        this.menu_itemClick(null);
    }
    public      menu_positionChild()
    {
        const menupos = this._attr.menupos || 0;

        return {
                    rect:   {
                                top:    this._pos.top,
                                left:   this._pos.left,
                                width:  0,
                                height: 0
                            },
                    flags:  ((menupos & MenuPosition.Center) !== 0 ? $JUP.PositionFlags.Center : (menupos & MenuPosition.Right) !== 0 ? $JUP.PositionFlags.AlignRight : $JUP.PositionFlags.AlignLeft) |
                            ((menupos & MenuPosition.Top) !== 0 ? $JUP.PositionFlags.Top : $JUP.PositionFlags.Bottom)
               };
    }
    public      menu_onblur(ev:FocusEvent)
    {
        let menu = this._activeMenu;

        while (menu) {
            if (menu.container && menu.container.element === ev.relatedTarget) {
                return; // Focus to menu active menu.
            }
            menu = menu.selected && menu.selected.subMenu;
        }

        this.menu_closeMenu();
    }
}


export class MenuItem<TAttr> extends $JD.Container {
    protected   _attr:          TAttr;

    public get  attr()
    {
        return this._attr;
    }
    public get  hasSubMenu()
    {
        return false;
    }
    public get  parent()
    {
        let e:$JD.DOMHTMLElement|null;

        if (e = this._container) {
            if (e = e.parent) {
                if (e = e.parent) {
                    const m = e.data("menu");
                    if (m instanceof PopupMenu)
                        return m;
                }
            }
        }

        return null;
    }

                constructor(container:$JD.DOMHTMLElement, attr: TAttr)
    {
        super(container);
        this._attr = attr;
    }
}

export interface IMenuSeparatorAttr {
    class?:     string;
}
export class MenuSeperator extends MenuItem<IMenuSeparatorAttr>
{
    public      constructor(attr?: IMenuSeparatorAttr) {
        if (!(attr instanceof Object)) attr = {};

        super(<hr class={ attr.class } />, attr);
    }
}

export interface IMenuEntryAttr {
    class?:         string;
    content?:       $JD.AddNode;
    dataSource?:    (cancellationToken:$JA.Context)=>DataSourceResult;
    data?:          any;
    disabled?:      boolean;
    onclick?:       (data:any)=>void;
}
export class MenuEntry extends MenuItem<IMenuEntryAttr> implements IMenuParent
{
    private     _activeSubMenu:     PopupMenu|null;

    public get  disabled()
    {
        return this.container.disabled;
    }
    public set  disabled(disabled:boolean)
    {
        this.container.disabled = disabled;
    }
    public get  hasSubMenu()
    {
        return typeof this._attr.dataSource === 'function';
    }
    public get  subMenu()
    {
        return this._activeSubMenu;
    }

    public      constructor(attr?: IMenuEntryAttr, ...children:AddMenuItem[])
    {
        if (children && children.length > 0) {
            attr = { ...attr };
            attr.dataSource = () => children;
        }
        if (!(attr instanceof Object)) attr = {};

        super(<div class={attr.class ? "-item " + attr.class : "-item"} disabled={attr.disabled} >
                <div class="-content">{ attr.content }</div>
              </div>,
              attr);

        if (this.hasSubMenu) {
            this._container.appendChild(<div class="-icon"/>);
        }

        this._activeSubMenu = null;
        this._container.data('menu-entry', this);
        this._applyAttr(attr, "onclick");
    }

    public      select(menu: PopupMenu, openMenu: boolean)
    {
        this.container.addClass('-selected');

        if (!this._activeSubMenu && openMenu && this.hasSubMenu) {
            const parent = this.parent;
            if (parent) {
                const result = this._attr.dataSource!(menu.context);
                if (result) {
                    this._activeSubMenu = new PopupMenu(this._container, result, parent.root, this, menu.context);
                    this._activeSubMenu.focus();
                }
            }
        }
    }
    public      deselect()
    {
        this.menu_closeMenu();
        this.container.removeClass('-selected');
    }
    public      menu_closeMenu()
    {
        if (this._activeSubMenu) {
            const parent = this.parent;
            if (parent) {
                parent.focus();
            }
            this._activeSubMenu.Stop();
            this._activeSubMenu = null;
        }
    }
    public      menu_positionChild()
    {
        const parent = this.parent;
        return (parent && ((parent.root.attr.menupos || 0) & MenuPosition.Right) !== 0 ?  $JUP.PositionFlags.Left :  $JUP.PositionFlags.Right) | $JUP.PositionFlags.AlignTop;
    }
}

interface IMenuParent
{
    menu_closeMenu():void;                                                                                            // Close active sub menu
    menu_positionChild(posOuterRect:$JD.IRect): $JUP.PositionFlags | { rect:$JD.IRect; flags:$JUP.PositionFlags };    // Position data for child menu.
}

class PopupMenu extends $JUP.Popup
{
    private     _root:          IMenuBase;
    private     _parent:        IMenuParent;
    private     _menuitems:     MenuItem<unknown>[]|undefined;
    private     _selected:      MenuEntry|null;

    public get  root()
    {
        return this._root;
    }
    public get  selected()
    {
        return this._selected;
    }

    public      constructor(parentelmparentelm: $JD.DOMHTMLElement, datasourceresult: DataSourceResult, root:IMenuBase, parent: IMenuParent, parentContext: $JA.Context)
    {
        super(parentelmparentelm, $JD.classJoin("jannesen-ui-menu -popup", root.attr.menuclass, parent === root && root.attr.firstmenuclass), parentContext);

        this._root         = root;
        this._parent       = parent;

        if (datasourceresult instanceof $JA.Task) {
            this.ShowLoading();
            datasourceresult.then((data) => {
                                      this._showMenu(data);
                                  },
                                  (err) => {
                                      this._showError(err);
                                  });
        } else {
            this._showMenu(datasourceresult);
        }

        this._container!.bind('blur', (ev) => root.menu_onblur(ev));
        this._container!.bind('keydown', this._onKeyDown, this);
        this._container!.data('menu', this);
        this._selected = null;
    }

    public      PositionPopup(container:$JD.DOMHTMLElement, poselmOuterRect:$JD.IRect)
    {
        const p = this._parent.menu_positionChild(poselmOuterRect);

        if (typeof p === 'number') {
            super.PositionPopup(container, poselmOuterRect, p);
        }
        else {
            super.PositionPopup(container, p.rect, p.flags);
        }
    }

    protected   Remove()
    {
        this._selectItem(null, false);
        super.Remove();
    }

    public      focus()
    {
        if (this._container) {
            this._container.attr('tabIndex', 0);
            this._container.focus();
        }
    }
    private     _showMenu(data:AddMenuItems)
    {
        const container = this._container;
        if (container) {
            if (data.length > 0) {
                this.Show(<div class="-items">{ this._menuitems = optimizeMenuItem(data) }</div>, true);
                container.bind("click",     this._onClick,     this);
                container.bind('mouseover', this._onMouseOver, this);
                container.bind('mousedown', (ev: any) => ev.preventDefault());
            }
            else {
                this._showError("No data.");
            }
        }
    }
    private     _showError(err:Error|string)
    {
        const container = this._container;
        if (container) {
            if (err instanceof Error) {
                err = $J.translateError(err);
            }

            this.Show(<div>{ $JD.multilineStringToContent(err) }</div>, true, "-error");
        }
    }
    private     _selectItem(item: MenuEntry|null, openMenu:boolean)
    {
        if (this._selected !== item && this._selected) {
            if (item && this._selected.subMenu && this._container) {
                this._container.focus();
            }
            this._selected.deselect();
            this._selected = null;
        }

        if (item) {
            (this._selected = item).select(this, openMenu);
        }
    }
    private     _onKeyDown(ev: KeyboardEvent)
    {
        if (!(ev.altKey || ev.ctrlKey || ev.metaKey)) {
            switch(ev.key) {
            case "Enter":
            case "NumpadEnter":
                this._click(this._selected);
                return true;

            case "Escape":
                this._root.menu_closeMenu();
                ev.preventDefault();
                return true;

            case "ArrowLeft":
                this._parent.menu_closeMenu();
                return true;

            case "ArrowRight":
                if (this._selected && this._selected.hasSubMenu) {
                    this._selected.select(this, true);
                }
                return true;

            case "ArrowUp":
                if (this._menuitems) {
                    const n = this._selectGetPrev(this._selectGetIndex(this._menuitems.length) - 1);
                    if (n) {
                        this._selectItem(n, false);
                    }
                }
                return true;

            case "ArrowDown":
                if (this._menuitems) {
                    const n = this._selectGetNext(this._selectGetIndex(-1) + 1);
                    if (n) {
                        this._selectItem(n, false);
                    }
                }
                return true;
            }
        }

        return false;
    }
    private     _onClick(ev: MouseEvent)
    {
        if (this._container) {
            const item = this._findMenuItem(ev);
            if (item) {
                this._click(item);
            }
        }
    }
    private     _onMouseOver(ev: MouseEvent)
    {
        if (this._container) {
            const item = this._findMenuItem(ev);
            if (item) {
                this._selectItem(item, true);
            }
        }
    }
    private     _click(item: MenuEntry|null|undefined)
    {
        if (item && !item.disabled) {
            if (item.hasSubMenu) {
                this._selectItem(item, true);
            } else {
                const root = this._root;
                if (root) {
                    root.menu_itemClick(item);
                }
            }
        }
    }
    private     _selectGetNext(start:number): MenuEntry|null
    {
        const menuitems = this._menuitems!;
        for (let i = start; i < menuitems.length ; ++i) {
            const m = menuitems[i];
            if (m instanceof MenuEntry) {
                return m;
            }
        }
        return null;
    }
    private     _selectGetPrev(start:number): MenuEntry|null
    {
        const menuitems = this._menuitems!;
        for (let i = start ; i >= 0 ; --i) {
            const m = menuitems[i];
            if (m instanceof MenuEntry) {
                return m;
            }
        }
        return null;
    }
    private     _selectGetIndex(defaultValue:number): number
    {
        const menuitems = this._menuitems!;
        for (let i = 0; i < menuitems.length ; ++i) {
            if (menuitems[i] === this._selected) {
                return i;
            }
        }

        return defaultValue;
    }
    private     _findMenuItem(ev: MouseEvent)
    {
        const container = this.container;
        if (container && ev.target instanceof HTMLElement) {
            let element:$JD.DOMHTMLElement|null = $JD.element(ev.target);


            while (element ) {
                const menuItem = element.data('menu-entry');
                if (menuItem instanceof MenuEntry) {
                    return menuItem;
                }
                if (element.element === container.element) {
                    return null;
                }

                element = element.parent;
            }
        }

        return null;
    }
}

function optimizeMenuItem(items:AddMenuItems)
{
    const rtn:MenuItem<unknown>[] = [];
    let   sep:MenuSeperator|null = null;

    addItems(items);

    return rtn;

    function addItems(items: AddMenuItems) {
        for (const i of items) {
            if (Array.isArray(i)) {
                addItems(i);
            }
            else if (i instanceof MenuItem) {
                if (i instanceof MenuSeperator) {
                    if (rtn.length > 0) {
                        sep = i;
                    }
                } else {
                    if (sep) {
                        rtn.push(sep);
                        sep = null;
                    }

                    rtn.push(i);
                }
            }
        }
    }
}

/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J       from "jc3/jannesen";
import * as $JA      from "jc3/jannesen.async";
import * as $JD      from "jc3/jannesen.dom";
import * as $JUP     from "jc3/jannesen.ui.popup";

export type IMenuItem         = MenuItem<any>|null|undefined|false;
export type IDataSourceResult = IMenuItem[] | $JA.Task<IMenuItem[]>;

export const enum MenuPosition
{
    Left        = 0x00,
    Right       = 0x01,
    Center      = 0x02,
    Top         = 0x04
}

export interface IMenuButtonAttr
{
    context?:           $JA.Context;
    class?:             string;
    style?:             string;
    tabIndex?:          number;
    title?:             string;
    content?:           $JD.AddNode;
    menupos?:           MenuPosition;
    menuclass?:         string;
    firstmenuclass?:    string;
    dataSource?:        (ct:$JA.Context)=>IDataSourceResult|undefined;
    onclick?:           (data:any)=>void;
}
export class MenuButton extends $JD.Container
{
    private     _attr:          IMenuButtonAttr;
    private     _activeMenu:    Menu|null;
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

    public      constructor(attr?: IMenuButtonAttr, ...children: MenuItem<any>[])
    {
        attr = $J.extend<IMenuButtonAttr>({} as IMenuButtonAttr, attr);
        if (children && children.length > 0)    attr.dataSource = () => children;
        if (attr.menupos === undefined)         attr.menupos = MenuPosition.Left;

        super(<button class={attr.class} style={attr.style} title={attr.title} tabIndex={attr.tabIndex}>{ attr.content }</button>);

        this._applyAttr(attr, 'onclick');
        this._attr       = attr;
        this._activeMenu = null;
        this._context    = new $JA.Context({ parent:attr.context, component:this, dom:this.container });

        this._container.bind("blur",    this.closeMenu,   this);
        this._container.bind("click",   this._toggleMenu, this);
        this._container.bind("keydown", this._onKeyDown,  this);
    }

    public      openMenu(): void
    {
        if (!this._activeMenu && this._attr.dataSource) {
            const result = this._attr.dataSource(this._context);
            if (result) {
                this._container.focus();
                this._activeMenu = new Menu(this._container, result, this, this, this._context);
                this._container.addClass("-active");
            }
        }
    }
    public      closeMenu(): void
    {
        if (this._activeMenu) {
            this._activeMenu.Stop();
            this._activeMenu = null;
            this._container.removeClass("-active");
        }
    }

    private     _toggleMenu(): void
    {
        if (!this._activeMenu) {
            this.openMenu();
        } else {
            this.closeMenu();
        }
    }
    private     _onKeyDown(ev: KeyboardEvent): void
    {
        let menu = this._activeMenu;

        if (menu) {
            let childMenu = menu && menu.selected && menu.selected.subMenu;

            while (childMenu) {
                menu = childMenu;
                childMenu = menu && menu.selected && menu.selected.subMenu;
            }

            if (menu.handleKeyDown(ev)) {
                ev.preventDefault();
            }
        } else {
            if (!ev.altKey && !ev.ctrlKey && !ev.metaKey) {
                switch(ev.key) {
                case "ArrowDown":
                    this.openMenu();
                    ev.preventDefault();
                }
            }
        }
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
                    if (m instanceof Menu)
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
    dataSource?:    (cancellationToken:$JA.Context)=>IDataSourceResult;
    data?:          any;
    onclick?:       (data:any)=>void;
}
export class MenuEntry extends MenuItem<IMenuEntryAttr>
{
    private     _activeSubMenu:     Menu|null;

    public get  hasSubMenu()
    {
        return typeof this._attr.dataSource === 'function';
    }
    public get  subMenu()
    {
        return this._activeSubMenu;
    }

    public      constructor(attr?: IMenuEntryAttr, ...children: MenuItem<any>[])
    {
        if (children && children.length > 0) {
            attr = $J.extend<IMenuEntryAttr>({} as IMenuEntryAttr, attr);
            attr.dataSource = () => children;
        }
        if (!(attr instanceof Object)) attr = {};

        super(<div class={attr.class ? "-item " + attr.class : "-item"}>
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

    public      select(menu: Menu, openMenu: boolean)
    {
        this.container.addClass('-selected');

        if (!this._activeSubMenu && openMenu && this.hasSubMenu) {
            const parent = this.parent;
            if (parent) {
                const result = this._attr.dataSource!(menu.context);
                if (result) {
                    this._activeSubMenu = new Menu(this._container, result, parent.root, this, menu.context);
                }
            }
        }
    }
    public      deselect()
    {
        this.closeMenu();
        this.container.removeClass('-selected');
    }
    public      closeMenu()
    {
        if (this._activeSubMenu) {
            this._activeSubMenu.Stop();
            this._activeSubMenu = null;
        }
    }
}

class Menu extends $JUP.Popup
{
    private     _root:          MenuButton;
    private     _parent:        MenuEntry|MenuButton;
    private     _menuitems:     MenuItem<any>[]|undefined;
    private     _selected:      MenuEntry|null;
    private     _loadingTimer:  $J.Timeout;

    public get  root()
    {
        return this._root;
    }
    public get  parent()
    {
        return this._parent;
    }
    public get  selected()
    {
        return this._selected;
    }

    public      constructor(parentelmparentelm: $JD.DOMHTMLElement, datasourceresult: IDataSourceResult, root: MenuButton, parent: MenuEntry|MenuButton, parentContext: $JA.Context)
    {
        super(parentelmparentelm, $JD.classJoin("jannesen-ui-menu -popup", root.attr.menuclass, parent === root && root.attr.firstmenuclass), parentContext);

        this._root         = root;
        this._parent       = parent;
        this._loadingTimer = new $J.Timeout(this.ShowLoading, this);

        if (datasourceresult instanceof $JA.Task) {
            this._loadingTimer.start(200);

            datasourceresult.then((data) => {
                                      this._loadingTimer.clear();
                                      this._showMenu(data);
                                  },
                                  (err) => {
                                      this._loadingTimer.clear();
                                      this._showError(err);
                                  });
        } else {
            this._showMenu(datasourceresult);
        }

        this._container!.data('menu', this);
        this._selected = null;
    }

    public      PositionPopup(container:$JD.DOMHTMLElement, poselmOuterRect:$JD.IRect,)
    {
        const menupos = this._root.attr.menupos || 0;

        super.PositionPopup(container,
                            poselmOuterRect,
                            ((menupos & MenuPosition.Right) !== 0)
                                ? (
                                    (this._parent instanceof MenuButton)
                                        ? ((menupos & MenuPosition.Center) !== 0 ? $JUP.PositionFlags.Center : $JUP.PositionFlags.AlignRight) | ((menupos & MenuPosition.Top) !== 0 ? $JUP.PositionFlags.Top : $JUP.PositionFlags.Bottom)
                                        : $JUP.PositionFlags.Left | $JUP.PositionFlags.AlignTop
                                  )
                                : (
                                    (this._parent instanceof MenuButton)
                                        ? ((menupos & MenuPosition.Center) !== 0 ? $JUP.PositionFlags.Center : $JUP.PositionFlags.AlignLeft) | ((menupos & MenuPosition.Top) !== 0 ? $JUP.PositionFlags.Top : $JUP.PositionFlags.Bottom)
                                        : $JUP.PositionFlags.Right | $JUP.PositionFlags.AlignTop
                                  ));
    }

    protected   Remove()
    {
        this._loadingTimer.clear();
        this._selectItem(null, false);
        super.Remove();
    }

    public      handleKeyDown(ev: KeyboardEvent)
    {
        if (!(ev.altKey || ev.ctrlKey || ev.metaKey)) {
            switch(ev.key) {
            case "Enter":
            case "NumpadEnter":
                this._click(this._selected);
                return true;

            case "Escape":
                this._root.closeMenu();
                ev.preventDefault();
                return true;

            case "ArrowLeft":
                this._parent.closeMenu();
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

    private     _showMenu(data: IMenuItem[])
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
            this._selected.deselect();
            this._selected = null;
        }

        if (item) {
            item.select(this, openMenu);
            this._selected = item;
        }
    }
    private     _onClick(ev: MouseEvent)
    {
        if (this._container) {
            this._click(this._findMenuItem(ev));
        }
    }
    private     _onMouseOver(ev: MouseEvent)
    {
        if (this._container) {
            this._selectItem(this._findMenuItem(ev), true);
        }
    }
    private     _click(item: MenuEntry|null|undefined)
    {
        if (item) {
            if (item.hasSubMenu) {
                this._selectItem(item, true);
            } else {
                let menuButton = this._root;
                if (menuButton) {
                    menuButton.closeMenu();
                    item.trigger("click", item.attr.data);
                    menuButton.trigger("click", item.attr.data);
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

function optimizeMenuItem(items: IMenuItem[])
{
    let rtn:MenuItem<any>[] = [];
    let sep:MenuSeperator|null = null;

    for (let i of items) {
        if (i instanceof MenuItem) {
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

    return rtn;
}

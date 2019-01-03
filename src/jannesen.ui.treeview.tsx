
/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J       from "jc3/jannesen";
import * as $JA      from "jc3/jannesen.async";
import * as $JD      from "jc3/jannesen.dom";

export type IDataSourceResult = $JA.Task<TreeViewItem[]>|TreeViewItem[];
export interface ITreeViewAttr
{
    dataSource:   (item:TreeViewItemList|null, ct:$JA.ICancellationToken) => IDataSourceResult;
    onclick?:     (item:TreeViewItemEndPoint) => void;
}

export class TreeView extends $JD.Container
{
    private         _retrieveData:  (item:TreeViewItemList|null, cancellationToken: $JA.ICancellationToken) => IDataSourceResult;
    private         _selection:     number[]|null;

    public set      selection(selection: number[]) {
        let selectedItem:TreeViewItem|null;

        if (selectedItem  = this.selectedItem) {
            selectedItem.select(false);
        }
        this._selection = selection;

        if (selectedItem = this.selectedItem) {
            selectedItem.select(true);
        }
    }
    public get      selectedElement() {
        if (this._selection) {
            const array = this._selection.slice();
            let selection = this._container.childNodes(array.shift()!);

            array.forEach(index => {
                selection = selection.data<TreeViewItemList>('treeview-item').list.childNodes(index);
            });

            return selection;
        }
        return null;
    }
    public get      selectedItem(): TreeViewItem|null {
        const selectedElement = this.selectedElement;

        if (selectedElement) {
            return selectedElement.data('treeview-item');
        }

        return null;
    }
    public get      selectedHasParent(): boolean {
        return !!this._selection && this._selection.length > 1;
    }
    public get      selectedIsLastInList(): boolean {
        const selection    = this._selection;

        if (selection) {
            return this.selectedItem!.container.parent!.childNodesLength - 1 === selection[selection.length - 1];
        }

        return false;
    }

    public          constructor(attr: ITreeViewAttr) {
        super(<div class="jannesen-ui-treeview" tabIndex="0" />);
        this._retrieveData = attr.dataSource;
        this._container.bind("click",   this._onclick,   this);
        this._container.bind("keydown", this._onkeydown, this);
        this._container.bind("AddedToDocument", () => { this. _retrieveListItem(this._container, null); });
        this._selection = null;

        this._applyAttr(attr, "onclick");
    }

    public          focus()
    {
        this._container.focus();
    }

    private         _addListItems(parent: $JD.DOMHTMLElement, children:Array<TreeViewItem>) {
        if (parent.children) {
            parent.empty();
        }

        parent.appendChild(children);
    }
    private         _onclick(ev: MouseEvent) {
        if (ev.target instanceof HTMLElement) {
            let elm:$JD.DOMHTMLElement|null = $JD.element(ev.target);

            while (elm && elm.element !== this._container.element) {
                const item = elm.data<TreeViewItem>('treeview-item');

                if (item instanceof TreeViewItem) {
                    this._onclickItem(item);
                    this._selectElement(elm);
                    break;
                }

                elm = elm.parent;
            }
        }
    }
    private         _onclickItem(item: TreeViewItem) {
        if (item instanceof TreeViewItemEndPoint) {
            item.trigger("click", item);
            this.trigger("click", item);
        }

        if (item instanceof TreeViewItemList) {
            item.onclick((item, list) => this._retrieveListItem(list, item));
        }
    }
    private         _onkeydown(event: KeyboardEvent) {
        if (!(event.altKey || event.ctrlKey || event.metaKey)) {
            if (!this._selection) {
                this._selection = [0];
                this._selectionGetContainer().data<TreeViewItem>('treeview-item').select(true);
            } else {
                const selectedItem = this.selectedItem!;

                switch(event.key) {
                case "Enter":
                    this._onclickItem(selectedItem);
                    break;
                case "ArrowLeft":
                    if (selectedItem.container.hasClass('-expanded')) {
                        (this.selectedItem as TreeViewItemList).expand(false);
                    } else {
                        this._selectionLeftUp();
                    }
                    break;
                case "ArrowRight":
                    if (selectedItem.container.hasClass('-collapsed')) {
                        this._onclickItem(selectedItem);
                    } else if (selectedItem.container.hasClass('-expanded')) {
                        this._selectionRight();
                    }
                    break;
                case "ArrowUp":
                    this._selectionPrevious();
                    break;
                case "ArrowDown":
                    this._selectionNext();
                    break;
                }
            }
        }
    }
    private         _retrieveListItem(parent: $JD.DOMHTMLElement, item: TreeViewItemList|null) {
        var listItems: IDataSourceResult;

        try {
            listItems = this._retrieveData(item, new $JA.CancellationTokenDom(this.container));
        } catch (err) {
            this._showError(parent, err);
            return;
        }

        if (listItems instanceof $JA.Task) {
            if (listItems.isPending) {
                parent.appendChild(
                    <div class="-pending">
                        <i class="-icon -icon-spin"></i> <span>loading.....</span>
                    </div>
                );
            }
            listItems.then((data) => this._addListItems(parent, data ? data : []),
                           (err)  => this._showError(parent, err));
        } else {
            this._addListItems(parent, listItems);
        }
    }
    private         _selectionGetContainer(): $JD.DOMHTMLElement {
        let selection = this._container;
        this._selection!.forEach(index => {
            selection = selection.childNodes(index);
        });

        return selection;
    }
    private         _selectionNext() {
        if (this.selectedItem!.container.hasClass('-expanded')) {
            this._selectionRight();
        } else if (!this.selectedIsLastInList) {
            this._selectionDown();
        } else if (this.selectedHasParent && this.selectedIsLastInList) {
            this._selectionLeftDown();
        }
    }
    private         _selectionPrevious() {
        const clonedSelection = this._selection!.slice();

        if (clonedSelection[clonedSelection.length - 1] > 0) {
            clonedSelection[clonedSelection.length - 1] -= 1;
            const newSelection = this._selectionFindLastChild(clonedSelection);
            this.selection = newSelection;
        } else if (clonedSelection.length > 1) {
            clonedSelection.pop();
            this.selection = clonedSelection;
        }
    }
    private         _selectionDown() {
        if (this._selection) {
            const newSelection = this._selection.slice();
            newSelection[newSelection.length - 1] += 1;
            this.selection = newSelection;
        }
    }
    private         _selectionLeftUp() {
        if (this._selection && this._selection.length > 1) {
            this.selection = this._selection.slice(0, this._selection.length -1);
        }
    }
    private         _selectionLeftDown() {
        if (this._selection) {
            const clonedSelection = this._selection.slice();
            for (let i = 0; i < this._selection.length; i++) {
                if (!this._selectionIsLastInList(clonedSelection.slice(0, this._selection.length - i))) {
                    const newSelection = clonedSelection.slice(0, this._selection.length - i);
                    newSelection[newSelection.length - 1] += 1;
                    this.selection = newSelection;
                    break;
                }
            }
        }
    }
    private         _selectionRight() {
        if (this._selection) {
            const newSelection = this._selection.slice();
            const list = this.selectedItem as TreeViewItemList;
            if (list.list) {
                newSelection.push(0);
            this.selection = newSelection;
            } else if (!this._selectionIsLastInList) {
                this._selectionDown();
            }
        }
    }
    private         _selectionElement(selection: number[]) {
        const _array = selection.slice();
        let _selection = this._container.childNodes(_array.shift()!);

        _array.forEach(index => {
            _selection = _selection.data<TreeViewItemList>('treeview-item').list.childNodes(index);
        });

        return _selection;
    }
    private         _selectionItem(array: number[]) {
        return this._selectionElement(array).data<TreeViewItem>('treeview-item');
    }
    private         _selectionFindLastChild(selection: number[]): number[] {
        let item = this._selectionItem(selection);
        let hasOpenedChildren = item.container.hasClass('-expanded');
        const clonedSelection = selection.slice();

        if (hasOpenedChildren) {
            while (hasOpenedChildren) {
                const newIndex = (item as TreeViewItemList).list.childNodesLength - 1;
                item = (item as TreeViewItemList).list.childNodes(newIndex).data('treeview-item');
                clonedSelection.push(newIndex);
                hasOpenedChildren = item.container.hasClass('-expanded');
            }
            return clonedSelection;
        } else {
            return selection;
        }
    }
    private         _selectionIsLastInList(selection: number[]) {
        return this._selectionItem(selection).container.parent!.childNodesLength - 1 === selection[selection.length - 1];
    }
    private         _selectElement(element: $JD.DOMHTMLElement) {
        const selection = [element.index];
        let e:$JD.DOMHTMLElement|null;

        while ((e = element.parent) && e.hasClass('-list') && (e = e.parent)) {
            selection.unshift((element = e).index);
        }

        this.selection = selection;
    }
    private         _showError(parent: $JD.DOMHTMLElement, err: Error) {
        if (parent.children) {
            parent.empty();
        }

        parent.appendChild(
            <div class="-error">
                <i class="-icon -icon-error"></i> <span>{ "failed loading: " + err.toString() }</span>
            </div>
        );
    }
}

export abstract class TreeViewItem extends $JD.Container
{
    protected                   _data:      any;

    public  get                 data()
    {
        return this._data;
    }

    public                      select(select:boolean)
    {
        this._container.toggleClass('-selected', select);
    }
}

export class TreeViewItemEndPoint extends TreeViewItem
{
    public          constructor(text:string, data:any) {
        super(<div class="-item">
                  <div class="-label">
                      <i class="-icon -icon-fw"></i>
                      <span class="-text">{ text }</span>
                  </div>
              </div>);

        this._data    = data;
        this._container.data('treeview-item', this);
    }

    /*@internal*/   onclick(callback:(item:TreeViewItemEndPoint) => void)
    {
        callback(this._data);
    }
}

export class TreeViewItemList extends TreeViewItem
{
    private         _expanded:  boolean;
    private         _loaded:    boolean;

    public get      hasError() {
        return this.list.childNodes && this.list.childNodes(0).hasClass('-error');
    }
    public get      list() {
        return this.container.childNodes(1);
    }

    public          constructor(text:string, data:any) {
        super(<div class="-item -collapsed">
                  <div class="-label">
                      <i class="-icon -icon-arrow"></i>
                      <span class="-text">{ text }</span>
                  </div>
                  <div class="-list"></div>
              </div>);
        this._container.data('treeview-item', this);
        this._data      = data;
        this._expanded  = false;
        this._loaded    = false;
    }

    public          expand(expand:boolean) {
        this._expanded = expand;

        if (expand) {
            this.container.addClass('-expanded').removeClass('-collapsed');
        } else {
            this.container.addClass('-collapsed').removeClass('-expanded');
        }
        this._transition(expand, 250);
    }

    /*@internal*/   onclick(callback:(item:TreeViewItemList, list: $JD.DOMHTMLElement) => void) {
        if (!this._loaded) {
            this._loaded = true;
            callback(this, this.list);
        }

        if (this.hasError && !this._expanded) {
            this.list.empty();
            callback(this, this.list);
        }

        this._toggle();
    }

    private         _toggle() {
        this.expand(!this._expanded);
    }

    private         _transition(expand:boolean, time:number) {
        if (time > 0) {
            const start = Date.now();

            this.list.css('overflow', undefined);

            const timer = $J.setInterval(() => {
                const t = (Date.now() - start) / time;

                if (t >= 1) {
                    clearInterval(timer);

                    if (expand) {
                        this.list.css('height', 'auto').css('overflow', 'visible');
                    } else {
                        this.list.css('height', 0);
                    }

                    return;
                }

                const progress = (t<.5 ? 2*t*t : -1+(4-2*t)*t) * this.list.element.scrollHeight;
                this.list.css('height', expand ? progress : this.list.element.scrollHeight - progress);
            }, 20);
        } else {
            if (expand) {
                this.list.css('height', 'auto').css('overflow', 'visible');
            } else {
                this.list.css('height', 0);
            }
        }
    }
}

﻿/// <reference path="lib-ext.d.ts"/>
/// <reference path="../js/require.d.ts" />
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J        from "jc3/jannesen";
import * as $JD       from "jc3/jannesen.dom";
import * as $JT       from "jc3/jannesen.datatype";
import * as $JCONTENT from "jc3/jannesen.ui.content";

export interface IDataTableOpts<TRec extends $JT.Record>
{
    tableClass?:    string;
    rowClass?:      string | ((rec:TRec, idx:number)=>string);
    rowClick?:      (rec:TRec)=>void;
    columns:        IDataTableOptsColumn<TRec>[];
    buttons?:       IDataTableOptsButton<TRec>[];
}

export interface IDataTableOptsColumn<TRec extends $JT.Record>
{
    title?:         string;
    data?:          $JT.RecordFieldNames<TRec> | ((rec: TRec, idx:number)=>$JD.AddNode);
    format?:        string;
    style?:         string;
    width?:         string|number;
}
export interface IDataTableOptsButton<TRec extends $JT.Record>
{
    className:      string;
    title?:         string;
    onClick?:       (rec: TRec)=>void;
}

export interface IScrollbarOpts
{
    class:          string;
}
export interface IDataTableState
{
    toprow:         number;
    selectedrow:    number|null;
}

export class DataTable<TRecord extends $JT.Record> implements $JD.IDOMContainer
{
    private     _opts:          IDataTableOpts<TRecord>;
    private     _recordset:     $JT.Set<TRecord>;
    private     _container:     $JD.DOMHTMLElement;
    private     _scrollbar:     Scrollbar;
    private     _table:         $JD.DOMHTMLElement;
    private     _body:          $JD.DOMHTMLElement;
    private     _height:        number|undefined;
    private     _width:         number|undefined;
    private     _rowHeight:     number|undefined;
    private     _visualRows:    number|undefined;
    private     _curTopRow:     number|undefined;
    private     _curCountRow:   number|undefined;
    private     _selectedRow:   number|null|undefined;
    private     _filltimeout:   any;
    private     _mouseenabled:  boolean;
    private     _mousemovecnt:  number|null;

    public get  recordset()
    {
        return this._recordset;
    }
    public get  height() {
        const h = this._height;
        if (typeof h !== 'number') {
            throw new $J.InvalidStateError("Height is not defined.");
        }
        return h;
    }

    public get  state():IDataTableState|undefined
    {
        if (typeof this._scrollbar.Value === 'number' && typeof this._selectedRow === 'number') {
            return  {
                        toprow:         this._scrollbar.Value,
                        selectedrow:    this._selectedRow
                    };
        }
    }
    public set  state(s:IDataTableState|undefined)
    {
        if (s) {
            this._scrollbar.Value = s.toprow;

            if (this._rowHeight) {
                this._fillBody();
                this._select(s.selectedrow, true);
            } else {
                this._selectedRow = s.selectedrow;
            }
        }
    }

    public      constructor(recordset:$JT.Set<TRecord>, opts: IDataTableOpts<TRecord>)
    {
        this._recordset    = recordset;
        this._opts         = opts;
        this._mouseenabled = false;
        this._mousemovecnt = null;

        this._container =   <div class="jannesen-datatable" tabIndex="0" onkeydown={(ev) => {
                                        if (this._onkeydown(ev)) {
                                            this._mouseenabled = false;
                                            ev.preventDefault();
                                            ev.stopPropagation();
                                        }
                                    }}>
                            </div>;

        let colgroup = <colgroup/>;
        let theadtr = <tr/>;

        opts.columns.forEach((col,index) => {
                                colgroup.appendChild(col.width ? <col style={ "width:"+col.width } /> : <col/>);
                                theadtr.appendChild(<td class={"-col"+(index+1)} style={ col.style }>{ col.title }</td>);
                            });

        if (opts.buttons) {
            colgroup.appendChild(<col style={ "width: " + (0.5 + 1.5 * opts.buttons.length) + "em" }/>);
            theadtr.appendChild(<td/>);
        }

        this._body = <tbody class="-customselect"   onmousemove={(ev) => {
                                                            if (!this._mouseenabled) {
                                                                if (this._mousemovecnt !== null) {
                                                                    if (++(this._mousemovecnt) >= 8) {
                                                                        this._mouseenabled = true;
                                                                    }
                                                                } else {
                                                                    this._mousemovecnt = 0;
                                                                    setTimeout(() => {
                                                                                        this._mousemovecnt = null;
                                                                                }, 350);
                                                                }
                                                            }
                                                        }}
                                                    onmouseover={(ev) => {
                                                            if (this._selectedRow === null) {
                                                                this._mouseenabled = true;
                                                            }

                                                            if (this._mouseenabled) {
                                                                this._select(helper_getrecordId(ev.target), false);
                                                            }
                                                        }}
                                                    onmouseleave={(ev) => {
                                                            if (this._mouseenabled) {
                                                                this._select(null, false);
                                                            }
                                                        }}
                                                    onwheel={(ev) => {
                                                            this._mouseenabled = true;
                                                            const curSelected = helper_getrecordId(ev.target);
                                                            const oldValue    = this._scrollbar.Value;

                                                            if (typeof curSelected === 'number' && typeof oldValue === 'number' && typeof this._rowHeight === 'number') {
                                                                const newValue = oldValue + Math.round(ev.deltaY / this._rowHeight);
                                                                this._scrollbar.Value = newValue;
                                                                this._fillBody();
                                                                this._select(curSelected + (newValue - oldValue), false);
                                                            }
                                                        }}
                                                    onclick={(ev) => {
                                                            ev.stopPropagation();
                                                            this._mouseenabled = true;
                                                            let idx = helper_getrecordId(ev.target);
                                                            if (typeof idx === 'number') {
                                                                if (this._opts.buttons && (ev.target as HTMLElement).tagName === "SPAN") {
                                                                    let b = helper_getbutton(this._opts.buttons, ev.target);
                                                                    if (b && typeof b.onClick === 'function') {
                                                                        b.onClick(this._recordset.item(idx));
                                                                        return ;
                                                                    }
                                                                }
                                                                if (typeof this._opts.rowClick === "function") {
                                                                    this._opts.rowClick(this._recordset.item(idx));
                                                                }
                                                            }
                                                        }}
                                             />;

        if (!(opts.rowClick))
            this._body.addClass("-no-select");

        this._table =   <table class={ opts.tableClass || "datatable" }>
                            { colgroup }
                            <thead>
                                { theadtr }
                            </thead>
                            { this._body }
                        </table>;

        this._container.appendChild(<div class="-table">{this._table}</div>);

        this._scrollbar = new Scrollbar({ class: "-scroll-vertical" });
        this._scrollbar.minValue = 0;
        this._scrollbar.Value    = 0;
        this._scrollbar.bind("changed", this._onscroll, this);
        this._container.appendChild(this._scrollbar);
        this._height        =
        this._width         =
        this._rowHeight     =
        this._curTopRow     =
        this._curCountRow   =
        this._selectedRow   =
        this._filltimeout   = undefined;
    }

    public get  container(): $JD.DOMHTMLElement
    {
        return this._container;
    }

    public      setHeight(h:number)
    {
        if (this._height !== h) {
            this._container.css("height", this._height = h);
            this._scrollbar.Size = h;

            let rowHeight:number;

            if (this._body.childNodesLength > 0) {
                rowHeight = this._body.children[0].outerSize.height;
            }
            else {
                this._body.appendChild(<tr><td>x</td></tr>);
                rowHeight = this._body.children[0].outerSize.height;
                this._body.empty();
            }

            if (rowHeight <= 0) {
                throw new $J.InvalidStateError("Can't determin row height.");
            }


            this._rowHeight  = rowHeight;
            this._visualRows = (this._height - (this._table.outerSize.height - this._body.outerSize.height)) / rowHeight;
            const visualRows = Math.floor(this._visualRows);
            this._scrollbar.maxValue = Math.max(0, this._recordset.count - visualRows);

            if (typeof this._selectedRow === 'number') {
                let v = this._scrollbar.Value;
                if (typeof v === 'number' && v > this._selectedRow) {
                    this._scrollbar.Value = v = this._selectedRow;
                }

                const m = Math.max(0, this._selectedRow - (visualRows - 1));
                if (typeof v !== 'number' || v < m) {
                    this._scrollbar.Value = m;
                }
            }

            this._fillBody();
        }
    }
    public      focus()
    {
        this._container.focus();

        if (this._selectedRow === null) {
            this._select(0, true);
        }
    }

    private     _onkeydown(ev:KeyboardEvent):boolean
    {
        if (!(ev.altKey || ev.ctrlKey || ev.metaKey))
        {
            switch(ev.key)
            {
            case "Enter":
                if (typeof this._selectedRow === 'number' && typeof this._opts.rowClick === "function") {
                    this._opts.rowClick(this._recordset.item(this._selectedRow));
                }
                return true;

            case "PageUp": {
                    const rect = (typeof this._selectedRow === 'number' &&  typeof this._curTopRow === 'number') ? this._body.childNodes(this._selectedRow - this._curTopRow).clientRect : null;
                    const top  = this._scrollbar.Value;
                    let scrollValue:number|null|undefined;
                    let bottomRow:number|null|undefined;

                    while (typeof (scrollValue = this._scrollbar.Value) === 'number' && scrollValue > 0 &&
                           typeof (bottomRow = this._bottomVisibleRow()) === 'number' && top! < bottomRow) {
                        this._scrollbar.Value = scrollValue - Math.max(bottomRow - top! - 4, 1);
                        this._fillBody();
                    }

                    this._select(helper_getrecordAt(rect), false);
                }
                return true;

            case "PageDown": {
                    const rect = (typeof this._selectedRow === 'number' && typeof this._curTopRow === 'number') ? this._body.childNodes(this._selectedRow - this._curTopRow).clientRect : null;
                    this._scrollbar.Value = this._bottomVisibleRow();
                    this._fillBody();
                    this._select(helper_getrecordAt(rect), false);
                }
                return true;

            case "End":
                this._select(this._recordset.count - 1, true);
                return true;

            case "Home":
                this._select(0, true);
                return true;

            case "ArrowUp":
                if (typeof this._selectedRow === 'number') {
                    this._select(this._selectedRow - 1, true);
                }
                else {
                    const r = this._bottomVisibleRow();
                    if (typeof r === 'number') {
                        this._select(r, true);
                    }
                }
                return true;

            case "ArrowDown":
                if (typeof this._selectedRow === 'number') {
                    this._select(this._selectedRow + 1, true);
                }
                else {
                    const r = this._curTopRow;
                    if (typeof r === 'number') {
                        this._select(r, true);
                    }
                }
                return true;
            }
        }

        return false;
    }
    private     _onscroll(reason:$JT.ChangeReason)
    {
        this._delayedFill(100);
    }

    private     _bottomVisibleRow(): number|undefined
    {
        if (typeof this._curTopRow === 'number' && typeof this._curCountRow === 'number') {
            let     containerBottom = this._container.clientRect.bottom + 1;
            let     bottomRow       = this._curTopRow + this._curCountRow - 1;

            while (bottomRow > this._curTopRow && this._body.childNodes(bottomRow - this._curTopRow).clientRect.bottom > containerBottom)
                --bottomRow;

            return bottomRow;
        }
    }

    private     _select(row:number|null, updateFill:boolean) {
        if (typeof row === 'number') {
            if (this._recordset.count > 0) {
                if (row < 0)                        row = 0;
                if (row >= this._recordset.count)   row = this._recordset.count - 1;
            }
            else
                row = null;
        }

        if (typeof row === 'number' && updateFill) {
            if (typeof this._curTopRow !== 'number' || row < this._curTopRow) {
                this._scrollbar.Value = row;
                this._fillBody();
            }
            else {
                let visualrows = Math.floor(this._visualRows!);

                if (row >= this._curTopRow + visualrows) {
                    this._scrollbar.Value = row-visualrows;
                    this._fillBody();
                }

                let     containerBottom = this._container.clientRect.bottom + 1;
                let     rowBottom       = this._body.childNodes(row - this._curTopRow).clientRect.bottom;
                let     n = 0;

                while ((this._curTopRow + n) < row && rowBottom > containerBottom) {
                    rowBottom -= this._body.childNodes(n).clientRect.height;
                    ++n;
                }

                if (n > 0)  {
                    this._scrollbar.Value! += n;
                    this._fillBody();
                }
            }
        }

        if (this._selectedRow !== row) {
            if (typeof this._selectedRow === 'number' && typeof this._curTopRow === 'number') {
                let idx = this._selectedRow - this._curTopRow;
                if (idx >= 0 && idx < this._body.childNodesLength) {
                    this._body.childNodes(idx).removeClass("-selected");
                }
            }
            this._selectedRow = null;

            this._setSelected(this._selectedRow = row);
        }
    }
    private     _delayedFill(timeout:number)
    {
        if (this._filltimeout == null) {
            this._filltimeout = $J.setTimeout(() => {
                this._filltimeout = null;
                this._fillBody();
            }, timeout);
        }
    }
    private     _fillBody()
    {
        if (typeof this._height === 'number' && typeof this._visualRows === 'number' && typeof this._rowHeight === 'number') {
            const toprow     = this._scrollbar.Value;

            if (typeof toprow === 'number') {
                const rowcount   = this._recordset.count;
                const visualRows = Math.ceil(this._visualRows);

                if (typeof this._curTopRow === 'number' && typeof this._curCountRow === 'number' &&
                    this._curTopRow - (this._curCountRow * 0.7) <= toprow && toprow <= this._curTopRow + (this._curCountRow * 0.7)) {
                    if (toprow < this._curTopRow) {
                        const rows = this._getRows(toprow, this._curTopRow - toprow);
                        this._body.prependChild(rows);
                        this._curTopRow   =  toprow;
                        this._curCountRow += rows.length;
                    }
                    else if (toprow > this._curTopRow) {
                        const rows = this._body.children.slice(0, toprow - this._curTopRow);
                        this._body.removeChild(rows);
                        this._curTopRow   =  toprow;
                        this._curCountRow -= rows.length;
                    }

                    if (this._curCountRow < visualRows) {
                        const startrow = this._curTopRow + this._curCountRow;
                        const rows = this._getRows(startrow, Math.min(visualRows - this._curCountRow , rowcount - startrow));
                        this._body.appendChild(rows);
                        this._curCountRow += rows.length;
                    }
                    else if (this._curCountRow > visualRows * 1.5 + 8) {
                        let rows = this._body.children.slice(visualRows * 1.5 + 8);
                        this._body.removeChild(rows);
                        this._curCountRow -= rows.length;
                    }
                } else {
                    let rows = this._getRows(toprow, Math.min(visualRows, rowcount - toprow));
                    this._curTopRow   = toprow;
                    this._curCountRow = rows.length;
                    this._body.empty().appendChild(rows);
                    this._setSelected(this._selectedRow);
                }

                if (toprow > 0 && toprow >= this._scrollbar.maxValue!) {
                    let     containerBottom = this._container.clientRect.bottom;
                    let     n = 0;

                    while (n < this._curCountRow && this._body.childNodes(this._curCountRow - n - 1).clientRect.bottom > containerBottom)
                        ++n;

                    this._scrollbar.maxValue! += n;
                }
            }
        }
    }
    private     _setSelected(row:number|null|undefined)    {
        if (typeof row === 'number') {
            if (typeof this._curTopRow === 'number') {
                let idx = row - this._curTopRow;
                if (idx >= 0 && idx < this._body.childNodesLength) {
                    this._body.childNodes(idx).addClass("-selected");
                }
            }
        }
    }
    private     _getRows(idx:number, n:number)
    {
        let rows:$JD.DOMHTMLElement[] = [];

        while (n > 0) {
            var rec = this._recordset.item(idx);
            var row = <tr/>;

            this._opts.columns.forEach((c, i) => row.appendChild(<td class={"-col" + i} style={c.style}>
                                                                {
                                                                      (typeof c.data === "string")   ? rec.field(c.data).toDom(c.format)
                                                                    : (typeof c.data === "function") ? (c.data as (rec:$JT.Record, idx:number)=>$JD.AddNode)(rec, idx)
                                                                    : undefined
                                                                }
                                                                </td>));
            row.attr("_recordidx", "" + idx);

            if (this._opts.buttons) {
                row.appendChild(<td class="-right-buttons">
                                    { this._opts.buttons.map((b,i) => <span class={ b.className } title={ b.title } />) }
                                </td>);
            }

            if (typeof this._opts.rowClass === "function")
                row.addClass((this._opts.rowClass as (rec:$JT.Record, idx:number)=>string)(rec, idx));
            else
            if (typeof this._opts.rowClass === "string")
                row.addClass(this._opts.rowClass as string);

            rows.push(row);
            --n;
            ++idx;
        }

        return rows;
    }
}

export class Scrollbar extends $JD.Container
{
    private     _btnup:         $JD.DOMHTMLElement;
    private     _btndown:       $JD.DOMHTMLElement;
    private     _slider:        $JD.DOMHTMLElement;
    private     _width:         number;
    private     _minValue:      number|undefined;
    private     _maxValue:      number|undefined;
    private     _value:         number|null|undefined;
    private     _size:          number|undefined;
    private     _scrollSize:    number|undefined;
    private     _sliderSize:    number;

    public      constructor(opts: IScrollbarOpts)
    {
        super(<div class="jannesen-scrollbar -vertical" />);
        this._width      = 16;  // Can't get the width of the scrollbar defined is css because the div is not jet part of live dom.
                                // For known hardcode to 16 px as in css.
        this._minValue   = undefined;
        this._maxValue   = undefined;
        this._sliderSize = 0;

        this._container.css('width', this._width);

        this._container.appendChild(this._btnup  =  <div class="-btn-up" style={"height:"+this._width+"px;width:"+this._width+"px"}
                                                         onclick={()=> {
                                                                if (typeof this._value === 'number') {
                                                                    this._setValue(this._value - 1, $JT.ChangeReason.UI, true);
                                                                }
                                                            }}/>,
                                    this._slider =  <div class="-slider" style={"width:"+this._width+"px"}
                                                        onmousedown={(ev) => {
                                                                    this._slider.addClass("-move");
                                                                    $JCONTENT.moveTracker(ev,
                                                                                          { top:this._slider.css("top"), left:0 },
                                                                                          (p) => {
                                                                                                if (typeof this._minValue   === 'number' &&
                                                                                                    typeof this._maxValue   === 'number' &&
                                                                                                    typeof this._scrollSize === 'number') {
                                                                                                    if (p.top < this._width)                                            p.top = this._width;
                                                                                                    if (p.top > this._width + this._scrollSize - this._sliderSize)      p.top = this._width + this._scrollSize - this._sliderSize;
                                                                                                    this._slider.css("top", p.top);
                                                                                                    this._setValue(this._minValue + ((p.top - this._width)  / (this._scrollSize - this._sliderSize)) * (this._maxValue - this._minValue), $JT.ChangeReason.UI, false);
                                                                                                }
                                                                                          },
                                                                                          ()  => {
                                                                                                this._slider.removeClass("-move"); this._calcSlider(false);
                                                                                          } );
                                                                }} >
                                                            <div class="-bar" />
                                                    </div>,
                                    this._btndown = <div class="-btn-down" style={"height:"+this._width+"px;width:"+this._width+"px"}
                                                         onclick={()=> {
                                                                if (typeof this._value === 'number') {
                                                                    this._setValue(this._value + 1, $JT.ChangeReason.UI, true);
                                                                }
                                                            }}/>);

        if (opts.class) {
            this._container.addClass(opts.class);
        }
    }

    public get  minValue()              { return this._minValue;    }
    public set  minValue(v:number|undefined)
    {
        if (this._minValue !== v) {
            this._minValue = v;
            this._calcSlider(true);
        }
    }

    public get  maxValue()              { return this._maxValue;    }
    public set  maxValue(v:number|undefined)
    {
        if (this._maxValue !== v) {
            this._maxValue = v;
            this._calcSlider(true);
        }
    }

    public get  Value()                 { return this._value;       }
    public set  Value(v:number|null|undefined)
    {
        this._setValue(v, $JT.ChangeReason.Assign, true);
    }

    public get  Size()                  { return this._size;        }
    public set  Size(v:number|undefined)
    {
        this._size       = v;
        this._scrollSize = (typeof v === 'number' ? v - (this._width * 2) : undefined);
        this._container.css("height", (typeof v === 'number' && v > 0) ? v : 0);
        this._calcSlider(true);
    }

    public bind(eventName:"changed", handler: (ev:$JT.ChangeReason)=>void, thisArg?:any): void;
    public bind(eventName:string,    handler: (ev:any)=>void, thisArg?:any): void
    {
        super.bind(eventName, handler, thisArg);
    }

    private     _calcSlider(recalc:boolean)
    {
        if (typeof this._minValue   === "number" &&
            typeof this._maxValue   === "number" &&
            typeof this._value      === "number" &&
            typeof this._scrollSize === "number" &&
            this._scrollSize > 0 && this._maxValue > this._minValue)
        {
            if (this._value < this._minValue) {
                this._setValue(this._minValue, $JT.ChangeReason.Assign, false);
            }
            if (this._value > this._maxValue) {
                 this._setValue(this._maxValue, $JT.ChangeReason.Assign, false);
            }

            if (this._sliderSize === 0 || recalc)
            {
                this._sliderSize = 12 + Math.round((this._scrollSize-12) * Math.pow(0.4, Math.log(this._maxValue - this._minValue+1) / Math.LN10));
                this._slider.css("height", this._sliderSize);
                recalc = true;
            }

            this._slider .css("top", this._width + ((this._scrollSize - this._sliderSize) * ((this._value - this._minValue) / (this._maxValue - this._minValue))));

            if (recalc)
                this._slider.show(true);
        }
        else
        {
            this._sliderSize = 0;
            this._slider.show(false);
        }
    }
    private     _setValue(v:number|null|undefined, reason:$JT.ChangeReason, calcSlider:boolean)
    {
        if (typeof v === "number" && typeof this._minValue === 'number' && typeof this._maxValue === 'number' ) {
            v = Math.round(v);
            if (v < this._minValue)     v = this._minValue;
            if (v > this._maxValue)     v = this._maxValue;
        }

        if (this._value !== v) {
            this._value = v;
            if (calcSlider) {
                this._calcSlider(false);
            }
            this._btnup  .toggleClass("-enabled", typeof v === "number" && typeof this._minValue === 'number' && v > this._minValue);
            this._btndown.toggleClass("-enabled", typeof v === "number" && typeof this._maxValue === 'number' && v < this._maxValue);
            this.trigger("changed", reason);
        }
    }
}
//$J.applyMixins(Scrollbar, [$J.EventHandling]);

function helper_getrecordId(e:any): number|null
{
    while (e instanceof Element)
    {
        if (e.tagName === "TR") {
            let id = e.getAttribute("_recordidx");

            if (typeof id === "string") {
                return parseInt(id, 10);
            }
        }

         e = e.parentElement;
    }

    return null;
}
function helper_getbutton<TRec extends $JT.Record>(buttons:IDataTableOptsButton<TRec>[], e:any): IDataTableOptsButton<TRec>|undefined
{
    if (e.tagName === "SPAN") {
        let className = e.getAttribute("class");
        return buttons.find((b) => b.className === className);
    }

    return undefined;
}
function helper_getrecordAt(rect:$JD.IRect|null): number|null
{
    return (rect !== null) ? helper_getrecordId(document.elementFromPoint(rect.left + 1, rect.top + rect.height / 2)) : null;
}

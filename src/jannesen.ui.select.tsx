/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J       from "jc3/jannesen";
import * as $JA      from "jc3/jannesen.async";
import * as $JD      from "jc3/jannesen.dom";
import * as $JT      from "jc3/jannesen.datatype";
import * as $JI      from "jc3/jannesen.input";
import * as $JSTRING from "jc3/jannesen.string";
import * as $JPOPUP  from "jc3/jannesen.ui.popup";
import * as $JL      from "jc3/jannesen.language";

interface ICurrentFetch<TRecord>
{
    ct:             $JA.CancellationTokenSource|null;
    task:           $JA.Task<TRecord[]|string>;
    searchtext?:    string|string[];
}

export class SelectInputDropdown<TNativeValue extends $JT.SelectValue, TDatasource extends $JT.SelectDatasource<TNativeValue, $JT.ISelectRecord>> extends $JPOPUP.DropdownContent<TNativeValue, $JT.SelectType<TNativeValue,TDatasource>, $JI.SelectInput<TNativeValue,TDatasource>, $JI.ISelectInputControlOptions<TNativeValue,TDatasource>, SelectInputDropdown<TNativeValue,TDatasource>>
{
    private     _datasource:                TDatasource;
    private     _columns:                   $JT.ISelectTypeAttributeDropdownColumn[];
    private     _context:                   $J.IUrlArgsColl|undefined;
    private     _searchtext:                string|string[];
    private     _currectfetch:              ICurrentFetch<$JT.TDatasource_Record<TDatasource>>|undefined;
    private     _data:                      $JT.TDatasource_Record<TDatasource>[]|undefined|null;
    private     _tbody:                     $JD.DOMHTMLElement|undefined;
    private     _tbodydata:                 ($JT.TDatasource_Record<TDatasource>|null)[]|undefined;
    private     _selectedRow:               number|undefined;
    private     _mouseenabled:              boolean;
    private     _mousemovecnt:              number|undefined;

    constructor(popup: $JPOPUP.DropdownPopup<TNativeValue, $JT.SelectType<TNativeValue,TDatasource>, $JI.SelectInput<TNativeValue,TDatasource>, $JI.ISelectInputControlOptions<TNativeValue,TDatasource>, SelectInputDropdown<TNativeValue,TDatasource>>, context: $J.IUrlArgsColl|undefined)
    {
        super(popup);
        const container = this.container!;
        const input   = popup._input!;
        const value = (input ? input.value : undefined);
        if (!value) {
            throw new $J.InvalidStateError("Input/value not available.");
        }

        this._datasource  = value.Datasource;
        this._columns     = input.get_opts().dropdown_columns || value.getAttr("dropdown_columns") as $JT.ISelectTypeAttributeDropdownColumn[];
        this._context     = (context instanceof Object) ? context : undefined;
        this._searchtext  = "";

        this._setMessage("loading...", true);

        container.bind("keydown", (ev) => {
                                            if (this._onkeydown(ev)) {
                                                this._mouseenabled = false;
                                                ev.preventDefault();
                                                ev.stopPropagation();
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
                                                this._select(this._getrow(ev.target));
                                            }
                                        });
        container.bind("mouseleave", (ev) => {
                                            if (this._mouseenabled) {
                                                this._select();
                                            }
                                        });
        container.bind("wheel", (ev) => {
                                            this._mouseenabled = true;
                                            $J.setTimeout(()=> {
                                                                this._select(this._getrow(document.elementFromPoint(ev.clientX, ev.clientY)));
                                                            }, 50);
                                        });
        container.bind("click", (ev) => {
                                            this._mouseenabled = true;
                                            this._clickrow(this._getrow(ev.target));
                                        });
        this._mouseenabled = false;
    }

    public      LocalSearch(text:string)
    {
        if (this._currectfetch && this._currectfetch.task.isFulfilled) {
            if (this._datasource.flags & $JT.SelectDatasourceFlags.SearchFetch) {
                return hassearchdata(this._currectfetch.searchtext, normalizeSearchText(text));
            }
            else {
                return true;
            }
        }

        return false;
    }

    public      Refresh(text:string)
    {
        try {
            this._select();
            this._searchtext = normalizeSearchText(text);

            if (this._datasource.flags & $JT.SelectDatasourceFlags.SearchFetch) {
                if (this._currectfetch && this._currectfetch.task.isFulfilled && hassearchdata(this._currectfetch.searchtext, this._searchtext)) {
                    this._filltable();
                } else {
                    this._stopfetchdata();

                    let searchtext   = this._datasource.filter_searchtext(this._searchtext);

                    if (searchtext.length > 0 || (this._datasource.flags & $JT.SelectDatasourceFlags.SearchAll) !== 0) {
                        this._fetchdata_start(searchtext, this.input!.get_opts().fetchmax || 250);
                    } else {
                        this._currectfetch = undefined;
                        this._setMessage($JL.more_input_necessary);
                    }
                }
            } else {
                if (this._currectfetch) {
                    if (this._currectfetch.task.isFulfilled) {
                        this._filltable();
                    }
                } else {
                    this._data                   = undefined;
                    this._tbody                  = undefined;
                    this._tbodydata              = undefined;
                    this._fetchdata_start(undefined, undefined);
                }
            }
        } catch(err) {
            this._currectfetch = undefined;
            this._data         = undefined;
            this._setMessage(err);
        }
    }
    public      OnFocus()
    {
        if (this._tbody && this._selectedRow === undefined)
            this._select(0);
    }
    public      OnRemove()
    {
        this._stopfetchdata();
    }

    private     _stopfetchdata()
    {
        if (this._currectfetch && this._currectfetch.ct) {
            this._currectfetch.ct.cancel();
        }

        this._currectfetch = undefined;
        this._data         = undefined;
        this._tbody        = undefined;
        this._tbodydata    = undefined;
        this._selectedRow  = undefined;
    }
    private     _fetchdata_start(searchtext?:string|string[], max?:number)
    {
        const ct   = new $JA.CancellationTokenSource();
        const task = this._datasource.fetchdataAsync(ct, this._context, searchtext, max) as (/*TS Limit*/ $JA.Task<string|$JT.TDatasource_Record<TDatasource>[]>);
        this._currectfetch = { ct, task, searchtext };

        if (task.isPending) {
            this.container!.addClass("-busy");
        }

        task.then((data) => {
                        if (this._currectfetch && this._currectfetch.task === task) {
                            this._currectfetch.ct = null;
                            if (this.container) {
                                this.container.removeClass("-busy");

                                try {
                                    if (typeof data === 'string' && data === "TOMANY-RESULTS") {
                                        this._currectfetch = undefined;
                                        this._data         = undefined;
                                        this._setMessage($JL.more_input_necessary);
                                        return;
                                    }
                                    else if (Array.isArray(data)) {
                                        let opts = this.input!.get_opts();

                                        if (typeof opts.filter === "function") {
                                            data = data.filter(opts.filter);
                                        }

                                        if (typeof opts.sort === "function") {
                                            data = data.sort(opts.sort);
                                        }

                                        this._data = data;
                                    } else {
                                        this._data = null;
                                    }

                                    this._filltable();
                                } catch(err) {
                                    this._currectfetch = undefined;
                                    this._data         = undefined;
                                    this._setMessage(err);
                                }
                            }
                        }
                    },
                    (err) => {
                        if (this._currectfetch && this._currectfetch.task === task) {
                            this._currectfetch.ct = null;
                            this._currectfetch = undefined;
                            this._data         = undefined;

                            if (this.container) {
                                this.container.removeClass("-busy");
                                this._setMessage(err);
                            }
                        }
                    });
    }
    private     _onkeydown(ev:KeyboardEvent):boolean
    {
        if (!(ev.altKey || ev.ctrlKey || ev.metaKey)) {
            const container = this.container;
            const input     = this.input;

            if (this._selectedRow !== undefined && this._tbodydata && container && input) {
                switch(ev.key) {
                case "Backspace":
                    return true;

                case "Tab": {
                        const input = this.input;
                        this._clickrow(this._selectedRow, false);
                        this.ForwardTab(input, ev);
                    }
                    return true;

                case "Enter":
                    this._clickrow(this._selectedRow);
                    return true;

                case "Escape":
                    this.Close();
                    return true;

                case "PageUp":
                    this._select(this._selectedRow - calcPageStep(container));
                    return true;

                case "PageDown":
                    this._select(this._selectedRow + calcPageStep(container));
                    return true;

                case "End":
                    this._select(this._tbodydata.length - 1);
                    return true;

                case "Home":
                    this._select(0);
                    return true;

                case "ArrowUp":
                    if (this._selectedRow > 0)
                        this._select(this._selectedRow - 1);
                    else
                        input.getinputelm().focus();

                    return true;

                case "ArrowDown":
                    if (this._selectedRow < this._tbodydata.length - 1)
                        this._select(this._selectedRow + 1);

                    return true;

                default:
                    {
                        if (ev.key.length === 1 && !input.disableKeyboard()) {
                            $J.setTimeout(() => {
                                    input.addChar(ev.key);
                                }, 0);
                        }
                    }
                }
            }
        }

        return false;
    }
    private     _filltable()
    {
        try {
            const input = this.input!;
            const value = input.value!;

            let tb:$JD.DOMHTMLElement[]                             = [];
            let tbdata:($JT.TDatasource_Record<TDatasource>|null)[] = [];

            this._selectedRow = undefined;

            if (this._data) {
                if (input.get_opts().simpleDropdown && !value.Required) {
                    tb.push(<tr><td colSpan={this._columns ? this._columns.length : 1}>{ input.get_opts().simpleNulltext || "\xA0" }</td></tr>);
                    tbdata.push(null);
                }
                this._data.forEach((rec) => {
                                                if ((this._datasource.flags & $JT.SelectDatasourceFlags.StaticEnum && input.get_opts().simpleDropdown && !input.isDirty()) ||
                                                    this._datafilter(rec)) {
                                                    tb.push(<tr> {
                                                                (this._columns) ? this._columns.map((f) => <td>{ valueText((rec as ({readonly [key:string]:any}))[f.fieldname]) }</td>)
                                                                                : <td>{ value.toDisplayText((rec as ({readonly [key:string]:any}))[this._datasource.keyfieldname] as (TNativeValue|null|undefined), rec) }</td>
                                                            } </tr>);
                                                    tbdata.push(rec);
                                                }
                                            });
            }

            if (tbdata.length === 0) {
                this._setMessage($JL.no_result);
                return;
            }

            if (!this._tbody) {
                let elmtb  = <table/>;

                if (this._columns) {
                    elmtb.appendChild(<colgroup>{ this._columns.map((f) => <col style={"width:"+f.width} />) }</colgroup>);
                }

                elmtb.appendChild(this._tbody = <tbody>{tb}</tbody>);

                this.setContent(<div class="-data">{ elmtb }</div>);
            } else {
                this._tbody.empty().appendChild(tb);
            }

            this._tbodydata = tbdata;

            if (this.hasFocus()) {
                let row:number = 0;

                if (!input.isDirty()) {
                    const keyfieldname = this._datasource.keyfieldname;
                    const v            = value.internalvalue;
                    row = tbdata.findIndex((rec) => (rec !== null ? (rec as ({readonly [key:string]:any}))[keyfieldname] : null) === v);
                }

                this._select(row);
            }
            this.PositionPopup();
        } catch(err) {
            this._setMessage(err);
        }
    }
    private     _datafilter(rec:$JT.TDatasource_Record<TDatasource>): boolean
    {
        if (Array.isArray(this._searchtext)) {
            const value = this.input!.value!;

            for(let i = 0 ; i < this._searchtext.length ; ++i) {
                let key = this._searchtext[i];

                if (this._columns) {
                    if (!this._columns.some((col) => containskey((rec as ({readonly [key:string]:any}))[col.fieldname] as string, key)))
                        return false;
                } else {
                    if (!containskey(value.toDisplayText((rec as ({readonly [key:string]:any}))[this._datasource.keyfieldname] as (TNativeValue|null|undefined), rec), key))
                        return false;
                }
            }
        }

        return true;

        function containskey(text:string, key:string) {
            if (typeof text !== 'string')
                return false;

            let s = $JSTRING.removeDiacritics(text).toUpperCase().replace(/[^A-Z0-9]/g, " ");
            let p = s.indexOf(key);

            return p === 0 || (p > 0 && !/[A-Z-0-9]/.test(s[p-1]));
        }
    }
    private     _clickrow(row:number|undefined, tab?:boolean)
    {
        if (this._tbodydata && row !== undefined) {
            let rec = this._tbodydata[row];
            if (rec !== null) {
                const datasource = this._datasource;
                let v = (rec as ({readonly [key:string]:any}))[datasource.keyfieldname];
                if (v !== undefined) {
                    if (datasource instanceof $JT.RemoteSelectDatasource) {
                        datasource.addrecord(rec);
                        v = rec;
                    }
                    this.Close(v);
                    return;
                }
            }
        }

        if (tab) {
            this.Close(undefined);
        }
    }
    private     _select(row?:number)
    {
        if (this._tbody) {
            if (this._selectedRow !== undefined) {
                this._tbody.childNodes(this._selectedRow).removeClass("-selected");
                this._selectedRow = undefined;
            }

            if (row !== undefined) {
                row = Math.max(Math.min(row, this._tbodydata!.length -1), 0);
                let rowelm = this._tbody.childNodes(row);
                rowelm.addClass("-selected");

                let divrect = this.container!.clientRect;
                let rowrect = rowelm.outerRect;

                if (rowrect.bottom > divrect.bottom) {
                    this.scrollelm.element.scrollTop += rowrect.bottom - divrect.bottom + 1 + Math.min(divrect.height - rowrect.height, 0);
                }
                if (rowrect.top < divrect.top) {
                    this.scrollelm.element.scrollTop += rowrect.top - divrect.top - 1;
                }

                this._selectedRow = row;
            }
        }
    }
    private     _getrow(elm: any)
    {
        if (this._tbody) {
            let tbody = this._tbody.element;

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
    private     _setMessage(msg:string|Error, keepfocus?: boolean)
    {
        this._tbody            = undefined;
        this._tbodydata        = undefined;
        this._selectedRow      = undefined;
        this.setMessage(msg, keepfocus);
    }
}

function calcPageStep(container:$JD.DOMHTMLElement): number
{
    let rowheight = container.css("font-size") * 1.167 + 2;
    return Math.max(1, Math.floor(container.clientRect.height / rowheight - 0.9));
}
function normalizeSearchText(text: string): string|string[]
{
    text = $JSTRING.removeDiacritics(text.trim()).toUpperCase();

    if (/^#[0-9A-Z.\-]+$/.test(text))
        return text;

    let keywords = text.replace(/[^A-Z0-9]/g, " ").split(" ").filter((r) => r.length >= 2);

    return keywords.filter((k) => !keywords.some((r) => r.length > k.length && r.startsWith(k)));
}
function hassearchdata(fd_searchtext:string|string[]|undefined, searchtext:string|string[])
{
    if (typeof searchtext === 'string' && typeof fd_searchtext === 'string') {
        return fd_searchtext === searchtext;
    }

    if (Array.isArray(searchtext) && Array.isArray(fd_searchtext)) {
        for (let i = 0 ; i < fd_searchtext.length ; ++i) {
            let k = fd_searchtext[i];

            if (!(searchtext as string[]).some((s) => s.startsWith(k)))
                return false;
        }

        return true;
    }

    return false;
}
function valueText(v:any): string|null {
    switch (typeof v) {
    case "string":      return v as string;
    case "number":      return v.toString();
    case "boolean":     return v ? "true":"false";
    default:
        if (v === null)
            return null;

        return "???";
    }
}

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
    ct:             $JA.Context|null;
    task:           $JA.Task<TRecord[]|string>;
    searchtext?:    string|string[];
    data?:          TRecord[]|null;
}

export class ValuesDropdown<TNativeValue,
                            TValue extends $JT.SimpleType<TNativeValue>,
                            TInput extends $JI.InputTextControl<TNativeValue, TValue, TInput, TOpts, void, ValuesDropdown<TNativeValue, TValue, TInput, TOpts>>,
                            TOpts extends $JI.IInputControlDropdownValuesOptions<TNativeValue>>
                        extends $JPOPUP.TableDropdown<TNativeValue, TInput, void>
{
    private     _values?:   TNativeValue[];

    public              OnLoad(calldata:void, ct:$JA.Context): $JA.Task<void>|void
    {
        const input           = this.control;

        if (input && input.value) {
            try {
                const values = (input.opts.dropdown_values!)(ct);

                if (values instanceof $JA.Task) {
                    return values.then((v) => { this._fillValues(v); })
                                 .catch((e) => {
                                     if (!(e instanceof $JA.OperationCanceledError)) {
                                         this.setMessage(e);
                                     }
                                 });
                 }
                else {
                    this._fillValues(values);
                }
            }
            catch (e) {
                this.setMessage(e);
            }
        }
    }

    protected   clickrow(row:number|undefined, ev:Event|undefined)
    {
        this.Close((this._values && typeof row === 'number' ? this._values[row] : undefined), ev);
    }

    private     _fillValues(values: TNativeValue[])
    {
        this._values = values;

        const input = this.control;
        const value = input && input.value;

        if (value) {
            const format = value.getAttr("format");
            this.setTBody(values.map((v) => <tr><td>{ value.cnvValueToText(v, format) }</td></tr>));
        }
    }
}

export class SelectInputDropdown<TNativeValue extends $JT.SelectValue,
                                 TDatasource extends $JT.SelectDatasource<TNativeValue, $JT.ISelectRecord>>
                extends $JPOPUP.TableDropdown<TNativeValue, $JI.SelectInput<TNativeValue,TDatasource>, $JI.SelectInputContext, TNativeValue|null>
{
    private     _datasource:                TDatasource;
    private     _columns:                   $JT.ISelectTypeAttributeDropdownColumn[];
    private     _context:                   $JI.SelectInputContext;
    private     _searchtext:                string|string[];
    private     _strippedsearchtext:        string;
    private     _currectfetch:              ICurrentFetch<$JT.TDatasource_Record<TDatasource>>|undefined;
    private     _tbodydata:                 ($JT.TDatasource_Record<TDatasource>|null)[]|undefined;

    constructor(popup: $JPOPUP.DropdownPopup<TNativeValue, $JI.SelectInput<TNativeValue,TDatasource>, $JI.SelectInputContext>, context: $JI.SelectInputContext)
    {
        super(popup);
        const input   = popup._control!;
        const value = (input ? input.value : undefined);
        if (!value) {
            throw new $J.InvalidStateError("Input/value not available.");
        }
        this._datasource  = value.Datasource;
        this._columns     = input.get_opts().dropdown_columns || value.getAttr("dropdown_columns") as $JT.ISelectTypeAttributeDropdownColumn[];
        this._context     = context;
        this._searchtext  = "";
        this._strippedsearchtext = "";
    }

    public      LocalSearch(text:string)
    {
        if (this._currectfetch && this._currectfetch.task.isFulfilled) {
            if (this._datasource.flags & $JT.SelectDatasourceFlags.SearchFetch) {
                return hassearchdata(this._currectfetch.searchtext, this._normalizeSearchText(text));
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
            this.selectRow(undefined);
            this._strippedsearchtext = $JSTRING.removeDiacritics(text.trim()).toUpperCase();
            this._searchtext = this._normalizeSearchText(this._strippedsearchtext);

            if (this._datasource.flags & $JT.SelectDatasourceFlags.SearchFetch) {
                if (this._currectfetch && this._currectfetch.task.isFulfilled && hassearchdata(this._currectfetch.searchtext, this._searchtext)) {
                    this._filltable();
                } else {
                    if (this._currectfetch && this._currectfetch.ct) {
                        this._currectfetch.ct.stop();
                    }

                    this._currectfetch = undefined;

                    let searchtext   = this._datasource.filter_searchtext(this._searchtext);

                    if (searchtext.length > 0 || (this._datasource.flags & $JT.SelectDatasourceFlags.SearchAll) !== 0) {
                        this._fetchdata(searchtext, this.control!.get_opts().fetchmax || 250);
                    } else {
                        this._currectfetch = undefined;
                        this.setMessage($JL.more_input_necessary, true);
                    }
                }
            } else {
                if (this._currectfetch) {
                    if (this._currectfetch.task.isFulfilled) {
                        this._filltable();
                    }
                } else {
                    this._fetchdata(undefined, undefined);
                }
            }
        } catch(err) {
            this._currectfetch = undefined;
            this.setMessage(err, true);
        }
    }
    public      OnRemove()
    {
        if (this._currectfetch && this._currectfetch.ct) {
            this._currectfetch.ct.stop();
        }

        this._currectfetch = undefined;
    }

    protected   clickrow(row:number|undefined, ev:Event|undefined)
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
                    this.Close(v, ev);
                    return;
                }
            }
        }

        if (ev instanceof KeyboardEvent && ev.key === 'Tab' && !(ev.ctrlKey || ev.altKey || ev.metaKey)) {
            this.Close(undefined, ev);
        }
    }
    protected   tableColgroup()
    {
        return this._columns && this._columns.map((f) => {
                                                            const col = <col/>;
                                                            if (f.width) {
                                                                col.css('width', f.width);
                                                            }
                                                            return col;
                                                  });
    }
    protected   setMessage(msg:string|Error, resetfocus?: boolean)
    {
        this._tbodydata        = undefined;
        super.setMessage(msg, resetfocus);
    }
    protected   onKeyDown(ev:KeyboardEvent)
    {
        const input = this.control;
        if (input) {
            if (input.dropdownKeyDown(ev)) {
                return true;
            }

            if (super.onKeyDown(ev)) {
                return true;
            }
        }

        return false;
    }

    private     _fetchdata(searchtext?:string|string[], max?:number)
    {
        const ct   = new $JA.Context({ parent:this._popup.context });
        const task = this._datasource.fetchdataAsync(ct, this._context, searchtext, max) as (/*TS Limit*/ $JA.Task<string|$JT.TDatasource_Record<TDatasource>[]>);
        this._currectfetch = { ct, task, searchtext };

        this.setBusy();

        task.then((data) => {
                        if (this._currectfetch && this._currectfetch.task === task) {
                            this._currectfetch.ct = null;
                            if (this.container) {
                                this.container.removeClass("-busy");

                                try {
                                    if (typeof data === 'string' && data === "TOMANY-RESULTS") {
                                        this._currectfetch = undefined;
                                        this.setMessage($JL.more_input_necessary, true);
                                        return;
                                    }
                                    else if (Array.isArray(data)) {
                                        let opts = this.control!.get_opts();

                                        if (typeof opts.filter === "function") {
                                            data = data.filter(opts.filter);
                                        }

                                        if (typeof opts.sort === "function") {
                                            data = data.sort(opts.sort);
                                        }

                                        this._currectfetch.data = data;
                                    } else {
                                        this._currectfetch.data = null;
                                    }

                                    this._filltable();
                                } catch(err) {
                                    this._currectfetch = undefined;
                                    this.setMessage(err, true);
                                }
                            }
                        }
                    },
                    (err) => {
                        if (this._currectfetch && this._currectfetch.task === task) {
                            this._currectfetch.ct = null;
                            this._currectfetch = undefined;

                            if (this.container) {
                                this.container.removeClass("-busy");
                                this.setMessage(err, true);
                            }
                        }
                    });
    }
    private     _filltable()
    {
        try {
            const input = this.control!;
            const value = input.value!;
            const data  = this._currectfetch && this._currectfetch.data;

            let tb:$JD.DOMHTMLElement[]                             = [];
            let tbdata:($JT.TDatasource_Record<TDatasource>|null)[] = [];

            if (data) {
                if (input.get_opts().simpleDropdown && !value.Required) {
                    tb.push(<tr><td colSpan={this._columns ? this._columns.length : 1}>{ input.get_opts().simpleNulltext || "\xA0" }</td></tr>);
                    tbdata.push(null);
                }

                data.forEach((rec) => {
                                 if ((this._datasource.flags & $JT.SelectDatasourceFlags.StaticEnum && input.get_opts().simpleDropdown && !input.isDirty()) ||  this._datafilter(rec)) {
                                     tb.push(<tr> {
                                                 (this._columns) ? this._columns.map((f) => <td>{ valueText((rec as ({readonly [key:string]:any}))[f.fieldname]) }</td>)
                                                                 : <td>{ value.toDisplayText((rec as ({readonly [key:string]:any}))[this._datasource.keyfieldname] as (TNativeValue|null|undefined), rec) }</td>
                                             } </tr>);
                                     tbdata.push(rec);
                                 }
                             });
            }

            if (tbdata.length === 0) {
                this.setMessage($JL.no_result, true);
                return;
            }

            this.setTBody(tb);
            this._tbodydata = tbdata;

            if (this.hasFocus()) {
                let row:number = 0;

                if (!input.isDirty()) {
                    const keyfieldname = this._datasource.keyfieldname;
                    const v            = value.internalvalue;
                    row = tbdata.findIndex((rec) => (rec !== null ? (rec as ({readonly [key:string]:any}))[keyfieldname] : null) === v);
                }

                this.selectRow(row);
            }
            this.PositionPopup();
        } catch(err) {
            this.setMessage(err, true);
        }
    }
    private     _datafilter(rec:$JT.TDatasource_Record<TDatasource>): boolean
    {
        if (Array.isArray(this._searchtext)) {
            const value = this.control!.value!;

            for(let key of this._strippedsearchtext.split(" ")) {
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

            let p = text.indexOf(key);

            return p === 0 || (p > 0 && text.charAt(p-1) === " ");
        }
    }

    private _normalizeSearchText(text: string): string | string[] {
        const keywords = this._datasource.normalize_searchtext(text);

        if(Array.isArray(keywords)) {
            return keywords.filter((k) => !keywords.some((r) => r.length > k.length && r.startsWith(k)));
        }

        return keywords;
    }

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

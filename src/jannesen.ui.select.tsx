/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $JA      from "jc3/jannesen.async";
import * as $JD      from "jc3/jannesen.dom";
import * as $JT      from "jc3/jannesen.datatype";
import * as $JI      from "jc3/jannesen.input";
import * as $JPOPUP  from "jc3/jannesen.ui.popup";
import * as $JL      from "jc3/jannesen.language";

export class ValuesDropdown<TNativeValue,
                            TValue extends $JT.SimpleType<TNativeValue>,
                            TInput extends $JI.InputTextControl<TNativeValue, TValue, TInput, TOpts, $JI.IDropdownStdData, TNativeValue|null, ValuesDropdown<TNativeValue, TValue, TInput, TOpts>>,
                            TOpts extends $JI.IInputControlDropdownValuesOptions<TNativeValue>>
                        extends $JPOPUP.TableDropdown<TNativeValue, TInput, $JI.IDropdownStdData, TNativeValue|null>
{
    private     _inputelm?:     $JD.DOMHTMLElement;
    private     _valueList?:    $JI.DropdownValues<TNativeValue>[]|null;
    private     _rowValues?:    TNativeValue[];

    public      OnLoad(data:$JI.IDropdownStdData, ct:$JA.Context): $JA.Task<void>|void
    {
        const input = this.control;

        if (input && input.value) {
            this._inputelm = input.getinputelm();

            try {
                const valueList = input.opts.dropdown_values!(ct);

                if (valueList instanceof $JA.Task) {
                    return valueList.then((v) => { this._init(v, data.keydown); })
                                    .catch((e) => {
                                         if (!(e instanceof $JA.OperationCanceledError)) {
                                            this.setMessage(e);
                                         }
                                    });
                 }
                else {
                    this._init(valueList, data.keydown);
                }
            }
            catch (e) {
                this.setMessage(e);
            }
        }
    }
    public      OnRemove()
    {
        if (this._inputelm) {
            this._inputelm.unbind('input', this._fillBody, this);
            this._inputelm = undefined;
        }
    }

    protected   clickrow(row:number|undefined, ev:Event|undefined)
    {
        this.Close((this._rowValues && typeof row === 'number' ? this._rowValues[row] : undefined), ev);
    }

    private     _init(valueList:$JI.DropdownValues<TNativeValue>[]|null|undefined, filter:boolean)
    {
        const input = this.control;
        if (input) {
            this._inputelm = input.getinputelm();
            this._valueList = valueList;
            this._fillBody(filter);
            this._inputelm.bind('input', () => this._fillBody(true), this);
        }
    }
    private     _fillBody(filter:boolean)
    {
        const input = this.control;
        const value = input && input.value;

        if (value && this._valueList && this._inputelm) {
            const values       = [] as TNativeValue[];
            const lines        = [] as string[];
            const searchfilter = filter ? new $JI.SearchFilter(this._inputelm.prop('value'), null) : null;
            const format       = value.getAttr("format");

            for (const v of this._valueList) {
                let xv:TNativeValue;
                let xt:string;

                if (v instanceof Object) {
                    xv = v.value;
                    xt = v.text;
                }
                else {
                    xv = v;
                    xt = value.cnvValueToText(v, format);
                }

                if (!searchfilter || searchfilter.matchText(xt)) {
                    values.push(xv);
                    lines.push(xt);
                }
            }

            this._rowValues = values;
            if (lines.length > 0) {
                this.setTBody(lines.map((l) => <tr><td>{ l }</td></tr>));
                return;
            }
        }

        this.setMessage($JL.no_result, true);
    }
}

export class SelectInputDropdown<TNativeValue extends $JT.SelectValue,
                                 TDatasource extends $JT.SelectDatasource<TNativeValue, $JT.ISelectRecord>>
                extends $JPOPUP.TableDropdown<TNativeValue,
                                             $JI.SelectInput<TNativeValue,TDatasource>,
                                             $JI.SelectDataSet<TNativeValue, TDatasource>,
                                             $JT.TDatasource_Record<TDatasource>|null>
{
    private     _dataset:                   $JI.SelectDataSet<TNativeValue, TDatasource>;
    private     _tbodydata:                 ($JT.TDatasource_Record<TDatasource>|null)[]|undefined;
    private     _currentActionId:           number;

    constructor(popup: $JPOPUP.DropdownPopup<TNativeValue,$JI.SelectInput<TNativeValue,TDatasource>,$JI.SelectDataSet<TNativeValue, TDatasource>,$JT.TDatasource_Record<TDatasource>|null>,
                                             dataset: $JI.SelectDataSet<TNativeValue, TDatasource>)
    {
        super(popup);
        this._dataset = dataset;
        this._currentActionId = 0;
    }

    public      LocalSearch(searchfilter:$JI.SearchFilter)
    {
        return this._dataset.LocalSearch(searchfilter);
    }

    public      Refresh(searchfilter:$JI.SearchFilter)
    {
        try {
            this.selectRow(undefined);
            this._fillcontentTask(this._dataset.Fetch(searchfilter), ++this._currentActionId);
        }
        catch (err) {
            this.setMessage(err, true);
        }
    }
    public      RefrechAll()
    {
        try {
            this._fillcontentTask(this._dataset.FetchAll(), ++this._currentActionId, this._dataset.Value.internalvalue);
        }
        catch (err) {
            this.setMessage(err, true);
        }
    }

    protected   clickrow(row:number|undefined, ev:Event|undefined)
    {
        if (this._tbodydata && row !== undefined) {
            const rec = this._tbodydata[row];
            if (rec !== null) {
                this.Close(rec, ev);
                return;
            }
        }

        if (ev instanceof KeyboardEvent && ev.key === 'Tab' && !(ev.ctrlKey || ev.altKey || ev.metaKey)) {
            this.Close(undefined, ev);
        }
    }
    protected   tableColgroup()
    {
        const columns = this._dataset.Columns;
        return columns && columns.map((f) => {
                                         const col = <col/>;
                                          if (f.width) {
                                              col.css('width', f.width);
                                          }
                                          return col;
                                      });
    }
    protected   setMessage(msg:string|Error, resetfocus?: boolean)
    {
        ++this._currentActionId;
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

    private     _fillcontentTask(datatask:$JA.Task<string|$JT.TDatasource_Record<TDatasource>[]>, actionid:number, rowvalue?:TNativeValue|null)
    {
        datatask.thenD((data) => {
                           if (actionid === this._currentActionId) {
                               this._fillcontent(data, rowvalue);
                           }
                       },
                        (err) => {
                           if (actionid === this._currentActionId) {
                               this.setMessage(err, true);
                           }
                       });
    }
    private     _fillcontent(data:string|$JT.TDatasource_Record<TDatasource>[], rowvalue?:TNativeValue|null)
    {
        try {
            if (Array.isArray(data)) {
                const input        = this.control!;
                const value        = this._dataset.Value;
                const keyfieldname = this._dataset.Datasource.keyfieldname;
                const columns      = this._dataset.Columns;

                const tb:$JD.DOMHTMLElement[]                             = [];
                const tbdata:($JT.TDatasource_Record<TDatasource>|null)[] = [];

                if (input.get_opts().simpleDropdown && !value.Required) {
                    tb.push(<tr><td colSpan={columns ? columns.length : 1}>{ input.get_opts().simpleNulltext || "\xA0" }</td></tr>);
                    tbdata.push(null);
                }

                for(const rec of data) {
                    tb.push(<tr>
                            {
                                (columns) ? columns.map((f) => <td>{ $JI.SelectDataSet.columnText(rec, f.fieldname) }</td>)
                                            : <td>{ value.toDisplayText((rec as ({readonly [key:string]:any}))[keyfieldname] as (TNativeValue|null|undefined), rec) }</td>
                            }
                            </tr>);
                    tbdata.push(rec);
                }

                if (tbdata.length === 0) {
                    this.setMessage($JL.no_result, true);
                    return;
                }

                this.setTBody(tb);
                this._tbodydata = tbdata;

                if (this.hasFocus() || rowvalue !== undefined) {
                    this.selectRow((rowvalue !== undefined) ? tbdata.findIndex((rec) => (rec !== null ? (rec as ({readonly [key:string]:any}))[keyfieldname] : null) === rowvalue) : 0);
                }

                this.PositionPopup();
            }
            else {
                switch (data) {
                case "TOMANY-RESULTS":
                case "NEEDS-MORE-KEYS":
                    data = $JL.more_input_necessary;
                    break;
                }

                this.setMessage(data, true);
            }
        } catch(err) {
            this.setMessage(err, true);
        }
    }
}

/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J          from "jc3/jannesen";
import * as $JA         from "jc3/jannesen.async";
import * as $JD         from "jc3/jannesen.dom";
import * as $JT         from "jc3/jannesen.datatype";
import * as $JL         from "jc3/jannesen.language";
import * as $JCONTENT   from "jc3/jannesen.ui.content";
import * as $JPOPUP     from "jc3/jannesen.ui.popup";
import * as $JTAB       from "jc3/jannesen.ui.tab";
import * as $JMENU      from "jc3/jannesen.ui.menu";
import * as $JDATATABLE from "jc3/jannesen.ui.datatable";

function normalizeArgs(args:$J.IUrlArgsColl|$JT.Record<$JT.IFieldDef>|null|void):$J.IUrlArgsColl;
function normalizeArgs(args:$J.IUrlArgsColl|$JCONTENT.IUrlArgsSet|$JT.Record<$JT.IFieldDef>|null|void):$J.IUrlArgsColl|$JCONTENT.IUrlArgsSet;
function normalizeArgs(args:$J.IUrlArgsColl|$JCONTENT.IUrlArgsSet|$JT.Record<$JT.IFieldDef>|null|void):$J.IUrlArgsColl|$JCONTENT.IUrlArgsSet {
    if (args === null || args === undefined) {
        return {};
    }

    if (args instanceof $JT.Record) {
        let rtn:$J.IUrlArgsColl = {};

        for (const n of args.FieldNames) {
            const f = args.field(n);
            if (!$J.isIUrlValue(f)) {
                throw new $J.InvalidStateError("Can't convert record to IUrlArgsColl, invalid field '" + n + "'.");
            }
            rtn[n] = f;
        }

        return rtn;
    }

    return args;
}

//-------------------------------------------------------------------------------------------------
export var hasPermission:(o:string|$JA.IAjaxCallDefinition<any,any,any>|(new(context:$JA.Context)=>BaseForm<any,any>)|(new()=>StandardDialog<any,any>), method?:string) => boolean = (cls) => true;

export function setHasPermission(f: (o:string|$JA.IAjaxCallDefinition<any,any,any>|(new(context:$JA.Context)=>BaseForm<any,any>)|(new()=>StandardDialog<any,any>), method?:string) => boolean)
{
    hasPermission = f;
}

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export class UrlArgSet implements $JCONTENT.IUrlArgsSet
{
    private         _set:           $J.IUrlArgsColl[];
    private         _curr:          number;

    public          constructor(set:$J.IUrlArgsColl[], curr:number)
    {
        this._set  = set;
        this._curr = curr;
    }

    public static   RecordsetMap<T extends $JT.Record<$JT.IFieldDef>>(recordset: $JT.Set<T>|T[], currecord: T, mapper:(c:T)=>$J.IUrlArgsColl)
    {
        let set:$J.IUrlArgsColl[]  = [];
        let curr:number|null       = null;

        recordset.forEach((rec) => {
                                const r = mapper(rec);
                                if (r instanceof Object) {
                                    if (rec === currecord) {
                                        curr = set.length;
                                    }
                                    set.push(r);
                                }
                          });

        if (curr === null) {
            throw new $J.InvalidStateError("Can't find record in set.");
        }

        return new UrlArgSet(set, curr);
    }

    public          hasPrev()
    {
        return this._curr > 0;
    }
    public          hasNext()
    {
        return this._curr < this._set.length - 1;
    }
    public          prev()
    {
        if (this._curr > 0) {
            return new UrlArgSet(this._set, this._curr - 1);
        }

        return null;
    }
    public          next()
    {
        if (this._curr < this._set.length - 1) {
            return new UrlArgSet(this._set, this._curr + 1);
        }

        return null;
    }
    public          args()
    {
        return this._set[this._curr];
    }
}

//-------------------------------------------------------------------------------------------------
/**
 *!!DOC
 */
export abstract class BaseForm<TCall extends $JA.IAjaxCallDefinition<$JT.Record<$JT.IFieldDef>|void,void,$JT.Record<$JT.IFieldDef>|$JT.RecordSet<$JT.IFieldDef>>, TState> extends $JCONTENT.Form<$J.IUrlArgsColl, TState>
{
    protected               _formargs:              $JA.AjaxCallArgsType<TCall>;
    private                 _datapopup?:            DataPopup|null;

    protected get           interfaceGet():         TCall          { throw new $J.InvalidStateError("interfaceGet not implemented."); }
    protected get           formargs() {
        return this._formargs;
    }

    public                  constructor(context:$JA.Context)
    {
        super(context);

        let queryargs_type = this.interfaceGet.callargs_type;
        this._formargs   = (queryargs_type) ? new queryargs_type() : null as any;
    }

    public                  refresh()
    {
        const loader = this.loader;
        if (loader) {
            let state = this._formstate;
            if (state) {
                state.state = undefined;
            }

            let args = normalizeArgs(this._formargs);

            this.showDataPopup();
            loader.open(this.contentNameClass, args, state, undefined, true);
        }
    }

    public                  showDataPopup(): void;
    public                  showDataPopup(title:string, content:$JD.AddNode, contentClass?:string): void;
    public                  showDataPopup(title?:string, content?:$JD.AddNode, contentClass?:string): void
    {
        this._removeDataPopup();

        if (content) {
            this._datapopup = new DataPopup(this.content.parent!, this.context, title!, content, contentClass, () => { this._removeDataPopup(); } );
        }
    }

    protected               onshow(display:boolean)
    {
        if (!display) {
            this._removeDataPopup();
        }
    }
    protected               executeDialog<TArgs>(form:(new (context:$JA.Context)=>$JCONTENT.DialogBase<TArgs, string>) | string, args:TArgs)
    {
        return this.execute((context) => $JCONTENT.dialogShow(form, args, context));
    }

    protected               executeDialogAndRefresh<TArgs>(form:(new (context:$JA.Context)=>$JCONTENT.DialogBase<TArgs, string|null>) | string, args:TArgs)
    {
        this.execute((context) => $JCONTENT.dialogShow(form, args, context)
                                           .then((rtn) => { if (rtn==="OK" || rtn==="DELETE") this.refresh(); }));
    }
    protected               openform(formName:string, args:$J.IUrlArgsColl|$JCONTENT.IUrlArgsSet|$JT.Record<$JT.IFieldDef>|null|void, historyReplace?:boolean)
    {
        return super.openform(formName, normalizeArgs(args), historyReplace);
    }

    private                 _removeDataPopup()
    {
        if (this._datapopup) {
            this.unbind("hide", this._removeDataPopup, this);
            this._datapopup.Stop();
            this._datapopup = null;
        }
    }
}

//-------------------------------------------------------------------------------------------------
/**
 *!!DOC
 */
export abstract class SimpleForm<TCall extends $JA.IAjaxCallDefinition<$JT.Record<$JT.IFieldDef>|void,void,$JT.Record<$JT.IFieldDef>|$JT.RecordSet<$JT.IFieldDef>>> extends BaseForm<TCall, void>
{
    private                 _resultdata:            $JA.AjaxCallResponseType<TCall>|undefined;

    protected get           resultdata() {
        if (this._resultdata === undefined) {
            throw new $J.InvalidStateError("resultdata not defined.");
        }
        return this._resultdata;
    }
    protected get           contentClass() {
        return "jannesen-ui-template-simpleform";
    }

    public                  constructor(context:$JA.Context)
    {
        super(context);
        this._resultdata = undefined;
    }

    protected               onopen(args:$J.IUrlArgsColl, state:void, ct:$JA.Context):$JA.Task<void>|void
    {
        this.showDataPopup();
        let callargs:$JT.Record<$JT.IFieldDef>|undefined;

        const formargs = this._formargs;
        if (formargs instanceof $JT.Record) {
            formargs.parseUrlArgs(args);
            callargs = formargs.clone();
        }

        return $JA.Ajax(this.interfaceGet, { callargs: callargs }, ct)
                  .then((resultdata) => this.dataReceived(this._resultdata = resultdata));
    }

    protected abstract      dataReceived(data:$JA.AjaxCallResponseType<TCall>):$JA.Task<void>|void;

    public                  gotoNextInSet()
    {
        if (this._formstate && this._formstate.argset) {
            let next = this._formstate.argset.next();
            if (next) {
                this.openform(".", next, true);
                return true;
            }
        }

        return false;
    }
}

//-------------------------------------------------------------------------------------------------
/**
 *!!DOC
 */
export interface ITabAttr extends $JTAB.ITabAttr
{
    form?:      new (context:$JA.Context) => BaseForm<any, any>;
}

export abstract class SimpleTabForm<TCall extends $JA.IAjaxCallDefinition<any,void,any>> extends SimpleForm<TCall> implements $JCONTENT.IMoreMenu
{
    private     _tabs: $JTAB.Tabs|undefined;

    protected get           scrollBoxStyle() {
        return "overflow:hidden";
    }

    public                  constructor(context:$JA.Context) {
        super(context);
        this._tabs = undefined;
    }

    public                  moreMenuEnabled() {
        const tab = this._tabs && this._tabs.activeTab;
        return tab ? tab.moreMenuEnabled() : false;
    }
    public                  moreMenuDatasource(ct:$JA.Context):$JMENU.DataSourceResult {
        const tab = this._tabs && this._tabs.activeTab;
        return tab ? tab.moreMenuDatasource(ct) : [];
    }
    public                  onresize(size: $JD.ISize) {
        if (this._tabs) {
            this._tabs.setSize(size);
        }
    }
    protected               dataReceived(data: $JA.AjaxCallResponseType<TCall>): void|$JA.Task<void> {
        const tabs = <$JTAB.Tabs context={ this.context }>
                     {
                        this.createTab(data).map((tab) => {
                                                    if (tab) {
                                                        if (tab instanceof $JTAB.Tab) {
                                                            return tab;
                                                        }
                                                        else if (tab.title) {
                                                            if (tab.form) {
                                                                if (!(tab.disabled = !hasPermission(tab.form!))) {
                                                                    tab.loadform=(loader) => loader.open(tab!.form!, this.args);
                                                                }
                                                            }
                                                            return new $JTAB.Tab(tab);
                                                        }
                                                    }
                                                })
                     }
                     </$JTAB.Tabs>;

        (tabs.context.values as $JCONTENT.IContextFormHost).formchanged = (reason, form) => {
                                                                              const activeTab = tabs.selectedTab;
                                                                              if (activeTab) {
                                                                                  if (this.loader && activeTab.tabContent instanceof $JCONTENT.FormLoader && activeTab.tabContent.contentBody === form) {
                                                                                      const formchanged = (this.context.values as $JCONTENT.IContextFormHost).formchanged;
                                                                                      if (formchanged) {
                                                                                          formchanged(reason, form);
                                                                                      }
                                                                                  }
                                                                              }
                                                                          };

        this.setContent(this._tabs = tabs);

        let rtn:void|$JA.Task<void>;

        if (typeof this.args._tab === 'string') {
            rtn = tabs.selectTab(this.args._tab);
        }

        tabs.bind('selected',  this._onTabSelected, this);
        tabs.bind('visible',   this._onTabVisable, this);

        if (!tabs.selectedTab) {
            rtn = tabs.selectTab(0);
        }

        return rtn;
    }

    protected abstract      createTab(data: $JA.AjaxCallResponseType<TCall>): (ITabAttr|$JTAB.Tab|null)[];

    private                 _onTabSelected(tab:$JTAB.Tab) {
        this.args['_tab'] = tab && tab.name;
        this.historyChangeArgs(this.args, true);
    }
    private                 _onTabVisable(tab:$JTAB.Tab) {
        this.formChanged($JCONTENT.FormChangedReason.TabChanged);
    }
}

//-------------------------------------------------------------------------------------------------
/**
 *!!DOC
 */
export abstract class QueryForm<TCall extends $JA.IAjaxCallDefinition<$JT.Record<$JT.IFieldDef>|void,void,$JT.RecordSet<$JT.IFieldDef>>> extends BaseForm<TCall, ISearchFormState<TCall>>
{
    protected get           interfaceGet():         TCall   { throw new $J.InvalidStateError("interfaceGet not implemented."); }
    public    get           canReOpen():boolean     { return true;                             }

    public                  constructor(context:$JA.Context)
    {
        super(context);

        let queryargs_type = this.interfaceGet.callargs_type;
        this._formargs = (queryargs_type) ? new queryargs_type() : null as any;
    }

    protected               onExecuteQuery()
    {
        this.showDataPopup();
        this.execute((context) => (this._formargs instanceof $JT.Record ? this._formargs.validateAsync({ context:context }) : $JA.Task.resolve($JT.ValidateResult.OK))
                                       .then(() => {
                                                 const r = this.validateQuery();
                                                 if (r instanceof Error) throw r;
                                                 return r;
                                             })
                     )
            .then((f) => {
                      if (f === $JT.ValidateResult.OK) {
                          return this.openform('~'+this.contentNameClass, this._formargs, true);
                      }
                  });
    }
    protected               errorToContent(err:Error)
    {
        return $JCONTENT.errorToContent(err);
    }

    protected               validateQuery(): $JT.ValidateResult|$JT.ValidateErrors
    {
        return $JT.ValidateResult.OK;
    }
}

//-------------------------------------------------------------------------------------------------
/**
 *!!DOC
 */
export interface ISearchFormState<TCall extends $JA.IAjaxCallDefinition<$JT.Record<$JT.IFieldDef>|void,void,$JT.RecordSet<$JT.IFieldDef>>>
{
    callargs:       $JA.AjaxCallRequestType<TCall>|null;
    resultdata:     $JA.AjaxCallResponseType<TCall>;
    datatablestate: $JDATATABLE.IDataTableState|undefined;
}
/**
 *!!DOC
 */
interface ISearchFormResult<TCall extends $JA.IAjaxCallDefinition<$JT.Record<$JT.IFieldDef>|void,void,$JT.RecordSet<$JT.IFieldDef>>>
{
    callargs:       $JA.AjaxCallRequestType<TCall>|null;
    container:      $JD.DOMHTMLElement;
    resultdata?:    $JA.AjaxCallResponseType<TCall>;
    datatable?:     $JDATATABLE.DataTable<$JT.RecordOfSet<$JA.AjaxCallResponseType<TCall>>>;
}
/**
 *!!DOC
 */
export type SearchFormDataTableOpts<TCall extends $JA.IAjaxCallDefinition<any,void,$JT.RecordSet<$JT.IFieldDef>>> = $JDATATABLE.IDataTableOpts<$JT.RecordOfSet<$JA.AjaxCallResponseType<TCall>>>;
/**
 *!!DOC
 */
export abstract class SearchForm<TCall extends $JA.IAjaxCallDefinition<$JT.Record<$JT.IFieldDef>|void,void,$JT.RecordSet<$JT.IFieldDef>>> extends QueryForm<TCall>
{
    private                 _hasquery:              boolean;
    private                 _result:                ISearchFormResult<TCall>|undefined;

    protected get           contentClass()          { return "jannesen-ui-template-queryform -searchform"; }
    protected get           resultdata()            { return this._result ? this._result.resultdata : undefined; }

    public                  constructor(context:$JA.Context)
    {
        super(context);

        this._result   = undefined;
        this._hasquery = false;
    }

    protected               onload(ct:$JA.Context):void
    {
        const formargs = this._formargs as any;
        if (formargs instanceof $JT.Record) {
            const queryform = this.queryform(this._formargs);
            if (queryform) {
                const elmqueryform = <div class="-query">
                                        <div class="-form">{ queryform }</div>
                                        <div class="-buttons"> { this.searchButtonEnabled() ? <button class="btn btn-search" onclick={() => this.onExecuteQuery() }>{ $JL.querysearch }</button> : null} { this.extbuttons() }</div>
                                     </div>;
                elmqueryform.bind("keypress", (ev) => { if ((ev.key === "Enter" || ev.key === "NumpadEnter") && !(ev.altKey || ev.shiftKey || ev.metaKey || ev.ctrlKey)) { this.onExecuteQuery(); } });
                formargs.FieldNames.forEach((n) => {
                                                let fld = formargs.field(n);
                                                fld.bind("changed", () => {
                                                                            if (this._result) {
                                                                                this._result.container.addClass("-querychanged");
                                                                            }
                                                                    });
                                            });
                this.setContent(elmqueryform, true);
                this._hasquery = true;
            }
        }
    }
    protected               onopen(args:$J.IUrlArgs, state:ISearchFormState<any>|null|undefined, ct:$JA.Context):$JA.Task<void>|void
    {
        this.showDataPopup();
        if (state) {
            if (this._formargs as unknown instanceof $JT.Record) {
                (this._formargs as $JT.Record<$JT.IFieldDef>).parseUrlArgs(state.callargs);
            }

            this.clearResult();
            const datatable = new $JDATATABLE.DataTable<$JT.RecordOfSet<$JA.AjaxCallResponseType<TCall>>>(state.resultdata, this.dataTableOpts());
            const container = <div class="-result">
                                    { datatable }
                              </div>;
            datatable.state = state.datatablestate;

            this._result = {
                                callargs:       state.callargs,
                                resultdata:     state.resultdata,
                                container,
                                datatable
                            };
            this.content.appendChild(container);
            this.onresize(this.formSize);
        } else {
            let callargs: $JA.AjaxCallRequestType<TCall>|null = null;
            const formargs = this._formargs;

            if (formargs instanceof $JT.Record) {
                formargs.parseUrlArgs(args);

                if (this._hasquery) {
                    if (!args || Object.getOwnPropertyNames(args).length === 0) {
                        this.initArgs(formargs);
                        return ;
                    }

                    if (formargs.FieldNames.findIndex((n) => args.hasOwnProperty(n)) < 0) {
                        return ;
                    }
                }

                if (!(formargs.validateNow({ seterror:false }) === $JT.ValidateResult.OK && this.validateQuery() === $JT.ValidateResult.OK)) {
                    return;
                }

                callargs = formargs.clone() as any/* ANY typescript limitation*/;
            }

            return $JA.Ajax(this.interfaceGet, { callargs: callargs }, ct)
                      .then((resultdata) => {
                                this.clearResult();
                                const datatable = new $JDATATABLE.DataTable<$JT.RecordOfSet<$JA.AjaxCallResponseType<TCall>>>(resultdata as any/*ANY typescript limitation*/, this.dataTableOpts());
                                const container = <div class="-result">
                                                      { datatable }
                                                  </div>;

                                this._result = { callargs, resultdata, container, datatable };
                                this.content.appendChild(container);
                                this.onresize(this.formSize);
                            },
                            (err) => {
                                this.clearResult();
                                const container = <div class="-result -error">
                                                      { this.errorToContent(err) }
                                                  </div>;
                                this._result = { callargs, container };
                                this.content.appendChild(container);
                            });
        }
    }
    protected               onresize(size:$JD.ISize|undefined)
    {
        if (size && this._result && this._result.datatable && this._result.datatable.container.isVisible) {
            this._result.datatable.setHeight(size.height - this._result.container.position.top);
        }
    }

    public                  focus()
    {
        try {
            const result = this._result;

            if (result && result.datatable) {
                if (result.resultdata && result.resultdata.count > 0) {
                    result.datatable.focus();
                    return;
                }
            }

            if (!this._content.contains($global.document.activeElement)) {
                this.focusFirstInput();
            }
        } catch (e) {
            console.error(e);
        }
    }

    public                  savestate():ISearchFormState<TCall>|null
    {
        const result = this._result;
        return  (result && result.resultdata && result.datatable)
                ? {
                      callargs:       result.callargs,
                      resultdata:     result.resultdata,
                      datatablestate: result.datatable.state
                  }
                : null;
    }

    protected               searchButtonEnabled() :boolean {
        return true;
    }
    protected               queryform(args:$JA.AjaxCallArgsType<TCall>):$JD.AddNode
    {
        return undefined;
    }
    protected               extbuttons(): $JD.AddNode
    {
        return null;
    }
    protected               initArgs(args: $JA.AjaxCallArgsType<TCall>) {
    }
    protected abstract      dataTableOpts(): $JDATATABLE.IDataTableOpts<$JT.RecordOfSet<$JA.AjaxCallResponseType<TCall>>>;
    protected               createUrlArgSet(rec:$JT.RecordOfSet<$JA.AjaxCallResponseType<TCall>>, callback:(r:$JT.RecordOfSet<$JA.AjaxCallResponseType<TCall>>) => $J.IUrlArgsColl)
    {
        const resultdata = this._result && this._result.datatable && this._result.datatable.records;
        if (!resultdata) {
            throw new $J.InvalidStateError("Invalid state, not recordset.");
        }
        return UrlArgSet.RecordsetMap<$JT.RecordOfSet<$JA.AjaxCallResponseType<TCall>>>(resultdata as any/*!!ANY typescript limitation*/, rec, callback);
    }

    protected               clearResult()
    {
        if (this._result) {
            this.content.removeChild(this._result.container);
            this._result     = undefined;
        }
    }
}

//-------------------------------------------------------------------------------------------------
/**
 *!!DOC
 */
export abstract class ReportForm<TCall extends $JA.IAjaxCallDefinition<$JT.Record<$JT.IFieldDef>|void,void,$JT.RecordSet<$JT.IFieldDef>>> extends QueryForm<TCall>
{
    private                 _resultdata:            $JA.AjaxCallResponseType<TCall>|undefined;
    private                 _resultcontainer:       $JD.DOMHTMLElement|undefined;

    protected get           contentClass()          { return "jannesen-ui-template-queryform -reportform"; }
    protected get           resultdata()            { return this._resultdata; }

    public                  constructor(context:$JA.Context)
    {
        super(context);
        this._resultdata      = undefined;
        this._resultcontainer = undefined;
    }

    protected               onload(ct:$JA.Context):void
    {
        if (this._formargs as unknown instanceof $JT.Record) {
            const formargs = this._formargs as $JT.Record<$JT.IFieldDef>;
            const elmqueryform = <div class="-query">
                                    <div class="-form">{ this.queryform(this._formargs) }</div>
                                    <div class="-buttons"><button class="btn btn-execute" onclick={() => this.onExecuteQuery() }>{ $JL.queryexecute }</button></div>
                                 </div>;
            elmqueryform.bind("keypress", (ev) => { if (ev.key === "Enter" || ev.key === "NumpadEnter") { this.onExecuteQuery(); } });
            formargs.FieldNames.forEach((n) => {
                                            let fld = formargs.field(n);
                                            fld.bind("changed", () => {
                                                                        if (this._resultcontainer) {
                                                                            this._resultcontainer.addClass("-querychanged");
                                                                        }
                                                                });
                                        });
            this.setContent(elmqueryform, true);
        }
    }
    protected               onopen(args:$J.IUrlArgs, state:any|null|undefined, ct:$JA.Context):$JA.Task<void>|void
    {
        this.showDataPopup();

        let callargs: $JT.Record<$JT.IFieldDef>|null = null;
        const formargs = this._formargs;

        if (formargs instanceof $JT.Record) {
            formargs.parseUrlArgs(args);

            if (!args || formargs.FieldNames.findIndex((n) => args.hasOwnProperty(n)) < 0) {
                return;
            }

            if (!(formargs.validateNow({ seterror:false }) === $JT.ValidateResult.OK && this.validateQuery() === $JT.ValidateResult.OK)) {
                return;
            }

            callargs = formargs.clone();
        }

        return $JA.Ajax(this.interfaceGet, { callargs: callargs }, ct)
                    .then((resultdata) => {
                            this._setResult(resultdata, <div class="-result">
                                                            { this.resultbuilder(resultdata) }
                                                        </div>);
                        },
                        (err) => {
                            this._setResult(undefined, <div class="-result -error">
                                                            { this.errorToContent(err) }
                                                       </div>);
                        });
    }

    protected               queryform(args:$JA.AjaxCallArgsType<TCall>):$JD.AddNode
    {
        return undefined;
    }
    protected   abstract    resultbuilder(data:$JA.AjaxCallResponseType<TCall>):$JD.AddNode;

    private                 _setResult(data:$JA.AjaxCallResponseType<TCall>|undefined, container:$JD.DOMHTMLElement)
    {
        if (this._resultcontainer) {
            this.content.removeChild(this._resultcontainer);
            this._resultcontainer = undefined;
        }

        if (container) {
            this.content.appendChild(this._resultcontainer = container);
        }

        this._resultdata      = data;
    }
}

//-------------------------------------------------------------------------------------------------
/**
 *!!DOC
 */
export const enum StandardDialogMode
{
    Post    = 0,
    Create,
    Edit,
}
export interface IStandardDialogCallData
{
    dlgmode?:               StandardDialogMode;
    callargs?:              $JT.Record<$JT.IFieldDef> | $JT.IRecord | $J.IUrlArgs ;
    callargsext?:           $JT.IRecord;
    data?:                  $JT.Record<$JT.IFieldDef> | $JT.IRecord | $JT.RecordSet<$JT.IFieldDef>;
    dataext?:               $JT.IRecord;
    [key: string]:          any;
}
/**
 *!!DOC
 */
export abstract class StandardDialog<TCall extends $JA.IAjaxCallDefinition<any,void,any>, TArgs extends IStandardDialogCallData=IStandardDialogCallData, TRtn=string> extends $JCONTENT.DialogBase<TArgs,TRtn|string|null>
{
    protected               callargs:           $JA.AjaxCallArgsType<TCall>;
    protected               data:               $JA.AjaxCallRequestType<TCall>;

    protected get           interfaceSave():    TCall
    {
        throw new $J.InvalidStateError("interfaceSave not implemented.");
    }
    protected get           interfaceDelete():  $JA.IAjaxCallDefinition<$JA.AjaxCallArgsType<TCall>, void|$JA.AjaxCallRequestType<TCall>, $JA.AjaxCallResponseType<TCall>>|undefined
    {
        return undefined;
    }
    protected get           dlgmode()           { return this.args.dlgmode || StandardDialogMode.Post; }
    protected get           contentClass()      { return "jannesen-ui-template-standard-dialog"; }

    public                  constructor(context:$JA.Context)
    {
        super(context);
        let interfaceSave = this.interfaceSave;
        this.callargs = (interfaceSave.callargs_type) ? (new interfaceSave.callargs_type()) : undefined;
        this.data     = (interfaceSave.request_type)  ? (new interfaceSave.request_type()) as any : undefined;
    }

    protected               onload()
    {
    }
    protected               onopen(args: TArgs, ct: $JA.Context)
    {
        this.copyData(true, this.args, this.callargs, this.data);

        let title   = this.formTitle();
        let body    = this.formBody  (this.callargs, this.data);
        let footer  = this.formFooter();


        this.content.appendChild(<div class="-header -dialog-move-target"><span class="-title">{ title }</span></div>,
                                 <div class="-body"                      >{ body   }</div>,
                                 <div class="-footer"                    >{ footer }</div>);
    }

    protected               copyData(onopen:boolean, dlgargs:IStandardDialogCallData, callargs:$JA.AjaxCallArgsType<TCall>|undefined, data:$JA.AjaxCallRequestType<TCall>|void)
    {
        const _dlgargs  = dlgargs;
        const _callargs = callargs as any;
        const _data     = data     as any;
        let   initdata  = true;

        if (_dlgargs instanceof Object) {
            if (_callargs instanceof $JT.Record) {
                if (_dlgargs.callargs instanceof Object) {
                    _callargs.assign(_dlgargs.callargs);
                }
                if (_dlgargs.callargsext instanceof Object && _callargs instanceof $JT.Record) {
                    for (const name in _dlgargs.callargsext) {
                        if (_dlgargs.callargsext.hasOwnProperty(name)) {
                            _callargs.field(name).assign(_dlgargs.callargsext[name]);
                        }
                    }
                }
            }

            if (_data instanceof $JT.Record || _data instanceof $JT.Set) {
                if (_dlgargs.data instanceof Object) {
                    _data.assign(_dlgargs.data);
                    initdata = false;
                }
                if (_dlgargs.dataext instanceof Object && _data instanceof $JT.Record) {
                    for (const name in _dlgargs.dataext) {
                        if (_dlgargs.dataext.hasOwnProperty(name)) {
                            _data.field(name).assign(_dlgargs.dataext[name]);
                        }
                    }
                    initdata = false;
                }
            }
        }

        if (onopen && initdata) {
            if (_data instanceof $JT.Record || _data instanceof $JT.Set) {
                _data.setDefault();
            }
        }

        if (onopen && (initdata || this.dlgmode === StandardDialogMode.Create)) {
            this.initNewData(_data as $JA.AjaxCallRequestType<TCall>);
        }
    }
    protected               initNewData(data:$JA.AjaxCallRequestType<TCall>)
    {
    }
    protected abstract      formTitle(): string;
    protected abstract      formBody(callargs:$JA.AjaxCallArgsType<TCall>, data:$JA.AjaxCallRequestType<TCall>): $JD.AddNode;
    protected               formFooter()
    {
        let btns =  <div class="-buttons"/>;

        if (this._allowDelete() && this.allowDelete()) {
            btns.appendChild(<button class={ $JCONTENT.std_button_remove.class } onclick={() => this.cmdDelete() }>{ $JCONTENT.std_button_remove.text }</button>);
        }

        btns.appendChild(<button class={ $JCONTENT.std_button_cancel.class } onclick={() => this.cmdCancel() }>{ $JCONTENT.std_button_cancel.text }</button>);
        btns.appendChild(<button class={ $JCONTENT.std_button_save.class   } onclick={() => this.cmdSave()   }>{ $JCONTENT.std_button_save.text   }</button>);

        return btns;
    }
    protected               validateAsync(context:$JA.Context): $JA.Task<$JT.ValidateResult>
    {
        return $JT.validateAsync({ context }, (this.data as unknown instanceof $JT.BaseType) ? (this.data as unknown as $JT.BaseType) : undefined, this);
    }
    public                  validateNow():$JT.ValidateResult|Error
    {
        return $JT.ValidateResult.OK;
    }
    protected               cmdCancel()
    {
        this.closeForm(new $JA.OperationCanceledError("Cancelled by user."));
    }
    protected               cmdSave()
    {
        this.execute((context) => this.onSave(context))
            .then((r) => this.closeForm(r));
    }
    protected               cmdDelete()
    {
        this.execute((context) => $JCONTENT.DialogConfirm.show($JL.deletemessage_title, $JL.deletemessage_message, context)
                                                         .then(() => this.onDelete(context)))
            .then((r) => this.closeForm(r));
    }
    protected               allowDelete()
    {
        return true;
    }
    protected               onDelete(context:$JA.Context): $JA.Task<TRtn|string>
    {
        const intfDel = this.interfaceDelete;

        if (intfDel) {
            if (this.allowDelete && intfDel && intfDel.callargs_type) {
                let opts = {
                    callargs:   new intfDel.callargs_type(),
                    data:       intfDel.request_type ? new intfDel.request_type() : undefined
                };

                this.copyData(false, this.args, opts.callargs, opts.data);

                return $JA.Ajax(intfDel, opts, context)
                          .then(() => this.onDeleted());
            }
        }
        else if (this.dlgmode === StandardDialogMode.Edit) {
            const intfSave = this.interfaceSave;
            if (intfSave && intfSave.methods && intfSave.methods.includes('DELETE')) {
                if (this.allowDelete && intfSave && intfSave.callargs_type) {
                    return $JA.Ajax(intfSave, {
                                        method:     'DELETE',
                                        callargs:   this.callargs,
                                    } , context)
                              .then(() => this.onDeleted());
                }
            }
        }

        throw new $J.InvalidStateError("Delete not allowed.");
    }
    protected               onDeleted(): TRtn|string
    {
        return "DELETE";
    }
    protected               onSave(context:$JA.Context): $JA.Task<TRtn|string|null>
    {
        const dlgmode = this.dlgmode;

        return this.validateAsync(context)
                   .then(() => {
                             let opts = {
                                             callargs: this.callargs,
                                             data:     this.data
                                        } as $JA.IAjaxArgs;

                             switch (dlgmode) {
                             case StandardDialogMode.Create:     opts.method = 'POST';       break;
                             case StandardDialogMode.Edit:       opts.method = 'PUT';        break;
                             }
                             return $JA.Ajax(this.interfaceSave, opts, context)
                                       .then((r) => this.onSaved(r));
                         });
    }
    protected               onSaved(r:$JA.AjaxCallResponseType<TCall>): TRtn|string|null
    {
        return "OK";
    }

    public                  body_onkeydown(ev: KeyboardEvent) {
        if (ev.key === 'Escape' && !ev.altKey && !ev.ctrlKey && !ev.shiftKey && !ev.metaKey) {
            ev.stopPropagation();
            this.cmdCancel();
        }
        if (ev.key === 'Enter' && !ev.altKey && !ev.ctrlKey && ev.shiftKey && !ev.metaKey) {
            ev.stopPropagation();
            this.cmdSave();
        }
    }

    private                 _allowDelete()
    {
        let intf = this.interfaceDelete;
        if (intf) {
            return hasPermission(intf);
        }

        if (this.dlgmode === StandardDialogMode.Edit) {
            intf = this.interfaceSave;
            if (intf.methods && intf.methods.includes('DELETE')) {
                return this.dlgmode === StandardDialogMode.Edit && hasPermission(intf, 'DELETE');
            }
        }

        return false;
    }
}

/**
 *!!DOC
 */
export abstract class SubmitDialog<TArgs, TRtn=void> extends $JCONTENT.DialogBase<TArgs,TRtn>
{
    protected get           contentClass()      { return "jannesen-ui-template-standard-dialog"; }

    public                  constructor(context:$JA.Context)
    {
        super(context);
    }

    protected               onload()
    {
    }
    protected               onopen(args: TArgs, ct: $JA.Context)
    {
        const t = this.initData(this.args, ct);

        if (t) {
            return t.then(() => this._createcontent());
        }
        else {
            this._createcontent();
        }
    }

    protected               initData(dlgargs:TArgs, ct: $JA.Context): $JA.Task<unknown>|void
    {
    }
    protected abstract      formTitle(): $JD.AddNode;
    protected abstract      formBody(): $JD.AddNode;
    protected               formFooter()
    {
        const btnCancel = <button class={ $JCONTENT.std_button_cancel.class }>{ $JCONTENT.std_button_cancel.text }</button>;
        btnCancel.bind('click', this.cmdCancel, this);
        const btnSubmit = <button class={ $JCONTENT.std_button_submit.class   }>{ $JCONTENT.std_button_submit.text   }</button>;
        btnSubmit.bind('click', this.cmdSubmit, this);

        return  <div class="-buttons">
                    { this.formFooterExtButtons() }
                    { btnCancel }
                    { btnSubmit   }
                </div>;
    }
    protected               formFooterExtButtons(): $JD.DOMHTMLElement[]|undefined
    {
        return undefined;
    }
    protected               cmdCancel()
    {
        this.closeForm(new $JA.OperationCanceledError("Cancelled by user."));
    }
    protected               cmdSubmit()
    {
        this.execute((context) => this.onSubmit(context))
            .then((r) => this.closeForm(r));
    }
    protected abstract      onSubmit(context:$JA.Context): $JA.Task<TRtn>;

    public                  body_onkeydown(ev: KeyboardEvent) {
        if (ev.key === 'Escape' && !ev.altKey && !ev.ctrlKey && !ev.shiftKey && !ev.metaKey) {
            ev.stopPropagation();
            this.cmdCancel();
        }
        if (ev.key === 'Enter' && !ev.altKey && !ev.ctrlKey && ev.shiftKey && !ev.metaKey) {
            ev.stopPropagation();
            this.cmdSubmit();
        }
    }

    private                 _createcontent()
    {
        let title   = this.formTitle();
        let body    = this.formBody();
        let footer  = this.formFooter();

        this.content.appendChild(<div class="-header -dialog-move-target"><span class="-title">{ title }</span></div>,
                                 <div class="-body"                      >{ body   }</div>,
                                 <div class="-footer"                    >{ footer }</div>);
    }
}

/**
 *!!DOC
 */
export interface SubmitDialogAjaxCallArgs<TCall extends $JA.IAjaxCallDefinition<any,any,any>>
{
    callargs?:  $JT.AssignType<$JA.AjaxCallArgsType<TCall>>;
    data?:      $JT.AssignType<$JA.AjaxCallRequestType<TCall>>;
}

/**
 *!!DOC
 */
export abstract class SubmitDialogAjaxCall<TCall extends $JA.IAjaxCallDefinition<any,any,any>, TArgs = SubmitDialogAjaxCallArgs<TCall>, TRtn=$JA.AjaxCallResponseType<TCall>> extends SubmitDialog<TArgs,TRtn> implements $JT.IValidatable
{
    protected               callargs:           $JA.AjaxCallArgsType<TCall>;
    protected               data:               $JA.AjaxCallRequestType<TCall>;

    protected get           interface():        TCall
    {
        throw new $J.InvalidStateError("Interface not defined.");
    }

    public                  constructor(context:$JA.Context)
    {
        super(context);
        let interfaceSave = this.interface;
        this.callargs = (interfaceSave.callargs_type) ? (new interfaceSave.callargs_type()) : undefined;
        this.data     = (interfaceSave.request_type)  ? (new interfaceSave.request_type()) as any : undefined;
    }

    protected               initData(dlgargs:TArgs, ct:$JA.Context): $JA.Task<void>|void
    {
        const callargs = this.callargs as any;
        if (callargs instanceof $JT.Record || callargs instanceof $JT.Set) {
            if (dlgargs instanceof Object && (dlgargs as any).callargs instanceof Object) {
                callargs.assign((dlgargs as any).callargs);
            }
        }

        const _data = this.data as any;
        if (_data instanceof $JT.Record || _data instanceof $JT.Set) {
            //_data.setDefault();
            if (dlgargs instanceof Object && (dlgargs as any).data instanceof Object) {
                _data.assign((dlgargs as any).data);
            }
        }
    }
    protected               validateAsync(context:$JA.Context): $JA.Task<$JT.ValidateResult>
    {
        return $JT.validateAsync({ context }, (this.data as unknown instanceof $JT.BaseType) ? (this.data as unknown as $JT.BaseType) : undefined, this);
    }
    public                  validateNow():$JT.ValidateResult|Error
    {
        return $JT.ValidateResult.OK;
    }
    protected               onSubmit(context:$JA.Context): $JA.Task<TRtn>
    {
        return this.validateAsync(context)
                   .then(() => {
                             return $JA.Ajax(this.interface,
                                             {
                                                 callargs: this.callargs,
                                                 data:     this.data
                                             },
                                              context);
                         });
    }
}

//-------------------------------------------------------------------------------------------------
/**
 *!!DOC
 */
export class DataPopup extends $JPOPUP.Popup {
    constructor(poselm: $JD.DOMHTMLElement, context:$JA.Context, title: string, data:$JD.AddNode, contentClass:string|undefined, onclose: ()=>void) {
        const header  = <div class="-header">
                            { title }
                            <span class="-close" onclick={ onclose }></span>
                        </div>;
        const content = <div class="jannesen-ui-template-data-popup">
                            { header }
                            <div class={ $JD.classJoin("-container", contentClass) }>
                                { data }
                            </div>
                        </div>;

        super(poselm, "-data-popup", context);
        this.Show(content);

        header.bind("mousedown",  this._onMove, this);
        header.bind("touchstart", this._onMove, this);
    }

    protected   PositionPopup(container:$JD.DOMHTMLElement, poselmOuterRect:$JD.IRect, flags?: $JPOPUP.PositionFlags): void {
        super.PositionPopup(container, poselmOuterRect, $JPOPUP.PositionFlags.Center | $JPOPUP.PositionFlags.Middle);
    }

    private     _onMove(ev: UIEvent) {
        const container = this.container;
        if (container) {
            $JCONTENT.moveTracker(ev, container.css(["top", "left"]) as any, (pos) => { container.css(pos); }, undefined);
            ev.preventDefault();
        }
    }
}

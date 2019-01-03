/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J      from "jc3/jannesen";
import * as $JA     from "jc3/jannesen.async";
import * as $JD     from "jc3/jannesen.dom";
import * as $JL     from "jc3/jannesen.language";
import * as $JUP    from "jc3/jannesen.ui.popup";
import * as $JUM    from "jc3/jannesen.ui.menu";

//-------------------------------------------------------------------------------------------------
//
//

interface IActiveTask
{
    task:           $JA.Task<any>;
    ct:             $JA.CancellationTokenSource;
}

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export interface IFormState<TState=any>
{
    uuid:           string;
    timestamp:      number;
    href:           string;
    state:          TState|null|undefined;
    argset?:        IUrlArgsSet;
}

/**
 * !!DOC
 */
export const enum DialogFlags
{
    Window           = 0x0001,      // Windows mode normal for desktop.
    FullScreen       = 0x0002,      // Fullscreen mode used the (small) mobile devices like telephones.
    FullDialogScroll = 0x0004,      // Scroll the hole dialog (fullscreen mode).
    Narrow           = 0x0008,      // Reduce size to fit on screen in relation with fullscreen.
}

/**
 * !!DOC
 */
export interface IUrlArgsSet
{
    hasNext():  boolean;
    hasPrev():  boolean;
    next():     IUrlArgsSet|null;
    prev():     IUrlArgsSet|null;
    args():     $J.IUrlArgsColl;
}
export function isIUrlArgsSet(o: any): o is IUrlArgsSet {
    return typeof o === 'object' && typeof o.args === 'function';
}
/**
 * !!DOC
 */
export interface IDialogButton
{
    "class":        string;
    text:           string;
    value?:         string|Error;
    onclick?:       () => void;
}

/**
 * !!DOC
 */
export const enum FormChangedReason {
    Loaded = 1,
    Idle,
    Busy,
    TitleChanged,
    TabChanged
}
export interface IFormHost
{
    readonly    parent:                () => FormLoader|null;
    readonly    openform:              (formName:string, args:$J.IUrlArgsColl|IUrlArgsSet, historyReplace:boolean, ct:$JA.ICancellationToken|null) => $JA.Task<void>;
    readonly    historyChangeArgs:     (args:$J.IUrlArgsColl, historyReplace:boolean) => void;
    readonly    formchanged:           (reason:FormChangedReason, form:Form) => void;
}
export type Nullable<T> = {
    readonly [P in keyof T]?: T[P];
};

export var  dialogfullscreenflags = DialogFlags.Window;     // Allowed DialogFlags for fullscreen.
/**
 * !!DOC
 */
export const std_button_cancel:IDialogButton       = { "class": "btn btn-cancel", "text": $JL.btn_cancel,     "value": "CANCEL"    };
export const std_button_cancel_error:IDialogButton = { "class": "btn btn-cancel", "text": $JL.btn_cancel,     "value": new $JA.OperationCanceledError("Cancelled by user") };
export const std_button_ok:IDialogButton           = { "class": "btn btn-ok",     "text": $JL.btn_ok,         "value": "OK"        };
export const std_button_close:IDialogButton        = { "class": "btn btn-close",  "text": $JL.btn_close,      "value": "CLOSE"    };
export const std_button_no:IDialogButton           = { "class": "btn btn-no",     "text": $JL.no,             "value": "NO"       };
export const std_button_no_error:IDialogButton     = { "class": "btn btn-no",     "text": $JL.no,             "value": new $JA.OperationCanceledError("Cancelled by user") };
export const std_button_yes:IDialogButton          = { "class": "btn btn-yes",    "text": $JL.yes,            "value": "YES"      };
export const std_button_save:IDialogButton         = { "class": "btn btn-save",   "text": $JL.btn_save,       "value": "SAVE"     };
export const std_button_remove:IDialogButton       = { "class": "btn btn-remove", "text": $JL.btn_remove,     "value": "REMOVE"   };

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export class AsyncContext implements $JA.ICancellationToken
{
    private             _ct:        $JA.ICancellationToken;
    private             _parent:    ContentLoader;

    public get          ct()            { return this._ct;     }
    public get          parent()        { return this._parent; }

    public get          canBeCanceled() { return this._ct.canBeCanceled; }
    public get          isCancelled()   { return this._ct.isCancelled;   }
    public get          reason()        { return this._ct.reason;        }

    public              constructor(ct:$JA.ICancellationToken, parent:ContentLoader)
    {
        this._ct     = ct;
        this._parent = parent;
    }

    public              register(action:(reason:Error)=>void)
    {
        this._ct.register(action);
    }
    public              unregister(action:(reason: Error)=>void)
    {
        this._ct.unregister(action);
    }
    public              throwIfCancelled()
    {
        this._ct.throwIfCancelled();
    }
}
//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export abstract class ContentLoader<TContentBody extends ContentBody<ContentLoader, any> = ContentBody<any,any>, TArgs = any> extends $JD.Container
{
    protected           _contentBody:   TContentBody|null;
    protected           _overlay:       $JD.DOMHTMLElement;
    protected           _isbusy:        boolean;
    protected           _activeTask:    IActiveTask|null;
    private             _execute_cnt:   number;
    private             _loading_cnt:   number;

    protected abstract get getRequesttedContentType(): new ()=>TContentBody;

    public  get         contentBody()
    {
        return this._contentBody;
    }
    public  get         isBusy()
    {
        return this._isbusy;
    }

    public              constructor(className:string)
    {
        const overlay = <div class="-overlay" tabIndex={-1} />;
        super(<div class={ className } >{ overlay }</div>);
        this._overlay     = overlay;
        this._contentBody = null;
        this._isbusy      = false;
        this._activeTask  = null;
        this._execute_cnt = 0;
        this._loading_cnt = 0;
        this._container.bind("keydown", this._onkeydown, this);
        this._container.data("contentloader", this);
        this._container.bind("RemovedFromDocument", this._destroy, this);
    }

    public              focus() {
        if (this._contentBody && !this._container.contains($global.document.activeElement)) {
            if (this.isBusy) {
                this._overlay.focus();
            }
            else {
                this._contentBody.focus();
            }
        }
    }
    public              cancel(): $JA.Task<void>
    {
        if (this._activeTask) {
            const oldActiveTask = this._activeTask;
            return new $JA.Task((resolver) => {
                                    oldActiveTask.ct.cancel(new $JA.OperationCanceledError("Load cancelled by new load."));
                                    oldActiveTask.task.finally(resolver as () => void);
                                }).then((x) => {});
        } else {
            return $JA.Task.resolve();
        }
    }
    public              execute<TRtn>(executor: (context:AsyncContext) => $JA.Task<TRtn>, ct?:$JA.ICancellationToken|null): $JA.Task<TRtn>
    {
        let active:     IActiveTask;

        if (this._activeTask) {
            return $JA.Task.reject(new $JA.BusyError("Content loader busy."));
        }

        const ctd     = new $JA.CancellationTokenDom(this._container, ct);
        ctd.throwIfCancelled();
        const context = new AsyncContext(ctd, this);

        this._overlay.css("z-index", (this._container.css("z-index") || 0) + 999);

        this._container.addClass("-execute");
        (this._execute_cnt)++;

        let task:$JA.Task<TRtn>;

        try {
            task = executor(context);
        } catch (e) {
            task = $JA.Task.reject(e);
        }

        task = task.catch((e) => {
                                if (e instanceof $JA.OperationCanceledError) {
                                    throw e;
                                }

                                return ( this._contentBody
                                            ? this._contentBody.displayError(e, context)
                                            : DialogError.show(e, context) as $JA.Task<void>)
                                       .then(() => { throw e; });
                          })
                   .finally(() => {
                                if (this._activeTask === active) {
                                    this._setActiveTask(null);
                                }

                                if (--(this._execute_cnt) === 0) {
                                    this._container.removeClass("-execute");
                                    if (this._overlay.element === $global.document.activeElement && this._contentBody) {
                                        this._contentBody.focus();
                                    }
                                }
                            });

        this._setActiveTask(active = { task, ct:ctd });

        if (this._container.contains($global.document.activeElement) && $global.document.activeElement !== this._overlay.element) {
            this._overlay.focus();
        }

        return task;
    }

    /*@internal*/       showcontent(body:TContentBody)
    {
        if (this._contentBody === body) {
            this._cleanupContent();
        }
    }

    protected           _open(contentNameClass:string|(new ()=>TContentBody), args:TArgs, formstate:IFormState|undefined, ct:$JA.CancellationTokenSource, allowReUse:boolean): $JA.Task<void>
    {
        let active:     IActiveTask;
        let newContent: TContentBody;
        this._overlay.css("z-index", (this._container.css("z-index") || 0) + 999);
        this._container.addClass("-loading");
        (this._loading_cnt)++;

        let task = this.cancel()
                       .then(() => {
                                    ct.throwIfCancelled();

                                    if (typeof contentNameClass === "string") {
                                        let     nameparts = contentNameClass.split(":", 2);

                                        if (nameparts.length === 1) {
                                            nameparts.push("FormModule");
                                        }

                                        return $JA.Require(nameparts[0], ct)
                                                    .then((module) => {
                                                        const constructor = (module as any)[nameparts[1]];
                                                        if (typeof constructor !== 'function') {
                                                            throw new Error("Can't load content-class '" + contentNameClass + "'.");
                                                        }

                                                        if (!$J.testContructorOf(constructor,  this.getRequesttedContentType)) {
                                                            throw new Error("Invalid type of content-class '" + contentNameClass + "'.");
                                                        }

                                                        return constructor as (new ()=>TContentBody);
                                                    });
                                    }

                                    if ($J.testContructorOf(contentNameClass, this.getRequesttedContentType)) {
                                        return $JA.Task.resolve<new ()=>TContentBody>(contentNameClass);
                                    }

                                    throw new $J.InvalidStateError("FormLoader.open: argument exception 'form': invalid type.");
                             })
                       .then((formConstructor) => {
                                    ct.throwIfCancelled();
                                    if (!(allowReUse && this._contentBody && Object.getPrototypeOf(this._contentBody).constructor === formConstructor && this._contentBody.canReOpen)) {
                                        newContent = new formConstructor();
                                        newContent._setContentNameClass(contentNameClass);
                                        const loadTask   = newContent._onload(ct);

                                        if (loadTask instanceof $JA.Task) {
                                            return loadTask.then(() => {
                                                                    ct.throwIfCancelled();
                                                                    this._setcontentBody(newContent);
                                                                 });
                                        } else {
                                            this._setcontentBody(newContent);
                                        }
                                    }
                             })
                       .then(() => {
                                    return this._contentBody!._openContent(args, formstate, ct);
                             })
                       .then(() => {
                                    if (newContent) {
                                        this._showContent(newContent);
                                    }
                             })
                       .catch((e) => {
                                    if (this._contentBody && newContent === this._contentBody) {
                                        this._container.removeChild(newContent._scrollbox);
                                        this._setcontentBody(null);
                                    }

                                    throw e;
                              })
                       .finally(() => {
                                    if (--(this._loading_cnt) === 0) {
                                        this._container.removeClass("-loading");
                                    }
                                    if (this._activeTask === active) {
                                        this._setActiveTask(null);
                                    }
                                });

        this._setActiveTask(active = { task, ct });
        return task;
    }
    protected abstract  _showContent(contentBody:TContentBody):void;
    protected           _setActiveTask(task:IActiveTask|null) {
        this._activeTask = task;
        this._isbusy = !!task;
    }
    protected           _destroyContent(contentBody:TContentBody) {
         contentBody.trigger("destroy");
    }
    protected           _destroy() {
        this._container.unbind("keydown", this._onkeydown, this);

        for (let child of this._container.children) {
            const cb = child.data("contentbody") as TContentBody;
            if (cb instanceof ContentBody) {
                this._destroyContent(cb);
                this._container.removeChild(child);
            }
        }
    }
    protected           _onkeydown(ev:KeyboardEvent) {
        if (this.isBusy) {
            ev.stopPropagation();
            ev.preventDefault();
            return;
        }

        switch (ev.key) {
        case "Tab":
            if (!ev.altKey && !ev.ctrlKey && !ev.metaKey) {
                ev.stopPropagation();
                ev.preventDefault();
                const target = ev.target;
                if (target === $global.document.activeElement && target instanceof HTMLElement) {
                    const body = this._contentBody;
                    if (body) {
                        body._handlerTab(target, ev.shiftKey);
                        return;
                    }
                }
            }
            break;

        default:
            {
                const body = this._contentBody;
                if (body) {
                    body.body_onkeydown(ev);
                }
            }
        }
    }
    /*@internal*/       _onfocusin(target:HTMLElement) {
        if (this.isBusy) {
            if (target !== this._overlay.element) {
                this._overlay.focus();
            }
        }
        else {
            if (target.tabIndex < 0) {
                if (this._contentBody) {
                    this._contentBody.focus();
                }
            }
        }
    }

    protected           _setcontentBody(contentBody:TContentBody|null)
    {
        if (this._contentBody) {
            this._contentBody._setLoader(null);
        }

        this._contentBody = contentBody;

        if (contentBody) {
            contentBody._setLoader(this);
            this._overlay.insertBefore(contentBody._scrollbox);

            if (contentBody._shownow) {
                this.showcontent(contentBody);
            }
        }
    }
    protected           _cleanupContent()
    {
        for (let child of this._container.children) {
            const cb = child.data("contentbody") as TContentBody;
            if (cb instanceof ContentBody && cb !== this._contentBody) {
                this._destroyContent(cb);
                this._container.removeChild(child);
            }
        }

        if (this._contentBody) {
            this._contentBody._scrollbox.removeClass("-loading");
        }
    }
}

/**
 * !!DOC
 */
export abstract class ContentBody<TLoader extends ContentLoader<any, any>, TArgs = any> implements $J.EventHandling
{
    protected           _loader:            TLoader|null;
    protected           _contentNameClass!: string|(new ()=>this);
    protected           _args:              TArgs|undefined;
    /*@internal*/       _scrollbox:         $JD.DOMHTMLElement;
    /*@internal*/       _content:           $JD.DOMHTMLElement;
    /*@internal*/       _shownow?:          boolean;

    public get          loader()                            {
        const loader = this._loader;
        return loader && loader.contentBody === this ? loader :null;
    }
    public get          contentNameClass()                  { return this._contentNameClass; }
    public get          args():TArgs                        {
        if (this._args === undefined) {
            throw new $J.InvalidStateError("Args unavailable.");
        }
        return this._args;
    }
    public get          canReOpen():boolean                 { return false;                  }
    public get          isLoaded():boolean                  {
        const loader = this._loader;
        return !!loader && loader.contentBody === this && !this._content.hasClass("-loading");
    }
    public get          isIdle():boolean                  {
        const loader = this._loader;
        return !!loader && loader.contentBody === this && !(loader.isBusy || this._content.hasClass("-loading"));
    }
    protected get       scrollbody():$JD.DOMHTMLElement     { return this._scrollbox;          }
    protected get       content():$JD.DOMHTMLElement        { return this._content;          }
    protected get       contentClass():string|undefined     { return undefined;              }
    protected get       scrollBoxStyle():string|undefined   { return undefined;              }

    // #region mixin $J.EventHandling
    public              _eventHandlers!:    $J.IEventHandlerCollection;
    public              bind(eventName: string,            handler: (ev:any)=>void,                 thisArg?:any): void;
    public              bind(eventName: "keypress-cancel", handler: (event:KeyboardEvent)=>void,    thisArg?:any): void;
    public              bind(eventName: "keypress-ok",     handler: (event:KeyboardEvent)=>void,    thisArg?:any): void;
    public              bind(eventName: "show",            handler: ()=>void,                       thisArg?:any): void;
    public              bind(eventName: "hide",            handler: ()=>void,                       thisArg?:any): void;
    public              bind(eventName: "destroy",         handler: ()=>void,                       thisArg?:any): void;
    public              bind(eventName: string,            handler: (ev:any)=>void,                 thisArg?:any): void         { throw new $J.InvalidStateError("Mixin not applied."); }
    public              unbind(eventName: string, handler: (ev?:any)=>void, thisArg?:any): void                                 { throw new $J.InvalidStateError("Mixin not applied."); }
    public              trigger(eventName: "keypress-cancel", data:KeyboardEvent      ): void;
    public              trigger(eventName: "keypress-ok",     data:KeyboardEvent      ): void;
    public              trigger(eventName: "show",                                    ): void;
    public              trigger(eventName: "hide",                                    ): void;
    public              trigger(eventName: "destroy"                                  ): void;
    public              trigger(eventName: string,            data?: any              ): void                                   { throw new $J.InvalidStateError("Mixin not applied."); }
    // #endregion

    public              constructor(className:string)
    {
        this._loader  = null;
        this._args    = undefined;
        this._scrollbox = <div class="-scrollbox -loading" style={ this.scrollBoxStyle }>
                              { this._content = <div class={ $JD.classJoin("-content", className, this.contentClass, "jannesen-ui-tabform", "-loading") } /> }
                          </div>;
        this._scrollbox.data("contentbody", this);
    }


    protected           onload(ct:$JA.ICancellationToken):$JA.Task<void>|void
    {
    }

    public              focus()
    {
        if (!this._content.contains($global.document.activeElement)) {
            this.focusFirstInput();
        }
    }
    public              execute<T>(executor: (context: AsyncContext) => $JA.Task<T>, ct?:$JA.ICancellationToken):$JA.Task<T>
    {
        if (!this._loader) {
            return $JA.Task.reject(new $J.InvalidStateError("Dialog not active."));
        }

        return this._loader.execute(executor, ct);
    }
    public              displayError(e: Error, context:AsyncContext): $JA.Task<void>
    {
        return DialogError.show(e, context) as $JA.Task<void>;
    }

    public              body_onkeydown(ev: KeyboardEvent) {
    }

    /*@internal*/       focusFirstInput() {
        const n = $JD.nextTabStop(this._content.element, null, false);
        if (n instanceof HTMLElement) {
            n.focus();
        }
    }
    /*@internal*/       _handlerTab(target:HTMLElement, back:boolean) {
        const n = $JD.nextTabStop(this._content.element, target, back);
        if (n instanceof HTMLElement) {
            n.focus();
        }
    }
    /*@internal*/       _onload(ct:$JA.ICancellationToken):$JA.Task<void>|void
    {
        return this.onload(ct);
    }
    /*@internal*/       _setContentNameClass(contentNameClass:string|(new ()=>this))
    {
        this._contentNameClass = contentNameClass;
    }
    /*@internal*/       _setLoader(container:TLoader|null)
    {
        this._loader = container;
    }
    /*@internal*/ abstract _openContent(args:TArgs, formState:IFormState|null|undefined, ct:$JA.ICancellationToken):$JA.Task<void>|void;
}
$J.applyMixins(ContentBody, [$J.EventHandling]);

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export class FormLoader<TArgs=any> extends ContentLoader<Form<TArgs> | FormError, TArgs | Error>
{
    private             _host:              IFormHost;
    protected           _showcalled:        boolean;
    protected           _display:           boolean;
    protected           _size?:             $JD.ISize;

    protected get       getRequesttedContentType()  { return Form as any /* Work around Typescript problem #5843 */;  }

    public get          host()
    {
        return this._host;
    }
    public get          size()
    {
        return this._size;
    }

    public              constructor(host?: Nullable<IFormHost>)
    {
        super("jannesen-ui-content -form");
        this._host       = {
                                parent:                (host && host.parent           ) || (() => null ),
                                openform:              (host && host.openform         ) || (() => { throw new $J.NotImplentedError("openform"); }),
                                historyChangeArgs:     (host && host.historyChangeArgs) || nop,
                                formchanged:           (host && host.formchanged)       || nop
                           };
        this._showcalled = false;
        this._display    = true;
    }

    public              open(formNameClass:string|(new ()=>Form<TArgs>), args:TArgs, formstate?:IFormState, ct?:$JA.ICancellationToken|null, refresh?:boolean): $JA.Task<void>
    {
        const ctd = new $JA.CancellationTokenDom(this._container, ct);
        return this._open(formNameClass, args, formstate, ctd, !refresh)
                    .then(() => {
                              if (this._contentBody) {
                                  this._host.formchanged(FormChangedReason.Loaded, this._contentBody);
                              }
                          },
                          (e) => {
                              if (!ctd.isCancelled) {
                                  return this._open(FormError, e, undefined, ctd, false)
                                             .then(() => {
                                                        if (this._contentBody) {
                                                            this._host.formchanged(FormChangedReason.Loaded, this._contentBody);
                                                        }
                                                        throw e;
                                                   });
                              }

                              throw e;
                        });
    }
    public              execute<TRtn>(executor: (context:AsyncContext) => $JA.Task<TRtn>, ct?:$JA.ICancellationToken|null): $JA.Task<TRtn>
    {
        const parent = this._host.parent();

        return parent ? parent.execute(executor, ct) : super.execute(executor, ct);
    }
    public              saveFormState()
    {
        if (this._contentBody) {
            this._contentBody._saveFormState();
        }
    }
    public              setSize(size:$JD.ISize|undefined)
    {
        if (!$JD.compareSize(this._size, size)) {
            this._container.setSize(this._size = size);

            if (this._showcalled && this._display && this._contentBody) {
                this._contentBody._trigger_resize(size);
            }
        }
    }
    public              show(display?:boolean) {
        if (typeof display === 'boolean') {
            if (this._display !== display) {
                this._container.show(this._display = display);
                if (this._contentBody) {
                    if (display) {
                        this._contentBody.trigger("show");
                    }
                    else {
                        this._contentBody.trigger("hide");
                    }
                }
            }
        }

        return this._display;
    }

    protected           _setActiveTask(task:IActiveTask|null) {
        super._setActiveTask(task);
        if (this._contentBody) {
            this._host.formchanged(task ? FormChangedReason.Busy : FormChangedReason.Idle, this._contentBody);
        }
    }
    protected           _showContent(content:Form<TArgs> | FormError)
    {
        this._cleanupContent();
        content._content.removeClass("-loading");
        this._container.removeClass("-loading");

        this._showcalled = true;

        if (this._display) {
            content.trigger("show");
            content._trigger_resize(this._size);
        }
    }
    protected           _destroyContent(contentBody:Form<TArgs> | FormError) {
        if (this._display) {
            contentBody.trigger("hide");
        }
        super._destroyContent(contentBody);
    }
}

/**
 * !!DOC
 */
export abstract class Form<TArgs=any,TState=any> extends ContentBody<FormLoader<TArgs>, TArgs>
{
    /*@internal*/       _formstate:     IFormState<TState>|undefined;
    private            _size:          $JD.ISize|undefined;

    public  get         contentsize() {
        return this._size;
    }
    public              constructor()
    {
        super("jannesen-ui-content-form");
        this._formstate = undefined;
        this._size      = undefined;
    }

    public              formTitle():$JD.AddNode
    {
        return "";
    }
    public              moreMenuEnabled()
    {
        return false;
    }
    public              moreMenuDatasource(ct:$JA.ICancellationToken):$JUM.IDataSourceResult
    {
        return [];
    }

    protected abstract  onopen(args:TArgs, state:TState|null|undefined, ct:$JA.ICancellationToken):$JA.Task<void>|void;
    protected           onresize(size:$JD.ISize|undefined)
    {
    }
    protected           savestate():TState|null|undefined
    {
        return undefined;
    }

    protected           openform(formName:string, args:$J.IUrlArgsColl|IUrlArgsSet, historyReplace?:boolean, ct?:$JA.ICancellationToken|null)
    {
        if (historyReplace === undefined) historyReplace = false;
        if (ct === undefined) ct = null;

        const loader = this.loader;
        if (!loader) {
            throw new $JA.OperationCanceledError("Form not active any more.");
        }

        return loader.host.openform(formName, args, historyReplace, ct);
    }
    protected           historyChangeArgs(args:$J.IUrlArgsColl, historyReplace:boolean) {
        const loader = this.loader;
        if (loader) {
            loader.host.historyChangeArgs(args, historyReplace);
        }
    }
    protected           setContent(content:$JD.AddNode, shownow?:boolean)
    {
        this._content.empty().appendChild(content);

        if (shownow && this._scrollbox.hasClass("-loading")) {
            if (this._loader) {
                this._loader.showcontent(this);
            } else {
                this._shownow = true;
            }
        }
    }

    /*@internal*/       _openContent(args:TArgs, formstate:IFormState<TState>|undefined, ct:$JA.ICancellationToken)
    {
        this._args      = args;
        this._formstate = formstate;
        return this.onopen(args, (formstate ? formstate.state : undefined), ct);
    }
    /*@internal*/       _saveFormState()
    {
        if (this._formstate) {
            try {
                this._formstate.timestamp = (new Date).getTime();
                this._formstate.state     = this.savestate();
            } catch (e) {
                $J.globalError("Form.savestate failed.", e);
            }
        }
    }
    /*@internal*/       _trigger_resize(size: $JD.ISize|undefined) {
        if (!$JD.compareSize(this._size, size)) {
            this._size = size;

            try {
                this.onresize(size ? { width: size.width, height: size.height } : undefined);
            }
            catch (e) {
                $J.globalError("ContentBody.onresize failed.", e);
            }
        }
    }
}

/**
 * !!DOC
 */
export class FormError extends Form<Error>
{
    public get          contentClass()         { return "-error"; }

    protected           onopen(err:Error, state:void, ct:$JA.ICancellationToken)
    {
        this.setContent(errorToContent(err));
    }

    public              formTitle():$JD.AddNode
    {
        return $JL.errormessage_title;
    }
}

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export class DialogLoader<TArgs, TRtn> extends ContentLoader<DialogBase<TArgs, TRtn>, TArgs>
{
    private             _parent!:           ContentLoader<ContentBody<any, any>, any>;
    private             _initDlgSize:       $JD.ISize|undefined;
    private             _onTop:             boolean;

    protected get       getRequesttedContentType()  { return DialogBase as any /* Work around Typescript problem #5843 */;  }

    public get          isOnTop()
    {
        return this._onTop;
    }

    public              constructor()
    {
        super("jannesen-ui-content -dialog -window");
        this._container.css("position", "absolute");
        this._initDlgSize     = undefined;
        this._onTop           = false;
    }

    public              runAsync(form:string|(new ()=>DialogBase<TArgs, TRtn>), args:TArgs, context:AsyncContext|$JA.ICancellationToken|null)
    {
        let ctd:$JA.CancellationTokenDom;

        if (context instanceof AsyncContext) {
            ctd = new $JA.CancellationTokenDom(this._container, context.ct);
            this._parent = context.parent;
        } else {
            ctd = new $JA.CancellationTokenDom(this._container, context);
        }

        $JD.body.appendChild(this);
        setDialogOnTop(this);
        this._centerDialog();

        return this._open(form, args, undefined, ctd, false)
                   .then(() => this._contentBody!._runDialogAsync(ctd))
                   .then((r) => {
                             this._isbusy = true;
                             this._container.addClass("-unloading");
                             this._overlay.focus();
                             return waitAnimationAsync(this._container, 1000, r);
                         },
                         (e) => {
                             if (context && context.isCancelled) {
                                 throw e;
                             }

                             this._isbusy = true;
                             this._container.addClass("-unloading");
                             this._overlay.focus();
                             return waitAnimationAsync(this._container, 1000, undefined)
                                    .then(() => { throw e; });
                         })
                   .finally(() => {
                                $JD.body.removeChild(this);
                                this._cleanup();

                                if (this._onTop && this._parent) {
                                    this._parent.focus();
                                }
                                resetWindowFullscreen();
                            });
    }

    /*@internal*/       _setOnTop(ontop:boolean)
    {
        if (this._onTop !== ontop) {
            if (this._onTop = ontop) {
                if (this._contentBody) {
                    if (!this.isBusy) {
                        this._focusFirst();
                    }
                    else {
                        this._overlay.focus();
                    }
                }
            }
        }
    }
    protected           _showContent(contentBody:DialogBase<TArgs, TRtn>)
    {
        const container = this._container;
        this._cleanupContent();
        contentBody._content.removeClass("-loading");
        container.removeClass("-loading")
                 .css({ position:"absolute", top:0, left:0 })
                 .addClass("-init");

        contentBody.trigger("show");

        this._initDlgSize = this.container.size;
        contentBody.dialogFlags = this._calcDialogFlags();

        if (contentBody.dialogFlags & DialogFlags.FullScreen) {
            this._resizeFullScreen();
        } else {
            this._centerDialog();
        }

        container.bind("mousedown",  this._onMove, this);
        container.bind("touchstart", this._onMove, this);
        container.removeClass("-init")
                 .addClass("-loaded");
        $JD.window.bind("resize",  this._onWindowResize,  this);

        waitAnimationAsync(container, 1000, undefined).then(() => {
                                this._container.bind("click", this._onclick, this);
                                if (this._contentBody && this._onTop)  {
                                    this._focusFirst();
                                }
                            });
    }

    private             _cleanup()
    {
        this._setcontentBody(null);
        $JD.window.unbind("resize", this._onWindowResize,  this);
    }
    private             _onclick()
    {
        if (!this._onTop && !this._activeTask) {
            setDialogOnTop(this);
        }
    }
    private             _onMove(ev:UIEvent)
    {
        if (this._contentBody && (this._contentBody.dialogFlags & DialogFlags.Window) !== 0 && this._isDialogMoveTarget(ev.target as HTMLElement)) {
            moveTracker(ev, this._container.css(["top","left"]) as $JD.IPosition,
                            (pos) => {
                                const ws = $JD.window.size;
                                pos.left = Math.min(Math.max(pos.left, 0), ws.width  - 32);
                                pos.top  = Math.min(Math.max(pos.top,  0), ws.height - 32);

                                this._container.css(pos);

                                if (this._contentBody) {
                                    this._contentBody._layoutDialog(pos);
                                }
                            });
        }
    }
    private             _onWindowResize()
    {
        if (this._contentBody instanceof ContentBody) {
            // Work around bug in iOS browser. window.size is not in sync with window.onsize.
            $J.setTimeout(() => {
                    const contentBody = this._contentBody;
                    if (contentBody instanceof ContentBody) {
                        const f = this._calcDialogFlags();

                        if (f !== (contentBody.dialogFlags & (DialogFlags.Window | DialogFlags.FullScreen | DialogFlags.FullDialogScroll | DialogFlags.Narrow))) {
                            contentBody.dialogFlags = (contentBody.dialogFlags & ~(DialogFlags.Window | DialogFlags.FullScreen | DialogFlags.FullDialogScroll | DialogFlags.Narrow)) | f;
                            if (contentBody.dialogFlags & DialogFlags.FullScreen) {
                                $JD.body.addClass("jannesen-ui-dialog-fullscreen");
                                this._resizeFullScreen();
                            } else {
                                resetWindowFullscreen();
                                this._centerDialog();
                            }
                        } else {
                            if (contentBody.dialogFlags & DialogFlags.FullScreen) {
                                this._resizeFullScreen();
                            }
                        }
                    }
                }, 25);
        }
    }
    private             _focusFirst():void
    {
        if (this._contentBody) {
            const n = $JD.nextTabStop(this._contentBody._content.element, null, false);

            if (n instanceof HTMLElement)
                n.focus();
            else if (n !== null)
                this._contentBody._content.focus();
        }
    }
    private             _calcDialogFlags() {
        if (dialogfullscreenflags & DialogFlags.FullScreen) {
            let dlgSize           = this._initDlgSize!;
            let winSize           = $JD.window.size;

            if ((winSize.width * 0.8) < dlgSize.width) {
                let flags:DialogFlags = dialogfullscreenflags & (DialogFlags.FullScreen | DialogFlags.FullDialogScroll);

                if ((dialogfullscreenflags & DialogFlags.Narrow) !== 0 && (dlgSize.width > winSize.width || dlgSize.height < winSize.height / 2)) {
                    flags |= DialogFlags.Narrow;
                }

                return flags;
            }
        }

        return DialogFlags.Window;
    }
    private             _centerDialog() {
        let winSize = $JD.window.size;
        let pos:$JD.IPosition|undefined;

        if (this._parent) {
            try {
                const rect = this._parent.container.outerRect;
                pos = { top: rect.top + rect.height / 2, left: rect.left + rect.width / 2 };
            } catch (e) {
            }
        }

        if (!pos) {
            pos = { top: winSize.height / 2, left: winSize.width / 2 };
        }

        if (this._contentBody) {
            this._container.css({ position:"absolute", top: 0, left: 0, width: undefined, height: undefined });
            this._contentBody._layoutDialog({ top:0, left:0 });
        }

        let dlgSize = this._container.size;
        pos.top  = Math.round(pos.top  - (dlgSize.height / 2));
        pos.left = Math.round(pos.left - (dlgSize.width  / 2));

        if (pos.top  > winSize.height - dlgSize.height) pos.top  = winSize.height - dlgSize.height;
        if (pos.left > winSize.width  - dlgSize.width)  pos.left = winSize.width  - dlgSize.width;
        if (pos.top < 0)  pos.top  = 0;
        if (pos.left < 0) pos.left = 0;

        this._container.css(pos);
        if (this._contentBody) {
            this._contentBody._layoutDialog(pos);
        }
    }
    private             _resizeFullScreen()
    {
        let winSize = $JD.window.size;
        this._container.css({ position: "fixed", top: 0, left: 0, width: winSize.width, height: winSize.height });

        if (this._contentBody) {
            this._contentBody._layoutDialog({ top:0, left:0 });
        }
    }
    private             _isDialogMoveTarget(htmlElement: HTMLElement)
    {
        let elm:$JD.DOMHTMLElement|null = $JD.element(htmlElement);

        while (elm && elm.element !== this._container.element) {
            if (elm.hasClass("-dialog-move-target"))
                return true;

            elm = elm.parent;
        }

        return false;
    }
}

/**
 * !!DOC
 */
export function dialogShow<TArgs,TRtn>(form:string|(new ()=>DialogBase<TArgs, TRtn>), args: TArgs, context:AsyncContext|$JA.ICancellationToken|null): $JA.Task<TRtn|string|undefined>
{
    return (new DialogLoader<TArgs, TRtn>()).runAsync(form, args, context);
}

/**
 * !!DOC
 */
export abstract class DialogBase<TArgs, TRtn> extends ContentBody<DialogLoader<TArgs, TRtn>, TArgs>
{
    protected           _dialogFlags:   DialogFlags;
    private             _onclose:       ((rtn:TRtn|string|Error|undefined)=>void)|null;

    public get          dialogFlags():DialogFlags {
        return this._dialogFlags;
    }
    public set          dialogFlags(flags: DialogFlags) {
        if (this._loader) {
            this._content.toggleClass("-window",            (flags & DialogFlags.Window)     !== 0);
            this._content.toggleClass("-fullscreen",        (flags & DialogFlags.FullScreen) !== 0);
            this._content.toggleClass("-narrow",            (flags & DialogFlags.Narrow)     !== 0);
            this._loader.container.toggleClass("-window",     (flags & DialogFlags.Window)     !== 0);
            this._loader.container.toggleClass("-fullscreen", (flags & DialogFlags.FullScreen) !== 0);

            if ((flags & DialogFlags.FullScreen) !== 0) {
                $JD.body.addClass("jannesen-ui-dialog-fullscreen");
            } else {
                if ((this._dialogFlags & DialogFlags.FullScreen) !== 0) {
                    resetWindowFullscreen();
                }
            }

            this._dialogFlags = flags;
        }
    }

    public              constructor()
    {
        super("jannesen-ui-content-dialog");
        this._dialogFlags = 0;
        this._onclose     = null;
    }

    public              focus() {
        if (!this._content.contains($global.document.activeElement)) {
            setDialogOnTop(this._loader);
            this.focusFirstInput();
        }
    }

    protected abstract  onopen(args:TArgs, ct:$JA.ICancellationToken):$JA.Task<void>|void;

    protected           closeForm(rtn:TRtn|Error|string|undefined):void
    {
        if (!this._onclose) {
            throw new $J.InvalidStateError("Dialog not running.");
        }
        this._onclose(rtn);
    }

    /*@internal*/       _runDialogAsync(ct:$JA.ICancellationToken)
    {
        return new $JA.Task<TRtn|string|undefined>((resolver, reject, oncancel) => {
                                            oncancel((reason) => reject(reason));
                                            this._onclose = (rtn) => {
                                                                        this._onclose = null;

                                                                        if (rtn instanceof Error) {
                                                                            reject(rtn);
                                                                        } else {
                                                                            resolver(rtn);
                                                                        }
                                                                    };
                                        }, ct);
    }
    /*@internal*/       _layoutDialog(pos:$JD.IPosition)
    {
        const   winSize                      = $JD.window.size;
        let     body:$JD.DOMHTMLElement|null = null;
        let     noBodyHeight                 = 0;

        if (this._dialogFlags & DialogFlags.FullScreen) {
            for (const elm of this._content.children) {
                elm.css("width", winSize.width);

                if (elm.hasClass("-footer")) {
                    elm.removeClass("-narrow-btn").css("font-size", undefined);

                    if (elm.prop("scrollWidth") > elm.prop("offsetWidth")) {
                        elm.addClass("-narrow-btn");

                        if (elm.prop("scrollWidth") > elm.prop("offsetWidth")) {
                            elm.css("font-size", (elm.prop("offsetWidth") / (elm.prop("scrollWidth")+elm.css("padding-right"))) + "em");
                        }
                    }
                }

                if (elm.hasClass("-body")) {
                    body = elm;
                } else {
                    noBodyHeight += elm.size.height;
                }
            }

            if (body) {
                body.css({ "min-height": Math.floor(Math.max(winSize.height - noBodyHeight - 0.5, 1)),
                           "max-height": undefined
                         })
                         .toggleClass("-scroll", (this._dialogFlags & DialogFlags.FullDialogScroll) === 0);

            }

            this._scrollbox.css({
                                height: winSize.height,
                                width:  winSize.width
                            })
                            .toggleClass("-scroll", (this._dialogFlags & DialogFlags.FullDialogScroll) !== 0);
        } else {
            for (const elm of this._content.children) {
                elm.css("width", undefined);

                if (elm.hasClass("-footer")) {
                    elm.removeClass("-narrow-btn").css("font-size", undefined);
                }

                if (elm.hasClass("-body")) {
                    body = elm;
                } else {
                    noBodyHeight += elm.size.height;
                }
            }

            if (body) {
                const borderWidth = this._content.css(["border-left-width", "border-right-width", "border-top-width", "border-bottom-width"]);
                const noBodyWidth = ((borderWidth["border-left-width"] as number) + (borderWidth["border-right-width"] as number)) || 0;
                noBodyHeight += ((borderWidth["border-top-width"] as number) + (borderWidth["border-bottom-width"] as number)) || 0;

                let css = {
                            "min-height":   undefined as number|undefined,
                            "max-height":   Math.floor(Math.max(Math.round(Math.max(winSize.height - pos.top,  winSize.height / 2) - noBodyHeight - 0.5), 32)),
                            "min-width":    undefined as number|undefined,
                            "max-width":    Math.floor(Math.max(Math.round(Math.max(winSize.width  - pos.left, winSize.width  / 2)  - noBodyWidth  - 0.5), 100))
                          };

                body.css(css)
                    .toggleClass("-scroll", true);
            }

            this._scrollbox.css({
                                height: undefined,
                                width:  undefined
                            })
                            .toggleClass("-scroll", false);
        }
    }
    /*@internal*/       _openContent(args:TArgs, formstate:undefined, ct:$JA.ICancellationToken)
    {
        return this.onopen(this._args = args, ct);
    }
}

/**
 * !!DOC
 */
export abstract class Dialog<TArgs, TRtn> extends DialogBase<TArgs, TRtn>
{
    protected           onopen(args: TArgs, ct: $JA.ICancellationToken)
    {
        let header  = this.formHeader();
        let body    = this.formBody  ();
        let footer  = this.formFooter();

        this.content.appendChild((header ? <div class="-header -dialog-move-target">{ header }</div> : null),
                                 (body   ? <div class="-body"                      >{ body   }</div> : null),
                                 (footer ? <div class="-footer"                    >{ footer }</div> : null));
    }

    protected           formTitle(): string|null
    {
        return null;
    }
    protected           formHeader(): $JD.AddNode
    {
        let title = this.formTitle();
        if (title) {
            return <span class="-title">{ title }</span>;
        }

        return null;
    }
    protected           formBody(): $JD.AddNode
    {
        return null;
    }
    protected           formFooter(): $JD.AddNode
    {
        let buttons = this.formFooterButtons();

        if (buttons) {
            var footer = <div class="-buttons"/>;

            for(const button of buttons) {
                if (button) {
                    var b = <button class={button["class"]}>{ button.text }</button>;
                    b.bind("click", () => {
                                        if (typeof button.onclick === "function") {
                                            button.onclick.call(this);
                                        }
                                        else {
                                            this.closeForm(button.value);
                                        }
                                    });

                    footer.appendChild(b);
                }
            }

            return footer;
        }

        return null;
    }
    protected           formFooterButtons(): IDialogButton[]|null
    {
        return null;
    }
}

/**
 * !!DOC
 */
export interface IDialogMessageArgs
{
    title?:         string;
    message:        string|$JD.DOMHTMLElement;
    buttons?:       IDialogButton[];
}

/**
 * !!DOC
 */
export class DialogMessage extends Dialog<IDialogMessageArgs, string>
{
    public static       show(args: IDialogMessageArgs, ct:$JA.ICancellationToken)
    {
        return dialogShow(DialogMessage, args, ct);
    }

    protected get       contentClass(): string { return "-message"; }
    protected           formTitle(): string
    {
        return this.args.title || $JL.message_default_title;
    }
    protected           formBody(): $JD.DOMHTMLElement
    {
        const args = this.args;
        if (typeof args.message === "string") {
            return <div class="-message">{ $JD.multilineStringToContent(args.message) }</div>;
        } else {
            return args.message;
        }
    }
    protected           formFooterButtons(): IDialogButton[]
    {
        return this.args.buttons || [ std_button_ok ];
    }
    public              body_onkeydown(ev: KeyboardEvent) {
        if (ev.key === "Enter" && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
            ev.stopPropagation();
            this.closeForm("OK");
        }
    }
}

/**
 * !!DOC
 */
export class DialogConfirm extends Dialog<{title:string, message:string|$JD.DOMHTMLElement}, string>
{
    public static       show(title:string, message:string|$JD.DOMHTMLElement, ct:$JA.ICancellationToken)
    {
        return dialogShow(DialogConfirm,
                          {
                                title:     title,
                                message:   message,
                          }, ct);
    }

    protected get       contentClass(): string { return "-confirm"; }
    protected           formTitle(): string
    {
        return this.args.title || $JL.message_default_title;
    }
    protected           formBody(): $JD.DOMHTMLElement
    {
        const args = this.args;
        if (typeof args.message === "string") {
            return <div class="-message">{ $JD.multilineStringToContent(args.message) }</div>;
        } else {
            return args.message;
        }
    }
    protected           formFooterButtons(): IDialogButton[]
    {
        return [ std_button_no_error, std_button_yes ];
    }
    public              body_onkeydown(ev: KeyboardEvent) {
        if (ev.key === "Y" && !ev.altKey && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey) {
            ev.stopPropagation();
            this.closeForm("YES");
        }
        if (ev.key === "N" && !ev.altKey && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey) {
            ev.stopPropagation();
            this.closeForm("NO");
        }
    }
}

/**
 * !!DOC
 */
export class DialogError extends Dialog<string|Error|Error[]|$JD.DOMHTMLElement, void>
{
    public static       show(err: string|Error|Error[]|$JD.DOMHTMLElement, ct:$JA.ICancellationToken|null)
    {
        return dialogShow(DialogError, err, ct) as $JA.Task<void>;
    }

    protected get       contentClass(): string {
        return "-error";
    }
    protected           formTitle(): string {
        return $JL.errormessage_title;
    }
    protected           formBody(): $JD.DOMHTMLElement {
        return errorToContent(this.args);
    }
    protected           formFooterButtons(): IDialogButton[] {
        return [ { "class": "btn btn-ok", "text": $JL.btn_ok, "value": undefined } ];
    }

    public              body_onkeydown(ev: KeyboardEvent) {
        if (ev.key === "Escape" && !ev.altKey && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey) {
            ev.stopPropagation();
            this.closeForm(undefined);
        }
    }
}

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */

export abstract class AsyncContainer<TArgs> extends $JD.Container
{
    private             _activeTask:    IActiveTask|null;

    public              constructor(attrs?:$JD.HTMLAttributes)
    {
        super($JD.createElement("div", attrs));
        this._activeTask = null;
    }

    public              cancel(): $JA.Task<void>
    {
        if (this._activeTask) {
            const oldActiveTask = this._activeTask;
            return new $JA.Task((resolver) => {
                                    oldActiveTask.ct.cancel(new $JA.OperationCanceledError("Load cancelled by new load."));
                                    oldActiveTask.task.finally(resolver as () => void);
                                });
        } else {
            return $JA.Task.resolve();
        }
    }
    public              start(args:TArgs, ct?:$JA.ICancellationToken|null): $JA.Task<void>
    {
        const ctd     = new $JA.CancellationTokenDom(this._container, ct);
        ctd.throwIfCancelled();

        const task = this.cancel()
                         .then(() => {
                                    this._container.empty().addClass("-loading");
                                    return this.run(args, ctd);
                             })
                         .then((content) => {
                                    this._container.removeClass("-loading");
                                    if (content !== undefined) {
                                        this._container.empty().appendChild(content as $JD.AddNode);
                                    }
                               },
                               (err) => {
                                    if (!(err instanceof $JA.OperationCanceledError)) {
                                        this._container.empty()
                                                       .removeClass("-loading")
                                                       .appendChild(errorToContent(err));
                                    }
                                    throw err;
                               });

        this._activeTask = { task, ct: ctd };

        return task;
    }

    protected abstract  run(args:TArgs, ct:$JA.ICancellationToken|null): $JA.Task<$JD.AddNode>;
}
//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
export function normalizeUrlArgs(args:$J.IUrlArgs)
{
    let nargs = {} as $J.IUrlArgsInvariant;

    if (args instanceof Object) {
        if ($J.isIUrlArgsFunc(args)) {
            return args.toUrlArgs();
        }

        for (var key in args) {
            if (args.hasOwnProperty(key)) {
                var value = args[key];
                if (value !== undefined && value !== null) {
                    value = $J.valueToInvariant(value);

                    if (value !== null) {
                        nargs[key] = value;
                    }
                }
            }
        }
    }

    return nargs;
}

/**
 * !!DOC
 */
export function waitAnimationAsync<T>(elm: $JD.DOMHTMLElement, timeout:number, rtn:T)
{
    const animation = elm.css("animation");
    if (animation && !animation.startsWith("none ")) {
        return new $JA.Task<T>((resolve, reject, oncancel) => {
                                    elm.bind("animationstart", start);
                                    elm.bind("animationend",   done);
                                    let   timeoutid:number|null = $J.setTimeout(ontimeout, 500);

                                    function start() {
                                        if (timeoutid) {
                                            clearTimeout(timeoutid);
                                            timeoutid = $J.setTimeout(ontimeout, timeout);
                                        }
                                    }
                                    function done() {
                                        if (timeoutid) {
                                            clearTimeout(timeoutid);
                                            timeoutid = null;
                                        }
                                        elm.unbind("animationstart", start);
                                        elm.unbind("animationend",   done);
                                        resolve(rtn);
                                    }
                                    function ontimeout() {
                                        timeoutid = null;
                                        done();
                                    }
                            });
    } else {
        return $JA.Task.resolve(rtn);
    }
}

/**
 * !!DOC
 */
export function moveTracker(ev:UIEvent, initPos: $JD.IPosition, callback: (pos:$JD.IPosition)=>void, callbackdone?:()=>void) {
    let touch = ev.type === "touchstart";
    let eventCollection = new $J.EventCollection();

    if (validEvent(ev)) {
        var nulpoint = getEventPosition(ev);

        if (initPos) {
            nulpoint.top  -= initPos.top;
            nulpoint.left -= initPos.left;
        }
        eventCollection.bind<"touchmove"|"mousemove", UIEvent>($JD.window, (touch ? "touchmove" : "mousemove"), move);
        eventCollection.bind<"touchend"|"mouseup",    UIEvent>($JD.window, (touch ? "touchend"  : "mouseup"  ), stop);
    }

    function move(ev:UIEvent) {
        ev.stopPropagation();

        if (validEvent(ev)) {
            let pos = getEventPosition(ev);
            try {
                callback({
                    top:  pos.top  - nulpoint.top,
                    left: pos.left - nulpoint.left
                });
            }
            catch(e) {
                $J.globalError("moveTracker callback failed", e);
                stop();
            }
        }
        else
            stop();
    }

    function stop() {
        eventCollection.unbindAll();
        if (callbackdone) {
            callbackdone();
        }
    }

    function validEvent(ev:UIEvent): boolean {
        return touch ? ((ev as TouchEvent).touches.length === 1)
                     : ((ev as MouseEvent).buttons === 0 || (ev as MouseEvent).buttons === 1);
    }

    function getEventPosition(ev:UIEvent): $JD.IPosition
    {
        return (touch) ? { left: (ev as TouchEvent).touches[0].pageX, top: (ev as TouchEvent).touches[0].pageY }
                       : { left: (ev as MouseEvent).pageX,            top: (ev as MouseEvent).pageY                   };
    }
}

/**
 * !!DOC
 */
export function errorToContent(err:string|Error|Error[]|$JD.DOMHTMLElement): $JD.DOMHTMLElement
{
    if (err instanceof $JD.DOMHTMLElement) {
        return err;
    }

    let msgbody = <div class="jannesen-ui-content-error-message" />;

    if (typeof err === "string") {
        msgbody.appendChild(<div class="-message">{ $JD.multilineStringToContent(err as string) }</div>);
    } else {
        msgbody.appendChild(<div class="-message">{ $JD.multilineStringToContent(errorDescription(err)) } </div>);
        let details = <div class="-details"><span class="-header">Fout details:</span></div>;

        errorObjToError(details, err);
        msgbody.appendChild(details);
    }

    return msgbody;
}

//-------------------------------------------------------------------------------------------------
function errorDescription(err:any):string {
    if (Array.isArray(err) && err.length > 0) {
        return errorDescription(err[0]);
    }

    if (err instanceof Error) {
        return $JL.errorToText(err as Error);
    }

    return $JL.unknown_error;
}
function errorObjToError(body:$JD.DOMHTMLElement, err:any) {
    if (typeof err === "string") {
        body.appendChild(<div class="-error">{ err }</div>);
        return;
    }

    if (Array.isArray(err)) {
        err.forEach((e:any) => { errorObjToError(body, e); });
        return;
    }

    if (err instanceof Error) {
        body.appendChild(errorToMsg(err as Error));
        return;
    }

    body.appendChild("[UNKNONW ERROR]");
}
function errorToMsg(err:Error): $JD.DOMHTMLElement {
    let f                                               = false;
    let msg                                             = <div class="-error"/>;
    let serverErrorDetails:$J.IServerErrorDetails|null  = null;

    for(let e:Error|undefined=err ; e instanceof Error ; e = e.innerError) {
        if (e instanceof $J.ServerError) {
            serverErrorDetails = (e as $J.ServerError).serverError;
        }

        if (f)
            msg.appendChild(<br/>);
        else
            f = true;

        if (typeof e.message === "string")
            msg.appendChild($JD.multilineStringToContent(e.message));
    }

    if (serverErrorDetails && serverErrorDetails.detail) {
        for (var i = 0 ; i < serverErrorDetails.detail.length ; ++i) {
            if (f)
                msg.appendChild(<br/>);
            else
                f = true;

            msg.appendChild($JD.multilineStringToContent(serverErrorDetails.detail[i].message));
        }
    }

    return msg;
}

//-------------------------------------------------------------------------------------------------
/**
 * !!DOC
 */
function setDialogOnTop(dialogLoader: DialogLoader<any,any>|null)
{
    const dialogs = [] as { dialogloader: DialogLoader<any,any>, zindex:number }[];

    try {
        for (var c of $global.document.body.children) {
            const dl = $JD.getElementData(c, "contentloader");
            if (dl instanceof DialogLoader && dl !== dialogLoader) {
                dialogs.push({
                    dialogloader: dl,
                    zindex:       dl.container.css("z-index") || 0
                });
            }
        }

        dialogs.sort((a, b) => a.zindex - b.zindex);

        if (dialogLoader) {
            dialogs.push({
                dialogloader: dialogLoader,
                zindex: dialogLoader.container.css("z-index") || 0
            });
        }

        let zindex = 1000000;

        for (let i = 0; i < dialogs.length; ++i) {
            const d = dialogs[i];

            if (d.zindex !== zindex) {
                d.dialogloader.container.css("z-index", zindex);
            }

            d.dialogloader._setOnTop(i === dialogs.length - 1);
            zindex += 1000000;
        }
    }
    catch (e) {
        $J.globalError("setDialogOnTop failed.", e);
    }
}
function resetWindowFullscreen()
{
    try {
        for (let c of $JD.body.children) {
            if (c.hasClass("jannesen-ui-content") && c.hasClass("-fullscreen")) {
                return;
            }
        }

        $JD.body.removeClass("jannesen-ui-dialog-fullscreen");
    } catch (e) {
        $J.globalError("resetWindowFullscreen failed", e);
    }
}

//-------------------------------------------------------------------------------------------------
function window_onfocusin(ev:FocusEvent) {
    let target = ev.target;
    if (target instanceof HTMLElement) {
        if (target === $global.document.body) {
            for (var c of $global.document.body.children) {
                const dl = $JD.getElementData(c, "contentloader");
                if (dl instanceof DialogLoader) {
                    if (dl.isOnTop) {
                        dl.focus();
                        return;
                    }
                }
            }
        }

        let node:HTMLElement|null = target;
        while (node && node !== $global.document.body) {
            {
                const contentLoader = $JD.getElementData(node, "contentloader");
                if (contentLoader instanceof ContentLoader) {
                    contentLoader._onfocusin(target);
                    return;
                }
            }

            {
                const popup = $JD.getElementData(node, "popup");
                if (popup instanceof $JUP.Popup) {
                    const contentBody = getContentBody(popup.parentelm.element);
                    if (contentBody instanceof ContentBody) {
                        contentBody.loader._onfocusin(target);
                        return;
                    }
                }
            }
            node = node.parentElement;
        }
    }
}
function getContentBody(n:HTMLElement|null) {
    while (n && n !== $global.document.body) {
        const contentBody = $JD.getElementData(n, "contentbody");
        if (contentBody instanceof ContentBody) {
            return contentBody;
        }
        n = n.parentElement;
    }
    return null;
}

$JD.window.bind("focusin", window_onfocusin);

function nop()
{
}

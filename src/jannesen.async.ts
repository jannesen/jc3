/// <reference path="lib-ext.d.ts"/>
/// <reference path="../js/alameda.d.ts" />
import * as $J   from "jc3/jannesen";
import * as $JD  from "jc3/jannesen.dom";

export var  MimeType =
{
    Text:   "text/plain",
    Xml:    "text/xml",
    Json:   "application/json"
};

//=================================================================================================
// Task
//
interface Handler<T> {
    task:           Task<T>;
    onfulfilled?:   ((value: T)      => (any | PromiseLike<any>)) | undefined | null;
    onrejected?:    ((reason: Error) => (any | PromiseLike<any>)) | undefined | null;
    onfinally?:     () => void;
    slave?:         Task<any>;
}

function internalResolver(fulfill: (value: any) => void, reject: (reason: Error) => void) {/* no-op, sentinel value */ }

/**
 * !!DOC
 */
const enum TaskState
{
    Pending,
    Fulfilled,
    Rejected
}

/**
 * !!DOC
 */
export interface TaskInspection<T>
{
    readonly    isPending:      boolean;
    readonly    isFulfilled:    boolean;
    readonly    isRejected:     boolean;
    readonly    value:          T;
    readonly    reason:         Error;
}


/**
 * !!DOC
 */
export interface ITaskContext<T>
{
    task:       Task<T>;
    context:    Context;
}

//=============================================== Errors ==========================================
/**
 *!!DOC
 */
export class LoadError extends __Error
{
    constructor(message:string) {
        super("LoadError", message);
    }
}

/**
 *!!DOC
 */
export class OperationCanceledError extends __Error
{
    constructor(message?:string) {
        super("OperationCanceledError", message || "Operation canceled.");
    }
}

/**
 *!!DOC
 */
export class XMLHttpRequestFailed extends __Error
{
    constructor(message:string) {
        super("XMLHttpRequestFailed", message);
    }
}

/**
 *!!DOC
 */
export class TimeoutError extends __Error
{
    constructor(message?:string) {
        super("TimeoutError", message || "Timeout");
    }
}

/**
 *!!DOC
 */
export class BusyError extends __Error
{
    constructor(message:string) {
        super("BusyError", message);
    }
}

//=============================================== Context =========================================

interface IContextRegistrationObject
{
    obj:            Object;
    stopCallback?:  (reason: Error)=>void;
}

export interface IContextOptions
{
    parent?:        Context|null;
    component?:     Object;
    timeout?:       number;
    dom?:           $JD.DOMHTMLElement;
}

export interface IContextValues
{
}

export class Context
{
    private         _id:                    number;
    private         _parent:                Context|null|undefined;
    private         _component:             Object|undefined;
    private         _stopReason:            Error|null;
    private         _registrations:         IContextRegistrationObject[]|null;
    private         _timeout?:              number;
    private         _timer?:                number;
    private         _domelement?:           $JD.DOMHTMLElement;
    private         _domelementhandler?:    () => void;
    private         _values?:               any;
    private         _valueProxy?:           ProxyHandler<any>;

    public  get     parent()
    {
        return this._parent;
    }
    public  get     component()
    {
        return this._component;
    }
    public  get     isStopped():boolean
    {
        return !!this.stopReason;
    }
    public  get     stopReason():Error|null
    {
        if (this._stopReason) {
            return this._stopReason;
        }

        if (this._parent) {
            return this._stopReason = this._parent.stopReason;
        }

        if (this._timeout && this._timeout <= performance.now()) {
            return this._stopReason = new TimeoutError();
        }

        if (this._domelement && !this._domelement.isLive) {
            return this._stopReason = new OperationCanceledError();
        }

        return null;
    }
    public  get     values(): IContextValues
    {
        if (!this._valueProxy) {
            this._valueProxy = new Proxy(this._values = {} as any,
                               {
                                   get: (obj, prop) => {
                                            if (obj.hasOwnProperty(prop)) {
                                                return obj[prop];
                                            }

                                            let p = this._parent;
                                            while (p) {
                                                if (p._values) {
                                                    if (p._values.hasOwnProperty(prop)) {
                                                        return p._values[prop];
                                                    }
                                                }
                                                p = p._parent;
                                            }

                                            return undefined;
                                        }
                               });
        }

        return this._valueProxy!;
    }

                    constructor(opts:IContextOptions)
    {
        this._id            = $J.uniqueid();
        this._parent        = opts.parent;
        this._component     = opts.component;
        this._stopReason    = null;
        this._registrations = null;
        this._domelement    = opts.dom;
        this._timeout       = typeof opts.timeout === 'number' ? Math.round(performance.now() + opts.timeout) : undefined;
    }

    public          getcomponent<T>(type:new(...args:any)=>T)
    {
        let context = this._parent;

        while (context) {
            if (context._component instanceof type) {
                return context._component;
            }

            context = context.parent;
        }

        return undefined;
    }
    public          getrootcomponent<T>(type:new(...args:any)=>T)
    {
        let context    = this._parent;
        let rtn:T|undefined;

        while (context) {
            if (context._component instanceof type) {
                rtn = context._component;
            }

            context = context.parent;
        }

        return rtn;
    }
    public          register(obj:Object, stopCallback:(reason: Error)=>void)
    {
        if (!this._registrations) {
            this._registerDepend();
            this._registrations = [ {obj, stopCallback} ];
        } else {
            this._registrations.push({obj, stopCallback});
        }
    }
    public          unregister(obj:Object):void
    {
        let n = 0;
        if (this._registrations) {
            let i = 0;

            while (i < this._registrations.length) {
                if (this._registrations[i].obj === obj) {
                    ++n;
                    if (this._registrations.length > 1) {
                        this._registrations.splice(i, 1);
                    } else {
                        this._unregisterDepend();
                        this._registrations = null;
                        return;
                    }
                } else {
                    ++i;
                }
            }
        }

        console.assert(n === 1);
    }
    public          throwIfStopped()
    {
        const reason = this.stopReason;

        if (reason) {
            throw reason;
        }
    }
    public          stop(stopReason?:Error)
    {
        if (!this._stopReason) {
            if (!(stopReason instanceof Error)) {
                stopReason = new OperationCanceledError();
            }

            this._stopReason = stopReason;

            if (this._registrations) {
                const registrations = this._registrations.slice(0);
                for(let i = 0 ; i < registrations.length ; ++i) {
                    const registration = registrations[i];

                    try {
                        const cb = registration.stopCallback;
                        if (cb) {
                            registration.stopCallback = undefined;
                            cb.call(registration.obj, stopReason);
                        }
                    } catch(e) {
                        $J.globalError("Context.stopCallback failed.", e);
                    }
                }
            }
        }
    }

    private         _registerDepend()
    {
        if (this._parent) {
            this._parent.register(this, this.stop);
            this._stopReason = this._parent.stopReason;
        }

        if (this._timeout && !this._stopReason) {
            const t = this._timeout - performance.now();
            if (t <= 0) {
                this.stop(new TimeoutError());
            }
            else {
                this._timer = setTimeout(() => {
                                             this._timer = undefined;
                                             this.stop(new TimeoutError());
                                         }, t);
            }
        }

        if (this._domelement) {
            if (!this._domelement.isLive) {
                this.stop(new OperationCanceledError());
            }
            else {
                this._domelement.bind('RemovedFromDocument', this._domelementhandler = () => {
                                                                 this.stop(new OperationCanceledError());
                                                             });
            }
        }
    }
    private         _unregisterDepend()
    {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = undefined;
        }

        if (this._domelementhandler) {
            this._domelement!.unbind('RemovedFromDocument', this._domelementhandler);
            this._domelementhandler = undefined;
        }

        if (this._parent) {
            this._parent.unregister(this);
        }
    }

    public          toString()
    {
        return "Context#" + this._id;
    }
}

/**
 * !!DOC
 */
export class Task<T> implements Promise<T>,PromiseLike<T>,TaskInspection<T>
{
    private _id:                    number;
    private _state:                 TaskState;
    private _context:               Context|null;
    private _result:                T|Error|undefined;
    private _handlers:              Handler<any>[]|undefined;
    private _called:                boolean;
    private _cancelHandler:         ((reason: Error)=>void)|undefined;

    readonly [Symbol.toStringTag]: "Promise";

    /**
     * !!DOC
     */
                        constructor(executor: (resolver:  (value: T | PromiseLike<T>) => void,
                                               reject:    (reason: Error) => void,
                                               oncancel:  (handler:(reason: Error)=>void) => void) => void,
                                    context: Context|null)
    {
        this._id                = $J.uniqueid();
        this._state             = TaskState.Pending;
        this._context           = context;
        this._result            = undefined;
        this._handlers          = undefined;
        this._called            = false;
        this._cancelHandler     = undefined;

        if (typeof executor !== "function") {
            throw new $J.InvalidStateError("Task resolver is not a function");
        }

        if (executor === internalResolver) {
            return;
        }

        if (this._context) {
            this._context.register(this, this._stop);
        }

        try {
            executor((y) => {
                        if (!this._called) {
                            this._called = true;
                            this._resolve(y);
                        }
                     },
                     (r:any) => {
                        if (!this._called) {
                            this._called = true;
                            this._reject(r);
                        }
                    },
                    (action) => {
                        if (this._context) {
                            this._context.throwIfStopped();
                        }

                        if (typeof action === 'function' && !this._called) {
                            this._cancelHandler = action;
                        }
                    });
        } catch (e) {
            if (!this._called) {
                this._called = true;
                this._reject(e);
            }
        }
    }

    // Promise interfave
    /**
     * !!DOC
     */
    public              then<TResult1>                      (onfulfilled:  (value: T)       => (TResult1 | PromiseLike<TResult1>)): Task<TResult1>;
    public              then<TResult1>                      (onfulfilled:  (value: T)       => (TResult1 | PromiseLike<TResult1>|undefined)): Task<TResult1|undefined>;
    public              then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T)      => (TResult1 | PromiseLike<TResult1>)) | undefined | null,
                                                             onrejected?:  ((reason: Error) => (TResult2 | PromiseLike<TResult2>)) | undefined | null) : Task<TResult1 | TResult2>;
    public              then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T     ) => (TResult1 | PromiseLike<TResult1>)) | undefined | null,
                                                             onrejected?:  ((reason: Error) => (TResult2 | PromiseLike<TResult2>)) | undefined | null): Task<TResult1 | TResult2>
    {
        if (this._state === TaskState.Fulfilled && typeof onfulfilled !== "function" ||
            this._state === TaskState.Rejected && typeof onrejected !== "function") {
            // Optimization: handler is short-circuited, so pass the result (value/rejection)
            // through unmodified.
            // The typecast is safe, because we either have a fulfillment value
            // but no handler that could change the type, or a rejection without a
            // handler that could change it, so R === T in this case.
            return this as Task<any>;
        }

        // Construct new Task, but use subclassed constructor, if any
        var slave = new (this.constructor as any)(internalResolver) as Task<any>;
        if (slave._context) {
            slave._context.register(slave, slave._stop);
        }
        this._enqueue({ task:this, onfulfilled, onrejected, slave });
        return slave;
    }
    /**
     * !!DOC
     */
    public              catch<TResult = never>(onrejected?: ((reason: Error) => (TResult | PromiseLike<TResult>)) | undefined | null): Task<T | TResult>
    {
        return this.then(undefined, onrejected);
    }
    /**
     * !!DOC
     */
    public              finally(onfinally: () => void)
    {
        this._enqueue({ task:this,  onfinally });
        return this;
    }
    // Inspection interface
    /**
     * !!DOC
     */
    public  get         isPending()
    {
        return this._state === TaskState.Pending;
    }
    /**
     * !!DOC
     */
    public  get         isFulfilled()
    {
        return this._state === TaskState.Fulfilled;
    }
    /**
     * !!DOC
     */
    public  get         isRejected()
    {
        return this._state === TaskState.Rejected;
    }
    /**
     * !!DOC
     */
    public  get         value()
    {
        switch (this._state) {
        case TaskState.Fulfilled:   return this._result as T;
        case TaskState.Rejected:    throw this._result;
        default:                    throw new $J.InvalidStateError("Invalid task state " + this._state);
        }
    }
    /**
     * !!DOC
     */
    public  get         reason():Error
    {
        switch (this._state) {
        case TaskState.Rejected:    return this._result as Error;
        default:                    throw new $J.InvalidStateError("Invalid task state " + this._state);
        }
    }

    // Task interface
    /**
     * !!DOC
     */
    public static       all(values:(PromiseLike<void>|undefined)[]): Task<void>;
    public static       all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: [T1 | PromiseLike<T1>,T2 | PromiseLike<T2>,T3 | PromiseLike<T3>,T4 | PromiseLike<T4>,T5 | PromiseLike<T5>,T6 | PromiseLike<T6>,T7 | PromiseLike<T7>,T8 | PromiseLike<T8>,T9 | PromiseLike<T9>,T10 | PromiseLike<T10>]): Task<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
    public static       all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): Task<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
    public static       all<T1, T2, T3, T4, T5, T6, T7, T8>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): Task<[T1, T2, T3, T4, T5, T6, T7, T8]>;
    public static       all<T1, T2, T3, T4, T5, T6, T7>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): Task<[T1, T2, T3, T4, T5, T6, T7]>;
    public static       all<T1, T2, T3, T4, T5, T6>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): Task<[T1, T2, T3, T4, T5, T6]>;
    public static       all<T1, T2, T3, T4, T5>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>]): Task<[T1, T2, T3, T4, T5]>;
    public static       all<T1, T2, T3, T4>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]): Task<[T1, T2, T3, T4]>;
    public static       all<T1, T2, T3>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): Task<[T1, T2, T3]>;
    public static       all<T1, T2>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): Task<[T1, T2]>;
    public static       all<T1>(values: [T1 | PromiseLike<T1>]): Task<[T1]>;
    public static       all<T>(values:(T|PromiseLike<T>)[]): Task<T[]>;
    public static       all(values:any[]): Task<any>
    {
        if (values === null || values === undefined || values.length === 0) {
            return Task.resolve([]);
        }

        return new Task((resolved, reject, oncancel) => {
                let done:boolean[] = [];
                let rtn:any[]      = [];
                let rejected       = false;
                let reason:Error;
                let ndone          = 0;

                values.forEach((task, index) => {
                                                    if (isPromiseLike(task)) {
                                                        done[index] = false;
                                                        rtn[index]  = undefined;
                                                        (task as PromiseLike<any>).then((v)  => {
                                                                                            done[index] = true;
                                                                                            rtn[index] = v;
                                                                                            checkDone();
                                                                                        },
                                                                                        (r) => {
                                                                                            if (!rejected) {
                                                                                                rejected = true;
                                                                                                reason   = r;
                                                                                            }
                                                                                            done[index] = true;
                                                                                            checkDone();
                                                                                        });
                                                    } else {
                                                        done[index] = true;
                                                        rtn[index]  = task;
                                                        checkDone();
                                                    }
                                                });

                function checkDone() {
                    while (ndone < done.length && done[ndone]) {
                        if (++ndone >= done.length) {
                            if (!rejected) {
                                resolved(rtn);
                            } else {
                                reject(reason);
                            }
                            return;
                        }
                    }
                }
            }, null);
    }
    /**
     * !!DOC
     */
    public static       success<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(executor: (context: Context) => [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>], context: Context|null, timeout?: number): Task<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
    public static       success<T1, T2, T3, T4, T5, T6, T7, T8, T9>(executor: (context: Context) => [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>], context: Context|null, timeout?: number): Task<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
    public static       success<T1, T2, T3, T4, T5, T6, T7, T8>(executor: (context: Context) => [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>], context: Context|null, timeout?: number): Task<[T1, T2, T3, T4, T5, T6, T7, T8]>;
    public static       success<T1, T2, T3, T4, T5, T6, T7>(executor: (context: Context) => [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>], context: Context|null, timeout?: number): Task<[T1, T2, T3, T4, T5, T6, T7]>;
    public static       success<T1, T2, T3, T4, T5, T6>(executor: (context: Context) => [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>], context: Context|null, timeout?: number): Task<[T1, T2, T3, T4, T5, T6]>;
    public static       success<T1, T2, T3, T4, T5>(executor: (context: Context) => [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>], context: Context|null, timeout?: number): Task<[T1, T2, T3, T4, T5]>;
    public static       success<T1, T2, T3, T4>(executor: (context: Context) => [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>], context: Context|null, timeout?: number): Task<[T1, T2, T3, T4]>;
    public static       success<T1, T2, T3>(executor: (context: Context) => [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>], context: Context|null, timeout?: number): Task<[T1, T2, T3]>;
    public static       success<T1, T2>(executor: (context: Context) => [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>], context: Context|null, timeout?: number): Task<[T1, T2]>;
    public static       success<T1>(executor: (context: Context) => [T1 | PromiseLike<T1>], context: Context|null, timeout?: number): Task<[T1]>;
    public static       success<T>(executor: (context: Context) => (T | PromiseLike<T>)[], context: Context|null, timeout?: number): Task<T[]>;
    public static       success(executor: (context: Context) => any[], context: Context|null, timeout?: number): Task<any>
    {
        const successContext = new Context({ parent: context, timeout: timeout });

        let values:any[];
        try {
            values = executor(successContext);
        }
        catch(e) {
            return Task.reject(e);
        }

        if (values === null || values === undefined || values.length === 0) {
            return Task.resolve([]);
        }

        const task = new Task((resolved, reject, oncancel) => {
                                  let done:boolean[] = [];
                                  let rtn:any[]      = [];
                                  let rejected       = false;
                                  let reason:Error;
                                  let ndone          = 0;

                                  values.forEach((task, index) => {
                                                     if (isPromiseLike(task)) {
                                                         done[index] = false;
                                                         rtn[index]  = undefined;
                                                         (task as PromiseLike<any>).then((v)  => {
                                                                                             rtn[index] = v;
                                                                                             checkDone(index);
                                                                                         },
                                                                                         (r) => {
                                                                                             if (!rejected) {
                                                                                                 rejected = true;
                                                                                                 reason   = r;
                                                                                                 successContext.stop(r);
                                                                                             }
                                                                                             checkDone(index);
                                                                                         });
                                                     } else {
                                                         done[index] = true;
                                                         rtn[index]  = task;
                                                         checkDone(index);
                                                     }
                                                 });

                                  function checkDone(index:number) {
                                      done[index] = true;

                                      while (ndone < done.length && done[ndone]) {
                                          if (++ndone >= done.length) {
                                              if (!rejected) {
                                                  resolved(rtn);
                                              } else {
                                                  reject(reason);
                                              }
                                              return true;
                                          }
                                      }
                                      return false;
                                  }
                              }, null);

        return task;
    }
    /**
     * !!DOC
     */
    public static       race<T>(tasks: PromiseLike<T>[]): Task<T|undefined>
    {
        if (tasks === null || tasks === undefined || Task.length === 0) {
            return Task.resolve<T|undefined>(undefined);
        }

        return new Task<T|undefined>((resolved, reject) => {
                tasks.forEach((task) => {
                                   task.then((result) => { resolved(result); },
                                             (reason) => { reject(reason);   });
                              });
            }, null);
    }

    /**
     * !!DOC
     */
    public static       from<T>(o:Task<T>): Task<T>;
    public static       from<T>(o:PromiseLike<T>): Task<T>;
    public static       from<T>(o:Error):Task<void>;
    public static       from<T>(o:T):Task<T>;
    public static       from(o:any):Task<any>
    {
        if (o instanceof Task) {
            return o;
        }

        if (isPromiseLike(o)) {
            return new Task<any>((r,e) => o.then(r,e), null);
        }

        if (o instanceof Error) {
            return Task.reject(o);
        }

        return Task.resolve(o);
    }
    /**
     * !!DOC
     */
    public static       reject<T>(reason: Error)
    {
        let rtn = new Task<T>(internalResolver, null);
        rtn._state  = TaskState.Rejected;
        rtn._result = (reason instanceof Error) ? reason : new Error('' + reason);
        return rtn;
    }
    /**
     * !!DOC
     */
    public static       resolve(): Task<void>;
    public static       resolve<T>(value: T|PromiseLike<T>): Task<T>;
    public static       resolve<T>(value?: T|PromiseLike<T>)
    {
        let rtn = new Task<T>(internalResolver, null);

        if (isPromiseLike(value)) {
            if (rtn._context) {
                rtn._context.register(rtn, rtn._stop);
            }
            rtn._resolve(value as T|PromiseLike<T>);
        }
        else {
            rtn._state  = TaskState.Fulfilled;
            rtn._result = value;
        }
        return rtn;
    }

    private             _stop(reason: Error)
    {
        const cancelHandler = this._cancelHandler;
        if (cancelHandler) {
            this._cancelHandler = undefined;
            try {
                cancelHandler(reason);
            }
            catch(err) {
                $J.globalError("Task.cancelHandler failed.", err);
            }
        }
    }
    private             _followThenable(slave: PromiseLike<T>) {
        var called = false;
        try {
            slave.then((y): void => {
                            if (!called) {
                                called = true;
                                this._resolve(y);
                            }
                        },
                        (r: Error): void => {
                            if (!called) {
                                called = true;
                                this._reject(r);
                            }
                        }
                    );
        } catch (e) {
            if (!called) {
                called = true;
                this._reject(e);
            }
        }
    }
    private             _resolve(x: T|PromiseLike<T>)
    {
        if (this._state === TaskState.Pending) {
            if (isPromiseLike(x)) {
                if (this === x) {
                    this._reject(new $J.InvalidStateError("Cannot resolve Task to self"));
                    return;
                }

                try {
                    this._followThenable(x as PromiseLike<T>);
                } catch (e) {
                    this._reject(e);
                }
            }
            else {
                this._fulfill(x);
            }
        }
    }
    private             _fulfill(value: T)
    {
        if (this._state === TaskState.Pending) {
            this._state = TaskState.Fulfilled;
            this._result = value;
            this._flush();
        }
    }
    private             _reject(reason: any)
    {
        if (this._state === TaskState.Pending) {
            this._state = TaskState.Rejected;
            this._result = (reason instanceof Error) ? reason : new Error('' + reason);
            this._flush();
        }
    }
    private             _enqueue(h:Handler<any>)
    {
        if (this._state !== TaskState.Pending) {
            $J.runAsync(() => Task._unwrapper(h), true);
        } else {
            if (!this._handlers) {
                this._handlers = [ h ];
            } else {
                this._handlers.push(h);
            }
        }
    }
    private             _flush()
    {
        this._cancelHandler = undefined;

        if (this._context) {
            this._context.unregister(this);
        }

        if (this._handlers) {
            let handlers = this._handlers;
            this._handlers = undefined;
            for (let h of handlers) {
                Task._unwrapper(h);
            }
        }
    }

    private static      _unwrapper(handler: Handler<any>)
    {
        try {
            let task     = handler.task;
            let slave    = handler.slave;
            if (slave) {
                let callback = (task._state === TaskState.Fulfilled ? handler.onfulfilled : handler.onrejected) as ((x: any) => any);

                if (typeof callback === "function") {
                    try {
                        slave._resolve(callback(task._result));
                    } catch (e) {
                        slave._reject(e);
                    }
                } else {
                    if (task._state === TaskState.Fulfilled) {
                        slave._fulfill(task._result);
                    } else {
                        slave._reject(task._result);
                    }
                }
            } else {
                let callback = handler.onfinally;
                if (typeof callback === "function") {
                    try {
                        callback();
                    } catch (e) {
                        $J.globalError("Task.finally handler failed.", e);
                    }
                }
            }
        } catch (e) {
            $J.globalError("Task._unwrapper failed.", e);
        }
    }

    public              toString()
    {
        return "Task#" + this._id;
    }
}

function isPromiseLike<T>(o: any): o is PromiseLike<T>
{
    return (o instanceof Object && typeof o.then === 'function');
}
//=================================================================================================
// Task Ajax functions
//

/**
 * !!DOC
 */
export interface IAjaxArgs
{
    method?:                string;
    callargs?:              $J.IUrlArgs|null|void;
    url?:                   string;
    data?:                  Object|string|void;
    timeout?:               number;
}
export interface IAjaxArgsDelete
{
    method?:                "DELETE";
    callargs?:              $J.IUrlArgs|null;
    data?:                  Object|string|void;
    timeout?:               number;
}

/**
 * !!DOC
 */
export interface IAjaxCallDefinition<TCallArgs,TRequest,TResponse>
{
    method?:                string;
    methods?:               string[];
    callname?:              string;
    timeout?:               number;
    request_contenttype?:   string;
    response_contenttype?:  string;
    callargs_type?:         new () => TCallArgs;
    request_type?:          new () => TRequest;
    response_type?:         new () => TResponse;
    encoder_decoder?:       IAjaxEncoderDecoders;
    hook_before_send?:      (opts:IAjaxOpts)=>void;
    hook_after_received?:   (opts:IAjaxOpts, success:boolean, data:any)=>void;
}

/**
 * !!DOC
 */
export interface IAjaxCallDefinitionArgs<TCallArgs>
{
    request_contenttype?:   string;
    callargs_type:          new () => TCallArgs;
}

/**
 * !!DOC
 */
export interface IAjaxEncoderDecoders
{
    [ key:string ]: {
                            encoder:        (opts:IAjaxOpts, data:any) => any
                            decoder:        (opts:IAjaxOpts, xdr:XMLHttpRequest) => any
                    } | undefined;
}

/**
 * !!DOC
 */
export interface IAjaxOpts extends IAjaxArgs, IAjaxCallDefinition<any,any,any>
{
    method:         string;
    callname:       string;
    timeout:        number;
}

/**
 * !!DOC
 */
export var AjaxDefaults:IAjaxCallDefinition<void,void,void> = {
    method:                 "GET",
    request_contenttype:    MimeType.Json,
    response_contenttype:   MimeType.Json,
    timeout:                15000,
    encoder_decoder:        {
                                "application/json":     {
                                                            encoder:    function(opts: IAjaxOpts, data: any)
                                                                        {
                                                                            if (typeof data.toJSON === "function")
                                                                                data = data.toJSON();

                                                                            return JSON.stringify(data);
                                                                        },
                                                            decoder:    function(opts: IAjaxOpts, xdr: XMLHttpRequest)
                                                                        {
                                                                            var data = JSON.parse(xdr.responseText);

                                                                            if (xdr.status === 200) {
                                                                                if (typeof opts.response_type === 'function') {
                                                                                    let r = new (opts.response_type)();
                                                                                    r.parseJSON(data);
                                                                                    return r;
                                                                                }

                                                                                return data;
                                                                            } else {
                                                                                return (typeof data.code === 'string')
                                                                                                ? new $J.ServerError(data)
                                                                                                : undefined;
                                                                            }
                                                                        }
                                                        }
                            }
};

/**
 * !!DOC
 */
export type PickTypeFromInterface<T, K extends keyof T> = T[K];
export type AjaxCallArgsType<TCall extends IAjaxCallDefinition<any,any,any>>     = InstanceType<NonNullable<PickTypeFromInterface<TCall, "callargs_type">>>;
export type AjaxCallRequestType<TCall extends IAjaxCallDefinition<any,any,any>>  = InstanceType<NonNullable<PickTypeFromInterface<TCall, "request_type">>>;
export type AjaxCallResponseType<TCall extends IAjaxCallDefinition<any,any,any>> = InstanceType<NonNullable<PickTypeFromInterface<TCall, "response_type">>>;

/**
 * !!DOC
 */
export function Ajax<TCall extends IAjaxCallDefinition<any,any,any>>(callDefinitions:TCall|undefined, args: IAjaxArgs, context: Context|null): Task<AjaxCallResponseType<TCall>>
{
    let opts = $J.extend({}, args, callDefinitions, AjaxDefaults) as IAjaxOpts;

    return new Task<AjaxCallResponseType<TCall>>((resolve, reject, oncancel) => {
            var xhr:XMLHttpRequest;
            var xhr_done = false;

            oncancel(on_cancel);
            start();

            function start() {
                if (typeof opts.method !== 'string') {
                    throw new $J.InvalidStateError("Invaid AjaxCall missing method.");
                }

                if (opts.methods && !opts.methods.includes(opts.method)) {
                    throw new $J.InvalidStateError("Invaid AjaxCall missing method '" + opts.method + "' not allowed.");
                }

                if (typeof opts.timeout !== 'number') {
                    throw new $J.InvalidStateError("Invaid AjaxCall missing timeout.");
                }

                if (opts.url === undefined || opts.url === null) {
                    if (typeof opts.callname !== 'string')
                        throw new $J.InvalidStateError("Invaid AjaxCall missing callname.");

                    opts.url = $J.objectToUrlArgs(opts.callname, opts.callargs);
                }

                if (typeof opts.hook_before_send === "function") {
                    opts.hook_before_send(opts);
                }

                let contenttype  = opts.request_contenttype;
                var data:any     = null;

                if (opts.data !== undefined && opts.data !== null) {
                    if (opts.method === "GET")
                        throw new $J.InvalidStateError("Method 'GET' can't have data.");

                    if (typeof opts.request_contenttype !== 'string')
                        throw new $J.InvalidStateError("request_contenttype is undefined.");

                    data = encodeData(opts.data, opts.request_contenttype);
                    contenttype += "; charset=utf-8";
                } else {
                    if (opts.method !== "GET" && opts.method !== "DELETE")
                        data = "";
                }

                xhr = new XMLHttpRequest();
                xhr.timeout             = opts.timeout;
                xhr.onreadystatechange  = xhr_onreadystatechange;
                xhr.ontimeout           = xhr_ontimeout;

                xhr.open(opts.method, opts.url, true);

                if (data !== null) {
                    if (contenttype)
                        xhr.setRequestHeader("Content-Type", contenttype);

                    xhr.send(data);
                } else {
                    xhr.send();
                }
            }
            function xhr_onreadystatechange() {
                try {
                    if (xhr.readyState === 4 && !xhr_done) {
                        xhr_done = true;
                        if (xhr.status === 0)
                            reject(new XMLHttpRequestFailed("XMLHttpRequest failed."));
                        else
                            on_datareceived();
                    }
                } catch(e) {
                    $J.globalError("xhr.onreadystatechange handler failed.", e);
                }
            }
            function xhr_ontimeout() {
                try {
                    if (!xhr_done) {
                        xhr_done = true;
                        reject(new TimeoutError("Timeout"));
                    }
                } catch(e) {
                    $J.globalError("xhr.ontimeout handler failed.", e);
                }
            }
            function on_cancel(reason:Error) {
                xhr_done = true;
                xhr.abort();
                reject(reason);
            }
            function on_datareceived() {
                let rtn:any;

                try {
                    var contenttype = xhr.getResponseHeader("Content-Type");
                    if (contenttype) {
                        var i = contenttype.indexOf(";");
                        if (i > 0)
                            contenttype = contenttype.substr(0, i);
                    }

                    if (xhr.status === 200) {
                        if (contenttype === opts.response_contenttype) {
                            rtn = decodeData(xhr, contenttype);
                        } else {
                            if ((!contenttype && xhr.getResponseHeader('Content-Length') === "0") && (!opts.response_type || opts.method === 'DELETE')) {
                                rtn = undefined;
                            }
                            else {
                                rtn = new $J.AjaxError("DATA-ERROR", "Received '" + (contenttype || "[null]") + "' from server while expecting '" + opts.response_contenttype + "'.", opts);
                            }
                        }
                    }
                    else {
                        rtn = (contenttype === opts.response_contenttype) ? decodeData(xhr, contenttype) : undefined;
                        if (!(rtn instanceof Error)) {
                            rtn = new $J.AjaxError("HTTP-ERROR", "Receive error from server, status=" + xhr.status + ".", opts, xhr.status);
                            rtn.httpStatus =  (xhr.status || 0);
                        }
                    }
                } catch(e) {
                    rtn = new $J.AjaxError("DATA-ERROR", "Error while processing response.", opts, undefined, e);
                }

                try {
                    if (typeof opts.hook_after_received === "function")
                        opts.hook_after_received(opts, !(rtn instanceof Error), rtn);
                } catch(e) {
                    rtn = e;
                }

                if (rtn instanceof Error) {
                    reject(rtn);
                }
                else {
                    resolve(rtn);
                }
            }
            function encodeData(data:any, contenttype:string)
            {
                if (typeof data === "string")
                    return data;

                if (data instanceof Object) {
                    if (opts.encoder_decoder instanceof Object) {
                        const ed = opts.encoder_decoder[contenttype];
                        if (ed instanceof Object)
                            return ed.encoder(opts, data);
                    }

                    throw new $J.InvalidStateError("No encoder for '" + contenttype + "'.");
                }
                else
                    throw new $J.InvalidStateError("Invalid opts.data type " + (typeof data) + ".");
            }
            function decodeData(xdr:XMLHttpRequest, contenttype:string)
            {
                if (opts.encoder_decoder instanceof Object) {
                    const ed = opts.encoder_decoder[contenttype];
                    if (ed instanceof Object) {
                        return ed.decoder(opts, xdr);
                    }
                }

                throw new $J.InvalidStateError("No decoder for '" + contenttype + "'.");
            }
        }, context);
}

//=================================================================================================
// Task Delay functions
//

/**
 * !!DOC
 */
export function Delay(delay: number, context: Context|null)
{
    return new Task<void>((resolve, reject, oncancel) => {
            oncancel((reason) => {
                        clearTimeout(timer);
                        reject(reason);
                     });

            var timer = setTimeout(() => {
                                       resolve(undefined);
                                   }, delay);
        }, context);
}

//=================================================================================================
// Task Require functions
//

/**
 * !!DOC
 */
export type Module = { [ name:string]: any } | Function;

/**
 * !!DOC
 */
export function Require(modules: string,   context: Context|null): Task<Module>;
export function Require(modules: string[], context: Context|null): Task<Module[]>;
export function Require(modules: string|string[], context: Context|null): Task<any>
{
    return new Task<Module|Module[]>((resolve, reject, oncancel) => {
            oncancel((reason) => reject(reason));

            if (Array.isArray(modules)) {
                if (modules.length === 0) {
                    throw new $J.InvalidStateError("Argument error modules.length === 0.");
                }
                if (modules.every((n) => require.defined(n))) {
                    resolve(modules.map((n) => require(n)));
                } else {
                    require(modules, callback, errcallback);
                }
            } else {
                if (modules.length === 0) {
                    throw new $J.InvalidStateError("Argument error module === empty string.");
                }

                if (require.defined(modules)) {
                    resolve(require(modules));
                } else {
                    require([ modules ], callback, errcallback);
                }
            }

            function callback()
            {
                resolve(Array.isArray(modules) ? arguments : arguments[0]);
            }
            function errcallback(e:RequireError)
            {
                let sfailed = "";
                e.requireModules.forEach((n: string) => {
                        sfailed += (sfailed.length === 0 ? "'" : ", '") + n + "'";
                    });

                reject(new LoadError("Loading of module " + sfailed + " failed."));
            }
        }, context);
}

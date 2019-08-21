/// <amd-dependency path="jc3/jannesen.input" />
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $JA      from "jc3/jannesen.async";
import * as $JD      from "jc3/jannesen.dom";
import * as $JT      from "jc3/jannesen.datatype";
import * as $JUC     from "jc3/jannesen.ui.content";

$JD.onlocationhashready((hashargs:string) => {
    if (hashargs.substr(0, 2) === "#!") {
        $JD.body.empty().appendChild(new Content(hashargs.substr(2)));
    } else {
        $JD.body.empty().appendChild("ERROR: invalid URL, expect #!.");
    }
});

class Content implements $JD.IDOMContainer
{
    public      container:      $JD.DOMHTMLElement;
    private     _argv:          string[];
    private     _intnameparts:  string[];
    private     _intfaceobj:    any;
    private     _context:       $JA.Context;

    constructor(hasharg:string) {
        this.container = <div/>;
        this._argv         = hasharg.split('!');
        this._intnameparts = this._argv[0].split(':', 2);
        this._intfaceobj   = null;
        this._context      = new $JA.Context({ parent:null, component:this  });
        $JA.Require(this._intnameparts[0], this._context)
           .then((intfaceobj) => {
                     this.container.empty();
                     try {
                         if (!(intfaceobj instanceof Object)) {
                             throw new Error("Invalid interface file.");
                         }

                         this._intfaceobj = intfaceobj;
                         if (this._intnameparts.length===1) {
                             this._index();
                         }
                         if (this._intnameparts.length===2) {
                             let callopts = (intfaceobj as any)[this._intnameparts[1]];
                             if (!(callopts && callopts.callname)) {
                                 throw new Error("Unknown interface.");
                             }

                             this._call(callopts);
                         }
                     }
                     catch(err) {
                         this.container.appendChild("ERROR: " + err.message);
                     }
                 },
                 (err) => {
                     this.container.empty().appendChild("ERROR: Loading interface failed: " + err.message);
                 });

    }

    private     _index(): void {
        let index = [] as $JD.DOMHTMLElement[];
        let extarg = (this._argv.length>1) ? "!" + this._argv.slice(1).join("!") : "";
        Object.getOwnPropertyNames(this._intfaceobj).forEach((name) => {
            index.push(<a href={ location.pathname + "#!" + this._intnameparts[0] + ":" + name + extarg}>{ name }</a>);
            index.push(<br/>);
        });

        this.container.appendChild(<div>INDEX</div>, index);
    }

    private     _call(callDefinitions: $JA.IAjaxCallDefinition<any,any,any>): void {
        let     callcontent = <div/>;
        let     args: $JA.IAjaxArgs = {};

        if (callDefinitions.callargs_type) {
            args.callargs = new callDefinitions.callargs_type();

            if (this._argv.length > 1 && args.callargs instanceof $JT.Record) {
                args.callargs.parseUrlArgs(this._argv[1]);
            }

            callcontent.appendChild(<div>
                                        <h1>CALL ARGUMENTS</h1>
                                        { this._createInput(args.callargs as any as $JT.BaseType) }
                                    </div>);
        }

        if (callDefinitions.request_type) {
            args.data = new callDefinitions.request_type();

            callcontent.appendChild(<div>
                                        <h1>REQUEST ARGUMENTS</h1>
                                        { this._createInput(args.data as $JT.BaseType) }
                                    </div>);
        }

        let responsecontainer = <div/>;

        callcontent.appendChild(<button onclick={() => {
                                    $JA.Task.resolve()
                                            .then(() => args.callargs instanceof $JT.BaseType ? args.callargs.validateAsync({ context:null }) : $JT.ValidateResult.OK )
                                            .then((r) => r === $JT.ValidateResult.OK && args.data instanceof $JT.BaseType ? args.data.validateAsync({ context:null }) : r)
                                            .then(() => {
                                                        let response = <div>loading</div>;
                                                        responsecontainer.empty().appendChild(<h1>RESPONSE</h1>, response);

                                                        const responseContext = new $JA.Context({ parent:this._context, dom: response });
                                                        return $JA.Ajax(callDefinitions, args, responseContext)
                                                                  .then((data) => { response.empty().appendChild(this._createResponse(data)); });
                                                  })
                                            .catch((err) => {
                                                        if (err instanceof $JT.ValidateErrors && err.setFocusOnError()) {
                                                            return;
                                                        }

                                                        return $JUC.DialogError.show(err, this._context);
                                                    });
                                }}>CALL</button>);

        callcontent.appendChild(responsecontainer);

        this.container.appendChild(callcontent);
    }

    private     _createInput(data: $JT.BaseType): $JD.AddNode {
        try {
            if (data instanceof $JT.Record) {
                return this._createInputRecord(data as $JT.Record);
            }
            if (data instanceof $JT.Set) {
                return "Set Niet geimplementeerd";
            }
            if (data instanceof $JT.SimpleType) {
                return data.getControl();
            }
            return "[UNKNOWN DATATYPE]";
        } catch(e) {
            return $JUC.errorToContent(e);
        }
    }
    private     _createInputRecord(data: $JT.Record): $JD.AddNode {
        return <table>
                {
                    (data as $JT.Record).FieldNames.map((name) =>
                                                            <tr>
                                                                <td>{ name }</td>
                                                                <td>{ this._createInput((data as $JT.Record).field(name)) }</td>
                                                            </tr>
                                                        )
                }
                </table>;
    }

    private     _createResponse(data: $JT.BaseType) : $JD.AddNode {
        try {
            if (data instanceof $JT.Record) {
                return this._createResponseRecord(data);
            }
            if (data instanceof $JT.Set) {
                return this._createResponseSet(data as $JT.Set<any>);
            }
            if (data instanceof $JT.SimpleType) {
                return data.toDom();
            }
            return "[UNKNOWN DATATYPE]";
        } catch(e) {
            return $JUC.errorToContent(e);
        }
    }
    private     _createResponseRecord(data: $JT.Record): $JD.AddNode {
        if (data.fields !== null) {
            return <table class="response">
                   {
                        (data as $JT.Record).FieldNames.map((name) =>
                                                                <tr>
                                                                    <td class="name">{ name }</td>
                                                                    <td>{ this._createResponse((data as $JT.Record).field(name)) }</td>
                                                                </tr>
                                                            )
                   }
                   </table>;
        } else {
            return "[NULL RECORD]";
        }
    }
    private     _createResponseSet(data: $JT.Set<any>): $JD.AddNode {
        if (data.ItemDef.prototype instanceof $JT.Record) {
            return this._createResponseSetRecord(data, (data.ItemDef as any).FieldDef!);
        }

        return "Set.[UNKNOWN]";
    }
    private     _createResponseSetRecord(data: $JT.Set<any>, FieldDef: $JT.IFieldDef): $JD.AddNode {
        let fieldNames = Object.getOwnPropertyNames(FieldDef);

        return <table class="response">
                    <thead>
                        <tr>
                            { fieldNames.map((n) => <td class="name">{ n }</td>) }
                        </tr>
                    </thead>
                    <tbody>
                        {
                            data.map((rec) => <tr>
                                                { fieldNames.map((n) => <td>{ this._createResponse(rec.field(n)) }</td>) }
                                              </tr>)
                        }
                    </tbody>
                </table>;
    }
}

/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $JD      from "jc3/jannesen.dom";

export class CustomError extends Error
{
    public get name() { return "CustomError"; }

    constructor(message:string) {
        super(message);
    }

    public method() {
        return "method";
    }
}

export function main()
{
    $JD.ondomready(runtests);
}

function runtests()
{
    $JD.body.appendChild(<h1>Tests</h1>);
    $JD.body.appendChild(<table>
                            { test(() => (new Error("test")       instanceof Error        ), true)  }
                            { test(() => (new Error("test")       instanceof CustomError  ), false) }
                            { test(() => (new CustomError("test") instanceof Error        ), true)  }
                            { test(() => (new CustomError("test") instanceof CustomError  ), true)  }
                            { test(() => ((new CustomError("test")).method()              ), 'method')  }
                         </table>);
}

function test(test: ()=>any, exceptedResult:any)
{
    let result:string|undefined;
    let status:string;

    try {
        const r = test();

        switch(typeof r) {
        case "undefined":   result = "undefined";               break;
        case "object":      result = "undefined";               break;
        case "boolean":     result = (r ? 'true':'false');      break;
        case "number":      result = "number: " + r.toString(); break;
        case "string":      result = "string: " + r;            break;
        case "function":    result = "function";                break;
        }
        status = (r === exceptedResult) ? "OK" : "FAILED";
    }
    catch(e) {
        result = "Error: " + e.message;
        status = "FAILED";
    }

    return  <tr>
                <td>{test.toString()}</td>
                <td>{result}</td>
                <td>{status}</td>
            </tr>;
}

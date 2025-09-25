/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J  from "jc3/jannesen";
import * as $JA from "jc3/jannesen.async";
import * as $JD from "jc3/jannesen.dom";

export function start()
{
    $JD.ondomready(() => { $J.runAsync(main); });
}
export function main()
{
    const mainContext = new $JA.Context({ parent:null });
    $JD.body.appendChild(<h1 onclick={() => { mainContext.stop(); }}>Start</h1>);

    $JA.Task.success((context) => [ test1(context) ], mainContext, 10000)
            .then(() => { $JD.body.appendChild(<h1>Success</h1>); })
            .catch((e) => { $JD.body.appendChild(<h1>{ "Error: " + e.message }</h1>); });
}

function test1(context:$JA.Context): $JA.Task<void>
{
    return $JA.Task.race([ promise1(1000, "1a", context), promise1(500, "1b", context) ])
                   .then(() => $JA.Task.success((ct) => [ $JA.Require("jc3/jannesen.ui.content", ct), AjaxCall("data/async.json?x=1", ct), AjaxCall("data/async.json?x=2", ct) ], context, 5000))
                   .finally(() => $JD.body.appendChild(<p>========</p>))
                   .then((v) => promise1(1000, "2", new $JA.Context({ parent: context })))
                   .then(() => taskLoop(context))
                   .then(() => promise1(1000, "3", context))
                   .then(() => promise_error(1000, context))
                   .then(() => promise1(1000, "ERROR!", context));
}

async function promise1(delay:number, text:string, context:$JA.Context)
{
    for (let i = 0 ; i < 3 ; ++i) {
        await $JA.Delay(delay, context);
        $JD.body.appendChild(<p>{text}</p>);
    }
}

/*
function promise1(delay:number, text:string, context:$JA.Context): $JA.Task<void>
{
    var i = 0;

    return x();

    function x():$JA.Task<void> {
        return $JA.Delay(delay, context)
                  .then(() => {
                      $JD.body.appendChild(<p>{text}</p>);
                      if (++i < 3) {
                          return x();
                      }
                      else {
                          return undefined;
                      }
                  });
    }
}
*/

function promise_error(delay: number, context:$JA.Context)
{
    return new $JA.Task<void>((resolve, reject, oncancel) => {
            const timer = setTimeout(() => {
                            reject(new Error("promise_error"));
                        }, delay);
            oncancel(() => { clearTimeout(timer); });
        }, context);
}

function AjaxCall(url:string, context:$JA.Context)
{
    return $JA.Ajax<$JA.IAjaxCallDefinition<void, void, string>>(undefined, { url }, context)
              .then((d) => { $JD.body.appendChild(<p>{ JSON.stringify(d) }</p>); return d; });
}

function taskLoop(context:$JA.Context) {
    let count = 0;

    return new $JA.Task<void>((resolve, reject) => {
                                  loop();

                                  function loop() {
                                      if (count < 100) {
                                          ++count;
                                          $JA.Delay(0, context)
                                             .then(loop)
                                             .catch((e) => reject(e));
                                      } else {
                                          resolve(undefined);
                                      }
                                  }
                              }, null);
}

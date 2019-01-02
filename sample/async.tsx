/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $JA from "jc3/jannesen.async";
import * as $JD from "jc3/jannesen.dom";

export function main()
{
    $JD.ondomready(() => {
            let cancelationToken = new $JA.CancellationTokenSource();

            $JD.body.appendChild(<h1 onclick={() => { cancelationToken.cancel(); }}>Start</h1>);
            $JA.Task.success((ct) => [ test1(ct) ], cancelationToken, 15000)
                .then(() => { $JD.body.appendChild(<h1>Success</h1>); })
                .catch((e) => { $JD.body.appendChild(<h1>{ "Error: " + e.message }</h1>); });
        });
}

function test1(cancellationToken:$JA.ICancellationToken): $JA.Task<void>
{
    return $JA.Task.race([ promise1(1000, "1a", cancellationToken), promise1(500, "1b", cancellationToken) ])
                    .then(() => $JA.Task.success((ct) => [ $JA.Require("jc3/jannesen.ui.content", ct), AjaxCall("data/async.json?x=1", ct), AjaxCall("data/async.json?x=2", ct) ], cancellationToken, 5000))
                    .finally(() => $JD.body.appendChild(<p>========</p>))
                    .then((v) => promise1(1000, "2", new $JA.CancellationTokenSource(cancellationToken)))
                    .then(() => taskLoop(cancellationToken))
                    .then(() => promise1(1000, "3", cancellationToken))
                    .then(() => promise_error(1000, cancellationToken))
                    .then(() => promise1(1000, "ERROR!", cancellationToken));

}

async function promise1(delay:number, text:string, cancellationToken:$JA.ICancellationToken)
{
    for (var i = 0 ; i < 3 ; ++i) {
        await $JA.Delay(delay, cancellationToken);
        $JD.body.appendChild(<p>{text}</p>);
    }
}

/* Sorry TS limation whit strict
function promise1(delay:number, text:string, cancellationToken:$JA.ICancellationToken): $JA.Task<void>
{
    var i = 0;

    return x();

    function x():$JA.Task<void> {
        return $JA.Delay(delay, cancellationToken)
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

function promise_error(delay: number, cancellationToken:$JA.ICancellationToken)
{
    return new $JA.Task<void>((resolve, reject, oncancel) => {
            var timer = setTimeout(() => {
                            reject(new Error("promise_error"));
                        }, delay);
            oncancel(() => { clearImmediate(timer); });
        }, cancellationToken);
}

function AjaxCall(url:string, cancellationToken:$JA.ICancellationToken)
{
    return $JA.Ajax<$JA.IAjaxCallDefinition<void, void, string>>(undefined, { url: require.mapUrl(url) }, cancellationToken)
              .then((d) => { $JD.body.appendChild(<p>{ JSON.stringify(d) }</p>); return d; });
}

function taskLoop(cancellationToken:$JA.ICancellationToken) {
    let count = 0;

    return new $JA.Task<void>((resolve, reject) => {
        loop();

        function loop() {
            if (count < 100) {
                ++count;
                $JA.Delay(0, cancellationToken)
                    .then(loop)
                    .catch((e) => reject(e));
            } else {
                resolve(undefined);
            }
        }
    });


}

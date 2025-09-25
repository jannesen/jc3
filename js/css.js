define(function() {
    var head = document.getElementsByTagName('head')[0];

    var cssAPI = {};

    cssAPI.pluginBuilder = "jc/cssloader";

    cssAPI.normalize = function(name, normalize)
    {
        if (name.substr(name.length - 4, 4) == '.css')
            name = name.substr(0, name.length - 4);

        return normalize(name);
    }

    cssAPI.load = function(cssId, req, onloadcallback, config)
    {
        var link = document.createElement("link");
        link.type   = "text/css";
        link.rel    = "stylesheet";
        link.addEventListener("load",  onload);
        link.addEventListener("error", onerror);
        link.href  = req.toUrl(cssId + '.css');

        head.appendChild(link);


        function testloaded(n)
        {
            for(var i = 0 ; i < document.styleSheets.length ; ++i) {
                if (document.styleSheets[i].href === link.href) {
                    if (document.styleSheets[i].cssText && document.styleSheets[i].cssText.length === 0)
                        onloadcallback.error(new Error("Failed to load '" + link.href + "', no content in sheet"));
                    else
                        onloadcallback();

                    return;
                }
            }
            if (n > 25) {
                onloadcallback.error(new Error("Failed to load '" + link.href + "', can't find sheet."));
            } else {
                setTimeout(function() { testloaded(n+1); }, 10);
            }
        }

        function onload(n) {
            ondone();
            testloaded(0);
        }

        function onerror() {
            ondone();
            onloadcallback.error(new Error("Error loading '" + link.href + "'."));
        }

        function ondone() {
            link.removeEventListener("load",  onload);
            link.removeEventListener("error", onerror);
        }
    }

    return cssAPI;
});

﻿/* eslint smart-tabs: "on" */
var $build = require(process.env.BUILDJS);

var references = {
                    contrib:                "../.."
                };

var tsconfig =  {
                    "compilerOptions": {
                        "module":               "amd",
                        "target":               "es2017",
                        "noErrorTruncation":    true,
                        "noImplicitAny":        true,
                        "noImplicitThis":       true,
                        "strict":               true,
                        "preserveConstEnums":   false,
                        "noEmitHelpers":        true,
                        "removeComments":       true,
                        "jsx":                  "react",
                        "baseUrl":              ".",
                        "typeRoots":            [],
                        "paths":                        {
                                                            "jc3/*": [ "src/*" ]
                                                        }
                    },
                    "include": [
                            "jc3/*",
                            "sample/*",
                            "test/*",
                            "tools/*"
                        ],
                };

var tslint =    {
                    "rules": {
                        "forin":                    true,
                        "label-position":           true,
                        "no-arg":                   true,
                        "no-console":               [ true, "debug", "info", "time", "timeEnd", "trace" ],
                        "no-construct":             true,
                        "no-debugger":              true,
                        "no-duplicate-variable":    true,
                        "no-eval":                  true,
                        "no-trailing-whitespace":   true,
                        "no-unused-expression":     true,
                        "no-unused-variable":       true,
                        "radix":                    true,
                        "no-internal-module":       true,
                        "no-unsafe-finally":        true,
                        "no-var-keyword":           false,      // In de toekomst aanpassen al sources zijn bijgewerkt
                        "semicolon":                [ true, "always" ],
                        "triple-equals":            [ true, "allow-null-check" ]
                    }
                };

$build.write_file(__dirname+"/tsconfig.json", "// This file is generated by buildjsfile\n" + JSON.stringify(tsconfig, null, 4), true);

$build.build(
{
    global:     {
                    paths:          references,
                    src_path:       __dirname,
                    dst_path:       "www",
                    sourcemap_path: "../.."
                },
    sass:       [{
                    src:        [ "@(sample|test|tools)/*.scss", "!**/_*.scss", "!**/_scss/*.scss" ]
                }],
    typescript: [{
                    src:        [
                                    { base: "src",    pattern: "*@(.ts|.tsx)", target: "lib/js" },
                                    { base: "sample", pattern: "*@(.ts|.tsx)", target: "sample" },
                                    { base: "test",   pattern: "*@(.ts|.tsx)", target: "test"   },
                                    { base: "tools",  pattern: "*@(.ts|.tsx)", target: "tools"  }
                                ],
                    tsconfig:   tsconfig,
                    tslint:     tslint
                }],
    js:         [{
                    src:        [ "js/*.js" ],
                    dst:        "lib/"
                }],
    copy:       [{
                    src:        [
                                  { base: ".",                                          pattern: [ "@(sample|test|tools)/**/*@(.html|.json)", "!tsconfig.json", "!tslint.json" ]},
                                  { base: "$contrib/FontAwesome/font-awesome-4.4.0",    pattern: "*@(.woff)", target: "lib/font" }
                                ]
                }]
});

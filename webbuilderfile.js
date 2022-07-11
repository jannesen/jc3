var $build = require(process.env.BUILDJS);

var references = {
                    contrib:                "../..",
                    FontAwesome:            "../../FontAwesome/font-awesome-5.8.2"
                };

var tsconfig =  {
                    "compilerOptions": {
                        "module":                       "amd",
                        "target":                       "es2018",
                        "noErrorTruncation":            true,
                        "noImplicitAny":                true,
                        "noImplicitThis":               true,
                        "noUnusedLocals":               true,
                        "noUnusedParameters":           false,
                        "useUnknownInCatchVariables":   false,
                        "strict":                       true,
                        "preserveConstEnums":           false,
                        "noEmitHelpers":                true,
                        "removeComments":               true,
                        "declaration":                  true,
                        "jsx":                          "react",
                        "baseUrl":                      ".",
                        "typeRoots":                    [],
                        "paths":                        {
                                                            "jc3/*": [ "src/*" ]
                                                        }
                    },
                    "include": [
                            "src/*",
                            "sample/*",
                            "test/*",
                            "tools/*"
                        ]
                };

var eslint = {
    "rules": {
        // Disable eslint with typescript-eslint replacements
        "no-duplicate-imports": "off",
        "no-unused-expressions": "off",
        "semi": "off",
        "space-before-function-paren": "off",

        // eslint
        "brace-style": "off",
        "constructor-super": "error",
        "eqeqeq": [ "error", "smart" ],
        "guard-for-in": "error",
        "linebreak-style": ["error", "windows"],
        "new-parens": "error",
        "no-caller": "error",
        "no-console": [ "error", { "allow": [ "log", "warn", "assert", "error", "Console", "timeStamp" ] } ],
        "no-debugger": "error",
        "no-duplicate-case": "error",
        "no-empty": ["error", {"allowEmptyCatch": true }],
        "no-eval": "error",
        "no-extra-bind": "error",
        "no-fallthrough": ["error", { "commentPattern": "fall[\\s\\w]*tru" }],
        "no-new-wrappers": "error",
        "no-return-await": "error",
        "no-sparse-arrays": "error",
        "no-template-curly-in-string": "error",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-unsafe-finally": "error",
        "no-unused-expressions": "error",
        "no-unused-labels": "error",
        "prefer-object-spread": "error",
        "radix": "error",
        "unicode-bom": ["error", "always"],
        "use-isnan": "error",
        //"curly": ["error", "multi-line"],
        //"dot-notation": "error",
        //"no-new-func": "error",
        //"no-restricted-globals": ["error",
        //    { "name": "setTimeout" },
        //    { "name": "clearTimeout" },
        //    { "name": "setInterval" },
        //    { "name": "clearInterval" },
        //    { "name": "setImmediate" },
        //    { "name": "clearImmediate" }
        //],
        //"no-var": "error",
        //"prefer-const": "error",
        //"quote-props": ["error", "consistent-as-needed"],

        // @typescript-eslint
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/semi": [ "error", "always" ],

        "@typescript-eslint/no-duplicate-imports": "error",
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/no-misused-new": "error",
        //"@typescript-eslint/array-type": "error",
        //"@typescript-eslint/consistent-type-definitions": ["error", "interface"],
        //"@typescript-eslint/no-inferrable-types": "error",
        //"@typescript-eslint/no-redeclare": "error",
        //"@typescript-eslint/prefer-function-type": "error",
        //"@typescript-eslint/space-before-function-paren": ["error", {"asyncArrow": "always", "anonymous": "always", "named": "never" }],
        //"@typescript-eslint/triple-slash-reference": "error",
        //"@typescript-eslint/unified-signatures": "error",
       
        // eslint-plugin-import
        "import/no-extraneous-dependencies": ["error", { "optionalDependencies": false }],

        // eslint-plugin-jsdoc
        "jsdoc/check-alignment": "error"
    }
}

if (!$build.args.release) {
    $build.writeTextFile(__dirname+"/tsconfig.json", "// This file is generated by buildjsfile\n" + JSON.stringify(tsconfig, null, 4), true);
}

$build.build(
{
    global:     {
                    paths:          references,
                    src_path:       __dirname,
                    dst_path:       "output",
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
                    eslint:     eslint
                }],
    js:         [{
                    src:        [ "js/*.js" ],
                    dst:        "lib/"
                }],
    copy:       [{
                    src:        [
                                  { base: ".",                                                   pattern: [ "@(sample|test|tools)/**/*@(.html|.json)", "!tsconfig.json", "!tslint.json" ]},
                                  { base: "$contrib/FontAwesome/font-awesome-5.8.2/webfonts",    pattern: "*@(.woff|.woff2)", target: "lib/font" }
                                ]
                }]
});

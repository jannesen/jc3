"use strict;";
///////////////////////////////////////////////////////////////////////////////////////////////////
// Polyfills
//

if (window.console === undefined) {
    window.console = {
        log:    function() {},
        error:  function() {},
        assert: function() {}
    };
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// Typescript
//
var __extends = (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var $global = {
    window:     window,
    document:   document,
    String:     String,
    Date:       Date,
    Number:     Number
};

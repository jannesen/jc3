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

var __Error = (function () {
    __extends(__Error, Error);
    function __Error(name, message) {
        this.name = name;
        this.message = message;
        this.stack = Error().stack;
    }
    __Error.prototype.toMessageString = function () {
        return '[' + this.name + ']: ' + this.message;
    };
    __Error.prototype.toString = function () {
        return this.message;
    };
    return __Error;
}());

var $global = {
    window:     window,
    document:   document,
    String:     String,
    Date:       Date,
    Number:     Number
};

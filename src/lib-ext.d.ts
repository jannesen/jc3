/* tslint:disable:interface-name */

interface Error
{
    innerError?:    Error;
}

interface __Error extends Error
{
    toMessageString():      string;
}

interface __ErrorConstructor {
    new(name:string, message?: string): __Error;
    (name:string, message?: string): __Error;
    readonly prototype: __Error;
}

declare const __Error: __ErrorConstructor;

declare const $global: {
    window:         Window;
    document:       Document;
    String:         StringConstructor;
    Date:           DateConstructor;
    Number:         NumberConstructor;
};

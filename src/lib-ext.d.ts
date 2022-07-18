/* tslint:disable:interface-name */

interface Error
{
    innerError?:        Error;
}

declare const $global: {
    window:         Window;
    document:       Document;
    String:         StringConstructor;
    Date:           DateConstructor;
    Number:         NumberConstructor;
};

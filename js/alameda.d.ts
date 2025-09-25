interface RequireError extends Error
{
    requireType: string;
    requireModules: string[];
    originalError: Error;
}

interface Require
{
    (module: string): any;
    (modules: string[]): Promise<any[]>;
    (modules: string[], ready: Function): Promise<void>;
    (modules: string[], ready: Function, errback: Function): void;
    defined(module: string): boolean;
}

declare var require: Require;

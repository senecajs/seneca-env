type KV = Record<string, any>;
type EnvOptions = {
    file?: string | string[];
    var?: KV | ((valid: any) => KV);
    process?: {
        env: KV;
    };
    debug: boolean;
};
declare function env(this: any, options: EnvOptions): {
    exports: {
        injectVars: (src: any) => any;
    };
};
declare namespace env {
    var defaults: ({ valid }: {
        valid: any;
    }) => {
        var: any;
        file: any;
        process: any;
        debug: boolean;
    };
}
declare const Intern: {
    isMissingModule: (err: any, modulePath: string) => boolean;
    makeCustomShapeBuilders: (valid: any) => Record<string, any>;
};
export { Intern };
export default env;

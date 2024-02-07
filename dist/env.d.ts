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
    var defaults: {
        var: import("gubu").Node<unknown>;
        file: import("gubu").Node<unknown>;
        process: import("gubu").Node<{
            env: import("gubu").Node<{}>;
        }>;
        debug: boolean;
    };
}
declare const Intern: {
    customShapeBuilders: Record<string, any>;
};
export { Intern };
export default env;

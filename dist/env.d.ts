import { Builder } from 'gubu';
declare type KV = Record<string, any>;
declare type EnvOptions = {
    var?: KV | ((valid: any) => KV);
    process?: {
        env: KV;
    };
};
declare function env(this: any, options: EnvOptions): void;
declare namespace env {
    var defaults: {
        var: import("gubu").Node & {
            [name: string]: any;
        };
        process: import("gubu").Node & {
            [name: string]: any;
        };
        debug: boolean;
    };
}
declare const Intern: {
    customShapeBuilders: Record<string, Builder>;
};
export { Intern };
export default env;

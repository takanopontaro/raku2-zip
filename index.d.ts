export declare type TInfo = {
    path: string;
    byte: number;
    done: boolean;
};
export declare type TCallback = (info: TInfo) => void;
declare const _default: (cwd: string, paths: string[], dest: string, cb?: TCallback | undefined) => Promise<TInfo>;
export default _default;

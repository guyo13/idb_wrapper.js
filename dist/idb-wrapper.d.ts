import { IDBWrapperArgs, IndexConfig, KeyRangeSettings } from './types';
export default class IDBWrapper {
    #private;
    constructor(args: IDBWrapperArgs);
    private initialize;
    wait(): Promise<any>;
    get isReady(): boolean;
    get isPersistentStorage(): boolean;
    static get indexedDBFactory(): IDBFactory;
    static get indexedDbKeyRange(): {
        new (): IDBKeyRange;
        prototype: IDBKeyRange;
        bound(lower: any, upper: any, lowerOpen?: boolean | undefined, upperOpen?: boolean | undefined): IDBKeyRange;
        lowerBound(lower: any, open?: boolean | undefined): IDBKeyRange;
        only(value: any): IDBKeyRange;
        upperBound(upper: any, open?: boolean | undefined): IDBKeyRange;
    };
    getObjectStore(objectStoreName: string, mode?: IDBTransactionMode): IDBObjectStore;
    getIndex(objectStoreName: string, indexName: string, mode?: IDBTransactionMode): IDBIndex;
    openIndexCursor(objectStoreName: string, indexName: string, keyRangeSettings: KeyRangeSettings, mode: IDBTransactionMode): Promise<any>;
    openCursor(objectStoreName: string, keyRangeSettings: KeyRangeSettings, mode: IDBTransactionMode): Promise<any>;
    static createIndex(objectStore: IDBObjectStore, index: IndexConfig): IDBIndex;
    static createKeyRange: (keyRangeSettings: KeyRangeSettings) => IDBKeyRange;
}
export * from './types';
//# sourceMappingURL=idb-wrapper.d.ts.map
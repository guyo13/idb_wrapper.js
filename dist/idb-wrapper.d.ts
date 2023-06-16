import type { IDBCursorWithTypedValue, IDBWrapperArgs, IndexConfig, KeyRangeSettings, StoreConfig } from './types';
export default class IDBWrapper {
    #private;
    constructor(args: IDBWrapperArgs);
    private initialize;
    wait(): Promise<void>;
    get isReady(): boolean;
    get isPersistentStorage(): boolean;
    get idbInstance(): IDBDatabase | undefined;
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
    openIndexCursor<T>(objectStoreName: string, indexName: string, mode: IDBTransactionMode, keyRangeSettings?: KeyRangeSettings): Promise<IDBCursorWithTypedValue<T>>;
    openCursor<T>(objectStoreName: string, mode: IDBTransactionMode, keyRangeSettings?: KeyRangeSettings): Promise<IDBCursorWithTypedValue<T>>;
    static createIndex(objectStore: IDBObjectStore, index: IndexConfig): IDBIndex;
    static createIndexes(objectStore: IDBObjectStore, indexesObj: IndexConfig[]): {
        error?: any;
    } | undefined;
    static initializeStore(indexedDB: IDBDatabase, storeConfig: StoreConfig): IDBObjectStore;
    static createKeyRange: (keyRangeSettings: KeyRangeSettings) => IDBKeyRange;
}
export * from './types';
//# sourceMappingURL=idb-wrapper.d.ts.map
declare global {
    interface Window {
        mozIndexedDB?: IDBFactory;
        webkitIndexedDB?: IDBFactory;
        msIndexedDB?: IDBFactory;
        webkitIDBKeyRange?: IDBKeyRange;
        msIDBKeyRange?: IDBKeyRange;
    }
}
export interface IDBWrapperInterface {
    getObjectStore(objectStoreName: string, mode: IDBTransactionMode): IDBObjectStore;
    getIndex(objectStoreName: string, indexName: string, mode: IDBTransactionMode): IDBIndex;
    openIndexCursor<T>(objectStoreName: string, indexName: string, mode: IDBTransactionMode, consumer: CursorConsumer<T>, keyRangeSettings: KeyRangeSettings): Promise<void>;
    openCursor<T>(objectStoreName: string, mode: IDBTransactionMode, consumer: CursorConsumer<T>, keyRangeSettings: KeyRangeSettings): Promise<void>;
    getAll<T>(storeName: string): Promise<T[] | null>;
    get<T>(storeName: string, query: IDBValidKey | IDBKeyRange): Promise<T | null>;
    add<T>(storeName: string, object: T): Promise<void>;
    put<T>(storeName: string, object: T): Promise<void>;
    delete(storeName: string, query: IDBValidKey | IDBKeyRange): Promise<void>;
}
/** A typed version of a DOM EventTarget object. */
export interface TypedEventTarget<T> extends EventTarget {
    result: T;
}
/** A typed version of an IndexedDB Cursor-With-Value object. */
export interface IDBCursorWithTypedValue<T> extends IDBCursorWithValue {
    /** Returns the cursor's current value. */
    readonly value: T;
}
/** Represents an IndexedDB Cursor event whose result is a typed IndexedDB Cursor with value.  */
export interface CursorEventWithValue<T> extends Event {
    target: TypedEventTarget<IDBCursorWithTypedValue<T>>;
}
/** Represents an IndexedDB Event whose result is an IDBCursor. */
export interface CursorEvent extends Event {
    target: TypedEventTarget<IDBCursor>;
}
export interface IDBWrapperArgs {
    dbName: string;
    dbVersion: number;
    upgradeHandler: IDBUpgradeHandler;
    persistent: boolean;
}
export interface IndexConfig {
    name: string;
    kp: string | Array<string>;
    options: IDBIndexParameters;
}
export interface StoreConfig {
    readonly name: string;
    readonly keyPath: string | string[];
    readonly autoIncrement: boolean;
    readonly indices: IndexConfig[];
}
export interface KeyRangeSettings {
    queryType: IDBQueryType;
    direction: IDBCursorDirection;
    lowerKeyPath: IDBValidKey;
    lowerExclusive?: boolean;
    upperExclusive?: boolean;
    upperBoundKeyPath?: IDBValidKey;
}
export type IDBUpgradeHandler = (this: IDBWrapperInterface, ev: IDBVersionChangeEvent, db: IDBDatabase) => void;
export type CursorConsumer<T> = (arg: T) => void;
export declare enum IDBQueryType {
    Only = 0,
    Bound = 1,
    LowerBound = 2,
    UpperBound = 3
}
export declare enum IDBTransactionModes {
    Readonly = "readonly",
    Readwrite = "readwrite",
    VersionChange = "versionchange"
}
//# sourceMappingURL=types.d.ts.map
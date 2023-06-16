// Copyright (c) 2022, Guy Or Please see the AUTHORS file for details.
// All rights reserved. Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

declare global {
    interface Window {
        mozIndexedDB?: IDBFactory
        webkitIndexedDB?: IDBFactory
        msIndexedDB?: IDBFactory
        webkitIDBKeyRange?: IDBKeyRange
        msIDBKeyRange?: IDBKeyRange
    }
}

export interface IDBWrapperInterface {
    getObjectStore(
        objectStoreName: string,
        mode: IDBTransactionMode
    ): IDBObjectStore

    getIndex(
        objectStoreName: string,
        indexName: string,
        mode: IDBTransactionMode
    ): IDBIndex

    openIndexCursor<T>(
        objectStoreName: string,
        indexName: string,
        mode: IDBTransactionMode,
        keyRangeSettings?: KeyRangeSettings
    ): Promise<IDBCursorWithTypedValue<T>>

    openCursor<T>(
        objectStoreName: string,
        mode: IDBTransactionMode,
        keyRangeSettings?: KeyRangeSettings
    ): Promise<IDBCursorWithTypedValue<T>>
}

/** Represents an event target whose result has a specific type. */
export interface TypedEventTarget<T> extends EventTarget {
    result: T
}

/** Represents an IndexedDB Cursor with value whose value has a specfic type. */
export interface IDBCursorWithTypedValue<T> extends IDBCursorWithValue {
    /** Returns the cursor's current value. */
    readonly value: T
}

/** Represents an IndexedDB Cursor event whose result is a typed IndexedDB Cursor with value.  */
export interface CursorEventWithValue<T> extends Event {
    target: TypedEventTarget<IDBCursorWithTypedValue<T>>
}

/** Represents an IndexedDB Event whose result is an IDBCursor. */
export interface CursorEvent extends Event {
    target: TypedEventTarget<IDBCursor>
}

export interface IDBWrapperArgs {
    dbName: string
    dbVersion: number
    upgradeHandler: IDBUpgradeHandler
    persistent: boolean
}

export interface IndexConfig {
    name: string
    kp: string | Array<string>
    options: IDBIndexParameters
}

export interface StoreConfig {
    readonly name: string
    readonly keyPath: string | string[]
    readonly autoIncrement: boolean
    readonly indices: IndexConfig[]
}

export interface KeyRangeSettings {
    queryType: IDBQueryType
    direction: IDBCursorDirection
    lowerKeyPath: IDBValidKey
    lowerExclusive?: boolean
    upperExclusive?: boolean
    upperBoundKeyPath?: IDBValidKey
}

export type IDBUpgradeHandler = (
    this: IDBWrapperInterface,
    ev: IDBVersionChangeEvent,
    db: IDBDatabase
) => void

export enum IDBQueryType {
    Only = 0,
    Bound = 1,
    LowerBound = 2,
    UpperBound = 3,
}

export enum IDBTransactionModes {
    Readonly = 'readonly',
    Readwrite = 'readwrite',
    VersionChange = 'versionchange',
}

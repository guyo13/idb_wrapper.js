// Copyright (c) 2022, Guy Or Please see the AUTHORS file for details.
// All rights reserved. Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

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

    openIndexCursor(
        objectStoreName: string,
        indexName: string,
        keyRangeSettings: KeyRangeSettings,
        mode: IDBTransactionMode
    ): Promise<any>

    openCursor(
        objectStoreName: string,
        keyRangeSettings: KeyRangeSettings,
        mode: IDBTransactionMode
    ): Promise<any>
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
export interface KeyRangeSettings {
    queryType: IDBQueryType
    direction: IDBCursorDirection
    lowerKeyPath: any
    lowerExclusive?: boolean
    upperExclusive?: boolean
    upperBoundKeyPath?: any
}

export type IDBUpgradeHandler = (
    this: IDBWrapperInterface,
    ev: IDBVersionChangeEvent,
    db: IDBDatabase
) => any

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

declare global {
    interface Window {
        mozIndexedDB?: IDBFactory
        webkitIndexedDB?: IDBFactory
        msIndexedDB?: IDBFactory
        webkitIDBKeyRange?: IDBKeyRange
        msIDBKeyRange?: IDBKeyRange
    }
}

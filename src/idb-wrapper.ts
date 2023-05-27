// Copyright (c) 2022, Guy Or Please see the AUTHORS file for details.
// All rights reserved. Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

import {
    IDBWrapperArgs,
    IndexConfig,
    IDBQueryType,
    KeyRangeSettings,
    StoreConfig,
    CursorEventWithValue,
    IDBCursorWithTypedValue,
} from './types'

export default class IDBWrapper {
    #indexedDB?: IDBDatabase
    #initialization: Promise<any>
    #ready: boolean
    #isPersistent: boolean

    constructor(args: IDBWrapperArgs) {
        this.#ready = false
        this.#isPersistent = false
        this.#initialization = this.initialize(args)
    }

    private initialize(args: IDBWrapperArgs): Promise<any> {
        const { dbName, dbVersion, upgradeHandler, persistent = false } = args

        return new Promise(async (resolve, reject) => {
            if (persistent) {
                try {
                    this.#isPersistent = await navigator.storage.persisted()
                    if (!this.#isPersistent) {
                        this.#isPersistent = await navigator.storage.persist()
                    }
                } catch (error) {
                    this.#isPersistent = false
                }
            }

            const idbFactory = IDBWrapper.indexedDBFactory
            if (!idbFactory) {
                this.#ready = false
                return reject({ error: 'IndexedDB not supported' })
            }
            const dbOpenReq: IDBOpenDBRequest = idbFactory.open(
                dbName,
                dbVersion
            )
            dbOpenReq.onupgradeneeded = (upgradeEvent) => {
                this.#indexedDB = dbOpenReq.result
                this.#ready = true
                upgradeHandler?.bind(this)(upgradeEvent, this.#indexedDB)
            }
            dbOpenReq.onsuccess = () => {
                this.#indexedDB = dbOpenReq.result
                this.#ready = true
                resolve({})
            }
            dbOpenReq.onerror = (errorEvent) => {
                this.#ready = false
                reject({ errorEvent })
            }
        })
    }

    wait(): Promise<any> {
        return this.#initialization
    }

    get isReady(): boolean {
        return this.#ready
    }

    get isPersistentStorage(): boolean {
        return this.#ready && this.#isPersistent
    }

    get idbInstance(): IDBDatabase | undefined {
        return this.#indexedDB
    }

    static get indexedDBFactory(): IDBFactory {
        return (
            window.indexedDB ||
            window.mozIndexedDB ||
            window.webkitIndexedDB ||
            window.msIndexedDB
        )
    }

    static get indexedDbKeyRange() {
        return (
            window.IDBKeyRange ||
            window.webkitIDBKeyRange ||
            window.msIDBKeyRange
        )
    }

    /// Returns an IDBObjectStore from the database
    getObjectStore(
        objectStoreName: string,
        mode: IDBTransactionMode = 'readonly'
    ): IDBObjectStore {
        if (this.#indexedDB) {
            return this.#indexedDB
                .transaction(objectStoreName, mode)
                .objectStore(objectStoreName)
        }
        throw 'IndexedDB is not ready'
    }

    /// Returns an IDBIndex object from the database
    getIndex(
        objectStoreName: string,
        indexName: string,
        mode: IDBTransactionMode = 'readonly'
    ): IDBIndex {
        const objectStore = this.getObjectStore(objectStoreName, mode)
        const index = objectStore.index(indexName)
        return index
    }

    /// Opens an IDBCursor on an IDBIndex usings its name and its object store name.
    openIndexCursor<T>(
        objectStoreName: string,
        indexName: string,
        mode: IDBTransactionMode,
        keyRangeSettings?: KeyRangeSettings
    ): Promise<IDBCursorWithTypedValue<T>> {
        return new Promise((resolve, reject) => {
            try {
                let keyRange
                if (keyRangeSettings) {
                    keyRange = IDBWrapper.createKeyRange(keyRangeSettings)
                    if (!keyRange) {
                        return reject({ error: 'Failed creating a key range' })
                    }
                }
                const index: IDBIndex = this.getIndex(
                    objectStoreName,
                    indexName,
                    mode
                )
                const cursorRequest = keyRangeSettings
                    ? index.openCursor(keyRange, keyRangeSettings.direction)
                    : index.openCursor()
                cursorRequest.onerror = (errorEvent) => reject(errorEvent)
                cursorRequest.onsuccess = (successEvent) =>
                    resolve(
                        (successEvent as CursorEventWithValue<T>).target.result
                    )
            } catch (error) {
                return reject(error)
            }
        })
    }

    /// Opens an IDBCursor on an IDBObjectStore usings its name.
    openCursor<T>(
        objectStoreName: string,
        mode: IDBTransactionMode,
        keyRangeSettings?: KeyRangeSettings
    ): Promise<IDBCursorWithTypedValue<T>> {
        return new Promise((resolve, reject) => {
            try {
                let keyRange
                if (keyRangeSettings) {
                    keyRange = IDBWrapper.createKeyRange(keyRangeSettings)
                    if (!keyRange) {
                        return reject({ error: 'Failed creating a key range' })
                    }
                }
                const objectStore = this.getObjectStore(objectStoreName, mode)
                const cursorRequest = keyRangeSettings
                    ? objectStore.openCursor(
                          keyRange,
                          keyRangeSettings.direction
                      )
                    : objectStore.openCursor()
                cursorRequest.onerror = (errorEvent) => reject(errorEvent)
                cursorRequest.onsuccess = (successEvent) =>
                    resolve(
                        (successEvent as CursorEventWithValue<T>).target.result
                    )
            } catch (error) {
                return reject(error)
            }
        })
    }

    /// Creates an index during version upgrade.
    static createIndex(
        objectStore: IDBObjectStore,
        index: IndexConfig
    ): IDBIndex {
        const { name, kp, options } = index
        return objectStore.createIndex(name, kp, options)
    }

    /// Creates multiple indexes during version upgrade.
    static createIndexes(
        objectStore: IDBObjectStore,
        indexesObj: IndexConfig[]
    ): { error?: any } | undefined {
        for (const indexConfig of indexesObj) {
            try {
                IDBWrapper.createIndex(objectStore, indexConfig)
            } catch (error) {
                return { error }
            }
        }
    }

    /// Initializes an object store using a storeConfig specification.
    /// Must be used only during version upgrade.
    static initializeStore(
        indexedDB: IDBDatabase,
        storeConfig: StoreConfig
    ): IDBObjectStore {
        const storeObject = indexedDB.createObjectStore(storeConfig.name, {
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.autoIncrement,
        })
        IDBWrapper.createIndexes(storeObject, storeConfig.indices)
        return storeObject
    }

    /// Returns an IDBKeyRange object based on the arguments passed.
    static createKeyRange = function (
        keyRangeSettings: KeyRangeSettings
    ): IDBKeyRange {
        const {
            queryType,
            direction,
            lowerKeyPath,
            lowerExclusive = false,
            upperExclusive = false,
            upperBoundKeyPath = undefined,
        } = keyRangeSettings

        if (
            queryType == undefined ||
            direction == undefined ||
            lowerKeyPath == undefined
        ) {
            throw 'Invalid query arguments'
        } else if (
            queryType === IDBQueryType.Bound &&
            upperBoundKeyPath == undefined
        ) {
            throw 'Upper bound values not specified for Bound query type'
        }

        const keyRangeConstructor = IDBWrapper.indexedDbKeyRange
        switch (queryType) {
            case IDBQueryType.Only:
                return keyRangeConstructor.only(lowerKeyPath)
            case IDBQueryType.Bound:
                return keyRangeConstructor.bound(
                    lowerKeyPath,
                    upperBoundKeyPath,
                    lowerExclusive,
                    upperExclusive
                )
            case IDBQueryType.LowerBound:
                return keyRangeConstructor.lowerBound(
                    lowerKeyPath,
                    lowerExclusive
                )
            case IDBQueryType.UpperBound:
                return keyRangeConstructor.upperBound(
                    lowerKeyPath,
                    upperExclusive
                )
        }
    }
}

export * from './types'

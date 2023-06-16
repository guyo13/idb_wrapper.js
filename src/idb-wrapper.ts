// Copyright (c) 2022, Guy Or Please see the AUTHORS file for details.
// All rights reserved. Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

import type {
    CursorEventWithValue,
    IDBCursorWithTypedValue,
    IDBWrapperArgs,
    IDBWrapperInterface,
    IndexConfig,
    KeyRangeSettings,
    StoreConfig,
} from './types'
import { IDBQueryType, IDBTransactionModes, TypedEventTarget } from './types'

export default class IDBWrapper implements IDBWrapperInterface {
    #indexedDB?: IDBDatabase
    readonly #initialization: Promise<void>
    #ready: boolean
    #isPersistent: boolean

    constructor(args: IDBWrapperArgs) {
        this.#ready = false
        this.#isPersistent = false
        this.#initialization = this.initialize(args)
    }

    private async initialize(args: IDBWrapperArgs): Promise<void> {
        const { dbName, dbVersion, upgradeHandler, persistent = false } = args
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

        return new Promise((resolve, reject) => {
            const idbFactory = IDBWrapper.indexedDBFactory
            if (!idbFactory) {
                this.#ready = false
                return reject({ error: 'IndexedDB not supported' })
            }
            const dbOpenReq = idbFactory.open(dbName, dbVersion)
            dbOpenReq.onupgradeneeded = (upgradeEvent) => {
                this.#indexedDB = dbOpenReq.result
                this.#ready = true
                upgradeHandler?.bind(this)(upgradeEvent, this.#indexedDB)
            }
            dbOpenReq.onsuccess = () => {
                this.#indexedDB = dbOpenReq.result
                this.#ready = true
                resolve()
            }
            dbOpenReq.onerror = (errorEvent) => {
                this.#ready = false
                reject(errorEvent)
            }
        })
    }

    wait(): Promise<void> {
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
        return this.getObjectStore(objectStoreName, mode).index(indexName)
    }

    /// Opens a cursor on an index in an object store.
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
                cursorRequest.onerror = reject
                cursorRequest.onsuccess = (successEvent) =>
                    resolve(
                        (successEvent as CursorEventWithValue<T>).target.result
                    )
            } catch (error) {
                return reject(error)
            }
        })
    }

    /// Opens a cursor on an object store.
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
                cursorRequest.onerror = reject
                cursorRequest.onsuccess = (successEvent) =>
                    resolve(
                        (successEvent as CursorEventWithValue<T>).target.result
                    )
            } catch (error) {
                return reject(error)
            }
        })
    }

    getAll<T>(storeName: string): Promise<T[] | null> {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName)
            const getAllRequest = store.getAll()

            getAllRequest.onsuccess = (successEvent: Event) => {
                resolve((successEvent.target as TypedEventTarget<T[]>).result)
            }
            getAllRequest.onerror = reject
        })
    }

    get<T>(
        storeName: string,
        query: IDBValidKey | IDBKeyRange
    ): Promise<T | null> {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName)
            const getRequest = store.get(query)

            getRequest.onsuccess = (successEvent: Event) => {
                resolve((successEvent.target as TypedEventTarget<T>).result)
            }
            getRequest.onerror = reject
        })
    }

    add<T>(storeName: string, object: T): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(
                storeName,
                IDBTransactionModes.Readwrite
            )
            const addRequest = store.add(object)
            addRequest.onsuccess = () => {
                resolve()
            }
            addRequest.onerror = reject
        })
    }

    put<T>(storeName: string, object: T): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(
                storeName,
                IDBTransactionModes.Readwrite
            )
            const putRequest = store.put(object)
            putRequest.onsuccess = () => {
                resolve()
            }
            putRequest.onerror = reject
        })
    }

    delete(storeName: string, query: IDBValidKey | IDBKeyRange): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(
                storeName,
                IDBTransactionModes.Readwrite
            )
            const deleteRequest = store.delete(query)
            deleteRequest.onsuccess = () => {
                resolve()
            }
            deleteRequest.onerror = reject
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
    /// Can only be used during version upgrade.
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

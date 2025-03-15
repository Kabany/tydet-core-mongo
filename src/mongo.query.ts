import { MongoCoreError } from "./mongo.error"
import { MongoConnector } from "./mongo.service"

export interface MongoWhereOptions {
  [column:string]: any
}

export interface MongoEntitySortOptions {
  [param:string]: "ASC" | "DESC"
}

export interface MongoEntityFindOptions {
  fields?: string[]
  sort?: MongoEntitySortOptions
  limit?: {page: number, per: number}
}

export interface MongoEntityFindOneOptions {
  fields?: string[]
  sort?: MongoEntitySortOptions
}

export interface MongoEntityUpdateAction {
  "$set"?: {[param: string]: any}
  "$currentDate"?: {[param: string]: true } | {[param: string]: {"$type": "timestamp" | "date"}}
  "$unset"?: {[param: string]: ""}
  "$rename"?: {[param: string]: string}
  "$inc"?: {[param:string]: number} 
}

export interface MongoFindOptions {
  fields?: string[]
  sort?: MongoEntitySortOptions
  limit?: {page: number, per: number}
}

export interface MongoFindOneOptions {
  fields?: string[]
  sort?: MongoEntitySortOptions
}




export async function QueryFind(db: MongoConnector, schema: string, where?: MongoWhereOptions, options?: MongoFindOptions) {
  let _db = db.connection.db(db.getName()).collection(schema)
  let _w = where || {}
  let _opts = options || {}
  let _qopts: any = {}

  let cursor = _db.find(_w)

  // fields
  if (_opts.fields != null && _opts.fields.length) {
    let projection: any = {}
    projection._id = 0
    for (let field of _opts.fields) {
      if (field == "_id") {
        projection._id = 1
        continue
      }
      projection[field] = 1
    }
    cursor.project(projection)
  }

  // sort
  if (_opts.sort != null) {
    let sort = {}
    for (let field of Object.keys(_opts.sort)) {
      sort[field] = _opts.sort[field] == "ASC" ? 1 : -1
    }
    cursor.sort(sort)
  }

  if (_opts.limit == null) {
    _opts.limit = {page: 1, per: 100}
  } else if (_opts.limit.per > 1000) {
    _opts.limit.per = 1000
  }
  cursor.skip((_opts.limit.per * (_opts.limit.page - 1))).limit(_opts.limit.per)
  
  let result = await cursor.toArray()
  return result
}

export async function QueryFindOne(db: MongoConnector, schema: string, where?: MongoWhereOptions, options?: MongoFindOneOptions) {
  let _db = db.connection.db(db.getName()).collection(schema)
  let _w = where || {}
  let _opts = options || {}
  let _qopts: any = {}

  // fields
  if (_opts.fields != null && _opts.fields.length) {
    let projection: any = {}
    projection._id = 0
    for (let field of _opts.fields) {
      if (field == "_id") {
        projection._id = 1
        continue
      }
      projection[field] = 1
    }
    _qopts.projection = projection
  }

  // sort
  if (_opts.sort != null) {
    let sort = {}
    for (let field of Object.keys(_opts.sort)) {
      sort[field] = _opts.sort[field] == "ASC" ? 1 : -1
    }
    _qopts.sort = sort
  }
  
  let result = await _db.findOne(_w, _qopts)
  return result
}

export async function QueryDistinct(db: MongoConnector, schema: string, field: string, where?: MongoWhereOptions) {
  let _db = db.connection.db(db.getName()).collection(schema)
  let _w = where || {}

  let result = await _db.distinct(field, _w)
  return result
}

export async function QueryCount(db: MongoConnector, schema: string, where?: MongoWhereOptions) {
  let _db = db.connection.db(db.getName()).collection(schema)
  let _w = where || {}

  let result = await _db.countDocuments(_w)
  return result
}

export async function QueryInsert(db: MongoConnector, schema: string, doc: any) {
  let _db = db.connection.db(db.getName()).collection(schema)
  let result = await _db.insertOne(doc)
  return result.insertedId
}

export async function QueryUpdate(db: MongoConnector, schema: string, action: MongoEntityUpdateAction, where?: MongoWhereOptions) {
  let _db = db.connection.db(db.getName()).collection(schema)
  let _w = where || {}

  let result = await _db.updateMany(_w, action)
  return result.modifiedCount
}

export async function QueryRemove(db: MongoConnector, schema: string, where?: MongoWhereOptions, force: boolean = false) {
  let _db = db.connection.db(db.getName()).collection(schema)
  let _w = where || {}
  let _wlen = Object.keys(_w).length
  if (_wlen == 0 && !force) {
    throw new MongoCoreError("The 'where' condition must be included in the Query Delete method")
  }
  let result = await _db.deleteMany(_w)
  return result.deletedCount
}

// TODO: Aggregation methods
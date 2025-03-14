import { MongoClient, ObjectId } from "mongodb"
import { DateUtils, StringUtils } from "tydet-utils"
import { v1, v4 } from "uuid"
import { MongoConnector } from "./mongo.service"
import { MongoEntityFindOptions, MongoEntityUpdateAction, MongoWhereOptions } from "./mongo.query"
import { MongoCoreError, MongoEntityNotFound } from "./mongo.error"

export enum MongoDataType {
  OBJECT_ID = "OBJECT_ID",
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  DATE = "DATE",
  ARRAY = "ARRAY",
  MIXED = "MIXED"
}

export enum MongoValidationError {
  REQUIRED = "REQUIRED",
  INVALID_TYPE = "INVALID_TYPE",
  INVALID_VALUE = "INVALID_VALUE",
  MAX_VALUE = "MAX_VALUE",
  MIN_VALUE = "MIN_VALUE",
  MAX_LENGTH = "MAX_LENGTH",
  MIN_LENGTH = "MIN_LENGTH",
  UNIQUE = "UNIQUE"
}

export enum MongoDefaultValues {
  NULL = "NULL",
  DATENOW = "DATENOW",
  UUIDV1 = "UUIDV1",
  UUIDV4 = "UUIDV4"
}

interface MongoEntityOptions {
  readAlias: boolean
}

interface MongoSchemaParameterDefinition {
  type: MongoDataType
  default?: any,
  required?: boolean,
  alias?: string,
  unique?: boolean
  validators?: ((value: any) => MongoParameterValidation)[]
}

interface MongoSchemaStringParameterDefinition extends MongoSchemaParameterDefinition {
  type: MongoDataType.STRING
  minLength?: number
  maxLength?: number
}

interface MongoSchemaNumberParameterDefinition extends MongoSchemaParameterDefinition {
  type: MongoDataType.NUMBER
  min?: number
  max?: number
}

interface MongoParameterValidation {
  success: boolean
  message?: string
}

export interface MongoSchemaParameter {
  name: string
  type: MongoDataType,
  default: any,
  required: boolean,
  alias: string
  unique: boolean
  validators: ((value: any) => MongoParameterValidation)[]
}

function EntityParameterValidationDefinitionHelper(parameter: MongoSchemaParameter, definition?: MongoSchemaParameterDefinition): ((value: any) => MongoParameterValidation)[] {
  let validators = []
  if (MongoDataType.NUMBER == parameter.type) {
    // type
    let t = (value) => {
      if (typeof value === "number" || value === null || value === undefined) {
        return {success: true}
      } else {
        return {success: false, message: MongoValidationError.INVALID_TYPE}
      }
    }
    validators.push(t)

    // required
    if (parameter.required === true) {
      let r = (value) => {
        if (value === null || value === undefined) {
          return {success: false, message: MongoValidationError.REQUIRED}
        } else {
          return {success: true}
        }
      }
      validators.push(r)
    }

    // min
    if (definition != null && (definition as MongoSchemaNumberParameterDefinition).min != null) {
      let m = (value) => {
        if ((value === undefined || value === null) && parameter.required !== true) {
          // skip
          return {success: true}
        } else if (typeof value === "number" && value >= (definition as MongoSchemaNumberParameterDefinition).min) {
          return {success: true}
        } else {
          return {success: false, message: MongoValidationError.MIN_VALUE}
        }
      }
      validators.push(m)
    }

    // max
    if (definition != null && (definition as MongoSchemaNumberParameterDefinition).max != null) {
      let m = (value) => {
        if ((value === undefined || value === null) && parameter.required !== true) {
          // skip
          return {success: true}
        } else if (typeof value === "number" && value <= (definition as MongoSchemaNumberParameterDefinition).max) {
          return {success: true}
        } else {
          return {success: false, message: MongoValidationError.MAX_VALUE}
        }
      }
      validators.push(m)
    }
  } else if (MongoDataType.STRING == parameter.type) {
    // type
    let t = (value) => {
      if (StringUtils.isNotEmpty(value) || value === null || value === undefined) {
        return {success: true}
      } else {
        return {success: false, message: MongoValidationError.INVALID_TYPE}
      }
    }
    validators.push(t)

    // required
    if (parameter.required === true) {
      let r = (value) => {
        if (!StringUtils.isNotBlank(value) || value === null || value === undefined) {
          return {success: false, message: MongoValidationError.REQUIRED}
        } else {
          return {success: true}
        }
      }
      validators.push(r)
    }

    // min
    if (definition != null && (definition as MongoSchemaStringParameterDefinition).minLength != null) {
      let m = (value) => {
        if ((value === undefined || value === null) && parameter.required !== true) {
          // skip
          return {success: true}
        } else if (StringUtils.length(value) >= (definition as MongoSchemaStringParameterDefinition).minLength) {
          return {success: true}
        } else {
          return {success: false, message: MongoValidationError.MIN_LENGTH}
        }
      }
      validators.push(m)
    }

    // max
    if (definition != null && (definition as MongoSchemaStringParameterDefinition).maxLength != null) {
      let m = (value) => {
        if ((value === undefined || value === null) && parameter.required !== true) {
          // skip
          return {success: true}
        } else if (StringUtils.length(value) <= (definition as MongoSchemaStringParameterDefinition).maxLength) {
          return {success: true}
        } else {
          return {success: false, message: MongoValidationError.MAX_LENGTH}
        }
      }
      validators.push(m)
    }
  } else if (parameter.type == MongoDataType.BOOLEAN) {
    // type
    let t = (value) => {
      if (typeof value == "boolean" || value === null || value === undefined) {
        return {success: true}
      } else {
        return {success: false, message: MongoValidationError.INVALID_TYPE}
      }
    }
    validators.push(t)

    // required
    if (parameter.required === true) {
      let r = (value) => {
        if (value === true || value === false) {
          return {success: true}
        } else {
          return {success: false, message: MongoValidationError.REQUIRED}
        }
      }
      validators.push(r)
    }
  } else if (parameter.type == MongoDataType.DATE) {
    // type
    let t = (value) => {
      if (DateUtils.isValid(value) || value === null || value === undefined) {
        return {success: true}
      } else {
        return {success: false, message: MongoValidationError.INVALID_TYPE}
      }
    }
    validators.push(t)

    // required
    if (parameter.required === true) {
      let r = (value) => {
        if (value === null || value === undefined) {
          return {success: false, message: MongoValidationError.REQUIRED}
        } else {
          return {success: true}
        }
      }
      validators.push(r)
    }
  } else if (parameter.type == MongoDataType.ARRAY) {
    // type
    let t = (value) => {
      if (Array.isArray(value) || value === null || value === undefined) {
        return {success: true}
      } else {
        return {success: false, message: MongoValidationError.INVALID_TYPE}
      }
    }
    validators.push(t)

    // required
    if (parameter.required === true) {
      let r = (value) => {
        if (value === null || value === undefined || value.length == 0) {
          return {success: false, message: MongoValidationError.REQUIRED}
        } else {
          return {success: true}
        }
      }
      validators.push(r)
    }
  } else if (parameter.type == MongoDataType.MIXED) {
    // required
    if (parameter.required === true) {
      let r = (value) => {
        if (value === null || value === undefined) {
          return {success: false, message: MongoValidationError.REQUIRED}
        } else {
          return {success: true}
        }
      }
      validators.push(r)
    }
  } else if (parameter.type == MongoDataType.OBJECT_ID) {
    // type
    let t = (value) => {
      if (value instanceof ObjectId || typeof value == "string" || value === null || value === undefined) {
        return {success: true}
      } else {
        return {success: false, message: MongoValidationError.INVALID_TYPE}
      }
    }
    validators.push(t)

    // required
    if (parameter.required === true) {
      let r = (value) => {
        if (value === null || value === undefined || value.length == 0) {
          return {success: false, message: MongoValidationError.REQUIRED}
        } else {
          return {success: true}
        }
      }
      validators.push(r)
    }
  }
  return validators
}




export class MongoEntity {
  _id: ObjectId | string

  static getCollectionName() {
    return this.name
  }

  static getSchema(): MongoSchemaParameter[] {
    return []
  }

  static DefineSchema(name: string, schema: {[params:string]: MongoDataType | MongoSchemaParameterDefinition}) {
    this.getCollectionName = () => {
      return name
    }
    let parameters: MongoSchemaParameter[] = []
    for (let param of Object.keys(schema)) {
      if (param != "_id") { // ignore _id
        if ((schema[param] as MongoDataType) in MongoDataType) {
          let data = schema[param] as MongoDataType
          let parameter: MongoSchemaParameter = {
            name: param,
            type: data,
            default: undefined,
            required: false,
            alias: param,
            unique: false,
            validators: []
          }
          parameter.validators = EntityParameterValidationDefinitionHelper(parameter)
          parameters.push(parameter)
        } else {
          let data = schema[param] as MongoSchemaParameterDefinition
          let parameter: MongoSchemaParameter = {
            name: param,
            type: data.type,
            default: data.default,
            required: data.required === true,
            alias: data.alias || param,
            unique: data.unique === true,
            validators: data.validators || []
          }
          parameter.validators.push(...EntityParameterValidationDefinitionHelper(parameter, data))
          parameters.push(parameter)
        }
      }
    }
    this.getSchema = () => {
      return parameters
    }
  }

  constructor(data: any, options: MongoEntityOptions) {
    let opts = options || {readAlias: false}
    let schema = (this.constructor as any).getSchema()
    if (data._id != null) {
      this._id = typeof data._id == "string" ? ObjectId.createFromHexString(data._id) : data._id
    }
    for (let param of schema) {
      (this as any)[param.name] = data[opts.readAlias ? param.alias : param.name]

      if (param.type == MongoDataType.DATE) {
        if ((this as any)[param.name] !== null && (this as any)[param.name] !== undefined) {
          (this as any)[param.name] = new Date((this as any)[param.name])
        } else {
          if (typeof param.default == "function") {
            (this as any)[param.name] = param.default()
          } else if (param.default == MongoDefaultValues.DATENOW) {
            (this as any)[param.name] = new Date()
          } else {
            (this as any)[param.name] = param.default
          }
        }
      } else if (param.type == MongoDataType.BOOLEAN) {
        if ((this as any)[param.name] !== null && (this as any)[param.name] !== undefined) {
          if (typeof (this as any)[param.name] == "number") {
            (this as any)[param.name] = (this as any)[param.name] === 1
          }
        } else {
           if (typeof param.default == "function") {
            (this as any)[param.name] = param.default()
          } else {
            (this as any)[param.name] = param.default
          }
        }
      } else if (param.type == MongoDataType.NUMBER) {
        if ((this as any)[param.name] === null || (this as any)[param.name] === undefined) {
          if (typeof param.default == "function") {
            (this as any)[param.name] = param.default()
          } else {
            (this as any)[param.name] = param.default
          }
        }
      } else if (param.type == MongoDataType.STRING) {
        if ((this as any)[param.name] === null || (this as any)[param.name] === undefined) {
          if (typeof param.default == "function") {
            (this as any)[param.name] = param.default()
          } else if (param.default == MongoDefaultValues.UUIDV1) {
            (this as any)[param.name] = v1()
          } else if (param.default == MongoDefaultValues.UUIDV4) {
            (this as any)[param.name] = v4()
          } else {
            (this as any)[param.name] = param.default
          }
        }
      }
    }
  }

  async validate(db: MongoConnector) {
    
  }

  async insert(db: MongoConnector) {
    

    let _db = db.connection.db(db.getName()).collection((this.constructor as any).getCollectionName())
    let schema = (this.constructor as any).getSchema()

  }

  static async Find(db: MongoConnector, where?: MongoWhereOptions, opts?: MongoEntityFindOptions): Promise<MongoEntity[]> {
    let _db = db.connection.db(db.getName()).collection(this.getCollectionName())
    let _w = where || {}
    let _opts = opts || {}
    let schema = this.getSchema()

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
        let param = schema.find(f => f.name == field)
        if (param != null) {
          projection[param.alias] = 1
        }
      }
      cursor.project(projection)
    }

    // sort
    if (_opts.sort != null) {
      let sort = {}
      for (let field of Object.keys(_opts.sort)) {
        let param = schema.find(f => f.name == field)
        if (param != null) {
          sort[param.alias] = _opts.sort[field] == "ASC" ? 1 : -1
        }
      }
      cursor.sort(sort)
    }

    if (_opts.limit != null) {
      _opts.limit = {page: 1, per: 1000}
    }
    cursor.skip((_opts.limit.per * (_opts.limit.page - 1))).limit(_opts.limit.per)

    let result = await cursor.toArray()
    let list = []
    for (let item of result) {
      list.push(new this(item, {readAlias: true}))
    }
    return list
  }

  static async FindOne(db: MongoConnector, where?: MongoWhereOptions, opts?: MongoEntityFindOptions): Promise<MongoEntity> {
    let _db = db.connection.db(db.getName()).collection(this.getCollectionName())
    let _w = where || {}
    let _opts = opts || {}
    let schema = this.getSchema()

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
        let param = schema.find(f => f.name == field)
        if (param != null) {
          projection[param.alias] = 1
        }
      }
      _qopts.projection = projection
    }

    // sort
    if (_opts.sort != null) {
      let sort = {}
      for (let field of Object.keys(_opts.sort)) {
        let param = schema.find(f => f.name == field)
        if (param != null) {
          sort[param.alias] = _opts.sort[field] == "ASC" ? 1 : -1
        }
      }
      _qopts.sort = sort
    }

    let result = await _db.findOne(_w, _qopts)
    if (result != null) {
      return new this(result, {readAlias: true})
    } else {
      return null
    }
  }

  static async FindOneOrThrow(db: MongoConnector, where?: MongoWhereOptions, opts?: MongoEntityFindOptions): Promise<MongoEntity> {
    let result = this.FindOne(db, where, opts)
    if (result != null) {
      return result
    } else {
      let collection = this.getCollectionName()
      throw new MongoEntityNotFound("Entity not found", collection, where)
    }
  }

  static async Count(db: MongoConnector, where?: MongoWhereOptions): Promise<number> {
    let _db = db.connection.db(db.getName()).collection(this.getCollectionName())
    let _w = where || {}
    return await _db.countDocuments(_w)
  }

  static async UpdateAll(db: MongoConnector, action: MongoEntityUpdateAction, where?: MongoWhereOptions) {
    let _db = db.connection.db(db.getName()).collection(this.getCollectionName())
    let _w = where || {}
    let result = await _db.updateMany(_w, action)
    return result.matchedCount
  }

  static async RemoveAll(db: MongoConnector, where?: MongoWhereOptions, force: boolean = false) {
    let _db = db.connection.db(db.getName()).collection(this.getCollectionName())
    let _w = where || {}
    let _wlen = Object.keys(_w).length
    if (_wlen == 0 && !force) {
      throw new MongoCoreError("The 'where' condition must be included in the Query Delete method")
    }
    let result = await _db.deleteMany(_w)
    return result.deletedCount
  }
}
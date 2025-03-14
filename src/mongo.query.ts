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
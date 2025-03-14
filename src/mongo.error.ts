import { CoreError } from "tydet-core";
import { MongoWhereOptions } from "./mongo.query";

export class MongoCoreError extends CoreError {
  name: string
  sql: string

  constructor(message?: string, sql?: string) {
    super(message);
    this.name = "MongoCoreError";
    this.message = message;
    this.sql = sql;
    if (sql != null && message != null) {
      this.message += `\nQuery: ${this.sql}`
    }
    this.stack = (new Error(this.message)).stack;  //`${this.message}\n${new Error().stack}`;
  }
}

export class MongoEntityNotFound extends MongoCoreError {
  name: string
  errors: any
  collection: string
  where: any

  constructor(message: string, collection: string, where: MongoWhereOptions) {
    super(message);
    this.name = "MongoEntityNotFound";
    this.message = message + ` -- Collection: ${collection}, where: ${where}`;
    this.collection = collection;
    this.where = where;
    this.stack = (new Error(message)).stack;  //`${this.message}\n${new Error().stack}`;
  }
}
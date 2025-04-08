import { CoreError } from "tydet-core";
import { MongoWhereOptions } from "./mongo.query";

export class MongoCoreError extends CoreError {

  constructor(message?: string) {
    super();
    Object.setPrototypeOf(this, MongoCoreError.prototype);
    this.name = this.constructor.name
    this.message = message;
    if (Error.captureStackTrace) Error.captureStackTrace(this, MongoCoreError);
  }
}

export class MongoEntityNotFoundError extends MongoCoreError {
  collection: string
  where: any

  constructor(message: string, collection: string, where: MongoWhereOptions) {
    super();
    Object.setPrototypeOf(this, MongoEntityNotFoundError.prototype);
    this.name = this.constructor.name
    this.message = message + ` -- Collection: ${collection}, where: ${where}`;
    this.collection = collection;
    this.where = where;
    if (Error.captureStackTrace) Error.captureStackTrace(this, MongoEntityNotFoundError);
  }
}

export class MongoEntityValidationError extends MongoCoreError {
  errors: any

  constructor(message: string, errors: any) {
    super();
    Object.setPrototypeOf(this, MongoEntityValidationError.prototype);
    this.name = this.constructor.name
    this.message = message
    this.errors = errors
    if (Error.captureStackTrace) Error.captureStackTrace(this, MongoEntityValidationError);
  }
}
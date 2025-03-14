import { MongoClient } from "mongodb";
import { Context, Service } from "tydet-core";
import { MongoCoreError } from "./mongo.error";
import { MongoConnectionParameters } from "./mongo.utils";

const DB_URL = "DB_URL";
const DB_NAME = "DB_NAME";
const DB_HOST = "DB_HOST";
const DB_PORT = "DB_PORT";

export interface MongoUrlParamsInterface {
  url: string
}

export interface MongoParamsInterface {
  db: string
  host?: string
  port?: string
  protocol?: "mongodb" | "mongodb+srv"
  user?: string
  pass?: string
  options?: string
}

export class MongoConnector extends Service {
  connection: MongoClient

  constructor(params: MongoUrlParamsInterface | MongoParamsInterface) {
    let _params = new MongoConnectionParameters(params)
    _params.validate()
    let map = new Map()
    map.set(DB_NAME, _params.db)
    map.set(DB_HOST, _params.host)
    map.set(DB_PORT, _params.port)
    map.set(DB_URL, _params.url)
    super(map)
  }

  async connect() {
    this.connection = new MongoClient(this.params.get(DB_URL))
  }

  async disconnect() {
    await this.connection.close()
  }

  override async beforeMount(context: Context) {
    let errors: any = {}
    if (!this.params.has(DB_URL)) {
      errors.connectionUrl = "Not defined";
    }

    if (Object.keys(errors).length > 0) {
      let msg = "Error with configuration parameters:\n";
      for (let key of Object.keys(errors)) {
        msg += `${key}: ${errors[key]}\n`;
      }
      throw new MongoCoreError(msg);
    }

    await super.beforeMount(context)
  }

  override async onMount() {
    await this.connect()
  }

  override async beforeUnmount() {
    await this.disconnect()
  }

  getName() {
    return this.params.get(DB_NAME) as string;
  }
}
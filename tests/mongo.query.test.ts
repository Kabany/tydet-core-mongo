import { Context } from "tydet-core";
import { MongoEntity } from "../src/mongo.schema"
import { MongoConnector } from "../src/mongo.service";

const DB_URL = "mongodb://localhost:27017/test"

class User extends MongoEntity {
  firstName: string
  lastName: string
  createdAt: Date
}


describe("Mongo Query", () => {
  let app = new Context()
  let db = new MongoConnector({url: DB_URL})
  //let migrationHandler: MysqlMigrationHandler

  beforeAll(async () => {
    // prepare
    await app.mountService("mongo", db)
  })

  it("should test", async () => {
    let result = await User.Find(db)
    console.log(result)
    expect(true).toBeTruthy()
  })

  afterAll(async () => {
    // drop
    //await migrationHandler.rollback()

    // close service
    await app.unmountServices()
  })
})
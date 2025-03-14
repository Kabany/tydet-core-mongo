import { MongoConnectionParameters } from "../src/mongo.utils"


describe("Mongo Utils", () => {
  it("should validate parameters for a db connection with a simple url string", async () => {
    let params = new MongoConnectionParameters({url: "mongodb://myDatabaseUser:D1fficultP%40ssw0rd@mongodb0.example.com:27017/test?authSource=admin"})
    params.validate()
    expect(params.protocol).toBe("mongodb")
    expect(params.user).toBe("myDatabaseUser")
    expect(params.pass).toBe("D1fficultP%40ssw0rd")
    expect(params.host).toBe("mongodb0.example.com")
    expect(params.port).toBe("27017")
    expect(params.db).toBe("test")
    expect(params.options).toBe("authSource=admin")
  })
  it("should validate parameters for a db connection with a replica url string", async () => {
    let params = new MongoConnectionParameters({url: "mongodb://myDatabaseUser:D1fficultP%40ssw0rd@mongos0.example.com:27017,mongos1.example.com:27017,mongos2.example.com:27017/test?authSource=admin"})
    params.validate()
    expect(params.protocol).toBe("mongodb")
    expect(params.user).toBe("myDatabaseUser")
    expect(params.pass).toBe("D1fficultP%40ssw0rd")
    expect(params.host).toBe("mongos0.example.com,mongos1.example.com,mongos2.example.com")
    expect(params.port).toBe("27017,27017,27017")
    expect(params.db).toBe("test")
    expect(params.options).toBe("authSource=admin")
  })
  it("should validate parameters and throw an error for a db connection with a url string", async () => {
    try {
      let params = new MongoConnectionParameters({url: "mongodb://myDatabaseUser:D1fficultP%40ssw0rd@mongodb0.example.com:27017/?authSource=admin"})
      params.validate()
    } catch(err) {
      expect(err.name).toBe("MongoCoreError")
      expect(err.message).toBe("Missing a Database Name in the URL string")
    }
  })
  it("should validate parameters with only the db name", async () => {
    let params = new MongoConnectionParameters({db: "test"})
    params.validate()
    expect(params.protocol).toBe("mongodb")
    expect(params.user).toBeUndefined()
    expect(params.pass).toBeUndefined()
    expect(params.host).toBe("localhost")
    expect(params.port).toBe("27017")
    expect(params.db).toBe("test")
    expect(params.options).toBeUndefined()
    expect(params.url).toBe("mongodb://localhost:27017/test")
  })
  it("should validate parameters with only the db name, host, user and pass", async () => {
    let params = new MongoConnectionParameters({db: "test", host: "example.com", user: "user", pass: "myPass"})
    params.validate()
    expect(params.protocol).toBe("mongodb")
    expect(params.user).toBe("user")
    expect(params.pass).toBe("myPass")
    expect(params.host).toBe("example.com")
    expect(params.port).toBe("27017")
    expect(params.db).toBe("test")
    expect(params.options).toBeUndefined()
    expect(params.url).toBe("mongodb://user:myPass@example.com:27017/test")
  })
  it("should validate parameters with only the db name, multiple hosts, user and pass", async () => {
    let params = new MongoConnectionParameters({db: "test", host: "example1.com, example2.com, example3.com", port: "27017, 27017, 27017", user: "user", pass: "myPass"})
    params.validate()
    expect(params.protocol).toBe("mongodb")
    expect(params.user).toBe("user")
    expect(params.pass).toBe("myPass")
    expect(params.host).toBe("example1.com, example2.com, example3.com")
    expect(params.port).toBe("27017, 27017, 27017")
    expect(params.db).toBe("test")
    expect(params.options).toBeUndefined()
    expect(params.url).toBe("mongodb://user:myPass@example1.com:27017,example2.com:27017,example3.com:27017/test")
  })
})
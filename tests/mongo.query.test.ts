import { Context } from "tydet-core";
import { MongoDataType, MongoDefaultValues, MongoEntity } from "../src/mongo.schema"
import { MongoConnector } from "../src/mongo.service";
import { StringUtils } from "tydet-utils";
import { QueryCount, QueryDistinct, QueryFind, QueryFindOne, QueryInsert, QueryRemove, QueryUpdate } from "../src/mongo.query";

const DB_URL = "mongodb://localhost:27017/test"

class User extends MongoEntity {
  firstName: string
  lastName: string
  age: number
  email: string
  createdAt: Date
}

User.DefineSchema("User", {
  firstName: MongoDataType.STRING,
  lastName: {
    minLength: 3,
    maxLength: 20,
    type: MongoDataType.STRING
  },
  age: {
    type: MongoDataType.NUMBER,
    default: 18,
    min: 17,
    max: 30
  },
  email: {
    type: MongoDataType.STRING,
    required: true,
    unique: true,
    validators: [
      (value: any) => {
        return {
          success: StringUtils.isEmailValid(value),
          message: "Custom error"
        }
      }
    ]
  },
  createdAt: {
    type: MongoDataType.DATE,
    default: MongoDefaultValues.DATENOW
  }
})


describe("Mongo Query", () => {
  let app = new Context()
  let db = new MongoConnector({url: DB_URL})

  beforeAll(async () => {
    // prepare
    await app.mountService("mongo", db)
  })

  it("should add documents", async () => {
    let user1 = new User({
      firstName: "Usuario 1",
      lastName: "Apellido",
      email: "usuario1@test.com"
    })
    await user1.insert(db)
    expect(user1._id).not.toBeNull()

    let user2 = new User({
      firstName: "Usuario 2",
      lastName: "Apellido",
      email: "usuario2@test.com"
    })
    await user2.insert(db)
    expect(user2._id).not.toBeNull()
  })

  it("should find recently added documents", async () => {
    let users = await User.Find(db)
    expect(users.length).toBe(2)
  })

  it("should find the 2nd user with findOne(), then modify the age", async () => {
    let user = await User.FindOne(db, {firstName: "Usuario 2"})
    expect(user).not.toBeNull()
    expect(user.firstName).toBe("Usuario 2")
    expect(user.age).toBe(18)

    user.age = 20
    await user.update(db)

    let sameUser = await User.FindOne(db, {firstName: "Usuario 2"})
    expect(sameUser).not.toBeNull()
    expect(sameUser.firstName).toBe("Usuario 2")
    expect(sameUser.age).toBe(20)
  })

  it("should throw an error because of the unique validation", async () => {
    try {
      let user = new User({
        firstName: "Usuario 3",
        lastName: "Apellido",
        email: "usuario2@test.com"
      })
      await user.insert(db)
      fail()
    } catch(err) {
      expect(err.name).toBe("MongoEntityValidationError")
      expect(err.errors.email).toBe("UNIQUE")
    }
  })

  it("should throw an error because of required validation", async () => {
    try {
      let user = new User({
        firstName: "Usuario 3",
        lastName: "Apellido"
      })
      await user.insert(db)
      fail()
    } catch(err) {
      expect(err.name).toBe("MongoEntityValidationError")
      expect(err.errors.email).toBe("REQUIRED")
    }
  })

  it("should throw an error because of minLength validation", async () => {
    try {
      let user = new User({
        firstName: "Usuario 3",
        lastName: "Ap",
        email: "usuario3@test.com"
      })
      await user.insert(db)
      fail()
    } catch(err) {
      expect(err.name).toBe("MongoEntityValidationError")
      expect(err.errors.lastName).toBe("MIN_LENGTH")
    }
  })

  it("should throw an error because of maxLength validation", async () => {
    try {
      let user = new User({
        firstName: "Usuario 3",
        lastName: "12345678901234567890A",
        email: "usuario3@test.com"
      })
      await user.insert(db)
      fail()
    } catch(err) {
      expect(err.name).toBe("MongoEntityValidationError")
      expect(err.errors.lastName).toBe("MAX_LENGTH")
    }
  })

  it("should throw an error because of min validation", async () => {
    try {
      let user = new User({
        firstName: "Usuario 3",
        lastName: "Apellido",
        email: "usuario3@test.com",
        age: 15
      })
      await user.insert(db)
      fail()
    } catch(err) {
      expect(err.name).toBe("MongoEntityValidationError")
      expect(err.errors.age).toBe("MIN_VALUE")
    }
  })

  it("should throw an error because of min validation", async () => {
    try {
      let user = new User({
        firstName: "Usuario 3",
        lastName: "Apellido",
        email: "usuario3@test.com",
        age: 50
      })
      await user.insert(db)
      fail()
    } catch(err) {
      expect(err.name).toBe("MongoEntityValidationError")
      expect(err.errors.age).toBe("MAX_VALUE")
    }
  })

  it("should throw an error because of min validation", async () => {
    try {
      let user = new User({
        firstName: "Usuario 3",
        lastName: "Apellido",
        email: "usuario3@test"
      })
      await user.insert(db)
      fail()
    } catch(err) {
      expect(err.name).toBe("MongoEntityValidationError")
      expect(err.errors.email).toBe("Custom error")
    }
  })

  it("should remove a user", async () => {
    let user = await User.FindOne(db, {firstName: "Usuario 2"})
    expect(user).not.toBeNull()
    expect(user.firstName).toBe("Usuario 2")

    await user.remove(db)

    let shouldBeNull = await User.FindOne(db, {firstName: "Usuario 2"})
    expect(shouldBeNull).toBeNull()
  })

  it("should count only 1 user", async () => {
    let user = await User.Count(db, {})
    expect(user).not.toBeNull()
    expect(user).toBe(1)
  })

  it("should get list of users", async () => {
    let user = await QueryFind(db, "User", {})
    expect(user.length).toBe(1)
  })

  it("should get only 1 user", async () => {
    let user = await QueryFindOne(db, "User", {})
    expect(user).not.toBeNull()
    expect(user?.email).toBe("usuario1@test.com")
  })

  it("should count only 1 user", async () => {
    let user = await QueryCount(db, "User", {})
    expect(user).toBe(1)
  })

  it("should insert one user", async () => {
    let user = await QueryInsert(db, "User", {"firstName": "Usuario 3", "lastName": "Apellido", "email": "usuario3@test.com", "age": 20, "createdAt": new Date()})
    expect(user).not.toBeNull()
  })

  it("should distinct only 1 lastName even with 2 users", async () => {
    let user = await QueryDistinct(db, "User", "lastName")
    expect(user.length).toBe(1)
    expect(user[0]).toBe("Apellido")
  })

  it("should update one user", async () => {
    let update = await QueryUpdate(db, "User", {"$set": {age: 25}}, {age: 20})
    expect(update).toBe(1)

    let user = await QueryFindOne(db, "User", {age: 25})
    expect(user).not.toBeNull()
    expect(user?.email).toBe("usuario3@test.com")
  })

  it("should remove one user", async () => {
    let remove = await QueryRemove(db, "User", {age: 25})
    expect(remove).toBe(1)

    let user = await QueryFindOne(db, "User", {age: 25})
    expect(user).toBeNull()
  })

  it("should delete all", async () => {
    let removed = await User.RemoveAll(db, {}, true)
    expect(removed).toBe(1)
  })

  afterAll(async () => {
    // drop
    //await migrationHandler.rollback()

    // close service
    await app.unmountServices()
  })
})
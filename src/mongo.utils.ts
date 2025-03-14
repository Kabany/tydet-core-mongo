import { StringUtils } from "tydet-utils";
import { MongoCoreError } from "./mongo.error";
import { MongoParamsInterface, MongoUrlParamsInterface } from "./mongo.service";

export class MongoConnectionParameters {
  url: string
  db: string
  host: string
  port: string
  protocol: string
  options: string
  user: string
  pass: string

  constructor(data: MongoUrlParamsInterface | MongoParamsInterface) {
    if (data == null) {
      throw new MongoCoreError("Connection parameters are missing")
    }
    if (StringUtils.isNotEmpty((data as MongoUrlParamsInterface).url)) {
      this.url = (data as MongoUrlParamsInterface).url
    }
    if (StringUtils.isNotEmpty((data as MongoParamsInterface).db)) {
      this.db = (data as MongoParamsInterface).db
    }
    if (StringUtils.isNotEmpty((data as MongoParamsInterface).host)) {
      this.host = (data as MongoParamsInterface).host
    }
    if (StringUtils.isNotEmpty((data as MongoParamsInterface).port)) {
      this.port = (data as MongoParamsInterface).port
    }
    if (StringUtils.isNotEmpty((data as MongoParamsInterface).port)) {
      this.port = (data as MongoParamsInterface).port
    }
    if (StringUtils.isNotEmpty((data as MongoParamsInterface).protocol)) {
      this.protocol = (data as MongoParamsInterface).protocol
    }
    if (StringUtils.isNotEmpty((data as MongoParamsInterface).options)) {
      this.options = (data as MongoParamsInterface).options
    }
    if (StringUtils.isNotEmpty((data as MongoParamsInterface).user)) {
      this.user = (data as MongoParamsInterface).user
    }
    if (StringUtils.isNotEmpty((data as MongoParamsInterface).pass)) {
      this.pass = (data as MongoParamsInterface).pass
    }
  }

  validate() {
    if (StringUtils.isNotEmpty(this.url)) {
      this.parseUrl()
    } else if (StringUtils.isNotEmpty(this.db)) {
      this.parseData()
    } else {
      throw new MongoCoreError("Connection parameters are missing")
    }
  }

  private parseUrl() {
    let _substr = this.url.split("://")
    if (_substr.length != 2) {
      throw new MongoCoreError("String URL is not valid")
    }
    this.protocol = _substr[0]
    let pos = _substr[1].indexOf("@")
    let _substr2: string
    if (pos == -1) {
      _substr2 = _substr[1]
    } else {
      let _sub = _substr[1].split("@")
      _substr2 = _sub[1]
      let _usr = _sub[0].split(":")
      this.user = _usr[0]
      if (_usr.length > 1) {
        this.pass = _usr[1]
      }
    }
    let _substr3 = _substr2.split("/")
    let hosts = _substr3[0].split(",")
    for (let host of hosts) {
      let param = host.split(":")
      if (this.host == null) {
        this.host = param[0]
      } else {
        this.host += `,${param[0]}`
      }
      if (param.length > 1) {
        if (this.port == null) {
          this.port = param[1]
        } else {
          this.port += `,${param[1]}`
        }
      } else {
        if (this.port == null) {
          this.port = "27017"
        } else {
          this.port += ",27017"
        }
      }
    }
    if (_substr3.length < 2) {
      throw new MongoCoreError("String URL is not valid")
    }
    let _substr4 = _substr3[1].split("?")
    if (StringUtils.isEmpty(_substr4[0])) {
      throw new MongoCoreError("Missing a Database Name in the URL string")
    }
    this.db = _substr4[0]
    if (_substr4.length > 1) {
      this.options = _substr4[1]
    }
  }

  private parseData() {
    if (StringUtils.isEmpty(this.protocol)) {
      this.protocol = "mongodb"
    }
    if (StringUtils.isEmpty(this.host)) {
      this.host = "localhost"
    }
    if (StringUtils.isEmpty(this.port)) {
      this.port = "27017"
    }
    let auth = ""
    if (StringUtils.isNotBlank(this.user) && StringUtils.isNotBlank(this.pass)) {
      auth = `${this.user}:${this.pass}@`
    }
    let _hdb = ""
    let _h = this.host.split(",")
    let _p = this.port.split(",")
    if (_h.length != _p.length) {
      throw new MongoCoreError("The number of hosts does not match with the number of ports")
    }
    for (let x = 0; x < _h.length; x++) {
      if (x != 0) {
        _hdb += ","
      }
      _hdb += `${_h[x].trim()}:${_p[x].trim()}`
    }
    let opts = StringUtils.isNotBlank(this.options) ? `?${this.options}` : ""
    this.url = `${this.protocol}://${auth}${_hdb}/${this.db}${opts}`
  }
}
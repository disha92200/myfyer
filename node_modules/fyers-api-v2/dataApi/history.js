const apiService = require("../apiService/apiService");
const token = require("../token/tokenGeneration");
const helper = require('../helper/helper');
const dataApi = helper.dataAccessPoint();



class History {
    #urlSubPath = 'history/'
    #symbol;
    #resolution;
    #dateFormat;
    #rangeFrom;
    #rangeTo;
    #countFlag

    constructor() {
        this.token = token.getAuthToken()
    }

    setSymbol(value) {
        this.#symbol = value;
        return this;

    }

    setResolution(value) {
        this.#resolution = value;
        return this;
    }

    setDateFormat(value) {
        this.#dateFormat = value;
        return this;
    }

    setRangeFrom(value) {
        this.#rangeFrom = value;
        return this;
    }

    setRangeTo(value) {
        this.#rangeTo = value;
        return this;
    }

    setCountFlag(value) {
        this.#countFlag = value;
        return this;
    }

    async getHistory() {
        let uri = dataApi + this.#urlSubPath
        let url = apiService.generateUrl(uri, this.getUserValueObject());
        let result = await new apiService(url, this.token).get();
        return result

    }

    getUserValueObject() {
        let userObject = {}

        userObject.symbol = this.#symbol;
        userObject.resolution = this.#resolution;
        userObject.date_format = this.#dateFormat;
        userObject.range_from = this.#rangeFrom;
        userObject.range_to = this.#rangeTo;
        userObject.count_flag = this.#countFlag;

        return userObject
    }

}

module.exports = History;
const apiService = require("../apiService/apiService");
const token = require("../token/tokenGeneration");
const helper = require('../helper/helper');
const dataApi = helper.dataAccessPoint();


class Quotes {
    #urlSubPath = 'quotes/'
    #symbol;

    constructor() {
        this.token = token.getAuthToken()
    }

    setSymbol(value) {
        this.#symbol = value;
        return this;

    }



    async getQuotes() {
        let uri = dataApi + this.#urlSubPath
        let url = apiService.generateUrl(uri, this.getUserValueObject());
        let result = await new apiService(url, this.token).get();
        return result

    }

    getUserValueObject() {
        let userObject = {}

        userObject.symbols = this.#symbol;

        return userObject
    }

}

module.exports = Quotes;
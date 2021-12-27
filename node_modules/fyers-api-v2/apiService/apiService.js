const axios = require('axios');
const errorHandler =  require("../errorHandler/errorHandler");

class ApiService {

    constructor(url, token) {
        this.url = url
        this.token = token
    }


    async get() {
        return this.callByMethod('get')
    }

    async post() {
        return this.callByMethod('post')
    }

    async put() {
        return this.callByMethod('put')
    }

    async delete() {
        return this.callByMethod('delete')
    }

    async callByMethod(method) {
        try {
            const result = await axios[method](this.url, {
                headers: {
                    Authorization: this.token
                }
            })
            return result.data;
        } catch (e) {
            return new errorHandler(e).getError()
        }
    }

   static generateUrl(url, queryObject) {

        let finalUrl = url + "?"
        for (let key in queryObject) {
            finalUrl = finalUrl + key + "=" + queryObject[key] + "&"
        }
        return finalUrl.substring(0, finalUrl.length - 1);
    }
}

module.exports = ApiService;
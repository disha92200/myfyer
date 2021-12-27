class TokenGeneration {
    #appId;
    #token;
    #redirectUrl;

    constructor() {
        if (TokenGeneration._instance) {
            return TokenGeneration._instance
        }
        TokenGeneration._instance = this;
    }
    setAppId(value){
        this.#appId = value
    }
    setToken(value){
        this.#token = value
    }
    getAuthToken(){
        if(this.#token && this.#appId){
            return  `${this.#appId}:${this.#token}`
        }else{
            console.log("Warning : set AppId and Token")
        }
    }
    setRedirectUrl(url){
        this.#redirectUrl = url
    }
    getRedirectUrl(){
        return this.#redirectUrl;
    }
    getAppId(){
        return this.#appId
    }
}

module.exports = new TokenGeneration();
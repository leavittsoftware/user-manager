﻿@behavior(LssRequesterBehavior)
@component("lss-api-service")
class LssApiService extends polymer.Base {
    requestInstance: (key: string) => any;

    @property({
        type: Object,
        notify: true
    })
    tokenProvider: ITokenProvider;

    @property({
        type: LssEnvironment,
        notify: true
    })
    lssEnvironment: LssEnvironment;

    @property({
        type: String,
        notify: true
    })
    baseUrl: string;

    @property()
    isLoading: boolean;

    @property({
        type: String,
        value: "https://api2.leavitt.com/",
        notify: true
    })
    baseProductionUri: string;

    @property({
        type: String,
        value: "https://devapi2.leavitt.com/",
        notify: true
    })
    baseDevUri: string;

    attached() {
        try {
            this.tokenProvider = this.requestInstance("TokenProvider");
        } catch (error) {
            console.log("Token Provider not found. Service will use default lss-token-provider.");
            this.tokenProvider = new LssTokenProvider();
        }

        this.lssEnvironment = this.$.lssEnvironment;
        this.baseUrl = this.lssEnvironment.isDev() ? this.baseDevUri : this.baseProductionUri;
    }

    private createUri(urlPath: string): string {
        return this.baseUrl + urlPath;
    }

    async postAsync<T>(urlPath: string, body: Object & IODataDto, appName: string = "General"): Promise<T | null> {

        var token = await this.tokenProvider.getTokenAsync();
        if (token === null) {
            throw new Error("Redirect failed. Not authenticated.");
        }

        //Add in the odata model info if it not already on the object
        if (body._odataInfo && !body["@odata.type"]) {
            if (body._odataInfo.type) {
                body["@odata.type"] = body._odataInfo.type;
            }
            delete body._odataInfo;
        }

        var response;
        try {
            response = await fetch(this.createUri(urlPath),
                {
                    method: "POST",
                    body: JSON.stringify(body),
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                        "X-LGAppName": appName
                    }
                });
        } catch (error) {
            if (error.message != null && error.message.indexOf("Failed to fetch") !== -1)
                return Promise.reject("Network error. Check your connection and try again.");

            return Promise.reject(error);
        }

        if (response.status === 204) {
            return Promise.resolve(null);
        }

        var json;
        try {
            json = await response.json();
        } catch (error) {
            return Promise.reject(`The server sent back invalid JSON. ${error}`);
        }

        if (json.error != null) {
            return Promise.reject(json.error.message);
        }

        if (response.status === 201) {
            return Promise.resolve(json);
        } else {
            return Promise.reject("Request error, please try again later.");
        }
    }

    async patchAsync(urlPath: string, body: Object & IODataDto, appName: string = "General"): Promise<void> {
        var token = await this.tokenProvider.getTokenAsync();
        if (token === null) {
            throw new Error("Redirect failed. Not authenticated.");
        }

        //Add in the odata model info if it not already on the object
        if (body._odataInfo && !body["@odata.type"]) {
            if (body._odataInfo.type) {
                body["@odata.type"] = body._odataInfo.type;
            }
            delete body._odataInfo;
        }

        var response;
        try {
            response = await fetch(this.createUri(urlPath),
                {
                    method: "PATCH",
                    body: JSON.stringify(body),
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                        "X-LGAppName": appName
                    }
                });
        } catch (error) {
            if (error.message != null && error.message.indexOf("Failed to fetch") !== -1)
                return Promise.reject("Network error. Check your connection and try again.");

            return Promise.reject(error);
        }

        if (response.status === 204) {
            return Promise.resolve();
        }

        var json;
        try {
            json = await response.json();

            if (json.error != null) {
                return Promise.reject(json.error.message);
            }

            if (response.status === 201) {
                return Promise.resolve(json);
            } else {
                return Promise.reject("Request error, please try again later.");
            }
        } catch (error) {
            return Promise.reject(`The server sent back invalid JSON. ${error}`);
        }

    }

    async deleteAsync(urlPath: string, appName: string = "General"): Promise<void> {

        var token = await this.tokenProvider.getTokenAsync();
        if (token === null) {
            throw new Error("Redirect failed. Not authenticated.");
        }

        var response;
        try {
            response = await fetch(this.createUri(urlPath),
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                        "X-LGAppName": appName
                    }
                });
        } catch (error) {
            if (error.message != null && error.message.indexOf("Failed to fetch") !== -1)
                return Promise.reject("Network error. Check your connection and try again.");

            return Promise.reject(error);
        }

        if (response.status === 204) {
            return Promise.resolve();
        }

        if (response.status === 404) {
            return Promise.reject("Not Found");
        }

        var json;
        try {
            json = await response.json();
        } catch (error) {
            return Promise.reject(`The server sent back invalid JSON. ${error}`);
        }

        if (json.error != null) {
            return Promise.reject(json.error.message);
        }

        if (response.status === 201) {
            return Promise.resolve(json);
        } else {
            return Promise.reject("Request error, please try again later.");
        }
    }

    async getAsync<T extends IODataDto>(urlPath: string, appName: string = "General"): Promise<GetResult<T>> {

        var token = await this.tokenProvider.getTokenAsync();
        if (token === null) {
            throw new Error("Redirect failed. Not authenticated.");
        }

        var response;
        try {
            response = await fetch(this.createUri(urlPath),
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${token}`,
                        "X-LGAppName": appName
                    }

                });

        } catch (error) {
            if (error.message != null && error.message.indexOf("Failed to fetch") !== -1)
                return Promise.reject("Network error. Check your connection and try again.");

            return Promise.reject(error);
        }

        var json;
        try {
            json = await response.json();
        } catch (error) {
            return Promise.reject(`The server sent back invalid JSON. ${error}`);
        }

        if (json.error) {
            return Promise.reject(json.error.message);
        }

        return Promise.resolve(new GetResult<T>(json));
    }
}
LssApiService.register();
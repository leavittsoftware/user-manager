"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let LssUserManager = class LssUserManager extends Polymer.Element {
    constructor() {
        super();
        this.personId = 0;
        this.redirectUrl = 'https://signin.leavitt.com/';
        this.redirectDevUrl = 'https://devsignin.leavitt.com/';
        this.tokenUri = 'https://oauth2.leavitt.com/token';
        this.disableAutoload = false;
        this.handleRequestTokenRequest = this.handleRequestTokenRequest.bind(this);
    }
    connectedCallback() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            _super("connectedCallback").call(this);
            if (!this.disableAutoload) {
                yield this.authenticateAsync();
            }
            window.addEventListener('um-request-token', this.handleRequestTokenRequest);
        });
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('um-request-token', this.handleRequestTokenRequest);
    }
    handleRequestTokenRequest() {
        if (this.isAuthenticating) {
            return;
        }
        try {
            this.authenticateAsync();
        }
        catch (error) {
        }
    }
    _redirectToLogin(continueUrl) {
        let redirectUrl = `${this.isDevelopment() ? this.redirectDevUrl : this.redirectUrl}?continue=${encodeURIComponent(continueUrl)}`;
        document.location.href = redirectUrl;
    }
    _redirectToSignOut(continueUrl) {
        let redirectUrl = `${this.isDevelopment() ? this.redirectDevUrl : this.redirectUrl}sign-out/?continue=${encodeURIComponent(continueUrl)}`;
        document.location.href = redirectUrl;
    }
    _getHashParametersFromUrl() {
        const hashParams = [];
        if (window.location.hash) {
            let hash = window.location.hash.substring(1);
            hash = decodeURIComponent(hash);
            const hashArray = hash.split('&');
            for (let i in hashArray) {
                if (hashArray.hasOwnProperty(i)) {
                    const keyValPair = hashArray[i].split('=');
                    if (keyValPair.length > 1) {
                        hashParams.push({ key: keyValPair[0], value: decodeURIComponent(keyValPair[1]) });
                    }
                }
            }
        }
        return hashParams;
    }
    _getClaimScopes(localStorageKey) {
        try {
            return JSON.parse(window.localStorage.getItem(localStorageKey) || '[]');
        }
        catch (error) {
            console.log(`Failed to parse scopes in local storage. ${error}`);
            return [];
        }
    }
    _clearHashFromUrl() {
        if (document.location.hash && document.location.hash.indexOf('refreshToken') > -1)
            document.location.hash = '';
    }
    _getTokenfromUrl(tokenName) {
        const hashParameters = this._getHashParametersFromUrl();
        const accessTokenArray = hashParameters.filter(value => value.key === tokenName);
        if (accessTokenArray.length === 0) {
            return null;
        }
        else {
            return accessTokenArray[0].value;
        }
    }
    _decodeAccessToken(accessToken) {
        if (!accessToken) {
            return null;
        }
        let token;
        try {
            token = jwt_decode(accessToken);
        }
        catch (error) {
            // Invalid JWT token format
            return null;
        }
        if (token) {
            token.exp = new Date(0).setUTCSeconds(token.exp);
        }
        return token;
    }
    _validateToken(accessToken) {
        let currentDate = new Date();
        currentDate.setSeconds(currentDate.getSeconds() + 30);
        if (accessToken.iss !== 'https://oauth2.leavitt.com/') {
            return false;
        }
        if (accessToken.exp <= currentDate) {
            return false;
        }
        return true;
    }
    _getAccessTokenFromLocalStorage() {
        return window.localStorage.getItem('LG-AUTH-AT') || '';
    }
    _saveAccessTokenToLocalStorage(accessToken) {
        window.localStorage.setItem('LG-AUTH-AT', accessToken);
    }
    _getRefreshTokenFromLocalStorage() {
        return window.localStorage.getItem('LG-AUTH-RT') || '';
    }
    _saveRefreshTokenToLocalStorage(accessToken) {
        window.localStorage.setItem('LG-AUTH-RT', accessToken);
    }
    _getAccessTokenFromApiAsync(refreshToken, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!window.navigator.onLine) {
                return Promise.reject('Computer not connected. Make sure your computer is connected to the internet.');
            }
            const claimScopes = this._getClaimScopes('LgClaimScopes');
            const body = { grant_type: 'refresh_token', refresh_token: refreshToken };
            if (claimScopes.length > 0) {
                body.claim_scopes = claimScopes;
            }
            let response = yield fetch(uri, { method: 'POST', body: JSON.stringify(body), headers: [['Content-Type', 'application/json'], ['Accept', 'application/json']] });
            let json;
            try {
                json = yield response.json();
            }
            catch (error) {
                return Promise.reject('Get Auth Token: The server sent back invalid JSON.');
            }
            if (response.status === 200 && json.access_token) {
                return Promise.resolve(json.access_token);
            }
            if (json.error) {
                if (json.error === 'unauthorized_client') {
                    return Promise.reject('Not authenticated');
                }
                return Promise.reject(json.error);
            }
            return Promise.reject('Not authenticated');
        });
    }
    _setLocalProperties(jwtToken) {
        this.personId = Number(jwtToken.nameid);
        this.fullname = jwtToken.unique_name;
        this.firstName = jwtToken.given_name;
        this.lastName = jwtToken.family_name;
        this.roles = jwtToken.role;
    }
    _getTokenAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let accessToken = this._getTokenfromUrl('accessToken') || this._getAccessTokenFromLocalStorage();
            let refreshToken = this._getTokenfromUrl('refreshToken') || this._getRefreshTokenFromLocalStorage();
            this._clearHashFromUrl();
            // validate uri access token
            const jwtToken = this._decodeAccessToken(accessToken);
            if (jwtToken && this._validateToken(jwtToken)) {
                this._saveAccessTokenToLocalStorage(accessToken);
                this._saveRefreshTokenToLocalStorage(refreshToken);
                this._setLocalProperties(jwtToken);
                return Promise.resolve(jwtToken);
            }
            if (refreshToken != null) {
                accessToken = yield this._getAccessTokenFromApiAsync(refreshToken, this.tokenUri);
                const jwtToken = this._decodeAccessToken(accessToken);
                if (jwtToken && this._validateToken(jwtToken)) {
                    this._saveAccessTokenToLocalStorage(accessToken);
                    this._saveRefreshTokenToLocalStorage(refreshToken);
                    this._setLocalProperties(jwtToken);
                    return Promise.resolve(jwtToken);
                }
            }
            return Promise.reject('Not authenticated');
        });
    }
    authenticateAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let jwtToken;
                try {
                    this.isAuthenticating = true;
                    jwtToken = yield this._getTokenAsync();
                }
                catch (error) {
                    if (error === 'Not authenticated') {
                        this._redirectToLogin(document.location.href);
                        this.isAuthenticating = false;
                        return; // Wait for the redirect to happen with a unreturned promise
                    }
                    window.dispatchEvent(new CustomEvent('um-auth-complete', { detail: { rejected: true, message: error } }));
                    this.isAuthenticating = false;
                    reject(error);
                }
                window.dispatchEvent(new CustomEvent('um-auth-complete', { detail: { jwtToken: jwtToken, accessToken: this._getAccessTokenFromLocalStorage() } }));
                this.isAuthenticating = false;
                resolve(jwtToken);
            }));
        });
    }
    logout() {
        localStorage.removeItem('LG-AUTH-AT');
        localStorage.removeItem('LG-AUTH-RT');
        this._redirectToSignOut(document.location.href);
        return;
    }
    isDevelopment() {
        if (document == null || document.location == null || document.location.host == null)
            return true;
        const host = document.location.host;
        if (host.indexOf('dev') !== -1)
            return true;
        if (host.indexOf('localhost') !== -1)
            return true;
        return false;
    }
};
__decorate([
    Polymer.decorators.property({ notify: true, type: Array })
], LssUserManager.prototype, "roles", void 0);
__decorate([
    Polymer.decorators.property({ notify: true, type: String })
], LssUserManager.prototype, "fullname", void 0);
__decorate([
    Polymer.decorators.property({ notify: true, type: String })
], LssUserManager.prototype, "firstName", void 0);
__decorate([
    Polymer.decorators.property({ notify: true, type: String })
], LssUserManager.prototype, "lastName", void 0);
__decorate([
    Polymer.decorators.property({ type: Number, notify: true })
], LssUserManager.prototype, "personId", void 0);
__decorate([
    Polymer.decorators.property({ type: String })
], LssUserManager.prototype, "redirectUrl", void 0);
__decorate([
    Polymer.decorators.property({ type: String })
], LssUserManager.prototype, "redirectDevUrl", void 0);
__decorate([
    Polymer.decorators.property({ type: String })
], LssUserManager.prototype, "tokenUri", void 0);
__decorate([
    Polymer.decorators.property({ type: Boolean })
], LssUserManager.prototype, "disableAutoload", void 0);
__decorate([
    Polymer.decorators.property({ type: Boolean })
], LssUserManager.prototype, "isAuthenticating", void 0);
LssUserManager = __decorate([
    Polymer.decorators.customElement('lss-user-manager')
], LssUserManager);
//# sourceMappingURL=lss-user-manager.js.map
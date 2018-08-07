/// <reference path="LssJwtToken.d.ts" />
declare var jwt_decode: any;
declare class LssUserManager extends Polymer.Element {
    roles: Array<string>;
    fullname: string;
    firstName: string;
    lastName: string;
    personId: number;
    redirectUrl: string;
    redirectDevUrl: string;
    tokenUri: string;
    disableAutoload: boolean;
    isAuthenticating: boolean;
    private _hasAuthenticated;
    ready(): Promise<void>;
    protected _handlePersonChange(): void;
    private _clone;
    private _redirectToLogin;
    private _redirectToSignOut;
    private _getHashParametersFromUrl;
    private _getClaimScopes;
    private _clearHashFromUrl;
    private _getTokenfromUrl;
    private _decodeAccessToken;
    private _validateToken;
    private _getAccessTokenFromLocalStorage;
    private _saveAccessTokenToLocalStorage;
    private _getRefreshTokenFromLocalStorage;
    private _saveRefreshTokenToLocalStorage;
    private _getAccessTokenFromApiAsync;
    private _setLocalProperties;
    private _getTokenAsync;
    authenticateAsync(): Promise<LssJwtToken>;
    logout(): void;
    isDevelopment(): boolean;
}

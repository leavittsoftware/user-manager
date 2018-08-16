import { ElementMixin } from '@polymer/polymer/lib/mixins/element-mixin';
declare type Constructable = new (...args: any[]) => ElementMixin;
export interface AuthenticatedTokenBehaviorConstructor {
    new (...args: any[]): AuthenticatedTokenBehavior;
}
export interface AuthenticatedTokenBehavior {
    _getAccessTokenAsync(): Promise<string>;
}
export declare const authenticatedTokenMixin: <T extends Constructable>(superClass: T) => T & AuthenticatedTokenBehaviorConstructor;
export {};

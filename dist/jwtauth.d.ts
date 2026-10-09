export declare const secret = "this-is-top-secret";
export declare const jwtAuthen: {
    (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction): Promise<void>;
    unless: typeof import("express-unless").unless;
};
export declare function generateToken(payload: any, secretKey: string): string;
export declare function verifyToken(token: string, secretKey: string): {
    valid: boolean;
    decoded?: any;
    error?: string;
};
//# sourceMappingURL=jwtauth.d.ts.map
// Augments Express's Request with the verified user id set by verifyJWT.
// Every controller uses req.userId to determine the acting user — never
// req.body.userId / req.query.userId (the IDOR class of bug the revamp fixes).
declare namespace Express {
  export interface Request {
    userId?: string;
  }
}

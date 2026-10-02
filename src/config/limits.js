// Team-size limits per plan live in config/plans.js (they follow the account's
// plan). This stays as the Free number for anything that only needs that. Purely
// a UI hint — the backend is the source of truth and enforces every limit.
import { PLANS } from './plans';

export const FREE_MEMBER_LIMIT = PLANS.free.members;

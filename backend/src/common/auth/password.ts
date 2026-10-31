import bcrypt from "bcrypt";

const BCRYPT_SALT_ROUNDS = 12;

export class PasswordUtil {
  /**
   * Hashes password using bcrypt with cost 12 (NFR-003).
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Compares plain password against stored bcrypt hash.
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

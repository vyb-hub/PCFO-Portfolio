import { db } from "@/lib/db/prisma";
import { decryptPAN, decryptDOB, decryptBankCustomerIds, decryptBankAccountNos } from "@/lib/crypto/encryption";
import { audit } from "@/lib/security/audit";
import { derivePasswordCandidates } from "@/lib/analyzer/pdfDecrypt";

export async function getUserPasswordCandidates(userId: string): Promise<string[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, encryptedDOB: true, encryptedPAN: true, encryptedBankCustomerIds: true, encryptedBankAccountNos: true },
  });
  if (!user) return [];

  let pan: string | null = null;
  if (user.encryptedPAN) {
    pan = decryptPAN(user.encryptedPAN);
    void audit({ userId, action: "PAN_ACCESSED", success: true });
    void db.user.update({ where: { id: userId }, data: { panAccessedAt: new Date() } });
  }

  const dateOfBirth = user.encryptedDOB ? decryptDOB(user.encryptedDOB) : null;
  const customerIds = user.encryptedBankCustomerIds ? decryptBankCustomerIds(user.encryptedBankCustomerIds) : null;
  const accountNumbers = user.encryptedBankAccountNos ? decryptBankAccountNos(user.encryptedBankAccountNos) : null;

  const candidates = derivePasswordCandidates({
    name: user.name,
    dateOfBirth,
    pan,
    customerIds,
    accountNumbers,
  });

  pan = null;
  return candidates;
}

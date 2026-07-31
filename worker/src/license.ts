export interface LicenseEnv {
  LICENSES: KVNamespace;
}

export async function verifyLicense(key: string, env: LicenseEnv): Promise<boolean> {
  if (!key) return false;
  const status = await env.LICENSES.get(key.trim());
  return status === "active";
}

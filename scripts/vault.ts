import vault from 'node-vault';
import fs from 'node:fs/promises';

const vc = vault({
  endpoint: process.env.VAULT_ENDPOINT,
  apiVersion: 'v1',
});

async function loadSecretsFromVault() {
  const envFilePath = '.env';

  try {
    console.info('🔐 Starting secret load from Vault...');

    const role_id = process.env.VAULT_ROLE_ID;
    const secret_id = process.env.VAULT_SECRET_ID;
    const secret_name = process.env.VAULT_SECRET_NAME;

    if (!role_id || !secret_id || !secret_name) {
      throw new Error(
        '❌ Missing VAULT_ROLE_ID, VAULT_SECRET_ID, or VAULT_SECRET_NAME in environment',
      );
    }

    // AppRole login
    console.info('🔐 Logging into Vault using AppRole...');
    const login = await vc.approleLogin({
      role_id,
      secret_id,
    });
    vc.token = login.auth.client_token;
    console.info('✅ Vault login successful');

    // Read secrets
    console.info(
      `📥 Fetching secrets from path: apps/data/xe-compass-vault/${secret_name} ...`,
    );
    const result = await vc.read(`apps/data/xe-compass-vault/${secret_name}`);
    const secrets = result.data.data;
    console.info(
      `✅ Retrieved ${Object.keys(secrets).length} secrets from Vault`,
    );

    // Read current .env content
    let currentEnvContent = '';
    try {
      currentEnvContent = await fs.readFile(envFilePath, 'utf8');
      console.info('📄 Existing .env file read successfully');
    } catch {
      console.warn('⚠️  .env file not found. A new one will be created.');
    }

    const vaultBlockHeader = `
# Start of vault secrets
#########################################################
#             Secrets fetched from Vault                #
#                 Script By: @yoswal                    #
#########################################################
`.trim();

    const vaultBlockFooter = `### End of vault secrets ###`;

    // Build the new vault block
    console.info('🧱 Constructing new secrets block...');
    let newVaultBlock = `${vaultBlockHeader}\n`;
    for (const key of Object.keys(secrets)) {
      newVaultBlock += `${key}=${secrets[key]}\n`;
    }
    newVaultBlock += vaultBlockFooter;

    // Regex to find existing block
    const vaultBlockRegex = new RegExp(
      `# Start of vault secrets[\\s\\S]*?### End of vault secrets ###`,
      'gm',
    );

    let updatedEnvContent: string;
    if (vaultBlockRegex.test(currentEnvContent)) {
      console.info(
        '🔁 Vault secrets block found in .env. Replacing it with new values...',
      );
      updatedEnvContent = currentEnvContent.replace(
        vaultBlockRegex,
        newVaultBlock,
      );
    } else {
      console.info(
        '➕ No existing Vault secrets block found. Appending new block to .env...',
      );
      updatedEnvContent =
        (currentEnvContent.trim() ? currentEnvContent.trim() + '\n\n' : '') +
        newVaultBlock;
    }

    // Write updated .env file
    await fs.writeFile(envFilePath, updatedEnvContent, 'utf8');
    console.info('✅ .env file updated successfully with Vault secrets');
  } catch (error) {
    console.error('❌ Failed to load secrets from Vault:', error);
    process.exit(1);
  }
}

loadSecretsFromVault().catch(err => {
  console.error('Failed to fetch secrets:', err);
  process.exit(1);
});

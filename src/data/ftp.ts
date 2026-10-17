// Credentials for the public FTP test server, shown on /ftp-test/ and built
// into the FileZilla profile that /downloads/?file=<key> serves.
//
// The server lives on a separate host (ftp.dlptest.com) outside of Cloudflare.
// The password is intentionally public so anyone can run tests. To rotate it,
// change it on the server, update FTP_PASSWORD here, and push through the
// normal staging -> main flow. The page and the profile both read this file,
// so they ship together, and the profile's link changes with its content.

export const FTP_HOST = "ftp.dlptest.com";
export const FTP_USER = "dlpuser";
export const FTP_PASSWORD = "xc8IycnK7MvzRBWRR7272j1lr";
export const FTP_RETENTION_MINUTES = 10;

// Both keys must also be listed in DOWNLOAD_KEYS (src/lib/downloads.ts). The
// _old key is a WordPress-era link and gets the same profile.
export const FILEZILLA_PROFILE_KEY = "DLP_Test_FTP_FileZilla.xml";
export const FILEZILLA_PROFILE_KEYS: ReadonlySet<string> = new Set([
  FILEZILLA_PROFILE_KEY,
  "DLP_Test_FTP_FileZilla_old.xml",
]);

// FileZilla 3 Site Manager export format (File > Import).
// - Protocol 6 is "Only use plain FTP (insecure)". Plain FTP leaves the file
//   contents visible to network DLP, which is what most tests here need. The
//   server does accept explicit FTPS (AUTH TLS) even though its FEAT reply
//   does not list it, so protocol 0 ("use explicit FTP over TLS if
//   available") would connect encrypted.
// - PasvMode is passive because the server does not support active mode.
// - The version stamp is deliberately old: FileZilla asks for confirmation
//   before importing a file written by a newer release than itself.
export const FILEZILLA_PROFILE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<FileZilla3 version="3.12.0.2" platform="windows">
	<Servers>
		<Server>
			<Host>${FTP_HOST}</Host>
			<Port>21</Port>
			<Protocol>6</Protocol>
			<Type>0</Type>
			<User>${FTP_USER}</User>
			<Pass encoding="base64">${btoa(FTP_PASSWORD)}</Pass>
			<Logontype>1</Logontype>
			<PasvMode>MODE_PASSIVE</PasvMode>
			<EncodingType>Auto</EncodingType>
			<BypassProxy>0</BypassProxy>
			<Name>DLP Test</Name>
			<SyncBrowsing>0</SyncBrowsing>
			<DirectoryComparison>0</DirectoryComparison>
		</Server>
	</Servers>
</FileZilla3>
`;

// FNV-1a of the profile, carried as &v= so the link changes whenever the
// profile does. Downloads used to be served with a one-year immutable
// cache-control, so a returning visitor's browser would otherwise hand back
// the copy with the old password. The downloads route never reads v.
function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export const FILEZILLA_PROFILE_HREF =
  `/downloads/?file=${FILEZILLA_PROFILE_KEY}&v=${fnv1a(FILEZILLA_PROFILE_XML)}`;

// Sample PII/PCI data ported verbatim from the legacy WordPress site's
// /sample-data/ tables. None of this is real data — every SSN/CCN is a
// fabricated test value historically used for DLP detection demos.
export interface SampleRow {
  name: string;
  ssn: string;
  ccn: string;
  dob?: string;
  email?: string;
  zip?: string;
  expiry?: string;
}

export const sampleData: SampleRow[] = [
  { name: "Robert Aragon", ssn: "489-36-8350", ccn: "4929-3813-3266-4295" },
  { name: "Ashley Borden", ssn: "514-14-8905", ccn: "5370-4638-8881-3020" },
  { name: "Thomas Conley", ssn: "690-05-5315", ccn: "4916-4811-5814-8111" },
  { name: "Susan Davis", ssn: "421-37-1396", ccn: "4916-4034-9269-8783" },
  { name: "Christopher Diaz", ssn: "458-02-6124", ccn: "5299-1561-5689-1938" },
  { name: "Rick Edwards", ssn: "612-20-6833", ccn: "5293-8502-0071-3058" },
  { name: "Victor Faulkner", ssn: "300-62-3266", ccn: "5548-0246-6336-5664" },
  { name: "Lisa Garrison", ssn: "660-03-8360", ccn: "4539-5385-7425-5825" },
  { name: "Marjorie Green", ssn: "213-46-8915", ccn: "4916-9766-5240-6147" },
  { name: "Mark Hall", ssn: "449-48-3135", ccn: "4556-0072-1294-7415" },
  { name: "James Heard", ssn: "559-81-1301", ccn: "4532-4220-6922-9909" },
  { name: "Albert Iorio", ssn: "322-84-2281", ccn: "4916-6734-7572-5015" },
  { name: "Charles Jackson", ssn: "646-44-9061", ccn: "5218-0144-2703-9266" },
  { name: "Teresa Kaminski", ssn: "465-73-5022", ccn: "5399-0706-4128-0178" },
  { name: "Tim Lowe", ssn: "044-34-6954", ccn: "5144-8691-2776-1108" },
  { name: "Monte Mceachern", ssn: "477-36-0282", ccn: "5527-1247-5046-7780" },
  { name: "Adriane Morrison", ssn: "421-90-3440", ccn: "4539-0031-3703-0728" },
  { name: "Jerome Munsch", ssn: "524-02-7657", ccn: "5180-3807-3679-8221" },
  { name: "Agnes Nelson", ssn: "205-52-0027", ccn: "5413-4428-0145-0036" },
  { name: "Lynette Oyola", ssn: "587-03-2682", ccn: "4532-9929-3036-9308" },
  { name: "Stacey Peacock", ssn: "687-05-8365", ccn: "5495-8602-4508-6804" },
  { name: "Julie Renfro", ssn: "751-01-2327", ccn: "5325-3256-9519-6624" },
  { name: "Danny Reyes", ssn: "624-84-9181", ccn: "4532-0065-1968-5602" },
  { name: "Jacki Russell", ssn: "514-30-2668", ccn: "345389698201044" },
  { name: "Thomas Santos", ssn: "451-80-3526", ccn: "4716-6984-4983-6160" },
  { name: "Mireille Townsend", ssn: "404-12-2154", ccn: "4539-8219-0484-7598" },
  { name: "Lillian Venson", ssn: "505-88-5714", ccn: "30204861594838" },
  { name: "Gail Watson", ssn: "461-97-5660", ccn: "4532-1753-6071-1112" },
  { name: "Johnson White", ssn: "172-32-1176", ccn: "5270-4267-6450-5516" },
  { name: "Rebecca Zwick", ssn: "151-32-2558", ccn: "5252-5971-4219-4116" },
];

export interface DownloadFile {
  /** Filename as it will be served at both /<key> and /downloads/<key> */
  key: string;
  label: string;
  group: "sample" | "office" | "csv" | "ftp" | "state";
  /** Rough size, for display only */
  approxBytes: number;
}

export const downloadFiles: DownloadFile[] = [
  { key: "sample-data.csv", label: "Sample SSN & CCN (CSV)", group: "sample", approxBytes: 4_600 },
  { key: "sample-data.xls", label: "Sample SSN & CCN (XLS)", group: "sample", approxBytes: 30_000 },
  { key: "sample-data.xlsx", label: "Sample SSN & CCN (XLSX)", group: "sample", approxBytes: 12_000 },
  { key: "sample-data.pdf", label: "Sample SSN & CCN (PDF)", group: "sample", approxBytes: 25_000 },
  { key: "1-MB-Test.docx", label: "1 MB Word", group: "office", approxBytes: 1_048_576 },
  { key: "10-MB-Test.docx", label: "10 MB Word", group: "office", approxBytes: 10_485_760 },
  { key: "1-MB-Test.xlsx", label: "1 MB Excel", group: "office", approxBytes: 1_048_576 },
  { key: "10-MB-Test.xlsx", label: "10 MB Excel", group: "office", approxBytes: 10_485_760 },
  { key: "30-MB-Test.xlsx", label: "30 MB Excel", group: "office", approxBytes: 31_457_280 },
  { key: "103-MB-Test.xlsx", label: "103 MB Excel", group: "office", approxBytes: 108_003_328 },
  { key: "111-MB-Test.csv", label: "111 MB CSV", group: "csv", approxBytes: 116_391_936 },
  { key: "334-MB-Test-CSV.csv", label: "334 MB CSV", group: "csv", approxBytes: 350_293_504 },
  { key: "AIP_Test_Doc.docx", label: "AIP (Azure Info Protection) test document", group: "office", approxBytes: 30_000 },
  { key: "DLP_Test_FTP_FileZilla.xml", label: "FileZilla FTP profile", group: "ftp", approxBytes: 2_000 },
  { key: "DLP-Test-State-Data.zip", label: "State PII/PCI/Bank/PHI bundle (via dev2prog/DLP)", group: "state", approxBytes: 50_000_000 },
];

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

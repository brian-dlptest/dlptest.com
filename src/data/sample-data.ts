// Sample PII/PCI data ported verbatim from the legacy WordPress site's
// /sample-data/ tables. None of this is real data — every SSN/CCN is a
// fabricated test value historically used for DLP detection demos.
export interface SampleRow {
  name: string;
  ssn: string;
  ccn: string;
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

// /sample-data/namessndob/ — Name + SSN + DOB
export interface NameSsnDobRow {
  name: string;
  ssn: string;
  dob: string;
}
export const sampleNameSsnDob: NameSsnDobRow[] = [
  { name: "Robert Aragon", ssn: "489-36-8350", dob: "6/7/1981" },
  { name: "Ashley Borden", ssn: "514-14-8905", dob: "7/8/1981" },
  { name: "Thomas Conley", ssn: "690-05-5315", dob: "8/9/1981" },
  { name: "Susan Davis", ssn: "421-37-1396", dob: "9/10/1981" },
  { name: "Christopher Diaz", ssn: "458-02-6124", dob: "1/10/1975" },
  { name: "Rick Edwards", ssn: "612-20-6833", dob: "2/11/1975" },
  { name: "Victor Faulkner", ssn: "300-62-3266", dob: "3/12/1975" },
  { name: "Lisa Garrison", ssn: "660-03-8360", dob: "4/13/1975" },
  { name: "Marjorie Green", ssn: "213-46-8915", dob: "5/14/1975" },
  { name: "Mark Hall", ssn: "449-48-3135", dob: "6/14/1975" },
  { name: "James Heard", ssn: "559-81-1301", dob: "7/16/1975" },
  { name: "Albert Iorio", ssn: "322-84-2281", dob: "8/17/1975" },
  { name: "Charles Jackson", ssn: "646-44-9061", dob: "9/18/1975" },
  { name: "Teresa Kaminski", ssn: "465-73-5022", dob: "10/19/1975" },
  { name: "Tim Lowe", ssn: "044-34-6954", dob: "1/20/1991" },
  { name: "Monte Mceachern", ssn: "477-36-0282", dob: "2/21/1991" },
  { name: "Adriane Morrison", ssn: "421-90-3440", dob: "3/22/1991" },
  { name: "Jerome Munsch", ssn: "524-02-7657", dob: "4/23/1991" },
  { name: "Agnes Nelson", ssn: "205-52-0027", dob: "5/24/1991" },
  { name: "Lynette Oyola", ssn: "587-03-2682", dob: "6/25/1991" },
  { name: "Stacey Peacock", ssn: "687-05-8365", dob: "2/18/1968" },
  { name: "Julie Renfro", ssn: "751-01-2327", dob: "3/19/1968" },
  { name: "Danny Reyes", ssn: "624-84-9181", dob: "4/20/1968" },
  { name: "Jacki Russell", ssn: "514-30-2668", dob: "5/21/1968" },
  { name: "Thomas Santos", ssn: "451-80-3526", dob: "6/22/1968" },
  { name: "Mireille Townsend", ssn: "404-12-2154", dob: "7/23/1968" },
  { name: "Lillian Venson", ssn: "505-88-5714", dob: "2/1/1968" },
  { name: "Gail Watson", ssn: "461-97-5660", dob: "2/2/1968" },
  { name: "Johnson White", ssn: "172-32-1176", dob: "2/3/1968" },
  { name: "Rebecca Zwick", ssn: "151-32-2558", dob: "2/4/1968" },
];

// /sample-data/nameccnzip/ — Name + CCN + ZIP + expiry
export interface NameCcnZipRow {
  first: string;
  last: string;
  zip: string;
  ccn: string;
  expiry: string;
}
export const sampleNameCcnZip: NameCcnZipRow[] = [
  { first: "James", last: "Smith", zip: "76148", ccn: "4929-3813-3266-4295", expiry: "1/15/2022" },
  { first: "Christopher", last: "Anderson", zip: "94523", ccn: "5370-4638-8881-3020", expiry: "1/16/2022" },
  { first: "Ronald", last: "Clark", zip: "80233", ccn: "4916-4811-5814-8111", expiry: "1/17/2022" },
  { first: "Mary", last: "Wright", zip: "80916", ccn: "4916-4034-9269-8783", expiry: "1/18/2022" },
  { first: "Lisa", last: "Mitchell", zip: "78247", ccn: "5299-1561-5689-1938", expiry: "1/19/2022" },
  { first: "Michelle", last: "Johnson", zip: "94954", ccn: "5293-8502-0071-3058", expiry: "1/20/2022" },
  { first: "John", last: "Thomas", zip: "02176", ccn: "5548-0246-6336-5664", expiry: "1/21/2022" },
  { first: "Daniel", last: "Rodriguez", zip: "63126", ccn: "4539-5385-7425-5825", expiry: "1/22/2022" },
  { first: "Anthony", last: "Lopez", zip: "97222", ccn: "4916-9766-5240-6147", expiry: "5/13/2023" },
  { first: "Patricia", last: "Perez", zip: "92104", ccn: "4556-0072-1294-7415", expiry: "5/14/2023" },
  { first: "Nancy", last: "Williams", zip: "40242", ccn: "4532-4220-6922-9909", expiry: "5/15/2022" },
  { first: "Laura", last: "Jackson", zip: "66204", ccn: "4916-6734-7572-5015", expiry: "5/16/2022" },
  { first: "Robert", last: "Lewis", zip: "48072", ccn: "5218-0144-2703-9266", expiry: "5/17/2022" },
  { first: "Paul", last: "Hill", zip: "95123", ccn: "5399-0706-4128-0178", expiry: "5/18/2022" },
  { first: "Kevin", last: "Roberts", zip: "37214", ccn: "5144-8691-2776-1108", expiry: "5/19/2022" },
  { first: "Linda", last: "Jones", zip: "78749", ccn: "5527-1247-5046-7780", expiry: "5/20/2022" },
  { first: "Karen", last: "White", zip: "94585", ccn: "4539-0031-3703-0728", expiry: "5/21/2022" },
  { first: "Sarah", last: "Lee", zip: "14625", ccn: "5180-3807-3679-8221", expiry: "5/22/2022" },
  { first: "Michael", last: "Scott", zip: "49508", ccn: "5413-4428-0145-0036", expiry: "11/2/2023" },
  { first: "Mark", last: "Turner", zip: "58103", ccn: "4532-9929-3036-9308", expiry: "11/3/2023" },
  { first: "Jason", last: "Brown", zip: "46804", ccn: "5495-8602-4508-6804", expiry: "11/4/2023" },
  { first: "Barbara", last: "Harris", zip: "95678", ccn: "5325-3256-9519-6624", expiry: "11/5/2025" },
  { first: "Betty", last: "Walker", zip: "43214", ccn: "4532-0065-1968-5602", expiry: "11/6/2025" },
  { first: "Kimberly", last: "Green", zip: "95376", ccn: "345389698201044", expiry: "11/7/2025" },
  { first: "William", last: "Phillips", zip: "98105", ccn: "4716-6984-4983-6160", expiry: "11/8/2025" },
  { first: "Donald", last: "Davis", zip: "92067", ccn: "4539-8219-0484-7598", expiry: "11/9/2025" },
  { first: "Jeff", last: "Martin", zip: "92662", ccn: "30204861594838", expiry: "11/10/2025" },
  { first: "Elizabeth", last: "Hall", zip: "93108", ccn: "4532-1753-6071-1112", expiry: "11/11/2025" },
  { first: "Helen", last: "Adams", zip: "94027", ccn: "5270-4267-6450-5516", expiry: "1/22/2025" },
  { first: "Deborah", last: "Campbell", zip: "90402", ccn: "5252-5971-4219-4116", expiry: "1/23/2025" },
  { first: "David", last: "Miller", zip: "92661", ccn: "378282246310005", expiry: "1/24/2025" },
  { first: "George", last: "Thompson", zip: "94024", ccn: "371449635398431", expiry: "1/25/2025" },
  { first: "Jennifer", last: "Allen", zip: "94957", ccn: "378734493671000", expiry: "1/26/2025" },
  { first: "Sandra", last: "Baker", zip: "94028", ccn: "5610591081018250", expiry: "1/27/2025" },
  { first: "Richard", last: "Parker", zip: "90210", ccn: "30569309025904", expiry: "1/28/2023" },
  { first: "Kenneth", last: "Wilson", zip: "92625", ccn: "38520000023237", expiry: "1/29/2023" },
  { first: "Maria", last: "Garcia", zip: "33109", ccn: "6011111111111110", expiry: "1/30/2023" },
  { first: "Donna", last: "Young", zip: "92657", ccn: "6011000990139420", expiry: "5/13/2023" },
  { first: "Charles", last: "Gonzalez", zip: "11962", ccn: "3530111333300000", expiry: "5/14/2023" },
  { first: "Steven", last: "Evans", zip: "95030", ccn: "3566002020360500", expiry: "5/15/2023" },
  { first: "Susan", last: "Moore", zip: "11568", ccn: "5555555555554440", expiry: "5/16/2023" },
  { first: "Carol", last: "Martinez", zip: "94022", ccn: "5105105105105100", expiry: "5/17/2024" },
  { first: "Joseph", last: "Hernandez", zip: "94507", ccn: "4111111111111110", expiry: "5/18/2024" },
  { first: "Edward", last: "Nelson", zip: "10013", ccn: "4012888888881880", expiry: "5/19/2024" },
  { first: "Margaret", last: "Edwards", zip: "11932", ccn: "4222222222222", expiry: "5/20/2024" },
  { first: "Ruth", last: "Taylor", zip: "90272", ccn: "76009244561", expiry: "5/21/2024" },
  { first: "Thomas", last: "Robinson", zip: "06878", ccn: "5019717010103740", expiry: "5/22/2024" },
  { first: "Brian", last: "King", zip: "94920", ccn: "6331101999990010", expiry: "5/23/2024" },
  { first: "Dorothy", last: "Carter", zip: "10577", ccn: "4000056655665550", expiry: "5/24/2024" },
  { first: "Sharon", last: "Collins", zip: "90266", ccn: "4012888888881880", expiry: "5/25/2024" },
];

// /sample-data/namedobemail/ — Name + DOB + Email
export interface NameDobEmailRow {
  first: string;
  last: string;
  dob: string;
  email: string;
}
export const sampleNameDobEmail: NameDobEmailRow[] = [
  { first: "James", last: "Smith", dob: "1/2/1981", email: "JamesSmith@gmail.com" },
  { first: "Christopher", last: "Anderson", dob: "2/3/1981", email: "ChristopherAnderson@gmail.com" },
  { first: "Ronald", last: "Clark", dob: "3/4/1981", email: "RonaldClark@gmail.com" },
  { first: "Mary", last: "Wright", dob: "4/5/1981", email: "MaryWright@gmail.com" },
  { first: "Lisa", last: "Mitchell", dob: "5/6/1981", email: "LisaMitchell@gmail.com" },
  { first: "Michelle", last: "Johnson", dob: "6/7/1981", email: "MichelleJohnson@gmail.com" },
  { first: "John", last: "Thomas", dob: "7/8/1981", email: "JohnThomas@gmail.com" },
  { first: "Daniel", last: "Rodriguez", dob: "8/9/1981", email: "DanielRodriguez@gmail.com" },
  { first: "Anthony", last: "Lopez", dob: "9/10/1981", email: "AnthonyLopez@gmail.com" },
  { first: "Patricia", last: "Perez", dob: "1/10/1975", email: "PatriciaPerez@gmail.com" },
  { first: "Nancy", last: "Williams", dob: "2/11/1975", email: "NancyWilliams@hotmail.com" },
  { first: "Laura", last: "Jackson", dob: "3/12/1975", email: "LauraJackson@hotmail.com" },
  { first: "Robert", last: "Lewis", dob: "4/13/1975", email: "RobertLewis@hotmail.com" },
  { first: "Paul", last: "Hill", dob: "5/14/1975", email: "PaulHill@hotmail.com" },
  { first: "Kevin", last: "Roberts", dob: "6/14/1975", email: "KevinRoberts@hotmail.com" },
  { first: "Linda", last: "Jones", dob: "7/16/1975", email: "LindaJones@hotmail.com" },
  { first: "Karen", last: "White", dob: "8/17/1975", email: "KarenWhite@hotmail.com" },
  { first: "Sarah", last: "Lee", dob: "9/18/1975", email: "SarahLee@hotmail.com" },
  { first: "Michael", last: "Scott", dob: "10/19/1975", email: "MichaelScott@hotmail.com" },
  { first: "Mark", last: "Turner", dob: "1/20/1991", email: "MarkTurner@hotmail.com" },
  { first: "Jason", last: "Brown", dob: "2/21/1991", email: "JasonBrown@aol.com" },
  { first: "Barbara", last: "Harris", dob: "3/22/1991", email: "BarbaraHarris@aol.com" },
  { first: "Betty", last: "Walker", dob: "4/23/1991", email: "BettyWalker@aol.com" },
  { first: "Kimberly", last: "Green", dob: "5/24/1991", email: "KimberlyGreen@aol.com" },
  { first: "William", last: "Phillips", dob: "6/25/1991", email: "WilliamPhillips@aol.com" },
  { first: "Donald", last: "Davis", dob: "7/26/1991", email: "DonaldDavis@aol.com" },
  { first: "Jeff", last: "Martin", dob: "8/27/1991", email: "JeffMartin@aol.com" },
  { first: "Elizabeth", last: "Hall", dob: "9/28/1991", email: "ElizabethHall@aol.com" },
  { first: "Helen", last: "Adams", dob: "10/29/1991", email: "HelenAdams@aol.com" },
  { first: "Deborah", last: "Campbell", dob: "11/30/1991", email: "DeborahCampbell@aol.com" },
  { first: "David", last: "Miller", dob: "12/31/1991", email: "DavidMiller@yahoo.com" },
  { first: "George", last: "Thompson", dob: "1/17/1968", email: "GeorgeThompson@yahoo.com" },
  { first: "Jennifer", last: "Allen", dob: "2/18/1968", email: "JenniferAllen@yahoo.com" },
  { first: "Sandra", last: "Baker", dob: "3/19/1968", email: "SandraBaker@yahoo.com" },
  { first: "Richard", last: "Parker", dob: "4/20/1968", email: "RichardParker@yahoo.com" },
  { first: "Kenneth", last: "Wilson", dob: "5/21/1968", email: "KennethWilson@yahoo.com" },
  { first: "Maria", last: "Garcia", dob: "6/22/1968", email: "MariaGarcia@yahoo.com" },
  { first: "Donna", last: "Young", dob: "7/23/1968", email: "DonnaYoung@yahoo.com" },
  { first: "Charles", last: "Gonzalez", dob: "8/24/1968", email: "CharlesGonzalez@yahoo.com" },
  { first: "Steven", last: "Evans", dob: "9/25/1968", email: "StevenEvans@yahoo.com" },
  { first: "Susan", last: "Moore", dob: "10/26/1968", email: "SusanMoore@yahoo.com" },
  { first: "Carol", last: "Martinez", dob: "11/27/1968", email: "CarolMartinez@facebook.com" },
  { first: "Joseph", last: "Hernandez", dob: "12/28/1968", email: "JosephHernandez@facebook.com" },
  { first: "Edward", last: "Nelson", dob: "1/29/1968", email: "EdwardNelson@facebook.com" },
  { first: "Margaret", last: "Edwards", dob: "1/30/1968", email: "MargaretEdwards@facebook.com" },
  { first: "Ruth", last: "Taylor", dob: "1/31/1968", email: "RuthTaylor@facebook.com" },
  { first: "Thomas", last: "Robinson", dob: "2/1/1968", email: "ThomasRobinson@facebook.com" },
  { first: "Brian", last: "King", dob: "2/2/1968", email: "BrianKing@facebook.com" },
  { first: "Dorothy", last: "Carter", dob: "2/3/1968", email: "DorothyCarter@facebook.com" },
  { first: "Sharon", last: "Collins", dob: "2/4/1968", email: "SharonCollins@facebook.com" },
];

export interface DownloadFile {
  /** Filename as it will be served at both /<key> and /downloads/<key> */
  key: string;
  label: string;
  group: "sample" | "office" | "csv" | "ftp" | "state" | "ssndob" | "ccnzip" | "dobemail";
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
  { key: "sample-ssndob.csv",  label: "Sample SSN & DOB (CSV)",  group: "ssndob",   approxBytes: 4_750 },
  { key: "sample-ssndob.xls",  label: "Sample SSN & DOB (XLS)",  group: "ssndob",   approxBytes: 34_304 },
  { key: "sample-ssndob.xlsx", label: "Sample SSN & DOB (XLSX)", group: "ssndob",   approxBytes: 14_184 },
  { key: "sample-ssndob.pdf",  label: "Sample SSN & DOB (PDF)",  group: "ssndob",   approxBytes: 54_902 },
  { key: "sample-ccnzip.csv",  label: "Sample CCN & ZIP (CSV)",  group: "ccnzip",   approxBytes: 4_750 },
  { key: "sample-ccnzip.xls",  label: "Sample CCN & ZIP (XLS)",  group: "ccnzip",   approxBytes: 34_304 },
  { key: "sample-ccnzip.xlsx", label: "Sample CCN & ZIP (XLSX)", group: "ccnzip",   approxBytes: 14_184 },
  { key: "sample-ccnzip.pdf",  label: "Sample CCN & ZIP (PDF)",  group: "ccnzip",   approxBytes: 54_902 },
  { key: "sample-dobemail.csv",  label: "Sample DOB & Email (CSV)",  group: "dobemail", approxBytes: 4_750 },
  { key: "sample-dobemail.xls",  label: "Sample DOB & Email (XLS)",  group: "dobemail", approxBytes: 34_304 },
  { key: "sample-dobemail.xlsx", label: "Sample DOB & Email (XLSX)", group: "dobemail", approxBytes: 14_184 },
  { key: "sample-dobemail.pdf",  label: "Sample DOB & Email (PDF)",  group: "dobemail", approxBytes: 54_902 },
];

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

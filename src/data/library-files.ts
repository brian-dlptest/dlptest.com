export interface LibraryFile {
  filename: string;
  displayName: string;
  url: string;
}

export interface LibraryCategory {
  id: string;
  label: string;
  description: string;
  basePath: string;
  files: LibraryFile[];
}

export const libraryCategories: LibraryCategory[] = [
  {
    id: "drivers-licenses",
    label: "Driver's Licenses",
    description: "Sample driver's license images for OCR and identity DLP testing",
    basePath: "/library/drivers-licenses",
    files: [
      { filename: "California.jpg", displayName: "California", url: "/library/drivers-licenses/California.jpg" },
      { filename: "Delaware.jpeg", displayName: "Delaware", url: "/library/drivers-licenses/Delaware.jpeg" },
      { filename: "Indiana.png", displayName: "Indiana", url: "/library/drivers-licenses/Indiana.png" },
      { filename: "Missouri.jpg", displayName: "Missouri", url: "/library/drivers-licenses/Missouri.jpg" },
      { filename: "Pennsylvania.jpeg", displayName: "Pennsylvania", url: "/library/drivers-licenses/Pennsylvania.jpeg" },
      { filename: "Texas.jpeg", displayName: "Texas", url: "/library/drivers-licenses/Texas.jpeg" },
    ],
  },
  {
    id: "medical-images",
    label: "Medical Images",
    description: "Sample X-ray and medical images for HIPAA and PHI DLP testing",
    basePath: "/library/medical-images",
    files: [
      { filename: "Chest_X-ray_2346.jpg", displayName: "Chest X-ray (2346)", url: "/library/medical-images/Chest_X-ray_2346.jpg" },
      { filename: "Medical_X-Ray_imaging_OPC06_nevit.jpg", displayName: "Medical X-Ray (OPC06)", url: "/library/medical-images/Medical_X-Ray_imaging_OPC06_nevit.jpg" },
      { filename: "Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg", displayName: "PA Chest Radiograph", url: "/library/medical-images/Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg" },
    ],
  },
  {
    id: "passport-images",
    label: "Passport Images",
    description: "Sample passport biographical page images for identity DLP testing",
    basePath: "/library/passport-images",
    files: [
      { filename: "Australian_R_series_biodata_page_2022.jpg", displayName: "Australian Passport (2022)", url: "/library/passport-images/Australian_R_series_biodata_page_2022.jpg" },
      { filename: "British_passport_biographical_data.jpg", displayName: "British Passport", url: "/library/passport-images/British_passport_biographical_data.jpg" },
      { filename: "Mustermann_Reisepass_2017.jpg", displayName: "German Passport (2017)", url: "/library/passport-images/Mustermann_Reisepass_2017.jpg" },
      { filename: "Passport_of_Austria_(2024)_data_page.jpg", displayName: "Austrian Passport (2024)", url: "/library/passport-images/Passport_of_Austria_(2024)_data_page.jpg" },
      { filename: "U.S._passport_card.jpg", displayName: "U.S. Passport Card", url: "/library/passport-images/U.S._passport_card.jpg" },
    ],
  },
  {
    id: "large-files",
    label: "Large Files",
    description: "Large multi-megabyte files for throughput, upload-limit, and performance DLP testing",
    // Served from the R2 bucket via src/middleware.ts, not from /public.
    // Filenames must stay in sync with DOWNLOAD_KEYS in src/lib/downloads.ts.
    basePath: "/downloads",
    files: [
      { filename: "10-MB-Test.xlsx", displayName: "10 MB — Excel (.xlsx)", url: "/downloads/10-MB-Test.xlsx" },
      { filename: "10-MB-Test.docx", displayName: "10 MB — Word (.docx)", url: "/downloads/10-MB-Test.docx" },
      { filename: "30-MB-Test.xlsx", displayName: "30 MB — Excel (.xlsx)", url: "/downloads/30-MB-Test.xlsx" },
      { filename: "DLP-Test-State-Data.zip", displayName: "69 MB — State Data (.zip)", url: "/downloads/DLP-Test-State-Data.zip" },
      { filename: "103-MB-Test.xlsx", displayName: "103 MB — Excel (.xlsx)", url: "/downloads/103-MB-Test.xlsx" },
      { filename: "111-MB-Test.csv", displayName: "111 MB — CSV (.csv)", url: "/downloads/111-MB-Test.csv" },
      { filename: "334-MB-Test-CSV.csv", displayName: "334 MB — CSV (.csv)", url: "/downloads/334-MB-Test-CSV.csv" },
    ],
  },
];

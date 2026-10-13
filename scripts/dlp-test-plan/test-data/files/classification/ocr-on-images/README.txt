OCR on images

ssn_table_screenshot.png    clean screenshot, the common case
ssn_table_photo-quality.jpg heavily re-compressed JPEG - phone-photo quality
ssn_table_rotated.png       rotated 12 degrees; many OCR paths do not deskew
ssn_table_highres.png       3x resolution, to find the file-size / pixel ceiling
_source_rows.csv            the 18 SSNs rendered above - ground truth for the count

These images also serve the GenAI image-upload channel (screenshot, then the .jpg) and
the screen-capture channel (display the high-res image full screen and capture it).

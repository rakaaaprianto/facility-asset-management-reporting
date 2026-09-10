/**
 * Binary magic number / signature verification for uploaded attachments.
 * Prevents disguised executable, script, and polyglot payloads from being accepted.
 */

export interface MagicByteValidationResult {
  valid: boolean;
  detectedType?: string;
  reason?: string;
}

export function validateMagicBytes(buffer: Buffer, extension: string): MagicByteValidationResult {
  const ext = extension.toLowerCase().trim();

  // Basic sanity check: buffer must have content
  if (!buffer || buffer.length === 0) {
    return { valid: false, reason: "File kosong atau tidak valid." };
  }

  // Check for known executable / malicious binary signatures regardless of claimed extension
  if (buffer.length >= 2) {
    // Windows executable (MZ)
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return { valid: false, reason: "Eksekusi biner terdeteksi (Windows Executable / DLL ditolak demi keamanan)." };
    }
  }

  if (buffer.length >= 4) {
    // Linux ELF executable
    if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
      return { valid: false, reason: "Eksekusi biner terdeteksi (Linux ELF ditolak demi keamanan)." };
    }
  }

  // Check initial bytes for common script tags that could lead to execution or XSS
  const leadingSlice = buffer.subarray(0, Math.min(buffer.length, 1024));
  const leadingText = leadingSlice.toString("utf-8").trimStart().toLowerCase();
  if (
    leadingText.startsWith("<?php") ||
    leadingText.startsWith("<% ") ||
    leadingText.startsWith("<script") ||
    leadingText.startsWith("#!/")
  ) {
    return { valid: false, reason: "File script atau shell executable tidak diizinkan." };
  }

  switch (ext) {
    case ".pdf": {
      // PDF must start with '%PDF-' (0x25 0x50 0x44 0x46 0x2D)
      if (
        buffer.length >= 5 &&
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46 &&
        buffer[4] === 0x2d
      ) {
        return { valid: true, detectedType: "application/pdf" };
      }
      return { valid: false, reason: "Header file PDF tidak valid (signature '%PDF-' tidak ditemukan)." };
    }

    case ".png": {
      // PNG 8-byte signature: 89 50 4E 47 0D 0A 1A 0A
      if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      ) {
        return { valid: true, detectedType: "image/png" };
      }
      return { valid: false, reason: "Header file PNG tidak valid (signature PNG tidak sesuai)." };
    }

    case ".jpg":
    case ".jpeg": {
      // JPEG starts with FF D8 FF
      if (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      ) {
        return { valid: true, detectedType: "image/jpeg" };
      }
      return { valid: false, reason: "Header file JPEG tidak valid (signature SOI FF D8 FF tidak sesuai)." };
    }

    case ".docx":
    case ".xlsx":
    case ".zip": {
      // Modern Office XML files (DOCX, XLSX) and ZIP archives start with PK\x03\x04 (or PK\x05\x06 empty)
      if (
        buffer.length >= 4 &&
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        (buffer[2] === 0x03 || buffer[2] === 0x05) &&
        (buffer[3] === 0x04 || buffer[3] === 0x06)
      ) {
        return { valid: true, detectedType: "application/zip-container" };
      }
      return { valid: false, reason: `Header file ${ext} tidak valid (signature ZIP container PK.. tidak ditemukan).` };
    }

    case ".xls":
    case ".doc": {
      // Legacy Office files use Compound File Binary Format (CFBF): D0 CF 11 E0 A1 B1 1A E1
      if (
        buffer.length >= 8 &&
        buffer[0] === 0xd0 &&
        buffer[1] === 0xcf &&
        buffer[2] === 0x11 &&
        buffer[3] === 0xe0 &&
        buffer[4] === 0xa1 &&
        buffer[5] === 0xb1 &&
        buffer[6] === 0x1a &&
        buffer[7] === 0xe1
      ) {
        return { valid: true, detectedType: "application/msword-or-excel" };
      }
      // Or modern zip container named as .xls / .doc
      if (
        buffer.length >= 4 &&
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        buffer[2] === 0x03 &&
        buffer[3] === 0x04
      ) {
        return { valid: true, detectedType: "application/zip-container" };
      }
      return { valid: false, reason: `Header file binary legacy ${ext} tidak valid.` };
    }

    case ".csv": {
      // CSV is plain text. Must not contain null bytes (indicator of binary content)
      const sampleLength = Math.min(buffer.length, 4096);
      for (let i = 0; i < sampleLength; i++) {
        if (buffer[i] === 0x00) {
          return { valid: false, reason: "File CSV tidak valid (mengandung karakter binary/null bytes terlarang)." };
        }
      }
      return { valid: true, detectedType: "text/csv" };
    }

    default:
      return { valid: false, reason: `Ekstensi "${ext}" belum didukung untuk validasi keamanan.` };
  }
}

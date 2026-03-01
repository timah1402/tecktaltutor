#!/usr/bin/env python3
"""
Extract text from scanned PDF using OCR
"""
import sys
from pathlib import Path
from pdf2image import convert_from_path
import pytesseract
from PIL import Image

def extract_text_from_scanned_pdf(pdf_path, output_path=None, language='eng+fra'):
    """
    Extract text from scanned PDF using OCR.
    
    Args:
        pdf_path: Path to the PDF file
        output_path: Path to save extracted text (optional)
        language: Tesseract language code (default: eng+fra for English + French)
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        print(f"Error: PDF file not found: {pdf_path}")
        return None
    
    print(f"Converting PDF to images: {pdf_path.name}")
    try:
        # Convert PDF to images
        images = convert_from_path(str(pdf_path), dpi=300)
        print(f"Converted {len(images)} pages to images")
        
        # Extract text from each page
        all_text = []
        for i, image in enumerate(images, 1):
            print(f"Processing page {i}/{len(images)}...")
            text = pytesseract.image_to_string(image, lang=language)
            all_text.append(f"\n--- Page {i} ---\n{text}")
        
        # Combine all text
        full_text = "\n".join(all_text)
        
        # Save to file if output path provided
        if output_path:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(full_text)
            print(f"\n✓ Text saved to: {output_path}")
        else:
            # Save next to original PDF
            output_path = pdf_path.parent / f"{pdf_path.stem}_ocr.txt"
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(full_text)
            print(f"\n✓ Text saved to: {output_path}")
        
        print(f"✓ Extracted {len(full_text)} characters from {len(images)} pages")
        return full_text
        
    except Exception as e:
        print(f"Error during OCR: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf_ocr.py <pdf_path> [output_path]")
        print("Example: python extract_pdf_ocr.py document.pdf output.txt")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    extract_text_from_scanned_pdf(pdf_path, output_path)

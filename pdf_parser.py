import pdfplumber


def extract_text_from_pdf(file_path):
    """Extract text content from a PDF file."""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")

    if not text.strip():
        raise ValueError("No text content found in PDF. The file may be image-based or empty.")

    return text.strip()


def get_pdf_metadata(file_path):
    """Extract metadata from a PDF file."""
    try:
        with pdfplumber.open(file_path) as pdf:
            metadata = pdf.metadata or {}
            return {
                'title': metadata.get('Title', ''),
                'author': metadata.get('Author', ''),
                'pages': len(pdf.pages),
                'subject': metadata.get('Subject', ''),
            }
    except Exception:
        return {'title': '', 'author': '', 'pages': 0, 'subject': ''}

import pandas as pd
from converters import _text_to_docx, convert_csv_to_xlsx
from docx import Document


def test_text_to_docx(tmp_path):
    txt_file = tmp_path / "sample.txt"
    txt_file.write_text("Hello\nWorld\nThis is a test.", encoding='utf-8')

    out_docx = tmp_path / "out.docx"
    _text_to_docx(str(txt_file), str(out_docx))

    assert out_docx.exists(), "DOCX output file should exist"
    doc = Document(str(out_docx))
    # Ensure at least one paragraph contains one of the lines
    texts = "\n".join([p.text for p in doc.paragraphs])
    assert "Hello" in texts


def test_csv_to_xlsx(tmp_path):
    csv_file = tmp_path / "data.csv"
    csv_file.write_text("a,b\n1,2\n3,4", encoding='utf-8')

    out_xlsx = tmp_path / "out.xlsx"
    convert_csv_to_xlsx(str(csv_file), str(out_xlsx))

    assert out_xlsx.exists(), "XLSX output should exist"
    # Read back with pandas
    df = pd.read_excel(str(out_xlsx), engine='openpyxl')
    assert list(df.columns) == ['a', 'b']
    assert df.shape[0] == 2

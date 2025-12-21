import io
from app import app


def test_recommend_format_endpoint(tmp_path):
    client = app.test_client()
    data = {
        'file': (io.BytesIO(b'Hello world\nThis is a test'), 'test.txt')
    }
    resp = client.post('/api/recommend-format', data=data, content_type='multipart/form-data')
    assert resp.status_code == 200
    j = resp.get_json()
    assert j.get('success') is True
    assert j.get('source_format') == 'txt'


def test_convert_txt_to_docx(tmp_path):
    client = app.test_client()
    data = {
        'file': (io.BytesIO(b'Hello world\nThis is a test'), 'test.txt'),
        'toFormat': 'docx'
    }
    resp = client.post('/api/convert', data=data, content_type='multipart/form-data')
    assert resp.status_code == 200
    j = resp.get_json()
    assert j.get('success') is True
    assert j.get('filename', '').endswith('.docx')

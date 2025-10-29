import os
import sys
import importlib.util
from fastapi.testclient import TestClient
import urllib.parse

# Load the src/app.py module as a module named app_module
ROOT = os.path.dirname(os.path.dirname(__file__))
APP_PATH = os.path.join(ROOT, 'src', 'app.py')

spec = importlib.util.spec_from_file_location('app_module', APP_PATH)
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)
app = getattr(app_module, 'app')

client = TestClient(app)


def test_get_activities():
    resp = client.get('/activities')
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect some known activities from the in-memory data
    assert 'Chess Club' in data
    assert 'participants' in data['Chess Club']


def test_signup_and_unregister_flow():
    activity = 'Chess Club'
    email = 'pytest-user@example.com'

    # Ensure email not already present
    resp = client.get('/activities')
    assert resp.status_code == 200
    data = resp.json()
    participants = data[activity]['participants']
    if email in participants:
        # if left over from previous run, remove it first
        resp = client.delete(f"/activities/{urllib.parse.quote(activity)}/participants", params={'email': email})
        assert resp.status_code == 200

    # Sign up
    resp = client.post(f"/activities/{urllib.parse.quote(activity)}/signup", params={'email': email})
    assert resp.status_code == 200
    body = resp.json()
    assert 'Signed up' in body.get('message', '')

    # Confirm participant appears in GET /activities
    resp = client.get('/activities')
    assert resp.status_code == 200
    data = resp.json()
    assert email in data[activity]['participants']

    # Now unregister
    resp = client.delete(f"/activities/{urllib.parse.quote(activity)}/participants", params={'email': email})
    assert resp.status_code == 200
    body = resp.json()
    assert 'Unregistered' in body.get('message', '')

    # Confirm removal
    resp = client.get('/activities')
    assert resp.status_code == 200
    data = resp.json()
    assert email not in data[activity]['participants']
